import type {SpawnOptions} from 'node:child_process';
export type ValidationChild={once:(event:'error'|'close',callback:()=>void)=>unknown;kill:(signal:NodeJS.Signals)=>unknown;pid?:number;exitCode?:number|null;signalCode?:string|null};
export type ValidationProcessPlan={binary:string;args:readonly string[]};
export type ValidationLaunch=(binary:string,args:readonly string[],options:SpawnOptions)=>ValidationChild;
export type ValidationProcessOptions={launch?:ValidationLaunch;probe?:(child:ValidationChild,runtime:string,options:{timeoutMs:number})=>unknown|Promise<unknown>;verifyPlan?:(plan:ValidationProcessPlan,runtime:string)=>unknown;verifyBinary?:(binary:string)=>unknown};
type ProcessRecord={closed:boolean;error:boolean;done:Promise<void>};
import {redisValidationBinary} from './redis-validation-binary.ts';
import {spawn} from 'node:child_process';
const records=new WeakMap<ValidationChild,ProcessRecord>();
const fail:()=>never=()=>{throw Object.assign(Error('Redis 검수 프로세스를 확인하세요. 정리되지 않은 검수 작업이 있는지 확인하세요.'),{status:500});};
// Internal process adapter. The caller must verify binary, registered candidate,
// runtime and external resource isolation BEFORE invoking start.
export function redisValidationProcessHooks({launch=spawn,probe,verifyPlan,verifyBinary=()=>{redisValidationBinary();return true;}}:ValidationProcessOptions={}){
 if(typeof launch!=='function'||typeof probe!=='function'||typeof verifyPlan!=='function'||typeof verifyBinary!=='function')fail();
 const checkedLaunch=launch,checkedProbe=probe,checkedPlan=verifyPlan,checkedBinary=verifyBinary;
 function start(plan:ValidationProcessPlan,runtime:string){
  if(checkedPlan(plan,runtime)!==true||plan.binary!=='/usr/bin/redis-server'||!Array.isArray(plan.args))fail();if(checkedBinary(plan.binary)!==true)fail();
  const previous=process.umask(0o077);let child:ValidationChild;try{child=checkedLaunch(plan.binary,plan.args,{cwd:runtime,shell:false,env:{NODE_ENV:process.env.NODE_ENV,PATH:'/usr/bin:/bin',LANG:'C',LC_ALL:'C'},stdio:['ignore','ignore','ignore']});}finally{process.umask(previous);}
  let complete!:()=>void;const record:ProcessRecord={closed:false,error:false,done:new Promise<void>(resolve=>complete=resolve)};records.set(child,record);child.once('error',()=>{record.error=true;});child.once('close',()=>{record.closed=true;complete();});return child;
 }
 async function waitReady(child:ValidationChild,runtime:string,{timeoutMs}:{timeoutMs:number}){const record=records.get(child);if(!record||record.closed||record.error)fail();await checkedProbe(child,runtime,{timeoutMs});if(record.closed||record.error)fail();}
 async function stop(child:ValidationChild){const record=records.get(child);if(!record)fail();if(record.closed)return;child.kill('SIGTERM');let timer:ReturnType<typeof setTimeout>|undefined;try{const ended=await Promise.race([record.done.then(()=>true),new Promise<boolean>(resolve=>timer=setTimeout(()=>resolve(false),2000))]);if(!ended){if(!record.closed)child.kill('SIGKILL');let force:ReturnType<typeof setTimeout>|undefined;try{const closed=await Promise.race([record.done.then(()=>true),new Promise<boolean>(resolve=>force=setTimeout(()=>resolve(false),2000))]);if(!closed)fail();}finally{clearTimeout(force);}}}finally{clearTimeout(timer);}}
 return {start,waitReady,stop};
}
