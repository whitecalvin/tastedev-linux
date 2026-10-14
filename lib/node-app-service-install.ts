import type {Stats} from 'node:fs';
import type {NodeServiceDependencies} from './node-app-service-control.ts';
import {hasErrorCode} from './error-code.ts';
type UnitSnapshot={stat:Stats;version:string};
type InstallOptions=Pick<NodeServiceDependencies,'directory'|'ownerUid'|'verifyContext'|'validateUnit'|'reloadManager'>;
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {lstat,open,mkdir,rmdir,link,unlink} from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {nodeAppProfile} from './node-app-profile.ts';
import {nodeAppUnit} from './node-app-unit.ts';
const digest=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex');
const fail:(message:string,status?:number)=>never=(message,status=409)=>{throw Object.assign(Error(message),{status});};
async function safeDirectory(directory:string,uid:number){
 const resolved=path.resolve(directory);let current=path.parse(resolved).root;
 for(const part of resolved.slice(current.length).split(path.sep).filter(Boolean)){current=path.join(current,part);const stat=await lstat(current);if(!stat.isDirectory()||stat.isSymbolicLink())fail('Unsafe service directory',403);}
 const stat=await lstat(resolved);if(stat.uid!==uid||(stat.mode&0o022))fail('Unsafe service directory ownership',403);
}
async function read(file:string,uid:number):Promise<UnitSnapshot>{
 const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{const stat=await handle.stat();if(!stat.isFile()||stat.uid!==uid||stat.nlink!==1||(stat.mode&0o022)||stat.size>65536)fail('Unsafe service unit',403);const bytes=await handle.readFile();if(bytes.length>65536)fail('Oversized service unit',403);return {stat,version:digest(bytes)};}finally{await handle.close();}
}
async function absent(file:string){try{await lstat(file);fail('Service unit already exists; inspect it before replacement');}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}}
// Internal helper primitive. Filesystem roots and hooks are trusted dependencies,
// never HTTP fields. Installs a new unit only; it does not start or enable it.
export async function installNodeAppService(input:unknown,{directory='/etc/systemd/system',ownerUid=0,verifyContext,validateUnit,reloadManager}:InstallOptions={}){
 if(!object(input)||input.confirm!==true||typeof verifyContext!=='function'||typeof validateUnit!=='function'||typeof reloadManager!=='function')fail('Service confirmation and native checks are required',400);
 if(!Number.isInteger(ownerUid)||ownerUid<0)fail('Invalid service owner',400);
 const app=nodeAppProfile(input.profile),text='# Managed by Tastedev Linux\n'+nodeAppUnit(app,input.uid,input.options);
 await safeDirectory(directory,ownerUid);
 const file=path.join(directory,app.unit),lock=file+'.tastedev-lock',temporary=path.join(directory,'.tastedev-'+randomUUID()+'.service');
 try{await mkdir(lock,{mode:0o700});}catch(error){if(hasErrorCode(error,'EEXIST'))fail('Another service installation is in progress');throw error;}
 let committed:UnitSnapshot|null=null,prepared=false;
 try{
  await absent(file);await verifyContext();
  const handle=await open(temporary,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);prepared=true;
  try{await handle.writeFile(text);await handle.sync();}finally{await handle.close();}
  const initial=await read(temporary,ownerUid);
  await validateUnit(temporary);
  const checked=await read(temporary,ownerUid);
  if(checked.version!==digest(text)||checked.stat.ino!==initial.stat.ino||checked.stat.dev!==initial.stat.dev)fail('Service candidate changed during validation');
  await verifyContext();await safeDirectory(directory,ownerUid);await absent(file);
  const beforeCommit=await read(temporary,ownerUid);
  if(beforeCommit.version!==initial.version||beforeCommit.stat.ino!==initial.stat.ino||beforeCommit.stat.dev!==initial.stat.dev)fail('Service candidate changed before installation');
  // link is exclusive: a concurrent administrator-created unit is never replaced.
  try{await link(temporary,file);}catch(error){if(hasErrorCode(error,'EEXIST'))fail('Service unit changed before installation');throw error;}
  committed={...beforeCommit};await unlink(temporary);prepared=false;
  const unit=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);try{const stat=await unit.stat();if(!stat.isFile()||stat.ino!==initial.stat.ino||stat.dev!==initial.stat.dev||stat.uid!==ownerUid||stat.nlink!==1||stat.size>65536||digest(await unit.readFile())!==initial.version)fail('Installed service changed before finalization');await unit.chmod(0o644);await unit.sync();}finally{await unit.close();}
  const dir=await open(directory,constants.O_RDONLY);try{await dir.sync();}finally{await dir.close();}
  await reloadManager();await verifyContext();
  const current=await read(file,ownerUid);if(current.version!==initial.version||current.stat.ino!==initial.stat.ino||current.stat.dev!==initial.stat.dev)fail('Installed service changed');
  return {installed:true,unit:app.unit,version:initial.version,started:false,enabled:false};
 }catch(error){
  if(!committed)throw error;
  let removed=false,reloaded=false;
  try{const current=await read(file,ownerUid);if(current.version===committed.version&&current.stat.ino===committed.stat.ino&&current.stat.dev===committed.stat.dev){await unlink(file);removed=true;}}catch{}
  if(removed)try{await reloadManager();reloaded=true;}catch{}
  return {installed:false,failed:true,unit:app.unit,removed,reloaded,manualRecovery:!removed||!reloaded,started:false,enabled:false};
 }finally{try{if(prepared)await unlink(temporary);}finally{await rmdir(lock);}}
}
