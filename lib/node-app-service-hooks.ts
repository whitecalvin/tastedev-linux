import type {NodeServiceOperation} from './node-app-service-control.ts';
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {constants} from 'node:fs';
import {lstat,realpath,open} from 'node:fs/promises';
import path from 'node:path';
import {execFile} from './admin-native-exec.ts';
import {promisify} from 'node:util';
import {nodeAppRuntime} from './node-app-runtime.ts';
import {verifyNodeServiceContext} from './node-app-service-context.ts';
const execute=promisify(execFile);
async function binary(file:string){
 for(const candidate of [file,await realpath(file)]){
  let current='/';const parts=candidate.split('/').filter(Boolean);
  for(let index=0;index<parts.length;index++){
   current=path.join(current,parts[index]);const stat=await lstat(current);
   if(stat.uid!==0||(stat.mode&0o022)||(index<parts.length-1?!stat.isDirectory()&&!stat.isSymbolicLink():!stat.isFile()&&!stat.isSymbolicLink()))throw Error('Unsafe systemd executable');
   if(index===parts.length-1&&!stat.isSymbolicLink()&&(!(stat.mode&0o111)||stat.nlink!==1))throw Error('Unsafe systemd executable');
  }
 }
}
async function run(file:string,args:string[]){await binary(file);return execute(file,args,{cwd:'/',timeout:60000,maxBuffer:1048576,encoding:'utf8',env:{NODE_ENV:process.env.NODE_ENV,PATH:'/usr/sbin:/usr/bin:/sbin:/bin',LANG:'C',LC_ALL:'C'}});}
// Fixed native hooks for the reviewed root helper. Never accepts command strings.
export function nodeAppServiceHooks(input:unknown,callerUid:unknown){
 return {
  verifyContext:async()=>{await verifyNodeServiceContext(input,callerUid);const runtime=await nodeAppRuntime();if(runtime.status!=='ready')throw Object.assign(Error('Node runtime with environment-file support is required'),{status:403});},
  validateUnit:async (candidate:string)=>{await run('/usr/bin/systemd-analyze',['--man=no','verify',candidate]);},
  reloadManager:async()=>{await run('/usr/bin/systemctl',['--no-ask-password','daemon-reload']);}
 };
}

const serviceUnit=(value:unknown)=>{if(typeof value!=='string'||!/^tastedev-node-[a-z][a-z0-9-]{0,39}\.service$/.test(value))throw Error('Invalid Node service unit');return value;};
export function nodeAppManagerValues(text:unknown){
 if(typeof text!=='string'||text.length>16384||text.includes('\0'))throw Error('Invalid Node service manager state');
 const result:Record<string,string>={};for(const line of text.split('\n')){if(!line)continue;const match=/^(LoadState|FragmentPath|User|DropInPaths)=(.*)$/.exec(line);if(!match||Object.hasOwn(result,match[1]))throw Error('Invalid Node service manager state');result[match[1]]=match[2];}
 if(!['LoadState','FragmentPath','User','DropInPaths'].every(key=>Object.hasOwn(result,key)))throw Error('Incomplete Node service manager state');return result;
}
export function nodeAppServiceControlHooks(input:unknown,callerUid:unknown){
 if(!object(input))throw Error('Invalid Node service operation');
 return {
  verifyContext:typeof input.operation==='string'&&['stop','disable'].includes(input.operation)?async()=>{if(typeof callerUid!=='number'||!Number.isInteger(callerUid)||callerUid<=0||input.uid!==callerUid)throw Error('Service account must match caller');}:nodeAppServiceHooks(input,callerUid).verifyContext,
  readUnit:async (name:string)=>{
   const file='/etc/systemd/system/'+serviceUnit(name);
   for(const directory of ['/etc','/etc/systemd','/etc/systemd/system']){const stat=await lstat(directory);if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==0||(stat.mode&0o022))throw Error('Unsafe Node service directory');}
   const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
   try{const stat=await handle.stat();if(!stat.isFile()||stat.uid!==0||stat.nlink!==1||(stat.mode&0o022)||stat.size>65536)throw Error('Unsafe Node service file');const bytes=Buffer.alloc(65537),{bytesRead}=await handle.read(bytes,0,bytes.length,0);if(bytesRead>65536)throw Error('Oversized Node service file');const current=await lstat(file);if(current.isSymbolicLink()||current.ino!==stat.ino||current.dev!==stat.dev||current.size!==stat.size||current.mtimeMs!==stat.mtimeMs||current.mode!==stat.mode||current.uid!==stat.uid||current.nlink!==stat.nlink)throw Error('Node service file changed');return new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,bytesRead));}finally{await handle.close();}
  },
  inspectManager:async (name:string)=>{const {stdout}=await run('/usr/bin/systemctl',['--no-ask-password','show',serviceUnit(name),'--property=LoadState,FragmentPath,User,DropInPaths','--no-pager']);return nodeAppManagerValues(stdout);},
  perform:async(operation:NodeServiceOperation|'daemon-reload',name:string)=>{serviceUnit(name);if(operation==='daemon-reload')return run('/usr/bin/systemctl',['--no-ask-password','daemon-reload']);if(!['start','stop','restart','enable','disable'].includes(operation))throw Error('Invalid Node service operation');return run('/usr/bin/systemctl',['--no-ask-password',operation,name]);}
 };
}
