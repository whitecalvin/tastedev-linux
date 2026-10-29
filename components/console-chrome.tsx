'use client';
import {ToastNotice,useFeedback} from './ui/toast-provider';
import {errorMessage,type ConsoleInitialData,type ConsoleStatus,type SecurityPolicy} from './console-types';
import type {ReactNode} from 'react';
import {workPermissionLabel} from '../lib/capabilities.ts';
import {installedPackageVersion,installedPackageVersionDetails} from '../lib/package-version.ts';
import {useCallback,useEffect,useRef,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import Link from 'next/link';
import {Button,TextInput,Badge} from './ui/controls';
import {useLanguage,LanguagePicker} from './language-provider';
import ThemePicker from './theme-picker';
import InstalledSidebar from './ui/installed-sidebar';
import {useDraftState,useClearDrafts} from './draft-provider';
import {consoleRoute,packageConsoleView} from '../lib/console-route.ts';
import {installedProfile} from '../lib/package-selection.ts';
import {useSessionMaintenance} from './use-session-maintenance';
const catalog = [
  { id: 'nginx', name: 'nginx', icon: 'N', color: 'nginx', description: '빠르고 안정적인 웹 서버.\n웹사이트 제공과 리버스 프록시의 기반.' },
  { id: 'certbot', name: 'Certbot', icon: 'C', color: 'certbot', description: 'HTTPS 인증서 관리 도구.\nnginx 연동 플러그인까지 함께 설치.' },
  { id: 'nodejs', name: 'Node.js', icon: 'JS', color: 'node', description: '서버에서 실행하는 JavaScript.\n앱 실행과 npm 패키지 관리를 함께.' },
  {id:'postgresql',name:'PostgreSQL',icon:'PG',color:'node',description:'관계형 데이터베이스 서버.\n배포판 기본 버전으로 설치합니다.'},
  {id:'mariadb',name:'MariaDB',icon:'DB',color:'node',description:'MySQL 호환 데이터베이스 서버.\n사용자·권한 설정은 별도로 진행합니다.'},
  {id:'redis',name:'Redis',icon:'R',color:'node',description:'메모리 기반 캐시·데이터 저장소.\n외부 접근 설정은 변경하지 않습니다.'},
];

type ChromeProps = {children:ReactNode; initialData?:ConsoleInitialData | null};
export default function ConsoleChrome({children,initialData}:ChromeProps){
 const {t}=useLanguage(),router=useRouter(),pathname=usePathname();
 const selectedPackage=pathname.startsWith('/ide/packages/')?pathname.split('/')[3]:null;
 const view=selectedPackage?packageConsoleView(selectedPackage):pathname.split('/')[1]||'overview';
 const [status,setStatus]=useDraftState<ConsoleStatus | null>('consoleStatus',initialData?.status??null),[security,setSecurity]=useDraftState<SecurityPolicy | null>('consoleSecurity',initialData?.security??null);
 const requestedProfile={kind:installedProfile(status?.packages,selectedPackage)};
 const [finder,setFinder]=useState(''),[loading,setLoading]=useState(false),[notice,setNotice,noticeKind,noticeEvent]=useFeedback<string>('');
 const clearDrafts=useClearDrafts(),searchDialog=useRef<HTMLDialogElement | null>(null),alive=useRef(true),request=useRef(0),locked=useRef(false);
 const views=[['overview',t('대시보드')],['packages',t('패키지 설치')],['server-settings','nginx · HTTPS · cron'],['daemon',t('데몬')],['logs',t('로그')],['recovery',t('복구')],['audit',t('감사')],['ide','GUI IDE'],['terminal',t('터미널')],['security',t('보안')],['settings',t('설정')],['github',t('GitHub 저장소')]];
 function warmRoute(route:string){router.prefetch(route);}
 function railRoute(id:string){const target=id==='ide'?installedProfile(status?.packages,selectedPackage)||installedProfile(status?.packages):null;return target?'/ide/packages/'+target:consoleRoute(id);}
 function navigate(id:string){router.push(consoleRoute(id));}
 const login=useCallback(()=>{request.current++;clearDrafts();window.location.replace('/login?next='+encodeURIComponent(window.location.pathname+window.location.search));},[clearDrafts]);
 useSessionMaintenance(login);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;request.current++;};},[]);
 useEffect(()=>{const key=(event:KeyboardEvent)=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();searchDialog.current?.showModal();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[]);
 async function refresh(){const generation=++request.current;const read=async <T,>(action:string):Promise<T | null>=>{const response=await fetch('/api/'+action,{cache:'no-store'});if(generation!==request.current||!alive.current)return null;if(response.status===401){login();return null;}const data=await response.json();if(!response.ok)throw Error(data.error||t('서버 요청에 실패했습니다.'));return data as T;};const [nextStatus,nextSecurity]=await Promise.all([read<ConsoleStatus>('status'),read<SecurityPolicy>('security')]);if(alive.current&&generation===request.current&&nextStatus&&nextSecurity){setStatus(nextStatus);setSecurity(nextSecurity);}}
 async function perform(fn:()=>Promise<void>){if(!alive.current||locked.current)return;locked.current=true;setLoading(true);setNotice('');try{await fn();}catch(error){if(alive.current)setNotice(errorMessage(error), 'error');}finally{locked.current=false;if(alive.current)setLoading(false);}}
 async function logout(){request.current++;const response=await fetch('/api/auth/logout',{method:'POST'});if(!response.ok){setNotice(t('로그아웃에 실패했습니다. 다시 시도하세요.'), 'error');return;}request.current++;clearDrafts();setStatus(null);setSecurity(null);router.replace('/login');router.refresh();}
 const Sidebar=['ide','server-settings'].includes(view)?InstalledSidebar:'aside';
 return <div className="console-shell">
    <header className="admin-topbar"><Link href="/overview" className="brand"><span className="logo">L</span> LINUX <small>Admin</small></Link><Button variant="secondary" aria-label={t("화면 · 패키지 찾기")} title={t("화면 · 패키지 찾기")} onClick={()=>searchDialog.current?.showModal()}><svg className="console-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><span>{t("화면 · 패키지 찾기")}</span><kbd>Ctrl K</kbd></Button><div className="connection"><Badge tone={security?.settings.readOnly?'neutral':'warning'}>{status?t(workPermissionLabel(security)):t("연결 대기")}</Badge><LanguagePicker/><ThemePicker/><Button variant="secondary" disabled={loading} onClick={()=>perform(logout)}>{t("로그아웃")}</Button></div></header>
    <aside className="admin-rail" aria-label={t('작업 분류')}>{[[t('현황'),'▦','overview'],[t('패키지 설치'),'⚙','packages'],[t('도구'),'⌘','ide'],[t('터미널'),'›_','terminal'],['GitHub','github','github']].map(([label,icon,id])=>{const active=id==='overview'?['overview','daemon','logs','recovery','security','audit','settings'].includes(view):id==='ide'?['ide','server-settings'].includes(view):view===id;return <button key={id} onMouseEnter={()=>warmRoute(railRoute(id))} onFocus={()=>warmRoute(railRoute(id))} title={label} aria-label={label} aria-current={active?'page':undefined} className={active?'active':''} onClick={()=>router.push(railRoute(id))}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{id==='overview'?<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>:id==='packages'?<><path d="m12 3 9 5-9 5-9-5 9-5Zm-9 5v10l9 5 9-5V8M12 13v10"/></>:id==='ide'?<><path d="m14 6 4-3 3 3-3 4-4-1-8 11-3-3 11-8-1-3Z"/></>:id==='github'?<><path d="M9 19c-4.3 1.3-4.3-2.2-6-2.7M15 22v-3.4c0-1 .1-1.5-.5-2.1 3.1-.4 6.4-1.5 6.4-7A5.4 5.4 0 0 0 19.4 6c.2-.5.7-2.4-.2-4 0 0-1.2-.4-4 1.5a13.4 13.4 0 0 0-7 0C5.4 1.6 4.2 2 4.2 2c-.9 1.6-.4 3.5-.2 4a5.4 5.4 0 0 0-1.5 3.7c0 5.4 3.3 6.5 6.4 6.9-.5.5-.6 1.1-.6 2.1V22"/></>:<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m6 8 4 4-4 4M13 16h5"/></>}</svg><span className="rail-label">{label}</span></button>;})}</aside>{!['packages','terminal','github'].includes(view)&&<Sidebar className="admin-sidebar"><div className="sidebar-title"><span>{t(['ide','server-settings'].includes(view)?'설치된 패키지':'현황')}</span>{['ide','server-settings'].includes(view)&&<Button variant="secondary" className="sidebar-refresh" title={t('설치된 패키지 갱신')} aria-label={t('설치된 패키지 갱신')} disabled={loading} onClick={()=>perform(refresh)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1"/></svg></Button>}</div><nav aria-label={t('관리 메뉴')}>{['ide','server-settings'].includes(view)?catalog.filter(item=>status?.packages.some(pkg=>pkg.id===item.id&&pkg.installed)).map(item=><button key={item.id} onMouseEnter={()=>warmRoute('/ide/packages/'+item.id)} onFocus={()=>warmRoute('/ide/packages/'+item.id)} aria-current={(requestedProfile?.kind===item.id)?'page':undefined} className={(requestedProfile?.kind===item.id)?'active':''} onClick={()=>{router.push('/ide/packages/'+item.id);}} title={installedPackageVersionDetails(status?.packages.find(pkg=>pkg.id===item.id))}>{item.name}<small> · {installedPackageVersion(status?.packages.find(pkg=>pkg.id===item.id))||t('버전 확인 불가')}</small></button>):[['overview','대시보드'],['daemon','데몬'],['logs','로그'],['recovery','복구'],['security','보안'],['audit','감사'],['settings','설정']] .map(([id,label])=><Link href={'/'+id} key={id} onMouseEnter={()=>warmRoute('/'+id)} onFocus={()=>warmRoute('/'+id)} className={view===id?'active':''} aria-current={view===id?'page':undefined}>{t(label)}</Link>)}</nav>{['ide','server-settings'].includes(view)&&!status&&<p className="hint">{t('연결 대기')}</p>}</Sidebar>}

    {children}
    <div className="admin-statusbar"><span>{status?'● '+status.hostname:t("○ 서버 연결 대기")} · {t(workPermissionLabel(security))}</span><span>{t("Ctrl K 찾기 · LINUX Server IDE")}</span></div><dialog ref={searchDialog} className="screen-finder"><TextInput label={t("화면 찾기")} value={finder} onChange={e=>setFinder(e.target.value)} autoFocus placeholder={t("IDE, 로그, 보안…")}/>{views.filter(v=>v[1].toLowerCase().includes(finder.toLowerCase())).map(([id,label])=><Button key={id} variant="secondary" onClick={()=>{navigate(id);searchDialog.current?.close();setFinder('');}}>{t(label)}</Button>)}<Button variant="secondary" onClick={()=>searchDialog.current?.close()}>{t("닫기 · Esc")}</Button></dialog>{notice&&<ToastNotice message={notice} kind={noticeKind} eventId={noticeEvent}/>}</div>;
}
