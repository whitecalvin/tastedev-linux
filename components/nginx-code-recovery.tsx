'use client';
import {ToastNotice} from './ui/toast-provider';
import {errorMessage} from './console-types';
import type {EditorFile,EditorTarget,CodeBuffers,RecoveryEntry,RecoveryConfirmation} from './nginx-editor-types';
import {useEffect,useId,useRef,useState} from 'react';
import {useDraftState} from './draft-provider';
import {useLanguage} from './language-provider';
import ConfirmDialog from './ui/confirm-dialog';
import {Button,NativeSelect} from './ui/controls';
import {nginxCodeRecoveryEntries,recoverNginxCodeBuffer,applyNginxRecoveryConfirmation} from '../lib/nginx-code-recovery.ts';
export default function NginxCodeRecovery({files,target,onEdit}: {files: EditorFile[]; target?: EditorTarget | null; onEdit?: () => void}){
 const {t}=useLanguage(),dialog=useRef<HTMLDialogElement>(null),title=useId();
 const [buffers,setBuffers]=useDraftState<CodeBuffers>('nginxCodeBuffers',{}),[open,setOpen]=useState(false),[selected,setSelected]=useState(''),[error,setError]=useState(''),[confirmation,setConfirmation]=useState<RecoveryConfirmation | null>(null);
 const entries: RecoveryEntry[]=nginxCodeRecoveryEntries(buffers,files).filter(entry=>entry.state!=='current'),entry=entries.find(entry=>entry.identity===selected)||entries[0];
 useEffect(()=>{if(open&&entries.length){if(!dialog.current?.open)dialog.current?.showModal();}else if(dialog.current?.open)dialog.current.close();},[open,entries.length]);
 useEffect(()=>{setConfirmation(null);},[target?.identity,target?.source,target?.readOnly,entry?.identity]);
 if(!entries.length)return null;
 const compatible=target?.exists&&!target.readOnly&&target.filePath===entry?.filePath&&target.kind===entry?.kind;
 function recover(){try{if(!target)throw Error('같은 파일의 같은 종류 노드를 선택하세요.');const existing=buffers[target.identity];const replace=existing&&target.identity!==entry.identity&&(existing.dirty||existing.text!==existing.baseline)&&existing.text!==entry.buffer.text;
  if(replace){setConfirmation({kind:'replace',identity:entry.identity,buffer:{...entry.buffer},target:{...target},destination:{...existing}});return;}
  recoverNginxCodeBuffer(buffers,entry.identity,target,Boolean(replace));setBuffers(previous=>{try{return recoverNginxCodeBuffer(previous,entry.identity,target,Boolean(replace));}catch{return previous;}});setOpen(false);setError('');onEdit?.();
 }catch(failure){setError(errorMessage(failure));}}
 function approve(){try{
  const request=confirmation;applyNginxRecoveryConfirmation(buffers,request,target);
  setBuffers(previous=>{try{return applyNginxRecoveryConfirmation(previous,request,target);}catch{return previous;}});
  setConfirmation(null);setError('');if(request?.kind==='replace'){setOpen(false);onEdit?.();}
 }catch(failure){setConfirmation(null);setError(errorMessage(failure));}}
 const confirmationView=confirmation?{title:confirmation.kind==='replace'?'미저장 코드 복구':'편집 버리기',message:confirmation.kind==='replace'?'대상 노드의 미저장 코드를 바꿀까요?':'보존된 편집 코드를 버릴까요?',detail:confirmation.kind==='replace'?confirmation.target.filePath+' · '+confirmation.target.label:entry.filePath+' · '+entry.label}:null;
 function download(){const url=URL.createObjectURL(new Blob([entry.buffer.text],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='nginx-recovered.conf';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 return <div className="nginx-code-recovery"><ConfirmDialog request={confirmationView} onConfirm={approve} onCancel={()=>setConfirmation(null)}/><Button variant="secondary" onClick={()=>{setError('');setOpen(true);}}>{t('미저장 코드 복구')} · {entries.length}</Button><dialog ref={dialog} className="nginx-code-recovery-dialog" aria-labelledby={title} onCancel={()=>setOpen(false)} onClose={()=>{if(!dialog.current?.open)setOpen(false);}}><header><strong id={title}>{t('미저장 코드 복구')}</strong><Button variant="secondary" aria-label={t('닫기')} onClick={()=>setOpen(false)}>×</Button></header><NativeSelect label={t('미저장 코드')} value={entry.identity} options={entries.map(item=>({value:item.identity,label:(item.filePath||'nginx')+' · '+(item.label||t('설정'))}))} onChange={event=>{setSelected(event.target.value);setError('');}}/><p className="hint">{t(entry.state==='missing'?'원래 노드가 없어졌습니다. 코드는 보존되어 있습니다.':'원래 노드의 설정이 변경되었습니다. 편집 코드는 보존되어 있습니다.')}</p><textarea readOnly spellCheck={false} aria-label={t('보존된 편집 코드')} value={entry.buffer.text}/>{compatible&&<details><summary>{t('복구 대상의 현재 코드')}</summary><pre>{target.source}</pre></details>}<p className="hint">{t('같은 파일의 같은 종류 노드를 선택한 뒤 편집을 이어갈 수 있습니다. 복구는 초안을 자동 적용하지 않습니다.')}</p>{error&&<ToastNotice message={t(error)} kind={'error'}/>}<footer><Button variant="secondary" onClick={download}>{t('다운로드')}</Button><Button variant="secondary" disabled={!compatible} onClick={recover}>{t('선택한 노드에서 편집')}</Button><Button variant="secondary" onClick={()=>setConfirmation({kind:'discard',identity:entry.identity,buffer:{...entry.buffer}})}>{t('편집 버리기')}</Button></footer></dialog></div>;
}
