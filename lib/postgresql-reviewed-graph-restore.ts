import type {PostgresqlCodeOptions} from './postgresql-code-operation.ts';
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
type InspectService=(target:string)=>unknown|Promise<unknown>;
type InspectRecovery=()=>unknown|Promise<unknown>;
type ApplyOptions={control?:PostgresqlCodeOptions['control'];inspectRecovery?:InspectRecovery;retainCompleted?:boolean};
export type GraphCommitResult={journalId:string;phase:'committed';changedFiles:number;operatingConfigurationChanged:boolean;serviceCoordinatorInvoked:true;intentPreserved:true};
function committed(value:unknown):value is GraphCommitResult{return object(value)&&typeof value.journalId==='string'&&value.phase==='committed'&&typeof value.changedFiles==='number'&&Number.isSafeInteger(value.changedFiles)&&value.changedFiles>=0&&typeof value.operatingConfigurationChanged==='boolean'&&value.serviceCoordinatorInvoked===true&&value.intentPreserved===true;}
import {assertPostgresqlGraphRestoreReview,postgresqlGraphRestoreReviewedContext,createReviewedPostgresqlGraphRestoreJournal} from './postgresql-graph-restore-review.ts';
import {preparePostgresqlGraphRestoreStages} from './postgresql-graph-restore-stages.ts';
import {swapPostgresqlGraphRestore} from './postgresql-graph-swap.ts';
import {postgresqlConfigGraph} from './postgresql-config-graph.ts';
import {postgresqlCodeDependencies,assertPostgresqlRunningService,postgresqlServiceScope,postgresqlValidationValues} from './postgresql-code-operation.ts';
import {inspectPostgresqlRecoveryService} from './postgresql-recovery-service.ts';
import {completePostgresqlGraphRestore} from './postgresql-completed-restore.ts';

const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 여러 파일 복원 실행 상태를 확인하세요.'),{status:409});};

// Internal service coordinator; HTTP/helper integration supplies a fresh,
// registered review. Trusted fixture hooks never come from client input.
export async function applyReviewedPostgresqlGraphRestore(value:unknown,backupRoot:string,{control,inspectRecovery,retainCompleted=true}:ApplyOptions={}){
 if(typeof retainCompleted!=='boolean')fail();
 const plan=await assertPostgresqlGraphRestoreReview(value);
 const ctx=postgresqlGraphRestoreReviewedContext(plan),original=ctx.service;
 const options=postgresqlCodeDependencies({ownerUid:ctx.ownerUid,...(control?{control}:{})});
 if(typeof options.control!=='function')fail();
 if(plan.files.every(file=>file.action==='unchanged'))return {phase:'unchanged',changedFiles:0,operatingConfigurationChanged:false,operatingServiceChanged:false};
 const journal=await createReviewedPostgresqlGraphRestoreJournal(plan,backupRoot);
 try{await preparePostgresqlGraphRestoreStages(journal,backupRoot);}catch(error){throw Object.assign(Error('PostgreSQL 복원 준비 기록을 보존했습니다.'),{status:409,journalId:journal.record.id,intentPreserved:true,cause:error});}
 const inspect=async()=>assertPostgresqlRunningService(await ctx.inspect(plan.path),plan.path);
 const sameScope=(current:unknown)=>same(postgresqlServiceScope(current),postgresqlServiceScope(original));
 const recovery=inspectRecovery??(()=>inspectPostgresqlRecoveryService(plan.path,{ownerUid:ctx.ownerUid,inspectRunning:async target=>{if(typeof target!=='string')fail();return ctx.inspect(target);}}));
 if(typeof recovery!=='function')fail();
 const assertCandidateGraph=async()=>{const graph=await postgresqlConfigGraph(plan.path,{base:ctx.base,ownerUid:ctx.ownerUid});if(graph.version!==plan.archiveGraphVersion)fail();};
 let result:unknown;
 try{result=await swapPostgresqlGraphRestore(journal,backupRoot,{
  validate:async()=>{
   const values=postgresqlValidationValues(await ctx.validateArchive(ctx.archive),ctx.archive.graph);
   if(!same(values,plan.validation.values)||!same(await inspect(),original))fail();
   return true;
  },
  activate:async()=>{
   await assertCandidateGraph();const before=await inspect();
   if(!sameScope(before)||!same(before.values,original.values)||before.pid!==original.pid||before.start!==original.start)fail();
   await options.control(original.unit,'restart');
  },
  reactivate:async()=>{
   const state=await recovery();
   if(!object(state)||state.unit!==original.unit||!['active','inactive','failed'].includes(String(state.activeState))||state.controlPid!==0||state.activeState==='active'&&(!state.service||!sameScope(state.service)))fail();
   await options.control(original.unit,'restart');
  },
  verify:async({rollback}:{rollback:boolean})=>{
   if(!rollback)await assertCandidateGraph();
   const after=await inspect(),expected=rollback?original.values:plan.validation.values;
   if(!sameScope(after)||!same(after.values,expected)||after.configurationErrors!==0)fail();
   return true;
  }
 });}catch(error){
  if(object(error)&&error.rollbackComplete===true&&retainCompleted){
   try{const retention=await completePostgresqlGraphRestore(journal,backupRoot);Object.assign(error,{retention});}
   catch(retentionError){throw Object.assign(Error('PostgreSQL 원본 복구는 확인됐지만 완료 기록 보관을 확인하세요.'),{status:409,rollbackComplete:true,journalId:journal.record.id,retentionComplete:false,cause:retentionError});}
  }throw error;
 }
 if(!committed(result))fail();
 if(!retainCompleted)return result;
 try{return {...result,retention:await completePostgresqlGraphRestore(journal,backupRoot)};}
 catch(error){throw Object.assign(Error('PostgreSQL 적용은 확인됐지만 완료 기록 보관을 확인하세요.'),{status:409,activationComplete:true,journalId:journal.record.id,retentionComplete:false,cause:error});}
}
