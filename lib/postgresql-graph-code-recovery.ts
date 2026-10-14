import type {PostgresqlCodeOptions,PostgresqlRunningService,PostgresqlServiceScope} from './postgresql-code-operation.ts';
import type {RestoreJournal,RestoreJournalBody} from './postgresql-graph-restore-journal.ts';
import type {PostgresqlRestoreServiceContext} from './postgresql-restore-service-context.ts';
import {createHash} from 'node:crypto';
import {assertPostgresqlGraphRestoreJournal,postgresqlGraphRestoreJournalBody,postgresqlGraphRestoreJournalServiceContext,clearPostgresqlGraphRestoreJournal} from './postgresql-graph-restore-journal.ts';
import {inspectPostgresqlGraphPreparation,cancelPostgresqlGraphRestoreStages} from './postgresql-graph-restore-stages.ts';
import {readPostgresqlGraphSwapProgress,assertPostgresqlGraphSwapProgress} from './postgresql-graph-swap-progress.ts';
import {inspectPostgresqlOriginalConfiguration} from './postgresql-original-config-validation.ts';
import {recoverReviewedPostgresqlGraph} from './postgresql-reviewed-graph-recovery.ts';
import {assertPostgresqlRunningService,postgresqlServiceScope,postgresqlValidationValues} from './postgresql-code-operation.ts';

