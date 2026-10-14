type HookResult=unknown|Promise<unknown>;
export type NginxFileHooks={base?:string;backupRoot?:string;inspectGraph?:(input:{target:string;phase:'original'|'candidate'})=>HookResult;validatePrepared?:(input:{target:string;candidate:string})=>HookResult;activate?:()=>HookResult;recover?:()=>HookResult};
const object=(value: unknown): value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import path from 'node:path';
import {isNginxEditablePath} from './nginx-config-paths.ts';
import {open} from 'node:fs/promises';
import {acquireConfigOperationLease} from './config-operation-lease.ts';
import {constants} from 'node:fs';
import {createHash} from 'node:crypto';
import {configTransaction} from './config-transaction.ts';
import {parseNginxTree} from './nginx-syntax.ts';
const fail: (message:string,status?:number)=>never=(message,status=400)=>{throw Object.assign(Error(message),{status});};
const hash=(text:string|Buffer)=>createHash('sha256').update(text).digest('hex');
export function nginxEditableFile(target:unknown){
 if(!isNginxEditablePath(target))fail('Select a supported nginx configuration file');
 return target.slice('/etc/nginx/'.length);
}
async function snapshot(file:string){
 const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{const stat=await handle.stat();if(!stat.isFile()||stat.uid!==process.getuid?.()||stat.nlink!==1||(stat.mode&0o022)||stat.size>262144)fail('Unsafe nginx candidate');
 const bytes=Buffer.alloc(262145);const {bytesRead}=await handle.read(bytes,0,bytes.length,0);if(bytesRead>262144)fail('Oversized nginx candidate');return {version:hash(bytes.subarray(0,bytesRead)),ino:stat.ino,dev:stat.dev};
 }finally{await handle.close();}
}
// Internal helper primitive. Native full-graph validation and service identity
// inspection are mandatory trusted hooks; a fragment-only nginx -t is insufficient.
export async function updateNginxFile(input:unknown,{base='/etc/nginx',backupRoot,inspectGraph,validatePrepared,activate,recover}:NginxFileHooks={}){
 if(!object(input)||input.confirm!==true||Object.keys(input).some(key=>!['path','text','version','confirm'].includes(key))||typeof input.text!=='string'||input.text.includes('\0')||Buffer.byteLength(input.text)>262144)fail('Review the nginx file changes before applying');
 if(typeof backupRoot!=='string'||typeof inspectGraph!=='function'||typeof validatePrepared!=='function'||typeof activate!=='function'||typeof recover!=='function')fail('Native full nginx validation and service checks are required');
 const relative=nginxEditableFile(input.path),target='/etc/nginx/'+relative,text=input.text,file=path.join(base,relative),version=hash(text);parseNginxTree(text);
 const release=await acquireConfigOperationLease(path.join(base,'.tastedev-nginx-graph-lock'));
 try{return await configTransaction({file,backupRoot,version:input.version,
  transform:async original=>{if(original.includes('\uFFFD'))fail('Review the nginx file encoding');parseNginxTree(original);await inspectGraph({target,phase:'original'});return text;},
  validate:async candidate=>{const before=await snapshot(candidate);if(before.version!==version)fail('Nginx candidate differs from reviewed text',409);await validatePrepared({target,candidate});const after=await snapshot(candidate);if(after.version!==before.version||after.ino!==before.ino||after.dev!==before.dev)fail('Nginx candidate changed during validation',409);await inspectGraph({target,phase:'original'});},
  beforeCommit:()=>inspectGraph({target,phase:'original'}),
  activate:async()=>{await inspectGraph({target,phase:'candidate'});await activate();if((await snapshot(file)).version!==version)fail('Nginx configuration changed during reload',409);await inspectGraph({target,phase:'candidate'});},
  recover:async()=>{await inspectGraph({target,phase:'original'});await recover();await inspectGraph({target,phase:'original'});}
 });}finally{await release();}
}
