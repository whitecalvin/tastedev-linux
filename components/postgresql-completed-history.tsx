'use client';
import {ToastNotice} from './ui/toast-provider';
import {errorMessage,type PostgreSQLHistoryApi,type PostgreSQLHistoryCatalog,type PostgreSQLHistoryRecord,type SecurityPolicy} from './console-types';
import {useEffect,useRef,useState} from 'react';
import {IconButton} from './ui/controls';
import ConfirmDialog from './ui/confirm-dialog';
import {useLanguage} from './language-provider';
import {featureAllowed} from '../lib/capabilities.ts';

type HistoryScope = {key: string; api: PostgreSQLHistoryApi};
export default function PostgreSQLCompletedHistory({path,api,connected,security,onReviewBackup}: {path: string; api: PostgreSQLHistoryApi; connected: boolean; security: SecurityPolicy | null; onReviewBackup?: (id: string) => void}){
 const {t}=useLanguage(),[catalog,setCatalog]=useState<{scope: HistoryScope; data: PostgreSQLHistoryCatalog} | null>(null),[request,setRequest]=useState<{scope: HistoryScope | null; item: PostgreSQLHistoryRecord} | null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState<{scope: HistoryScope; id: string} | null>(null);
 const key=JSON.stringify([path,connected,security]),scope=useRef<HistoryScope | null>(null),running=useRef(false);
 if(scope.current?.key!==key||scope.current?.api!==api)scope.current={key,api};
 useEffect(()=>{setCatalog(null);setRequest(null);setResult(null);setError('');setBusy(false);const current=scope.current;return()=>{if(scope.current===current)scope.current=null;};},[key,api]);
 const renderedScope=scope.current,list=catalog?.scope===scope.current?catalog.data:null;
 const canRead=connected&&Boolean(path)&&security?.settings?.sudoWithoutPrompt&&security?.privilege?.ready,allowed=connected&&featureAllowed(security,'databaseChanges',{sudo:true});
 async function execute(importRequest?: PostgreSQLHistoryRecord){
  if(!scope.current||renderedScope!==scope.current||running.current||!canRead||importRequest&&!allowed)return;
  const current=scope.current;running.current=true;setBusy(true);setError('');setRequest(null);
  try{
   if(importRequest){const data=await api('postgresql-history-backup',{path,id:importRequest.id,version:importRequest.version,confirm:true});if(scope.current!==current)return;if(data.path!==path||data.id!==importRequest.id)throw Error('PostgreSQL 완료 기록을 다시 검토하세요.');setResult({scope:current,id:data.id});}
   else{const data=await api(`postgresql-restore-history?path=${encodeURIComponent(path)}`);if(scope.current!==current)return;if(data.path!==path||!Array.isArray(data.records)||data.records.length>100||data.records.some(item=>item.path!==path||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(item.id??'')||!/^[a-f0-9]{64}$/.test(item.version??'')||!['committed','rolled-back'].includes(item.phase)||!Number.isSafeInteger(item.fileCount)||item.fileCount<0||item.fileCount>100||typeof item.backupAvailable!=='boolean'))throw Error('PostgreSQL 완료 기록을 다시 검토하세요.');setCatalog({scope:current,data});}
  }catch(reason){if(scope.current===current)setError(errorMessage(reason));}finally{running.current=false;if(scope.current===current)setBusy(false);}
 }
 if(!path)return null;
 return <section className="live-site" aria-label={t('PostgreSQL 복원 완료 기록')}><div className="manager-actions"><h4>{t('PostgreSQL 복원 완료 기록')}</h4><IconButton title={t('새로고침')} aria-label={t('새로고침')} disabled={!canRead||busy} onClick={()=>execute()}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M20 7v5h-5M20 12a8 8 0 1 0-2 6"/></svg></IconButton></div>
 {list&&!list.records.length&&<p>{t('완료된 복원 기록이 없습니다.')}</p>}
 {list?.records.map(item=><div className="manager-actions" key={item.id}><div><code>{item.id}</code><p>{item.createdAt} · {t('설정 파일')}: {item.fileCount} · {t(item.phase==='committed'?'백업 복원 완료':'원본 설정 복원 및 서비스 복구 완료')}</p></div><IconButton title={t('원본 설정을 백업으로 가져오기')} aria-label={t('원본 설정을 백업으로 가져오기')} disabled={!allowed||busy||!item.backupAvailable} onClick={()=>{if(renderedScope===scope.current&&allowed&&!busy&&item.backupAvailable)setRequest({scope:scope.current,item});}}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/></svg></IconButton></div>)}
 {list&&list.warnings>0&&<p>{t('검증에 실패한 백업 제외')}: {list.warnings}</p>}{list?.truncated&&<p>{t('목록 제한으로 일부 백업만 표시합니다.')}</p>}
 {result&&result.scope===scope.current&&<div className="manager-actions"><code>{result.id}</code><IconButton title={t('복원 검토')} aria-label={t('복원 검토')} disabled={!allowed||busy} onClick={()=>{if(allowed&&!busy&&result.scope===scope.current)onReviewBackup?.(result.id);}}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 5v5h5M4 10a8 8 0 1 1 2 9"/></svg></IconButton></div>}
 {error&&<ToastNotice message={t(error)} kind={'error'}/>}
 <ConfirmDialog request={request?{title:'원본 설정을 백업으로 가져오기',message:'보관된 원본 설정을 검수해 백업 목록에 추가합니다. 운영 설정은 변경하지 않습니다.',detail:request.item.id}:null} onCancel={()=>setRequest(null)} onConfirm={()=>{if(request&&request.scope===scope.current&&allowed&&!busy)return execute(request.item);}}/>
 </section>;
}
