import type {MessageCatalog} from './i18n-core.ts';
import en from './locales/en.json' with {type:'json'};
export const englishCatalog:MessageCatalog=en;
const loaders:Readonly<Record<string,()=>Promise<{default:MessageCatalog}>>>={
 ja:()=>import('./locales/ja.json',{with:{type:'json'}}),
 zh:()=>import('./locales/zh.json',{with:{type:'json'}}),
 es:()=>import('./locales/es.json',{with:{type:'json'}}),
 fr:()=>import('./locales/fr.json',{with:{type:'json'}}),
 de:()=>import('./locales/de.json',{with:{type:'json'}}),
 ru:()=>import('./locales/ru.json',{with:{type:'json'}}),
 ar:()=>import('./locales/ar.json',{with:{type:'json'}}),
 pt:()=>import('./locales/pt.json',{with:{type:'json'}}),
 it:()=>import('./locales/it.json',{with:{type:'json'}}),
 tr:()=>import('./locales/tr.json',{with:{type:'json'}}),
 uk:()=>import('./locales/uk.json',{with:{type:'json'}}),
 vi:()=>import('./locales/vi.json',{with:{type:'json'}}),
 id:()=>import('./locales/id.json',{with:{type:'json'}}),
 nl:()=>import('./locales/nl.json',{with:{type:'json'}}),
 pl:()=>import('./locales/pl.json',{with:{type:'json'}}),
 cs:()=>import('./locales/cs.json',{with:{type:'json'}}),
 sv:()=>import('./locales/sv.json',{with:{type:'json'}}),
 da:()=>import('./locales/da.json',{with:{type:'json'}}),
 fi:()=>import('./locales/fi.json',{with:{type:'json'}}),
 ro:()=>import('./locales/ro.json',{with:{type:'json'}}),
 hu:()=>import('./locales/hu.json',{with:{type:'json'}}),
 el:()=>import('./locales/el.json',{with:{type:'json'}}),
 bg:()=>import('./locales/bg.json',{with:{type:'json'}}),
 nb:()=>import('./locales/nb.json',{with:{type:'json'}}),
 sk:()=>import('./locales/sk.json',{with:{type:'json'}}),
 ca:()=>import('./locales/ca.json',{with:{type:'json'}}),
 hi:()=>import('./locales/hi.json',{with:{type:'json'}}),
};
const pending=new Map<string,Promise<MessageCatalog>>();
export function loadLanguageCatalog(locale:unknown):Promise<MessageCatalog>{
 const base=String(locale).split('-')[0];
 if(base==='en')return Promise.resolve(en);
 if(!Object.hasOwn(loaders,base))return Promise.resolve({});
 let task=pending.get(base);if(!task){task=loaders[base]().then(module=>module.default).catch(error=>{pending.delete(base);throw error;});pending.set(base,task);}
 return task;
}
