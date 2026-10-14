'use client';
import {ToastNotice} from './ui/toast-provider';
import {useState,useEffect,useRef} from 'react';
import {featureAllowed} from '../lib/capabilities.ts';
import {requireNodeEnvSaved} from '../lib/node-env-outcome.ts';
import {errorMessage,type SecurityPolicy} from './console-types';
import type {NodeEnvironmentApi,NodeEnvironmentBackups,NodeEnvironmentRestorePlan,NodeEnvironmentSaved} from './node-types';
import {Button} from './ui/controls';
import {useLanguage} from './language-provider';
type BackupProps = {api: NodeEnvironmentApi; connected: boolean; disabled?: boolean; security: SecurityPolicy | null; onRestored?: (result: NodeEnvironmentSaved,name: string) => void | Promise<void>};
type BackupScope = {api: NodeEnvironmentApi; connected: boolean};
export default function NodeEnvBackups({api,connected,disabled,security,onRestored}: BackupProps){
 const {t}=useLanguage(),[storedData,setData]=useState<NodeEnvironmentBackups | null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[storedPlan,setPlan]=useState<NodeEnvironmentRestorePlan | null>(null),[confirmation,setStoredConfirmation]=useState(false),[storedRestored,setRestored]=useState<NodeEnvironmentSaved | null>(null),generation=useRef(0),running=useRef<{context: BackupScope; request: number} | null>(null),scope=useRef<BackupScope | null>(null);
 if(scope.current?.api!==api||scope.current?.connected!==connected){scope.current={api,connected};generation.current++;}
 const renderScope=scope.current,owner=useRef<BackupScope | null>(renderScope),latest=useRef({disabled,security});latest.current={disabled,security};
 const visible=owner.current===renderScope,data=visible?storedData:null,plan=visible?storedPlan:null,restored=visible?storedRestored:null;
 const approval=useRef<{plan: NodeEnvironmentRestorePlan; scope: BackupScope} | null>(null),renderApproval=approval.current;
 function setConfirmation(value: boolean){approval.current=value&&plan?{plan,scope:renderScope}:null;setStoredConfirmation(value);}
 const currentScope=()=>scope.current===renderScope&&owner.current===renderScope;
 useEffect(()=>{owner.current=scope.current;generation.current++;setData(null);setPlan(null);setConfirmation(false);setRestored(null);setBusy(false);setError('');return ()=>{owner.current=null;approval.current=null;generation.current++;};},[api,connected]);
 async function refresh(){if(!currentScope()||!connected||latest.current.disabled||running.current?.context===scope.current)return;const request=++generation.current;setBusy(true);setRestored(null);setPlan(null);setConfirmation(false);setError('');try{const result=await api('node-env-backups');if(request===generation.current)setData(result);}catch(e){if(request===generation.current){setData(null);setError(errorMessage(e));}}finally{if(request===generation.current)setBusy(false);}}
 async function restore(){
  if(!currentScope()||!scope.current||!renderApproval||approval.current!==renderApproval||renderApproval.plan!==plan||renderApproval.scope!==renderScope||!connected||latest.current.disabled||!plan||!confirmation||!featureAllowed(latest.current.security,'fileEditing')||running.current?.context===scope.current)return;
  approval.current=null;const ticket={context:scope.current,request:++generation.current},selected=plan;running.current=ticket;
  const current=()=>scope.current===ticket.context&&generation.current===ticket.request;
  setBusy(true);setRestored(null);setError('');
  try{
   const result=requireNodeEnvSaved(await api('node-env-restore',{id:selected.id,name:selected.name,version:selected.version,backupVersion:selected.backupVersion,confirm:true}));
   if(!current())return;
   setRestored(result);setPlan(null);setConfirmation(false);setData(null);
   try{await onRestored?.(result,selected.name);}catch(failure){if(current())setError('설정 적용은 완료되었지만 목록 갱신에 실패했습니다.');}
  }catch(failure){if(current()){setError(errorMessage(failure));setPlan(null);setConfirmation(false);}}
  finally{if(running.current===ticket)running.current=null;if(current())setBusy(false);}
 }
 return <section className="live-site"><Button variant="secondary" disabled={!connected||disabled||busy} onClick={refresh}>{t('환경 파일 백업 조회')}</Button>{data&&<><p className="hint">{t('환경 파일 백업의 메타데이터만 표시합니다. 비밀 변수를 포함할 수 있는 원문은 표시하지 않습니다.')}</p>{!data.backups.length&&<p>{t('설정 백업이 없습니다.')}</p>}{Boolean(data.backups.length)&&<table className="admin-table"><thead><tr><th>{t('백업 ID')}</th><th>{t('환경 파일 경로')}</th><th>{t('생성 시각')}</th><th>{t('크기')}</th><th>{t('작업')}</th></tr></thead><tbody>{data.backups.map(item=><tr key={item.id}><td dir="ltr">{item.id}</td><td dir="ltr">{item.name}</td><td dir="ltr">{item.createdAt}</td><td>{item.bytes} B</td><td><Button variant="secondary" disabled={!connected||disabled||busy} onClick={async()=>{if(!currentScope()||!connected||latest.current.disabled)return;const request=++generation.current;setBusy(true);setRestored(null);setPlan(null);setConfirmation(false);setError('');try{const result=await api(`node-env-restore-plan?id=${encodeURIComponent(item.id)}`);if(request===generation.current)setPlan(result);}catch(e){if(request===generation.current)setError(errorMessage(e));}finally{if(request===generation.current)setBusy(false);}}}>{t('복원 검토')}</Button></td></tr>)}</tbody></table>}{data.warnings>0&&<p>{t('검증에 실패한 백업 제외')}: {data.warnings}</p>}{data.truncated&&<p>{t('목록 제한으로 일부 백업만 표시합니다.')}</p>}</>}{plan&&<section className="live-site"><h4>{t('환경 파일 복원 검토')}</h4><p dir="ltr">{plan.name}</p><p className="hint">{t(plan.notice)}</p><table className="admin-table"><thead><tr><th>{t('설정')}</th><th>{t('현재 값')}</th><th>{t('복원 값')}</th></tr></thead><tbody>{plan.fields.map(item=><tr key={item.key}><td>{t(item.label)}</td><td dir="ltr">{item.before??'—'}</td><td dir="ltr">{item.after??'—'}</td></tr>)}</tbody></table><Button disabled={!connected||disabled||busy||!plan.changed||!featureAllowed(security,'fileEditing')} onClick={()=>setConfirmation(true)}>{t('환경 파일 복원')}</Button>{confirmation&&<div role="alertdialog" aria-label={t('환경 파일 복원 확인')}><p>{t('환경 파일 원문 전체를 백업으로 교체합니다. 복원 전 파일도 새 백업으로 남깁니다. 계속할까요?')}</p><Button variant="secondary" disabled={busy} onClick={()=>setConfirmation(false)}>{t('취소')}</Button><Button disabled={!connected||disabled||busy||!featureAllowed(security,'fileEditing')} onClick={restore}>{t('복원 실행')}</Button></div>}<Button variant="secondary" onClick={()=>setPlan(null)}>{t('비교 닫기')}</Button></section>}{restored&&<p role="status">{t('환경 파일 복원 완료')} · {t('백업 ID')}: {restored.backupId||'—'}</p>}{error&&<ToastNotice message={t(error)} kind={'error'}/>}</section>;
}
