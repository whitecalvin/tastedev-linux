'use client';
import {errorMessage,type SecurityPolicy} from './console-types';
import type {NodeIdeApi,PackageProfile,ToolView,WorkspaceFileRecord,PackageDraftCodeRecord} from './node-types';
import {useEffect,useRef,useState} from 'react';
import {useLanguage} from './language-provider';
import {useDraftState} from './draft-provider';
import {Button} from './ui/controls';
import PackageTool from './package-tool';
type FileProps = {name:string; api:NodeIdeApi; connected:boolean; security:SecurityPolicy | null; requestedProfile:PackageProfile; view:ToolView; onViewChange:(view:ToolView)=>void};
type FileScope = Pick<FileProps,'name' | 'api' | 'connected'> & {retry:number};
export default function NodeEnvFile({name,api,connected,security,requestedProfile,view,onViewChange}: FileProps){
 const {t}=useLanguage(),[source,setSource]=useState<{context:FileScope; record:WorkspaceFileRecord} | null>(null),[error,setError]=useState<{context:FileScope; message:string} | null>(null),[retry,setRetry]=useState(0);
 const [records]=useDraftState<Record<string,PackageDraftCodeRecord>>('packageCodeRecords',{});const stored=records['nodejs:'+name];const buffered=stored?.name===name&&stored.kind==='nodejs'?stored:null;
 const request=useRef<{context:FileScope; promise:Promise<WorkspaceFileRecord>} | null>(null),scope=useRef<FileScope | null>(null);
 if(scope.current?.api!==api||scope.current?.connected!==connected||scope.current?.name!==name||scope.current?.retry!==retry)scope.current={api,connected,name,retry};
 useEffect(()=>{
  const context=scope.current;let cancelled=false;
  setSource(null);setError(null);
  if(!connected||buffered||!context)return;
  // Strict Mode effect replay reuses the same pending read, but only its current subscriber accepts it.
  if(request.current?.context!==context)request.current={context,promise:Promise.resolve().then(()=>api(`file?name=${encodeURIComponent(name)}`))};
  request.current.promise.then(record=>{if(cancelled||scope.current!==context)return;if(record.name!==name||typeof record.text!=='string')throw Error('파일 경로를 확인하세요.');setSource({context,record});},failure=>{if(!cancelled&&scope.current===context)setError({context,message:errorMessage(failure)});}).catch(failure=>{if(!cancelled&&scope.current===context)setError({context,message:errorMessage(failure)});});
  return()=>{cancelled=true;};
 },[name,api,connected,retry]);
 if(!buffered&&error?.context===scope.current)return <div className="nginx-tree-empty"><p role="alert">{t(error.message)}</p><Button variant="secondary" disabled={!connected} onClick={()=>setRetry(value=>value+1)}>{t('새로고침')}</Button></div>;
 const record=buffered||(source?.context===scope.current&&source.record.name===name?source.record:null);
 if(!connected||!record)return <div className="nginx-tree-empty"><p role="status">{t('불러오는 중')}</p></div>;
 return <PackageTool recordKey={'nodejs:'+name} requestedCode={record} tabbed view={view} onViewChange={onViewChange} api={api} connected={connected} security={security} requestedProfile={requestedProfile} nodeSection="settings"/>;
}
