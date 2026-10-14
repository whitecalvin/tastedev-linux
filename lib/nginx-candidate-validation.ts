import type {NginxCandidate} from './nginx-candidate.ts';
export type NginxLocale=ReturnType<typeof nginxValidationLocale>;
export type NginxCommand=(binary:string,args:string[],locale:NginxLocale)=>unknown|Promise<unknown>;
import {execFile} from './admin-native-exec.ts';
import {promisify} from 'node:util';
import {lstat} from 'node:fs/promises';
import {nginxValidationLocale} from './nginx-locale.ts';
import {assertNginxCandidate} from './nginx-candidate.ts';
const executeNative=promisify(execFile);
async function native(command:string,args:string[],locale:NginxLocale){
 const stat=await lstat(command);if(!stat.isFile()||stat.isSymbolicLink()||stat.uid!==0||(stat.mode&0o022)||!(stat.mode&0o111))throw Error('Native nginx binary requires review');
 await executeNative(command,args,{timeout:10000,maxBuffer:16384,encoding:'utf8',cwd:'/',env:{NODE_ENV:process.env.NODE_ENV,PATH:'/usr/bin:/bin',...locale}});
}
// Trusted helper primitive only. Syntax validation does not authorize deployment
// or establish original resource permissions, module safety or service identity.
export async function validateNginxCandidate(bundle:NginxCandidate,{execute=native,locale={LC_ALL:'C'}}:{execute?:NginxCommand;locale?:unknown}={}){
 const environment=nginxValidationLocale(locale);await assertNginxCandidate(bundle);if(bundle.outputPathsIsolated!==true||typeof execute!=='function')throw Object.assign(Error('Private nginx candidate required'),{status:400});
 try{await execute('/usr/sbin/nginx',['-t','-p',bundle.root+'/','-c',bundle.main,'-e','stderr'],environment);}catch{throw Object.assign(Error('Private nginx full configuration validation failed'),{status:400});}
 await assertNginxCandidate(bundle);return {valid:true,scope:'isolated-nginx-graph',operationalResourcesVerified:false,serviceChanged:false};
}
