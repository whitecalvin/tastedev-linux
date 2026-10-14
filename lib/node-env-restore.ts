import type {NodeEnvironmentValues} from './node-env.ts';
import {nodeEnvBackupRecord} from './node-env-backups.ts';
import {nodeEnvSnapshot} from './node-env-workspace.ts';
import {parseNodeEnv,nodeEnvironmentValue} from './node-env.ts';
import {configSchemas} from './config-schema.ts';
export async function nodeEnvRestorePlan(id: unknown){
 const backup=await nodeEnvBackupRecord(id),current=await nodeEnvSnapshot(backup.name),restored=parseNodeEnv(backup.text);
 return {id:backup.id,name:backup.name,version:current.version,backupVersion:backup.version,createdAt:backup.createdAt,changed:current.version!==backup.version,fields:configSchemas.nodejs.fields.map(([key,label])=>({key,label,before:nodeEnvironmentValue(current.values,key)??null,after:nodeEnvironmentValue(restored.values,key)??null})),notice:'복원하면 지원하지 않는 변수와 비밀 값을 포함한 환경 파일 원문 전체가 교체됩니다. 앱 재시작은 별도로 진행하세요.'};
}

export async function restoreNodeEnv(input: {id?: unknown;backupId?: unknown;name?: unknown;confirm?: unknown;version?: unknown;registryVersion?: unknown;backupVersion?: unknown;changes?: unknown}){
 const fail: (message: string)=>never=message=>{throw Object.assign(Error(message),{status:409});};
 if(input?.confirm!==true)throw Object.assign(Error('환경 파일 복원 확인이 필요합니다.'),{status:400});
 if(typeof input.version!=='string'||!/^[a-f0-9]{64}$/.test(input.version)||typeof input.backupVersion!=='string'||!/^[a-f0-9]{64}$/.test(input.backupVersion))throw Object.assign(Error('환경 파일 복원 계획을 다시 조회하세요.'),{status:400});
 const backup=await nodeEnvBackupRecord(input.id);if(backup.name!==input.name||backup.version!==input.backupVersion)fail('백업이 변경되었습니다. 복원 계획을 다시 조회하세요.');
 const restored=parseNodeEnv(backup.text);
 const recheck=async()=>{const current=await nodeEnvBackupRecord(input.id);if(current.name!==backup.name||current.version!==backup.version)fail('백업이 변경되었습니다. 복원 계획을 다시 조회하세요.');};
 const {replaceWorkspaceEnv}=await import('./workspace.ts');const {requireNodeEnvSaved}=await import('./node-env-outcome.ts');
 let result;try{result=await replaceWorkspaceEnv(backup.name,input.version,async()=>{await recheck();return backup.text;},recheck);}catch(error){if(error!==null&&typeof error==='object'&&'backupId' in error&&error.backupId)requireNodeEnvSaved({failed:true,backupId:error.backupId});throw error;}
 return requireNodeEnvSaved({name:backup.name,saved:!result.failed,...result,values:restored.values});
}
