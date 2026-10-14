import type {PostgresqlGraphArchive} from './postgresql-graph-archive.ts';
import {hasErrorCode} from './error-code.ts';
import {postgresqlWorkDirectory} from './postgresql-work-directory.ts';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {mkdir,writeFile,chown,chmod,lstat,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {completedPostgresqlGraphRestoreIds,readCompletedPostgresqlGraphRestoreJournal,assertPostgresqlGraphRestoreJournal,postgresqlGraphRestoreJournalBody,postgresqlGraphRestoreJournalServiceContext} from './postgresql-graph-restore-journal.ts';
import {readPostgresqlGraphSwapProgress,assertPostgresqlGraphSwapProgress} from './postgresql-graph-swap-progress.ts';
import {postgresqlConfigGraph,postgresqlConfigRoot} from './postgresql-config-graph.ts';
import {createPostgresqlGraphArchive,readPostgresqlGraphArchive} from './postgresql-graph-archive.ts';
import {inspectPostgresqlGraphArchive} from './postgresql-archive-candidate.ts';
import {postgresqlValidationValues} from './postgresql-code-operation.ts';
import {postgresqlRecoveryBackup,postgresqlPendingBackup} from './postgresql-recovery-backup.ts';
import {publishPostgresqlRestoreBackup} from './postgresql-restore-undo-backup.ts';

const hash=(text:string)=>createHash('sha256').update(text).digest('hex');
const fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 완료 기록을 다시 검토하세요.'),{status:409});};
export type HistoryInput={path:string};
export type HistoryImportInput=HistoryInput&{id:string;version:string;confirm:true};
export type HistoryOptions={backupRoot:string;base?:string;ownerUid?:number;validateArchive?:(archive:PostgresqlGraphArchive)=>unknown|Promise<unknown>};
export type HistoryRow={id:string;path:string;version:string;createdAt:string;phase:'committed'|'rolled-back';fileCount:number;backupAvailable:boolean};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
export function preparePostgresqlHistory(input:unknown,importBackup?:false):HistoryInput;
export function preparePostgresqlHistory(input:unknown,importBackup:true):HistoryImportInput;
export function preparePostgresqlHistory(input:unknown,importBackup=false):HistoryInput|HistoryImportInput{
 if(!object(input)||Object.keys(input).some(key=>!(importBackup?['path','id','version','confirm']:['path']).includes(key)))fail();
 if(typeof input.path!=='string')fail();postgresqlConfigRoot(input.path);
 if(importBackup){if(typeof input.id!=='string'||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(input.id)||typeof input.version!=='string'||!/^[a-f0-9]{64}$/.test(input.version)||input.confirm!==true)fail();return {path:input.path,id:input.id,version:input.version,confirm:true};}
 return {path:input.path};
}
async function completed(target:string,id:string,opts:HistoryOptions){
 const journal=await readCompletedPostgresqlGraphRestoreJournal(target,id,opts.backupRoot,opts);if(!journal)return null;
 const progress=await readPostgresqlGraphSwapProgress(journal,opts.backupRoot);
 if(!progress)fail();const phase=progress.data.phase;if(phase!=='committed'&&phase!=='rolled-back')fail();
 return {journal,progress,phase,body:postgresqlGraphRestoreJournalBody(journal)};
}
export async function postgresqlCompletedHistory(input:unknown,opts:HistoryOptions){
 const {path:target}=preparePostgresqlHistory(input),catalog=await completedPostgresqlGraphRestoreIds(target,opts.backupRoot);
 let warnings=0;const records:HistoryRow[]=[];
 for(const id of catalog.ids.slice(0,100))try{
  const state=await completed(target,id,opts);if(!state)continue;
  records.push({id,path:target,version:state.journal.version,createdAt:state.journal.record.createdAt,phase:state.phase,fileCount:state.body.beforeGraph?.files.length??0,backupAvailable:state.body.beforeGraph?.complete===true&&state.journal.record.format==='postgresql-graph-restore-intent-v3'});
 }catch{warnings++;}
 records.sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
 return {path:target,records,warnings,truncated:catalog.truncated||catalog.ids.length>100};
}
export async function importPostgresqlCompletedBackup(value:unknown,opts:HistoryOptions){
 const input=preparePostgresqlHistory(value,true);const state=await completed(input.path,input.id,opts);
 if(!state||state.journal.version!==input.version||state.body.beforeGraph?.complete!==true)fail();
 const verifiedState=state;
 const scope=postgresqlGraphRestoreJournalServiceContext(state.journal).scope;
 const physical=path.join(opts.base??'/etc',input.path.slice(5));
 async function unchanged(){await assertPostgresqlGraphRestoreJournal(verifiedState.journal,opts.backupRoot);await assertPostgresqlGraphSwapProgress(verifiedState.progress);}
 async function validated(reference:unknown){
  await unchanged();const archive=await readPostgresqlGraphArchive(reference,opts.backupRoot,input.path);
  const result=await (opts.validateArchive??inspectPostgresqlGraphArchive)(archive),values=postgresqlValidationValues(result,archive.graph);await unchanged();return {archive,values};
 }
 const metadata=await lstat(path.join(opts.backupRoot,input.id+'.json')).catch(error=>{if(hasErrorCode(error,'ENOENT'))return null;throw error;});
 if(metadata){
  const existing=await postgresqlRecoveryBackup(input.id,opts.backupRoot,input.path,{file:physical});
  if(existing.context.completedHistoryVersion!==input.version)fail();
  await validated(existing.context.graphArchive);return {id:existing.id,path:input.path,created:false,operatingConfigurationChanged:false,operatingServiceChanged:false};
 }
 const pendingFile=await lstat(path.join(opts.backupRoot,'.pg-undo-init-'+input.id)).catch(error=>{if(hasErrorCode(error,'ENOENT'))return null;throw error;});
 const pending=pendingFile?await postgresqlPendingBackup(input.id,opts.backupRoot,input.path,{file:physical}):null;
 if(pending){
  if(pending.context.completedHistoryVersion!==input.version||!isDeepStrictEqual(pending.context.scope,scope))fail();
  const {archive,values}=await validated(pending.context.graphArchive),original=state.body.beforeGraph;
  if(!isDeepStrictEqual(archive.graph.files,original.files)||!isDeepStrictEqual(archive.graph.missing,original.missing)||!isDeepStrictEqual(archive.graph.directories,original.directories.map(({path,names,version})=>({path,names,version})))||!isDeepStrictEqual(values,pending.context.values))fail();
  await publishPostgresqlRestoreBackup(pending,opts.backupRoot,unchanged);
  return {id:pending.id,path:input.path,created:true,operatingConfigurationChanged:false,operatingServiceChanged:false};
 }
 const base=await postgresqlWorkDirectory('tastedev-pg-history-'),allocated=await lstat(base);
 try{
  const original=state.body.beforeGraph;
  for(const entry of original.files){
   const row=state.body.files.find(row=>row.path===entry.path);
   if(!row?.before.present||row.before.version!==entry.version)fail();
   const file=path.join(base,entry.path.slice(5));await mkdir(path.dirname(file),{recursive:true,mode:0o700});await writeFile(file,row.before.text,{mode:0o600,flag:'wx'});
   await chown(file,row.before.attributes.uid,row.before.attributes.gid);await chmod(file,row.before.attributes.mode);
  }
  for(const dir of original.directories)await mkdir(path.join(base,dir.path.slice(5)),{recursive:true,mode:0o700});
  const graph=await postgresqlConfigGraph(input.path,{base,ownerUid:state.body.ownerUid});
  if(JSON.stringify(graph.files)!==JSON.stringify(original.files)||JSON.stringify(graph.missing)!==JSON.stringify(original.missing)||JSON.stringify(graph.directories)!==JSON.stringify(original.directories.map(({path,names,version})=>({path,names,version}))))fail();
  await unchanged();const graphArchive=await createPostgresqlGraphArchive(graph,opts.backupRoot),{archive,values}=await validated(graphArchive);
  const text=archive.sources.find(file=>file.path===input.path)?.text;if(typeof text!=='string')fail();
  const record={id:input.id,kind:'postgresql',target:physical,text,version:hash(text),createdAt:new Date().toISOString(),context:{version:1,graphVersion:graph.version,graphArchive,scope,values,completedHistoryVersion:input.version}};
  await publishPostgresqlRestoreBackup(record,opts.backupRoot,unchanged);
  return {id:record.id,path:input.path,created:true,operatingConfigurationChanged:false,operatingServiceChanged:false};
 }finally{const current=await lstat(base);if(!current.isDirectory()||current.isSymbolicLink()||current.dev!==allocated.dev||current.ino!==allocated.ino||current.uid!==allocated.uid)fail();await rm(base,{recursive:true,force:true});}
}
