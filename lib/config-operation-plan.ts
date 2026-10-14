const object=(value: unknown): value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
type Topology = {complete: boolean;version: string;root: string;files: {path: string;version?: string}[]};
import {redisResourceReview} from './redis-resource-review.ts';
import path from 'node:path';
import {mariadbTopology} from './mariadb-topology.ts';
import {redisTopology} from './redis-topology.ts';
import {readLiveConfig,parseLiveConfig} from './config-live.ts';
import {patchConfig} from './config-patch.ts';
import {configFieldDiff} from './config-field-diff.ts';
export async function configOperationPlan(input: unknown,base='/etc'){
 if(!object(input)||typeof input.kind!=='string'||(input.kind==='mariadb'&&input.root!==undefined&&typeof input.root!=='string')||typeof input.version!=='string'||!/^[a-f0-9]{64}$/.test(input.version))throw Object.assign(new Error('운영 설정을 다시 조회하세요.'),{status:400});
 const root=typeof input.root==='string'?input.root:undefined;let topology: Topology|undefined;
 if(input.kind==='redis'){
  if(input.path!=='/etc/redis/redis.conf')throw Object.assign(new Error('허용된 Redis main 파일을 선택하세요.'),{status:400});
  topology=await redisTopology(undefined,path.join(base,'redis'));
  if(!topology.complete||(input.graphVersion!==undefined&&topology.version!==input.graphVersion))throw Object.assign(new Error('Redis include 연결을 다시 조회하세요.'),{status:409});
  if(input.path!==topology.root)throw Object.assign(new Error('허용된 Redis main 파일을 선택하세요.'),{status:400});
 }
 if(input.kind==='mariadb'){
  topology=await mariadbTopology(root,path.join(base,'mysql'));
  if(!topology.complete||topology.version!==input.graphVersion)throw Object.assign(new Error('MariaDB include 연결을 다시 조회하세요.'),{status:409});
  if(!topology.files.some(file=>file.path===input.path))throw Object.assign(new Error('선택한 main에 포함되지 않은 설정 파일입니다.'),{status:400});
 }
 const snapshot=await readLiveConfig(input.kind,input.path,base);
 if(snapshot.version!==input.version)throw Object.assign(new Error('운영 설정 파일이 변경되었습니다. 다시 조회한 뒤 비교하세요.'),{status:409});
 if(topology&&topology.files.find(file=>file.path===input.path)?.version!==snapshot.version)throw Object.assign(new Error('설정 연결의 파일 버전이 변경되었습니다.'),{status:409});
 const patched=patchConfig(input.kind,snapshot.text,input.changes);
 const before=parseLiveConfig(input.kind,snapshot.text),after=parseLiveConfig(input.kind,patched);
 const changes=object(input.changes)?input.changes:{};
 const fields=configFieldDiff(input.kind,before.values,after.values).filter(item=>Object.hasOwn(changes,item.key)&&(!item.known||item.changed));
 if(topology){const latest=input.kind==='redis'?await redisTopology(undefined,path.join(base,'redis')):await mariadbTopology(root,path.join(base,'mysql'));if(!latest.complete||latest.version!==topology.version)throw Object.assign(new Error('설정 include 연결이 변경되었습니다.'),{status:409});}
 return {...(input.kind==='redis'?{resourceReview:{...redisResourceReview(patched),scope:'selected-file-only',path:input.path}}:{}),...(topology?{root:topology.root,graphVersion:topology.version}:{}),kind:input.kind,path:input.path,version:snapshot.version,fields,warnings:[...before.warnings,...after.warnings],notice:'지정 파일의 변경 계획입니다. include 우선순위와 실행 중 설정은 별도로 확인해야 합니다. 아직 파일을 저장하거나 서비스를 변경하지 않았습니다.'};
}
