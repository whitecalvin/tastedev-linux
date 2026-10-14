import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import * as consoleTypes from '../components/console-types.ts';
import {configSchemas} from '../lib/config-schema.ts';
import {nodeEnvSavedSnapshot} from '../lib/node-env-outcome.ts';
async function fixture(kind,props){
 await loadBindings();const filename=`node-${kind}-env.tsx`,code=await transform(await readFile(new URL('../components/'+filename,import.meta.url),'utf8'),{filename,jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],effects=[];let si=0,ri=0,ei=0,queued=[];
 const controls=Object.fromEntries(['Button','TextInput','Checkbox','Dropdown'].map(key=>[key,()=>null]));
 const hooks={...React,useState:init=>{const i=si++;if(!(i in states))states[i]=init;return[states[i],next=>states[i]=typeof next==='function'?next(states[i]):next];},useRef:init=>refs[ri++]??(refs[ri-1]={current:init}),useEffect:(fn,deps)=>{const i=ei++,old=effects[i];if(!old||deps.some((value,j)=>!Object.is(value,old.deps[j])))queued.push(()=>{old?.cleanup?.();effects[i]={deps,cleanup:fn()};});}};
 const native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModuleWithReact(hooks):name==='react'?hooks:name==='./console-types'?consoleTypes:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?controls:name==='./node-env-backups'?{__esModule:true,default:()=>null}:name==='../lib/config-schema.ts'?{configSchemas}:name==='../lib/node-env-outcome.ts'?{nodeEnvSavedSnapshot}:name==='../lib/capabilities.ts'?{featureAllowed:policy=>Boolean(policy&&!policy.settings.readOnly&&policy.settings.fileEditing)}:native(name);
 new Function('require','module','exports',code.code)(require,module,module.exports);
 function render(flush=true){si=ri=ei=0;const tree=module.exports.default(props);if(flush){const pending=queued;queued=[];pending.forEach(fn=>fn());}return tree;}
 function nodes(tree=render()){const all=[];function visit(node){if(!node||typeof node!=='object')return;all.push(node);React.Children.forEach(node.props?.children,visit);}visit(tree);return all;}
 return{props,render,nodes,button:label=>nodes().find(n=>n.type===controls.Button&&n.props.children===label),control:label=>nodes().find(n=>n.props?.label===label),dispose:()=>effects.forEach(e=>e.cleanup?.())};
}
const security={settings:{readOnly:false,fileEditing:true}},snapshot={id:'app',directory:'/fixture',name:'app.env',registryVersion:'a'.repeat(64),version:'b'.repeat(64),values:{port:3000}};
async function prepared(kind,api){const props={id:'app',connected:true,security,api,draft:{port:4000},onImport:()=>{}};const view=await fixture(kind,props);view.render();if(kind==='workspace'){view.control('환경 파일 경로').props.onChange({target:{value:'app.env'}});view.render();}await view.button('환경 파일 조회').props.onClick();return view;}
for(const kind of ['app','workspace']){
 test(`${kind} environment rejects old query and captured actions before connection effects`,async()=>{
  let finish,calls=0;const oldApi=()=>{calls++;return new Promise(resolve=>finish=resolve);};const view=await fixture(kind,{id:'app',connected:true,security,api:oldApi,draft:{port:4000}});view.render();if(kind==='workspace'){view.control('환경 파일 경로').props.onChange({target:{value:'app.env'}});view.render();}
  const button=view.button('환경 파일 조회'),pending=button.props.onClick();view.props.api=async()=>snapshot;const tree=view.render(false);await button.props.onClick();assert.equal(calls,1);finish(snapshot);await pending;assert(!JSON.stringify(view.render(false)).includes('registryVersion'));assert(!view.nodes(tree).some(n=>n.type==='table'));view.dispose();
 });
 test(`${kind} environment save binds approval to input and locks repeated execution`,async()=>{
  let calls=0,finish;const api=async(action,payload)=>{if(action.includes('?'))return snapshot;calls++;assert.equal(payload.version,snapshot.version);assert.equal(payload.changes.port,kind==='app'?'4000':4000);return new Promise(resolve=>finish=resolve);};const view=await prepared(kind,api);
  if(kind==='app'){view.control('앱 포트').props.onChange({target:{value:'4000'}});view.control('환경 파일 변경을 확인합니다. 앱 재시작은 별도로 수행합니다.').props.onChange({target:{checked:true}});}else view.button('GUI 값을 파일에 저장').props.onClick();
  const commit=view.button(kind==='app'?'변경 저장':'변경 저장').props.onClick,pending=commit();await commit();assert.equal(calls,1);finish({...snapshot,saved:true,values:{port:4000}});await pending;assert.equal(view.button('환경 파일 조회').props.disabled,false);view.dispose();
 });
 test(`${kind} environment save rejects retained approval after input, policy or connection changes`,async()=>{
  for(const change of ['input','policy','api','unmount']){
   let writes=0;const api=async(action)=>{if(action.includes('?'))return snapshot;writes++;return {...snapshot,saved:true};};const view=await prepared(kind,api);
   if(kind==='app'){view.control('앱 포트').props.onChange({target:{value:'4000'}});view.control('환경 파일 변경을 확인합니다. 앱 재시작은 별도로 수행합니다.').props.onChange({target:{checked:true}});}else view.button('GUI 값을 파일에 저장').props.onClick();
   const commit=view.button('변경 저장').props.onClick;
   if(change==='input'){if(kind==='app')view.control('앱 포트').props.onChange({target:{value:'5000'}});else view.props.draft={port:5000};}
   if(change==='policy')view.props.security={settings:{readOnly:true,fileEditing:true}};
   if(change==='api')view.props.api=async()=>assert.fail('old approval reached new connection');
   if(change==='unmount')view.dispose();else view.render(false);
   await commit();assert.equal(writes,0,change);view.dispose();
  }
 });
}
test('app environment restore consumes approval and preserves versioned plan',async()=>{
 let writes=0,finish;const plan={id:'app',backupId:'backup',name:'app.env',registryVersion:snapshot.registryVersion,version:snapshot.version,backupVersion:'c'.repeat(64),fields:[],changed:true,notice:''};
 const api=async(action,payload)=>{if(action.startsWith('node-app-env-backups?'))return{backups:[{id:'backup'}],warnings:0,truncated:false};if(action.startsWith('node-app-env-restore-plan?'))return plan;if(action.includes('?'))return snapshot;writes++;assert.equal(payload.backupVersion,plan.backupVersion);return new Promise(resolve=>finish=resolve);};
 const view=await prepared('app',api);await view.button('환경 파일 백업 조회').props.onClick();await view.button('복구 검토').props.onClick();view.control('비밀 값을 포함한 전체 환경 파일 복구를 확인합니다.').props.onChange({target:{checked:true}});
 const commit=view.button('환경 파일 복구').props.onClick,pending=commit();await commit();assert.equal(writes,1);finish(snapshot);await pending;await commit();assert.equal(writes,1);view.dispose();
});
