'use client';
import {ToastNotice} from './ui/toast-provider';
import {errorMessage} from './console-types';
import type {NodeServiceManagementProps,NodeServiceManagementScope,NodeServiceMutationResult,NodeServiceRestoreReview,NodeServiceBackupCatalog,NodeRegisteredService,NodeServiceRecoveryReview} from './node-types';
import {useEffect,useRef,useState} from 'react';
import {Button} from './ui/controls';
import {useLanguage} from './language-provider';
import {featureAllowed} from '../lib/capabilities.ts';
export default function NodeServiceBackups({api,connected,security,plan,disabled=false,onBusy}: NodeServiceManagementProps){
 const {t}=useLanguage(),[storedCatalog,setCatalog]=useState<NodeServiceBackupCatalog | null>(null),[storedReview,setStoredReview]=useState<NodeServiceRestoreReview | null>(null),[storedResult,setResult]=useState<NodeServiceMutationResult | null>(null),[storedError,setError]=useState(''),[storedBusy,setBusy]=useState(false),generation=useRef(0),running=useRef(false);
 const planKey=JSON.stringify(plan??null),canRead=connected&&security?.settings?.sudoWithoutPrompt&&security?.privilege?.ready===true&&security?.available?.serviceChanges!==false,canRestore=featureAllowed(security,'serviceChanges',{sudo:true})&&plan?.runtime?.status==='ready';
 const scope=useRef<NodeServiceManagementScope | null>(null),mounted=useRef(false),viewScope=useRef<NodeServiceManagementScope | null>(null),blocked=useRef(disabled),contextKey=JSON.stringify([planKey,connected,security]);blocked.current=disabled;
 if(scope.current?.key!==contextKey||scope.current?.api!==api)scope.current={key:contextKey,api};
 const renderScope=scope.current,visible=viewScope.current===renderScope,isCurrent=()=>mounted.current&&scope.current===renderScope&&viewScope.current===renderScope&&!blocked.current;
 const catalog=visible?storedCatalog:null, review=visible?storedReview:null, result=visible?storedResult:null, error=visible?storedError:'', busy=visible?storedBusy:false;
 const approval=useRef<{scope: NodeServiceManagementScope; review: NodeServiceRestoreReview} | null>(null),renderApproval=approval.current;
 function setReview(value: NodeServiceRestoreReview | null){approval.current=value?{scope:renderScope,review:value}:null;setStoredReview(value);}
 useEffect(()=>{mounted.current=true;viewScope.current=renderScope;generation.current++;setCatalog(null);setReview(null);setResult(null);setError('');setBusy(false);return()=>{mounted.current=false;generation.current++;};},[contextKey,api]);
 async function perform(kind: 'list' | 'review' | 'restore',backupId?: string){
  if(!isCurrent()||running.current||disabled||!plan||!canRead||(kind==='restore'&&(!review||!canRestore)))return;
  if((kind==='restore')&&(!renderApproval||approval.current!==renderApproval||renderApproval.scope!==renderScope||renderApproval.review!==review))return;
  running.current=true;const request=++generation.current,selected=review;setReview(null);setResult(null);setError('');setBusy(true);onBusy?.(true);if(kind==='list')setCatalog(null);
  try{
   if(kind==='restore'&&selected&&plan.files&&plan.serviceOptions){
    const output=await api('node-app-service-restore',{id:plan.id,registryVersion:plan.registryVersion,files:plan.files,options:selected.serviceOptions,unitVersion:selected.unitVersion,backupId:selected.backupId,backupVersion:selected.backupVersion,confirm:true});
    if(request===generation.current&&mounted.current&&scope.current===renderScope){setResult(output);setCatalog(null);}
   }else if(kind==='list'){
    const output=await api(`node-app-service-backups?id=${encodeURIComponent(plan.id)}`);
    if(request!==generation.current||!mounted.current||scope.current!==renderScope)return;
    if(output.id!==plan.id||output.registryVersion!==plan.registryVersion)throw Error('서비스 설정을 다시 검토하세요.');setCatalog(output);
   }else if(kind==='review'&&backupId){
    const output=await api(`node-app-service-restore-plan?id=${encodeURIComponent(plan.id)}&backupId=${encodeURIComponent(backupId)}`);
    if(request!==generation.current||!mounted.current||scope.current!==renderScope)return;
    if(output.id!==plan.id||output.registryVersion!==plan.registryVersion||output.unit!==plan.unit||output.backupId!==backupId||!/^[a-f0-9]{64}$/.test(output.unitVersion??'')||!/^[a-f0-9]{64}$/.test(output.backupVersion??''))throw Error('서비스 설정을 다시 검토하세요.');setReview(output);
   }
  }catch(error){if(request===generation.current&&mounted.current&&scope.current===renderScope)setError(errorMessage(error));}finally{running.current=false;if(request===generation.current&&mounted.current&&scope.current===renderScope)setBusy(false);onBusy?.(false);}
 }
 return <section className="live-site"><h4>{t('서비스 설정 백업')}</h4><Button variant="secondary" disabled={disabled||busy||!canRead} onClick={()=>perform('list')}>{t('백업 목록 조회')}</Button>{catalog&&<><p>{catalog.backups.length} · {t('백업')}{catalog.warnings>0&&<> · {t('읽을 수 없는 백업')}: {catalog.warnings}</>}{catalog.truncated&&<> · {t('목록 일부만 표시됩니다.')}</>}</p><div className="manager-actions">{catalog.backups.map(item=><Button key={item.id} variant="secondary" disabled={disabled||busy||!canRead} onClick={()=>perform('review',item.id)}><span dir="ltr">{item.createdAt} · {item.id}</span></Button>)}</div></>}{review&&plan&&<div role="alertdialog" aria-label={t('서비스 백업 복원 확인')}><p dir="ltr">{plan.unit} · {review.createdAt}</p><table className="admin-table"><thead><tr><th>{t('설정')}</th><th>{t('현재')}</th><th>{t('백업')}</th></tr></thead><tbody>{([['restart','서비스 재시작 정책'],['restartSeconds','재시작 대기 시간 (초)'],['stopSeconds','종료 대기 시간']] as const).map(([key,label])=><tr key={key}><td>{t(label)}</td><td>{review.currentOptions[key]??t('시스템 기본값')}</td><td>{review.serviceOptions[key]??t('시스템 기본값')}</td></tr>)}</tbody></table><p>{t('복원 전 설정을 백업합니다. 실행 중인 앱에 적용하려면 별도로 재시작하세요.')}</p><Button variant="secondary" disabled={busy} onClick={()=>{if(isCurrent()&&!busy)setReview(null);}}>{t('취소')}</Button><Button disabled={disabled||busy||!canRestore||!canRead} onClick={()=>perform('restore')}>{t('서비스 백업 복원 확인')}</Button></div>}{result&&<p role={result.failed?'alert':'status'}>{t(result.failed?(result.restored&&result.recovered?'설정 변경 실패: 이전 설정으로 복구했습니다.':'설정 변경 실패: 수동 복구가 필요합니다.'):result.changed?'서비스 백업 복원 완료':'설정 변경 없음')}{result.backupId&&<> · {t('백업')}: <span dir="ltr">{result.backupId}</span></>}</p>}{error&&<ToastNotice message={t(error)} kind={'error'}/>}</section>;
}
