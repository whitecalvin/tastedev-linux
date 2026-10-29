'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {GitHubSnapshot,GitHubRepository,GitHubRepositoryPage,GitHubProject} from '../lib/github.ts';
import {Button,IconButton,TextInput,CustomSelect,Badge} from './ui/controls';
import {ToastNotice,useFeedback} from './ui/toast-provider';
import ConfirmDialog from './ui/confirm-dialog';
import GitHubDeploymentPanel from './github-deployment-panel';
import GitHubConnectWizard from './github-connect-wizard';
import {useLanguage} from './language-provider';

function RefreshIcon(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1"/></svg>;}
export default function GitHubRepositories({initial,readOnly}:{initial:GitHubSnapshot;readOnly:boolean}){
 const {t}=useLanguage();
 const [connection,setConnection]=useState(initial),[repositories,setRepositories]=useState<GitHubRepository[]>([]),[nextPage,setNextPage]=useState<number|null>(null),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[loaded,setLoaded]=useState(false);
 const [projects,setProjects]=useState<Record<string,GitHubProject>>({});
 const [deployment,setDeployment]=useState<GitHubRepository|null>(null);
 const [query,setQuery]=useState(''),[visibility,setVisibility]=useState('all'),[connecting,setConnecting]=useState(false),[disconnecting,setDisconnecting]=useState(false);
 const [notice,setNotice,noticeKind,noticeEvent]=useFeedback<string>('');
 const alive=useRef(true),revision=useRef(0),listController=useRef<AbortController|null>(null),mutationController=useRef<AbortController|null>(null),mutationLock=useRef(false);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;revision.current++;listController.current?.abort();mutationController.current?.abort();};},[]);
 const request=useCallback(async <T,>(url:string,signal:AbortSignal,body?:Record<string,unknown>):Promise<T>=>{
  const response=await fetch(url,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,cache:'no-store',signal});
  if(response.status===401){window.location.replace('/login?next=%2Fgithub');throw Error('로그인이 필요합니다.');}
  const result=await response.json();if(!response.ok)throw Error(result.error||'GitHub 요청에 실패했습니다.');return result as T;
 },[]);
 const load=useCallback(async(page:number,snapshot:GitHubSnapshot)=>{
  if(!snapshot.connected||!alive.current)return;
  listController.current?.abort();const controller=new AbortController();listController.current=controller;const current=++revision.current;
  setLoading(true);
  try{
   const result=await request<GitHubRepositoryPage>('/api/github?view=repositories&page='+page+'&version='+encodeURIComponent(snapshot.version),controller.signal);
   if(!alive.current||current!==revision.current||controller.signal.aborted)return;
   if(result.version!==snapshot.version)throw Error('GitHub 연결이 변경되었습니다. 새로고침하세요.');
   setRepositories(previous=>{const entries=page===1?result.repositories:[...previous,...result.repositories];return [...new Map(entries.map(item=>[item.id,item])).values()];});setNextPage(result.nextPage);setLoaded(true);
  }catch(error){if(alive.current&&current===revision.current&&!controller.signal.aborted)setNotice(error instanceof Error?error.message:'저장소 목록을 불러오지 못했습니다.','error');}
  finally{if(alive.current&&current===revision.current)setLoading(false);}
 },[request,setNotice]);
 useEffect(()=>{setRepositories([]);setNextPage(null);setLoaded(false);if(connection.connected)void load(1,connection);},[connection.version,connection.connected,load]);
 async function refresh(){
  if(loading||saving)return;setProjects({});listController.current?.abort();const controller=new AbortController();listController.current=controller;const current=++revision.current;setLoading(true);
  try{const snapshot=await request<GitHubSnapshot>('/api/github',controller.signal);if(!alive.current||current!==revision.current)return;if(snapshot.version!==connection.version){setRepositories([]);setLoaded(false);setConnection(snapshot);setLoading(false);}else if(snapshot.connected)await load(1,snapshot);else setLoading(false);}
  catch(error){if(alive.current&&current===revision.current&&!controller.signal.aborted){setNotice(error instanceof Error?error.message:'연결 상태를 조회하지 못했습니다.','error');setLoading(false);}}
 }
 async function mutate(action:'disconnect'){if(readOnly||mutationLock.current)return;mutationLock.current=true;setSaving(true);setNotice('');listController.current?.abort();revision.current++;setLoading(false);
  const controller=new AbortController();mutationController.current=controller;
  try{
   const snapshot=await request<GitHubSnapshot>('/api/github',controller.signal,{action,version:connection.version});
   if(!alive.current)return;setDisconnecting(false);setRepositories([]);setNextPage(null);setLoaded(false);setConnection(snapshot);if(snapshot.connected&&snapshot.version===connection.version)void load(1,snapshot);setNotice('GitHub 연결 정보를 삭제했습니다.','success');
  }catch(error){if(alive.current&&!controller.signal.aborted){if(action==='disconnect')setDisconnecting(false);setNotice(error instanceof Error?error.message:'GitHub 연결을 변경하지 못했습니다.','error');}}
  finally{mutationLock.current=false;if(alive.current)setSaving(false);}
 }
 // Separate, bounded requests keep repository navigation responsive.
 useEffect(()=>{
  if(!connection.connected||!repositories.length)return;
  const controller=new AbortController();let cursor=0,stopped=false;
  const entries=repositories.filter(item=>!projects[item.fullName+'@'+item.updatedAt]);
  async function worker(){
   while(cursor<entries.length&&!controller.signal.aborted&&!stopped){
    const item=entries[cursor++],key=item.fullName+'@'+item.updatedAt;
    try{
     const result=await request<GitHubProject>('/api/github?view=project&repository='+encodeURIComponent(item.fullName)+'&revision='+encodeURIComponent(item.updatedAt)+'&version='+encodeURIComponent(connection.version),controller.signal);
     if(!controller.signal.aborted)setProjects(previous=>({...previous,[key]:result}));
    }catch(error){
     if(controller.signal.aborted)return;
     stopped=true;
     const result:GitHubProject={types:[],status:'unavailable',detail:error instanceof Error?error.message:'프로젝트 종류를 확인하지 못했습니다.'};
     setProjects(previous=>({...previous,...Object.fromEntries(entries.map(entry=>[entry.fullName+'@'+entry.updatedAt,previous[entry.fullName+'@'+entry.updatedAt]||result]))}));
    }
   }
  }
  void Promise.all([worker(),worker(),worker()]);
  return()=>controller.abort();
 // Results do not restart the queue; list/version changes do.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[repositories,connection.version,connection.connected,request]);
 useEffect(()=>{setProjects({});},[connection.version]);
 const search=query.trim().toLowerCase(),visible=repositories.filter(item=>(visibility==='all'||(visibility==='private')===item.private)&&(!search||(item.fullName+' '+item.description+' '+item.language+' '+(projects[item.fullName+'@'+item.updatedAt]?.types.join(' ')||'')).toLowerCase().includes(search)));
 return <main className="admin-content management-page github-page without-sidebar">
  <header className="admin-page-heading"><div><h1>GitHub {t('저장소')}</h1><p>{t('연결한 계정에서 접근할 수 있는 저장소를 조회합니다.')}</p></div><div className="management-heading-actions"><IconButton variant="ghost" title={t('새로고침')} aria-label={t('새로고침')} disabled={loading||saving} onClick={refresh}><RefreshIcon/></IconButton></div></header>
  <div className="management-body github-body">
   <section className="github-account" aria-label={t('GitHub 계정 연결')}><div className="github-account-identity"><span className="github-account-symbol" aria-hidden="true">GH</span><div><strong>{connection.account?<a href={'https://github.com/'+connection.account.login} target="_blank" rel="noreferrer">{connection.account.login}</a>:t('GitHub 계정을 연결하세요')}</strong><p>{connection.account?.name||t('사용자가 등록한 Personal Access Token으로 연결합니다.')}</p></div><Badge tone={connection.connected?'success':'neutral'}>{t(connection.connected?'연결됨':'연결 안 됨')}</Badge></div><div className="manager-actions github-account-actions"><Button aria-label={t(connection.connected?'연결 변경':'계정 연결')} title={t(connection.connected?'연결 변경':'계정 연결')} disabled={readOnly||saving} onClick={()=>{setNotice('');setConnecting(true);}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M13 8l1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"/></svg><span>{t(connection.connected?'연결 변경':'계정 연결')}</span></Button>{connection.connected&&<Button variant="secondary" aria-label={t('연결 해제')} title={t('연결 해제')} disabled={readOnly||saving} onClick={()=>setDisconnecting(true)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m3 3 18 18M8 16l-1 1a4 4 0 0 1-6-6l3-3M14 6l1-1a4 4 0 0 1 6 6l-3 3M10 13l4-4"/></svg><span>{t('연결 해제')}</span></Button>}</div></section>
   {readOnly&&<p className="hint">{t('조회 전용 모드에서는 계정 연결을 변경할 수 없습니다.')}</p>}
   <section className="github-inventory" aria-label={t('저장소 목록')} aria-busy={loading}>
    {connection.connected&&<div className="github-inventory-toolbar"><div className="github-filters"><TextInput label={t('저장소 검색')} type="search" placeholder={t('이름 · 설명 · 언어 · 프로젝트 종류')} value={query} onChange={event=>setQuery(event.target.value)} disabled={!connection.connected}/><CustomSelect label={t('공개 범위')} value={visibility} options={[{value:'all',label:t('전체')},{value:'public',label:t('공개')},{value:'private',label:t('비공개')}]} onChange={event=>setVisibility(event.target.value)} disabled={!connection.connected}/><span className="github-result-count" role="status">{visible.length} / {repositories.length} {t('개')}</span></div>
    <p className="hint">{t('불러온 저장소에서 검색합니다. 목록은 최근 업데이트 순서입니다.')}</p></div>}
    {!connection.connected?<div className="github-empty"><strong>{t('연결된 GitHub 계정이 없습니다.')}</strong><p>{t('계정을 연결하면 공개·비공개 저장소 목록을 확인할 수 있습니다. 표시 범위는 토큰의 접근 권한에 따릅니다.')}</p></div>:!loaded&&loading?<div className="github-empty" role="status">{t('저장소를 불러오는 중입니다.')}</div>:!visible.length?<div className="github-empty"><strong>{t(loaded?'표시할 저장소가 없습니다.':'저장소 목록을 불러오지 못했습니다.')}</strong><p>{t(loaded?'검색 조건이나 토큰의 저장소 접근 권한을 확인하세요.':'상단 새로고침 버튼으로 다시 시도하세요.')}</p></div>:<div className="github-repositories">{visible.map(item=><article key={item.id} className="github-repository"><header><a href={item.url} target="_blank" rel="noreferrer">{item.fullName}</a><Badge>{t(item.private?'비공개':'공개')}</Badge>{item.archived&&<Badge>{t('보관됨')}</Badge>}<IconButton variant="ghost" className="github-build-button" aria-label={item.fullName+' 빌드 · 배포 · Webhooks'} title="빌드 · 배포 · Webhooks" disabled={readOnly||item.archived} onClick={()=>setDeployment(item)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M8 5v14l11-7L8 5Z"/></svg></IconButton></header>{item.description&&<p>{item.description}</p>}<div className="github-project-types" aria-label="프로젝트 종류" title={projects[item.fullName+'@'+item.updatedAt]?.detail||'프로젝트 파일을 확인하고 있습니다.'}>{projects[item.fullName+'@'+item.updatedAt]?.types.length?projects[item.fullName+'@'+item.updatedAt].types.map(kind=><Badge key={kind}>{kind}</Badge>):<span className="hint">{!projects[item.fullName+'@'+item.updatedAt]?'종류 확인 중…':projects[item.fullName+'@'+item.updatedAt].status==='unknown'?'종류 미확인':'종류 확인 불가'}</span>}</div><div className="github-repository-meta">{item.language&&<span>{item.language}</span>}{item.defaultBranch&&<span>{t('기본 브랜치')}: <code>{item.defaultBranch}</code></span>}{item.updatedAt&&<time dateTime={item.updatedAt}>{t('업데이트')}: {item.updatedAt.slice(0,10)} UTC</time>}</div></article>)}</div>}
    {connection.connected&&nextPage!==null&&<div className="github-load-more"><Button variant="secondary" loading={loading} disabled={saving} onClick={()=>load(nextPage,connection)}>{t('저장소 더 불러오기')}</Button></div>}
   </section>
  </div>
  {deployment&&<GitHubDeploymentPanel key={deployment.id} repository={deployment} version={connection.version} readOnly={readOnly} onClose={()=>setDeployment(null)}/>}
  {connecting&&<GitHubConnectWizard version={connection.version} readOnly={readOnly} onClose={()=>setConnecting(false)} onConnected={snapshot=>{listController.current?.abort();revision.current++;setLoading(false);setRepositories([]);setNextPage(null);setLoaded(false);setConnection(snapshot);if(snapshot.connected&&snapshot.version===connection.version)void load(1,snapshot);setNotice('GitHub 계정을 연결했습니다.','success');}}/>}
  <ConfirmDialog request={disconnecting?{title:'GitHub 연결 해제',message:'이 서버에 저장된 토큰을 삭제할까요? GitHub의 토큰 자체는 폐기하지 않습니다.',detail:connection.account?.login}:null} onCancel={()=>{if(!saving)setDisconnecting(false);}} onConfirm={()=>mutate('disconnect')}/>
  <ToastNotice message={connecting?'':notice} kind={noticeKind} eventId={noticeEvent} autoDismissMs={noticeKind==='success'?3000:undefined}/>
 </main>;
}
