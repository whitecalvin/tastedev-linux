'use client';
import {ToastNotice} from './ui/toast-provider';
import {errorMessage} from './console-types';
import type {NodeServiceManagementProps,NodeServiceManagementScope,NodeServiceMutationResult,NodeServiceRestoreReview,NodeServiceBackupCatalog,NodeRegisteredService,NodeServiceRecoveryReview} from './node-types';
import {useEffect,useRef,useState} from 'react';
import {Button} from './ui/controls';
import {useLanguage} from './language-provider';
import {featureAllowed,featureReason} from '../lib/capabilities.ts';
export default function NodeServiceUpdate({api,connected,security,plan,disabled=false,onBusy,recoveryVersion=0}: NodeServiceManagementProps){
 const {t}=useLanguage(),[storedReview,setStoredReview]=useState<NodeRegisteredService | null>(null),[storedBusy,setBusy]=useState(false),[storedResult,setResult]=useState<NodeServiceMutationResult | null>(null),[storedError,setError]=useState(''),generation=useRef(0),running=useRef(false);
 const planKey=JSON.stringify(plan??null),allowed=featureAllowed(security,'serviceChanges',{sudo:true});
 const scope=useRef<NodeServiceManagementScope | null>(null),mounted=useRef(false),viewScope=useRef<NodeServiceManagementScope | null>(null),blocked=useRef(disabled),contextKey=JSON.stringify([planKey,connected,security,recoveryVersion]);blocked.current=disabled;
 if(scope.current?.key!==contextKey||scope.current?.api!==api)scope.current={key:contextKey,api};
 const renderScope=scope.current,visible=viewScope.current===renderScope,isCurrent=()=>mounted.current&&scope.current===renderScope&&viewScope.current===renderScope&&!blocked.current;
 const review=visible?storedReview:null, busy=visible?storedBusy:false, result=visible?storedResult:null, error=visible?storedError:'';
 const approval=useRef<{scope: NodeServiceManagementScope; review: NodeRegisteredService} | null>(null),renderApproval=approval.current;
 function setReview(value: NodeRegisteredService | null){approval.current=value?{scope:renderScope,review:value}:null;setStoredReview(value);}
 useEffect(()=>{mounted.current=true;viewScope.current=renderScope;generation.current++;setReview(null);setResult(null);setError('');setBusy(false);return()=>{mounted.current=false;generation.current++;};},[contextKey,api]);
 async function perform(apply: boolean){
  if(!isCurrent()||running.current||!connected||!allowed||disabled||!plan||plan.runtime?.status!=='ready'||(apply&&!review))return;
  if((apply)&&(!renderApproval||approval.current!==renderApproval||renderApproval.scope!==renderScope||renderApproval.review!==review))return;
  running.current=true;const request=++generation.current,selected=review;setBusy(true);onBusy?.(true);setReview(null);setResult(null);setError('');
  try{
   if(apply&&selected&&plan.files&&plan.serviceOptions){const output=await api('node-app-service-update',{id:plan.id,registryVersion:plan.registryVersion,files:plan.files,options:plan.serviceOptions,unitVersion:selected.unitVersion,confirm:true});if(request===generation.current&&mounted.current&&scope.current===renderScope)setResult(output);}
   else{const output=await api(`node-app-service-settings?id=${encodeURIComponent(plan.id)}`);if(request!==generation.current||!mounted.current||scope.current!==renderScope)return;if(!output.registered)throw Error('등록된 서비스 설정이 없습니다.');if(output.registryVersion!==plan.registryVersion||output.unit!==plan.unit||!/^[a-f0-9]{64}$/.test(output.unitVersion??''))throw Error('서비스 설정을 다시 검토하세요.');setReview(output);}
  }catch(error){if(request===generation.current&&mounted.current&&scope.current===renderScope)setError(errorMessage(error));}finally{running.current=false;if(request===generation.current&&mounted.current&&scope.current===renderScope)setBusy(false);onBusy?.(false);}
 }
 return <section className="live-site"><h4>{t('기존 서비스 설정 변경')}</h4><Button variant="secondary" disabled={disabled||busy||!connected||!allowed||plan?.runtime?.status!=='ready'} onClick={()=>perform(false)}>{t('기존 서비스 설정 변경')}</Button>{!allowed&&<p className="hint">{t(featureReason(security,'serviceChanges',{sudo:true}))}</p>}{review&&plan&&plan.serviceOptions&&<div role="alertdialog" aria-label={t('서비스 설정 변경 확인')}><p dir="ltr">{plan.unit}</p><table className="admin-table"><thead><tr><th>{t('설정')}</th><th>{t('현재')}</th><th>{t('변경')}</th></tr></thead><tbody>{([['restart','서비스 재시작 정책'],['restartSeconds','재시작 대기 시간 (초)'],['stopSeconds','종료 대기 시간']] as const).map(([key,label])=><tr key={key}><td>{t(label)}</td><td>{review.serviceOptions[key]??t('시스템 기본값')}</td><td>{plan.serviceOptions[key]??t('시스템 기본값')}</td></tr>)}</tbody></table><p>{t('기존 설정을 백업하고 변경합니다. 실행 중인 앱에 적용하려면 별도로 재시작하세요.')}</p><Button variant="secondary" disabled={busy} onClick={()=>{if(isCurrent()&&!busy)setReview(null);}}>{t('취소')}</Button><Button disabled={disabled||busy||!connected||!allowed} onClick={()=>perform(true)}>{t('서비스 설정 변경 확인')}</Button></div>}{result&&<p role={result.failed?'alert':'status'}>{t(result.failed?(result.restored&&result.recovered?'설정 변경 실패: 이전 설정으로 복구했습니다.':'설정 변경 실패: 수동 복구가 필요합니다.'):result.changed?'서비스 설정 변경 완료':'설정 변경 없음')}{result.backupId&&<> · {t('백업')}: <span dir="ltr">{result.backupId}</span></>}</p>}{error&&<ToastNotice message={t(error)} kind={'error'}/>}</section>;
}
