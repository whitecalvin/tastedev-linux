'use client';
import {createContext,useCallback,useContext,useEffect,useId,useMemo,useState,useRef,type ReactNode,type SetStateAction} from 'react';
import {useLanguage} from '../language-provider';
import {Toast,ToastViewport,type ToastKind} from './toast';

type Entry = {id: string; message: string; title?: string; kind: ToastKind};
type Notifications = {publish: (entry: Entry) => void; remove: (id: string) => void};
const ToastContext=createContext<Notifications | null>(null);

export function ToastProvider({children}: {children: ReactNode}) {
 const {t}=useLanguage();const [entries,setEntries]=useState<Entry[]>([]);
 const publish=useCallback((entry: Entry)=>setEntries(previous=>{
  const existing=previous.find(value=>value.id===entry.id);
  if(existing?.message===entry.message&&existing.title===entry.title&&existing.kind===entry.kind)return previous;
  return [...previous.filter(value=>value.id!==entry.id),entry];
 }),[]);
 const remove=useCallback((id: string)=>setEntries(previous=>previous.some(value=>value.id===id)?previous.filter(value=>value.id!==id):previous),[]);
 const api=useMemo(()=>({publish,remove}),[publish,remove]);
 return <ToastContext.Provider value={api}>{children}{entries.length>0&&<ToastViewport>{entries.map(entry=><Toast key={entry.id} {...entry} closeLabel={t('닫기')} onDismiss={()=>remove(entry.id)}/>)}</ToastViewport>}</ToastContext.Provider>;
}

/** A single notification per source; unmounting its page removes stale messages. */
export function ToastNotice({message,kind='info',title,eventId,autoDismissMs}: {message?: string | null; kind?: ToastKind; title?: string; eventId?: number; autoDismissMs?: number}) {
 const api=useContext(ToastContext),id=useId(),{t}=useLanguage();const marker=useRef<HTMLSpanElement>(null);const [dismissed,setDismissed]=useState('');
 useEffect(()=>{setDismissed('');},[message,eventId]);
 useEffect(()=>{
  if(!api)return;
  const dialog=marker.current?.parentElement?.closest<HTMLDialogElement>('dialog')??null;
  let expired=false;
  const update=()=>{if(!expired&&message&&(!dialog||dialog.open))api.publish({id,message,kind,title});else api.remove(id);};
  update();const observer=dialog?new MutationObserver(update):null;if(dialog)observer?.observe(dialog,{attributes:true,attributeFilter:['open']});
  const timer=message&&autoDismissMs&&autoDismissMs>0?setTimeout(()=>{expired=true;api.remove(id);},autoDismissMs):null;
  return()=>{if(timer)clearTimeout(timer);observer?.disconnect();api.remove(id);};
 },[api,id,message,kind,title,eventId,autoDismissMs]);
 useEffect(()=>{if(api||!message||!autoDismissMs||autoDismissMs<=0)return;const timer=setTimeout(()=>setDismissed(message),autoDismissMs);return()=>clearTimeout(timer);},[api,message,eventId,autoDismissMs]);
 if(api)return <span ref={marker} hidden data-toast-source={id}/>;
 if(!message||dismissed===message)return null;
 return <ToastViewport><Toast message={message} kind={kind} title={title} closeLabel={t('닫기')} onDismiss={()=>setDismissed(message)}/></ToastViewport>;
}

/** Severity travels with the original event, before its message is translated. */
type FeedbackValue = string | {text: string; values: Record<string,string | number>} | {key: string; detail: string};
export function useFeedback<T extends FeedbackValue>(initial: T) {
 const [feedback,setFeedback]=useState<{value: T; kind: ToastKind; revision: number}>({value:initial,revision:0,kind:'info'});
 const set=useCallback((value: SetStateAction<T>,kind: ToastKind='info')=>setFeedback(previous=>({value:typeof value==='function'?value(previous.value):value,kind,revision:previous.revision+1})),[]);
 return [feedback.value,set,feedback.kind,feedback.revision] as const;
}
