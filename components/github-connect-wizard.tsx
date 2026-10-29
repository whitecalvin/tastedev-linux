'use client';
import {useEffect,useRef,useState,useId,type FormEvent} from 'react';
import type {GitHubSnapshot,GitHubVerification} from '../lib/github.ts';
import {Button,IconButton,TextInput,Badge} from './ui/controls';
import {useLanguage} from './language-provider';

type Props={version:string;readOnly:boolean;onConnected:(snapshot:GitHubSnapshot)=>void;onClose:()=>void};
const steps=['토큰 준비','토큰 입력','계정 확인','연결 완료'];
export default function GitHubConnectWizard({version,readOnly,onConnected,onClose}:Props){
 const {t}=useLanguage(),title=useId(),description=useId();
 const [step,setStep]=useState(0),[token,setToken]=useState(''),[visible,setVisible]=useState(false),[verification,setVerification]=useState<GitHubVerification|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const dialog=useRef<HTMLDialogElement>(null),body=useRef<HTMLDivElement>(null),controller=useRef<AbortController|null>(null),alive=useRef(true),locked=useRef(false),verifiedToken=useRef(''),generation=useRef(0),connectionVersion=useRef(version);
 function clearVerification(){setVerification(null);verifiedToken.current='';setError('');}
 useEffect(()=>{alive.current=true;dialog.current?.showModal();return()=>{alive.current=false;generation.current++;controller.current?.abort();verifiedToken.current='';};},[]);
 useEffect(()=>{if(connectionVersion.current===version||step===3)return;connectionVersion.current=version;generation.current++;controller.current?.abort();locked.current=false;setBusy(false);clearVerification();setStep(1);setError('GitHub 연결이 변경되었습니다. 토큰을 다시 확인하세요.');},[version,step]);
 useEffect(()=>{body.current?.scrollTo(0,0);body.current?.querySelector<HTMLElement>('h3')?.focus();},[step]);
 function close(){if(locked.current)return;setToken('');verifiedToken.current='';onClose();}
 async function submit(event:FormEvent){
  event.preventDefault();if(readOnly||locked.current||step!==1&&step!==2)return;
  const value=token.trim();if(!/^[a-zA-Z0-9_]{20,4096}$/.test(value)){setError('올바른 GitHub 토큰을 입력하세요.');return;}
  if(step===2&&(!verification||verifiedToken.current!==value)){clearVerification();setStep(1);return;}
  locked.current=true;setBusy(true);setError('');const ticket=++generation.current,abort=new AbortController();controller.current=abort;
  try{
   const response=await fetch('/api/github',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',signal:abort.signal,body:JSON.stringify({action:step===1?'verify':'connect',token:value,version,...(step===2?{expectedAccount:verification!.account.login}:{})})});
   if(response.status===401){window.location.replace('/login?next=%2Fgithub');return;}
   const data=await response.json();if(!response.ok)throw Error(data.error||'GitHub 연결을 확인하지 못했습니다.');
   if(!alive.current||generation.current!==ticket)return;
   if(step===1){verifiedToken.current=value;setVerification(data as GitHubVerification);setVisible(false);setStep(2);}
   else{setToken('');verifiedToken.current='';setVisible(false);setStep(3);onConnected(data as GitHubSnapshot);}
  }catch(failure){if(alive.current&&generation.current===ticket&&!abort.signal.aborted)setError(failure instanceof Error?failure.message:'GitHub에 연결하지 못했습니다.');}
  finally{if(alive.current&&generation.current===ticket){locked.current=false;setBusy(false);}}
 }
 return <dialog ref={dialog} className="ui-confirm-dialog github-wizard" aria-labelledby={title} aria-describedby={description} onCancel={event=>{event.preventDefault();close();}}>
  <form onSubmit={submit}>
   <header className="github-wizard-header"><div><h2 id={title}>{t('GitHub 연결 마법사')}</h2><p id={description}>{t('Personal Access Token으로 GitHub 계정과 저장소를 연결합니다.')}</p></div><IconButton variant="ghost" disabled={busy} aria-label={t('닫기')} title={t('닫기')} onClick={close}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></IconButton></header>
   <ol className="github-wizard-steps" aria-label={t('연결 단계')}>{steps.map((label,index)=><li key={label} aria-current={step===index?'step':undefined} className={step===index?'current':step>index?'complete':''}><span aria-hidden="true">{step>index?'✓':index+1}</span>{t(label)}</li>)}</ol>
   <div ref={body} className="github-wizard-body" aria-busy={busy}>
    {step===0&&<section><h3 tabIndex={-1}>{t('GitHub에서 토큰을 준비하세요')}</h3><p>{t('조회할 저장소를 선택하고 Metadata 읽기 권한으로 토큰을 발급합니다.')}</p><dl className="github-wizard-guide"><dt>Token name</dt><dd>tastedev-linux</dd><dt>Expiration</dt><dd>{t('예: 90일')}</dd><dt>Resource owner</dt><dd>{t('본인 계정 또는 저장소가 속한 조직')}</dd><dt>Repository access</dt><dd>{t('필요한 저장소 선택 또는 All repositories')}</dd><dt>Permissions</dt><dd><strong>Metadata → Read-only</strong></dd></dl><a className="ui-button ui-button--primary github-token-link" href="https://github.com/settings/personal-access-tokens/new?name=tastedev-linux&expires_in=90" target="_blank" rel="noreferrer">{t('GitHub에서 토큰 발급')} ↗</a><p className="hint">{t('새 탭에서 발급을 마친 뒤 토큰을 복사하고 이 화면으로 돌아오세요. 조직 정책에 따라 관리자 승인이 필요할 수 있습니다.')}</p><p><a href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token" target="_blank" rel="noreferrer">{t('공식 발급 안내')}</a></p></section>}
    {step===1&&<section><h3 tabIndex={-1}>{t('발급한 토큰을 입력하세요')}</h3><p>{t('먼저 계정과 저장소 조회 권한을 확인합니다. 이 단계에서는 토큰을 저장하지 않습니다.')}</p><div className="github-token-input"><TextInput label="Personal Access Token" type={visible?'text':'password'} autoComplete="new-password" spellCheck={false} value={token} maxLength={4096} disabled={busy||readOnly} onChange={event=>{setToken(event.target.value);clearVerification();}}/><IconButton variant="ghost" disabled={busy} aria-label={t(visible?'토큰 숨기기':'토큰 표시')} aria-pressed={visible} title={t(visible?'토큰 숨기기':'토큰 표시')} onClick={()=>setVisible(value=>!value)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></IconButton></div><p className="hint">{t('토큰은 채팅에 보내지 말고 이 입력란에만 붙여넣으세요.')}</p><p className="hint">{t('이미 사용 중인 연결은 마지막 저장 단계가 성공할 때까지 유지됩니다.')}</p></section>}
    {step===2&&verification&&<section><h3 tabIndex={-1}>{t('연결할 계정을 확인하세요')}</h3><div className="github-wizard-account"><div><strong>{verification.account.login}</strong>{verification.account.name&&<p>{verification.account.name}</p>}</div><Badge tone="success">{t('계정 확인 완료')}</Badge></div><dl className="github-wizard-guide"><dt>{t('조회 가능한 저장소')}</dt><dd>{verification.repositoryCount}{verification.hasMore?'+':''} {t('개')}{verification.hasMore&&<small> · {t('첫 50개 조회 결과')}</small>}</dd></dl>{verification.sample.length>0&&<ul className="github-wizard-sample">{verification.sample.map(name=><li key={name}><code>{name}</code></li>)}</ul>}{verification.repositoryCount===0&&<p className="hint">{t('조회 가능한 저장소가 없습니다. 비공개 저장소가 필요하면 토큰의 저장소 선택과 조직 승인 상태를 확인하세요.')}</p>}<p className="hint">{t('연결 및 저장을 누르면 토큰을 이 서버의 비공개 파일에 보관합니다. 이 앱 관리자들은 연결한 계정의 저장소 목록을 볼 수 있습니다.')}</p></section>}
    {step===3&&<section className="github-wizard-success"><span aria-hidden="true">✓</span><h3 tabIndex={-1}>{t('GitHub 계정을 연결했습니다')}</h3><p>{verification?.account.login}</p><p>{t('저장소 목록에서 검색과 공개 범위 필터를 사용할 수 있습니다.')}</p></section>}
    {error&&<p className="github-wizard-error" role="alert">{t(error)}</p>}
    {busy&&<p role="status" className="hint">{t(step===1?'GitHub 계정과 저장소 권한을 확인하는 중입니다.':'연결 정보를 저장하는 중입니다.')}</p>}
    {readOnly&&<p className="hint">{t('조회 전용 모드에서는 GitHub 계정을 연결할 수 없습니다.')}</p>}
   </div>
   <footer className="github-wizard-footer"><Button variant="secondary" disabled={busy} onClick={close}>{t(step===3?'닫기':'취소')}</Button><div>{step>0&&step<3&&<Button variant="secondary" disabled={busy} onClick={()=>{clearVerification();setStep(previous=>previous-1);}}>{t('이전')}</Button>}{step===0?<Button disabled={readOnly} onClick={()=>setStep(1)}>{t('토큰 입력으로')}</Button>:step===3?<Button onClick={close}>{t('저장소 목록 보기')}</Button>:<Button type="submit" loading={busy} disabled={readOnly||!token.trim()}>{t(step===1?'계정 확인':'연결 및 저장')}</Button>}</div></footer>
  </form>
 </dialog>;
}
