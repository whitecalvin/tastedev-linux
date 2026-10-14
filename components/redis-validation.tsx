'use client';
import {ToastNotice} from './ui/toast-provider';
import {errorMessage,type RedisApi,type RedisConfigPlan,type SecurityPolicy} from './console-types';
import {useEffect,useRef,useState} from 'react';
import {Button,Checkbox} from './ui/controls';
import {useLanguage} from './language-provider';
import {featureAllowed,featureReason} from '../lib/capabilities.ts';
export default function RedisValidation({plan,api,connected,security,disabled=false}: {plan: RedisConfigPlan; api: RedisApi; connected: boolean; security: SecurityPolicy | null; disabled?: boolean}){
 const {t}=useLanguage(),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[result,setResult]=useState<{valid: boolean} | null>(null),[error,setError]=useState('');
 const generation=useRef(0),running=useRef(false);
 useEffect(()=>{generation.current++;setConfirmed(false);setResult(null);setError('');return()=>{generation.current++;};},[plan,connected,security]);
 const allowed=connected&&featureAllowed(security,'databaseChanges',{sudo:true});
 async function validate(){
  if(!allowed||disabled||running.current||!confirmed||!plan?.graphVersion||!plan.fields?.length)return;
  running.current=true;const request=++generation.current;setBusy(true);setResult(null);setError('');
  try{const response=await api('redis-config-validate',{path:plan.path,version:plan.version,graphVersion:plan.graphVersion,changes:Object.fromEntries(plan.fields.map(field=>[field.key,field.after])),confirm:true});if(request===generation.current)setResult(response);}
  catch(error){if(request===generation.current)setError(errorMessage(error));}
  finally{running.current=false;setBusy(false);}
 }
 return <section className="live-site" aria-label={t('Redis 격리 설정 검사')}>
  <p className="hint">{t('임시 Redis 프로세스로 시작 가능 여부를 검사합니다. 운영 설정과 서비스는 변경하지 않습니다.')}</p>
  <Checkbox disabled={!allowed||disabled||busy} label={t('격리된 Redis 검증 프로세스 실행을 확인했습니다.')} checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/>
  <Button variant="secondary" disabled={!allowed||disabled||busy||!confirmed||!plan?.graphVersion||!plan.fields?.length} loading={busy} onClick={validate}>{t('Redis 격리 설정 검사')}</Button>
  {!allowed&&<p className="hint">{t(featureReason(security,'databaseChanges',{sudo:true}))}</p>}
  {result?.valid===true&&<p role="status">{t('격리 검사 통과. 운영 데이터·외부 리소스·지속성 동작은 별도 검증이 필요합니다.')}</p>}
  {error&&<ToastNotice message={t(error)} kind={'error'}/>}
 </section>;
}
