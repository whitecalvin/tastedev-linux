type LocaleEnvironment=Readonly<Partial<Record<'LC_ALL'|'LC_COLLATE'|'LANG',string>>>;
export type NginxProcessSnapshot={start:string;argv:string[];locale?:LocaleEnvironment;localeVerified?:boolean;collation:string};
export type NginxServiceInspectionDependencies={runCommand?:(binary:string,args:string[])=>Promise<{stdout?:unknown;stderr?:unknown}>;snapshot?:(pid:number)=>Promise<NginxProcessSnapshot>};
import {open,lstat,realpath} from 'node:fs/promises';
import {constants} from 'node:fs';
import {execFile} from './admin-native-exec.ts';
import {promisify} from 'node:util';
import {nginxBuildScope,nginxServiceScope} from './nginx-service-scope.ts';
const execute=promisify(execFile),fail:()=>never=()=>{throw Object.assign(Error('Running nginx service identity requires review'),{status:409});};
async function run(binary:string,args:string[]){const stat=await lstat(binary);if(!stat.isFile()||stat.isSymbolicLink()||stat.uid!==0||(stat.mode&0o022)||!(stat.mode&0o111))fail();return execute(binary,args,{timeout:10000,maxBuffer:65536,encoding:'utf8',cwd:'/',env:{NODE_ENV:process.env.NODE_ENV,PATH:'/usr/bin:/bin',LANG:'C',LC_ALL:'C'}});}
async function read(file:string){const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);try{const buffer=Buffer.alloc(16385),{bytesRead}=await handle.read(buffer,0,buffer.length,0);if(bytesRead>16384)fail();return new TextDecoder('utf-8',{fatal:true}).decode(buffer.subarray(0,bytesRead));}finally{await handle.close();}}
export function nginxManagerState(text:unknown){if(typeof text!=='string'||text.length>16384||text.includes('\0'))fail();const result:Record<string,string>={};for(const line of text.split('\n')){if(!line)continue;const match=/^(LoadState|ActiveState|MainPID)=(.*)$/.exec(line);if(!match||Object.hasOwn(result,match[1]))fail();result[match[1]]=match[2];}if(result.LoadState!=='loaded'||result.ActiveState!=='active'||! /^[1-9][0-9]{0,9}$/.test(result.MainPID))fail();return {pid:Number(result.MainPID)};}
export function nginxProcessStart(text:unknown){if(typeof text!=='string'||text.length>16384)fail();const close=text.lastIndexOf(')'),fields=text.slice(close+2).trim().split(/\s+/);if(close<0||!/^\d+$/.test(fields[19]??''))fail();return fields[19];}
export function nginxLocaleEnvironment(text:unknown){
 if(typeof text!=='string'||text.length>16384)fail();const values:Partial<Record<'LC_ALL'|'LC_COLLATE'|'LANG',string>>={};for(const entry of text.split('\0')){const match=/^(LC_ALL|LC_COLLATE|LANG)=(.*)$/.exec(entry);if(!match)continue;if(Object.hasOwn(values,match[1])||match[2].length>128||!/^[a-zA-Z0-9_.@-]*$/.test(match[2]))fail();values[match[1] as 'LC_ALL'|'LC_COLLATE'|'LANG']=match[2];}return Object.freeze(values);
}
export function nginxProcessLocale(text:unknown){const values=nginxLocaleEnvironment(text);return values.LC_ALL||values.LC_COLLATE||values.LANG||'C';}
async function processSnapshot(pid:number){const root='/proc/'+pid;const owner=await lstat(root);if(!owner.isDirectory()||owner.uid!==0)fail();const executable=await realpath(root+'/exe');if(executable!=='/usr/sbin/nginx')fail();const status=await read(root+'/status');if(!/^Uid:\s+0\s+0\s+0\s+0\s*$/m.test(status))fail();const start=nginxProcessStart(await read(root+'/stat')),raw=await read(root+'/cmdline'),argv=raw.split('\0').filter(Boolean);if(!argv.length)fail();const locale=nginxLocaleEnvironment(await read(root+'/environ'));return {start,argv,locale,localeVerified:false,collation:locale.LC_ALL||locale.LC_COLLATE||locale.LANG||'C'};}
// Read-only trusted dependency injection; raw process arguments never returned.
export async function inspectNginxService({runCommand=run,snapshot=processSnapshot}:NginxServiceInspectionDependencies={}){
 const args=['--no-ask-password','show','nginx.service','--property=LoadState,ActiveState,MainPID','--no-pager'];
 const initial=nginxManagerState((await runCommand('/usr/bin/systemctl',args)).stdout),before=await snapshot(initial.pid),build=nginxBuildScope((await runCommand('/usr/sbin/nginx',['-V'])).stderr),scope=nginxServiceScope(before.argv,build),after=await snapshot(initial.pid),latest=nginxManagerState((await runCommand('/usr/bin/systemctl',args)).stdout);
 if(latest.pid!==initial.pid||after.start!==before.start||JSON.stringify(after.argv)!==JSON.stringify(before.argv)||after.collation!==before.collation||JSON.stringify(after.locale)!==JSON.stringify(before.locale))fail();return {...scope,pid:initial.pid,start:before.start,service:'nginx.service',collation:before.collation,locale:before.locale,localeVerified:before.localeVerified===true,identityVerified:true};
}
