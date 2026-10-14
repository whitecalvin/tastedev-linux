import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as packageIdeTypes from '../components/package-ide-types.ts';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';

test('installation readback survives page remount and completion refresh updates package versions',async()=>{
 await loadBindings();const {code}=await transform(await readFile(new URL('../components/console-workspace.tsx',import.meta.url),'utf8'),{filename:'console-workspace.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),module={exports:{}},drafts={},noop=()=>null;
 let local=[],index=0,readback={hostname:'fixture',packages:[{id:'nginx',installed:false,packages:[{name:'nginx',version:null}]}],job:{id:'install-owned',status:'running',command:['apt-get'],logs:['원본 진행 로그']}};
 const hooks={...React,useState:initial=>{const i=index++;if(!(i in local))local[i]=typeof initial==='function'?initial():initial;return[local[i],value=>local[i]=typeof value==='function'?value(local[i]):value];},useRef:value=>({current:value}),useEffect:noop,useCallback:fn=>fn,useMemo:fn=>fn()};
 const Button='Button',Progress='Progress';
 const require=name=>{if(name==='./ui/toast-provider')return toastTestModule(require);if(name==='./package-ide-types')return packageIdeTypes;if(name==='./console-types')return consoleTypes;if(name==='./console-types')return consoleTypes;
  if(name==='react')return hooks;
  if(name==='next/dynamic')return {__esModule:true,default:()=>noop};
  if(name==='next/navigation')return {useRouter:()=>({push:noop,replace:noop,refresh:noop})};
  if(name.includes('language-provider'))return {useLanguage:()=>({t:value=>value}),LanguagePicker:noop};
  if(name.includes('draft-provider'))return {useClearDrafts:()=>()=>{for(const key of Object.keys(drafts))delete drafts[key];},useDraftState:(key,initial)=>{const fallback=typeof initial==='function'?initial():initial;return[Object.hasOwn(drafts,key)?drafts[key]:fallback,value=>{drafts[key]=typeof value==='function'?value(Object.hasOwn(drafts,key)?drafts[key]:fallback):value;}];}};
  if(name.includes('ui/controls'))return {Button,Progress,Checkbox:'Checkbox',TextInput:noop,Badge:noop,CustomSelect:noop};
  if(name.endsWith('.mjs')||name.endsWith('.ts'))return native(name);
  if(name.startsWith('.')||name==='next/link'||name==='next/dynamic')return {default:noop};return native(name);
 };
 new Function('require','module','exports',code)(require,module,module.exports);
 const originalFetch=globalThis.fetch;globalThis.fetch=async url=>({ok:true,status:200,json:async()=>url==='/api/security'?{settings:{readOnly:true}}:readback});
 const render=(view='packages')=>{index=0;return module.exports.default({view,initialData:{status:{...readback,job:null}}});};
 const find=(tree,predicate)=>{if(!tree||typeof tree!=='object')return null;if(predicate(tree))return tree;return React.Children.toArray(toastTestChildren(tree)).map(child=>find(child,predicate)).find(Boolean);};
 try{
  let tree=render();await find(tree,node=>node.type===Button&&node.props.children==='새로고침 ↻').props.onClick();assert.equal(drafts.consoleInstallJob.id,'install-owned');
  local=[];render('overview');local=[];tree=render();assert(find(tree,node=>node.type===Progress));assert(find(tree,node=>node.type==='pre'&&String(node.props.children).includes('원본 진행 로그')));
  assert.equal(find(tree,node=>node.type==='Checkbox'&&node.props.label==='설치 대상에 추가').props.disabled,true);
  readback={...readback,packages:[{id:'nginx',installed:true,packages:[{name:'nginx',version:'1.26.0'}]}],job:{...readback.job,status:'success',logs:['설치 완료 로그']}};
  await find(tree,node=>node.type===Button&&node.props.children==='새로고침 ↻').props.onClick();local=[];tree=render();assert(!find(tree,node=>node.type===Progress));assert.equal(drafts.consoleStatus.packages[0].packages[0].version,'1.26.0');assert(find(tree,node=>node.type==='pre'&&String(node.props.children).includes('설치 완료 로그')));
 }finally{globalThis.fetch=originalFetch;}
});
