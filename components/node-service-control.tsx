'use client';
import {ToastNotice} from './ui/toast-provider';
import {useEffect,useRef,useState} from 'react';
import {errorMessage} from './console-types';
import type {NodeServiceProps,NodeServiceOperation,NodeServiceResult,NodeServiceApi,NodeControlRequest} from './node-types';
import {Button} from './ui/controls';
import {useLanguage} from './language-provider';
import {featureAllowed,featureReason} from '../lib/capabilities.ts';
const paths={start:'M8 5l11 7-11 7V5Z',stop:'M6 6h12v12H6Z',restart:'M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1',enable:'M12 3v9M7 5a8 8 0 1 0 10 0',disable:'M12 3v5M7 5a8 8 0 0 0-3 7m1 5a8 8 0 0 0 14-5 8 8 0 0 0-2-5M3 3l18 18'};
const operations: [NodeServiceOperation,string][]=[['start','시작'],['stop','중지'],['restart','재시작'],['enable','자동 시작 켜기'],['disable','자동 시작 끄기']];
export default function NodeServiceControl({api,connected,security,plan,disabled=false,onBusy,onCompleted,stopOnly=false}: NodeServiceProps){
 const {t}=useLanguage(),[storedOperation,setOperation]=useState<NodeServiceOperation | null>(null),[storedBusy,setBusy]=useState(false),[storedResult,setResult]=useState<NodeServiceResult | null>(null),[storedError,setError]=useState(''),generation=useRef(0),running=useRef(false);
 const planKey=JSON.stringify(plan??null);
 const allowed=featureAllowed(security,'serviceChanges',{sudo:true});
 type Scope = {key: string; api: NodeServiceApi};
 const contextKey=JSON.stringify([planKey,connected,security,stopOnly]),scope=useRef<Scope | null>(null),owner=useRef<Scope | null>(null),mounted=useRef(false),blocked=useRef(disabled),approval=useRef<{key: NodeServiceOperation; scope: Scope} | null>(null);blocked.current=disabled;
 if(scope.current?.key!==contextKey||scope.current?.api!==api)scope.current={key:contextKey,api};
 const renderScope=scope.current,current=()=>mounted.current&&scope.current===renderScope&&owner.current===renderScope,visible=owner.current===renderScope;
 const renderApproval=approval.current;
 const operation=visible?storedOperation:null,busy=visible?storedBusy:false,result=visible?storedResult:null,error=visible?storedError:'';
 useEffect(()=>{mounted.current=true;owner.current=renderScope;approval.current=null;generation.current++;setOperation(null);setResult(null);setError('');setBusy(false);return()=>{mounted.current=false;approval.current=null;generation.current++;};},[api,contextKey]);
 function choose(key: NodeServiceOperation){if(!current()||blocked.current||running.current||!connected||!allowed||!plan||(stopOnly&&!['stop','disable'].includes(key)))return;approval.current={key,scope:renderScope};setOperation(key);setResult(null);setError('');}
 function cancel(){if(!current()||running.current)return;approval.current=null;setOperation(null);}

 async function execute(){if(!current()||blocked.current||approval.current!==renderApproval||approval.current?.scope!==renderScope||approval.current?.key!==operation)return;if(stopOnly&&(!operation||!['stop','disable'].includes(operation)))return;if(running.current||!operation||!plan||!connected||!allowed||disabled)return;approval.current=null;running.current=true;const request=++generation.current,selected=operation;setBusy(true);onBusy?.(true);setOperation(null);setResult(null);setError('');
  try{const base={id:plan.id,registryVersion:plan.registryVersion,confirm:true as const};const payload:NodeControlRequest | null=selected==='stop'||selected==='disable'?{...base,files:plan.files,options:plan.serviceOptions,operation:selected}:plan.files&&plan.serviceOptions?{...base,files:plan.files,options:plan.serviceOptions,operation:selected}:null;if(!payload)throw Error('서비스 설정을 다시 검토하세요.');const output=await api('node-app-service-control',payload);if(request===generation.current&&current()){setResult(output);try{await onCompleted?.(output);}catch{if(request===generation.current&&current())setError('서비스 상태를 조회할 수 없습니다. systemd 연결과 조회 권한을 확인하세요.');}}}
  catch(error){if(request===generation.current&&current())setError(errorMessage(error));}finally{running.current=false;if(request===generation.current&&current()){setBusy(false);onBusy?.(false);}}
 }
 return <section className="live-site"><h4>{t('앱 서비스 제어')}</h4><div className="manager-actions">{operations.filter(([key])=>!stopOnly||['stop','disable'].includes(key)).map(([key,label])=><Button key={key} variant="secondary" className="nginx-icon-button" title={t(label)} aria-label={t(label)} disabled={!connected||!allowed||busy||disabled||!plan} onClick={()=>choose(key)}><svg className="nginx-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={paths[key]}/></svg></Button>)}</div>{!allowed&&<p className="hint">{t(featureReason(security,'serviceChanges',{sudo:true}))}</p>}{operation&&plan&&<div role="alertdialog" aria-label={t('앱 서비스 작업 확인')}><p dir="ltr">{plan.unit}</p><p>{t(operations.find(([key])=>key===operation)?.[1]||operation)} · {t('선택한 서비스 작업을 실행할까요? 연결 중인 앱 작업에 영향을 줄 수 있습니다.')}</p><Button variant="secondary" disabled={busy} onClick={cancel}>{t('취소')}</Button><Button disabled={!connected||!allowed||busy||disabled} loading={busy} onClick={execute}>{t('실행 확인')}</Button></div>}{result&&<p role="status">{t('서비스 작업 완료')} · {t(operations.find(([key])=>key===result.operation)?.[1]||result.operation)}</p>}{error&&<ToastNotice message={t(error)} kind={'error'}/>}</section>;
}
