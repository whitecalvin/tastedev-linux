import type {FileHandle} from 'node:fs/promises';
export type StoredInstallJob = {id: string; command: string[]; status: 'running' | 'success' | 'failed'; logs: string[]; startedAt: string; exitCode: number | null; signal?: string | null; finishedAt?: string};
import {constants} from 'node:fs';
import {lstat,open,rename,unlink} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {prepareAdminJobDirectory} from './admin-job-record.ts';
const fail=(status=409)=>Object.assign(Error('작업 기록을 읽을 수 없습니다. 관리자 확인이 필요합니다.'),{status});
const recordLimit=16*1024*1024;
const prefix=['/usr/bin/apt-get','install','--yes','--no-remove','--no-upgrade'];
const packages=new Set(['nginx','certbot','python3-certbot-nginx','nodejs','npm','postgresql','mariadb-server','redis-server']);
export function installJobRecord(input: unknown): StoredInstallJob{
 if(input===null||typeof input!=='object'||Array.isArray(input))throw fail();const value=input as Record<string,unknown>;if(['id','command','status','logs','startedAt','exitCode'].some(key=>!Object.hasOwn(value,key)))throw fail();
 const date=(text: unknown): text is string=>typeof text==='string'&&Number.isFinite(Date.parse(text));
 if(!value||typeof value.id!=='string'||! /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value.id)||(value.status!=='running'&&value.status!=='success'&&value.status!=='failed')||!date(value.startedAt)||value.finishedAt!==undefined&&!date(value.finishedAt)||!Array.isArray(value.command)||value.command.length<=prefix.length||value.command.length>prefix.length+packages.size||prefix.some((part,index)=>(value.command as unknown[])[index]!==part)||value.command.slice(prefix.length).some((part: unknown)=>typeof part!=='string'||!packages.has(part))||new Set(value.command.slice(prefix.length)).size!==value.command.length-prefix.length||!Array.isArray(value.logs)||value.logs.length>1000||value.logs.some((line: unknown)=>typeof line!=='string'||line.length>2000)||value.exitCode!==null&&(typeof value.exitCode!=='number'||!Number.isInteger(value.exitCode)||value.exitCode<0||value.exitCode>255)||value.status==='success'&&value.exitCode!==0||value.status==='running'&&(value.exitCode!==null||value.finishedAt!==undefined)||value.signal!==undefined&&value.signal!==null&&(typeof value.signal!=='string'||!/^SIG[A-Z0-9]{1,16}$/.test(value.signal)))throw fail();
 return Object.fromEntries(['id','command','status','logs','startedAt','exitCode','signal','finishedAt'].filter(key=>Object.hasOwn(value,key)).map(key=>[key,structuredClone(value[key])])) as StoredInstallJob;
}
export async function readInstallJob(file: string): Promise<StoredInstallJob | null>{
 let handle: FileHandle | undefined;try{
  const folder=path.dirname(path.resolve(file));let cursor=path.parse(folder).root;
  for(const part of folder.slice(cursor.length).split(path.sep).filter(Boolean)){cursor=path.join(cursor,part);const stat=await lstat(cursor);if(!stat.isDirectory()||stat.isSymbolicLink())throw fail(403);}
  const parent=await lstat(folder);if(parent.uid!==process.getuid?.()||(parent.mode&0o022))throw fail(403);
  handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);const before=await handle.stat();
  if(!before.isFile()||before.nlink!==1||before.uid!==process.getuid?.()||(before.mode&0o077)||before.size>recordLimit)throw fail(403);
  const bytes=Buffer.alloc(before.size+1),{bytesRead}=await handle.read(bytes,0,bytes.length,0),after=await handle.stat();
  if(bytesRead!==before.size||before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ctimeMs!==after.ctimeMs)throw fail();
  let value;try{value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,bytesRead)));}catch{throw fail();}return installJobRecord(value);
 }catch(error){if(error!==null&&typeof error==='object'&&'code' in error&&error.code==='ENOENT')return null;if(error!==null&&typeof error==='object'&&'status' in error&&error.status)throw error;throw fail(403);}finally{await handle?.close();}
}
export async function saveInstallJob(file: string,value: unknown){
 const snapshot=installJobRecord(value),serialized=JSON.stringify(snapshot),folder=path.dirname(file);if(Buffer.byteLength(serialized)>recordLimit)throw fail();await prepareAdminJobDirectory(folder);
 const temporary=file+'.'+randomUUID()+'.tmp';let handle: FileHandle | undefined;
 try{handle=await open(temporary,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);await handle.writeFile(serialized);await handle.sync();await handle.close();handle=undefined;await rename(temporary,file);
  const directory=await open(folder,constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW);try{await directory.sync();}finally{await directory.close();}
 }finally{await handle?.close();await unlink(temporary).catch(error=>{if(error===null||typeof error!=='object'||!('code' in error)||error.code!=='ENOENT')throw error;});}
}
