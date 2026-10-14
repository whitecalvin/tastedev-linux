import type {NginxCandidate} from './nginx-candidate.ts';
import type {NginxCommand,NginxLocale} from './nginx-candidate-validation.ts';
type ServiceIdentity={pid:number;start:string;main:string;prefix:string;collation:unknown;locale:NginxLocale};
export type NginxOperationDependencies={inspect?:()=>unknown|Promise<unknown>;runCommand?:NginxCommand};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {lstat} from 'node:fs/promises';
import path from 'node:path';
import {execFile} from './admin-native-exec.ts';
import {promisify} from 'node:util';
import {validateNginxCandidate} from './nginx-candidate-validation.ts';
import {nginxValidationLocale} from './nginx-locale.ts';
import {inspectNginxService} from './nginx-service-inspect.ts';
const execute=promisify(execFile),fail:()=>never=()=>{throw Object.assign(Error('Nginx operational context requires review'),{status:409});};
async function native(binary:string,args:string[],locale:NginxLocale={LC_ALL:'C'}){let cursor='/';const parts=binary.split('/').filter(Boolean);for(let index=0;index<parts.length;index++){cursor=path.join(cursor,parts[index]);const stat=await lstat(cursor);if(stat.uid!==0||(stat.mode&0o022)||stat.isSymbolicLink()||(index===parts.length-1?!stat.isFile()||!(stat.mode&0o111)||stat.nlink!==1:!stat.isDirectory()))fail();}try{return await execute(binary,args,{cwd:'/',timeout:10000,maxBuffer:16384,encoding:'utf8',env:{NODE_ENV:process.env.NODE_ENV,PATH:'/usr/bin:/bin',...nginxValidationLocale(locale)}});}catch{fail();}}
// Root helper dependencies only. Creating hooks performs no command. Privilege
// and review gates must authorize the caller before operational validation/reload.
export function nginxOperationHooks({inspect=inspectNginxService,runCommand=native}:NginxOperationDependencies={}){
 if(typeof inspect!=='function'||typeof runCommand!=='function')fail();let baseline:ServiceIdentity|undefined;
 async function inspectService(){const scope=await inspect();if(!object(scope)||scope.identityVerified!==true||scope.service!=='nginx.service'||scope.localeVerified!==true||scope.main!=='/etc/nginx/nginx.conf'||typeof scope.pid!=='number'||!Number.isInteger(scope.pid)||scope.pid<=0||typeof scope.start!=='string'||!/^\d+$/.test(scope.start)||typeof scope.prefix!=='string'||!/^\/[a-zA-Z0-9_/-]+$/.test(scope.prefix)||scope.prefix.split('/').some(part=>part==='.'||part==='..'))fail();const identity={pid:scope.pid,start:scope.start,main:scope.main,prefix:scope.prefix,collation:scope.collation,locale:nginxValidationLocale(scope.locale)};if(baseline&&JSON.stringify(identity)!==JSON.stringify(baseline))fail();baseline??=identity;return scope;}
 async function validateOperational(){await inspectService();if(!baseline)fail();await runCommand('/usr/sbin/nginx',['-t','-p',baseline.prefix.endsWith('/')?baseline.prefix:baseline.prefix+'/','-c',baseline.main,'-e','stderr'],baseline.locale);await inspectService();}
 async function reload(){await inspectService();if(!baseline)fail();await runCommand('/usr/bin/systemctl',['--no-ask-password','reload','nginx.service'],baseline.locale);await inspectService();}
 return {inspectService,validateOperational,validatePrepared:async (bundle:NginxCandidate)=>{await inspectService();if(!baseline)fail();const result=await validateNginxCandidate(bundle,{execute:runCommand,locale:baseline.locale});await inspectService();return result;},activate:reload,recover:reload};
}
