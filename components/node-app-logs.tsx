'use client';
import {ToastNotice} from './ui/toast-provider';
import {useState,useEffect,useRef} from 'react';
import {Button} from './ui/controls';
import {useLanguage} from './language-provider';
import {errorMessage,type AiApi} from './console-types';
import AiLogAssistant from './ai-log-assistant';
type NodeAppLog = {id: string; unit: string; at: string; notice: string; text: string};
interface NodeLogApi extends AiApi {(action: `node-app-logs?id=${string}`): Promise<NodeAppLog>;}
type NodeLogProps = {id?: string | null; api: NodeLogApi; connected: boolean; disabled?: boolean};
type LogContext = Pick<NodeLogProps,'id' | 'api' | 'connected'>;
type LogRequest = {context: LogContext; revision: number};
export default function NodeAppLogs({id,api,connected,disabled}: NodeLogProps){
 const {t}=useLanguage(),[record,setRecord]=useState<NodeAppLog | null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const context=useRef({id,api,connected}),pending=useRef<LogRequest | null>(null),revision=useRef(0);
 if(context.current.id!==id||context.current.api!==api||context.current.connected!==connected){context.current={id,api,connected};revision.current++;pending.current=null;}
 const renderContext=context.current;
 const [readyContext,setReadyContext]=useState(renderContext),currentContext=readyContext===renderContext;
 useEffect(()=>{revision.current++;setRecord(null);setError('');setBusy(false);setReadyContext(context.current);return ()=>{revision.current++;};},[id,api,connected]);
 async function load(){
  if(!connected||disabled||!id||!currentContext||context.current!==renderContext||pending.current)return;
  const ticket={context:renderContext,revision:++revision.current};pending.current=ticket;
  const isCurrent=()=>context.current===ticket.context&&revision.current===ticket.revision;
  setBusy(true);setRecord(null);setError('');
  try{const result=await api(`node-app-logs?id=${encodeURIComponent(id)}`);if(isCurrent())setRecord(result);}
  catch(failure){if(isCurrent())setError(errorMessage(failure));}
  finally{if(pending.current===ticket)pending.current=null;if(isCurrent())setBusy(false);}
 }
 return <section className="live-site"><Button variant="secondary" className="nginx-icon-button" title={t('앱 오류 로그 조회')} aria-label={t('앱 오류 로그 조회')} disabled={!connected||disabled||!id||!currentContext||busy} onClick={load}><svg className="nginx-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1"/></svg></Button>{currentContext&&record&&<><p dir="ltr">{record.unit} · {record.at}</p><p className="hint">{t(record.notice)}</p><pre className="manager-preview" dir="ltr">{record.text||t('조회된 로그가 없습니다.')}</pre><AiLogAssistant api={api} connected={connected} text={record.text} source={record.unit}/></>}{currentContext&&error&&<ToastNotice message={t(error)} kind={'error'}/>}</section>;
}
