'use client';
import {ToastNotice} from './ui/toast-provider';
import {errorMessage,type PostgreSQLOperationApi,type PostgreSQLCodeInput,type PostgreSQLOperationPlan,type PostgreSQLOperationResult,type SecurityPolicy} from './console-types';
import {useEffect,useRef,useState} from 'react';
import {useLanguage} from './language-provider';
import {Button,Checkbox} from './ui/controls';
import {featureAllowed,featureReason} from '../lib/capabilities.ts';
import PostgreSQLCodeRecovery from './postgresql-code-recovery';
type OperationScope = {key: string; api: PostgreSQLOperationApi};
export default function PostgreSQLCodeOperation({input,api,connected,security,onApplied}: {input: PostgreSQLCodeInput; api: PostgreSQLOperationApi; connected: boolean; security: SecurityPolicy | null; onApplied?: (result: PostgreSQLOperationResult) => void | Promise<void>}){
 const request=input;
 const {t}=useLanguage(),[storedPlan,setPlan]=useState<PostgreSQLOperationPlan | null>(null),[storedConfirmed,setConfirmed]=useState(false),[storedBusy,setBusy]=useState(false),[storedResult,setResult]=useState<PostgreSQLOperationResult | null>(null),[storedError,setError]=useState(''),[storedUncertain,setUncertain]=useState(false);
 const scope=useRef<OperationScope | null>(null),mounted=useRef(false),viewScope=useRef<OperationScope | null>(null),running=useRef(false),callback=useRef(onApplied);callback.current=onApplied;
 const key=JSON.stringify([request,connected,security]);if(scope.current?.key!==key||scope.current?.api!==api)scope.current={key,api};
 const renderScope=scope.current,visible=viewScope.current===renderScope,isCurrent=()=>mounted.current&&scope.current===renderScope&&viewScope.current===renderScope;
 const plan=visible?storedPlan:null,confirmed=visible?storedConfirmed:false,busy=visible?storedBusy:false,result=visible?storedResult:null,error=visible?storedError:'',uncertain=visible&&storedUncertain;
 useEffect(()=>{mounted.current=true;viewScope.current=renderScope;setPlan(null);setConfirmed(false);setBusy(false);setResult(null);setError('');setUncertain(false);return()=>{mounted.current=false;};},[key,api]);
 const allowed=connected&&featureAllowed(security,'databaseChanges',{sudo:true});
 async function execute(commit: boolean){if(!isCurrent()||!allowed||running.current||commit&&(!confirmed||!plan?.changed||result))return;running.current=true;const current=renderScope;setBusy(true);setConfirmed(false);setError('');if(!commit){setPlan(null);setResult(null);}
  try{if(commit){if(!plan)return;const output=await api('postgresql-code-apply',{...request,graphVersion:plan.graphVersion,candidateGraphVersion:plan.candidateGraphVersion,serviceVersion:plan.serviceVersion,reviewVersion:plan.reviewVersion,confirm:true});if(!mounted.current||scope.current!==current)return;setResult(output);if(output.version)try{await callback.current?.(output);}catch(reason){if(mounted.current&&scope.current===current)setError(output.failed?errorMessage(reason):'설정 적용은 완료되었지만 목록 갱신에 실패했습니다.');}}else{const output=await api('postgresql-code-plan',request);if(!mounted.current||scope.current!==current)return;setPlan(output);}}
  catch(reason){if(mounted.current&&scope.current===current){setError(errorMessage(reason));setPlan(null);if(commit)setUncertain(true);}}
  finally{running.current=false;if(mounted.current&&scope.current===current)setBusy(false);}
 }
 return <section className="hba-operation-review" aria-label={t('PostgreSQL 코드 검수 및 적용 검토')}>
 <p className="hint">{input.path}</p><Button disabled={!allowed||busy||Boolean(result)} loading={busy} onClick={()=>execute(false)}>{t('검수')}</Button>
 {!allowed&&<p className="hint">{t(featureReason(security,'databaseChanges',{sudo:true}))}</p>}
 {plan&&<><p role="status">{t('PostgreSQL 코드 격리 검수 완료')}</p><p className="hint">{t('전체 PostgreSQL 설정 후보를 옵션 검수하고 백업한 뒤 클러스터를 재시작합니다. 운영 데이터, TLS 파일과 시작 옵션의 영향은 별도 확인이 필요합니다.')}</p>{!plan.changed&&<p>{t('변경된 설정이 없습니다.')}</p>}
 <Checkbox label={t('PostgreSQL 재시작과 설정 변경 영향을 확인했습니다.')} checked={confirmed} disabled={!allowed||busy||!plan.changed||Boolean(result)} onChange={event=>{if(isCurrent()&&allowed&&!busy)setConfirmed(event.target.checked);}}/>
 <Button disabled={!allowed||busy||!plan.changed||!confirmed||Boolean(result)} onClick={()=>execute(true)}>{t('검토한 설정 적용')}</Button></>}
 {result&&<div role={result.failed?'alert':'status'}><ToastNotice message={t(result.codeRecovery?'원본 설정 복원 및 서비스 복구 완료':result.failed?(result.restored?(result.recovered?'변경 적용에 실패하여 원본 설정을 복원하고 서비스를 복구했습니다.':'원본은 복원했지만 서비스 복구가 필요합니다.'):'자동 복원 실패: 백업을 확인하세요.'):'설정 적용 완료')} kind={result.failed?'error':'success'}/>{result.backupId&&<p>{t('현재 설정 백업 ID')}: {result.backupId}</p>}{result.journalCleanupVerified===false&&<p role="alert">{t('파일 작업은 완료됐지만 중단 기록 정리를 확인하지 못했습니다. 기록을 검토하세요.')}</p>}</div>}
 {error&&<ToastNotice message={t(error)} kind={'error'}/>}
 {uncertain&&<PostgreSQLCodeRecovery api={api} connected={connected} security={security} initialPath={input.path} disabled={busy} onRecovered={async output=>{if(!isCurrent())return;setUncertain(false);setError('');setPlan(null);setResult({...output,codeRecovery:true});await callback.current?.(output);}}/>}</section>;
}
