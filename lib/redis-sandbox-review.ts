import type {RedisSandboxPlan} from './redis-sandbox-plan.ts';
import {redisSandboxUnavailable} from './redis-validation-error.ts';
import {execFileSync} from './admin-native-exec.ts';
import {assertRedisSandboxPlan} from './redis-sandbox-plan.ts';
import {redisSandboxExecutables} from './redis-sandbox-executables.ts';

// Internal namespace/mount availability probe, not Redis directive validation.
// Candidate/runtime identity checks still belong to the surrounding lifecycle.
export function redisSandboxReviewer({inspectExecutables=redisSandboxExecutables,execute=execFileSync}:{inspectExecutables?:typeof redisSandboxExecutables;execute?:typeof execFileSync}={}) {
 if(typeof inspectExecutables!=='function'||typeof execute!=='function')throw Error('Redis sandbox review requires trusted dependencies');
 return (plan:RedisSandboxPlan)=>{
  let before:string;
  try{assertRedisSandboxPlan(plan);before=JSON.stringify(inspectExecutables());}catch{return false;}
  const args=[...plan.args.slice(0,plan.args.lastIndexOf('--')+1),'/usr/bin/true'];
  let unavailable=false;
  try{execute(plan.binary,args,{timeout:3000,maxBuffer:1024,stdio:'ignore',shell:false,env:{NODE_ENV:process.env.NODE_ENV,PATH:'/usr/bin:/bin',LANG:'C',LC_ALL:'C'}});}catch{unavailable=true;}
  // Integrity failures retain the review denial; never label changed executables
  // as an ordinary environment problem or expose native stderr/paths.
  try{if(JSON.stringify(inspectExecutables())!==before)return false;}catch{return false;}
  if(unavailable)throw redisSandboxUnavailable();
  return true;
 };
}
