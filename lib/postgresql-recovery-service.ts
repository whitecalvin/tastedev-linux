import type {PostgresqlConfigServiceOptions} from './postgresql-config-service.ts';
type RecoveryServiceOptions={ownerUid?:number;inspectRunning?:(target:unknown,options:PostgresqlConfigServiceOptions)=>unknown|Promise<unknown>;runCommand?:(binary:string,args:string[])=>Promise<{stdout:unknown}>};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {promisify} from 'node:util';
import {execFile} from './admin-native-exec.ts';
import {redisValidationBinary} from './redis-validation-binary.ts';
import {postgresqlConfigRoot} from './postgresql-config-graph.ts';
import {inspectPostgresqlConfigService} from './postgresql-config-service.ts';
const exec=promisify(execFile),fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 복구 대상 서비스 상태를 확인하세요.'),{status:409});};
export function postgresqlRecoveryUnitState(text:unknown,unit:string){
 if(typeof text!=='string'||text.length>4096)fail();const entries:Record<string,string>={};for(const line of text.trim().split('\n')){const match=/^(LoadState|ActiveState|SubState|MainPID|ControlPID)=(.*)$/.exec(line);if(!match||Object.hasOwn(entries,match[1]))fail();entries[match[1]]=match[2];}
 if(Object.keys(entries).length!==5||entries.LoadState!=='loaded'||!['active','inactive','failed'].includes(entries.ActiveState)||! /^[a-z-]{1,40}$/.test(entries.SubState)||!['MainPID','ControlPID'].every(key=>/^\d{1,10}$/.test(entries[key])&&Number.isSafeInteger(Number(entries[key]))))fail();
 const mainPid=Number(entries.MainPID),controlPid=Number(entries.ControlPID);if(controlPid!==0||entries.ActiveState==='active'&&mainPid===0||entries.ActiveState!=='active'&&mainPid!==0)fail();return {unit,activeState:entries.ActiveState,subState:entries.SubState,mainPid,controlPid};
}
// A failed SQL/process check on an active unit must never become an offline
// recovery permission. Only an explicitly loaded inactive/failed unit qualifies.
export async function inspectPostgresqlRecoveryService(target:unknown,{ownerUid,inspectRunning=inspectPostgresqlConfigService,runCommand=async(binary,args)=>{redisValidationBinary({binary});try{return await exec(binary,args,{encoding:'utf8',cwd:'/',timeout:10000,maxBuffer:4096,env:{NODE_ENV:process.env.NODE_ENV,PATH:'/usr/bin:/usr/sbin:/bin',HOME:'/',LANG:'C',LC_ALL:'C'}});}catch{fail();}}}:RecoveryServiceOptions={}){
 const root=postgresqlConfigRoot(target),[major,cluster]=root.split('/').slice(-2),unit='postgresql@'+major+'-'+cluster+'.service';if(typeof ownerUid!=='number'||!Number.isSafeInteger(ownerUid)||ownerUid<0)fail();
 const args=['--no-ask-password','show',unit,'--property=LoadState,ActiveState,SubState,MainPID,ControlPID','--no-pager'];
 const before=postgresqlRecoveryUnitState((await runCommand('/usr/bin/systemctl',args)).stdout,unit);let service;
 if(before.activeState==='active'){service=await inspectRunning(target,{ownerUid});if(!object(service)||service.identityVerified!==true||service.unit!==unit||service.pid!==before.mainPid)fail();}
 const after=postgresqlRecoveryUnitState((await runCommand('/usr/bin/systemctl',args)).stdout,unit);if(JSON.stringify(before)!==JSON.stringify(after))fail();return {...before,...(service?{service}:{})};
}
