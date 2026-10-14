import type {PostgresqlCodeOptions} from './postgresql-code-operation.ts';
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
type InspectService=(target:string)=>unknown|Promise<unknown>;
type InspectRecovery=()=>unknown|Promise<unknown>;
import type {RestoreJournal} from './postgresql-graph-restore-journal.ts';
type RecoverOptions={control?:PostgresqlCodeOptions['control'];inspectService?:InspectService;inspectRecovery?:InspectRecovery;validateOriginal?:(journal:RestoreJournal,backupRoot:string)=>unknown|Promise<unknown>;retainCompleted?:boolean};
export type GraphRecoveryResult={journalId:string;phase:'rolled-back';filesystemRecoveryVerified:true;serviceCoordinatorInvoked:boolean;intentPreserved:true};
function recovered(value:unknown):value is GraphRecoveryResult{return object(value)&&typeof value.journalId==='string'&&value.phase==='rolled-back'&&value.filesystemRecoveryVerified===true&&typeof value.serviceCoordinatorInvoked==='boolean'&&value.intentPreserved===true;}
import {assertPostgresqlGraphRestoreJournal,postgresqlGraphRestoreJournalBody,postgresqlGraphRestoreJournalServiceContext} from './postgresql-graph-restore-journal.ts';
import {readPostgresqlGraphSwapProgress} from './postgresql-graph-swap-progress.ts';
import {recoverPostgresqlGraphSwap} from './postgresql-graph-swap-recovery.ts';
import {inspectPostgresqlOriginalConfiguration} from './postgresql-original-config-validation.ts';
import {inspectPostgresqlConfigService} from './postgresql-config-service.ts';
import {inspectPostgresqlRecoveryService} from './postgresql-recovery-service.ts';
import {postgresqlCodeDependencies,postgresqlServiceScope,assertPostgresqlRunningService} from './postgresql-code-operation.ts';
import {completePostgresqlGraphRestore} from './postgresql-completed-restore.ts';
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 중단 복구 서비스 기록을 확인하세요.'),{status:409});};
// Registered journal only, no original process-local review required.
export async function recoverReviewedPostgresqlGraph(value:unknown,backupRoot:string,{control,inspectService,inspectRecovery,validateOriginal=inspectPostgresqlOriginalConfiguration,retainCompleted=true}:RecoverOptions={}){
 if(typeof retainCompleted!=='boolean')fail();
 const journal=await assertPostgresqlGraphRestoreJournal(value,backupRoot);
 const body=postgresqlGraphRestoreJournalBody(journal),context=postgresqlGraphRestoreJournalServiceContext(journal);
 const inspect=inspectService??((target:string)=>inspectPostgresqlConfigService(target,{ownerUid:body.ownerUid}));
 const recovery=inspectRecovery??(()=>inspectPostgresqlRecoveryService(body.target,{ownerUid:body.ownerUid,inspectRunning:async target=>{if(typeof target!=='string')fail();return inspect(target);}}));
 const options=postgresqlCodeDependencies({ownerUid:body.ownerUid,...(control?{control}:{})});
 if([inspect,recovery,options.control,validateOriginal].some(value=>typeof value!=='function'))fail();
 async function state(){
  await assertPostgresqlGraphRestoreJournal(journal,backupRoot);const result=await recovery();
  if(!object(result)||result.unit!==context.scope.unit||!['active','inactive','failed'].includes(String(result.activeState))||result.controlPid!==0||result.activeState==='active'&&(!result.service||!same(postgresqlServiceScope(result.service),context.scope)))fail();
 }
 const progress=await readPostgresqlGraphSwapProgress(journal,backupRoot);if(!progress)fail();
 const result:unknown=await recoverPostgresqlGraphSwap(progress,{
  validate:async()=>{const result=await validateOriginal(journal,backupRoot);if(!object(result)||result.valid!==true||result.scope!=='private-config-options'||result.source!=='private-journal-original-config'||result.namespaceCommandsCompleted!==true||result.operatingConfigurationChanged!==false||result.operatingServiceChanged!==false||result.postmasterStarted!==false)fail();await state();return true;},
  reactivate:async()=>{await state();await options.control(context.scope.unit,'restart');},
  verify:async()=>{await assertPostgresqlGraphRestoreJournal(journal,backupRoot);const service=assertPostgresqlRunningService(await inspect(body.target),body.target);if(!same(postgresqlServiceScope(service),context.scope)||!same(service.values,context.originalValues)||service.configurationErrors!==0)fail();return true;}
 });
 if(!recovered(result))fail();
 if(!retainCompleted)return result;
 try{return {...result,retention:await completePostgresqlGraphRestore(journal,backupRoot)};}
 catch(error){throw Object.assign(Error('PostgreSQL 원본 복구는 확인됐지만 완료 기록 보관을 확인하세요.'),{status:409,rollbackComplete:true,journalId:journal.record.id,retentionComplete:false,cause:error});}
}
