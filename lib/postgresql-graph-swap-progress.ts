import type {Stats} from 'node:fs';
import type {FileHandle} from 'node:fs/promises';
import type {RestoreJournal,RestoreJournalBody} from './postgresql-graph-restore-journal.ts';
import type {RestoreFileIdentity,RestoreFileAttributes,RestoreFileRow} from './postgresql-graph-restore-snapshot.ts';
import {hasErrorCode} from './error-code.ts';
import path from 'node:path';
import {open,lstat} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash} from 'node:crypto';
import {postgresqlGraphRestoreRecoveryContext} from './postgresql-graph-restore-stages.ts';
import {assertPostgresqlGraphRestoreJournal,postgresqlGraphRestoreJournalBody} from './postgresql-graph-restore-journal.ts';

export type SwapRow={path:string;undoName:string;originalMoved:boolean;candidateLinked:boolean;candidatePlaced:boolean;originalRestored:boolean;candidateRetired:boolean};
export type SwapData={format:'postgresql-graph-swap-v2'|'postgresql-graph-swap-v3';journalId:string;journalVersion:string;stageVersion:string;target:string;phase:'applying'|'activating'|'committed'|'rolling-back'|'rolled-back';rows:SwapRow[]};
export type StageFile={path:string;name:string;version:string;attributes:RestoreFileAttributes;identity:RestoreFileIdentity;ready:boolean};
export type StageDirectory={path:string;uid:number;gid:number;mode:number;identity:{dev:number;ino:number}};
export type RestoreStageContext={body:RestoreJournalBody;stages:{format:string;journalId:string;journalVersion:string;target:string;phase:string;directories:StageDirectory[];files:StageFile[]};stageVersion:string;stageIdentity:RestoreFileIdentity;root:string;journalId:string;journalVersion:string};
type DirectoryIdentity=ReturnType<typeof directory>;
export type SwapProgress={data:SwapData;identity:RestoreFileIdentity;version:string;custodyIdentity:DirectoryIdentity;stageVersion:string;stageIdentity:RestoreFileIdentity};
type Registration={progress:SwapProgress;proof:string;journal:RestoreJournal;backupRoot:string;ctx:RestoreStageContext;operationRoot:string};
const records=new WeakMap<object,Registration>(),hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 여러 파일 복원 기록을 확인하세요.'),{status:409});};
const exact=(value:unknown,keys:readonly string[]):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
const identity=(stat:Stats):RestoreFileIdentity=>({dev:stat.dev,ino:stat.ino,uid:stat.uid,gid:stat.gid,mode:stat.mode,nlink:stat.nlink,size:stat.size,mtimeMs:stat.mtimeMs,ctimeMs:stat.ctimeMs});
const directory=(stat:Stats)=>({dev:stat.dev,ino:stat.ino,uid:stat.uid,gid:stat.gid,mode:stat.mode&0o777});
const changed=(row:RestoreFileRow)=>row.before.present!==row.after.present||row.before.present&&row.after.present&&(row.before.version!==row.after.version||!same(row.before.attributes,row.after.attributes));

function swapRow(value:Record<string,unknown>):value is Record<string,unknown>&SwapRow{return typeof value.path==='string'&&typeof value.undoName==='string'&&['originalMoved','candidateLinked','candidatePlaced','originalRestored','candidateRetired'].every(key=>typeof value[key]==='boolean');}
function swapData(value:Record<string,unknown>):value is Record<string,unknown>&SwapData{return (value.format==='postgresql-graph-swap-v2'||value.format==='postgresql-graph-swap-v3')&&typeof value.journalId==='string'&&typeof value.journalVersion==='string'&&typeof value.stageVersion==='string'&&typeof value.target==='string'&&typeof value.phase==='string'&&['applying','activating','committed','rolling-back','rolled-back'].includes(value.phase)&&Array.isArray(value.rows)&&value.rows.every(row=>exact(row,['path','undoName','originalMoved','candidateLinked','candidatePlaced','originalRestored','candidateRetired'])&&swapRow(row));}

