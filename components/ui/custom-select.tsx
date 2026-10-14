'use client';
import {useEffect,useId,useRef,useState, type ButtonHTMLAttributes, type CSSProperties, type KeyboardEvent} from 'react';
import type {SelectOption} from './controls';
export type SelectChangeEvent = {target: {value: string; name?: string}; currentTarget: {value: string; name?: string}};
export type CustomSelectProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'onChange' | 'onClick' | 'onKeyDown' | 'name'> & {label?: string; options?: readonly SelectOption[]; value?: string | number; onChange?: (event: SelectChangeEvent) => void; name?: string; placeholder?: string};
import {createPortal} from 'react-dom';
import {useLanguage} from '../language-provider';
export function CustomSelect({label,options=[],value,onChange,id,name,disabled=false,className='',placeholder='선택',...props}: CustomSelectProps){
 const {t}=useLanguage(),generated=useId(),controlId=id||generated,listId=controlId+'-options';
 const trigger=useRef<HTMLButtonElement>(null),menu=useRef<HTMLDivElement>(null),search=useRef({text:'',time:0});
 const [open,setOpen]=useState(false),[active,setActive]=useState(-1),[position,setPosition]=useState<CSSProperties | null>(null);
 const selected=options.findIndex(option=>String(option.value)===String(value)),enabled=options.map((option,index)=>option.disabled?-1:index).filter(index=>index>=0);
 const close=()=>{setOpen(false);search.current={text:'',time:0};};
 const show=()=>{if(disabled||!enabled.length)return;setActive(enabled.includes(selected)?selected:enabled[0]);setOpen(true);};
 const choose=(index: number)=>{const option=options[index];if(!option||option.disabled||disabled)return;const next={value:String(option.value),name};onChange?.({target:next,currentTarget:next});close();trigger.current?.focus();};
 useEffect(()=>{if(disabled)close();},[disabled]);
 useEffect(()=>{if(!open)return;if(!enabled.length){close();return;}if(!enabled.includes(active))setActive(enabled.includes(selected)?selected:enabled[0]);},[open,active,selected,enabled.join(',')]);
 useEffect(()=>{if(!open)return;const place=()=>{const rect=trigger.current?.getBoundingClientRect();if(!rect)return;const height=Math.min(options.length*32+8,240),below=window.innerHeight-rect.bottom-8;setPosition({position:'fixed',width:Math.min(rect.width,window.innerWidth-16),left:Math.max(8,Math.min(rect.left,window.innerWidth-rect.width-8)),top:below>=height?rect.bottom+4:Math.max(8,rect.top-height-4),maxHeight:Math.min(height,window.innerHeight-16)});};place();const outside=(event: PointerEvent)=>{if(!(event.target instanceof Node))return;if(!trigger.current?.contains(event.target)&&!menu.current?.contains(event.target))close();};document.addEventListener('pointerdown',outside);window.addEventListener('resize',place);window.addEventListener('scroll',place,true);return()=>{document.removeEventListener('pointerdown',outside);window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);};},[open,options.length]);
 useEffect(()=>{if(open)menu.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({block:'nearest'});},[open,active]);
 function keyboard(event: KeyboardEvent<HTMLButtonElement>){
  if(disabled)return;
  const key=event.key;
  if(key==='Tab'){close();return;}
  if(key==='Escape'){event.preventDefault();close();return;}
  if(['ArrowDown','ArrowUp','Home','End'].includes(key)){
   event.preventDefault();if(!enabled.length)return;
   if(!open){show();if(key==='Home')setActive(enabled[0]);if(key==='End')setActive(enabled[enabled.length-1]);return;}
   const index=enabled.indexOf(active);
   setActive(key==='Home'?enabled[0]:key==='End'?enabled[enabled.length-1]:index<0?(key==='ArrowDown'?enabled[0]:enabled[enabled.length-1]):enabled[(index+(key==='ArrowDown'?1:-1)+enabled.length)%enabled.length]);return;
  }
  if(key==='Enter'||key===' '){event.preventDefault();if(open)choose(active);else show();return;}
  if(key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
   const now=Date.now(),prior=now-search.current.time<700?search.current.text:'';
   const text=prior&&[...prior].every(character=>character.toLocaleLowerCase()===key.toLocaleLowerCase())?key:prior+key;
   search.current={text,time:now};
   const start=text.length===1?Math.max(0,enabled.indexOf(open?active:selected)+1):0;
   const ordered=[...enabled.slice(start),...enabled.slice(0,start)];
   const matched=ordered.find(index=>String(t(options[index].label)).toLocaleLowerCase().startsWith(text.toLocaleLowerCase()));
   if(matched!==undefined){event.preventDefault();if(!open)show();setActive(matched);}
  }
 }
 return <div className={'ui-field '+className}>{label&&<label id={controlId+'-label'} htmlFor={controlId}>{t(label)}</label>}{name&&<input type="hidden" name={name} value={value??''} disabled={disabled}/>}<button {...props} ref={trigger} id={controlId} type="button" role="combobox" className="ui-custom-select" disabled={disabled} aria-labelledby={label?controlId+'-label':undefined} aria-expanded={open} aria-haspopup="listbox" aria-controls={open?listId:undefined} aria-activedescendant={open&&active>=0?listId+'-'+active:undefined} onClick={()=>open?close():show()} onKeyDown={keyboard}><span className="ui-select-value">{selected>=0?t(options[selected].label):t(placeholder)}</span><svg className="ui-select-chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m4 6 4 4 4-4"/></svg></button>{open&&position&&createPortal(<div ref={menu} role="listbox" id={listId} aria-label={t(label)||props['aria-label']} className="ui-select-menu" style={position}>{options.map((option,index)=><div key={option.value} id={listId+'-'+index} role="option" aria-selected={index===selected} aria-disabled={option.disabled||undefined} data-active={index===active} className="ui-select-option" onPointerMove={()=>{if(!option.disabled)setActive(index);}} onPointerDown={event=>event.preventDefault()} onClick={()=>choose(index)}><span>{t(option.label)}</span>{index===selected&&<span aria-hidden="true">✓</span>}</div>)}</div>,document.body)}</div>;
}
