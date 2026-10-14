'use client';

import {useEffect,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import './toast.css';

export type ToastKind = 'success' | 'info' | 'warning' | 'error';
export type ToastProps = {
  kind?: ToastKind;
  title?: string;
  message: string;
  closeLabel: string;
  onDismiss: () => void;
  action?: {label: string; onClick: () => void};
};

const paths: Record<ToastKind, string> = {
  success: 'm7 12 3 3 7-7',
  info: 'M12 11v6M12 7h.01',
  warning: 'M12 8v5M12 16h.01',
  error: 'm9 9 6 6M15 9l-6 6',
};

export function ToastViewport({children}: {children: ReactNode}) {
  const element=useRef<HTMLDivElement>(null),[topLayer,setTopLayer]=useState(false),[target,setTarget]=useState<HTMLElement | null>(null);
  useEffect(()=>{
    const update=()=>{
      const focused=document.activeElement?.closest('dialog[open]');
      const dialogs=document.querySelectorAll<HTMLDialogElement>('dialog[open]');
      const modal=focused instanceof HTMLDialogElement?focused:dialogs.item(dialogs.length-1);
      setTarget(modal||document.body);
    };
    update();const observer=new MutationObserver(update);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});
    return()=>observer.disconnect();
  },[]);
  useEffect(()=>{setTopLayer(typeof element.current?.showPopover==='function');},[]);
  useEffect(()=>{const node=element.current;if(!topLayer||!node)return;try{if(node.matches(':popover-open'))node.hidePopover();node.showPopover();}catch{/* Older embedded browsers retain the portal and fixed-position fallback. */}},[topLayer,children,target]);
  const viewport=<div ref={element} popover={topLayer?'manual':undefined} className="ui-toast-viewport">{children}</div>;
  return target?createPortal(viewport,target):viewport;
}

/** Callers supply localized copy; dismissing a toast never executes its action. */
export function Toast({kind = 'info', title, message, closeLabel, onDismiss, action}: ToastProps) {
  return <div className={`ui-toast ui-toast--${kind}`} role={kind === 'error' ? 'alert' : 'status'} aria-atomic="true" onKeyDown={event => {
    if (event.key === 'Escape') {event.preventDefault(); event.stopPropagation(); onDismiss();}
  }}>
    <span className="ui-toast__icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">
      {kind === 'warning' ? <path d="M12 3 2 21h20L12 3Z"/> : <circle cx="12" cy="12" r="9"/>}
      <path d={paths[kind]}/>
    </svg></span>
    <div className="ui-toast__content">
      {title && <strong className="ui-toast__title">{title}</strong>}
      <p className="ui-toast__message">{message}</p>
      {action && <button type="button" className="ui-toast__action" onClick={action.onClick}>{action.label}<span aria-hidden="true">→</span></button>}
    </div>
    <button type="button" className="ui-toast__close" aria-label={closeLabel} title={closeLabel} onClick={onDismiss}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18"/></svg>
    </button>
  </div>;
}
