import type {RecoveryOptions} from './postgresql-graph-code-recovery.ts';
import {assertRecoveryRuntime} from './postgresql-graph-code-recovery.ts';
import type {PostgresqlRecoveryBackup} from './postgresql-recovery-backup.ts';
import type {PostgresqlCodeOptions} from './postgresql-code-operation.ts';
import {readPostgresqlGraphRestoreJournal} from './postgresql-graph-restore-journal.ts';
import {postgresqlGraphCodeRecoveryPlan,recoverPostgresqlGraphCode} from './postgresql-graph-code-recovery.ts';
import path from 'node:path';import {createHash} from 'node:crypto';
import {postgresqlConfigRoot,postgresqlConfigGraph,assertPostgresqlConfigGraph} from './postgresql-config-graph.ts';
import {postgresqlCodeDependencies,postgresqlServiceScope,assertPostgresqlRunningService,postgresqlValidationValues} from './postgresql-code-operation.ts';
import {readConfigJournal} from './config-journal.ts';import {recoverConfigTransaction} from './config-transaction.ts';
import {postgresqlRecoveryBackup} from './postgresql-recovery-backup.ts';import {inspectPostgresqlRecoveryService} from './postgresql-recovery-service.ts';import {postgresqlAutoConfigVersion} from './postgresql-config-service.ts';
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex'),same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b),fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 중단 복구 검토가 변경되었습니다.'),{status:409});};
export type RecoveryInput={path:string};
export type RecoveryCommit=RecoveryInput&{reviewVersion:string;confirm:true};
export type CodeRecoveryOptions=PostgresqlCodeOptions&Partial<Pick<RecoveryOptions,'inspectRecovery'|'autoVersion'|'validateOriginal'>>;
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
export function preparePostgresqlCodeRecovery(input:unknown,commit?:false):RecoveryInput;
export function preparePostgresqlCodeRecovery(input:unknown,commit:true):RecoveryCommit;
export function preparePostgresqlCodeRecovery(input:unknown,commit:boolean):RecoveryInput|RecoveryCommit;
export function preparePostgresqlCodeRecovery(input:unknown,commit=false):RecoveryInput|RecoveryCommit{if(!object(input)||Object.keys(input).some(key=>!(commit?['path','reviewVersion','confirm']:['path']).includes(key))||typeof input.path!=='string')fail();postgresqlConfigRoot(input.path);if(commit){if(input.confirm!==true||typeof input.reviewVersion!=='string'||!/^[a-f0-9]{64}$/.test(input.reviewVersion))fail();return {path:input.path,reviewVersion:input.reviewVersion,confirm:true};}return {path:input.path};}
function dependencies(options:CodeRecoveryOptions){const opts=postgresqlCodeDependencies(options);if(typeof opts.backupRoot!=='string'||!path.isAbsolute(opts.backupRoot))fail();return {...opts,backupRoot:opts.backupRoot,inspectRecovery:opts.inspectRecovery??((target:string)=>inspectPostgresqlRecoveryService(target,{ownerUid:opts.ownerUid})),autoVersion:opts.autoVersion??postgresqlAutoConfigVersion};}
async function runtime(target:string,backup:PostgresqlRecoveryBackup,opts:ReturnType<typeof dependencies>){
 const expected=backup.context.scope,state=assertRecoveryRuntime(await opts.inspectRecovery(target),target,expected);
 if(!same(await opts.autoVersion(expected.data,opts.ownerUid),expected.autoConfiguration))fail();return state.service?{...state,service:Object.fromEntries(Object.entries(state.service).filter(([key])=>key!=='configurationErrors'))}:state;
}
async function snapshot(input:RecoveryInput,opts:ReturnType<typeof dependencies>){
 const file=path.join(opts.base??'/etc',input.path.slice(5)),journal=await readConfigJournal(file,opts.backupRoot);if(!journal)return null;
 const backup=await postgresqlRecoveryBackup(journal.record.backupId,opts.backupRoot,input.path,{file});if(backup.version!==journal.record.originalVersion)fail();
 const graph=await postgresqlConfigGraph(input.path,{base:opts.base,ownerUid:opts.ownerUid}),current=graph.files.find(entry=>entry.path===input.path);if(!current||![journal.record.originalVersion,journal.record.draftVersion].includes(current?.version))fail();
 const original=await postgresqlConfigGraph(input.path,{base:opts.base,ownerUid:opts.ownerUid,overrides:new Map([[input.path,backup.text]])});if(original.version!==backup.context.graphVersion)fail();const service=await runtime(input.path,backup,opts);return {file,journal,backup,graph,original,service,currentVersion:current.version};
}
function review(state:NonNullable<Awaited<ReturnType<typeof snapshot>>>){return hash({journal:state.journal,backup:hash(state.backup),graphVersion:state.graph.version,restoreGraphVersion:state.original.version,service:state.service});}
export async function postgresqlCodeRecoveryPlan(value:unknown,options:CodeRecoveryOptions={}){
 const input=preparePostgresqlCodeRecovery(value);const opts=dependencies(options),graphJournal=await readPostgresqlGraphRestoreJournal(input.path,opts.backupRoot,opts);if(graphJournal){if(await readConfigJournal(path.join(opts.base??'/etc',input.path.slice(5)),opts.backupRoot))fail();return postgresqlGraphCodeRecoveryPlan(graphJournal,opts);}const state=await snapshot(input,opts);if(!state)return {path:input.path,recoveryRequired:false};
 const values=postgresqlValidationValues(await opts.validate(input.path,state.backup.text),state.original);await assertPostgresqlConfigGraph(state.graph);await assertPostgresqlConfigGraph(state.original);const latest=await snapshot(input,opts);if(!latest||review(latest)!==review(state))fail();
 return {path:input.path,recoveryRequired:true,backupId:state.backup.id,backupVersion:state.backup.version,currentVersion:state.currentVersion,graphVersion:state.graph.version,restoreGraphVersion:state.original.version,service:{unit:state.service.unit,activeState:state.service.activeState},validation:{valid:true,scope:'private-config-options',values,operatingServiceChanged:false},reviewVersion:review(state)};
}
export async function recoverPostgresqlCode(value:unknown,options:CodeRecoveryOptions={}){
 const input=preparePostgresqlCodeRecovery(value,true);const opts=dependencies(options),graphJournal=await readPostgresqlGraphRestoreJournal(input.path,opts.backupRoot,opts);if(graphJournal){if(await readConfigJournal(path.join(opts.base??'/etc',input.path.slice(5)),opts.backupRoot))fail();return recoverPostgresqlGraphCode(graphJournal,input.reviewVersion,opts);}const state=await snapshot(input,opts);if(!state||review(state)!==input.reviewVersion)fail();
 const verifiedState=state;
 async function verify(){const current=await snapshot({path:input.path},opts);if(!current||!same(current.journal,verifiedState.journal)||hash(current.backup)!==hash(verifiedState.backup)||![verifiedState.graph.version,verifiedState.original.version].includes(current.graph.version)||current.original.version!==verifiedState.original.version||!same(current.service,verifiedState.service))fail();}
 return recoverConfigTransaction({file:state.file,backupRoot:opts.backupRoot,configurationUid:opts.ownerUid,confirm:true,beforeRecovery:verify,
  validate:async()=>{postgresqlValidationValues(await opts.validate(input.path,state.backup.text),state.original);await verify();},
  recover:async()=>{await verify();const graph=await postgresqlConfigGraph(input.path,{base:opts.base,ownerUid:opts.ownerUid});if(graph.version!==state.original.version)fail();await opts.control(state.backup.context.scope.unit,'restart');const service=assertPostgresqlRunningService(await opts.inspectService(input.path),input.path),final=await postgresqlConfigGraph(input.path,{base:opts.base,ownerUid:opts.ownerUid});if(final.version!==state.original.version||!same(postgresqlServiceScope(service),state.backup.context.scope)||!same(service.values,state.backup.context.values)||service.configurationErrors!==0)fail();}
 });
}
