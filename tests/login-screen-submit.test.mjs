import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';
import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {loginDestination} from '../lib/login-destination.ts';
import {isAuthStorageError} from '../lib/auth-storage-error.ts';
test('compiled login synchronously locks duplicate submissions and clears password on transport failure',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/login-screen.tsx',import.meta.url),'utf8'),{filename:'login-screen.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const state=['admin','fixture-password',null,false,'','/overview'];let index=0,calls=0,reject;
 const hooks={...React,useState:()=>{const at=index++;return[state[at],value=>state[at]=value];},useEffect:()=>{},useRef:value=>({current:value})};
 const native=createRequire(import.meta.url),noop=()=>null,module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='react'?hooks:name==='next/navigation'?{useRouter:()=>({replace:noop,refresh:noop})}:name.includes('login-destination')?{loginDestination}:name.includes('language-provider')?{useLanguage:()=>({t:value=>value}),LanguagePicker:noop}:name.includes('draft-provider')?{useClearDrafts:()=>noop}:name.startsWith('.')?{default:noop,Button:noop,TextInput:noop}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const original=globalThis.fetch;try{
  globalThis.fetch=()=>{calls++;return new Promise((_,fail)=>reject=fail);};
  const tree=module.exports.default({setupDirectory:'/fixture',packaged:false});let form;
  function visit(node){if(!node||typeof node!=='object')return;if(node.type==='form')form=node;React.Children.forEach(toastTestChildren(node),visit);}visit(tree);
  form.props.onSubmit({preventDefault:noop});form.props.onSubmit({preventDefault:noop});assert.equal(calls,1);
  reject(Error('transport failed'));await new Promise(resolve=>setImmediate(resolve));
  assert.equal(state[1],'');assert.equal(state[3],false);assert.equal(state[4],'transport failed');
  form.props.onSubmit({preventDefault:noop});assert.equal(calls,2);reject(Error('second transport failed'));await new Promise(resolve=>setImmediate(resolve));
 }finally{globalThis.fetch=original;}
});

test('existing login session returns to the requested package and ignores status after unmount',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/login-screen.tsx',import.meta.url),'utf8'),{filename:'login-screen.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),noop=()=>null,originalFetch=globalThis.fetch,originalWindow=globalThis.window;
 try{for(const [search,cancelled,expected] of [['?next=%2Fide%2Fpackages%2Fredis',false,'/ide/packages/redis'],['?next=https%3A%2F%2Fexample.com',false,'/overview'],['?next=%2Fterminal',true,null]]){
  const effects=[],redirects=[];let resolve;const hooks={...React,useState:value=>[value,noop],useEffect:fn=>effects.push(fn),useRef:value=>({current:value})};
  const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='react'?hooks:name==='next/navigation'?{useRouter:()=>({replace:value=>redirects.push(value),refresh:noop})}:name.includes('login-destination')?{loginDestination}:name.includes('language-provider')?{useLanguage:()=>({t:value=>value}),LanguagePicker:noop}:name.includes('draft-provider')?{useClearDrafts:()=>noop}:name.startsWith('.')?{default:noop,Button:noop,TextInput:noop}:native(name);
  const module={exports:{}};new Function('require','module','exports',compiled.code)(require,module,module.exports);
  globalThis.window={location:{search}};globalThis.fetch=()=>new Promise(done=>resolve=done);
  module.exports.default({setupDirectory:'/fixture',packaged:false});const cleanups=effects.map(fn=>fn());if(cancelled)for(const cleanup of cleanups)cleanup?.();
  resolve({ok:true,json:async()=>({configured:true,authenticated:true})});await new Promise(done=>setImmediate(done));
  assert.deepEqual(redirects,expected?[expected]:[]);
 }}finally{globalThis.fetch=originalFetch;if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;}
});

