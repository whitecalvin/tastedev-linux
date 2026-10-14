import type {ValidationProcessOptions} from './redis-validation-process.ts';
import type {RedisSandboxPlan} from './redis-sandbox-plan.ts';
type Options={plan?:unknown;verifySandbox?:(plan:RedisSandboxPlan)=>unknown;verifyBinary?:ValidationProcessOptions['verifyBinary'];probe?:ValidationProcessOptions['probe'];launch?:ValidationProcessOptions['launch']};
import {spawn} from 'node:child_process';
import {assertRedisSandboxPlan} from './redis-sandbox-plan.ts';
import {redisValidationProcessHooks} from './redis-validation-process.ts';

// Internal adapter: a trusted reviewer must verify wrapper executables,
// mounts and namespace support before each launch. HTTP cannot supply hooks.
export function redisSandboxProcessHooks({plan:inputPlan,verifySandbox,verifyBinary,probe,launch=spawn}:Options={}) {
 const plan=assertRedisSandboxPlan(inputPlan);
 if(typeof verifySandbox!=='function'||typeof verifyBinary!=='function')throw Error('Redis sandbox execution requires review');
 const runtime=plan.args[plan.args.indexOf('--chdir')+1];
 return redisValidationProcessHooks({probe,verifyBinary,
  verifyPlan:(validation,location)=>validation===plan.validation&&location===runtime,
  launch:(binary,args,options)=>{
   if(binary!==plan.validation.binary||args!==plan.validation.args||verifySandbox(plan)!==true)throw Error('Redis sandbox execution requires review');
   return launch(plan.binary,plan.args,options);
  },
 });
}
