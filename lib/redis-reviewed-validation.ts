import type {RedisCandidate} from './redis-candidate.ts';
import {hasErrorCode} from './error-code.ts';
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {isRedisSandboxUnavailable,redisSandboxUnavailable} from './redis-validation-error.ts';
import {prepareRedisApply} from './redis-apply-request.ts';
import {assertRedisGraphVersion} from './redis-topology.ts';
import {redisCandidate} from './redis-candidate.ts';
import {validateRedisSandboxCandidate} from './redis-sandbox-validation.ts';

// Fixed request schema; roots and validation hooks are trusted dependencies.
// This inspection does not replace operating files or restart a service.
export async function validateReviewedRedis(input:unknown,{base='/etc/redis',validate=validateRedisSandboxCandidate}:{base?:string;validate?:(candidate:RedisCandidate)=>unknown|Promise<unknown>}={}){
 const prepared=prepareRedisApply(input);
 if(typeof validate!=='function')throw Object.assign(Error('Redis validator requires review'),{status:400});
 const graph=await assertRedisGraphVersion(prepared.graphVersion,base);
 if(graph.files.find(file=>file.path===prepared.path)?.version!==prepared.version)throw Object.assign(Error('Redis configuration changed'),{status:409});
 let candidate:RedisCandidate|undefined,preserveCandidate=false;
 try{
  candidate=await redisCandidate({version:prepared.graphVersion,changes:prepared.changes},base);
  const result=await validate(candidate);
  if(!object(result)||result.valid!==true)throw Error('Redis validation failed');
  await assertRedisGraphVersion(prepared.graphVersion,base);
  return {valid:true,scope:'isolated-startup',version:prepared.version,graphVersion:prepared.graphVersion,operatingConfigurationChanged:false,operatingServiceChanged:false,operationalResourcesVerified:false,persistencePolicyValidated:false};
 }catch(error){const status=object(error)&&typeof error.status==='number'?error.status:undefined;preserveCandidate=status===500;if(isRedisSandboxUnavailable(error))throw redisSandboxUnavailable();const unavailable=hasErrorCode(error,'REDIS_EXECUTABLE_UNAVAILABLE');throw Object.assign(Error(unavailable?'Redis 실행 파일이 없습니다. 패키지 설치 상태를 확인하세요.':preserveCandidate?'Redis validation cleanup requires review':'Redis isolated configuration validation failed'),{status:preserveCandidate?500:status===409?409:400});}
 finally{if(!preserveCandidate)await candidate?.cleanup();}
}
