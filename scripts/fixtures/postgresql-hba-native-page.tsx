'use client';
import {useState,useMemo,useCallback} from 'react';
import Hba from '../../components/postgresql-hba-operation';
import type {PostgreSQLOperationApi,PostgreSQLHbaInput,PostgreSQLHbaPlan,PostgreSQLHbaRecovery,PostgreSQLOperationResult,SecurityPolicy} from '../../components/console-types';
function record(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw Error('검수 응답을 확인하세요.');return Object.fromEntries(Object.entries(value));}
function strings(value:unknown):string[]{if(!Array.isArray(value))throw Error('검수 규칙 목록을 확인하세요.');return value.map((item:unknown)=>{if(typeof item!=='string')throw Error('검수 규칙을 확인하세요.');return item;});}
function mutation(value:Record<string,unknown>):PostgreSQLOperationResult{const result:PostgreSQLOperationResult={};for(const key of ['changed','failed','restored','recovered','journalCleanupVerified','preparationCancelled','recoveryRequired','codeRecovery'] as const){const item=value[key];if(item!==undefined){if(typeof item!=='boolean')throw Error('검수 작업 결과를 확인하세요.');result[key]=item;}}for(const key of ['version','backupId','historyId','reason','validationMode'] as const){const item=value[key];if(item!==undefined){if(typeof item!=='string')throw Error('검수 작업 식별 정보를 확인하세요.');result[key]=item;}}return result;}
function request(action:`postgresql-hba-recovery-status?${string}`,body?:unknown):Promise<PostgreSQLHbaRecovery>;
function request(action:'postgresql-hba-operation-plan',body?:unknown):Promise<PostgreSQLHbaPlan>;
function request(action:'postgresql-hba-operation'|'postgresql-hba-recover',body?:unknown):Promise<PostgreSQLOperationResult>;
function request(action:string,body?:unknown):Promise<never>;
async function request(action:string,body?:unknown):Promise<PostgreSQLHbaPlan|PostgreSQLHbaRecovery|PostgreSQLOperationResult>{
 const operation=action.split('?')[0];if(!['postgresql-hba-recovery-status','postgresql-hba-operation-plan','postgresql-hba-operation','postgresql-hba-recover'].includes(operation))throw Error('미지원 검수 요청');
 const response=await fetch('/api/fixture?action='+encodeURIComponent(operation),{...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});const value:unknown=await response.json(),data=record(value);if(!response.ok)throw Object.assign(Error(typeof data.error==='string'?data.error:'요청 오류'),{status:response.status});
 if(operation==='postgresql-hba-recovery-status'){if(typeof data.recoveryRequired!=='boolean'||(data.backupId!==undefined&&typeof data.backupId!=='string'))throw Error('복구 상태를 확인하세요.');return {recoveryRequired:data.recoveryRequired,...(typeof data.backupId==='string'?{backupId:data.backupId}:{})};}
 if(operation==='postgresql-hba-operation-plan'){const service=record(data.service),difference=record(data.difference);if(typeof data.changed!=='boolean'||typeof data.reviewVersion!=='string'||typeof service.unit!=='string'||typeof service.port!=='number')throw Error('검수 계획을 확인하세요.');return {changed:data.changed,reviewVersion:data.reviewVersion,service:{unit:service.unit,port:service.port},difference:{before:strings(difference.before),after:strings(difference.after)}};}
 return mutation(data);
}
const api:PostgreSQLOperationApi=request;
const security:SecurityPolicy={version:'fixture',settings:{readOnly:false,databaseChanges:true,sudoWithoutPrompt:true,nginxChanges:false,certificateChanges:false,serviceChanges:false,sudoPolicyChanges:false,cronChanges:false,packageInstall:false,fileEditing:false,terminal:false,audit:true},available:{databaseChanges:true},requirements:{},privilege:{ready:true,path:'/fixture/helper',reason:'전용 adapter'}};
export type HbaFixtureConfig={input:PostgreSQLHbaInput;interrupted:boolean};
export default function Page({config}:{config:HbaFixtureConfig}){
 const [mode,setMode]=useState('apply'),[applied,setApplied]=useState<PostgreSQLOperationResult|null>(null),[restored,setRestored]=useState(false);
 const input=useMemo<PostgreSQLHbaInput>(()=>{if(mode==='apply')return config.input;if(!applied?.version||!applied.backupId)throw Error('복원 식별 정보를 확인하세요.');return {path:config.input.path,version:applied.version,backupId:applied.backupId};},[mode,applied,config]);
 const completed=useCallback((value:PostgreSQLOperationResult)=>{if(mode==='apply')setApplied(value);else setRestored(true);},[mode]);
 return <main style={{padding:24,maxWidth:1000,margin:'auto'}}><h1>PostgreSQL 실제 임시 클러스터</h1><p>검수 전용 DB의 접속 규칙만 변경합니다. helper와 systemd는 fixture adapter입니다.</p><Hba input={input} api={api} connected security={security} onApplied={completed}/>{applied&&<><p role="status">{config.interrupted?'실제 중단 복구 응답 수신':applied.failed?'실제 자동 복구 응답 수신':'실제 적용 응답 수신'}</p>{!applied.failed&&!config.interrupted&&<button disabled={mode==='restore'||!applied.version||!applied.backupId} onClick={()=>setMode('restore')}>원본 백업 복원 검토</button>}</>}{restored&&<p role="status">실제 복원 응답 수신</p>}</main>;
}
