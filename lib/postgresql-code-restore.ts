import type {PostgresqlCodeOptions,PostgresqlRunningService,PostgresqlPublicValues} from './postgresql-code-operation.ts';
import type {PostgresqlGraphArchive} from './postgresql-graph-archive.ts';
import {assertPostgresqlRunningService} from './postgresql-code-operation.ts';
import {createPostgresqlRestoreUndoBackup} from './postgresql-restore-undo-backup.ts';
import {inspectPostgresqlGraphArchive} from './postgresql-archive-candidate.ts';
import {readPostgresqlGraphArchive} from './postgresql-graph-archive.ts';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {postgresqlConfigRoot,postgresqlConfigGraph} from './postgresql-config-graph.ts';
import {postgresqlRecoveryBackup} from './postgresql-recovery-backup.ts';
import {postgresqlCodeOperationPlan,applyPostgresqlCodeOperation,postgresqlCodeDependencies,postgresqlServiceScope} from './postgresql-code-operation.ts';
import {postgresqlCodeReviewVersion} from './postgresql-code-request.ts';
import {reviewPostgresqlGraphRestore} from './postgresql-graph-restore-review.ts';
import {applyReviewedPostgresqlGraphRestore} from './postgresql-reviewed-graph-restore.ts';
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 백업 복원 검토가 변경되었습니다.'),{status:409});};
const proofKeys=['version','graphVersion','candidateGraphVersion','serviceVersion','backupVersion','backupIdentity','reviewVersion'] as const;
type ProofKey=typeof proofKeys[number];
export type RestoreInput={path:string;id:string}&Partial<Record<ProofKey,string>>;
export type RestoreCommit=RestoreInput&Record<ProofKey,string>&{confirm:true};
export type RestoreOptions=PostgresqlCodeOptions&{validateArchive?:(archive:PostgresqlGraphArchive)=>unknown|Promise<unknown>;inspectRecovery?:()=>unknown|Promise<unknown>};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function committed(value:RestoreInput):value is RestoreInput&Record<ProofKey,string>{return proofKeys.every(key=>typeof value[key]==='string');}
function valueKey(key:string):key is keyof PostgresqlPublicValues{return ['port','max_connections','shared_buffers','work_mem','logging_collector'].includes(key);}
export function preparePostgresqlCodeRestore(input:unknown,commit?:false):RestoreInput;
export function preparePostgresqlCodeRestore(input:unknown,commit:true):RestoreCommit;
export function preparePostgresqlCodeRestore(input:unknown,commit:boolean):RestoreInput|RestoreCommit;
export function preparePostgresqlCodeRestore(input:unknown,commit=false):RestoreInput|RestoreCommit{
 if(!object(input)||Object.keys(input).some(key=>!['path','id',...proofKeys,'confirm'].includes(key))||typeof input.id!=='string'||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(input.id??''))fail();
 if(typeof input.path!=='string')fail();postgresqlConfigRoot(input.path);
 for(const key of proofKeys)if(input[key]!==undefined&&(typeof input[key]!=='string'||!/^[a-f0-9]{64}$/.test(input[key])))fail();
 if(commit&&(input.confirm!==true||proofKeys.some(key=>typeof input[key]!=='string')))fail();
 const result:RestoreInput={path:input.path,id:input.id};for(const key of proofKeys){const value=input[key];if(value!==undefined){if(typeof value!=='string')fail();result[key]=value;}}
 if(commit){if(!committed(result))fail();return {...result,confirm:true};}return result;
}
function review(input:RestoreInput){return hash([input.path,input.id,...proofKeys.filter(key=>key!=='reviewVersion').map(key=>input[key])]);}
async function context(input:RestoreInput,dependencies:RestoreOptions){
 const options=postgresqlCodeDependencies(dependencies);if(typeof options.backupRoot!=='string')fail();const opts={...options,backupRoot:options.backupRoot},file=path.join(opts.base??'/etc',input.path.slice(5));
 const read=()=>postgresqlRecoveryBackup(input.id,opts.backupRoot,input.path,{file});
 const record=await read(),identity=hash(record);
 async function unchanged(){if(hash(await read())!==identity)fail();}
 let serviceSnapshot:unknown;
 const checked={...opts,validate:async(...args:[string,string])=>{await unchanged();if(args[0]!==input.path||args[1]!==record.text)fail();const result=record.context.graphArchive&&!dependencies.validate?await inspectPostgresqlGraphArchive(await readPostgresqlGraphArchive(record.context.graphArchive,opts.backupRoot,input.path)):await opts.validate(...args);await unchanged();return result;},inspectService:async(...args:[string])=>{await unchanged();const service=await opts.inspectService(...args);if(JSON.stringify(postgresqlServiceScope(service))!==JSON.stringify(postgresqlServiceScope(record.context.scope)))fail();await unchanged();serviceSnapshot=service;return service;}};
 return {record,identity,checked,unchanged,service:()=>assertPostgresqlRunningService(serviceSnapshot,input.path)};
}
async function graphPlan(prepared:RestoreInput,ctx:Awaited<ReturnType<typeof context>>,dependencies:RestoreOptions){
 const {record,identity,checked,unchanged}=ctx;
 const archive=await readPostgresqlGraphArchive(record.context.graphArchive,checked.backupRoot,prepared.path);
 const plan=await reviewPostgresqlGraphRestore(archive,{base:checked.base,ownerUid:checked.ownerUid,archiveScope:record.context.scope,inspectService:checked.inspectService,validateArchive:async archive=>{await unchanged();const result=await (dependencies.validateArchive??inspectPostgresqlGraphArchive)(archive);await unchanged();return result;}});
 const result={...plan,id:prepared.id,version:plan.files.find(file=>file.path===prepared.path)?.beforeVersion??hash(null),graphVersion:plan.snapshotVersion,candidateGraphVersion:plan.archiveGraphVersion,changed:plan.files.some(file=>file.action!=='unchanged'),backupVersion:record.version,backupIdentity:identity};
 result.reviewVersion=review(result);return {result,plan};
}
export async function postgresqlCodeRestorePlan(input:unknown,dependencies:RestoreOptions={}){
 const prepared=preparePostgresqlCodeRestore(input),ctx=await context(prepared,dependencies),{record,identity,checked,service}=ctx;
 if(record.context.graphArchive)return (await graphPlan(prepared,ctx,dependencies)).result;
 // Read the current graph through the existing operation planner, using its main-file hash.
 const graph=await postgresqlConfigGraph(prepared.path,{base:checked.base,ownerUid:checked.ownerUid});
 const version=graph.files.find(file=>file.path===prepared.path)?.version;
 const plan=await postgresqlCodeOperationPlan({path:prepared.path,version,text:record.text},checked);
 if(plan.candidateGraphVersion!==record.context.graphVersion)fail();
 const fields=Object.keys(plan.validation.values).filter(valueKey).map(key=>({key,before:service().values[key],after:plan.validation.values[key]}));
 const result={...plan,id:prepared.id,backupVersion:record.version,backupIdentity:identity,fields};
 result.reviewVersion=review(result);return result;
}
export async function restorePostgresqlCode(input:unknown,dependencies:RestoreOptions={}){
 const prepared=preparePostgresqlCodeRestore(input,true),ctx=await context(prepared,dependencies),{record,identity,checked}=ctx;
 if(prepared.backupIdentity!==identity||prepared.backupVersion!==record.version||prepared.candidateGraphVersion!==record.context.graphVersion||prepared.reviewVersion!==review(prepared))fail();
 if(record.context.graphArchive){
  const {result,plan}=await graphPlan(prepared,ctx,dependencies);
  if(proofKeys.some(key=>prepared[key]!==result[key]))fail();
  const undoBackup=await createPostgresqlRestoreUndoBackup(plan,checked.backupRoot);
  const output=await applyReviewedPostgresqlGraphRestore(plan,checked.backupRoot,{control:checked.control,...(dependencies.inspectRecovery?{inspectRecovery:dependencies.inspectRecovery}:{})});
  return {...output,...(undoBackup?{backupId:undoBackup.id}:{}),undoBackupAvailable:Boolean(undoBackup),changed:output.changedFiles>0,historyId:'journalId' in output?output.journalId:null,journalCleanupVerified:output.phase==='unchanged'||'retention' in output&&output.retention.activeIntentCleared===true};
 }
 const payload={path:prepared.path,text:record.text,version:prepared.version,graphVersion:prepared.graphVersion,candidateGraphVersion:prepared.candidateGraphVersion,serviceVersion:prepared.serviceVersion,confirm:true};
 const code={...payload,reviewVersion:postgresqlCodeReviewVersion(payload)};
 return applyPostgresqlCodeOperation(code,checked);
}
