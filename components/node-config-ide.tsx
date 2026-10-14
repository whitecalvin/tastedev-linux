'use client';
import {ToastNotice} from './ui/toast-provider';
import {errorMessage,type SecurityPolicy} from './console-types';
import type {NodeIdeApi,NodeAppRegistry,NodeIdeData,PackageProfile,ToolView,PackageDraftCodeRecord} from './node-types';
import IdeSplitLayout from './ui/ide-split-layout';
import {useCallback,useEffect,useRef,useState} from 'react';
import {useLanguage} from './language-provider';
import {Button} from './ui/controls';
import NodeApps from './node-apps';
import NodeEnvFile from './node-env-file';
import {useDraftState} from './draft-provider';
import {nodeEnvFiles,nodeEnvDraftFiles} from '../lib/node-env-files.ts';
import PackageTool from './package-tool';

type IdeProps = {api:NodeIdeApi; connected:boolean; security:SecurityPolicy | null; requestedProfile:PackageProfile; initialData?:NodeIdeData | null};
type IdeScope=Pick<IdeProps,'api' | 'connected'>;
type IdeNode={type:'register' | 'settings' | 'environment'; label:string; id?:never; path?:never} | {type:'app'; id:string; label:string; path:string} | {type:'file'; id:string; label:string; path:string};
function hasRegistryVersion(data:NodeIdeData | null):data is NodeAppRegistry{return typeof data?.version==='string'&&Boolean(data.version);}
export default function NodeConfigIde({api,connected,security,requestedProfile,initialData=null}: IdeProps){
 const {t}=useLanguage();
 const [data,setData]=useState<NodeIdeData | null>(initialData),[selection,setSelection]=useState<IdeNode | null>(null),[query,setQuery]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(initialData?.error||''),[toolView,setToolView]=useState<ToolView>('settings');
 const [records]=useDraftState<Record<string,PackageDraftCodeRecord>>('packageCodeRecords',{}),recordRef=useRef(records);recordRef.current=records;
 const scope=useRef<IdeScope | null>(null),generation=useRef(0),lock=useRef<{context:IdeScope; generation:number} | null>(null);
 if(scope.current?.api!==api||scope.current?.connected!==connected)scope.current={api,connected};
 const renderScope=scope.current,mounted=useRef(false);
 const initialContext=useRef(initialData&&connected?scope.current:null);
 const dataContext=useRef(initialData&&connected?scope.current:null),selectionContext=useRef(scope.current),errorContext=useRef(scope.current);
 const visibleData=dataContext.current===scope.current?data:null;
 const visibleError=errorContext.current===scope.current?error:'';
 const visibleSelection=selectionContext.current===scope.current?selection:null;
 useEffect(()=>{mounted.current=true;if(!scope.current)scope.current={api,connected};generation.current++;setSelection(null);setToolView('settings');setBusy(false);errorContext.current=scope.current;setError(initialContext.current===scope.current?initialData?.error||'':'');if(initialContext.current!==scope.current){initialContext.current=null;setData(null);}return()=>{mounted.current=false;generation.current++;};},[api,connected]);
 const refresh=useCallback(async()=>{
  if(!connected||!mounted.current||!scope.current||scope.current!==renderScope)return;
  const context=scope.current;if(lock.current?.context===context)return;
  const ticket={context,generation:generation.current};lock.current=ticket;
  const current=()=>scope.current===context&&generation.current===ticket.generation&&lock.current===ticket;
  setBusy(true);errorContext.current=context;setError('');
  try{const [apps,files]=await Promise.all([api('node-apps'),api('files')]);const result={...apps,workspace:nodeEnvFiles(files)};if(current()){dataContext.current=context;setData(result);setSelection(previous=>previous?.type==='app'&&!result.apps.some(app=>app.id===previous.id)||previous?.type==='file'&&!result.workspace.files.includes(previous.path)&&!nodeEnvDraftFiles(recordRef.current).includes(previous.path)?null:previous);}}
  catch(failure){if(current())setError(errorMessage(failure));}
  finally{if(current())setBusy(false);if(lock.current===ticket)lock.current=null;}
 },[api,connected]);
 useEffect(()=>{if(connected&&!initialContext.current)refresh();},[connected,refresh]);
 const nodes:IdeNode[]=[{type:'register',label:t('Node.js 앱 등록')},{type:'settings',label:t('환경 설정')},{type:'environment',label:t('작업 폴더 환경 파일 관리')},...(visibleData?.apps||[]).map(app=>({type:'app' as const,id:app.id,label:app.label,path:app.directory})),...[...new Set([...(visibleData?.workspace?.files||[]),...nodeEnvDraftFiles(records)])].map(name=>({type:'file' as const,id:name,label:name+(!(visibleData?.workspace?.files||[]).includes(name)?' · '+t('미저장'):''),path:name}))];
 const childContext=scope.current;
 function updated(result:NodeAppRegistry){if(scope.current!==childContext)return;const preserveWorkspace=dataContext.current===childContext;dataContext.current=childContext;setData(previous=>({...result,workspace:preserveWorkspace?previous?.workspace:undefined}));setSelection(previous=>previous?.type==='app'&&!result.apps.some(app=>app.id===previous.id)?null:previous);}
 const selectedKey=visibleSelection?visibleSelection.type+':'+(visibleSelection.id||''):null;
 return <div className="package-config-ide" id="package-ide">
  <header className="nginx-header"><div className="nginx-header-identity"><strong>Node.js</strong></div><div className="nginx-header-actions"><Button variant="secondary" className="nginx-icon-button" title={t('새로고침')} aria-label={t('새로고침')} disabled={!connected||busy} onClick={refresh}><svg className="nginx-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1"/></svg></Button></div></header>
  <IdeSplitLayout><aside className="nginx-tree-panel"><div className="nginx-tree-title">Node.js</div><div className="nginx-tree-toolbar"><div className="nginx-tree-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><input type="search" aria-label={t('설정 검색')} placeholder={t('설정 검색')} value={query} onChange={event=>setQuery(event.target.value)}/></div></div><nav aria-label={'Node.js '+t('설정')}>{nodes.filter(node=>(node.label+' '+(node.id||'')+' '+(node.path||'')).toLowerCase().includes(query.toLowerCase())).map(node=><button type="button" className="nginx-directive" key={node.type+':'+(node.id||'')} title={node.path||node.label} aria-pressed={selectedKey===node.type+':'+(node.id||'')} onClick={()=>{if(scope.current!==childContext)return;selectionContext.current=scope.current;setSelection(node);setToolView('settings');}}>{node.label}</button>)}</nav></aside>
  <div className={'nginx-node-inspector'+(['settings','environment','file'].includes(visibleSelection?.type??'')&&toolView==='code'?' nginx-node-inspector--code':'')}>{!visibleSelection?<div className="nginx-tree-empty"><p>{t('왼쪽 노드를 선택하세요.')}</p></div>:['app','register'].includes(visibleSelection.type)?<NodeApps key={visibleSelection.type+':'+(visibleSelection.id||'')} api={api} connected={connected} security={security} initialData={hasRegistryVersion(visibleData)?visibleData:null} onServiceChanged={undefined} selectedId={visibleSelection.id} expanded tabbed onUpdated={updated}/>:visibleSelection.type==='file'?<NodeEnvFile key={visibleSelection.path} name={visibleSelection.path} api={api} connected={connected} security={security} requestedProfile={requestedProfile} view={toolView} onViewChange={setToolView}/>:<PackageTool tabbed view={toolView} onViewChange={setToolView} api={api} connected={connected} security={security} requestedProfile={requestedProfile} nodeSection={visibleSelection.type}/>}</div></IdeSplitLayout>
  {(visibleError||visibleData?.workspace?.error)&&<ToastNotice message={t(visibleError||visibleData?.workspace?.error)} kind={'error'}/>}
 </div>;
}
