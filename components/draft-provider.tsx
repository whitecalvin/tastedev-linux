'use client';
import {terminalPreferences,terminalPreferencesKey,mergeTerminalPreferences} from '../lib/terminal-preferences.ts';
import {terminalScreenCache} from '../lib/terminal-screen-cache.ts';
import {nginxTreeExpansionKey,treeExpansion,type TreeExpansion} from '../lib/nginx-tree-expansion.ts';
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode,type Dispatch,type SetStateAction} from 'react';
import {patchDrafts,hasUnsavedFiles} from '../lib/draft-state.ts';
type DraftMap = Record<string, unknown>;
type DraftContext = {drafts: DraftMap; update: (key: string, value: unknown, fallback: unknown, generation: number) => void; clear: () => void; generation: number};
type DraftProviderProps = {children: ReactNode; initialTreeExpansion?: TreeExpansion | null; preferenceUserId?: string | null};
const Context=createContext<DraftContext | null>(null);
export function DraftProvider({children,initialTreeExpansion=null,preferenceUserId=null}: DraftProviderProps){
 const [drafts,setDrafts]=useState<DraftMap>(initialTreeExpansion?{nginxTreeExpansion:treeExpansion(initialTreeExpansion)}:{}),[preferencesReady,setPreferencesReady]=useState(false);const epoch=useRef(0);
 const [preferenceOwner,setPreferenceOwner]=useState(preferenceUserId);
 const preferenceWrites=useRef(Promise.resolve());
 useEffect(()=>{if(preferenceOwner===preferenceUserId)return;setDrafts(previous=>({...previous,nginxTreeExpansion:treeExpansion(initialTreeExpansion)}));setPreferenceOwner(preferenceUserId);},[preferenceOwner,preferenceUserId,initialTreeExpansion]);
 useEffect(()=>{let saved: unknown,tree: unknown;try{saved=JSON.parse(window.localStorage.getItem(terminalPreferencesKey)||'null');tree=JSON.parse(window.localStorage.getItem(nginxTreeExpansionKey)||'null');}catch{}setDrafts(previous=>({...mergeTerminalPreferences(previous,saved),nginxTreeExpansion:previous.nginxTreeExpansion??treeExpansion(tree)}));setPreferencesReady(true);},[]);
 useEffect(()=>{if(!preferencesReady)return;try{window.localStorage.setItem(terminalPreferencesKey,JSON.stringify(terminalPreferences(drafts)));}catch{}},[preferencesReady,drafts.terminalAppearance,drafts.terminalTabTimeout]);
 useEffect(()=>{if(!preferencesReady)return;try{window.localStorage.setItem(nginxTreeExpansionKey,JSON.stringify(treeExpansion(drafts.nginxTreeExpansion)));}catch{}},[preferencesReady,drafts.nginxTreeExpansion]);
 useEffect(()=>{if(!preferencesReady||!preferenceUserId||preferenceOwner!==preferenceUserId)return;const expansion=treeExpansion(drafts.nginxTreeExpansion);preferenceWrites.current=preferenceWrites.current.catch(()=>{}).then(async()=>{const body=JSON.stringify({userId:preferenceUserId,expansion});const response=await fetch('/api/nginx-tree-preferences',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:new TextEncoder().encode(body).length<60000});if(!response.ok)throw Error('Tree preference save failed');}).catch(()=>console.warn('[LINUX] Tree preference save failed; local preference retained'));},[preferencesReady,preferenceOwner,preferenceUserId,drafts.nginxTreeExpansion]);
 const update=useCallback((key: string,value: unknown,fallback: unknown,generation: number)=>setDrafts(previous=>generation===epoch.current?patchDrafts(Object.hasOwn(previous,key)?previous:{...previous,[key]:fallback},key,value):previous),[]);
 const clear=useCallback(()=>{terminalScreenCache.clear();epoch.current++;setDrafts(previous=>({...terminalPreferences(previous),nginxTreeExpansion:treeExpansion(previous.nginxTreeExpansion)}));},[]);
 const dirty=hasUnsavedFiles(drafts),leaveState=useRef<{dirty: boolean; generation: number} | null>(null);leaveState.current={dirty,generation:epoch.current};
 useEffect(()=>{const guard=(event: BeforeUnloadEvent)=>{const current=leaveState.current;if(current?.dirty&&current.generation===epoch.current){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard);},[]);
 return <Context.Provider value={{drafts,update,clear,generation:epoch.current}}>{children}</Context.Provider>;
}
export function useDraftState<T>(key: string,initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>]{
 const context=useContext(Context);if(!context)throw new Error('DraftProvider is required');
 const fallback=useRef<{value: T} | null>(null);
 if(fallback.current===null)fallback.current={value:typeof initial==='function'?(initial as () => T)():initial};
 const initialValue=fallback.current.value;
 const setValue=useCallback((value: SetStateAction<T>)=>context.update(key,value,initialValue,context.generation),[context.update,key,context.generation,initialValue]);
 return [Object.hasOwn(context.drafts,key)?context.drafts[key] as T:initialValue,setValue];
}
export function useClearDrafts(){const context=useContext(Context);if(!context)throw new Error('DraftProvider is required');return context.clear;}
export function useDraftGeneration(){const context=useContext(Context);if(!context)throw new Error('DraftProvider is required');return context.generation;}
