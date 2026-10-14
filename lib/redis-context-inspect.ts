import type {RedisTopology} from './redis-topology.ts';
import {hasErrorCode} from './error-code.ts';
type ContextDependencies={readGraph?:()=>Promise<RedisTopology>;inspectService?:()=>unknown|Promise<unknown>;inspectBinary?:()=>unknown};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {redisTopology} from './redis-topology.ts';
import {inspectRedisIdentity} from './redis-service-inspect.ts';
import {redisValidationBinary} from './redis-validation-binary.ts';
export async function inspectRedisContext({readGraph=redisTopology,inspectService=inspectRedisIdentity,inspectBinary=redisValidationBinary}:ContextDependencies={}){
 const before=await readGraph();let service;
 try{const scope=await inspectService();if(!object(scope))throw Error();service={ready:true,...Object.fromEntries(['mode','main','pid','start','uid','service','identityVerified','startupMainVerified'].filter(key=>Object.hasOwn(scope,key)).map(key=>[key,scope[key]]))};}catch{service={ready:false,reason:'Redis 실행 서비스의 기본 설정 경로를 확인하세요.'};}
 const graph=await readGraph();if(graph.version!==before.version)throw Object.assign(Error('조회 중 Redis 설정이 변경되었습니다. 최신 설정을 다시 조회하세요.'),{status:409});
 let binary;try{inspectBinary();binary={ready:true};}catch(error){binary={ready:false,reason:hasErrorCode(error,'ENOENT')?'Redis 실행 파일이 없습니다. 패키지 설치 상태를 확인하세요.':'Redis 실행 파일의 소유권과 권한을 확인하세요.'};}
 return {graph,service,binary,operatingConfigurationChanged:false};
}
