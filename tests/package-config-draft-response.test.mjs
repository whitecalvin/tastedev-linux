import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {configDefaults} from '../lib/config-schema.ts';

test('package draft results follow the requested package and current edits',async()=>{
 await loadBindings();
 const compiled=await transform(await readFile(new URL('../components/package-config.tsx',import.meta.url),'utf8'),{filename:'package-config.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(new URL('../components/package-config.tsx',import.meta.url));
 for(const label of ['작업 폴더에 초안 저장','생성한 설정 검토','설정 초안 다운로드'])for(const transition of ['unchanged','package','edit','disconnect','api','unmount','failure']){
  const refs=[],states=[],effects=[];let refIndex=0,stateIndex=0,kind='nodejs',draft=configDefaults('nodejs'),connected=true,resolve,reject;
  const opened=[],updates=[],downloads=[];
  const hooks={...React,useRef:value=>refs[refIndex++]??(refs[refIndex-1]={current:value}),useEffect:fn=>effects.push(fn),useMemo:fn=>fn(),useState:value=>{const at=stateIndex++;if(!(at in states))states[at]=typeof value==='function'?value():value;return [states[at],next=>{states[at]=typeof next==='function'?next(states[at]):next;updates.push(states[at]);}];}};
  const noop=()=>null,Button=()=>null,module={exports:{}};
  const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./draft-provider'?{useDraftState:(key,initial)=>key==='packageKind'?[kind,noop]:key==='packageDrafts'?[{[kind]:draft},noop]:key==='packageBaselines'?[{},noop]:[typeof initial==='function'?initial():initial,noop]}:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button,Switch:noop,Dropdown:noop,TextInput:noop,Badge:noop}:name.startsWith('./')?{default:noop}:native(name);
  new Function('require','module','exports',compiled.code)(require,module,module.exports);
  let api=()=>new Promise((done,fail)=>{resolve=done;reject=fail;});
  function render(){refIndex=0;stateIndex=0;return module.exports.default({api,connected,onOpen:value=>opened.push(value),security:{settings:{fileEditing:true},available:{fileEditing:true}},requestedProfile:{kind}});}
  let button;function visit(node){if(!node||typeof node!=='object')return;if(node.type===Button&&node.props.children===label)button=node;React.Children.forEach(toastTestChildren(node),visit);}visit(render());assert(button,label);
  const cleanups=effects.map(fn=>fn()).filter(fn=>typeof fn==='function');
  const originalDocument=globalThis.document;globalThis.document={createElement:()=>({click:()=>downloads.push(true)})};
  const pending=button.props.onClick();
  if(transition==='package'){kind='redis';draft=configDefaults(kind);}if(transition==='edit')draft={...draft,port:3149};if(transition==='disconnect')connected=false;
  if(transition==='api')api=()=>{throw Error('Old request must not use new API');};
  if(transition==='unmount')cleanups.forEach(fn=>fn());else if(transition!=='unchanged')render();
  if(transition==='failure'){kind='redis';draft=configDefaults(kind);render();reject(Error('old request failed'));}else resolve({name:'nodejs-fixture.env',text:'PORT=3000\n',version:'fixture-version'});
  try{await pending;}finally{if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument;}
  assert.equal(downloads.length,label==='설정 초안 다운로드'&&transition==='unchanged'?1:0,`${label}: ${transition}`);
  assert.equal(opened.length,label!=='설정 초안 다운로드'&&transition==='unchanged'?1:0,`${label}: ${transition}`);
  assert(!updates.includes('old request failed'),'stale errors must not appear on the new package');
 }
});
