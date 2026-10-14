import type {Stats} from 'node:fs';
import type {ConfigFileIdentity} from './config-journal.ts';
import type {HbaJournalOptions} from './postgresql-hba-journal.ts';
import type {PostgresqlHbaGraph} from './postgresql-hba-graph.ts';
import {hasErrorCode} from './error-code.ts';
type ValidationDependencies=NonNullable<Parameters<typeof validatePostgresqlHba>[1]>;
type OperationDependencies=ValidationDependencies&HbaJournalOptions&{inspectService?:(path:unknown)=>unknown|Promise<unknown>;inspectIdentity?:(service:unknown)=>unknown|Promise<unknown>;reload?:(service:unknown)=>unknown|Promise<unknown>};
type PreparedOperation={path:string;version:string;reviewVersion?:string;confirm?:true}&({backupId:string;text?:never}|{text:string;backupId?:never});
type ReplacementReview={file:string;prepared:{path:string};stat:Pick<Stats,'uid'|'gid'|'mode'>};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {lstat,open,rename,unlink} from 'node:fs/promises';import {constants} from 'node:fs';import path from 'node:path';import {createHash,randomUUID} from 'node:crypto';
import {preparePostgresqlHbaValidation,validatePostgresqlHba} from './postgresql-hba-validate.ts';
import {postgresqlHbaGraph} from './postgresql-hba-graph.ts';
import {readPostgresqlHba} from './postgresql-hba-source.ts';
import {createPostgresqlHbaBackup,postgresqlHbaBackupRecord} from './postgresql-hba-backups.ts';
import {postgresqlHbaServiceHooks} from './postgresql-hba-service.ts';
import {assertPostgresqlHbaJournalClear,createPostgresqlHbaJournal,readPostgresqlHbaJournal,clearPostgresqlHbaJournal} from './postgresql-hba-journal.ts';
import {configDiff} from './config-diff.ts';
const digest=(value:string)=>createHash('sha256').update(value).digest('hex'),fail:(message:string,status?:number)=>never=(message,status=400)=>{throw Object.assign(Error(message),{status});};
const activeHbaTargets=new Set<string>();
const fields=['path','version','text','backupId','reviewVersion','confirm'];
export function preparePostgresqlHbaOperation(input:unknown,commit=false):PreparedOperation{
 if(!object(input)||Object.keys(input).some(key=>!fields.includes(key))||commit&&(input.confirm!==true||typeof input.reviewVersion!=='string'||!/^[a-f0-9]{64}$/.test(input.reviewVersion)))fail('접속 규칙 적용 검토와 확인이 필요합니다.');
 if(input.backupId!==undefined){if(typeof input.backupId!=='string'||! /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(input.backupId)||input.text!==undefined)fail('복원 백업을 확인하세요.');}else if(typeof input.text!=='string')fail('적용할 접속 규칙 코드를 확인하세요.');
 const validated=preparePostgresqlHbaValidation({path:input.path,version:input.version,...(input.text===undefined?{}:{text:input.text})});
 const confirmation=commit?{reviewVersion:typeof input.reviewVersion==='string'?input.reviewVersion:undefined,confirm:true as const}:{};
 if(typeof input.backupId==='string')return {path:validated.path,version:validated.version,backupId:input.backupId,...confirmation};
 if(typeof validated.text!=='string')fail('적용할 접속 규칙 코드를 확인하세요.');
 return {path:validated.path,version:validated.version,text:validated.text,...confirmation};
}
function identity(stat:Pick<Stats,'dev'|'ino'|'uid'|'gid'|'mode'>):ConfigFileIdentity{return {dev:stat.dev,ino:stat.ino,uid:stat.uid,gid:stat.gid,mode:stat.mode&0o777};}
function same(left:unknown,right:unknown){return JSON.stringify(left)===JSON.stringify(right);}
async function resolve(input:PreparedOperation,options:OperationDependencies){if(input.backupId===undefined)return input.text;const backup=await postgresqlHbaBackupRecord(input.backupId,options);if(backup.target!==input.path)fail('백업의 접속 규칙 경로가 다릅니다.');return backup.text;}
async function review(input:unknown,options:OperationDependencies&Required<Pick<OperationDependencies,'inspectService'|'inspectIdentity'|'reload'>>){
 const prepared=preparePostgresqlHbaOperation(input),text=await resolve(prepared,options),file=path.join(options.base??'/etc',prepared.path.slice(5));
 const before=await lstat(file),original=await readPostgresqlHba({path:prepared.path},options),after=await lstat(file);if(!same(identity(before),identity(after))||original.version!==prepared.version)fail('접속 규칙 파일이 변경되었습니다. 다시 조회하세요.',409);
 const service=await options.inspectService(prepared.path);if(!object(service)||service.identityVerified!==true||service.hba!==prepared.path||service.settingsSource!=='running-server')fail('실행 중인 클러스터의 HBA 설정을 확인하세요.',409);
 const validation=await validatePostgresqlHba({path:prepared.path,version:prepared.version,text},options);if(!validation.valid)fail('접속 규칙 검수가 실패했습니다. 오류를 수정하세요.');
 const graph=await postgresqlHbaGraph(prepared.path,{base:options.base,ownerUid:options.ownerUid,override:text});if(!graph.complete||!('graphVersion' in validation)||validation.graphVersion!==graph.version)fail('검수한 접속 규칙 참조 파일이 변경되었습니다.',409);
 const latest=await options.inspectService(prepared.path);if(!same(service,latest)||!same(identity(before),identity(await lstat(file))))fail('클러스터 또는 파일의 상태가 변경되었습니다. 다시 검토하세요.',409);
 const policy={path:prepared.path,version:prepared.version,draftVersion:digest(text),graphVersion:graph.version,file:identity(before),service,...(prepared.backupId?{backupId:prepared.backupId}:{})};
 return {prepared,text,file,original,stat:before,graph,service,policy,reviewVersion:digest(JSON.stringify(policy)),validation};
}
// Review does not modify configuration or request reload. It queries the selected
// running cluster read-only; helper/API permission gates authorize this explicitly.
export async function postgresqlHbaOperationPlan(input:unknown,dependencies:OperationDependencies={}){
 const options={...postgresqlHbaServiceHooks(),...dependencies};await assertPostgresqlHbaJournalClear(preparePostgresqlHbaOperation(input).path,options);const result=await review(input,options);
 return {...result.policy,reviewVersion:result.reviewVersion,validation:result.validation,difference:configDiff(result.original.text,result.text),changed:result.original.text!==result.text,operatingConfigurationChanged:false,reloadRequested:false,operation:result.prepared.backupId?'restore':'apply'};
}
async function syncDirectory(file:string){const directory=await open(path.dirname(file),constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW);try{await directory.sync();}finally{await directory.close();}}
async function replace(reviewed:ReplacementReview,text:string,version:string,expectedIdentity:ConfigFileIdentity,options:OperationDependencies,beforeRename?:(identity:ConfigFileIdentity,temp:string)=>unknown|Promise<unknown>){
 let stagedIdentity:ConfigFileIdentity,replaced=false;const file=reviewed.file,temp=path.join(path.dirname(file),'.tastedev-hba-'+randomUUID()),handle=await open(temp,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);
 try{await handle.writeFile(text);await handle.chown(reviewed.stat.uid,reviewed.stat.gid);await handle.chmod(reviewed.stat.mode&0o777);await handle.sync();stagedIdentity=identity(await handle.stat());}catch(error){await unlink(temp).catch(()=>{});throw error;}finally{await handle.close();}
 try{const current=await readPostgresqlHba({path:reviewed.prepared.path},options),stat=await lstat(file);if(current.version!==version||!same(identity(stat),expectedIdentity))fail('접속 규칙이 교체 직전에 변경되었습니다.',409);if(beforeRename){await beforeRename(stagedIdentity,path.basename(temp));const latest=await readPostgresqlHba({path:reviewed.prepared.path},options);if(latest.version!==version||!same(identity(await lstat(file)),expectedIdentity))fail('접속 규칙이 교체 직전에 변경되었습니다.',409);}await rename(temp,file);replaced=true;await syncDirectory(file);return stagedIdentity;}catch(error){if(replaced&&object(error)){error.replacementOccurred=true;error.replacementIdentity=stagedIdentity;}throw error;}finally{await unlink(temp).catch(error=>{if(!hasErrorCode(error,'ENOENT'))throw error;});}
}
async function finishJournal(target:string,journal:unknown,options:OperationDependencies){try{await clearPostgresqlHbaJournal(target,journal,options);return true;}catch{return false;}}
function graphState(graph:PostgresqlHbaGraph,target:string,sourceVersion:string){const {version,...state}=graph;return JSON.stringify({...state,files:state.files.map(file=>file.path===target?{...file,sourceVersion}:file)});}
export async function applyPostgresqlHbaOperation(input:unknown,dependencies:OperationDependencies={}){
 const request=preparePostgresqlHbaOperation(input,true),options={...postgresqlHbaServiceHooks(),...dependencies},file=path.join(options.base??'/etc',request.path.slice(5));
 // The installed helper holds the process-wide kernel admin lock. Within a
 // process, exclude concurrent calls without leaving a filesystem lease after
 // SIGKILL. Preserve old directory leases: their interrupted changes are unknown.
 try{await lstat(file+'.tastedev-hba-lock');fail('이전 접속 규칙 작업의 잠금을 검토하세요. 기존 상태는 보존합니다.',409);}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}
 if(activeHbaTargets.has(file))fail('접속 규칙 적용이 진행 중입니다.',409);activeHbaTargets.add(file);
 try{
  await assertPostgresqlHbaJournalClear(request.path,options);
  const reviewed=await review(request,options);if(reviewed.reviewVersion!==request.reviewVersion)fail('적용 검토 이후 코드 또는 서버 상태가 변경되었습니다.',409);
  if(reviewed.original.text===reviewed.text)return {changed:false,version:request.version,reloadRequested:false};
  const baseline=await postgresqlHbaGraph(request.path,{base:options.base,ownerUid:options.ownerUid});
  const backup=await createPostgresqlHbaBackup({path:request.path,version:request.version},options),backupId=backup.backup.id;
  const latest=await options.inspectService(request.path),graph=await postgresqlHbaGraph(request.path,{base:options.base,ownerUid:options.ownerUid,override:reviewed.text});
  if(!same(latest,reviewed.service)||graph.version!==reviewed.graph.version)fail('백업 이후 클러스터 또는 참조 파일이 변경되었습니다.',409);
  let journal:Awaited<ReturnType<typeof readPostgresqlHbaJournal>>|undefined,applied:ConfigFileIdentity;try{applied=await replace(reviewed,reviewed.text,request.version,identity(reviewed.stat),options,async(stagedIdentity,temp)=>{await createPostgresqlHbaJournal({kind:'postgresql-hba-transaction-v1',target:request.path,backupId,originalVersion:request.version,draftVersion:digest(reviewed.text),originalIdentity:identity(reviewed.stat),baselineState:graphState(baseline,request.path,request.version),stagedIdentity,temp,service:reviewed.service},options);journal=await readPostgresqlHbaJournal(request.path,options);});}catch(error){if(object(error)&&error.replacementOccurred)return {changed:true,failed:true,restored:false,recovered:false,backupId,reason:'파일 교체 후 동기화에 실패했습니다. 백업과 파일을 확인하세요.'};throw error;}
  const version=digest(reviewed.text);
  try{
   const current=await postgresqlHbaGraph(request.path,{base:options.base,ownerUid:options.ownerUid});if(!current.complete||graphState(current,request.path,version)!==graphState(reviewed.graph,request.path,version))fail('적용 중 참조 파일이 변경되었습니다.',409);
   const reload=await options.reload(reviewed.service);
   const service=await options.inspectService(request.path);if(!same(service,reviewed.service))fail('적용 이후 실행 중인 클러스터가 변경되었습니다.',409);
   const loaded=await postgresqlHbaGraph(request.path,{base:options.base,ownerUid:options.ownerUid});if(!loaded.complete||graphState(loaded,request.path,version)!==graphState(reviewed.graph,request.path,version))fail('reload 이후 참조 파일이 변경되었습니다.',409);
   const journalCleanupVerified=await finishJournal(request.path,journal,options);
   return {changed:true,version,backupId,journalCleanupVerified,...(object(reload)?reload:{}),managementConnectionVerified:true,reloadAcceptanceVerified:false};
  }catch{
   try{await replace(reviewed,reviewed.original.text,version,applied,options);}catch{return {changed:true,failed:true,restored:false,recovered:false,backupId,reason:'파일이 외부에서 변경되었습니다. 백업을 검토하세요.'};}
   try{
    const restored=await postgresqlHbaGraph(request.path,{base:options.base,ownerUid:options.ownerUid});if(!restored.complete||graphState(restored,request.path,request.version)!==graphState(baseline,request.path,request.version))fail('원본 참조 파일이 변경되었습니다.',409);
    const validation=await validatePostgresqlHba({path:request.path,version:request.version,text:reviewed.original.text},options);if(!validation.valid)fail('원본 접속 규칙 검수가 실패했습니다.');
    await options.reload(reviewed.service);const service=await options.inspectService(request.path);if(!same(service,reviewed.service))fail('클러스터 복구를 확인하세요.',409);
    const journalCleanupVerified=await finishJournal(request.path,journal,options);
    return {changed:false,failed:true,restored:true,recovered:true,journalCleanupVerified,backupId,version:request.version,reloadAcceptanceVerified:false};
   }catch{return {changed:false,failed:true,restored:true,recovered:false,backupId,version:request.version,reason:'원본 파일은 복원됐지만 클러스터 복구를 확인하지 못했습니다.'};}
  }
 }finally{activeHbaTargets.delete(file);}
}

