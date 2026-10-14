'use client';
import {ToastNotice} from './ui/toast-provider';
import {errorMessage} from './console-types';
import type {NodeServiceManagementProps,NodeServiceManagementScope,NodeServiceMutationResult,NodeServiceRestoreReview,NodeServiceBackupCatalog,NodeRegisteredService,NodeServiceRecoveryReview} from './node-types';
import {useEffect,useRef,useState} from 'react';import {Button} from './ui/controls';import {useLanguage} from './language-provider';import {featureAllowed} from '../lib/capabilities.ts';
export default function NodeServiceRecovery({api,connected,security,plan,disabled=false,onBusy,onRecovered}: NodeServiceManagementProps){
 const {t}=useLanguage(),[storedReview,setReview]=useState<NodeServiceRecoveryReview | null>(null),[storedConfirm,setStoredConfirm]=useState(false),[storedResult,setResult]=useState<NodeServiceMutationResult | null>(null),[storedError,setError]=useState(''),[storedBusy,setBusy]=useState(false),generation=useRef(0),running=useRef(false),planKey=JSON.stringify(plan??null);
 const scope=useRef<NodeServiceManagementScope | null>(null),mounted=useRef(false),viewScope=useRef<NodeServiceManagementScope | null>(null),blocked=useRef(disabled),contextKey=JSON.stringify([planKey,connected,security]);blocked.current=disabled;
 if(scope.current?.key!==contextKey||scope.current?.api!==api)scope.current={key:contextKey,api};
 const renderScope=scope.current,visible=viewScope.current===renderScope,isCurrent=()=>mounted.current&&scope.current===renderScope&&viewScope.current===renderScope&&!blocked.current;
 const review=visible?storedReview:null,confirm=visible?storedConfirm:false,result=visible?storedResult:null,error=visible?storedError:'',busy=visible?storedBusy:false;
 const canRead=connected&&security?.settings?.sudoWithoutPrompt&&security?.privilege?.ready===true&&security?.available?.serviceChanges!==false,allowed=featureAllowed(security,'serviceChanges',{sudo:true});
 const approval=useRef<{scope: NodeServiceManagementScope; review: NodeServiceRecoveryReview} | null>(null),renderApproval=approval.current;
 function setConfirm(value:boolean){approval.current=value&&review?{scope:renderScope,review}:null;setStoredConfirm(value);}
 useEffect(()=>{mounted.current=true;viewScope.current=renderScope;generation.current++;setReview(null);setConfirm(false);setResult(null);setError('');setBusy(false);return()=>{mounted.current=false;generation.current++;};},[contextKey,api]);
 async function perform(commit=false){
  if(!isCurrent()||running.current||disabled||!plan||!canRead||commit&&(!allowed||!confirm||!review?.recoveryRequired))return;
  if(commit&&(!renderApproval||approval.current!==renderApproval||renderApproval.scope!==renderScope||renderApproval.review!==review))return;
  running.current=true;const ticket=++generation.current,snapshot=review;setBusy(true);onBusy?.(true);setConfirm(false);setError('');setResult(null);if(!commit)setReview(null);
  try{
   if(commit&&snapshot?.recoveryRequired){
    const value=await api('node-app-service-recover',{id:plan.id,registryVersion:snapshot.registryVersion,files:snapshot.files,options:snapshot.options,reviewVersion:snapshot.reviewVersion,confirm:true});
    if(ticket!==generation.current||!mounted.current||scope.current!==renderScope)return;
    setResult(value);setReview(null);if(value.recovered){try{await onRecovered?.(value);}catch{if(ticket===generation.current&&mounted.current&&scope.current===renderScope)setError('복구는 완료되었지만 목록 갱신에 실패했습니다.');}}
   }else if(!commit){
    const value=await api(`node-app-service-recovery-plan?id=${encodeURIComponent(plan.id)}`);if(ticket!==generation.current||!mounted.current||scope.current!==renderScope)return;
    if(value.id!==plan.id||value.registryVersion!==plan.registryVersion||value.unit!==plan.unit||value.recoveryRequired&&!/^[a-f0-9]{64}$/.test(value.reviewVersion??''))throw Error('서비스 중단 복구를 다시 검토하세요.');setReview(value);
   }
  }catch(reason){if(ticket===generation.current&&mounted.current&&scope.current===renderScope){setError(errorMessage(reason));setReview(null);}}finally{running.current=false;if(ticket===generation.current&&mounted.current&&scope.current===renderScope)setBusy(false);onBusy?.(false);}
 }
 return <section className="live-site"><h4>{t('서비스 중단 작업 복구')}</h4><Button variant="secondary" disabled={disabled||busy||!canRead} onClick={()=>perform()}>{t('중단 작업 조회')}</Button>{review&&!review.recoveryRequired&&<p role="status">{t('중단된 서비스 설정 작업이 없습니다.')}</p>}{review?.recoveryRequired&&<><p role="alert">{t('중단된 서비스 설정 작업이 있습니다. 새 변경 전에 원본 설정을 복구하세요.')}</p><p dir="ltr">{review.unit} · {review.backupId}</p><table className="admin-table"><thead><tr><th>{t('설정')}</th><th>{t('현재')}</th><th>{t('원본')}</th></tr></thead><tbody>{([['restart','서비스 재시작 정책'],['restartSeconds','재시작 대기 시간 (초)'],['stopSeconds','종료 대기 시간']] as const).map(([key,label])=><tr key={key}><td>{t(label)}</td><td>{review.currentOptions[key]??t('시스템 기본값')}</td><td>{review.serviceOptions[key]??t('시스템 기본값')}</td></tr>)}</tbody></table><Button disabled={disabled||busy||!allowed} onClick={()=>{if(isCurrent()&&allowed&&!busy)setConfirm(true);}}>{t('중단 작업 복구')}</Button>{confirm&&<div role="alertdialog" aria-label={t('서비스 중단 복구 확인')}><p>{t('원본 서비스 설정을 복원하고 systemd 설정을 다시 읽습니다. 실행 중인 앱은 재시작하지 않습니다.')}</p><Button variant="secondary" disabled={busy} onClick={()=>{if(isCurrent()&&!busy)setConfirm(false);}}>{t('취소')}</Button><Button disabled={disabled||busy||!allowed} onClick={()=>perform(true)}>{t('서비스 중단 복구 확인')}</Button></div>}</>}{result&&<ToastNotice message={t(result.recovered?'원본 서비스 설정 복구 완료':'원본은 복원했지만 서비스 설정 복구를 확인해야 합니다.')} kind={result.recovered?'success':'error'}/>}{result?.journalCleanupVerified===false&&<p role="alert">{t('파일 작업은 완료됐지만 중단 기록 정리를 확인하지 못했습니다. 기록을 검토하세요.')}</p>}{error&&<ToastNotice message={t(error)} kind={'error'}/>}</section>;
}
