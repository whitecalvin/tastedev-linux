import type {Stats} from 'node:fs';
import type {FileHandle} from 'node:fs/promises';
import type {PostgresqlServiceScope,PostgresqlPublicValues} from './postgresql-code-operation.ts';
import {readPostgresqlGraphArchive} from './postgresql-graph-archive.ts';
import {open,lstat,unlink} from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {postgresqlConfigRoot} from './postgresql-config-graph.ts';
const hash=(text:string)=>createHash('sha256').update(text).digest('hex'),fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 중단 작업 백업을 확인하세요.'),{status:409});};
const identity=(stat:Stats)=>({dev:stat.dev,ino:stat.ino,uid:stat.uid,gid:stat.gid,mode:stat.mode,nlink:stat.nlink,size:stat.size,mtimeMs:stat.mtimeMs,ctimeMs:stat.ctimeMs});
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const directoryIdentity=(stat:Stats)=>({dev:stat.dev,ino:stat.ino,uid:stat.uid,gid:stat.gid,mode:stat.mode});
type BackupOptions={file?:string};
export type PostgresqlRecoveryBackup={id:string;kind:'postgresql';target:string;text:string;version:string;createdAt:string;context:{version:1;graphVersion:string;scope:PostgresqlServiceScope;values:PostgresqlPublicValues;graphArchive?:unknown;[key:string]:unknown};[key:string]:unknown};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function backupRecord(record:unknown,id:string,physicalTarget:string,target:string,cluster:string):record is PostgresqlRecoveryBackup{
 if(!object(record)||record.id!==id||record.kind!=='postgresql'||record.target!==physicalTarget||typeof record.text!=='string'||record.text.includes('\0')||Buffer.byteLength(record.text)>262144||record.version!==hash(record.text)||typeof record.createdAt!=='string'||!Number.isFinite(Date.parse(record.createdAt)))return false;
 const context=record.context;if(!object(context))return false;const scope=context.scope,match=cluster.split('/').slice(-2);
 if(context.version!==1||typeof context.graphVersion!=='string'||!/^[a-f0-9]{64}$/.test(context.graphVersion)||!object(scope)||scope.config!==target||scope.hba!==cluster+'/pg_hba.conf'||scope.unit!=='postgresql@'+match[0]+'-'+match[1]+'.service'||scope.major!==Number(match[0])||typeof scope.data!=='string'||!path.isAbsolute(scope.data)||path.normalize(scope.data)!==scope.data||/[\x00-\x1f\x7f]/.test(scope.data)||!object(scope.autoConfiguration)||typeof scope.autoConfiguration.present!=='boolean'||typeof scope.autoConfiguration.version!=='string'||!/^[a-f0-9]{64}$/.test(scope.autoConfiguration.version))return false;
 if(!object(context.values))return false;
 for(const key of ['port','max_connections','shared_buffers','work_mem','logging_collector']){const value=context.values[key];if(typeof value!=='string'||(key==='logging_collector'?!/^(on|off)$/.test(value):!/^\d{1,15}$/.test(value)))return false;}
 return true;
}
export function postgresqlRecoveryBackup(id:unknown,backupRoot:string,target:string,options:BackupOptions={}){return readBackup(id,backupRoot,target,options,false);}
// Internal retry input only: never list an unfinished backup as a published backup.
export function postgresqlPendingBackup(id:unknown,backupRoot:string,target:string,options:BackupOptions={}){return readBackup(id,backupRoot,target,options,true);}
async function readBackup(id:unknown,backupRoot:string,target:string,{file:physicalTarget=target}:BackupOptions={},pending=false){
 if(typeof id!=='string'||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(id??'')||typeof backupRoot!=='string'||!path.isAbsolute(backupRoot)||path.normalize(backupRoot)!==backupRoot)fail();
 const cluster=postgresqlConfigRoot(target);
 async function ancestors(){let parent='/';for(const part of backupRoot.split('/').filter(Boolean)){parent=path.join(parent,part);const stat=await lstat(parent);if(!stat.isDirectory()||stat.isSymbolicLink()||![0,process.getuid?.()].includes(stat.uid)||(stat.mode&0o022)&&!(stat.uid===0&&(stat.mode&0o1000)))fail();}}
 await ancestors();const directory=await open(backupRoot,constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW);let fd:FileHandle|undefined;
 try{
 const root=await directory.stat();if(root.uid!==process.getuid?.()||(root.mode&0o777)!==0o700)fail();
 const checkRoot=async()=>{await ancestors();if(!same(directoryIdentity(root),directoryIdentity(await directory.stat()))||!same(directoryIdentity(root),directoryIdentity(await lstat(backupRoot))))fail();};
 await checkRoot();const child=(name:string)=>'/proc/self/fd/'+directory.fd+'/'+name,file=child(pending?'.pg-undo-init-'+id:id+'.json');
 fd=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 const before=await fd.stat(),safe=(stat:Stats)=>stat.isFile()&&(pending?stat.nlink===1:[1,2].includes(stat.nlink))&&stat.uid===process.getuid?.()&&(stat.mode&0o777)===0o600&&stat.size<=1600000;
 if(!safe(before))fail();const bytes=Buffer.alloc(before.size+1);let size=0;
 while(size<bytes.length){const result=await fd.read(bytes,size,bytes.length-size,null);if(!result.bytesRead)break;size+=result.bytesRead;}
 const stable=async()=>{if(!fd)fail();if(!same(identity(before),identity(await fd.stat()))||!same(identity(before),identity(await lstat(file))))fail();await checkRoot();};
 if(size!==before.size)fail();await stable();let record:unknown;try{record=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,size)));}catch{fail();}
 if(!backupRecord(record,id,physicalTarget,target,cluster))fail();
 const context=record.context;
 if(pending&&!context.graphArchive)fail();
 if(context.graphArchive){const archive=await readPostgresqlGraphArchive(context.graphArchive,backupRoot,target);if(!object(context.graphArchive)||context.graphArchive.graphVersion!==context.graphVersion||archive.sources.find(file=>file.path===target)?.text!==record.text)fail();}


 await stable();
 if(before.nlink===2){
  // The publisher uses this exact private alias. Unknown links are never removed.
  if(!record.context.graphArchive)fail();
  const temporary=child('.pg-undo-init-'+id),alias=await lstat(temporary);
  if(!safe(alias)||!same(identity(before),identity(alias)))fail();
  await stable();if(!same(identity(alias),identity(await lstat(temporary))))fail();
  await unlink(temporary);await directory.sync();
  const after=await fd.stat(),named=await lstat(file),unchanged=(value:Stats)=>Object.fromEntries(Object.entries(identity(value)).filter(([key])=>!['ctimeMs','nlink'].includes(key)));
  if(after.nlink!==1||!safe(after)||!same(identity(after),identity(named))||!same(unchanged(before),unchanged(after)))fail();await checkRoot();
 }
 return record;
 }finally{await fd?.close();await directory.close();}
}
