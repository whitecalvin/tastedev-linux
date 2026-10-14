import type {RedisCandidate} from './redis-candidate.ts';
import {hasErrorCode} from './error-code.ts';
type ValidationPlan=Awaited<ReturnType<typeof redisValidationPlan>>;
export type RedisValidationHooks<H extends object=object>={createRuntime?:()=>string|Promise<string>;verifyRuntime?:(runtime:string)=>unknown|Promise<unknown>;reviewResources?:(candidate:RedisCandidate,plan:ValidationPlan)=>unknown|Promise<unknown>;start?:(plan:ValidationPlan,runtime:string)=>H;waitReady?:(handle:H,runtime:string,options:{timeoutMs:number})=>unknown|Promise<unknown>;stop?:(handle:H)=>unknown|Promise<unknown>;cleanupRuntime?:(runtime:string)=>unknown|Promise<unknown>};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {isRedisSandboxUnavailable,redisSandboxUnavailable} from './redis-validation-error.ts';
import {assertRedisCandidate} from './redis-candidate.ts';
import {redisValidationPlan} from './redis-validation-plan.ts';
const fail:()=>never=()=>{throw Object.assign(Error('Redis 후보 설정 검수에 필요한 격리 환경과 실행 기능을 확인하세요.'),{status:400});};
// All hooks are internal trusted native dependencies. HTTP cannot provide them.
// No default runner: command planning alone cannot authorize a server launch.
export async function validateRedisCandidate<H extends object>(candidate:RedisCandidate,{createRuntime,verifyRuntime,reviewResources,start,waitReady,stop,cleanupRuntime}:RedisValidationHooks<H>={}){
 if(typeof createRuntime!=='function'||typeof verifyRuntime!=='function'||typeof reviewResources!=='function'||typeof start!=='function'||typeof waitReady!=='function'||typeof stop!=='function'||typeof cleanupRuntime!=='function')fail();
 await assertRedisCandidate(candidate);let runtime:string|undefined,processHandle:H|undefined;
 try{runtime=await createRuntime();await verifyRuntime(runtime);const plan=await redisValidationPlan(candidate,runtime);const review=await reviewResources(candidate,plan);
 if(!object(review)||review.resourceIsolationVerified!==true)fail();await verifyRuntime(runtime);await assertRedisCandidate(candidate);
 processHandle=start(plan,runtime);if(!processHandle||('then' in processHandle&&typeof processHandle.then==='function'))fail();
 let timer:ReturnType<typeof setTimeout>|undefined;try{await Promise.race([waitReady(processHandle,runtime,{timeoutMs:10000}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Redis 검수 서버가 제한 시간 안에 준비되지 않았습니다.')),10000);})]);}finally{clearTimeout(timer);}await verifyRuntime(runtime);await assertRedisCandidate(candidate);
 return {valid:true,scope:'isolated-startup',operatingServiceChanged:false,operationalResourcesVerified:false,persistencePolicyValidated:false};
 }catch(error){if(isRedisSandboxUnavailable(error))throw redisSandboxUnavailable();if(hasErrorCode(error,'VALIDATION_EXECUTABLE_UNTRUSTED'))throw Object.assign(Error('Redis 검수 실행 파일의 경로·소유권·권한을 확인하세요.'),{status:409,code:'VALIDATION_EXECUTABLE_UNTRUSTED'});throw Object.assign(Error('Redis 격리 환경의 기동 검수에 실패했습니다. 후보 설정과 검수 환경을 확인하세요.'),{status:object(error)&&error.status===409?409:400});}finally{try{if(processHandle)await stop(processHandle);if(runtime!==undefined)await cleanupRuntime(runtime);}catch{throw Object.assign(Error('Redis 검수 환경 정리에 실패했습니다. 남은 검수 프로세스와 임시 파일을 확인하세요.'),{status:500});}}
}
