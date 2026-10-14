import {languages,resolveLocale} from './i18n-core.ts';

export const languageCookieName='linux-language';
const supportedBases=new Set(languages.map(item=>item.id.split('-')[0]));
function supportedLocale(value:unknown){
 if(typeof value!=='string'||value.length>64)return null;
 try{
  const canonical=Intl.getCanonicalLocales(value.replaceAll('_','-'))[0];
  return canonical&&supportedBases.has(canonical.split('-')[0])?resolveLocale(canonical):null;
 }catch{return null;}
}

// The explicit choice takes precedence over the browser's weighted preferences.
export function initialLanguage(cookieValue:unknown,acceptLanguage:unknown=''){
 const saved=supportedLocale(cookieValue);
 if(saved)return {locale:saved,persisted:true};
 const candidates=String(acceptLanguage).slice(0,4096).split(',').slice(0,32).map((item,index)=>{
  const [tag,...parameters]=item.trim().split(';');
  let quality=1;
  for(const parameter of parameters){
   const match=parameter.trim().match(/^q=(0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/i);
   if(!match)return null;
   quality=Number(match[1]);
  }
  const locale=supportedLocale(tag);
  return locale&&quality>0?{locale,quality,index}:null;
 }).filter((value):value is {locale:string;quality:number;index:number}=>value!==null).sort((a,b)=>b.quality-a.quality||a.index-b.index);
 return {locale:candidates[0]?.locale||'ko',persisted:false};
}

export function languageDirection(locale:string){return ['ar','fa','he','ur','ps','sd','ug','yi'].includes(locale.split('-')[0])?'rtl':'ltr';}
export function languageCookie(value:unknown,secure=false){
 const locale=resolveLocale(value);
 return `${languageCookieName}=${encodeURIComponent(locale)}; Path=/; Max-Age=31536000; SameSite=Lax${secure?'; Secure':''}`;
}
