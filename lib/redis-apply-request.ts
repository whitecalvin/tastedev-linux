const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {patchConfig} from './config-patch.ts';
const fail:()=>never=()=>{throw Object.assign(Error('Redis 설정과 재시작 영향을 검토하세요.'),{status:400});};
// Public request shape uses separate main-file and graph hashes. Trusted helper
// must re-observe both before mapping graphVersion to orchestration version.
export function prepareRedisApply(input:unknown){
 if(!object(input)||input.confirm!==true||Object.keys(input).some(key=>!['path','version','graphVersion','changes','confirm'].includes(key))||input.path!=='/etc/redis/redis.conf'||typeof input.version!=='string'||!/^[a-f0-9]{64}$/.test(input.version)||typeof input.graphVersion!=='string'||!/^[a-f0-9]{64}$/.test(input.graphVersion))fail();
 if(!object(input.changes)||!Object.keys(input.changes).length)fail();
 patchConfig('redis','',input.changes);
 return {path:input.path,version:input.version,graphVersion:input.graphVersion,changes:{...input.changes},confirm:true};
}
