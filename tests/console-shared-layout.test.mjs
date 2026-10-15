import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {loadBindings,transform} from 'next/dist/build/swc/index.js';
const native=createRequire(import.meta.url);
test('current chrome retains installed versions across navigation and refresh failures, updating only on manual refresh',async()=>{
 let pathname='/ide/packages/nginx',index=0,mounted=false;const slots=[],effects=[],cache={},calls=[],routes=[],warmed=[];
 const noop=()=>{},Button=()=>null;
 const hooks={...React,useState:initial=>{const at=index++;if(!(at in slots))slots[at]=initial;return[slots[at],value=>slots[at]=typeof value==='function'?value(slots[at]):value];},useRef:initial=>{const at=index++;return slots[at]??(slots[at]={current:initial});},useCallback:fn=>fn,useEffect:fn=>{if(!mounted)effects.push(fn);}};
 const packageGroup=(id,version)=>({id,installed:true,packages:[{name:id,installed:true,version}]});
 const seed={status:{hostname:'fixture-host',packages:[packageGroup('nginx','1.0'),packageGroup('certbot','2.0')]},security:{settings:{readOnly:true}}};
 const chrome=await compile('../components/console-chrome.tsx',{'./ui/installed-sidebar':{__esModule:true,default:'aside'},'./console-types':consoleTypes,'react':hooks,'next/navigation':{usePathname:()=>pathname,useRouter:()=>({push:path=>routes.push(path),prefetch:path=>warmed.push(path),replace:noop,refresh:noop})},'next/link':{__esModule:true,default:noop},'./ui/controls':{Button,TextInput:noop,Badge:noop},'./language-provider':{useLanguage:()=>({t:value=>value}),LanguagePicker:noop},'./theme-picker':{__esModule:true,default:noop},'./draft-provider':{useClearDrafts:()=>noop,useDraftState:(key,initial)=>{if(!(key in cache))cache[key]=initial;return[cache[key],value=>cache[key]=typeof value==='function'?value(cache[key]):value];}},'./use-session-maintenance':{useSessionMaintenance:noop}, './ui/toast-provider':toastTestModuleWithReact(hooks)});
 const render=()=>{index=0;return chrome({initialData:seed,children:React.createElement('main')});};
 const find=(node,predicate)=>{if(!node||typeof node!=='object')return null;if(predicate(node))return node;for(const child of React.Children.toArray(toastTestChildren(node))){const found=find(child,predicate);if(found)return found;}return null;};
 const refresh=tree=>find(tree,node=>node.type===Button&&node.props['aria-label']==='설치된 패키지 갱신');
 const oldFetch=globalThis.fetch,oldWindow=globalThis.window;let fail=false;
 try{
  globalThis.window={addEventListener:noop,removeEventListener:noop};
  globalThis.fetch=async url=>{calls.push(url);return{ok:!fail,status:fail?503:200,json:async()=>fail?{error:'fixture refresh unavailable'}:url==='/api/status'?{...seed.status,packages:[packageGroup('nginx','1.1'),packageGroup('postgresql','18.0')]}:seed.security};};
  let tree=render();for(const effect of effects)effect();mounted=true;
  const certbot=find(tree,node=>node.type==='button'&&node.props.title==='certbot 2.0');assert(certbot);certbot.props.onClick();assert.deepEqual(routes,['/ide/packages/certbot']);
  pathname='/ide/packages/certbot';tree=render();const tools=find(tree,node=>node.type==='button'&&node.props['aria-label']==='도구');tools.props.onFocus();tools.props.onMouseEnter();tools.props.onClick();assert.deepEqual(warmed,['/ide/packages/certbot','/ide/packages/certbot']);assert.equal(routes.at(-1),warmed.at(-1),'keyboard, pointer and click use the selected installed package');
  pathname='/overview';tree=render();const daemon=find(tree,node=>node.props?.href==='/daemon');daemon.props.onFocus();assert.equal(warmed.at(-1),'/daemon');assert.equal(calls.length,0,'prefetch never refreshes installed inventory');
  for(const path of ['/ide/packages/certbot','/ide/packages/postgresql','/terminal','/overview','/ide/packages/nginx']){
   pathname=path;tree=render();assert.equal(cache.consoleStatus,seed.status);assert.equal(calls.length,0);assert(!JSON.stringify(tree).includes('연결 대기'));
  }
  for(const [policy,label] of [
   [seed.security,'조회 전용'],
   [{settings:{readOnly:false},available:{}},'작업 차단'],
   [{settings:{readOnly:false,terminal:true},available:{terminal:true}},'일부 작업 허용'],
   [null,'권한 설정 확인'],
  ]){
   cache.consoleSecurity=policy;
   for(const path of ['/overview','/ide/packages/nginx','/terminal']){
    pathname=path;tree=render();
    const footer=find(tree,node=>node.props?.className==='admin-statusbar');
    assert.equal(React.Children.toArray(footer.props.children)[0].props.children.at(-1),label);
    const header=find(tree,node=>node.props?.className==='connection');
    assert.equal(React.Children.toArray(header.props.children)[0].props.children,label);
   }
  }
  cache.consoleSecurity=seed.security;pathname='/ide/packages/nginx';tree=render();
  await refresh(tree).props.onClick();assert.deepEqual(calls,['/api/status','/api/security']);tree=render();
  assert(find(tree,node=>node.type==='button'&&node.props.title==='nginx 1.1'));assert(find(tree,node=>node.type==='button'&&node.props.title==='postgresql 18.0'));assert(!find(tree,node=>node.type==='button'&&node.props.title==='certbot 2.0'));
  const retained=cache.consoleStatus;fail=true;await refresh(tree).props.onClick();tree=render();
  assert.equal(cache.consoleStatus,retained);assert(find(tree,node=>node.props?.role==='status'&&node.props.children==='fixture refresh unavailable'));assert.equal(refresh(tree).props.disabled,false);
 }finally{if(oldFetch===undefined)delete globalThis.fetch;else globalThis.fetch=oldFetch;if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;}
});
async function compile(name,mocks){await loadBindings();const {code}=await transform(await readFile(new URL(name,import.meta.url),'utf8'),{filename:name,jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});const module={exports:{}};new Function('require','module','exports',code)(key=>key in mocks?mocks[key]:native(key),module,module.exports);return module.exports.default;}
test('shared server layout authenticates before reading metadata and retains route content for exact login redirects',async()=>{let authenticated=false,reads=0;const child=React.createElement('main',null,'route-owned'),seed={status:{hostname:'fixture'}};const layout=await compile('../app/(console)/layout.tsx',{'../../lib/page-session.ts':{pageSession:async()=>authenticated?{}:null},'../../lib/console-initial-data.ts':{consoleInitialData:async()=>{reads++;return seed;}},'../../components/console-chrome':{__esModule:true,default:'SharedChrome'},'../../components/console-load-error':{__esModule:true,default:'LoadError'}});assert.equal(await layout({children:child}),child);assert.equal(reads,0);authenticated=true;const result=await layout({children:child});assert.equal(result.type,'SharedChrome');assert.equal(result.props.initialData,seed);assert.equal(result.props.children,child);assert.equal(reads,1);});
test('persistent chrome initially renders one header, route-specific menu and SSR account state',async()=>{let pathname='/ide/packages/nginx';const seed={status:{hostname:'fixture-host',packages:[{id:'nginx',installed:true},{id:'certbot',installed:true}]},security:{settings:{readOnly:true}}};const Button=({variant,...props})=>React.createElement('button',props),Link=({children,...props})=>React.createElement('a',props,children);const chrome=await compile('../components/console-chrome.tsx',{'./ui/installed-sidebar':{__esModule:true,default:'aside'},'./console-types':consoleTypes,'react':{...React,useEffect:()=>{}},'next/navigation':{usePathname:()=>pathname,useRouter:()=>({push:()=>{},replace:()=>{},refresh:()=>{}})},'next/link':{__esModule:true,default:Link},'./ui/controls':{Button,TextInput:()=>null,Badge:({children})=>React.createElement('span',null,children)},'./language-provider':{useLanguage:()=>({t:value=>value}),LanguagePicker:()=>null},'./theme-picker':{__esModule:true,default:()=>null},'./draft-provider':{useClearDrafts:()=>()=>{},useDraftState:(key,initial)=>React.useState(initial)},'./use-session-maintenance':{useSessionMaintenance:()=>{}}, './ui/toast-provider':toastTestModuleWithReact({...React,useEffect:()=>{}})});const render=()=>renderToStaticMarkup(React.createElement(chrome,{initialData:seed},React.createElement('main',null,'content')));let html=render();assert.equal((html.match(/class="admin-topbar"/g)||[]).length,1);assert(html.includes('fixture-host'));assert(html.includes('安装')===false);assert(!html.includes('연결 대기'));assert(html.includes('설치된 패키지 갱신'));assert(html.includes('Certbot'));pathname='/terminal';html=render();assert(!html.includes('class="admin-sidebar"'));assert.equal((html.match(/class="admin-topbar"/g)||[]).length,1);pathname='/audit';html=render();assert(html.includes('/recovery'));assert(html.includes('/security'));seed.status=null;seed.security=null;html=render();assert(html.includes('로그아웃'),'authenticated chrome must allow logout even when metadata is unavailable');});

