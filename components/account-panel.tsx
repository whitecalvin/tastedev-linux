'use client';
import {ToastNotice,useFeedback} from './ui/toast-provider';
import {useLanguage} from './language-provider';
import {useState,useRef,type FormEvent} from 'react';
import {Button,TextInput} from './ui/controls';
type AccountPanelProps = {onChanged: () => void; onSessionExpired: () => void};
export default function AccountPanel({onChanged,onSessionExpired}: AccountPanelProps){
 const {t}=useLanguage();
 const [current,setCurrent]=useState(''),[next,setNext]=useState(''),[confirm,setConfirm]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice,noticeKind,noticeEvent]=useFeedback<string>('');
 const submitting=useRef(false);
 async function submit(event: FormEvent<HTMLFormElement>){event.preventDefault();if(submitting.current)return;setNotice('');if(next!==confirm){setNotice(t("새 비밀번호가 일치하지 않습니다."));return;}submitting.current=true;setBusy(true);try{const response=await fetch('/api/auth/password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword:current,newPassword:next})});const data=await response.json();setCurrent('');if(response.status===401&&data.code==='SESSION_EXPIRED'){setNext('');setConfirm('');onSessionExpired();return;}if(!response.ok)throw new Error(data.error||t("비밀번호 변경에 실패했습니다."));setNext('');setConfirm('');onChanged();}catch(e){setNotice(e instanceof Error ? e.message : t("비밀번호 변경에 실패했습니다."), 'error');}finally{setCurrent('');submitting.current=false;setBusy(false);}}
 return <section className="account-panel"><h2>{t("관리자 계정")}</h2><p className="hint">{t("비밀번호를 변경하면 모든 로그인 세션이 종료됩니다. 새 비밀번호로 다시 로그인하세요.")}</p><form onSubmit={submit}><TextInput disabled={busy} label={t("현재 비밀번호")} type="password" autoComplete="current-password" required maxLength={256} value={current} onChange={e=>setCurrent(e.target.value)}/><TextInput disabled={busy} label={t("새 비밀번호")} type="password" autoComplete="new-password" required minLength={12} maxLength={256} value={next} onChange={e=>setNext(e.target.value)}/><TextInput disabled={busy} label={t("새 비밀번호 확인")} type="password" autoComplete="new-password" required minLength={12} maxLength={256} value={confirm} onChange={e=>setConfirm(e.target.value)}/><Button type="submit" loading={busy}>{t("비밀번호 변경")}</Button></form><ToastNotice message={t(notice)} kind={noticeKind} eventId={noticeEvent}/></section>;
}
