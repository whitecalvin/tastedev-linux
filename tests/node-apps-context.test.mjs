import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
const native=createRequire(import.meta.url);
async function fixture(props){
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/node-apps.tsx',import.meta.url),'utf8'),{filename:'node-apps.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}}),module={exports:{}},states=[],refs=[],effects=[],pending=[];let si=0,ri=0,ei=0;
 const hooks={...React,useId:()=> 'node-test',useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return[states[i],next=>states[i]=typeof next==='function'?next(states[i]):next];},useRef:initial=>{const i=ri++;return refs[i]??(refs[i]={current:initial});},useEffect:(fn,deps)=>{const i=ei++;if(!effects[i]||deps.some((v,j)=>v!==effects[i].deps[j]))pending.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,cleanup:fn()};});}};
 new Function('require','module','exports',compiled.code)(name=>name==='./console-types'?consoleTypes:name==='./ui/toast-provider'?toastTestModuleWithReact(hooks):name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:v=>v})}:name==='../lib/capabilities.ts'?{featureAllowed:(security,key)=>!security?.settings?.readOnly&&security?.settings?.[key],featureReason:()=>''}:name==='./ui/controls'?{Button:'Button',TextInput:'TextInput',Checkbox:'Checkbox',Dropdown:'Dropdown'}:name.startsWith('./')?{__esModule:true,default:name}:native(name),module,module.exports);
 const walk=tree=>!tree||typeof tree!=='object'?[]:[tree,...React.Children.toArray(toastTestChildren(tree)).flatMap(walk)];
 return{props,render(flush=true){si=ri=ei=0;const nodes=walk(module.exports.default(props));if(flush)while(pending.length)pending.shift()();return nodes;},dispose(){for(const e of effects)e.cleanup?.();}};
}
const initialData={version:'v1',apps:[{id:'fixture',label:'시험 앱',directory:'/srv/fixture',entry:'server.js',environmentFile:'.env'}]},security={version:'v1',settings:{readOnly:false,fileEditing:true,serviceChanges:true,sudoWithoutPrompt:true},privilege:{ready:true}};
const button=(nodes,label)=>nodes.find(n=>n.type==='Button'&&n.props.children===label);
test('old Node app save callback cannot send to previous connection, even before effects flush',async()=>{
 const calls=[],view=await fixture({api:async(...args)=>{calls.push(args);return initialData;},connected:true,security,initialData,selectedId:'fixture'});view.render();const save=button(view.render(),'앱 등록 저장');view.props.api=async()=>initialData;const next=view.render(false);await save.props.onClick();assert.deepEqual(calls,[]);assert(!next.some(n=>n.type==='TextInput'&&n.props.value==='/srv/fixture'));view.dispose();
});
test('duplicate Node app saves are ignored while pending and stale results cannot replace a new connection',async()=>{
 let finish;const calls=[],view=await fixture({api:async(...args)=>{calls.push(args);return new Promise(resolve=>finish=resolve);},connected:true,security,initialData,selectedId:'fixture'});view.render();const save=button(view.render(),'앱 등록 저장'),pending=save.props.onClick();const duplicate=save.props.onClick();assert.equal(calls.length,1);await duplicate;view.props.api=async()=>initialData;view.render();finish({version:'old',apps:[{...initialData.apps[0],directory:'/srv/old-result'}]});await pending;assert(!view.render().some(n=>n.type==='TextInput'&&n.props.value==='/srv/old-result'));view.dispose();
});
test('revoked file editing blocks retained save callback',async()=>{
 let writes=0;const view=await fixture({api:async()=>{writes++;return initialData;},connected:true,security,initialData,selectedId:'fixture'});view.render();const save=button(view.render(),'앱 등록 저장');view.props.security={...security,settings:{...security.settings,fileEditing:false}};view.render(false);await save.props.onClick();assert.equal(writes,0);view.dispose();
});

test('equivalent security snapshots preserve in-progress app edits',async()=>{
 const api=async()=>initialData,view=await fixture({api,connected:true,security,initialData,selectedId:'fixture'});view.render();view.render().find(n=>n.type==='TextInput'&&n.props.label==='앱 이름').props.onChange({target:{value:'편집 중'}});view.props.security={...security,settings:{...security.settings},privilege:{...security.privilege}};view.render();assert.equal(view.render().find(n=>n.type==='TextInput'&&n.props.label==='앱 이름').props.value,'편집 중');view.dispose();
});

test('service registration refreshes its current daemon list once and never refreshes a changed connection',async()=>{
 for(const stale of [false,true]){
  let resolve,refreshes=0;const calls=[],plan={id:'fixture',registryVersion:initialData.version,unit:'tastedev-node-fixture.service',runtime:{status:'ready'},files:[],serviceOptions:{restart:'no'},text:'unit'};
  const api=async action=>{calls.push(action);if(action==='node-app-service-install')return new Promise(done=>resolve=done);if(action.startsWith('node-app-service-plan?'))return plan;return {id:'fixture',ready:true,files:[],directoryStatus:'ready'};};
  const view=await fixture({api,connected:true,security,initialData,selectedId:'fixture',onServiceChanged:async()=>refreshes++});view.render();await button(view.render(),'등록 앱 파일 확인').props.onClick();await button(view.render(),'앱 서비스 설정 검토').props.onClick();button(view.render(),'서비스 등록').props.onClick();
  const confirm=button(view.render(),'서비스 등록 확인');assert(confirm);assert.equal(confirm.props.disabled,false);const pending=confirm.props.onClick();
  if(stale){view.props.api=async()=>initialData;view.render();}
  resolve({installed:true,unit:plan.unit});await pending;assert.equal(refreshes,stale?0:1);assert.equal(calls.filter(action=>action==='node-app-service-install').length,1);view.dispose();
 }
});