export function validatePostgresqlGraphSwapProgress(data:unknown,ctx:Pick<RestoreStageContext,'journalId'|'journalVersion'|'stageVersion'|'body'>):SwapData{
 if(!exact(data,['format','journalId','journalVersion','stageVersion','target','phase','rows'])||!['postgresql-graph-swap-v2','postgresql-graph-swap-v3'].includes(String(data.format))||data.journalId!==ctx.journalId||data.journalVersion!==ctx.journalVersion||data.stageVersion!==ctx.stageVersion||data.target!==ctx.body.target||!['applying','activating','committed','rolling-back','rolled-back'].includes(String(data.phase))||!Array.isArray(data.rows)||data.rows.length>300)fail();
 const expected=ctx.body.files.filter(changed),names=new Set();if(expected.length!==data.rows.length)fail();
 for(let index=0;index<expected.length;index++){
  const row:unknown=data.rows[index],source=expected[index],flags=['originalMoved','candidateLinked','candidatePlaced','originalRestored','candidateRetired'];
  if(!exact(row,['path','undoName',...flags])||row.path!==source.path||typeof row.undoName!=='string'||!/^\.tastedev-pg-undo-[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(row.undoName)||names.has(row.undoName)||!swapRow(row))fail();names.add(row.undoName);
  if(row.originalMoved&&!source.before.present||row.candidateLinked&&!source.after.present||row.candidatePlaced&&!row.candidateLinked||row.candidateRetired&&!row.candidatePlaced||row.originalRestored&&!row.originalMoved||row.candidateLinked&&source.before.present&&!row.originalMoved||row.originalRestored&&row.candidateLinked&&!row.candidateRetired)fail();
  if(['applying','activating','committed'].includes(String(data.phase))&&(row.originalRestored||row.candidateRetired))fail();
  if(['activating','committed'].includes(String(data.phase))&&(row.originalMoved!==source.before.present||row.candidateLinked!==source.after.present||row.candidatePlaced!==source.after.present))fail();
  if(data.phase==='rolled-back'&&(row.originalMoved&&!row.originalRestored||row.candidateLinked&&!row.candidateRetired))fail();
 }
 if(!swapData(data))fail();return data;
}

function object(value:unknown):value is Record<string,unknown>{return value!==null&&typeof value==='object'&&!Array.isArray(value);}
function fileIdentity(value:unknown):value is RestoreFileIdentity{return object(value)&&['dev','ino','uid','gid','mode','nlink','size'].every(key=>typeof value[key]==='number'&&Number.isSafeInteger(value[key])&&value[key]>=0)&&typeof value.mtimeMs==='number'&&Number.isFinite(value.mtimeMs)&&typeof value.ctimeMs==='number'&&Number.isFinite(value.ctimeMs);}
function attrs(value:unknown):value is RestoreFileAttributes&Record<string,unknown>{return object(value)&&['uid','gid','mode'].every(key=>typeof value[key]==='number'&&Number.isSafeInteger(value[key])&&value[key]>=0);}
function stageFile(value:unknown):value is StageFile{return object(value)&&typeof value.path==='string'&&typeof value.name==='string'&&typeof value.version==='string'&&attrs(value.attributes)&&fileIdentity(value.identity)&&value.ready===true;}
function stageDirectory(value:unknown):value is StageDirectory{return object(value)&&typeof value.path==='string'&&attrs(value)&&object(value.identity)&&typeof value.identity.dev==='number'&&Number.isSafeInteger(value.identity.dev)&&typeof value.identity.ino==='number'&&Number.isSafeInteger(value.identity.ino);}
function stageData(value:unknown):value is RestoreStageContext['stages']{return object(value)&&typeof value.format==='string'&&typeof value.journalId==='string'&&typeof value.journalVersion==='string'&&typeof value.target==='string'&&value.phase==='ready'&&Array.isArray(value.files)&&value.files.every(stageFile)&&Array.isArray(value.directories)&&value.directories.every(stageDirectory);}
export function assertRestoreStageContext(value:unknown,journal:RestoreJournal):RestoreStageContext{
 const body=postgresqlGraphRestoreJournalBody(journal);
 if(!object(value)||!same(value.body,body)||!stageData(value.stages)||!fileIdentity(value.stageIdentity)||typeof value.stageVersion!=='string'||typeof value.root!=='string'||value.journalId!==journal.record.id||value.journalVersion!==journal.version)fail();
 return {body,stages:value.stages,stageVersion:value.stageVersion,stageIdentity:value.stageIdentity,root:value.root,journalId:journal.record.id,journalVersion:journal.version};
}

async function recoveryContext(journal:RestoreJournal,backupRoot:string){return assertRestoreStageContext(await postgresqlGraphRestoreRecoveryContext(journal,backupRoot),journal);}

export async function readPostgresqlGraphSwapProgress(value:unknown,backupRoot:string){
 const journal=await assertPostgresqlGraphRestoreJournal(value,backupRoot);const ctx=await recoveryContext(journal,backupRoot),operationRoot=path.join(ctx.root,ctx.journalId+'.swap');let rootFd:FileHandle|undefined,custodyFd:FileHandle|undefined,fileFd:FileHandle|undefined;
 try{
  rootFd=await open(ctx.root,constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW);const rootStat=await rootFd.stat();if(!rootStat.isDirectory()||rootStat.uid!==process.getuid?.()||(rootStat.mode&0o777)!==0o700||!same(directory(rootStat),directory(await lstat(ctx.root))))fail();
  const custodyPath=`/proc/self/fd/${rootFd.fd}/${ctx.journalId}.swap`;
  try{custodyFd=await open(custodyPath,constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW);}catch(error){if(hasErrorCode(error,'ENOENT'))return null;throw error;}
  const custodyStat=await custodyFd.stat();if(!custodyStat.isDirectory()||custodyStat.uid!==process.getuid?.()||(custodyStat.mode&0o777)!==0o700||!same(directory(custodyStat),directory(await lstat(custodyPath))))fail();
  const file=`/proc/self/fd/${custodyFd.fd}/progress.json`;fileFd=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);const before=await fileFd.stat();
  if(!before.isFile()||before.nlink!==1||before.uid!==process.getuid?.()||(before.mode&0o777)!==0o600||before.size>262144)fail();
  const bytes=Buffer.alloc(before.size+1);let size=0;while(size<bytes.length){const result=await fileFd.read(bytes,size,bytes.length-size,null);if(!result.bytesRead)break;size+=result.bytesRead;}
  if(size!==before.size||!same(identity(before),identity(await fileFd.stat()))||!same(identity(before),identity(await lstat(file)))||!same(directory(rootStat),directory(await lstat(ctx.root)))||!same(directory(custodyStat),directory(await lstat(custodyPath))))fail();
  let record:unknown;try{record=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,size)));}catch{fail();}
  if(!exact(record,['data','digest'])||record.digest!==hash(JSON.stringify(record.data)))fail();const data=validatePostgresqlGraphSwapProgress(record.data,ctx);await assertPostgresqlGraphRestoreJournal(journal,backupRoot);const latest=await recoveryContext(journal,backupRoot);if(latest.stageVersion!==ctx.stageVersion||!same(latest.stageIdentity,ctx.stageIdentity)||!same(identity(before),identity(await fileFd.stat()))||!same(identity(before),identity(await lstat(file)))||!same(directory(rootStat),directory(await lstat(ctx.root)))||!same(directory(custodyStat),directory(await lstat(custodyPath))))fail();
  const result:SwapProgress={data,identity:identity(before),version:hash(bytes.subarray(0,size)),custodyIdentity:directory(custodyStat),stageVersion:ctx.stageVersion,stageIdentity:ctx.stageIdentity};
  records.set(result,{progress:result,proof:hash(JSON.stringify(result)),journal,backupRoot,ctx,operationRoot});return result;
 }finally{await fileFd?.close();await custodyFd?.close();await rootFd?.close();}
}
function registered(progress:unknown){if(progress===null||typeof progress!=='object')fail();const record=records.get(progress);if(!record||record.proof!==hash(JSON.stringify(progress)))fail();return record;}
export function postgresqlGraphSwapProgressSummary(value:unknown){const progress=registered(value).progress;return {id:progress.data.journalId,path:progress.data.target,phase:progress.data.phase,version:progress.version,fileCount:progress.data.rows.length,recordVerified:true,filesystemRecoveryVerified:false};}
export function postgresqlGraphSwapProgressContext(value:unknown){const record=registered(value),progress=record.progress;return structuredClone({...record.ctx,operationRoot:record.operationRoot,data:progress.data,identity:progress.identity,version:progress.version,custodyIdentity:progress.custodyIdentity});}
export async function assertPostgresqlGraphSwapProgress(value:unknown){const record=registered(value),progress=record.progress,current=await readPostgresqlGraphSwapProgress(record.journal,record.backupRoot);if(!current||current.version!==progress.version||!same(current.identity,progress.identity)||!same(current.custodyIdentity,progress.custodyIdentity)||current.stageVersion!==progress.stageVersion||!same(current.stageIdentity,progress.stageIdentity))fail();return progress;}

// Recovery's own progress writes do not invalidate the immutable intent/stage
// binding. This does not waive filesystem or progress-writer checks.
export async function assertPostgresqlGraphSwapIntent(progress:unknown){const record=registered(progress);await assertPostgresqlRestoreBinding(record);}
async function assertPostgresqlRestoreBinding(record:Registration){await assertPostgresqlGraphRestoreJournal(record.journal,record.backupRoot);const current=await recoveryContext(record.journal,record.backupRoot);if(current.stageVersion!==record.ctx.stageVersion||!same(current.stageIdentity,record.ctx.stageIdentity))fail();}
