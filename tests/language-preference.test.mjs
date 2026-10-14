import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {initialLanguage,languageDirection,languageCookie} from '../lib/language-preference.ts';
import {postgresqlSettingDescription} from '../lib/postgresql-setting-description.ts';
import {resolveLocale,languageCatalog,translate,languageCoverageSummary} from '../lib/i18n.ts';
import {loadLanguageCatalog} from '../lib/i18n-client.ts';

test('SSR language chooses explicit country locale before weighted browser languages and rejects malformed preferences',()=>{
 assert.deepEqual(initialLanguage('ka-GE','en-US'),{locale:'ka-GE',persisted:true});
 assert.deepEqual(initialLanguage('pt_BR','ja'),{locale:'pt-BR',persisted:true});
 assert.equal(initialLanguage(null,'en-US;q=0.4,ja-JP;q=0.9').locale,'ja-JP');
 assert.equal(initialLanguage('not-a-locale','xx-XX,ar-SA;q=0.8,en;q=0.2').locale,'ar-SA');
 assert.equal(initialLanguage(null,'fr;q=0,de;q=0.8').locale,'de');
 assert.equal(initialLanguage(null,'fr;q=bogus,en;q=0.5').locale,'en');
 assert.equal(initialLanguage(null,'fr;q=1.5,es;q=0.4').locale,'es');
 assert.equal(initialLanguage(null,'*').locale,'ko');
 assert.equal(initialLanguage('ar; Path=/','en').persisted,false);
 assert.equal(languageDirection('ar-SA'),'rtl');
 assert.equal(languageDirection('ka-GE'),'ltr');
 assert.equal(languageCookie('pt_BR'),'linux-language=pt-BR; Path=/; Max-Age=31536000; SameSite=Lax');
 assert(languageCookie('ar-SA',true).endsWith('; Secure'));
 assert(!languageCookie('en; arbitrary=value').includes('arbitrary'));
});

