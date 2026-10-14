'use client';
import {ToastNotice} from './ui/toast-provider';
import {createContext,useContext,useEffect,useState,useRef,useId,type ReactNode} from 'react';
import {resolveLocale,translateWithCatalog,languages,localeFlag,matchesLocalizedText} from '../lib/i18n-core.ts';
import {englishCatalog,loadLanguageCatalog} from '../lib/i18n-client.ts';
import {languageCookie,languageDirection} from '../lib/language-preference.ts';
type Catalog = Record<string, string>;
type Coverage = Record<string, {complete: boolean; translatedEntries?: number; totalEntries?: number}>;
type Values = Record<string, string | number>;
type Translator = {(text: string, values?: Values): string; (text: string | undefined, values?: Values): string | undefined};
function identity(text: string, values?: Values): string;
function identity(text: string | undefined, values?: Values): string | undefined;
function identity(text: string | undefined){return text;}
type LanguageContext = {locale: string; t: Translator; setLocale: (value: string) => Promise<boolean>; pending: boolean; error: string; coverage: Coverage};
type LanguageProviderProps = {children: ReactNode; initialLocale?: string; initialCatalog?: Catalog; coverage?: Coverage; persisted?: boolean};
const Context=createContext<LanguageContext>({locale:'ko',t:identity,setLocale:async()=>false,pending:false,error:'',coverage:{}});
export function LanguageProvider({children,initialLocale='ko',initialCatalog={},coverage={},persisted=false}: LanguageProviderProps){
 const [selection,setSelection]=useState(()=>({locale:resolveLocale(initialLocale),catalog:initialCatalog}));
 const [pending,setPending]=useState(false),[error,setError]=useState('');
 const request=useRef(0),alive=useRef(true);
 const {locale,catalog}=selection;
 function save(value: string){try{localStorage.setItem('linux-language',value);}catch{}try{document.cookie=languageCookie(value,window.location.protocol==='https:');}catch{}}
 async function setLocale(value: string){
  const next=resolveLocale(value),generation=++request.current;
  if(next===locale){setPending(false);setError('');save(next);return true;}
  setPending(true);setError('');
  try{const loaded=await loadLanguageCatalog(next);if(!alive.current||generation!==request.current)return false;setSelection({locale:next,catalog:loaded});save(next);return true;}
  catch{if(alive.current&&generation===request.current)setError('언어 파일을 불러오지 못했습니다. 다시 선택하세요.');return false;}
  finally{if(alive.current&&generation===request.current)setPending(false);}
 }
 useEffect(()=>{alive.current=true;let saved: string | null | undefined;if(!persisted)try{saved=localStorage.getItem('linux-language');}catch{}void setLocale(saved||initialLocale);return()=>{alive.current=false;request.current++;};},[]);
 useEffect(()=>{document.documentElement.lang=locale;document.documentElement.dir=languageDirection(locale);},[locale]);
 function t(text:string,values?:Values):string;
 function t(text:string|undefined,values?:Values):string|undefined;
 function t(text:string|undefined,values?:Values){return translateWithCatalog(locale,text,values,catalog,englishCatalog);}
 return <Context.Provider value={{locale,t,setLocale,pending,error,coverage}}>{children}</Context.Provider>;
}
export function useLanguage(){return useContext(Context);}
export function LanguagePicker(){
 const {locale,t,setLocale,pending,error,coverage={}}=useLanguage(),dialog=useRef<HTMLDialogElement>(null),id=useId();const [query,setQuery]=useState(''),[open,setOpen]=useState(false);const selected=languages.find(item=>item.id===locale);
 const visible=open?languages.filter(item=>matchesLocalizedText(locale,item.label+' '+item.id,query)):[];
 return <><button type="button" className="language-trigger" aria-haspopup="dialog" aria-label={t('언어 선택')} onClick={()=>{setQuery('');setOpen(true);dialog.current?.showModal();}}><span className="locale-flag" aria-hidden="true">{localeFlag(locale)}</span><span>{selected?.label||locale}</span></button><dialog ref={dialog} className="language-dialog" onClose={()=>setOpen(false)} aria-labelledby={id}><div className="language-dialog-heading"><h2 id={id}>{t('언어 선택')}</h2><button type="button" aria-label={t('닫기')} onClick={()=>dialog.current?.close()}>×</button></div><input className="ui-input" type="search" aria-label={t('언어 검색')} placeholder={t('언어 검색')} autoFocus value={query} onChange={e=>setQuery(e.target.value)}/>{error&&<ToastNotice message={t(error)} kind={'error'}/>}<div className="language-results" aria-busy={pending}>{visible.map(item=><button type="button" key={item.id} aria-pressed={locale===item.id} disabled={pending} onClick={async()=>{if(await setLocale(item.id))dialog.current?.close();}}><span className="language-option-name"><span className="locale-flag" aria-hidden="true">{localeFlag(item.id)}</span><span>{item.label}<small>{item.id}</small></span></span><span>{locale===item.id?'✓':''}{!Object.hasOwn(coverage,item.id.split('-')[0])?<small>{t('영어 UI')}</small>:!coverage[item.id.split('-')[0]]?.complete&&<small>{t('부분 번역')}</small>}</span></button>)}</div></dialog></>;
}
