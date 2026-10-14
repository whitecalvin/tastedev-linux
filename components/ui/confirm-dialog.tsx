'use client';
import {useEffect,useId,useRef} from 'react';
import {useLanguage} from '../language-provider';
import {Button} from './controls';

export type ConfirmRequest = {title: string; message: string; detail?: string};
type ConfirmDialogProps = {request: ConfirmRequest | null; onConfirm: () => void; onCancel: () => void};
export default function ConfirmDialog({request,onConfirm,onCancel}: ConfirmDialogProps){
 const {t}=useLanguage(),dialog=useRef<HTMLDialogElement>(null),title=useId(),message=useId();
 const visible=Boolean(request);
 useEffect(()=>{
  const node=dialog.current;if(!node)return;
  if(visible){if(!node.open)node.showModal();node.querySelector<HTMLElement>('[data-confirm-cancel]')?.focus();}
  else if(node.open)node.close();
 },[visible]);
 return <dialog ref={dialog} className="ui-confirm-dialog" aria-labelledby={title} aria-describedby={message} onCancel={event=>{event.preventDefault();onCancel();}} onClose={()=>{if(request&&!dialog.current?.open)onCancel();}}>
  <h2 id={title}>{request?t(request.title):''}</h2>
  <p id={message}>{request?t(request.message):''}</p>
  {request?.detail&&<code className="ui-confirm-detail">{request.detail}</code>}
  <footer><Button variant="secondary" data-confirm-cancel onClick={onCancel}>{t('취소')}</Button><Button disabled={!request} onClick={onConfirm}>{t('확인')}</Button></footer>
 </dialog>;
}
