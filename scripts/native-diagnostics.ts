export const nativeDiagnosticWorkRoot='/mnt/data/build/tastedev-linux';
export type NativeDiagnosticOptions={tag:string;prefix:string;binaries:readonly string[];directoryPattern:RegExp;imageUser?:'postgres'|null;maxFileBytes?:number;snapshotLimit?:number};
export type NativeDiagnostic={category:'diagnostic-file-access'|'invalid-option'|'container-mount'|'diagnostic-failure';exitCode:number|string|null;phase?:string};
type NativeImage=Record<string,unknown>&{Os:'linux';Id:string};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const stderr=(error:unknown)=>object(error)&&typeof error.stderr==='string'?error.stderr:'';
function imageRecord(value:unknown):value is NativeImage{return object(value)&&value.Os==='linux'&&typeof value.Id==='string'&&/^sha256:[a-f0-9]{64}$/.test(value.Id);}
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {lstat,readdir} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const exec=promisify(execFile);
// Development-only, offline diagnostics in the local Desktop VM. Never a DB launcher.
export async function nativeDiagnosticSession({tag,prefix,binaries,directoryPattern,imageUser=null,maxFileBytes=262144,snapshotLimit=2097152}:NativeDiagnosticOptions){
 const context='desktop-linux',docker='/usr/local/bin/docker',runId=randomUUID(),active=new Set<string>();let lastDiagnostic:NativeDiagnostic|null=null;
 assert(Number.isInteger(maxFileBytes)&&maxFileBytes>=262144&&maxFileBytes<=1048576);assert(Number.isInteger(snapshotLimit)&&snapshotLimit>=2097152&&snapshotLimit<=8388608);assert(imageUser===null||imageUser==='postgres','Only the fixed image PostgreSQL account is supported');assert(/^[a-z0-9-]+$/.test(prefix));assert(binaries.every(value=>/^\/[a-zA-Z0-9_/.-]+$/.test(value)));
 async function call(args:string[],input?:Buffer){const pending=exec(docker,['--context',context,...args],{timeout:90000,maxBuffer:2097152});if(input){assert(pending.child.stdin,'Container input stream is unavailable');pending.child.stdin.on('error',()=>{});pending.child.stdin.end(input);}return (await pending).stdout;}
 assert.equal((await call(['context','inspect',context,'--format','{{.Endpoints.docker.Host}}'])).trim(),'unix://'+path.join(process.env.HOME??'','.docker/desktop/docker.sock'),'Only the local Docker Desktop VM is allowed');
 const imageValue:unknown=JSON.parse(await call(['image','inspect',tag,'--format','{{json .}}']));assert(imageRecord(imageValue),'Expected a fixed Linux image digest');const image=imageValue;
 async function remove(name:string){try{const label=(await call(['container','inspect','--format','{{index .Config.Labels "tastedev.verification"}}',name])).trim();assert.equal(label,runId,'Refuse to remove an unrelated container');await call(['rm','--force',name]);active.delete(name);}catch(error){if(/No such (?:container|object)/i.test(stderr(error))){active.delete(name);return;}throw error;}}
 async function checkTree(directory:string){const stat=await lstat(directory);assert(stat.isDirectory()&&!stat.isSymbolicLink());assert.equal(stat.uid,process.getuid?.());assert.equal(stat.mode&0o777,0o700);for(const entry of await readdir(directory,{withFileTypes:true})){assert(/^[a-zA-Z0-9_.-]+$/.test(entry.name));const file=path.join(directory,entry.name),item=await lstat(file);assert(!item.isSymbolicLink());if(item.isDirectory())await checkTree(file);else{assert(item.isFile());assert.equal(item.uid,process.getuid?.());assert.equal(item.mode&0o777,0o600);assert(item.size<=maxFileBytes);}}}
 async function native(binary:string,args:string[],directory:string|null=null){
  assert(binaries.includes(binary));lastDiagnostic=null;const name=prefix+'-'+randomUUID();active.add(name);
  const options=['run','--rm','--pull','never','--name',name,'--label','tastedev.verification='+runId,'--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges=true','--pids-limit','64','--memory','512m','--cpus','1','--user',imageUser??(String(process.getuid?.())+':'+String(process.getgid?.())),'--env','TMPDIR='+nativeDiagnosticWorkRoot,'--env','TMP='+nativeDiagnosticWorkRoot,'--env','TEMP='+nativeDiagnosticWorkRoot,'--tmpfs',nativeDiagnosticWorkRoot+':rw,noexec,nosuid,nodev,size=64m,mode=1777'];
  let input:Buffer|undefined,entry=binary,parameters=args;
  try{
   if(directory){assert.equal(path.dirname(directory),nativeDiagnosticWorkRoot,'Diagnostic fixture must use the designated work root');assert(directoryPattern.test(directory));await checkTree(directory);input=(await exec('/usr/bin/tar',['-cf','-','-C',path.dirname(directory),path.basename(directory)],{encoding:'buffer',maxBuffer:snapshotLimit})).stdout;const quote=(value:string)=>"'"+value.replaceAll("'","'\\''")+"'";entry='/bin/sh';parameters=['-c','set -eu\numask 077\n/bin/tar --no-same-owner -xf - -C '+quote(nativeDiagnosticWorkRoot)+'\nexec '+[binary,...args].map(quote).join(' ')];options.push('-i');}
   return await call([...options,'--entrypoint',entry,image.Id,...parameters],input);
  }catch(error){lastDiagnostic={category:/Permission denied|Errcode: 13|errno: 13|Can't change dir|Can't read dir/i.test(stderr(error))?'diagnostic-file-access':/unknown (?:option|variable)|unrecognized configuration parameter/i.test(stderr(error))?'invalid-option':/mount|bind source/i.test(stderr(error))?'container-mount':'diagnostic-failure',exitCode:object(error)&&(typeof error.code==='number'||typeof error.code==='string')?error.code:null,...(/HBA-phase=(initdb|single-user|report)/.exec(stderr(error))?{phase:/HBA-phase=(initdb|single-user|report)/.exec(stderr(error))?.[1]}:{})};throw Object.assign(new Error('Native diagnostic failed; raw output was withheld'),lastDiagnostic);}finally{await remove(name);}
 }
 return {context,image,native,get lastDiagnostic(){return lastDiagnostic;},assertClean:()=>assert.equal(active.size,0,'Verification containers must be removed'),cleanup:async()=>{for(const name of active)await remove(name);}};
}
