import type {RedisCandidate} from './redis-candidate.ts';
import type {ValidationBinary} from './redis-validation-binary.ts';
import type {ValidationProcessOptions,ValidationChild} from './redis-validation-process.ts';
import type {RedisSandboxPlan} from './redis-sandbox-plan.ts';
import {hasErrorCode} from './error-code.ts';
type Options={verifySandbox?:(plan:RedisSandboxPlan)=>unknown;inspectBinary?:()=>ValidationBinary;inspectExecutables?:()=>readonly ValidationBinary[];launch?:ValidationProcessOptions['launch'];probe?:ValidationProcessOptions['probe']};
import {redisSandboxPlan} from './redis-sandbox-plan.ts';
import {redisSandboxProcessHooks} from './redis-sandbox-process.ts';
import {redisValidationBinary} from './redis-validation-binary.ts';
import {redisValidationProbe} from './redis-validation-probe.ts';
import {redisValidationRuntimeHooks} from './redis-validation-runtime.ts';
import {validateRedisCandidate} from './redis-candidate-validation.ts';
import {redisSandboxExecutables} from './redis-sandbox-executables.ts';
import {redisSandboxReviewer} from './redis-sandbox-review.ts';

// Only trusted helper dependencies can review sandbox executables and mounts.
// A successful isolated startup does not validate operating data/resources.
export async function validateRedisSandboxCandidate(candidate:RedisCandidate,{verifySandbox=redisSandboxReviewer(),inspectBinary=redisValidationBinary,inspectExecutables=redisSandboxExecutables,launch,probe=redisValidationProbe()}:Options={}) {
 if(typeof verifySandbox!=='function'||typeof inspectBinary!=='function'||typeof inspectExecutables!=='function')throw Error('Redis sandbox validation requires review');
 let binary:ValidationBinary;
 try{binary=inspectBinary();}catch(error){
  if(hasErrorCode(error,'ENOENT'))throw Object.assign(Error('Redis 실행 파일이 없습니다. 패키지 설치 상태를 확인하세요.'),{status:400,code:'REDIS_EXECUTABLE_UNAVAILABLE'});
  throw error;
 }
 const executables=inspectExecutables();
 if(binary?.path!=='/usr/bin/redis-server'||!/^[a-f0-9]{64}$/.test(binary.sha256??''))throw Error('Redis sandbox binary requires review');
 if(!Array.isArray(executables)||executables.length!==2||executables.some((item,index)=>item?.path!==['/usr/bin/bwrap','/usr/bin/prlimit'][index]||!/^[a-f0-9]{64}$/.test(item.sha256??'')))throw Error('Redis sandbox executables require review');
 const binarySnapshot=JSON.stringify(binary),executableSnapshot=JSON.stringify(executables);
 let hooks:ReturnType<typeof redisSandboxProcessHooks>|undefined,validation:RedisSandboxPlan['validation']|undefined,sandboxValidation:RedisSandboxPlan['validation']|undefined;
 const currentHooks=()=>{if(!hooks)throw Error('Redis sandbox validation plan changed');return hooks;};
 return validateRedisCandidate(candidate,{
  ...redisValidationRuntimeHooks(),
  reviewResources:async(bundle,plan)=>{
   const runtime=plan.args[plan.args.indexOf('--dir')+1];
   const sandbox=await redisSandboxPlan(bundle,runtime);
   if(JSON.stringify(sandbox.validation.args)!==JSON.stringify(plan.args)||verifySandbox(sandbox)!==true)throw Error('Redis sandbox review failed');
   Object.freeze(plan.args);Object.freeze(plan);validation=plan;
   sandboxValidation=sandbox.validation;
   hooks=redisSandboxProcessHooks({plan:sandbox,verifySandbox:plan=>JSON.stringify(inspectExecutables())===executableSnapshot&&verifySandbox(plan)===true,probe,
    verifyBinary:()=>JSON.stringify(inspectBinary())===binarySnapshot,
    ...(launch?{launch}:{}),
   });
   return {resourceIsolationVerified:true};
  },
  start:(plan,runtime)=>{
   if(plan!==validation||!sandboxValidation)throw Error('Redis sandbox validation plan changed');
   // The registered sandbox holds an equivalent immutable validation plan.
   return currentHooks().start(sandboxValidation,runtime);
  },
  waitReady:(child:ValidationChild,runtime:string,options:{timeoutMs:number})=>currentHooks().waitReady(child,runtime,options),
  stop:(child:ValidationChild)=>currentHooks().stop(child),
 });
}
