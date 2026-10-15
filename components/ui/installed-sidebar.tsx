'use client';

import {useEffect,useRef,useState,type ReactNode,type PointerEvent} from 'react';
import {useLanguage} from '../language-provider';

const initialWidth=232;
export default function InstalledSidebar({children}: {children:ReactNode;className?:string}){
 const {t}=useLanguage();
 const aside=useRef<HTMLElement>(null),drag=useRef<{id:number;x:number;width:number;direction:number}|null>(null);
 const [width,setWidth]=useState(initialWidth),[maximum,setMaximum]=useState(520),[dragging,setDragging]=useState(false);
 const bound=()=>Math.max(180,Math.min(520,window.innerWidth-48-360));
 const resize=(next:number)=>setWidth(Math.round(Math.max(180,Math.min(bound(),next))));
 useEffect(()=>{
  const update=()=>{const max=bound();setMaximum(max);setWidth(current=>Math.min(max,current));};
  update();window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update);
 },[]);
 useEffect(()=>{
  const shell=aside.current?.closest<HTMLElement>('.console-shell');if(!shell)return;
  shell.style.setProperty('--installed-sidebar-width',width+'px');
  return()=>{shell.style.removeProperty('--installed-sidebar-width');};
 },[width]);
 function finish(event:PointerEvent<HTMLDivElement>){
  if(drag.current?.id!==event.pointerId)return;
  drag.current=null;setDragging(false);
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
 }
 return <><aside ref={aside} className="admin-sidebar installed-sidebar">{children}</aside><div className="installed-sidebar-resizer ide-pane-resizer" role="separator" aria-label={t('설치된 패키지')+' · '+t('트리뷰 너비 조절')} aria-orientation="vertical" aria-valuemin={180} aria-valuemax={maximum} aria-valuenow={width} tabIndex={0} title={t('드래그하여 너비 조절 · 두 번 클릭하여 기본 너비')} data-resizing={dragging}
 onPointerDown={event=>{if(event.button!==0||!aside.current)return;event.preventDefault();drag.current={id:event.pointerId,x:event.clientX,width:aside.current.getBoundingClientRect().width,direction:getComputedStyle(aside.current).direction==='rtl'?-1:1};event.currentTarget.setPointerCapture(event.pointerId);setDragging(true);}}
 onPointerMove={event=>{if(drag.current?.id===event.pointerId)resize(drag.current.width+(event.clientX-drag.current.x)*drag.current.direction);}}
 onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={()=>{drag.current=null;setDragging(false);}} onDoubleClick={()=>resize(initialWidth)}
 onKeyDown={event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const rtl=aside.current&&getComputedStyle(aside.current).direction==='rtl';resize(event.key==='Home'?180:event.key==='End'?bound():width+(event.key==='ArrowRight'?1:-1)*(rtl?-1:1)*(event.shiftKey?40:10));}}/></>;
}
