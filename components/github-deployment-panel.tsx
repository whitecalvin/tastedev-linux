'use client';
import {useEffect,useRef,useState} from 'react';
import type {GitHubRepository} from '../lib/github.ts';
import type {GitHubBuildJob} from '../lib/github-deploy.ts';
import type {WebhookEvent} from '../lib/github-webhooks.ts';
import {Button,IconButton,TextInput,Switch} from './ui/controls';
import {ToastNotice,useFeedback} from './ui/toast-provider';
import ConfirmDialog from './ui/confirm-dialog';
type Hook={id:string;url:string;enabled:boolean;autoDeploy:boolean;remoteId:number|null;events:WebhookEvent[];branch:string;directory:string;port:number};
type Snapshot={webhookId?:string;jobs:GitHubBuildJob[];webhook:Hook|null};
export default function GitHubDeploymentPanel({repository,version,readOnly,onClose}:{repository:GitHubRepository;version:string;readOnly:boolean;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),alive=useRef(true),lock=useRef(false);
 const [tab,setTab]=useState<'build'|'webhook'>('build'),[branch,setBranch]=useState(repository.defaultBranch||'main'),[directory,setDirectory]=useState(''),[port,setPort]=useState('3000'),[environment,setEnvironment]=useState('');
 const [snapshot,setSnapshot]=useState<Snapshot>({jobs:[],webhook:null}),[selected,setSelected]=useState(''),[busy,setBusy]=useState(false),[confirm,setConfirm]=useState<{action:'build'|'deploy'|'webhook';id?:string;register?:boolean}|null>(null);
 const [enabled,setEnabled]=useState(false),[autoDeploy,setAutoDeploy]=useState(false),[url,setUrl]=useState(''),[secret,setSecret]=useState('');
 const [notice,setNotice,kind,eventId]=useFeedback<string>('');
 async function api(body?:unknown):Promise<Snapshot&{secret?:string}>{const response=await fetch('/api/github/deploy'+(body?'':'?repository='+encodeURIComponent(repository.fullName)),{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,cache:'no-store'});if(response.status===401){window.location.replace('/login?next=%2Fgithub');throw Error('로그인이 필요합니다.');}const data=await response.json();if(!response.ok)throw Error(data.error||'배포 요청에 실패했습니다.');return data;}
 async function refresh(){const data=await api();if(alive.current)setSnapshot(data);return data;}
 useEffect(()=>{alive.current=true;dialog.current?.showModal();let fetching=false;void refresh().then(data=>{if(!alive.current)return;const hook=data.webhook;if(hook){setBranch(hook.branch);setDirectory(hook.directory);setPort(String(hook.port));setEnabled(hook.enabled);setAutoDeploy(hook.autoDeploy);setUrl(hook.url);}else if(data.webhookId)setUrl(window.location.origin+'/api/github/webhooks/'+data.webhookId);}).catch(e=>{if(alive.current)setNotice(e.message,'error');});const timer=setInterval(()=>{if(fetching||document.hidden||lock.current)return;fetching=true;void refresh().catch(()=>{}).finally(()=>{fetching=false;});},2500);return()=>{alive.current=false;clearInterval(timer);};},[]);
 const job=snapshot.jobs.find(v=>v.id===selected)||snapshot.jobs[0],running=snapshot.jobs.some(v=>['building','deploying'].includes(v.state));
 async function execute(){if(!confirm||lock.current||readOnly)return;lock.current=true;setBusy(true);setNotice('');const choice=confirm;setConfirm(null);
  try{const data=await api({...choice,repository:repository.fullName,version,branch,directory,port:Number(port),environment,enabled,autoDeploy,url,confirm:true});if(!alive.current)return;if(data.secret)setSecret(data.secret);if(choice.action==='build')setEnvironment('');await refresh();setNotice(choice.action==='build'?'빌드를 시작했습니다.':choice.action==='deploy'?'배포 후 앱 응답을 확인했습니다.':'Webhook 설정을 저장했습니다.','success');}
  catch(e){if(alive.current)setNotice(e instanceof Error?e.message:'요청에 실패했습니다.','error');}
  finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 const close=()=>{if(!busy)onClose();};
 return <><dialog ref={dialog} className="github-deploy-dialog" onCancel={e=>{e.preventDefault();close();}}>
  <header className="github-deploy-heading"><div><strong>{repository.fullName}</strong><span>Next.js 빌드 · 배포</span></div><IconButton variant="ghost" aria-label="닫기" title="닫기" disabled={busy} onClick={close}>×</IconButton></header>
  <div className="github-deploy-tabs" role="tablist" aria-label="저장소 작업"><button type="button" role="tab" aria-selected={tab==='build'} onClick={()=>setTab('build')}>빌드 · 배포</button><button type="button" role="tab" aria-selected={tab==='webhook'} onClick={()=>setTab('webhook')}>Webhooks</button></div>
  <div className="github-deploy-body">
   <p className="hint">이 관리 앱이 설치된 서버에서 실행합니다. 빌드는 웹 터미널 명령 실행·파일 저장 권한, 배포는 서비스 변경·sudo 권한이 필요합니다.</p>
   <div className="github-deploy-form"><TextInput label="브랜치" value={branch} onChange={e=>setBranch(e.target.value)} disabled={busy||running||readOnly}/><TextInput label="프로젝트 하위 폴더" placeholder="비워 두면 저장소 루트" value={directory} onChange={e=>setDirectory(e.target.value)} disabled={busy||running||readOnly}/><TextInput label="앱 포트" type="number" min={1024} max={65535} value={port} onChange={e=>setPort(e.target.value)} disabled={busy||running||readOnly}/></div>
   <label className="github-deploy-env">{tab==='webhook'?'다음 자동 빌드에 사용할 환경 변수':'빌드 환경 변수'}<textarea className="ui-input" autoComplete="off" spellCheck={false} placeholder={'KEY=value\nNEXT_PUBLIC_API_URL=https://example.com'} value={environment} onChange={e=>setEnvironment(e.target.value)} disabled={busy||running||readOnly}/></label>
   <p className="hint">npm ci → npm run build → 서비스 배포. package-lock.json이 필요합니다. 환경 변수는 이 서버에 비공개 저장되며 다시 표시하지 않습니다. Webhook 설정을 다시 저장할 때 사용할 값을 다시 입력하세요.</p>
   {tab==='build'?<>
    <div className="manager-actions"><Button disabled={busy||running||readOnly} loading={busy} onClick={()=>setConfirm({action:'build'})}>빌드 시작</Button><Button variant="secondary" disabled={busy||running||readOnly||!job||!['ready','deployed'].includes(job.state)} onClick={()=>setConfirm({action:'deploy',id:job?.id})}>{job?.state==='deployed'?'이 버전 다시 배포':'선택한 빌드 배포'}</Button><a href="/ide/packages/nodejs">Node.js 서비스 관리 ↗</a></div>
    <div className="github-build-workspace"><div className="github-build-history" aria-label="빌드 이력">{snapshot.jobs.length?snapshot.jobs.map(item=><button type="button" key={item.id} className={job?.id===item.id?'active':''} onClick={()=>setSelected(item.id)}><strong>{item.stage}</strong><span>{item.branch} · {item.createdAt.slice(0,19).replace('T',' ')} UTC</span></button>):<p className="hint">빌드 기록이 없습니다.</p>}</div><div className="github-build-log">{job?<><div className="github-build-result"><strong>{job.stage}</strong><span>{job.notice}</span></div><pre aria-label="빌드 로그">{job.log||'명령 실행 로그를 기다리는 중입니다.'}</pre></>:<div className="github-empty">저장소를 빌드하면 이곳에 로그가 표시됩니다.</div>}</div></div>
    <p className="hint">이전 빌드를 선택한 뒤 다시 배포하여 복구할 수 있습니다. 각 빌드는 별도 폴더에 보존됩니다. 배포 실패 시 자동 복구하지 않으므로 Node.js 서비스 상태를 확인하세요. 앱은 127.0.0.1에서 실행되며 외부 공개는 nginx에서 연결하세요.</p>
   </>:<>
    <div className="github-webhook-options"><Switch checked={enabled} onChange={e=>setEnabled(e.target.checked)} label="push 자동 빌드" disabled={busy||readOnly}/><Switch checked={autoDeploy} onChange={e=>setAutoDeploy(e.target.checked)} label="빌드 성공 후 자동 배포" disabled={busy||readOnly||!enabled}/></div>
    <TextInput label="외부에서 접근할 Webhook URL" value={url} onChange={e=>setUrl(e.target.value)} disabled={busy||readOnly}/>
    <p className="hint">선택한 저장소와 브랜치의 push만 처리합니다. 서명 검증·전송 ID 중복 확인을 적용합니다. 외부에서 접근 가능한 HTTPS 주소를 권장합니다. 로컬 주소는 GitHub에서 접속할 수 없습니다.</p>
    {secret&&<label className="github-deploy-env">Webhook Secret · 지금 복사해 보관하세요<input type="password" value={secret} readOnly autoComplete="off"/><Button variant="secondary" onClick={async()=>{try{await navigator.clipboard.writeText(secret);setNotice('Webhook Secret을 복사했습니다.','success');}catch{setNotice('클립보드를 사용할 수 없습니다. GitHub에 자동 등록하거나 HTTPS로 접속하세요.','error');}}}>Secret 복사</Button></label>}
    <div className="manager-actions"><Button disabled={busy||readOnly} onClick={()=>setConfirm({action:'webhook'})}>설정 저장</Button><Button variant="secondary" disabled={busy||readOnly||!!snapshot.webhook?.remoteId} onClick={()=>setConfirm({action:'webhook',register:true})}>GitHub에 Webhook 등록</Button><a href={repository.url+'/settings/hooks'} target="_blank" rel="noreferrer">GitHub Webhooks 열기 ↗</a></div>
    <p className="hint">GitHub 자동 등록에는 토큰의 Webhooks 쓰기 권한이 필요합니다. 수동 등록은 Content type을 application/json, 이벤트를 push로 설정하세요. 최초 저장 시 Secret이 한 번 제공됩니다. 설정을 끄면 이 앱의 실행만 중단되며 GitHub의 Webhook은 남습니다.</p>
    <div className="github-webhook-events"><h3>최근 전송</h3>{snapshot.webhook?.events.length?snapshot.webhook.events.map(item=><article key={item.delivery}><strong>{item.result}</strong><span>{item.at.slice(0,19)} UTC</span><code>{item.delivery}</code></article>):<p className="hint">수신한 Webhook이 없습니다.</p>}</div>
   </>}
  </div>
 </dialog><ConfirmDialog request={confirm?{title:confirm.action==='build'?'저장소 빌드 실행':confirm.action==='deploy'?'서비스 배포 실행':'Webhook 설정 적용',message:confirm.action==='build'?'이 저장소의 npm 설치·빌드 스크립트를 현재 서버 계정으로 실행합니다. 신뢰하는 코드를 선택했는지 확인하세요.':confirm.action==='deploy'?'선택한 빌드로 앱 서비스를 설치·재시작합니다. 기존 앱 연결이 끊길 수 있습니다.':confirm.register?'연결한 토큰을 사용해 이 저장소에 push Webhook을 등록합니다. 자동 빌드·배포 설정에 따라 서버에서 코드를 실행합니다.':'자동 빌드·배포 옵션에 따라 향후 push 시 이 서버에서 코드를 실행합니다.',detail:repository.fullName+' · '+branch+(confirm.action==='webhook'?' · '+url:'')}:null} onCancel={()=>setConfirm(null)} onConfirm={execute}/><ToastNotice message={notice} kind={kind} eventId={eventId} autoDismissMs={kind==='success'?3000:undefined}/></>;
}