test('login storage failure keeps the screen visible and blocks submission without hiding unrelated server errors',async()=>{
 await loadBindings();const native=createRequire(import.meta.url),noop=()=>null;
 const compiled=await transform(await readFile(new URL('../app/login/page.tsx',import.meta.url),'utf8'),{filename:'page.jsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 let failure=Error('인증 저장 경로 권한을 확인하세요.');const module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='next/headers'?{headers:async()=>new Headers()}:name==='next/navigation'?{redirect:noop}:name.includes('auth-storage-error')?{isAuthStorageError}:name.includes('auth.ts')?{cookieSession:async()=>{throw failure;}}:name.includes('login-destination')?{loginDestination}:name.includes('login-screen')?{default:noop}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 assert.equal((await module.exports.default({searchParams:{}})).props.storageUnavailable,true);
 failure=Error('unrelated failure');await assert.rejects(module.exports.default({searchParams:{}}),/unrelated failure/);
 const screen=await transform(await readFile(new URL('../components/login-screen.tsx',import.meta.url),'utf8'),{filename:'login-screen.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const effects=[];let cleared=0;
 const screenModule={exports:{}},hooks={...React,useState:value=>[value,noop],useEffect:fn=>effects.push(fn),useRef:value=>({current:value})};
 const requireScreen=name=>name==='./ui/toast-provider'?toastTestModule(requireScreen):name==='react'?hooks:name==='next/navigation'?{useRouter:()=>({replace:noop,refresh:noop})}:name.includes('login-destination')?{loginDestination}:name.includes('language-provider')?{useLanguage:()=>({t:value=>value}),LanguagePicker:noop}:name.includes('draft-provider')?{useClearDrafts:()=>()=>cleared++}:name.startsWith('.')?{default:noop,Button:noop,TextInput:noop}:native(name);
 new Function('require','module','exports',screen.code)(requireScreen,screenModule,screenModule.exports);
 const tree=screenModule.exports.default({setupDirectory:'/fixture',packaged:false,storageUnavailable:true});let form,alert,disabled=0;
 function visit(node){if(!node||typeof node!=='object')return;if(node.type==='form')form=node;if(node.props?.role==='alert')alert=node;if(node.props?.disabled)disabled++;React.Children.forEach(toastTestChildren(node),visit);}visit(tree);
 assert(alert);assert.equal(disabled,3);const original=globalThis.fetch;try{globalThis.fetch=()=>{throw Error('must not submit');};form.props.onSubmit({preventDefault:noop});}finally{globalThis.fetch=original;}
 effects[0]();assert.equal(cleared,0,'storage recovery must retain unsaved drafts');
 effects.length=0;screenModule.exports.default({setupDirectory:'/fixture',packaged:false,storageUnavailable:false});effects[0]();assert.equal(cleared,1,'normal login must still clear the previous session drafts');
});

test('login status and fallback errors follow language changes without another request',async()=>{
 const {translate}=await import('../lib/i18n.ts');await loadBindings();
 const compiled=await transform(await readFile(new URL('../components/login-screen.tsx',import.meta.url),'utf8'),{filename:'login-screen.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const state=[],effects=[];let index=0,locale='en',calls=0;
 const noop=()=>null,native=createRequire(import.meta.url),module={exports:{}};
 const hooks={...React,useState:initial=>{const at=index++;if(!(at in state))state[at]=initial;return[state[at],value=>state[at]=value];},useEffect:fn=>effects.push(fn),useRef:value=>({current:value})};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='react'?hooks:name==='next/navigation'?{useRouter:()=>({replace:noop,refresh:noop})}:name.includes('login-destination')?{loginDestination}:name.includes('language-provider')?{useLanguage:()=>({t:key=>translate(locale,key)}),LanguagePicker:noop}:name.includes('draft-provider')?{useClearDrafts:()=>noop}:name.startsWith('.')?{default:noop,Button:noop,TextInput:noop}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const render=()=>{index=0;effects.length=0;return module.exports.default({setupDirectory:'/fixture',packaged:false});};
 const find=(node,predicate)=>{if(!node||typeof node!=='object')return null;if(predicate(node))return node;let found;React.Children.forEach(toastTestChildren(node),child=>found??=find(child,predicate));return found;};
 const originalFetch=globalThis.fetch,originalWindow=globalThis.window;
 try{
  globalThis.window={location:{search:''}};globalThis.fetch=async()=>{calls++;throw Error('transport failure');};render();effects[1]();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(state[4],'로그인 상태를 확인할 수 없습니다.');
  assert.equal(find(render(),node=>node.props?.['data-toast-kind']!==undefined).props.children,'Unable to check login status.');
  locale='pt-BR';assert.equal(find(render(),node=>node.props?.['data-toast-kind']!==undefined).props.children,'Não foi possível verificar o estado do login.');assert.equal(calls,1);
  globalThis.fetch=async()=>{calls++;return{ok:false,json:async()=>({})};};find(render(),node=>node.type==='form').props.onSubmit({preventDefault:noop});await new Promise(resolve=>setImmediate(resolve));assert.equal(state[4],'로그인 실패');assert.equal(find(render(),node=>node.props?.['data-toast-kind']!==undefined).props.children,'Falha no login');
  locale='en';assert.equal(find(render(),node=>node.props?.['data-toast-kind']!==undefined).props.children,'Login failed');assert.equal(calls,2);
 }finally{globalThis.fetch=originalFetch;if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;}
});
