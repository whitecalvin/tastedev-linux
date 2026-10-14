'use client';
import {ToastNotice} from './ui/toast-provider';
import {errorMessage,type RedisApi,type RedisConfigPlan,type DatabaseOperationResult,type SecurityPolicy} from './console-types';
import {useEffect,useRef,useState} from 'react';
import {Button,Checkbox} from './ui/controls';
import {useLanguage} from './language-provider';
import {featureAllowed,featureReason} from '../lib/capabilities.ts';
export default function RedisOperation({plan,restore=false,api,connected,security,disabled=false,onApplied}: {plan: RedisConfigPlan; restore?: boolean; api: RedisApi; connected: boolean; security: SecurityPolicy | null; disabled?: boolean; onApplied?: (result: DatabaseOperationResult,path?: string) => void | Promise<void>}){
 const {t}=useLanguage(),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[result,setResult]=useState<DatabaseOperationResult | null>(null),[error,setError]=useState('');
 const generation=useRef(0),running=useRef(false);
 const allowed=connected&&featureAllowed(security,'databaseChanges',{sudo:true});
 const context=useRef({plan,restore,api,connected,allowed});
 if(context.current.plan!==plan||context.current.restore!==restore||context.current.api!==api||context.current.connected!==connected||context.current.allowed!==allowed){context.current={plan,restore,api,connected,allowed};generation.current++;}
 const renderContext=context.current,[readyContext,setReadyContext]=useState(renderContext),currentContext=readyContext===renderContext,confirmation=useRef<typeof renderContext | null>(null),live=useRef({disabled});live.current={disabled};
 if(!currentContext)confirmation.current=null;
 useEffect(()=>{generation.current++;confirmation.current=null;setConfirmed(false);setBusy(false);setResult(null);setError('');setReadyContext(renderContext);return()=>{generation.current++;};},[renderContext]);
 const ready=Boolean(plan?.version&&plan?.graphVersion&&(restore?plan.changed&&plan.id&&plan.backupVersion&&plan.restoreGraphVersion:plan.fields?.length&&plan.path==='/etc/redis/redis.conf'));
 async function execute(){
  if(!currentContext||context.current!==renderContext||!allowed||!ready||live.current.disabled||running.current||!confirmed||confirmation.current!==renderContext||result)return;confirmation.current=null;setConfirmed(false);
  running.current=true;const request=++generation.current;setBusy(true);setError('');
  const payload=restore?{id:plan.id,version:plan.version,graphVersion:plan.graphVersion,backupVersion:plan.backupVersion,restoreGraphVersion:plan.restoreGraphVersion,confirm:true}:{path:plan.path,version:plan.version,graphVersion:plan.graphVersion,changes:Object.fromEntries(plan.fields.map(field=>[field.key,field.after])),confirm:true};
  try{const output=await api(restore?'redis-config-restore':'redis-config-apply',payload);if(request===generation.current&&context.current===renderContext){setResult(output);setConfirmed(false);if(output.version)try{await onApplied?.(output,plan.target||plan.path);}catch(reason){if(request===generation.current&&context.current===renderContext)setError(output.failed?errorMessage(reason):'설정 적용은 완료되었지만 목록 갱신에 실패했습니다.');}}}
  catch(error){if(request===generation.current&&context.current===renderContext)setError(errorMessage(error));}
  finally{running.current=false;if(request===generation.current&&context.current===renderContext)setBusy(false);}
 }
 return <section className="live-site" aria-label={t(restore?'Redis 설정 복원':'Redis 설정 적용')}>
  <p className="hint">{t('전체 Redis 설정 후보를 검사하고 백업한 뒤 서비스를 재시작합니다. 연결과 데이터 지속성에 영향을 줄 수 있습니다.')}</p>
  <Checkbox disabled={!currentContext||!allowed||disabled||busy||Boolean(result)} label={t('Redis 재시작과 설정 변경 영향을 확인했습니다.')} checked={currentContext&&confirmed} onChange={event=>{if(currentContext&&context.current===renderContext&&allowed&&!live.current.disabled&&!running.current){confirmation.current=event.target.checked?renderContext:null;setConfirmed(event.target.checked);}}}/>
  <Button disabled={!currentContext||!allowed||!ready||disabled||busy||!confirmed||Boolean(result)} loading={busy} onClick={execute}>{t(restore?'Redis 설정 복원':'Redis 설정 적용')}</Button>
  {!allowed&&<p className="hint">{t(featureReason(security,'databaseChanges',{sudo:true}))}</p>}
  {currentContext&&result&&<p role={result.failed?'alert':'status'}>{t(result.failed?(result.restored?(result.recovered?(restore?'백업 복원에 실패하여 원본 설정을 복원하고 서비스를 복구했습니다.':'변경 적용에 실패하여 원본 설정을 복원하고 서비스를 복구했습니다.'):'원본은 복원했지만 서비스 복구가 필요합니다.'):'자동 복원 실패: 백업을 확인하세요.'):result.changed?'설정 적용 완료':'현재 설정과 백업이 동일합니다.')} · {t('백업 ID')}: {result.backupId||'—'}</p>}
  {currentContext&&result?.journalCleanupVerified===false&&<p role="alert">{t('파일 작업은 완료됐지만 중단 기록 정리를 확인하지 못했습니다. 기록을 검토하세요.')}</p>}{currentContext&&error&&<ToastNotice message={t(error)} kind={'error'}/>}
 </section>;
}
