import type {Stats} from 'node:fs';
import type {FileHandle} from 'node:fs/promises';
import {hasErrorCode} from './error-code.ts';
import path from 'node:path';
import {open,lstat,link,unlink} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {postgresqlConfigGraph} from './postgresql-config-graph.ts';
import {createPostgresqlGraphArchive} from './postgresql-graph-archive.ts';
import {assertPostgresqlGraphRestoreReview,postgresqlGraphRestoreReviewedContext} from './postgresql-graph-restore-review.ts';
import {postgresqlGraphRestoreContext} from './postgresql-graph-restore-snapshot.ts';
import {postgresqlServiceScope} from './postgresql-code-operation.ts';

const fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 복원 전 설정 백업을 확인하세요.'),{status:409});};
const hash=(text:string)=>createHash('sha256').update(text).digest('hex');
const identity=(stat:Stats)=>({dev:stat.dev,ino:stat.ino,uid:stat.uid,gid:stat.gid,mode:stat.mode&0o777});
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
// Only a registered restore review can authorize this original-configuration backup.
// This writes private backup evidence, never the operating configuration.
export async function createPostgresqlRestoreUndoBackup(value:unknown,backupRoot:string){
 const plan=await assertPostgresqlGraphRestoreReview(value);
 if(plan.files.every(file=>file.action==='unchanged'))return null;
 const ctx=postgresqlGraphRestoreReviewedContext(plan),snapshot=postgresqlGraphRestoreContext(ctx.snapshot);
 if(snapshot.beforeGraph?.complete!==true)return null;
 const graph=await postgresqlConfigGraph(plan.path,{base:ctx.base,ownerUid:ctx.ownerUid});
 const original=graph.files.find(file=>file.path===plan.path),row=snapshot.files.find(file=>file.path===plan.path);
 if(!original||!row?.before.present||original.version!==row.before.version)fail();
 await assertPostgresqlGraphRestoreReview(plan);
 const graphArchive=await createPostgresqlGraphArchive(graph,backupRoot);
 await assertPostgresqlGraphRestoreReview(plan);
 const record={id:randomUUID(),kind:'postgresql',target:path.join(ctx.base,plan.path.slice(5)),text:row.before.text,version:hash(row.before.text),createdAt:new Date().toISOString(),
  context:{version:1,graphVersion:graph.version,graphArchive,scope:postgresqlServiceScope(ctx.service),values:ctx.service.values,restorationOfArchiveId:plan.archiveId}};
 return publishPostgresqlRestoreBackup(record,backupRoot,()=>assertPostgresqlGraphRestoreReview(plan));
}

// Internal publication shared by undo backups and verified completed-history imports.
export async function publishPostgresqlRestoreBackup<T extends {id:string;version:string;context:{graphVersion:string}}>(record:T,backupRoot:string,verify:()=>unknown|Promise<unknown>){
 if(typeof verify!=='function'||!/^([a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12})$/.test(record?.id??''))fail();
 await verify();
 const directory=await open(backupRoot,constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW);
 let file:FileHandle|undefined,fresh=false;
 try{
  const first=await directory.stat();if(first.uid!==process.getuid?.()||(first.mode&0o777)!==0o700||!same(identity(first),identity(await lstat(backupRoot))))fail();
  const child=(name:string)=>`/proc/self/fd/${directory.fd}/${name}`,temporary='.pg-undo-init-'+record.id,bytes=Buffer.from(JSON.stringify(record));
  if(bytes.length>1600000)fail();
  try{file=await open(child(temporary),constants.O_RDWR|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);fresh=true;}
  catch(error){if(!hasErrorCode(error,'EEXIST'))throw error;file=await open(child(temporary),constants.O_RDWR|constants.O_NOFOLLOW|constants.O_NONBLOCK);}
  const allocated=await file.stat();
  if(!allocated.isFile()||allocated.uid!==process.getuid?.()||(allocated.mode&0o777)!==0o600||allocated.nlink!==1||!same(identity(allocated),identity(await lstat(child(temporary)))))fail();
  if(!fresh){
   if(allocated.size!==bytes.length)fail();const existing=Buffer.alloc(bytes.length+1);let offset=0;
   while(offset<existing.length){const result=await file.read(existing,offset,existing.length-offset,offset);if(!result.bytesRead)break;offset+=result.bytesRead;}
   const current=await file.stat();
   if(offset!==bytes.length||!existing.subarray(0,offset).equals(bytes)||!same(identity(allocated),identity(current))||current.nlink!==1||current.size!==allocated.size||current.mtimeMs!==allocated.mtimeMs||current.ctimeMs!==allocated.ctimeMs)fail();
  }
  try{
   if(fresh)await file.writeFile(bytes);await file.sync();
   const checkpoint=await file.stat();await verify();
   const unchanged=(value:Stats)=>({...identity(value),nlink:value.nlink,size:value.size,mtimeMs:value.mtimeMs,ctimeMs:value.ctimeMs});
   if(!same(unchanged(checkpoint),unchanged(await file.stat()))||!same(unchanged(checkpoint),unchanged(await lstat(child(temporary)))))fail();
   if(!same(identity(first),identity(await lstat(backupRoot))))fail();
   await link(child(temporary),child(record.id+'.json'));
   const published=await file.stat(),temporaryStat=await lstat(child(temporary));
   if(!same(identity(published),identity(temporaryStat))||published.nlink!==2||temporaryStat.nlink!==2||published.size!==bytes.length)fail();
   await unlink(child(temporary));await directory.sync();
   const saved=await lstat(child(record.id+'.json')),actual=await file.stat();
   if(!same(identity(first),identity(await lstat(backupRoot)))||!same(identity(saved),identity(actual))||saved.nlink!==1||saved.size!==bytes.length||saved.uid!==process.getuid?.()||(saved.mode&0o777)!==0o600)fail();
   return {id:record.id,version:record.version,graphVersion:record.context.graphVersion};
  }finally{
   const allocated=await file.stat(),named=await lstat(child(temporary)).catch(error=>{if(hasErrorCode(error,'ENOENT'))return null;throw error;});
   if(fresh&&named&&named.dev===allocated.dev&&named.ino===allocated.ino)await unlink(child(temporary));
  }
 }finally{await file?.close();await directory.close();}
}