test('initial metadata unavailability preserves shared chrome, hides failing content and still authenticates first',async()=>{
 let reads=0,authenticated=true,failure=Object.assign(Error('private dpkg error'),{status:503});
 const child=React.createElement('main',null,'unavailable route');
 const layout=await compile('../app/(console)/layout.tsx',{'../../lib/page-session.ts':{pageSession:async()=>authenticated?{}:null},'../../lib/console-initial-data.ts':{consoleInitialData:async()=>{reads++;throw failure;}},'../../components/console-chrome':{__esModule:true,default:'SharedChrome'},'../../components/console-load-error':{__esModule:true,default:'LoadError'}});
 let result=await layout({children:child});assert.equal(result.type,'SharedChrome');assert.equal(result.props.initialData,null);assert.equal(result.props.children.type,'LoadError');assert(!JSON.stringify(result).includes('private dpkg error'));
 authenticated=false;assert.equal(await layout({children:child}),child);assert.equal(reads,1);
 authenticated=true;failure=Error('unexpected programming failure');await assert.rejects(layout({children:child}),/unexpected programming failure/);
});
test('console load error retries the boundary or reloads initial metadata at the same authenticated URL',async()=>{
 let retried=0,reloaded=0;const oldWindow=globalThis.window;
 const component=await compile('../components/console-load-error.tsx',{'next/navigation':{usePathname:()=>'/terminal'},'./language-provider':{useLanguage:()=>({t:value=>value})},'./ui/controls':{Button:'RetryButton'}});
 try{globalThis.window={location:{reload:()=>reloaded++}};let tree=component({retry:()=>retried++});assert(tree.props.className.includes('without-sidebar'));const button=tree.props.children.props.children.props.children[2];button.props.onClick();assert.equal(retried,1);assert.equal(reloaded,0);tree=component({});tree.props.children.props.children.props.children[2].props.onClick();assert.equal(reloaded,1);}
 finally{if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;}
});