// Explicit recovery is a separate confirmed action. It does not continue a new
// draft commit after undoing an interrupted operation.
export async function recoverPostgresqlHbaOperation(input:unknown,dependencies:OperationDependencies={}){
 if(!object(input)||typeof input.path!=='string'||Object.keys(input).some(key=>!['path','confirm'].includes(key))||input.confirm!==true)fail('접속 규칙 복구 확인이 필요합니다.');
 preparePostgresqlHbaValidation({path:input.path,version:'0'.repeat(64)});
 const options={...postgresqlHbaServiceHooks(),...dependencies},file=path.join(options.base??'/etc',input.path.slice(5));
 if(activeHbaTargets.has(file))fail('접속 규칙 적용이 진행 중입니다.',409);activeHbaTargets.add(file);
 try{
  const journal=await readPostgresqlHbaJournal(input.path,options);if(!journal)return {changed:false,recoveryRequired:false};
  const record=journal.record,backup=await postgresqlHbaBackupRecord(record.backupId,options);
  if(backup.target!==input.path||backup.version!==record.originalVersion)fail('중단된 작업의 원본 백업을 확인하세요.',409);
  const source=await readPostgresqlHba({path:input.path},options),stat=await lstat(file);
  const original=source.version===record.originalVersion&&(['uid','gid','mode'] as const).every(key=>identity(stat)[key]===record.originalIdentity[key]);
  // Inodes can be reused after rollback. Original bytes plus the old inode
  // do not prove that rename never happened. Only the still-present verified
  // staged file establishes a preparation-only interruption.
  const pendingTemp=path.join(path.dirname(file),record.temp);let stagedPresent=false;
  try{const pending=await lstat(pendingTemp);if(!pending.isFile()||pending.isSymbolicLink()||pending.nlink!==1||!same(identity(pending),record.stagedIdentity))fail('중단된 작업의 임시 파일을 확인하세요.',409);stagedPresent=true;}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}
  const restored=original&&(!same(identity(stat),record.originalIdentity)||!stagedPresent);
  const draft=source.version===record.draftVersion&&same(identity(stat),record.stagedIdentity);
  if(!original&&!draft)fail('중단 이후 파일이 변경되었습니다. 기존 상태와 백업을 보존합니다.',409);
  const graph=await postgresqlHbaGraph(input.path,{base:options.base,ownerUid:options.ownerUid,override:backup.text});
  if(!graph.complete||graphState(graph,input.path,record.originalVersion)!==record.baselineState)fail('원본 참조 파일이 변경되었습니다. 수동 복구를 검토하세요.',409);
  if(draft||restored){
   await options.inspectIdentity(record.service);
   const validation=await validatePostgresqlHba({path:input.path,version:source.version,text:backup.text},options);if(!validation.valid)fail('원본 접속 규칙 검수가 실패했습니다.');
   const reviewed={file,prepared:{path:input.path},stat:record.originalIdentity};
   if(draft)await replace(reviewed,backup.text,record.draftVersion,record.stagedIdentity,options);
   try{await options.reload(record.service);const service=await options.inspectService(input.path);if(!same(service,record.service))fail('클러스터 복구를 확인하세요.',409);}catch{return {changed:false,failed:true,restored:true,recovered:false,backupId:record.backupId,version:record.originalVersion,recoveryRequired:true};}
  }
  if(original&&!restored){await options.inspectIdentity(record.service);const service=await options.inspectService(input.path);if(!same(service,record.service))fail('클러스터 복구를 확인하세요.',409);}
  const finalSource=await readPostgresqlHba({path:input.path},options),finalGraph=await postgresqlHbaGraph(input.path,{base:options.base,ownerUid:options.ownerUid});
  if(finalSource.version!==record.originalVersion||!finalGraph.complete||graphState(finalGraph,input.path,record.originalVersion)!==record.baselineState)fail('복구 중 파일 또는 참조 파일이 변경되었습니다. 기록을 보존합니다.',409);
  const temp=path.join(path.dirname(file),record.temp);try{const stat=await lstat(temp);if(same(identity(stat),record.stagedIdentity)&&stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1)await unlink(temp);else fail('중단된 작업의 임시 파일을 확인하세요.',409);}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}
  const journalCleanupVerified=await finishJournal(input.path,journal,options);
  return {changed:false,restored:draft||restored,recovered:true,journalCleanupVerified,backupId:record.backupId,version:record.originalVersion,recoveryRequired:false,reloadRequested:draft||restored,reloadAcceptanceVerified:false};
 }finally{activeHbaTargets.delete(file);}
}
export async function postgresqlHbaRecoveryStatus(input:unknown,options:OperationDependencies={}){
 if(!object(input)||Object.keys(input).some(key=>key!=='path'))fail('접속 규칙 경로를 확인하세요.');
 const journal=await readPostgresqlHbaJournal(input.path,options);
 return journal?{recoveryRequired:true,backupId:journal.record.backupId,path:journal.record.target}:{recoveryRequired:false};
}
