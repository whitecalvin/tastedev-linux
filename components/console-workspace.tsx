'use client';
import {ToastNotice,useFeedback} from './ui/toast-provider';
import {isPackageIdeKind} from './package-ide-types';
import {errorMessage,type ConsoleStatus,type SecurityPolicy,type TerminalReport} from './console-types';
import type {ConsoleApi,WorkspaceInitialData,InstallJob,InstallPlan} from './console-workspace-types';
import type {ReactNode} from 'react';
import {installedPackageVersion,installedPackageVersionDetails} from '../lib/package-version.ts';
import {consoleRefreshGuard} from '../lib/console-refresh.ts';
import {consoleRoute} from '../lib/console-route.ts';
import {installedProfile} from '../lib/package-selection.ts';
import {filterPackages} from '../lib/package-filter.ts';
import {useClearDrafts,useDraftState} from './draft-provider';
import {operationTerminalReport} from '../lib/operation-terminal-report.ts';
import {useLanguage} from './language-provider';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Fragment, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Button, Checkbox, TextInput, Badge, Progress, Dropdown, CustomSelect } from '../components/ui/controls';
const AiLogAssistant = dynamic(() => import('./ai-log-assistant'));
const AccountPanel = dynamic(() => import('./account-panel'));
import ThemePicker from '../components/theme-picker';
import {LanguagePicker} from './language-provider';
const NodeConfigIde = dynamic(() => import('./node-config-ide'));
const PackageConfigIde = dynamic(() => import('./package-config-ide'));
const TabbedTerminal = dynamic(() => import('./tabbed-terminal'));
const ServerManager = dynamic(() => import('./server-manager'));
const OperationsPanel = dynamic(() => import('./operations-panel'));
import {featureAllowed,workPermissionLabel} from '../lib/capabilities.ts';
const AuditPanel = dynamic(() => import('./audit-panel'));
const SecurityPanel = dynamic(() => import('./security-panel'));
const catalog = [
  { id: 'nginx', name: 'nginx', icon: 'N', color: 'nginx', description: '빠르고 안정적인 웹 서버.\n웹사이트 제공과 리버스 프록시의 기반.' },
  { id: 'certbot', name: 'Certbot', icon: 'C', color: 'certbot', description: 'HTTPS 인증서 관리 도구.\nnginx 연동 플러그인까지 함께 설치.' },
  { id: 'nodejs', name: 'Node.js', icon: 'JS', color: 'node', description: '서버에서 실행하는 JavaScript.\n앱 실행과 npm 패키지 관리를 함께.' },
  {id:'postgresql',name:'PostgreSQL',icon:'PG',color:'node',description:'관계형 데이터베이스 서버.\n배포판 기본 버전으로 설치합니다.'},
  {id:'mariadb',name:'MariaDB',icon:'DB',color:'node',description:'MySQL 호환 데이터베이스 서버.\n사용자·권한 설정은 별도로 진행합니다.'},
  {id:'redis',name:'Redis',icon:'R',color:'node',description:'메모리 기반 캐시·데이터 저장소.\n외부 접근 설정은 변경하지 않습니다.'},
];
const pageDescriptions:Record<string,string>={overview:'설치 상태와 운영 작업을 한눈에 확인합니다.',packages:'필요한 패키지를 선택하고 설치 명령을 검토합니다.',daemon:'서비스 실행 상태와 자동 시작 설정을 관리합니다.',logs:'서버 로그를 조회하고 필요한 오류를 분석합니다.',recovery:'설정 백업을 확인하고 복구 내용을 비교합니다.',security:'계정과 서버 작업 권한을 관리합니다.',audit:'서버 작업의 시각·종류·결과를 확인합니다.'};
const managementViews = ['overview','daemon','logs','recovery','security','audit','packages'];
function ConsolePage({view,children}:{view:string;children:ReactNode}) {
 const mode=view==='terminal'?'terminal-page':['ide','server-settings'].includes(view)?'ide-page':'management-page';
 const sidebar=['packages','terminal'].includes(view)?' without-sidebar':'';
 return <main data-view={view} className={'admin-content '+mode+sidebar}>{children}</main>;
}
function ConsoleBody({view,children}:{view:string;children:ReactNode}) { return managementViews.includes(view) ? <div className="management-body">{children}</div> : children; }
type WorkspaceProps={embedded?:boolean; view:string; selectedPackage?:string | null; initialData?:WorkspaceInitialData | null};
export default function ConsoleWorkspace({view,selectedPackage=null,initialData=null,embedded=false}:WorkspaceProps) {
 const managementView=managementViews.includes(view);
 const {t}=useLanguage();
 const clearDrafts=useClearDrafts();
 const [,setTerminalReports]=useDraftState<TerminalReport[]>('operationTerminalReports',[]);
  const router=useRouter();
  const [finder,setFinder]=useState('');
  const [packageQuery,setPackageQuery]=useState(''),[packageFilter,setPackageFilter]=useState('all');
  const searchDialog=useRef<HTMLDialogElement | null>(null);
  const apiGeneration=useRef(0),operationLock=useRef<object | null>(null),sessionRedirecting=useRef(false);
  const refreshGuard=useRef<ReturnType<typeof consoleRefreshGuard> | null>(null);refreshGuard.current??=consoleRefreshGuard();
  const views=[['overview',t("대시보드"),t("현황")],['packages',t("패키지 설치"),t("운영")],['server-settings','nginx · HTTPS · cron',t("운영")],['daemon',t('데몬'),t('현황')],['logs',t('로그'),t('현황')],['recovery',t('복구'),t('현황')],['audit',t('감사'),t('현황')],['ide','GUI IDE',t("도구")],['terminal',t("터미널"),t("도구")],['security',t('보안'),t('현황')]];
  function navigate(id:string){router.push(consoleRoute(id));}
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();searchDialog.current?.showModal();}};if(embedded)return;window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[embedded]);
  

  const [status, setStatus] = useDraftState<ConsoleStatus | null>('consoleStatus',initialData?.status??null);
  const [security,setSecurity]=useDraftState<SecurityPolicy | null>('consoleSecurity',initialData?.security??null);
  useEffect(()=>{if(initialData?.status){setStatus(previous=>previous??initialData.status);setSecurity(previous=>previous??initialData.security);}},[initialData,setStatus,setSecurity]);
  const connectionSnapshot=useRef(status);connectionSnapshot.current=status;
  const profileKind=installedProfile(status?.packages,selectedPackage);
  const requestedProfile=useMemo(()=>profileKind?{kind:profileKind}:null,[profileKind]);

  const [job, setJob] = useDraftState<InstallJob | null>('consoleInstallJob',()=>initialData?.status?.job??status?.job??null);
  const [selected, setSelected] = useState<string[]>([]);
  const [message,setMessage,messageKind,messageEvent]=useFeedback<string>('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<InstallPlan | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const dialog = useRef<HTMLDialogElement | null>(null);
  const allowInstall=featureAllowed(security,'packageInstall',{sudo:true});
  const installBlocked = job?.status === 'running';
  const running = installBlocked && !job?.monitoringUnavailable;
  const redirectToLogin=useCallback(()=>{
    if(sessionRedirecting.current)return;
    sessionRedirecting.current=true;apiGeneration.current++;refreshGuard.current?.invalidate();
    clearDrafts();setStatus(null);setSecurity(null);setJob(null);setSelected([]);setMessage('');
    window.location.replace('/login?next='+encodeURIComponent(consoleRoute(view,selectedPackage)+(window.location.search||'')));
  },[clearDrafts,view,selectedPackage]);
  // The transport preserves the server API contracts after authentication and error checks.
  const api = useCallback((async (action:string, body?:Record<string,unknown>) => {
    if(sessionRedirecting.current)throw Object.assign(new Error(''),{name:'SessionRedirectError',status:401});
    const generation=apiGeneration.current;
    const response = await fetch('/api/' + action, { method: body ? 'POST' : 'GET', headers: { ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), cache: 'no-store' });
    if(generation!==apiGeneration.current)throw new DOMException('Request superseded','AbortError');
    if(response.status===401){redirectToLogin();throw Object.assign(new Error(''),{name:'SessionRedirectError',status:401});}
    const data = await response.json();
    if(generation!==apiGeneration.current)throw new DOMException('Request superseded','AbortError');
    if (!response.ok) throw Object.assign(new Error(data.error || t("서버 요청에 실패했습니다.")),{status:response.status});
    const report=operationTerminalReport(action,data);if(report)setTerminalReports(previous=>[report,...previous.filter(item=>item.id!==report.id)].slice(0,20));
    return data;
  }) as ConsoleApi, [redirectToLogin,setTerminalReports]);
  const refresh = useCallback(async () => {
    return refreshGuard.current!.refresh(api,(data:ConsoleStatus,policy:SecurityPolicy)=>{
    setSecurity(policy);
    setStatus(data); setJob(data.job??null);
    setSelected(prev => prev.filter(id => !data.packages.find(p => p.id === id)?.installed));
    });
  }, [api]);
  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    let timer:ReturnType<typeof setTimeout> | undefined;
    async function poll() {
      try { const data = await api('job'); if(cancelled) return; setJob(data.job??null); if(data.job?.status !== 'running'||data.job?.monitoringUnavailable) { await refresh(); return; } } catch(error) { if(!cancelled) setMessage(errorMessage(error), 'error'); }
      if(!cancelled) timer = setTimeout(poll, 1500);
    }
    timer = setTimeout(poll, 1500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [running, api, refresh]);
  async function perform(fn:()=>Promise<unknown>) { if(operationLock.current!==null)return;const token={};operationLock.current=token;const generation=apiGeneration.current;setLoading(true);setMessage('');try { await fn(); } catch(error) { if(generation===apiGeneration.current)setMessage(errorMessage(error), 'error'); } finally { if(operationLock.current===token){operationLock.current=null;setLoading(false);} } }
  async function logout(){apiGeneration.current++;refreshGuard.current?.invalidate();const response=await fetch('/api/auth/logout',{method:'POST'});if(!response.ok){setMessage(t("로그아웃에 실패했습니다. 다시 시도하세요."), 'error');return;}apiGeneration.current++;refreshGuard.current?.invalidate();setStatus(null);setSecurity(null);setJob(null);setSelected([]);clearDrafts();setMessage('');router.replace('/login');router.refresh();}
  useEffect(()=>{if(embedded&&initialData?.status)return;let cancelled=false;fetch('/api/auth/status',{cache:'no-store'}).then(async r=>{if(cancelled||sessionRedirecting.current)return null;if(r.status===401){redirectToLogin();return null;}const data=await r.json();if(!r.ok)throw new Error(t(data.error||'로그인 상태를 확인할 수 없습니다.'));return data;}).then(data=>{if(cancelled||!data||sessionRedirecting.current)return;if(!data.authenticated){redirectToLogin();return;}if(data.authenticated&&!connectionSnapshot.current)refresh().catch(e=>{if(!sessionRedirecting.current)setMessage(errorMessage(e), 'error');});}).catch(error=>{if(!cancelled&&!sessionRedirecting.current)setMessage(errorMessage(error)||t("로그인 상태를 확인할 수 없습니다."), 'error');});return()=>{cancelled=true;apiGeneration.current++;refreshGuard.current?.invalidate();};},[refresh,redirectToLogin]);
  const Shell=embedded?Fragment:'div';
  return <Shell {...(embedded?{}:{className:"console-shell"})}>
    {!embedded&&<>    <header className="admin-topbar"><a href="/" className="brand"><span className="logo">L</span> LINUX <small>Admin</small></a><Button variant="secondary" aria-label={t("화면 · 패키지 찾기")} title={t("화면 · 패키지 찾기")} onClick={()=>searchDialog.current?.showModal()}><svg className="console-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><span>{t("화면 · 패키지 찾기")}</span><kbd>Ctrl K</kbd></Button><div className="connection"><Badge tone={security?.settings.readOnly?'neutral':'warning'}>{status?t(workPermissionLabel(security)):t("연결 대기")}</Badge><LanguagePicker/><ThemePicker/>{status&&<Button variant="secondary" onClick={logout}>{t("로그아웃")}</Button>}</div></header>
    <aside className="admin-rail" aria-label={t('작업 분류')}>{[[t('현황'),'▦','overview'],[t('패키지 설치'),'⚙','packages'],[t('도구'),'⌘','ide'],[t('터미널'),'›_','terminal']].map(([label,icon,id])=>{const active=id==='overview'?['overview','daemon','logs','recovery','security','audit'].includes(view):id==='ide'?['ide','server-settings'].includes(view):view===id;return <button key={id} title={label} aria-label={label} aria-current={active?'page':undefined} className={active?'active':''} onClick={()=>{if(id==='ide'){const target=installedProfile(status?.packages,selectedPackage)||installedProfile(status?.packages);if(target){router.push('/ide/packages/'+target);return;}}navigate(id);}}><span aria-hidden="true">{icon}</span></button>;})}</aside>{!['packages','terminal'].includes(view)&&<aside className="admin-sidebar"><div className="sidebar-title"><span>{t(['ide','server-settings'].includes(view)?'설치된 패키지':'현황')}</span>{['ide','server-settings'].includes(view)&&<Button variant="secondary" className="sidebar-refresh" title={t('설치된 패키지 갱신')} aria-label={t('설치된 패키지 갱신')} disabled={loading} onClick={()=>perform(refresh)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1"/></svg></Button>}</div><nav aria-label={t('관리 메뉴')}>{['ide','server-settings'].includes(view)?catalog.filter(item=>status?.packages.some(pkg=>pkg.id===item.id&&pkg.installed)).map(item=><button key={item.id} aria-current={(requestedProfile?.kind===item.id)?'page':undefined} className={(requestedProfile?.kind===item.id)?'active':''} onClick={()=>{router.push('/ide/packages/'+item.id);}} title={installedPackageVersionDetails(status?.packages.find(pkg=>pkg.id===item.id))}>{item.name}<small> · {installedPackageVersion(status?.packages.find(pkg=>pkg.id===item.id))||t('버전 확인 불가')}</small></button>):[['overview','대시보드'],['daemon','데몬'],['logs','로그'],['recovery','복구'],['security','보안'],['audit','감사']].map(([id,label])=><Link href={'/'+id} key={id} className={view===id?'active':''} aria-current={view===id?'page':undefined}>{t(label)}</Link>)}</nav>{['ide','server-settings'].includes(view)&&!status&&<p className="hint">{t('연결 대기')}</p>}</aside>}

</>}
    <ConsolePage view={view}><div className="admin-page-heading"><div><h1>{views.find(v=>v[0]===view)?.[1]&&t(views.find(v=>v[0]===view)?.[1])}</h1><p>{t(pageDescriptions[view]||"이 콘솔이 실행되는 서버를 관리합니다.")}</p></div><div className="management-heading-actions"><span>{status?.hostname||t("로컬 서버")}</span>{managementView&&<Button icon variant="secondary" title={t("새로고침")} aria-label={t("새로고침")} disabled={!status||loading} onClick={()=>perform(refresh)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1"/></svg></Button>}</div></div>


      <ToastNotice message={t(message)} kind={messageKind} eventId={messageEvent}/>
      {status && <ConsoleBody view={view}>
      <section className="serverbar"><div><span className="dot"/><strong>{status?.hostname || t("서버 연결 전")}</strong><small>{t("설치 대상 장비")}</small></div><span>{!status ? t("상태를 확인하려면 연결하세요") : !status.supported ? t("Ubuntu/Debian 환경 필요") : status.canInstall ? t("설치 모드 활성") : t("조회 모드 · 관리자 설치 모드 필요")}</span><Button variant="secondary" disabled={!status || loading} onClick={() => perform(refresh)}>{t("새로고침 ↻")}</Button></section>
      {view==='overview'&&<section className="admin-dashboard"><div className="dashboard-stats">{([[t("패키지 설치"),status?status.packages.filter(p=>p.installed).length:'—',t("6개 관리 대상")],[t("미설치"),status?status.packages.filter(p=>!p.installed).length:'—',t("배포판 패키지 기준")],[t("설치 작업"),job?.monitoringUnavailable?t("결과 확인 필요"):job?({running:t("진행 중"),success:t("완료"),failed:t("실패")})[job.status]||t("대기"):t("대기"),t("작업 로그 확인")],[t("보안 정책"),status?t(workPermissionLabel(security)):'—',t("권한별 독립 설정")]] as [string,string | number,string][]).map(([label,value,description])=><div key={t(label)}><span>{t(label)}</span><strong>{value}</strong><small>{description}</small></div>)}</div><div className="dashboard-columns"><section><h2>{t("패키지 현황")}</h2><table className="admin-table"><thead><tr><th>{t("패키지")}</th><th>{t("상태")}</th><th>{t("환경 설정")}</th></tr></thead><tbody>{catalog.map(item=>{const pkg=status?.packages.find(p=>p.id===item.id);return <tr key={item.id}><td>{item.name}</td><td>{pkg?pkg.installed?t("설치됨"):t("미설치"):t("연결 전")}</td><td><button disabled={pkg?.installed!==true} onClick={()=>{if(pkg?.installed===true)router.push('/ide/packages/'+item.id);}}>{t("IDE 열기 ↗")}</button></td></tr>;})}</tbody></table></section><section><h2>{t("운영 작업")}</h2><div className="dashboard-shortcuts">{views.slice(1).map(([id,label])=><button key={id} onClick={()=>navigate(id)}>{t(label)}<span>›</span></button>)}</div><p className="hint">{t(status?"운영 변경은 보안 정책과 OS 권한에 따라 실행됩니다.":"운영 변경은 보안 정책과 OS 권한에 따라 실행됩니다. 상태를 확인하기 위해 서버를 연결하세요.")}</p></section></div></section>}
      {view==='packages'&&<div className="package-filter-bar"><TextInput label={t('패키지 검색')} value={packageQuery} onChange={event=>setPackageQuery(event.target.value)} placeholder="nginx · PostgreSQL · Redis"/><CustomSelect label={t('표시 상태')} value={packageFilter} options={[['all',t('전체')],['installed',t('설치됨')],['missing',t('미설치')],['selected',t('선택한 패키지')]].map(([value,label])=>({value,label}))} onChange={event=>setPackageFilter(event.target.value)}/><span role="status">{filterPackages(catalog,status,packageQuery,packageFilter,selected).length} / {catalog.length}</span><Button icon variant="secondary" aria-label={t('검색 초기화')} title={t('검색 초기화')} onClick={()=>{setPackageQuery('');setPackageFilter('all');}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10h5M3 10V5m0 5a9 9 0 1 1 1 7M12 7v5l3 2"/></svg></Button></div>}{view==='packages'&&!filterPackages(catalog,status,packageQuery,packageFilter,selected).length&&<p className="hint" role="status">{t('조건에 맞는 패키지가 없습니다.')}</p>}{view==='packages'&&<section id="packages" className="cards" aria-label={t("설치 패키지")}>{filterPackages(catalog,status,packageQuery,packageFilter,selected).map(item => {
        const pkg = status?.packages.find(p => p.id === item.id);
        return <article className="package-card" key={item.id}><div className="cardtop"><div className="package-identity"><span className={'symbol ' + item.color}>{item.icon}</span><h2>{item.name}</h2></div><Badge tone={!pkg ? 'neutral' : pkg.installed ? 'success' : 'warning'}>{!pkg ? t("확인 전") : pkg.installed ? t("설치됨") : t("apt 설치 필요")}</Badge></div><p className="package-description" style={{whiteSpace:'pre-line'}}>{t(item.description)}</p><div className="meta">{pkg ? pkg.packages.map(p => `${p.name}: ${p.version || t("미설치")}`).join(' / ') : t("패키지 상태를 불러오세요")}</div>{item.id === 'nodejs' && status?.nodeRuntime && <div className="meta">{t("앱 실행 Node.js: ")}{status.nodeRuntime.version}<br/>{t("배포판 apt 패키지 상태와 별도입니다.")}</div>}{pkg?.sha256 && <details className="evidence"><summary>{t("실행 파일 증거")}</summary><div>{pkg.binary}<br/>SHA-256: {pkg.sha256}</div></details>}<Link className="package-config-link" href={"/ide/packages/"+item.id}>{t("환경 설정 IDE ↗")}</Link><Checkbox className="select" label={t("설치 대상에 추가")} checked={selected.includes(item.id)} disabled={!status || installBlocked || loading || pkg?.installed} onChange={e => setSelected(prev => e.target.checked ? [...prev,item.id] : prev.filter(id => id !== item.id))}/></article>;
      })}</section>}
      {view==='packages'&&<section className="action"><div><strong>{selected.length}{t("개 패키지 선택")}</strong><p>{t("선택한 패키지의 설치 명령을 먼저 확인하세요.")}</p></div><Button disabled={!selected.length || installBlocked || loading} onClick={() => perform(async () => { const data = await api('plan', {packages:selected}); setPlan({ ...data, packages:[...selected] }); setConfirmed(false); dialog.current?.showModal(); })}>{t("설치 검토 →")}</Button></section>}
      {view==='packages'&&job&&<section className="terminal package-job-log"><div className="terminalhead"><strong>{t("작업 로그")}</strong><span>{job?.monitoringUnavailable?t("결과 확인 필요"):({running:t("설치 진행 중"), success:t("설치 명령 완료"), failed:t("설치 실패")})[job.status] || t("대기 중")}</span></div>{job.monitoringUnavailable&&<p role="alert" className="hint">{t(job.monitoringMessage)}</p>}{running && <Progress label={t("패키지 설치")}/>}<pre aria-live="polite">{job ? ['$ ' + job.command.join(' '), ...job.logs].join('\n') : t("설치 작업이 없습니다.")}</pre>{job&&<details className="operation-ai"><summary>{t("설치 작업 로그 AI 분석")}</summary><AiLogAssistant api={api} connected={Boolean(status)} text={job.logs.join('\n')} source="package-install"/></details>}</section>}
      {view==='security'&&<div id="security"><AccountPanel onSessionExpired={redirectToLogin} onChanged={()=>{apiGeneration.current++;refreshGuard.current?.invalidate();setStatus(null);setSecurity(null);setJob(null);setSelected([]);clearDrafts();router.replace('/login');router.refresh();}}/><SecurityPanel initialData={security} api={api} connected={Boolean(status)} onChange={setSecurity}/></div>}{view==='server-settings'&&profileKind==='nginx'&&<div id="server-settings"><ServerManager initialData={initialData?.nginx} api={api} connected={Boolean(status)} security={security} requestedTab="nginx"/></div>}{['ide','server-settings'].includes(view)&&requestedProfile&&isPackageIdeKind(profileKind)&&<PackageConfigIde initialData={initialData?.packageIde} key={profileKind} kind={profileKind} api={api} connected={Boolean(status)} security={security} requestedProfile={requestedProfile}/>}{view==='audit'&&<AuditPanel api={api} connected={Boolean(status)}/ >}{['daemon','logs','recovery'].includes(view)&&<div id="daemon"><OperationsPanel initialData={initialData?.operations} dedicated installedPackages={status?.packages||[]} key={view} initialTab={view==='logs'?'logs':view==='recovery'?'backups':'services'} active={true} api={api} connected={Boolean(status)} security={security}/></div>}{['ide','server-settings'].includes(view)&&status&&!requestedProfile&&!selectedPackage&&<p role="status" className="hint">{t('설치된 패키지가 없습니다.')}</p>}{['ide','server-settings'].includes(view)&&status&&selectedPackage&&!requestedProfile&&<div role="status" className="live-site"><p>{catalog.find(item=>item.id===selectedPackage)?.name}: {t('요청한 패키지가 설치되어 있지 않습니다.')}</p><Link href="/packages">{t('패키지 설치로 이동')}</Link></div>}{view==='ide'&&requestedProfile&&profileKind==='nodejs'&&status&&<NodeConfigIde initialData={initialData?.nodeIde} api={api} security={security} connected={Boolean(status)} requestedProfile={requestedProfile}/ >}{view==='terminal'&&<div id="ide" className="advanced-tools"><TabbedTerminal api={api} connected={Boolean(status)} security={security}/></div>}<footer><span>LINUX / LINUX SERVER TOOLS</span><span>{t("Ubuntu · Debian / 로컬 장비 관리")}</span></footer>
      </ConsoleBody>}
    </ConsolePage>
    {!embedded&&<>    <div className="admin-statusbar"><span>{status?'● '+status.hostname:t("○ 서버 연결 대기")} · {t(workPermissionLabel(security))}</span><span>{t("Ctrl K 찾기 · LINUX Server IDE")}</span></div><dialog ref={searchDialog} className="screen-finder"><TextInput label={t("화면 찾기")} value={finder} onChange={e=>setFinder(e.target.value)} autoFocus placeholder={t("IDE, 로그, 보안…")}/>{views.filter(v=>v[1].toLowerCase().includes(finder.toLowerCase())).map(([id,label])=><Button key={id} variant="secondary" onClick={()=>{navigate(id);searchDialog.current?.close();setFinder('');}}>{t(label)}</Button>)}<Button variant="secondary" onClick={()=>searchDialog.current?.close()}>{t("닫기 · Esc")}</Button></dialog></>}<dialog ref={dialog}><h2>{t("설치 내용을 확인하세요")}</h2><p>{t("대상: ")}<strong>{status?.hostname}</strong></p><pre>{plan?.command.join(' ')}</pre><p>{t("패키지와 의존성을 설치하며, 패키지 기본 동작에 따라 서비스가 시작될 수 있습니다. 이미 설치된 선택 패키지는 업그레이드하지 않습니다. 인증서 발급과 nginx 설정은 포함하지 않습니다.")}</p>{!status?.canInstall && <p>{t("현재 조회 모드입니다. 실제 설치에는 관리자 설치 모드가 필요합니다.")}</p>}<Checkbox label={t("이 장비의 설치 영향을 확인했습니다.")} checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/><div className="dialogactions"><Button variant="secondary" disabled={loading} onClick={() => dialog.current?.close()}>{t("취소")}</Button><Button disabled={!plan?.packages?.length || !confirmed || !status?.canInstall || !allowInstall || installBlocked || loading} onClick={() => perform(async () => { if(!plan?.packages?.length||!confirmed||!status?.canInstall||!allowInstall||installBlocked)return;const result = await api('install', {packages:[...plan.packages], confirm:true}); setJob(result.job); dialog.current?.close(); })}>{loading ? t("요청 중…") : t("설치 시작")}</Button></div></dialog>
  </Shell>;
}
