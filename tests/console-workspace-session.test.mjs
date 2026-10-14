import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as packageIdeTypes from '../components/package-ide-types.ts';
import * as consoleTypes from '../components/console-types.ts';
import {installedPackageVersion,installedPackageVersionDetails} from '../lib/package-version.ts';
import {operationTerminalReport} from '../lib/operation-terminal-report.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';
import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {consoleRefreshGuard} from '../lib/console-refresh.ts';
import {consoleRoute} from '../lib/console-route.ts';
import {installedProfile} from '../lib/package-selection.ts';
import {workPermissionLabel} from '../lib/capabilities.ts';
test('compiled console preserves package login route and suppresses refresh after logout',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/console-workspace.tsx',import.meta.url),'utf8'),{filename:'console-workspace.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),original=globalThis.fetch,originalWindow=globalThis.window;
 try{
  for(const expired of [false,true,'malformed-401','status-unauth','status-unauth-query','status-401','late-401','storage-503','account-expired','install-review']){
   const state=['','','all',{packages:[{id:'nginx',installed:true},{id:'redis',installed:true}],hostname:'fixture'}, {settings:{readOnly:true}},null,[],'',false,null,false],redirects=[],pending=[];let index=0;
   if(expired==='install-review'){state[3].canInstall=true;state[5]={status:'running',monitoringUnavailable:true,logs:[],command:['apt']};state[9]={packages:['nginx'],command:['apt']};state[10]=true;}
   const effects=[],hardRedirects=[];globalThis.window={location:{search:expired==='status-unauth-query'?'?view=code&filter=x':'',replace:path=>{hardRedirects.push(path);redirects.push(path);}}};
   const hooks={...React,useState:()=>{const at=index++;return[state[at],value=>state[at]=typeof value==='function'?value(state[at]):value];},useRef:value=>({current:value}),useEffect:fn=>effects.push(fn),useMemo:fn=>fn(),useCallback:fn=>fn};
   const Button=()=>null,noop=()=>null,router={replace:path=>redirects.push(path),push:path=>redirects.push(path),refresh:noop};
   const require=name=>{if(name==='./ui/toast-provider')return toastTestModule(require);if(name==='./package-ide-types')return packageIdeTypes;if(name==='./console-types')return consoleTypes;if(name==='./console-types')return consoleTypes;
    if(name.includes('operation-terminal-report'))return {operationTerminalReport};if(name==='react')return hooks;if(name==='next/navigation')return {useRouter:()=>router};
    if(name.includes('package-version'))return {installedPackageVersion,installedPackageVersionDetails};if(name.includes('console-refresh'))return {consoleRefreshGuard};if(name.includes('console-route'))return {consoleRoute};if(name.includes('package-selection'))return {installedProfile};
    if(name.includes('language-provider'))return {useLanguage:()=>({t:value=>value}),LanguagePicker:noop};
    if(name.includes('draft-provider'))return {useClearDrafts:()=>noop,useDraftState:key=>['consoleStatus','consoleSecurity','consoleInstallJob'].includes(key)?hooks.useState():[[],noop]};if(name.includes('capabilities'))return {featureAllowed:()=>expired==='install-review',workPermissionLabel};
    if(name.includes('ui/controls'))return {Button,Checkbox:noop,TextInput:noop,Badge:noop,Progress:noop,Dropdown:noop};
    if(name.startsWith('.')||name==='next/link')return {default:noop};return native(name);
   };
   globalThis.fetch=async url=>{
    if(url==='/api/auth/logout')return {ok:true};
    if(['status-unauth','status-unauth-query'].includes(expired))return {status:200,ok:true,json:async()=>({authenticated:false})};
    if(expired==='malformed-401'||expired==='status-401')return {status:401,ok:false,json:async()=>{throw Error('must redirect before parsing an unauthorized body');}};
    if(expired===true)return {status:401,ok:false,json:async()=>({})};
    if(expired==='storage-503')return {status:503,ok:false,json:async()=>({error:'인증 저장소를 사용할 수 없습니다.',storageUnavailable:true})};
    return new Promise(resolve=>pending.push(resolve));
   };
   const module={exports:{}};new Function('require','module','exports',compiled.code)(require,module,module.exports);
   const tree=module.exports.default({view:expired==='account-expired'?'security':'ide',selectedPackage:'redis'}),buttons=[],rail=[];let account;
   function visit(node){if(!node||typeof node!=='object')return;if(node.type===Button)buttons.push(node);if(node.type==='button'&&node.props['aria-label'])rail.push(node);if(node.props?.onSessionExpired)account=node;React.Children.forEach(toastTestChildren(node),visit);}visit(tree);
   if(expired==='install-review'){const start=buttons.find(node=>node.props.children==='설치 시작');assert.equal(start.props.disabled,true);await start.props.onClick();assert.equal(pending.length,0,'even an already-confirmed dialog must not retry an unobserved running installer');continue;}
   if(expired==='account-expired'){assert(account);account.props.onSessionExpired();account.props.onSessionExpired();assert.deepEqual(hardRedirects,['/login?next=%2Fsecurity']);assert.equal(state[3],null);assert.equal(state[4],null);assert.equal(state[7],'');assert.equal(pending.length,0);continue;}
   if(['status-unauth','status-unauth-query','status-401'].includes(expired)){effects.at(-1)();await new Promise(done=>setImmediate(done));assert.deepEqual(hardRedirects,['/login?next='+encodeURIComponent('/ide/packages/redis'+(expired==='status-unauth-query'?'?view=code&filter=x':''))]);assert.equal(state[3],null);assert.equal(state[7],'');continue;}
   await buttons.find(node=>node.props.children==='설치 시작').props.onClick();assert.equal(pending.length,0,'unconfirmed disabled installation handler must not send an API request');
   rail.find(node=>node.props['aria-label']==='도구').props.onClick();assert.equal(redirects.at(-1),'/ide/packages/redis');
   const refreshClick=buttons.find(node=>node.props.children==='새로고침 ↻').props.onClick;const refresh=refreshClick();await refreshClick();if(expired!==true&&expired!=='malformed-401'&&expired!=='storage-503')assert.equal(pending.length,2,'double click must not duplicate status/security requests');
   if(expired==='storage-503'){await refresh;assert.equal(state[3].hostname,'fixture');assert.equal(state[4].settings.readOnly,true);assert(!redirects.some(value=>value.startsWith('/login')));continue;}
   if(expired===true||expired==='malformed-401'){await refresh;assert.deepEqual(hardRedirects,['/login?next=%2Fide%2Fpackages%2Fredis']);assert.equal(state[7],'');}
   else{
    await buttons.find(node=>node.props.children==='로그아웃').props.onClick();assert.equal(state[3],null);
    for(const resolve of pending)resolve({status:expired==='late-401'?401:200,ok:expired!=='late-401',json:async()=>({packages:[],hostname:'stale',settings:{readOnly:false}})});
    await refresh;assert.equal(state[3],null);assert.equal(state[4],null);assert.equal(redirects.at(-1),'/login');
   }
  }
 }finally{globalThis.fetch=original;globalThis.window=originalWindow;}
});
