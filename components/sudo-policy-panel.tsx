'use client';
import {ToastNotice,useFeedback} from './ui/toast-provider';
import {errorMessage,type SudoApi,type SecurityPolicy,type SudoCurrent,type SudoPlan} from './console-types';
import {useEffect,useRef,useState} from 'react';
import {Button,Checkbox,Switch} from './ui/controls';
import {helperActionLabels} from '../lib/helper-action-labels.ts';
import {featureAllowed,featureReason} from '../lib/capabilities.ts';
import {useLanguage} from './language-provider';
export default function SudoPolicyPanel({api,connected,policy}: {api: SudoApi; connected: boolean; policy: SecurityPolicy | null}){
 const {t}=useLanguage(),[actions,setActions]=useState<string[] | null>(null),[selected,setSelected]=useState<string[]>([]),[passwordless,setPasswordless]=useState(false),[plan,setPlan]=useState<SudoPlan | null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[current,setCurrent]=useState<SudoCurrent | null>(null),[confirmed,setConfirmed]=useState(false),[message,setMessage,messageKind,messageEvent]=useFeedback<string>(''),generation=useRef(0),running=useRef(false);
 useEffect(()=>{generation.current++;setActions(null);setCurrent(null);setSelected([]);setPlan(null);setError('');setBusy(false);setConfirmed(false);setMessage('');return()=>{generation.current++;};},[connected]);
 useEffect(()=>{generation.current++;setConfirmed(false);setBusy(false);},[policy?.version]);
 function invalidate(){generation.current++;setConfirmed(false);setMessage('');setPlan(null);setError('');}
 async function perform(generate: boolean){
  if(running.current||!connected||(generate&&!selected.length))return;
  running.current=true;const request=++generation.current;setPlan(null);setConfirmed(false);setMessage('');setError('');setBusy(true);
  try{if(generate){const output=await api('sudo-policy-plan',{actions:selected,passwordless});if(request!==generation.current)return;setPlan(output);}else{const output=await api('sudo-policy-actions');if(request!==generation.current)return;setActions(output.actions);setSelected([]);}}
  catch(error){if(request===generation.current)setError(errorMessage(error));}finally{running.current=false;if(request===generation.current)setBusy(false);}
 }
 async function loadCurrent(){
  if(running.current||!connected)return;
  running.current=true;const request=++generation.current;setBusy(true);setError('');setPlan(null);setConfirmed(false);setMessage('');setCurrent(null);
  try{const [catalog,output]=await Promise.all([api('sudo-policy-actions'),api('sudo-policy-settings')]);if(request!==generation.current)return;
   if(!Array.isArray(catalog.actions)||typeof output.registered!=='boolean'||(output.registered&&(!Array.isArray(output.actions)||!output.actions.length||output.actions.some(action=>!catalog.actions.includes(action))||new Set(output.actions).size!==output.actions.length||typeof output.passwordless!=='boolean'||!/^[a-f0-9]{64}$/.test(output.version))))throw Error('현재 sudo 규칙을 확인할 수 없습니다.');
   setActions(catalog.actions);setSelected(output.registered?[...output.actions]:[]);setPasswordless(output.registered?output.passwordless:false);setCurrent(output);
  }catch(error){if(request===generation.current)setError(errorMessage(error));}finally{running.current=false;if(request===generation.current)setBusy(false);}
 }
 const allowed=featureAllowed(policy,'sudoPolicyChanges',{sudo:true});
 async function apply(){
  if(running.current||!connected||!allowed||!confirmed||!plan||!current?.registered||!/^[a-f0-9]{64}$/.test(plan.version))return;
  running.current=true;const request=++generation.current;setBusy(true);setConfirmed(false);setMessage('');setError('');
  try{const output=await api('sudo-policy-update',{confirm:true,version:current.version,passwordless:plan.passwordless,actions:plan.actions});if(request!==generation.current)return;
   setCurrent(null);setPlan(null);
   if(output.failed)throw Error(output.restored&&output.recovered?'검증에 실패하여 이전 sudo 규칙으로 복구했습니다.':'sudo 규칙 복구 상태를 서버에서 확인하세요.');
   setMessage(output.passwordless===false?'sudo 비밀번호 요구 규칙을 적용했습니다. 인증이 없는 웹 sudo 작업은 차단됩니다. 웹에서 다시 조회하거나 변경하려면 서버 터미널에서 권한을 복구하세요.':'sudo 규칙 변경 요청을 처리했습니다. 다시 조회하여 현재 규칙을 확인하세요.', output.passwordless===false?'warning':'success');
  }catch(error){if(request===generation.current){setCurrent(null);setPlan(null);setError(errorMessage(error));}}finally{running.current=false;if(request===generation.current)setBusy(false);}
 }
 function download(){if(!plan||!connected||busy)return;const url=URL.createObjectURL(new Blob([plan.text],{type:'text/plain;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download=plan.filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 return <details className="live-site"><summary>{t('sudo 권한 규칙 생성')}</summary><p className="hint">{t('서버 실행 계정과 선택한 helper 작업에 대한 규칙 초안을 만듭니다. 최초 등록 후에는 보안 권한을 확인하여 변경할 수 있습니다.')}</p><Button variant="secondary" disabled={busy||!connected} onClick={()=>perform(false)}>{t('허용 작업 조회')}</Button><Button variant="secondary" disabled={busy||!connected} onClick={loadCurrent}>{t('현재 sudo 규칙 조회')}</Button>{current&&<p className="hint" role="status">{t(current.registered?'등록된 규칙을 불러왔습니다. 실제 sudo 권한은 OS 정책에 따라 달라집니다.':'등록된 관리 규칙이 없습니다. 최초 등록은 서버에서 진행하세요.')}</p>}{actions&&<><Switch label={t('sudo 비밀번호 입력 생략')} checked={passwordless} disabled={busy||!connected} onChange={event=>{invalidate();setPasswordless(event.target.checked);}}/><div className="manager-actions"><Button variant="secondary" disabled={busy||!connected} onClick={()=>{invalidate();setSelected([...actions]);}}>{t('전체 선택')}</Button><Button variant="secondary" disabled={busy||!connected||!selected.length} onClick={()=>{invalidate();setSelected([]);}}>{t('선택 해제')}</Button></div><div className="security-options">{actions.map(action=><Checkbox key={action} label={t((helperActionLabels as Record<string,string>)[action]??action)} checked={selected.includes(action)} disabled={busy||!connected} onChange={event=>{invalidate();setSelected(previous=>event.target.checked?[...previous,action]:previous.filter(value=>value!==action));}}/>)}</div><Button disabled={busy||!connected||!selected.length} onClick={()=>perform(true)}>{t('권한 규칙 미리보기')}</Button></>}{plan&&<section><p dir="ltr">{plan.username} · UID {plan.uid} · {plan.passwordless?'NOPASSWD':'PASSWD'}</p><pre className="manager-preview" dir="ltr">{plan.text}</pre><p className="hint">{t('PASSWD 규칙은 비밀번호 입력을 요구합니다. sudo -n으로 실행하는 웹 작업은 인증이 없으면 실패합니다. 기존 OS 규칙에 따라 최종 권한이 달라질 수 있습니다.')}</p><Button variant="secondary" disabled={busy||!connected} onClick={download}>{t('권한 규칙 다운로드')}</Button>{current?.registered&&<><p className="hint">{t('PASSWD로 변경하거나 규칙 변경 명령을 해제하면 웹에서 되돌리지 못할 수 있습니다. 서버에서 복구할 수 있는지 확인하세요.')}</p><Checkbox label={t('미리본 sudo 규칙 변경과 접근 권한 영향을 확인했습니다.')} checked={confirmed} disabled={busy||!connected||!allowed} onChange={event=>setConfirmed(event.target.checked)}/><Button disabled={busy||!connected||!allowed||!confirmed} onClick={apply}>{t('sudo 규칙 적용')}</Button>{!allowed&&<p className="hint">{t(featureReason(policy,'sudoPolicyChanges',{sudo:true}))}</p>}</>}</section>}{message&&<ToastNotice message={t(message)} kind={messageKind} eventId={messageEvent}/>}{error&&<ToastNotice message={t(error)} kind={'error'}/>}</details>;
}
