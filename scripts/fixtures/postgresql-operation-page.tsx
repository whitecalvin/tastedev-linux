'use client';
import {useState,useMemo,useRef} from 'react';
import type {SecurityPolicy,PostgreSQLOperationPlan,PostgreSQLRestoreCodePlan,PostgreSQLRecoveryReview,PostgreSQLRestoreMetadata,PostgreSQLHbaRecovery,PostgreSQLHbaPlan,DatabaseCodePlan,DatabaseOperationResult} from '../../components/console-types';
import Operation from '../../components/postgresql-code-operation';
import Restore from '../../components/postgresql-restore';
import Recovery from '../../components/postgresql-code-recovery';
import Hba from '../../components/postgresql-hba-operation';
import Maria from '../../components/mariadb-code-operation';import Redis from '../../components/redis-code-operation';
type Mode='hba'|'apply'|'restore'|'recover'|'mariadb'|'redis';
export default function Page({hbaOnly,outcomes}:{hbaOnly:boolean;outcomes:boolean}){
 const [mode,setMode]=useState<Mode>(hbaOnly?'hba':'apply'),[target,setTarget]=useState('main'),[readOnly,setReadOnly]=useState(false),[calls,setCalls]=useState<{action:string;path:string}[]>([]);
 const reviews=useRef(0);
 const file=mode==='mariadb'?'/etc/mysql/mariadb.conf.d/50-server.cnf':mode==='redis'?'/etc/redis/redis.conf':'/etc/postgresql/18/'+target+(mode==='hba'?'/pg_hba.conf':'/postgresql.conf'),id='d834ae1b-1108-4835-a860-82077d70d4f8';
 const security=useMemo<SecurityPolicy>(()=>({settings:{readOnly,databaseChanges:true,sudoWithoutPrompt:true,nginxChanges:false,certificateChanges:false,serviceChanges:false,sudoPolicyChanges:false,cronChanges:false,packageInstall:false,fileEditing:false,terminal:false,audit:true},version:'fixture',available:{databaseChanges:true},requirements:{},privilege:{ready:true,reason:'검수 응답',path:'fixture'}}),[readOnly]);
 const input=useMemo(()=>({path:file,...(mode==='mariadb'?{root:'/etc/mysql/my.cnf'}:{}),version:'a'.repeat(64),text:mode==='hba'?'local all all peer\n':'max_connections = 100\n'}),[file,mode]);
 const api=useMemo(()=>{
 function request(action:'postgresql-code-plan',body?:unknown):Promise<PostgreSQLOperationPlan>;
 function request(action:'postgresql-code-restore-plan',body?:unknown):Promise<PostgreSQLRestoreCodePlan>;
 function request(action:'postgresql-code-recovery-plan',body?:unknown):Promise<PostgreSQLRecoveryReview>;
 function request(action:`postgresql-restore-plan?${string}`,body?:unknown):Promise<PostgreSQLRestoreMetadata>;
 function request(action:`postgresql-hba-recovery-status?${string}`,body?:unknown):Promise<PostgreSQLHbaRecovery>;
 function request(action:'postgresql-hba-operation-plan',body?:unknown):Promise<PostgreSQLHbaPlan>;
 function request(action:'mariadb-code-plan'|'redis-code-plan',body?:unknown):Promise<DatabaseCodePlan>;
 function request(action:'postgresql-code-apply'|'postgresql-code-restore'|'postgresql-code-recover'|'postgresql-hba-operation'|'mariadb-code-apply'|'redis-code-apply',body?:unknown):Promise<DatabaseOperationResult>;
 function request(action:string,body?:unknown):Promise<never>;
 async function request(action:string,body?:unknown):Promise<PostgreSQLOperationPlan|PostgreSQLRestoreCodePlan|PostgreSQLRecoveryReview|PostgreSQLRestoreMetadata|PostgreSQLHbaRecovery|PostgreSQLHbaPlan|DatabaseCodePlan|DatabaseOperationResult>{
  setCalls(previous=>[...previous,{action,path:body!==null&&typeof body==='object'&&'path' in body&&typeof body.path==='string'?body.path:file}]);
  const proof='a'.repeat(64),proofs={version:proof,graphVersion:proof,candidateGraphVersion:proof,serviceVersion:proof,backupVersion:proof,backupIdentity:proof,reviewVersion:proof};
  if(action.startsWith('postgresql-hba-recovery-status'))return {recoveryRequired:false};
  if(action==='postgresql-hba-operation-plan'){if(reviews.current++===0)throw Object.assign(Error('PostgreSQL 서비스 경로를 안전하게 확인할 수 없습니다: /media/user/data — root 또는 PostgreSQL 실행 계정 소유여야 합니다.'),{status:409});return {...proofs,changed:true,service:{unit:'postgresql@18-'+target+'.service',port:5432},difference:{before:['local all all peer'],after:['local all all reject']}};}
  if(action==='postgresql-hba-operation')return {changed:true,version:'b'.repeat(64),journalCleanupVerified:true};
  if(action.startsWith('postgresql-restore-plan?'))return {id,target:file,version:proof,backupVersion:proof,changed:true,codeRestoreAvailable:true,fields:[],notice:'브라우저 검증용 백업'};
  if(['postgresql-code-plan','postgresql-code-restore-plan','mariadb-code-plan','redis-code-plan'].includes(action))return {...proofs,path:file,id,changed:true,resourceReview:{resources:[],truncated:false,totalResources:0,unsupportedSyntax:0},fields:[{key:'max_connections',before:'100',after:'120'}]};
  if(action==='postgresql-code-recovery-plan')return {...proofs,path:file,recoveryRequired:true,backupId:id,service:{unit:'postgresql@18-'+target+'.service',activeState:'failed'}};
  if(['postgresql-code-apply','postgresql-code-restore','postgresql-code-recover','mariadb-code-apply','redis-code-apply'].includes(action))return {changed:!outcomes,failed:outcomes,recovered:outcomes||action.endsWith('recover'),restored:outcomes||action!=='postgresql-code-apply',version:'b'.repeat(64),backupId:id,journalCleanupVerified:true};
  throw Error('검증 화면에서 지원하지 않는 요청입니다.');
 }return request;},[file,target,outcomes]);
 return <main style={{padding:24,maxWidth:1000,margin:'auto'}}><h1>PostgreSQL 팝업 브라우저 검사</h1><p>검증용 응답만 사용합니다. 운영 서버를 변경하지 않습니다.</p><div className="manager-actions"><button onClick={()=>setMode('apply')}>코드 적용 화면</button><button onClick={()=>setMode('restore')}>백업 복원 화면</button><button onClick={()=>setMode('recover')}>중단 복구 화면</button>{outcomes&&<><button onClick={()=>setMode('mariadb')}>MariaDB 적용 화면</button><button onClick={()=>setMode('redis')}>Redis 적용 화면</button></>}<button onClick={()=>setTarget(value=>value==='main'?'other':'main')}>대상 전환</button><button onClick={()=>setReadOnly(value=>!value)}>권한 전환</button></div><p>현재 대상: {target} · {readOnly?'조회 전용':'작업 허용'}</p>
 {mode==='hba'?<Hba input={input} api={api} connected security={security}/>:mode==='mariadb'?<Maria input={{...input,root:'/etc/mysql/my.cnf'}} api={api} connected security={security}/>:mode==='redis'?<Redis input={input} api={api} connected security={security}/>:mode==='apply'?<Operation input={input} api={api} connected security={security}/>:mode==='restore'?<Restore id={id} expectedPath={file} api={api} connected security={security}/>:<Recovery initialPath={file} api={api} connected security={security}/>}
 <h2>검증 요청 기록</h2><ol aria-label="검증 요청 기록">{calls.map((call,index)=><li key={index}>{call.action} · {call.path}</li>)}</ol></main>;
}