async function provider(react=React,overrides={}){
 await loadBindings();
 const compiled=await transform(await readFile(new URL('../components/language-provider.tsx',import.meta.url),'utf8'),{filename:'language-provider.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),module={exports:{}};
 new Function('require','module','exports',compiled.code)(name=>Object.hasOwn(overrides,name)?overrides[name]:name==='./ui/toast-provider'?toastTestModuleWithReact(react):name==='react'?react:native(name),module,module.exports);
 return module.exports;
}

test('Provider renders the selected PostgreSQL explanation in initial SSR without browser globals',async()=>{
 const {LanguageProvider,useLanguage}=await provider();
 function Help(){const {locale}=useLanguage();return React.createElement('p',{lang:locale},postgresqlSettingDescription('logging_collector',locale).paragraphs.join(' '));}
 for(const locale of ['ko','en','ja','zh','es','fr','de','ru','pt','ar','id','it','ka','pl','sv','tr','uk','ca','fi','nl','da','nb','ro','vi','hu','el','bg','cs','sk','hi']){
  const html=renderToStaticMarkup(React.createElement(LanguageProvider,{initialLocale:locale,initialCatalog:languageCatalog(locale),persisted:true},React.createElement(Help)));
  const selected=resolveLocale(locale);
  assert(html.startsWith(`<p lang="${selected}">`),locale);
  const expected=renderToStaticMarkup(React.createElement('p',{lang:selected},postgresqlSettingDescription('logging_collector',locale).paragraphs.join(' ')));
  assert.equal(html,expected,locale);
 }
});

test('Cookie-backed language survives stale local storage, migrates old preferences and persists selection',async()=>{
 let states=[],refs=[],index=0,refIndex=0,effects=[];
 const hooks={...React,useState:initial=>{const at=index++;if(!(at in states))states[at]=typeof initial==='function'?initial():initial;return [states[at],next=>states[at]=typeof next==='function'?next(states[at]):next];},useRef:initial=>{const at=refIndex++;return refs[at]??(refs[at]={current:initial});},useEffect:fn=>effects.push(fn)};
 const {LanguageProvider}=await provider(hooks);
 const original={document:globalThis.document,window:globalThis.window,localStorage:globalThis.localStorage};
 let stored='ja',cookie='';
 globalThis.document={documentElement:{},get cookie(){return cookie;},set cookie(value){cookie=value;}};
 globalThis.window={location:{protocol:'https:'}};
 globalThis.localStorage={getItem:()=>stored,setItem:(_,value)=>{stored=value;}};
 try{
  function render(props){index=0;refIndex=0;effects=[];return LanguageProvider(props);}
  let element=render({initialLocale:'ka-GE',persisted:true});
  assert.equal(element.props.value.locale,'ka-GE');
  effects.forEach(fn=>fn());assert.equal(states[0].locale,'ka-GE');assert.equal(stored,'ka-GE');assert(cookie.includes('linux-language=ka-GE;'));
  await element.props.value.setLocale('ar-SA');assert.equal(states[0].locale,'ar-SA');assert.equal(stored,'ar-SA');assert(cookie.endsWith('; Secure'));
  states=[];refs=[];stored='pt-BR';render({initialLocale:'en',persisted:false});effects.forEach(fn=>fn());await loadLanguageCatalog('pt-BR');await Promise.resolve();assert.equal(states[0].locale,'pt-BR');assert(cookie.includes('linux-language=pt-BR;'));
 }finally{
  for(const [key,value] of Object.entries(original))if(value===undefined)delete globalThis[key];else globalThis[key]=value;
 }
});


test('selected UI translations are present in SSR before a language chunk is requested',async()=>{
 const {LanguageProvider,useLanguage}=await provider();
 function Label(){return React.createElement('span',null,useLanguage().t('로그인'));}
 for(const locale of ['ko','en','ja-JP','ar-SA','pt-BR','uk','ka-GE','vi-VN']){
  const html=renderToStaticMarkup(React.createElement(LanguageProvider,{initialLocale:locale,initialCatalog:languageCatalog(locale),coverage:languageCoverageSummary(),persisted:true},React.createElement(Label)));
  assert.equal(html,renderToStaticMarkup(React.createElement('span',null,translate(locale,'로그인'))),locale);
 }
});


test('late language loads cannot override a newer choice and failures retain the current language',async()=>{
 let states=[],refs=[],at=0,refAt=0,effects=[];
 const hooks={...React,useState:initial=>{const key=at++;if(!(key in states))states[key]=typeof initial==='function'?initial():initial;return [states[key],next=>states[key]=typeof next==='function'?next(states[key]):next];},useRef:initial=>{const key=refAt++;return refs[key]??(refs[key]={current:initial});},useEffect:fn=>effects.push(fn)};
 const loads=[];
 const {LanguageProvider}=await provider(hooks,{'../lib/i18n-client.ts':{englishCatalog:{},loadLanguageCatalog:locale=>new Promise((resolve,reject)=>loads.push({locale,resolve,reject}))}});
 const previous={window:globalThis.window,document:globalThis.document,localStorage:globalThis.localStorage};
 let cookie='',saved='ko';globalThis.window={location:{protocol:'http:'}};globalThis.document={documentElement:{},get cookie(){return cookie;},set cookie(value){cookie=value;}};globalThis.localStorage={getItem:()=>saved,setItem:(_,value)=>saved=value};
 function render(){at=0;refAt=0;effects=[];return LanguageProvider({initialLocale:'ko',persisted:true}).props.value;}
 try{
  const current=render();const japanese=current.setLocale('ja'),arabic=current.setLocale('ar');
  loads[1].resolve({로그인:'Arabic fixture'});assert.equal(await arabic,true);loads[0].resolve({로그인:'Japanese fixture'});assert.equal(await japanese,false);
  assert.equal(states[0].locale,resolveLocale('ar'));assert.equal(saved,resolveLocale('ar'));assert(cookie.includes('linux-language='+resolveLocale('ar')+';'));
  const selected=render();const failure=selected.setLocale('fr');loads[2].reject(Error('network unavailable'));assert.equal(await failure,false);
  assert.equal(states[0].locale,resolveLocale('ar'));assert.equal(saved,resolveLocale('ar'));assert.match(states[2],/불러오지 못했습니다/);assert.equal(states[1],false);
  const retry=render().setLocale('fr');loads[3].resolve({로그인:'French fixture'});assert.equal(await retry,true);assert.equal(states[0].locale,resolveLocale('fr'));
 }finally{for(const [key,value] of Object.entries(previous))if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
});
