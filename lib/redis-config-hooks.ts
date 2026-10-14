import type {RedisCandidate} from './redis-candidate.ts';
type ConfigHooksOptions={inspectService?:()=>unknown|Promise<unknown>;validateCandidate?:(candidate:RedisCandidate)=>unknown|Promise<unknown>;restoreVersion?:string|null};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {assertRedisCandidate} from './redis-candidate.ts';
import {inspectRedisService} from './redis-service-inspect.ts';
import {validateRedisSandboxCandidate} from './redis-sandbox-validation.ts';
const fail:(message:string)=>never=message=>{throw Object.assign(Error(message),{status:409});};
// Trusted helper dependencies only. HTTP inputs can never provide runners.
export function redisConfigHooks(changes:unknown,run:(binary:string,args:string[])=>unknown|Promise<unknown>,{inspectService=inspectRedisService,validateCandidate=validateRedisSandboxCandidate,restoreVersion=null}:ConfigHooksOptions={}){
 if(!object(changes)||typeof run!=='function'||typeof inspectService!=='function'||typeof validateCandidate!=='function'||restoreVersion!==null&&!/^[a-f0-9]{64}$/.test(restoreVersion))fail('Redis 설정 검수와 서비스 실행 기능이 필요합니다.');
 const captured=JSON.stringify(Object.entries(changes).sort(([a],[b])=>a.localeCompare(b)));
 async function inspect(){const scope=await inspectService();if(!object(scope)||scope.identityVerified!==true||scope.startupMainVerified!==true||scope.service!=='redis-server.service'||scope.main!=='/etc/redis/redis.conf')fail('Redis 실행 서비스의 기본 설정 경로를 확인한 후 적용하세요.');return scope;}
 async function restart(){await run('/usr/bin/systemctl',['--no-ask-password','restart','redis-server.service']);await inspect();}
 return {
  inspectService:inspect,
  validatePrepared:async (candidate:RedisCandidate)=>{
   await assertRedisCandidate(candidate);
   if(candidate.restoreVersion!==restoreVersion||JSON.stringify(Object.entries(candidate.changes).sort(([a],[b])=>a.localeCompare(b)))!==captured)fail('Redis 후보 설정이 검토한 변경 내용과 다릅니다. 다시 검토하세요.');
   const result=await validateCandidate(candidate);await assertRedisCandidate(candidate);
   if(!object(result)||result.valid!==true||result.scope!=='isolated-startup'||result.operatingServiceChanged!==false)fail('Redis 후보 설정 검수에 실패했습니다. 변경한 설정을 확인하세요.');
   return result;
  },
  activate:restart,recover:restart,
 };
}
