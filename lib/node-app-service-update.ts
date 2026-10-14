import type {NodeServiceDependencies} from './node-app-service-control.ts';
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {open} from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {configTransaction} from './config-transaction.ts';
import {nodeAppProfile} from './node-app-profile.ts';
import {nodeAppUnit} from './node-app-unit.ts';
import {nodeAppInstalledOptions} from './node-app-service-control.ts';
const hash=(text:string|Buffer)=>createHash('sha256').update(text).digest('hex');
const fail: (message:string,status?:number)=>never=(message,status=409)=>{throw Object.assign(Error(message),{status});};
async function snapshot(file: string){
 const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{
  const stat=await handle.stat();
  if(!stat.isFile()||stat.uid!==process.getuid?.()||stat.nlink!==1||(stat.mode&0o022)||stat.size>65536)fail('Unsafe service candidate',403);
  const bytes=await handle.readFile();if(bytes.length>65536)fail('Oversized service candidate',403);
  return {version:hash(bytes),ino:stat.ino,dev:stat.dev};
 }finally{await handle.close();}
}
// Trusted helper primitive: target directories and hooks must never be HTTP fields.
// Reloads systemd metadata only. Running applications are not restarted here.
export async function updateNodeAppService(input: unknown,{callerUid,directory='/etc/systemd/system',backupRoot='/var/lib/tastedev-linux/service-backups',verifyContext,validateUnit,reloadManager}: NodeServiceDependencies={}){
 if(!object(input)||input.confirm!==true||typeof verifyContext!=='function'||typeof validateUnit!=='function'||typeof reloadManager!=='function'||typeof input.unitVersion!=='string'||!/^[a-f0-9]{64}$/.test(input.unitVersion))fail('Reviewed service version and native checks are required',400);
 if(typeof callerUid!=='number'||!Number.isInteger(callerUid)||callerUid<=0||input.uid!==callerUid)fail('Service account must match caller',403);
 const profile=nodeAppProfile(input.profile),file=path.join(directory,profile.unit);
 const candidate='# Managed by Tastedev Linux\n'+nodeAppUnit(profile,callerUid,input.options);
 const result=await configTransaction({file,backupRoot,version:input.unitVersion,validationSuffix:'.service',
  transform:async original=>{
   const expected='# Managed by Tastedev Linux\n'+nodeAppUnit(profile,callerUid,nodeAppInstalledOptions(original));
   if(original!==expected)fail('Installed service differs from the registered app');
   await verifyContext();return candidate;
  },
  validate:async temporary=>{
   const before=await snapshot(temporary);if(before.version!==hash(candidate))fail('Service candidate changed');
   await validateUnit(temporary);const after=await snapshot(temporary);
   if(after.version!==before.version||after.ino!==before.ino||after.dev!==before.dev)fail('Service candidate changed during validation');
  },
  beforeCommit:verifyContext,
  activate:async()=>{await reloadManager();await verifyContext();if((await snapshot(file)).version!==hash(candidate))fail('Installed service changed during reload');},
  recover:reloadManager,
 });
 return {...result,unit:profile.unit,restarted:false};
}
