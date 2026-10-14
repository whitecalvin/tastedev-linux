import type {NodeEnvironmentValues} from './node-env.ts';
import {mkdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import {nodeAppEnvBackupRecord} from './node-app-env-backups.ts';
import {nodeAppEnvSnapshot} from './node-app-env.ts';
import {parseNodeEnv,nodeEnvironmentValue} from './node-env.ts';
import {configSchemas} from './config-schema.ts';
import {configTransaction} from './config-transaction.ts';
import {stateRoot} from './runtime-paths.ts';
import {requireNodeEnvSaved} from './node-env-outcome.ts';
const fail: (message: string,status?: number)=>never=(message,status=409)=>{throw Object.assign(Error(message),{status});};
export async function nodeAppEnvRestorePlan(id: unknown,backupId: unknown){
 const backup=await nodeAppEnvBackupRecord(id,backupId),current=await nodeAppEnvSnapshot(id),restored=parseNodeEnv(backup.text);
 if(current.registryVersion!==backup.registryVersion)fail('앱 목록이 변경되었습니다. 다시 조회하세요.');
 return {id,backupId,name:backup.name,version:current.version,registryVersion:current.registryVersion,backupVersion:backup.version,createdAt:backup.createdAt,changed:current.version!==backup.version,fields:configSchemas.nodejs.fields.map(([key,label])=>({key,label,before:nodeEnvironmentValue(current.values,key)??null,after:nodeEnvironmentValue(restored.values,key)??null})),notice:'복원하면 지원하지 않는 변수와 비밀 값을 포함한 환경 파일 원문 전체가 교체됩니다. 앱 재시작은 별도로 진행하세요.'};
}
export async function restoreNodeAppEnv(input: {id?: unknown;backupId?: unknown;name?: unknown;confirm?: unknown;version?: unknown;registryVersion?: unknown;backupVersion?: unknown;changes?: unknown}){
 if(process.getuid?.()===0)fail('환경 파일 편집은 일반 사용자 권한으로 실행하세요.',403);
 if(input?.confirm!==true)fail('환경 파일 복원 확인이 필요합니다.',400);
 for(const key of ['version','registryVersion','backupVersion'] as const)if(typeof input[key]!=='string'||!/^[a-f0-9]{64}$/.test(input[key]))fail('환경 파일 복원 계획을 다시 조회하세요.',400);
 const backup=await nodeAppEnvBackupRecord(input.id,input.backupId),snapshot=await nodeAppEnvSnapshot(input.id);
 if(snapshot.version!==input.version||snapshot.registryVersion!==input.registryVersion||backup.registryVersion!==input.registryVersion||backup.version!==input.backupVersion)fail('앱, 파일 또는 백업이 변경되었습니다. 복원 계획을 다시 조회하세요.');
 const restored=parseNodeEnv(backup.text),backupRoot=path.join(stateRoot(),'node-app-env-backups');await mkdir(backupRoot,{recursive:true,mode:0o700});
 const recheck=async()=>{const current=await nodeAppEnvSnapshot(input.id),record=await nodeAppEnvBackupRecord(input.id,input.backupId);if(current.version!==snapshot.version||current.registryVersion!==snapshot.registryVersion||record.version!==backup.version||record.target!==backup.target)fail('앱, 파일 또는 백업이 변경되었습니다. 복원 계획을 다시 조회하세요.');};
 const result=await configTransaction({configurationUid:undefined,file:backup.target,backupRoot,version:input.version,transform:async()=>{await recheck();return backup.text;},validate:async (file: string)=>parseNodeEnv(new TextDecoder('utf-8',{fatal:true}).decode(await readFile(file))),beforeCommit:recheck,activate:async()=>{},recover:async()=>{}});
 return requireNodeEnvSaved({...snapshot,...result,saved:!result.failed,values:restored.values});
}
