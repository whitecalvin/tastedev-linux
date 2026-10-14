'use client';
import {useState,useMemo} from 'react';
import Update from '../../components/node-service-update';
import Backups from '../../components/node-service-backups';
import type {SecurityPolicy} from '../../components/console-types';
import type {NodeServicePlan,NodeServiceManagementApi,NodeServiceSettings,NodeServiceBackupCatalog,NodeServiceRestoreReview,NodeServiceMutationResult} from '../../components/node-types';
export default function Page(){
 const [mode,setMode]=useState('update'),[connection,setConnection]=useState(1),[calls,setCalls]=useState<{connection:number;action:string}[]>([]),[busy,setBusy]=useState(false);
 const security=useMemo<SecurityPolicy>(()=>({version:'a'.repeat(64),settings:{readOnly:false,sudoWithoutPrompt:true,nginxChanges:false,databaseChanges:false,certificateChanges:false,serviceChanges:true,sudoPolicyChanges:false,cronChanges:false,packageInstall:false,fileEditing:false,terminal:false,audit:true},available:{serviceChanges:true},requirements:{},privilege:{ready:true,path:'/fixture/helper',reason:'검수 전용 응답'}}),[]);
 const plan=useMemo<NodeServicePlan>(()=>({id:'fixture',registryVersion:'a'.repeat(64),unit:'tastedev-node-fixture.service',files:[],serviceOptions:{restart:'always',restartSeconds:30,stopSeconds:null},runtime:{status:'ready'}}),[]);
 const api=useMemo<NodeServiceManagementApi>(()=>{
  function request(action:`node-app-service-settings?id=${string}`,body?:unknown):Promise<NodeServiceSettings>;
  function request(action:`node-app-service-backups?id=${string}`,body?:unknown):Promise<NodeServiceBackupCatalog>;
  function request(action:`node-app-service-restore-plan?id=${string}&backupId=${string}`,body?:unknown):Promise<NodeServiceRestoreReview>;
  function request(action:'node-app-service-update'|'node-app-service-restore',body?:unknown):Promise<NodeServiceMutationResult>;
  function request(action:string,body?:unknown):Promise<never>;
  async function request(action:string,body?:unknown):Promise<NodeServiceSettings|NodeServiceBackupCatalog|NodeServiceRestoreReview|NodeServiceMutationResult>{
   setCalls(items=>[...items,{connection,action}]);const id='12345678-1234-1234-1234-123456789abc',base={id:plan.id,registryVersion:plan.registryVersion,unit:plan.unit};
   if(action.startsWith('node-app-service-backups'))return {...base,backups:[{id,createdAt:'2026-10-08 fixture',version:'c'.repeat(64),serviceOptions:{restart:'on-failure',restartSeconds:30,stopSeconds:null}}],warnings:0,truncated:false};
   if(action.startsWith('node-app-service-settings'))return {...base,registered:true,unitVersion:'b'.repeat(64),serviceOptions:{restart:'on-failure',restartSeconds:30,stopSeconds:null}};
   if(action.startsWith('node-app-service-restore-plan'))return {...base,unitVersion:'b'.repeat(64),backupId:id,backupVersion:'c'.repeat(64),createdAt:'2026-10-08 fixture',currentOptions:{restart:'always',restartSeconds:30,stopSeconds:null},serviceOptions:{restart:'on-failure',restartSeconds:30,stopSeconds:null}};
   if(action==='node-app-service-update'||action==='node-app-service-restore')return {changed:true,backupId:id};
   throw Error('미지원 검수 요청');
  }
  return request;
 },[connection,plan]);
 return <main style={{padding:24,maxWidth:1000,margin:'auto'}}><h1>Node.js 서비스 변경·백업 복원 검사</h1><p>검수용 응답만 사용합니다. 운영 서비스는 변경하지 않습니다.</p><div><button onClick={()=>setMode('update')}>변경 화면</button><button onClick={()=>setMode('backups')}>백업 화면</button><button onClick={()=>setConnection(value=>value+1)}>연결 변경</button></div><p>연결: {connection}</p>{mode==='update'?<Update plan={plan} api={api} connected security={security} disabled={busy} onBusy={setBusy}/>:<Backups plan={plan} api={api} connected security={security} disabled={busy} onBusy={setBusy}/>}<ol aria-label="검증 요청 기록">{calls.map((call,index)=><li key={index}>{call.connection} · {call.action}</li>)}</ol></main>;
}
