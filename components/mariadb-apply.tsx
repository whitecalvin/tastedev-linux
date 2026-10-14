'use client';
import {ToastNotice} from './ui/toast-provider';
import {errorMessage,type MariaDBApi,type MariaDBApplyPlan,type DatabaseOperationResult,type SecurityPolicy} from './console-types';
import {useEffect,useRef,useState} from 'react';
import {Button} from './ui/controls';
import {useLanguage} from './language-provider';
import {featureAllowed,featureReason} from '../lib/capabilities.ts';
export default function MariaDBApply({plan,api,connected,security,busy,onBusy}: {plan: MariaDBApplyPlan; api: MariaDBApi; connected: boolean; security: SecurityPolicy | null; busy: boolean; onBusy?: (busy: boolean) => void}){
 const {t}=useLanguage();const [confirm,setConfirm]=useState(false),[result,setResult]=useState<DatabaseOperationResult | null>(null),[error,setError]=useState('');const allowed=connected&&featureAllowed(security,'databaseChanges',{sudo:true});
 const context=useRef({plan,api,connected,allowed}),generation=useRef(0),pending=useRef(false);
 if(context.current.plan!==plan||context.current.api!==api||context.current.connected!==connected||context.current.allowed!==allowed){context.current={plan,api,connected,allowed};generation.current++;}
 const renderContext=context.current,[readyContext,setReadyContext]=useState(renderContext),currentContext=readyContext===renderContext;
 useEffect(()=>{generation.current++;setConfirm(false);setResult(null);setError('');setReadyContext(renderContext);return()=>{generation.current++;};},[plan,api,connected,allowed]);
 async function apply(){
  if(!currentContext||context.current!==renderContext||!connected||!allowed||busy||pending.current||!confirm||result||!plan?.fields?.length)return;
  pending.current=true;const request=++generation.current,isCurrent=()=>request===generation.current&&context.current===renderContext;
  onBusy?.(true);setError('');
  try{const output=await api('mariadb-apply',{root:plan.root,graphVersion:plan.graphVersion,path:plan.path,version:plan.version,changes:Object.fromEntries(plan.fields.map(field=>[field.key,field.after])),confirm:true});if(isCurrent()){setResult(output);setConfirm(false);}}
  catch(e){if(isCurrent())setError(errorMessage(e));}
  finally{pending.current=false;onBusy?.(false);}
 }
 return <section className="live-site"><p className="hint">{t('선택한 main의 전체 include 후보를 검사한 뒤 파일을 적용하고 MariaDB 서비스를 재시작합니다.')}</p><Button disabled={!currentContext||!connected||busy||!allowed||Boolean(result)||!plan.fields.length} onClick={()=>{if(currentContext&&context.current===renderContext&&allowed&&!busy&&!pending.current)setConfirm(true);}}>{t('MariaDB 설정 적용')}</Button>{!allowed&&<p className="hint">{t(featureReason(security,'databaseChanges',{sudo:true}))}</p>}{currentContext&&confirm&&<div role="alertdialog" aria-label={t('MariaDB 재시작 확인')} className="config-reset-confirm"><p>{t('MariaDB 재시작으로 연결 중인 작업이 중단될 수 있습니다. 계속할까요?')}</p><p>{plan.root} → {plan.path}</p><Button variant="secondary" disabled={busy} onClick={()=>setConfirm(false)}>{t('취소')}</Button><Button disabled={!connected||busy||!allowed} loading={busy} onClick={apply}>{t('적용 및 재시작')}</Button></div>}{currentContext&&result&&<p role={result.failed?'alert':'status'}>{t(result.failed?(result.restored?(result.recovered?'변경 적용에 실패하여 원본 설정을 복원하고 서비스를 복구했습니다.':'원본은 복원했지만 서비스 복구가 필요합니다.'):'자동 복원 실패: 백업을 확인하세요.'):'설정 적용 완료')} · {t('백업 ID')}: {result.backupId||'—'} · {result.validationMode}</p>}{currentContext&&result?.serviceScope&&<p className="hint">{result.serviceScope.main} · {t(result.serviceScope.notice)}</p>}{currentContext&&result?.journalCleanupVerified===false&&<p role="alert">{t('파일 작업은 완료됐지만 중단 기록 정리를 확인하지 못했습니다. 기록을 검토하세요.')}</p>}{currentContext&&error&&<ToastNotice message={t(error)} kind={'error'}/>}</section>;
}
