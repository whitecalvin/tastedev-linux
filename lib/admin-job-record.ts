import type {FileHandle} from 'node:fs/promises';
import {hasErrorCode} from './error-code.ts';
export type AdminJobSnapshot = {id: string;command: string[];status: 'running'|'success'|'failed';logs: string[];startedAt: string;exitCode: number|null;signal?: string|null;finishedAt?: string};
export type CompletedAdminJob = AdminJobSnapshot & {status: 'success'|'failed'};
export type PendingAdminJob = AdminJobSnapshot & {status: 'running';exitCode: null};
export type RecoveryAdminJob = Omit<PendingAdminJob,'status'> & {status:'recovery-required';notice: string};
export type AdminJobSummary = {id: string;status: 'success'|'failed'|'recovery-required';startedAt: string;finishedAt?: string};
const object=(value: unknown): value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {constants} from 'node:fs';
import {lstat,open,opendir,mkdir,rename,unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
const maximumRecordBytes=32*1024*1024;
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const fail=(message: string,status: number)=>Object.assign(Error(message),{status});
export function adminJobId(id: unknown){if(typeof id!=='string'||!uuid.test(id))throw fail('관리 작업을 찾을 수 없습니다.',404);return id;}
export async function prepareAdminJobDirectory(folder: string){
 await mkdir(folder,{recursive:true,mode:0o700});
 let cursor=path.parse(path.resolve(folder)).root;for(const part of path.resolve(folder).slice(cursor.length).split(path.sep).filter(Boolean)){cursor=path.join(cursor,part);const stat=await lstat(cursor);if(!stat.isDirectory()||stat.isSymbolicLink())throw fail('작업 기록을 읽을 수 없습니다. 관리자 확인이 필요합니다.',403);}
 const stat=await lstat(folder);if(stat.uid!==process.getuid?.()||(stat.mode&0o077))throw fail('작업 기록을 읽을 수 없습니다. 관리자 확인이 필요합니다.',403);
}
export async function saveCompletedAdminJob(folder: string,record: unknown){return saveAdminJobRecord(folder,record,'.log.json',completedAdminJob);}
export async function savePendingAdminJob(folder: string,record: unknown){return saveAdminJobRecord(folder,record,'.pending.json',pendingAdminJob);}
export async function savePendingAdminJobProgress(folder: string,record: unknown){return saveAdminJobRecord(folder,record,'.pending.json',pendingAdminJob,true);}
async function saveAdminJobRecord<T extends AdminJobSnapshot>(folder: string,record: unknown,suffix: string,validate: (record: unknown,id: string)=>T,progress=false){
 const id=adminJobId(object(record)?record.id:undefined),snapshot=validate(record,id),serialized=JSON.stringify(snapshot);
 if(Buffer.byteLength(serialized,'utf8')>maximumRecordBytes)throw fail('작업 기록을 읽을 수 없습니다. 관리자 확인이 필요합니다.',409);await prepareAdminJobDirectory(folder);
 const temporary=path.join(folder,'.'+id+'.'+randomUUID()+'.tmp'),target=path.join(folder,id+suffix),lockPath=path.join(folder,'.'+id+'.publish.lock');let handle: FileHandle|null|undefined,lock: FileHandle;
 try{lock=await open(lockPath,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);}catch(error){if(hasErrorCode(error,'EEXIST'))throw fail('작업 기록을 읽을 수 없습니다. 관리자 확인이 필요합니다.',409);throw error;}
 try{
  if(progress){
   const previous=await readAdminJobRecord(folder,id,'.pending.json',pendingAdminJob);
   if(previous.startedAt!==snapshot.startedAt||JSON.stringify(previous.command)!==JSON.stringify(snapshot.command))throw fail('작업 기록을 읽을 수 없습니다. 관리자 확인이 필요합니다.',409);
   try{await lstat(path.join(folder,id+'.log.json'));throw fail('작업 기록을 읽을 수 없습니다. 관리자 확인이 필요합니다.',409);}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}
  }else{try{await lstat(target);throw fail('작업 기록을 읽을 수 없습니다. 관리자 확인이 필요합니다.',409);}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}}
  handle=await open(temporary,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);const stat=await handle.stat();if(stat.uid!==process.getuid?.()||(stat.mode&0o077)||!stat.isFile()||stat.nlink!==1)throw fail('작업 기록을 읽을 수 없습니다. 관리자 확인이 필요합니다.',403);
  await handle.writeFile(serialized);await handle.sync();await handle.close();handle=null;
  await rename(temporary,target);
  const directory=await open(folder,constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW);try{await directory.sync();}finally{await directory.close();}
 }finally{await handle?.close();try{await unlink(temporary).catch(error=>{if(!hasErrorCode(error,'ENOENT'))throw error;});}finally{await lock.close();await unlink(lockPath);}}
}
export function completedAdminJob(record: unknown,id: string): CompletedAdminJob{
 const validDate=(value: unknown): value is string=>typeof value==='string'&&Number.isFinite(Date.parse(value));
 if(!object(record)||record.id!==id||(record.status!=='success'&&record.status!=='failed')||!validDate(record.startedAt)||record.finishedAt!==undefined&&!validDate(record.finishedAt)||!Array.isArray(record.command)||record.command[0]!=='/usr/bin/certbot'||record.command.length>64||!record.command.every((value: unknown): value is string=>typeof value==='string'&&value.length<=4096)||!Array.isArray(record.logs)||record.logs.length>500||!record.logs.every((value: unknown): value is string=>typeof value==='string'&&value.length<=8000)||record.exitCode!==null&&(typeof record.exitCode!=='number'||!Number.isInteger(record.exitCode)||record.exitCode<0||record.exitCode>255)||record.status==='success'&&record.exitCode!==0||record.signal!==undefined&&record.signal!==null&&(typeof record.signal!=='string'||!/^SIG[A-Z0-9]{1,16}$/.test(record.signal)))throw fail('작업 기록을 읽을 수 없습니다. 관리자 확인이 필요합니다.',409);
 return {id,command:structuredClone(record.command),status:record.status,logs:structuredClone(record.logs),startedAt:record.startedAt,exitCode:record.exitCode,...(typeof record.finishedAt==='string'?{finishedAt:record.finishedAt}:{}),...(typeof record.signal==='string'||record.signal===null?{signal:record.signal}:{})};
}
function pendingAdminJob(record: unknown,id: string): PendingAdminJob{
 if(!object(record)||record.status!=='running'||record.exitCode!==null||record.finishedAt!==undefined||record.signal!==undefined)throw fail('작업 기록을 읽을 수 없습니다. 관리자 확인이 필요합니다.',409);
 const snapshot=completedAdminJob({...record,status:'failed'},id);return {...snapshot,status:'running',exitCode:null};
}
export async function readPendingAdminJob(folder: string,id: unknown): Promise<RecoveryAdminJob>{
 const record=await readAdminJobRecord(folder,id,'.pending.json',pendingAdminJob);
 return {...record,status:'recovery-required',notice:'서버에서 이 작업의 종료 결과를 확인하지 못했습니다. Certbot 프로세스와 인증서·nginx 상태를 확인하세요. 기존 작업 잠금은 유지되며 자동 재실행하지 않습니다.'};
}
export async function completedAdminJobs(folder: string){
 const jobs: AdminJobSummary[]=[];let warnings=0,truncated=false,scanned=0,bytes=0;
 try{
  const parent=await lstat(folder);if(!parent.isDirectory()||parent.isSymbolicLink()||parent.uid!==process.getuid?.()||(parent.mode&0o022))throw fail('작업 기록을 읽을 수 없습니다. 관리자 확인이 필요합니다.',403);
  for await(const entry of await opendir(folder)){
   if(++scanned>1000){truncated=true;break;}
   const suffix=entry.name.endsWith('.log.json')?'.log.json':entry.name.endsWith('.pending.json')?'.pending.json':null;
   if(!suffix||!uuid.test(entry.name.slice(0,-suffix.length)))continue;
   try{const size=(await lstat(path.join(folder,entry.name))).size;if(bytes+size>32*1024*1024){truncated=true;break;}bytes+=size;
    const id=entry.name.slice(0,-suffix.length),record=await (suffix==='.log.json'?readCompletedAdminJob:readPendingAdminJob)(folder,id);jobs.push({id:record.id,status:record.status,startedAt:record.startedAt,...(record.finishedAt?{finishedAt:record.finishedAt}:{})});
   }catch{warnings++;}
  }
 }catch(error){if(hasErrorCode(error,'ENOENT'))return {jobs:[],warnings:0,truncated:false};throw error;}
 const unique=new Map<string,AdminJobSummary>();for(const job of jobs){const previous=unique.get(job.id);if(!previous||previous.status==='recovery-required')unique.set(job.id,job);}jobs.splice(0,jobs.length,...unique.values());
 jobs.sort((a,b)=>Date.parse(b.finishedAt||b.startedAt)-Date.parse(a.finishedAt||a.startedAt));
 return {jobs:jobs.slice(0,100),warnings,truncated:truncated||jobs.length>100};
}
export async function readCompletedAdminJob(folder: string,id: unknown){return readAdminJobRecord(folder,id,'.log.json',completedAdminJob);}
async function readAdminJobRecord<T extends AdminJobSnapshot>(folder: string,id: unknown,suffix: string,validate: (record: unknown,id: string)=>T): Promise<T>{
 const validId=adminJobId(id);let handle: FileHandle|undefined;
 try{
  let cursor=path.parse(path.resolve(folder)).root;for(const part of path.resolve(folder).slice(cursor.length).split(path.sep).filter(Boolean)){cursor=path.join(cursor,part);const stat=await lstat(cursor);if(!stat.isDirectory()||stat.isSymbolicLink())throw fail('작업 기록을 읽을 수 없습니다. 관리자 확인이 필요합니다.',403);}
  const parent=await lstat(folder);if(parent.uid!==process.getuid?.()||(parent.mode&0o022))throw fail('작업 기록을 읽을 수 없습니다. 관리자 확인이 필요합니다.',403);
  handle=await open(path.join(folder,id+suffix),constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
  const before=await handle.stat();if(!before.isFile()||before.nlink!==1||before.uid!==process.getuid?.()||(before.mode&0o077)||before.size>maximumRecordBytes)throw fail('작업 기록을 읽을 수 없습니다. 관리자 확인이 필요합니다.',403);
  const bytes=Buffer.alloc(before.size+1),{bytesRead}=await handle.read(bytes,0,bytes.length,0),after=await handle.stat();
  if(bytesRead!==before.size||before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ctimeMs!==after.ctimeMs)throw fail('작업 기록을 읽을 수 없습니다. 관리자 확인이 필요합니다.',409);
  let record: unknown;try{record=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,bytesRead)));}catch{throw fail('작업 기록을 읽을 수 없습니다. 관리자 확인이 필요합니다.',409);}
  return validate(record,validId);
 }catch(error){if(object(error)&&error.status)throw error;if(hasErrorCode(error,'ENOENT'))throw fail('관리 작업을 찾을 수 없습니다.',404);throw fail('작업 기록을 읽을 수 없습니다. 관리자 확인이 필요합니다.',403);}finally{await handle?.close();}
}
