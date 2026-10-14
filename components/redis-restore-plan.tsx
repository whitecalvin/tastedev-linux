'use client';
import {ToastNotice} from './ui/toast-provider';
import {errorMessage,type RedisApi,type RedisRestoreReview,type DatabaseOperationResult,type SecurityPolicy} from './console-types';
import RedisOperation from './redis-operation';
import {useEffect,useRef,useState} from 'react';
import {Button} from './ui/controls';
import {useLanguage} from './language-provider';
export default function RedisRestorePlan({id,api,connected,security,onClose,onRestored}: {id: string; api: RedisApi; connected: boolean; security: SecurityPolicy | null; onClose?: () => void; onRestored?: (result: DatabaseOperationResult,path?: string) => void | Promise<void>}){
 const {t}=useLanguage(),[plan,setPlan]=useState<RedisRestoreReview | null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const context=useRef({id,api,connected}),generation=useRef(0),initialRequest=useRef<{context: typeof context.current; promise: Promise<RedisRestoreReview>} | null>(null);
 if(context.current.id!==id||context.current.api!==api||context.current.connected!==connected){context.current={id,api,connected};generation.current++;}
 const renderContext=context.current,[owner,setOwner]=useState<typeof renderContext | null>(null),currentContext=owner===renderContext;
 useEffect(()=>{const request=++generation.current;setPlan(null);setOwner(null);setError('');setBusy(false);if(!connected)return;setBusy(true);setOwner(renderContext);const current=()=>request===generation.current&&context.current===renderContext;if(initialRequest.current?.context!==renderContext)initialRequest.current={context:renderContext,promise:api(`redis-restore-plan?id=${encodeURIComponent(id)}`)};initialRequest.current!.promise.then(output=>{if(current()&&output.id===id)setPlan(output);}).catch(e=>{if(current())setError(errorMessage(e));}).finally(()=>{if(current())setBusy(false);});return()=>{generation.current++;};},[renderContext]);
 const value=(input: unknown)=>input===null?t('조회되지 않음'):typeof input==='boolean'?(input?'on':'off'):String(input);
 return <section className="live-site" aria-label={t('Redis 백업 복원 검토')}><div className="manager-actions"><h4>{t('Redis 백업 복원 검토')}</h4><Button variant="secondary" onClick={onClose}>{t('닫기')}</Button></div>{currentContext&&busy&&<p role="status">{t('불러오는 중')}</p>}{currentContext&&plan&&connected&&<><p>{plan.target}</p><p>{t('백업 ID')}: {plan.id}</p><p className="hint">{t(plan.notice)}</p><table className="admin-table"><thead><tr><th>{t('설정')}</th><th>{t('현재 값')}</th><th>{t('백업 값')}</th></tr></thead><tbody>{plan.fields.map(field=><tr key={field.key}><td>{field.key}</td><td>{value(field.before)}</td><td>{value(field.after)}</td></tr>)}</tbody></table><RedisOperation plan={plan} restore api={api} connected={connected} security={security} onApplied={onRestored} disabled={busy}/>{!plan.changed&&<p>{t('현재 설정과 백업이 동일합니다.')}</p>}{plan.warnings.map((warning,index)=><p className="hint" key={index}>{t(warning)}</p>)}</>}{currentContext&&error&&<ToastNotice message={t(error)} kind={'error'}/>}</section>;
}
