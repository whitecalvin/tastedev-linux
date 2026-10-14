import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as packageIdeTypes from '../components/package-ide-types.ts';
import * as consoleTypes from '../components/console-types.ts';
import {workPermissionLabel} from '../lib/capabilities.ts';
import {installedPackageVersion,installedPackageVersionDetails} from '../lib/package-version.ts';
import {filterPackages} from '../lib/package-filter.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';
import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {consoleRefreshGuard} from '../lib/console-refresh.ts';import {consoleRoute} from '../lib/console-route.ts';import {installedProfile} from '../lib/package-selection.ts';import {operationTerminalReport} from '../lib/operation-terminal-report.ts';
test('package navigation retains installed list and only initial load or refresh queries the server snapshot',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/console-workspace.tsx',import.meta.url),'utf8'),{filename:'console-workspace.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),cache={},calls=[],noop=()=>null,Button=()=>null,module={exports:{}};let effects=[],states=[],index=0;
 const status={hostname:'fixture',packages:['nginx','certbot','postgresql'].map(id=>({id,installed:true,packages:[]})),job:null},security={settings:{readOnly:true},available:{}};
 const hooks={...React,useState:initial=>{const at=index++;if(!(at in states))states[at]=typeof initial==='function'?initial():initial;return[states[at],value=>states[at]=typeof value==='function'?value(states[at]):value];},useRef:value=>({current:value}),useEffect:fn=>effects.push(fn),useMemo:fn=>fn(),useCallback:fn=>fn};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./package-ide-types'?packageIdeTypes:name==='./console-types'?consoleTypes:name==='./console-types'?consoleTypes:name==='react'?hooks:name==='next/navigation'?{useRouter:()=>({replace:noop,push:noop,refresh:noop})}:name.includes('package-version')?{installedPackageVersion,installedPackageVersionDetails}:name.includes('console-refresh')?{consoleRefreshGuard}:name.includes('console-route')?{consoleRoute}:name.includes('package-filter')?{filterPackages}:name.includes('package-selection')?{installedProfile}:name.includes('operation-terminal-report')?{operationTerminalReport}:name.includes('language-provider')?{useLanguage:()=>({t:value=>value}),LanguagePicker:noop}:name.includes('draft-provider')?{useClearDrafts:()=>noop,useDraftState:(key,initial)=>{const fallback=typeof initial==='function'?initial():initial;return[Object.hasOwn(cache,key)?cache[key]:fallback,value=>cache[key]=typeof value==='function'?value(Object.hasOwn(cache,key)?cache[key]:fallback):value];}}:name.includes('capabilities')?{featureAllowed:()=>false,workPermissionLabel}:name.includes('ui/controls')?{Button,Checkbox:noop,TextInput:noop,Badge:noop,Progress:noop,Dropdown:noop,CustomSelect:noop}:name.startsWith('.')||name==='next/link'?{default:noop}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const original=globalThis.fetch;try{
  globalThis.fetch=async url=>{calls.push(url);return{ok:true,status:200,json:async()=>url==='/api/auth/status'?{authenticated:true}:url==='/api/status'?status:security};};
  let tree;for(const [at,kind] of ['nginx','certbot','postgresql'].entries()){
   effects=[];states=[];index=0;tree=module.exports.default({view:kind==='postgresql'?'ide':'server-settings',selectedPackage:kind});
   effects.at(-1)();await new Promise(done=>setImmediate(done));
   assert.equal(calls.filter(url=>url==='/api/status').length,1);assert.equal(calls.filter(url=>url==='/api/security').length,1);
   assert.equal(cache.consoleStatus,status);if(at>0)assert(!JSON.stringify(tree).includes('연결 대기'));
  }
  const find=(node,predicate)=>{if(!node||typeof node!=='object')return null;if(node.type?.name==='ConsolePage')return find(node.type(node.props),predicate);if(predicate(node))return node;for(const child of React.Children.toArray(toastTestChildren(node))){const found=find(child,predicate);if(found)return found;}return null;};
  for(const view of ['overview','daemon','logs','recovery','security','audit','packages']){
   effects=[];states=[];index=0;const page=module.exports.default({view});
   const main=find(page,node=>node.type==='main');assert(main.props.className.includes('management-page'),view);
   const children=React.Children.toArray(toastTestChildren(main));assert.equal(children[0].props.className,'admin-page-heading');
   const body=children.find(node=>typeof node.type==='function'&&node.type.name==='ConsoleBody'&&node.props.view===view);assert(body,view);
   const rendered=body.type(body.props);assert.equal(rendered.props.className,'management-body');
   assert(find(children[0],node=>node.type===Button&&node.props.disabled===false),'header refresh remains available');
  }
  const features=['nginxChanges','databaseChanges','certificateChanges','serviceChanges','sudoPolicyChanges','cronChanges','packageInstall','fileEditing','terminal'];
  const full={settings:{readOnly:false,sudoWithoutPrompt:true,...Object.fromEntries(features.map(key=>[key,true]))},available:{},privilege:{ready:true}};
  const policyCases=[
   [security,'조회 전용'],
   [{settings:{readOnly:false},available:{}},'작업 차단'],
   [{settings:{readOnly:false,terminal:true},available:{terminal:true}},'일부 작업 허용'],
   [full,'작업 허용'],
   [{...full,available:Object.fromEntries(features.map(key=>[key,false]))},'작업 차단'],
   [{...full,privilege:{ready:false}},'일부 작업 허용'],
   [null,'권한 설정 확인'],
  ];
  for(const [policy,label] of policyCases){
   cache.consoleSecurity=policy;effects=[];states=[];index=0;
   const page=module.exports.default({view:'overview'});
   const stats=find(page,node=>node.props?.className==='dashboard-stats');assert(stats);
   const card=React.Children.toArray(toastTestChildren(stats))[3];
   assert.equal(find(card,node=>node.type==='strong').props.children,label);
  }
  cache.consoleSecurity=security;
  const ideMain=find(tree,node=>node.type==='main');assert(!ideMain.props.className.includes('management-page'));
  const ideBody=React.Children.toArray(toastTestChildren(ideMain)).find(node=>typeof node.type==='function'&&node.type.name==='ConsoleBody'&&node.props.view==='ide');assert(ideBody);assert.equal(ideBody.type(ideBody.props),ideBody.props.children);
  let refresh;function visit(node){if(!node||typeof node!=='object')return;if(node.type===Button&&node.props['aria-label']==='설치된 패키지 갱신')refresh=node;React.Children.forEach(toastTestChildren(node),visit);}visit(tree);assert(refresh);await refresh.props.onClick();assert.equal(calls.filter(url=>url==='/api/status').length,2);assert.equal(calls.filter(url=>url==='/api/security').length,2);

  for(const [jobStatus,label] of [['running','설치 진행 중'],['success','설치 명령 완료'],['failed','설치 실패']]){
   effects=[];states=[];index=0;
   delete cache.consoleInstallJob;
   const job={id:'fixture-job',status:jobStatus,command:['fixture-install-process'],logs:['fixture output']};
   const seeded=module.exports.default({view:'packages',initialData:{status:{...status,job},security}});
   const serialized=JSON.stringify(seeded);
   assert(serialized.includes(label),jobStatus+' first render restores job status');
   assert(serialized.includes('fixture-install-process'),jobStatus+' first render restores command');
   assert(serialized.includes('fixture output'),jobStatus+' first render restores output');
  }
 }finally{globalThis.fetch=original;}
});
