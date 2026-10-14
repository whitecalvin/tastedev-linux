'use client';
import {ToastNotice,useFeedback} from './ui/toast-provider';
import {errorMessage,type NginxApi,type NginxSiteContext,type SiteRecovery,type NginxSitePlan,type NginxOperationResult} from './console-types';
import {useEffect,useId,useRef,useState} from 'react';
import {IconButton,Checkbox,Dropdown,Switch,TextInput} from './ui/controls';
import {useLanguage} from './language-provider';
export default function NginxSiteDialog({request,api,connected,allowed,policyVersion,hasLocalChanges,onClose,onApplied}: {request: {path: string; link?: string}; api: NginxApi; connected: boolean; allowed: boolean; policyVersion?: string; hasLocalChanges: boolean; onClose: () => void; onApplied?: (result: NginxOperationResult) => void | Promise<void>}){
 const {t}=useLanguage(),dialog=useRef<HTMLDialogElement>(null),title=useId(),epoch=useRef(0),running=useRef<number | null>(null),loading=useRef<{api: NginxApi; policyVersion?: string; promise: Promise<NginxSiteContext>} | null>(null);
 const [context,setContext]=useState<NginxSiteContext | null>(null),[recovery,setRecovery]=useState<SiteRecovery | null>(null),[link,setLink]=useState(''),[enabled,setEnabled]=useState(false),[plan,setPlan]=useState<NginxSitePlan | null>(null),[locale,setLocale]=useState<Record<string,string>>({LC_ALL:'',LC_COLLATE:'',LANG:''}),[confirm,setConfirm]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice,noticeKind,noticeEvent]=useFeedback<string>('');
 const invalid=useRef(false);invalid.current=!connected||!allowed||hasLocalChanges;
 async function load(ticket: number){
  // Strict Mode replays mount effects. Reuse only the in-flight read, never a
  // completed snapshot or a request made under another API/policy context.
  let read=loading.current;
  if(!read||read.api!==api||read.policyVersion!==policyVersion){
   read={api,policyVersion,promise:Promise.resolve().then(()=>api('nginx-context'))};loading.current=read;
   read.promise=read.promise.finally(()=>{if(loading.current===read)loading.current=null;});
  }
  const result=await read.promise,pending=result.siteRecovery;if(ticket!==epoch.current)return;setContext(result);setRecovery(pending);const selected=request.link||'/etc/nginx/sites-enabled/'+request.path.split('/').at(-1);setLink(selected);setEnabled(Boolean(result.sites?.enabled?.entries?.some(entry=>entry.path===selected&&entry.status==='linked'&&entry.target===request.path)));setLocale({LC_ALL:result.service.locale?.LC_ALL||'',LC_COLLATE:result.service.locale?.LC_COLLATE||'',LANG:result.service.locale?.LANG||''});setPlan(null);setConfirm(false);
 }
 useEffect(()=>{const ticket=++epoch.current;setContext(null);setRecovery(null);setPlan(null);setConfirm(false);setBusy(connected);setNotice('');if(!dialog.current?.open)dialog.current?.showModal();if(connected)load(ticket).catch(error=>{if(ticket===epoch.current)setNotice(errorMessage(error), 'error');}).finally(()=>{if(ticket===epoch.current)setBusy(false);});return()=>{epoch.current++;};},[request.path,request.link,api,connected,allowed,policyVersion]);
 useEffect(()=>{if(hasLocalChanges){setPlan(null);setConfirm(false);}},[hasLocalChanges]);
 function changeLink(value: string){setLink(value);setEnabled(Boolean(context?.sites?.enabled?.entries?.some(entry=>entry.path===value&&entry.status==='linked'&&entry.target===request.path)));setPlan(null);setConfirm(false);}
 function review(){if(!context?.service.ready)throw Error('현재 설정과 서비스를 다시 조회하세요.');return {confirm:true,pid:context.service.pid,start:context.service.start,graphVersion:context.graph.version,locale:Object.fromEntries(Object.entries(locale).filter(([,value])=>value))};}
 async function run(kind: 'review' | 'apply' | 'recover'){if(invalid.current||busy||running.current===epoch.current||!context?.service.ready)return;const ticket=++epoch.current;running.current=ticket;setBusy(true);setNotice('');try{
  if(kind==='review'){const result=await api('nginx-site-plan',{path:request.path,link,enabled,sitesVersion:context.sites.version,graphVersion:context.graph.version});if(ticket!==epoch.current)return;setPlan(result);setConfirm(false);}
  else{if(!confirm||kind==='apply'&&!plan)return;const result=await api(kind==='recover'?'nginx-site-recover':'nginx-site-apply',kind==='recover'?{graphVersion:context.graph.version,confirm:true,review:review()}:{path:request.path,link,enabled,sitesVersion:plan!.sitesVersion,graphVersion:plan!.graphVersion,confirm:true,review:review()});if(ticket!==epoch.current)return;setPlan(null);setConfirm(false);setNotice(result.failed?(result.recovered?'원본 복구 완료':'복구 상태를 확인하세요.'):kind==='recover'&&result.recovered?'원본 복구 완료':'설정 적용 완료. 트리를 다시 조회하세요.', result.failed?'error':'success');try{await onApplied?.(result);await load(ticket);}catch(error){if(ticket===epoch.current)setNotice(t('설정 적용은 완료되었지만 목록 갱신에 실패했습니다.')+' '+errorMessage(error), 'error');}}
 }catch(error){if(ticket===epoch.current){setPlan(null);setConfirm(false);setNotice(errorMessage(error), 'error');if(kind!=='review'){setContext(null);try{await load(ticket);}catch{}}}}finally{if(running.current===ticket)running.current=null;if(ticket===epoch.current)setBusy(false);}}
 const source=context?.sites?.available?.entries?.find(entry=>entry.path===request.path),links=source?.links||[],options=[...new Set(['/etc/nginx/sites-enabled/'+request.path.split('/').at(-1),...(request.link?[request.link]:[]),...links.map(entry=>entry.path)])].map(value=>({value,label:value.split('/').at(-1)||value}));
 const healthy=context?.graph.complete&&context?.sites.version&&source?.kind==='file';
 const blocked=!connected||!allowed||hasLocalChanges||busy||!context?.service.ready||recovery?.ready===false;
 return <dialog ref={dialog} className="nginx-operation-dialog" aria-labelledby={title} onCancel={event=>{event.preventDefault();if(!busy)onClose();}}>
  <div className="nginx-dialog-head"><h3 id={title}>{t('사이트 연결')}</h3><IconButton variant="secondary" title={t('닫기')} aria-label={t('닫기')} disabled={busy} onClick={onClose}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="m4 4 8 8M12 4l-8 8"/></svg></IconButton></div>
  <p><code>{request.path}</code></p>
  {!context&&request.link&&<p><code>{request.link}</code></p>}
  {context&&<><Dropdown label="sites-enabled" options={options} value={link} disabled={busy||Boolean(recovery?.recoveryRequired)} onChange={event=>changeLink(event.target.value)}/><p><code>{link}</code></p><Switch label={t('사이트 활성화')} checked={enabled} disabled={busy||Boolean(recovery?.recoveryRequired)} onChange={event=>{setEnabled(event.target.checked);setPlan(null);setConfirm(false);}}/>
   <p className="hint">{t('실제 설정 포함 여부')} · {context.sites?.enabled?.entries?.find(entry=>entry.path===link)?.included===true?t('활성화'):context.graph.complete?t('비활성화'):t('확인 필요')}</p>
   {hasLocalChanges&&<p role="status">{t('코드에 반영되지 않은 입력이 있습니다. 설정 화면에서 값을 확인하세요.')}</p>}
   {recovery?.recoveryRequired?<p role="alert"><code>{recovery.path}</code><br/><code>{recovery.link}</code> · {t('복구 상태를 확인하세요.')}</p>:<IconButton variant="secondary" title={t('설정·서비스 검토')} aria-label={t('설정·서비스 검토')} disabled={blocked||!healthy} onClick={()=>run('review')}><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor"><circle cx="7.5" cy="7.5" r="4.5"/><path d="m11 11 4 4"/></svg></IconButton>}
   {(plan||recovery?.recoveryRequired)&&<><p dir="ltr">PID {context.service.pid} · {context.service.main}</p>{plan&&!plan.changed&&<p>{t('변경 사항 없음')}</p>}<p className="hint">{t('실행 환경의 locale을 확인하세요. 조회 값은 실제 시작 환경을 보증하지 않습니다. 빈 값은 C 기본값입니다.')}</p>{['LC_ALL','LC_COLLATE','LANG'].map(key=><TextInput key={key} label={key} value={locale[key]} disabled={busy} onChange={event=>{setLocale(previous=>({...previous,[key]:event.target.value}));setConfirm(false);}}/>)}<Checkbox label={t('설정 변경, locale 및 nginx reload 영향을 검토했습니다.')} checked={confirm} disabled={busy} onChange={event=>setConfirm(event.target.checked)}/><IconButton variant="secondary" aria-label={t(recovery?.recoveryRequired?'원본 연결 복구':'검사 후 적용')} title={t(recovery?.recoveryRequired?'원본 연결 복구':'검사 후 적용')} disabled={blocked||!confirm} onClick={()=>run(recovery?.recoveryRequired?'recover':'apply')}><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor"><path d="m4 9 3 3 7-7"/></svg></IconButton></>}
  </>}
  {busy&&<p role="status">{t('처리 중')}</p>}{notice&&<ToastNotice message={t(notice)} kind={noticeKind} eventId={noticeEvent}/>}
 </dialog>;
}
