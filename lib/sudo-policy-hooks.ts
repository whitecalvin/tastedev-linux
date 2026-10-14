import type {SudoAccount} from './sudo-policy.ts';
type PolicyRunner=(file:string,args:string[])=>unknown|Promise<unknown>;
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {lstat,realpath} from 'node:fs/promises';
import {execFile} from './admin-native-exec.ts';
import {promisify} from 'node:util';
import path from 'node:path';
import {sudoPolicyPlan} from './sudo-policy.ts';
const execute=promisify(execFile);
const fail:()=>never=()=>{throw Object.assign(Error('Sudo policy native validation requires review'),{status:403});};
async function trusted(file:string){
 for(const target of [file,await realpath(file)]){
  let current='/';const parts=target.split('/').filter(Boolean);
  for(let index=0;index<parts.length;index++){
   current=path.join(current,parts[index]);const stat=await lstat(current);
   if(stat.uid!==0||(stat.mode&0o022))fail();
   if(index===parts.length-1){if(!stat.isFile()||stat.nlink!==1||!(stat.mode&0o111))fail();}
   else if(!stat.isDirectory()||stat.isSymbolicLink())fail();
  }
 }
}
async function native(file:string,args:string[]){await trusted(file);return execute(file,args,{cwd:'/',timeout:10000,maxBuffer:16384,encoding:'utf8',env:{NODE_ENV:process.env.NODE_ENV,PATH:'/usr/sbin:/usr/bin:/sbin:/bin',LANG:'C',LC_ALL:'C'}});}
export function sudoAccountRecord(text:unknown,uid:unknown){
 if(typeof uid!=='number'||!Number.isInteger(uid)||uid<=0||typeof text!=='string'||text.length>16384||text.includes('\0'))fail();
 const rows=text.trimEnd().split('\n');if(rows.length!==1)fail();const fields=rows[0].split(':');
 if(fields.length!==7||!/^[a-z_][a-z0-9_-]{0,31}$/i.test(fields[0])||fields[2]!==String(uid)||!/^\d+$/.test(fields[3]))fail();
 return {username:fields[0],uid};
}
// Internal fixed native hooks. run is a trusted test dependency, never HTTP data.
export function sudoPolicyHooks(account:SudoAccount={}, {run=native}:{run?:PolicyRunner}={}){
 const plan=sudoPolicyPlan({passwordless:false,actions:['service']},account);
 if(typeof run!=='function')fail();
 return {
  verifyAccount:async()=>{const output=await run('/usr/bin/getent',['passwd',String(plan.uid)]);if(!object(output))fail();const found=sudoAccountRecord(output.stdout,plan.uid);if(found.username!==plan.username)fail();},
  validateCandidate:async (file:unknown)=>{if(typeof file!=='string'||!/^\/etc\/sudoers\.d\/\.tastedev-config-[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(file))fail();await run('/usr/sbin/visudo',['-c','-f',file]);},
  validatePolicy:async()=>{await run('/usr/sbin/visudo',['-c']);},
 };
}
