import type {RedisValidationHooks} from './redis-candidate-validation.ts';
import type {ValidationProcessOptions} from './redis-validation-process.ts';
type NativeOptions={reviewResources?:RedisValidationHooks['reviewResources'];inspectBinary?:()=>unknown;launch?:ValidationProcessOptions['launch'];probe?:ValidationProcessOptions['probe']};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {redisValidationBinary} from './redis-validation-binary.ts';
import {redisValidationRuntimeHooks,verifyRedisValidationRuntime} from './redis-validation-runtime.ts';
import {redisValidationProcessHooks} from './redis-validation-process.ts';
import {redisValidationProbe} from './redis-validation-probe.ts';
import {validateRedisCandidate} from './redis-candidate-validation.ts';
import {assertRedisCandidate} from './redis-candidate.ts';
const fail:()=>never=()=>{throw Object.assign(Error('Redis native validation needs independent resource review'),{status:400});};
// Trusted helper composition only. Resource review is mandatory and has no
// default; inventory/planning must never be mistaken for execution authorization.
export async function validateRedisNativeCandidate(value:unknown,{reviewResources,inspectBinary=redisValidationBinary,launch,probe=redisValidationProbe()}:NativeOptions={}){
 if(typeof reviewResources!=='function'||typeof inspectBinary!=='function')fail();
 const candidate=await assertRedisCandidate(value),binary=inspectBinary(),plans=new WeakMap<object,{runtime:string;args:string}>();
 if(!object(binary)||binary.path!=='/usr/bin/redis-server'||typeof binary.sha256!=='string'||!/^[a-f0-9]{64}$/.test(binary.sha256))fail();
 const binarySnapshot=JSON.stringify(binary);
 const processHooks=redisValidationProcessHooks({...(launch?{launch}:{}),probe,
  verifyBinary:()=>JSON.stringify(inspectBinary())===binarySnapshot,
  verifyPlan:(plan,runtime)=>{const registered=plans.get(plan);return Boolean(registered&&registered.runtime===runtime&&registered.args===JSON.stringify(plan.args)&&plan.args[0]===candidate.main);}
 });
 return validateRedisCandidate(candidate,{...redisValidationRuntimeHooks(),...processHooks,reviewResources:async(bundle,plan)=>{
  Object.freeze(plan.args);Object.freeze(plan);const review=await reviewResources(bundle,plan);if(!object(review)||review.resourceIsolationVerified!==true)fail();
  await assertRedisCandidate(bundle);const runtime=plan.args[plan.args.indexOf('--dir')+1];await verifyRedisValidationRuntime(runtime);
  plans.set(plan,{runtime,args:JSON.stringify(plan.args)});return review;
 }});
}