const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 중단 복구 검토가 변경되었습니다.'),{status:409});};
export type RecoveryOptions=PostgresqlCodeOptions&{backupRoot:string;ownerUid:number;inspectRecovery:(target:string)=>unknown|Promise<unknown>;autoVersion:(data:string,ownerUid:number)=>unknown|Promise<unknown>;validateOriginal?:(journal:RestoreJournal,backupRoot:string)=>unknown|Promise<unknown>};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
type RecoveryBase=Record<string,unknown>&{unit:string;controlPid:0};
export type RecoveryState=(RecoveryBase&{activeState:'active';mainPid:number;service:PostgresqlRunningService})|(RecoveryBase&{activeState:'inactive'|'failed';mainPid:0;service?:undefined});
function recoveryState(value:unknown,target:string,scope:PostgresqlServiceScope):value is RecoveryState{
 if(!object(value)||value.unit!==scope.unit||!['active','inactive','failed'].includes(String(value.activeState))||value.controlPid!==0)return false;
 if(value.activeState==='active'){const service=assertPostgresqlRunningService(value.service,target);return value.mainPid===service.pid&&same(postgresqlServiceScope(service),scope);}
 return (value.activeState==='inactive'||value.activeState==='failed')&&value.mainPid===0&&value.service===undefined;
}
export function assertRecoveryRuntime(value:unknown,target:string,scope:PostgresqlServiceScope){if(!recoveryState(value,target,scope))fail();return value;}
type Preparation={phase:'ready'|'intent-only';stageVersion:string|null;stageIdentity:unknown;stagedFiles:number;createdDirectories:number};
function isPreparation(value:unknown):value is Preparation{return object(value)&&(value.phase==='ready'||value.phase==='intent-only')&&(value.phase==='ready'?typeof value.stageVersion==='string':value.stageVersion===null)&&typeof value.stagedFiles==='number'&&Number.isSafeInteger(value.stagedFiles)&&value.stagedFiles>=0&&typeof value.createdDirectories==='number'&&Number.isSafeInteger(value.createdDirectories)&&value.createdDirectories>=0;}
async function serviceState(body:RestoreJournalBody,context:PostgresqlRestoreServiceContext,opts:RecoveryOptions){
 const state=assertRecoveryRuntime(await opts.inspectRecovery(body.target),body.target,context.scope);
 if(!same(await opts.autoVersion(context.scope.data,body.ownerUid),context.scope.autoConfiguration))fail();
 return state;
}
async function snapshot(journal:RestoreJournal,opts:RecoveryOptions){
 await assertPostgresqlGraphRestoreJournal(journal,opts.backupRoot);
 const body=postgresqlGraphRestoreJournalBody(journal),context=postgresqlGraphRestoreJournalServiceContext(journal);
 const candidate:unknown=await inspectPostgresqlGraphPreparation(journal,opts.backupRoot);
 if(candidate!==null){if(!isPreparation(candidate))fail();const preparation=candidate;
  const service=await serviceState(body,context,opts);
  if(service.activeState==='active'&&(!same(service.service.values,context.originalValues)||service.service.configurationErrors!==0))fail();
  return {body,context,preparation,service,version:hash({journalVersion:journal.version,journalIdentity:journal.identity,preparation,service})};
 }
 const progress=await readPostgresqlGraphSwapProgress(journal,opts.backupRoot);
 if(!progress||!['applying','activating','rolling-back','rolled-back'].includes(progress.data.phase))fail();
 const service=await serviceState(body,context,opts);
 await assertPostgresqlGraphSwapProgress(progress);
 return {body,context,progress,service,version:hash({journalVersion:journal.version,journalIdentity:journal.identity,progress,service})};
}
async function validated(journal:RestoreJournal,opts:RecoveryOptions){
 const before=await snapshot(journal,opts);
 const validation=await (opts.validateOriginal??inspectPostgresqlOriginalConfiguration)(journal,opts.backupRoot);
 if(!object(validation)||validation.source!=='private-journal-original-config'||validation.originalGraphVersion!==before.body.beforeGraph?.version||typeof validation.graphVersion!=='string'||!/^[a-f0-9]{64}$/.test(validation.graphVersion))fail();
 const values=postgresqlValidationValues(validation,{version:validation.graphVersion});
 if(!same(values,before.context.originalValues))fail();
 const after=await snapshot(journal,opts);if(after.version!==before.version)fail();
 return {...after,values};
}
// Public review contains paths and hashes only; recorded configuration text stays private.
export async function postgresqlGraphCodeRecoveryPlan(value:unknown,opts:RecoveryOptions){
 const journal=await assertPostgresqlGraphRestoreJournal(value,opts.backupRoot);const state=await validated(journal,opts),body=state.body;
 if(state.preparation)return {path:body.target,recoveryRequired:true,kind:'postgresql-stage-cancellation',backupId:body.archiveId,historyId:journal.record.id,
  phase:state.preparation.phase,files:body.files.map(row=>({path:row.path,action:'preserve'})),
  stagedFiles:state.preparation.stagedFiles,createdDirectories:state.preparation.createdDirectories,
  service:{unit:state.service.unit,activeState:state.service.activeState},serviceRestartRequired:false,
  validation:{valid:true,scope:'private-config-options',values:state.values,operatingServiceChanged:false},
  operatingConfigurationChanged:false,filesystemRecoveryVerified:false,reviewVersion:state.version};
 if(!state.progress)fail();
 return {path:body.target,recoveryRequired:true,kind:'postgresql-include-graph',backupId:body.archiveId,historyId:journal.record.id,phase:state.progress.data.phase,
  files:body.files.map(row=>({path:row.path,action:row.before.present?(row.after.present?'restore':'create'):'remove'})),
  service:{unit:state.service.unit,activeState:state.service.activeState},validation:{valid:true,scope:'private-config-options',values:state.values,operatingServiceChanged:false},
  filesystemRecoveryVerified:false,reviewVersion:state.version};
}
export async function recoverPostgresqlGraphCode(value:unknown,reviewVersion:string,opts:RecoveryOptions){
 const journal=await assertPostgresqlGraphRestoreJournal(value,opts.backupRoot);const state=await validated(journal,opts);if(state.version!==reviewVersion)fail();
 if(state.preparation){
  const cleanup:unknown=state.preparation.phase==='ready'?await cancelPostgresqlGraphRestoreStages(journal,opts.backupRoot,{expectedVersion:state.preparation.stageVersion??undefined}):{removedFiles:0,removedDirectories:0};
  if(!object(cleanup)||typeof cleanup.removedFiles!=='number'||typeof cleanup.removedDirectories!=='number')fail();
  const after=await validated(journal,opts);
  if(after.preparation?.phase!=='intent-only'||!same(after.service,state.service)||!same(after.values,state.values))fail();
  await clearPostgresqlGraphRestoreJournal(state.body.target,journal,opts.backupRoot,{base:state.body.base,ownerUid:state.body.ownerUid});
  return {kind:'postgresql-stage-cancellation',preparationCancelled:true,recovered:true,restored:false,
   journalId:journal.record.id,historyId:journal.record.id,journalCleanupVerified:true,
   removedFiles:cleanup.removedFiles,removedDirectories:cleanup.removedDirectories,
   operatingConfigurationChanged:false,operatingServiceChanged:false,serviceRestarted:false};
 }
 const output=await recoverReviewedPostgresqlGraph(journal,opts.backupRoot,{
  control:opts.control,inspectService:opts.inspectService,
  inspectRecovery:()=>serviceState(state.body,state.context,opts),
  validateOriginal:async()=>{const current=await validated(journal,opts);if(current.version!==reviewVersion)fail();return {valid:true,scope:'private-config-options',source:'private-journal-original-config',namespaceCommandsCompleted:true,operatingConfigurationChanged:false,operatingServiceChanged:false,postmasterStarted:false};}
 });
 return {...output,restored:true,recovered:true,historyId:output.journalId,journalCleanupVerified:'retention' in output&&output.retention.activeIntentCleared===true};
}
