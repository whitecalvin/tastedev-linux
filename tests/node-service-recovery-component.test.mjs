import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture(props){await loadBindings();const compiled=await transform(await readFile(new URL('../components/node-service-recovery.tsx',import.meta.url),'utf8'),{filename:'node-service-recovery.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});const states=[],refs=[],effects=[];let stateIndex=0,refIndex=0,effectIndex=0,pending=[];const Button=()=>null,native=createRequire(import.meta.url),module={exports:{}};
 const hooks={...React,useState:init=>{const at=stateIndex++;if(!(at in states))states[at]=init;return[states[at],next=>states[at]=typeof next==='function'?next(states[at]):next];},useRef:init=>refs[refIndex++]??(refs[refIndex-1]={current:init}),useEffect:(fn,deps)=>{const at=effectIndex++,old=effects[at];if(!old||deps.some((value,index)=>!Object.is(value,old.deps[index])))pending.push(()=>{old?.cleanup?.();effects[at]={deps,fn,cleanup:fn()};});}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button}:name==='../lib/capabilities.ts'?{featureAllowed:(policy,key)=>Boolean(policy&&!policy.settings.readOnly&&policy.settings[key])}:native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);
 function render(){stateIndex=refIndex=effectIndex=0;const tree=module.exports.default(props);const queued=pending;pending=[];queued.forEach(fn=>fn());return tree;}
 function nodes(){const all=[];function visit(node){if(!node||typeof node!=='object')return;all.push(node);React.Children.forEach(toastTestChildren(node),visit);}visit(render());return all;}
 return {props,Button,render,nodes,replay:()=>effects.forEach(effect=>{effect.cleanup?.();effect.cleanup=effect.fn();}),dispose:()=>effects.forEach(effect=>effect.cleanup?.())};}

const security={settings:{readOnly:false,serviceChanges:true,sudoWithoutPrompt:true},available:{},privilege:{ready:true}},plan={id:'fixture',registryVersion:'a'.repeat(64),unit:'tastedev-node-fixture.service'},review={...plan,recoveryRequired:true,reviewVersion:'b'.repeat(64),files:[{name:'package.json',version:'c'.repeat(64)}],options:{restart:'always'},currentOptions:{restart:'always'},serviceOptions:{restart:'on-failure'},backupId:'fixture-backup'};
const button=(view,label)=>view.nodes().find(node=>node.type===view.Button&&node.props.children===label);
test('Node recovery GUI reviews manually and commits once only after final confirmation',async()=>{
 const calls=[],busy=[];let finish;const api=async(action,data)=>{calls.push({action,data});return action.startsWith('node-app-service-recovery-plan')?review:new Promise(resolve=>finish=resolve);};
 const view=await fixture({plan,api,security,connected:true,onBusy:value=>busy.push(value)});view.render();assert.equal(calls.length,0);
 await button(view,'중단 작업 조회').props.onClick();assert.equal(calls.length,1);assert(!button(view,'서비스 중단 복구 확인'));
 button(view,'중단 작업 복구').props.onClick();assert(view.nodes().some(node=>node.props?.role==='alertdialog'));
 const commit=button(view,'서비스 중단 복구 확인'),first=commit.props.onClick(),second=commit.props.onClick();assert.equal(calls.length,2);
 assert.deepEqual(calls[1].data,{id:plan.id,registryVersion:review.registryVersion,files:review.files,options:review.options,reviewVersion:review.reviewVersion,confirm:true});
 finish({recovered:true});await Promise.all([first,second]);assert(view.nodes().some(node=>node.props?.role==='status'));assert.deepEqual(busy,[true,false,true,false]);view.dispose();
});
test('Node recovery GUI rejects stale reviews and clears confirmation when disconnected',async()=>{
 let finish;const calls=[];const view=await fixture({plan,api:action=>{calls.push(action);return new Promise(resolve=>finish=resolve);},security,connected:true});view.render();const pending=button(view,'중단 작업 조회').props.onClick();view.props.plan={...plan,id:'other'};view.render();finish(review);await pending;assert(!button(view,'중단 작업 복구'));
 view.props.plan=plan;view.render();const current=button(view,'중단 작업 조회').props.onClick();finish(review);await current;button(view,'중단 작업 복구').props.onClick();view.props.connected=false;view.render();assert(!view.nodes().some(node=>node.props?.role==='alertdialog'));assert.equal(button(view,'중단 작업 조회').props.disabled,true);view.dispose();
});
test('Node recovery GUI permits read-only inspection but disables restoration',async()=>{
 const view=await fixture({plan,api:async()=>review,security:{...security,settings:{...security.settings,readOnly:true}},connected:true});view.render();await button(view,'중단 작업 조회').props.onClick();assert.equal(button(view,'중단 작업 복구').props.disabled,true);view.dispose();
});

test('previous connection recovery handlers cannot submit after API, policy, disabled or unmount change',async()=>{
 for(const change of ['api','policy','disabled','unmount']){
  const calls=[],api=async(action,data)=>{calls.push({action,data});return review;},view=await fixture({plan,security,connected:true,api});view.render();
  const lookup=button(view,'중단 작업 조회').props.onClick;await lookup();const open=button(view,'중단 작업 복구').props.onClick;open();
  const commit=button(view,'서비스 중단 복구 확인').props.onClick;
  if(change==='api')view.props.api=(...args)=>api(...args);
  if(change==='policy')view.props.security={...security,version:'new-policy'};
  if(change==='disabled')view.props.disabled=true;
  if(change==='unmount')view.dispose();else{const nodes=view.nodes();if(change!=='disabled')assert(!nodes.some(node=>node.props?.role==='alertdialog'),'old confirmation hidden on first render');}
  const before=calls.length;open();await lookup();await commit();assert.equal(calls.length,before,'no stale transport after '+change);view.dispose();
 }
});
test('response from a previous API does not unlock recovery on the new connection',async()=>{
 let finish;const api=()=>new Promise(resolve=>finish=resolve),view=await fixture({plan,security,connected:true,api});view.render();
 const request=button(view,'중단 작업 조회').props.onClick;const pending=request();view.props.api=async()=>review;view.nodes();finish(review);await pending;
 assert(!button(view,'중단 작업 복구'));await button(view,'중단 작업 조회').props.onClick();assert(button(view,'중단 작업 복구'));view.dispose();
});

test('StrictMode recovery lookup finishes and incomplete recovery remains an alert',async()=>{
 const api=async action=>action.includes('recovery-plan')?review:{recovered:false,restored:true},view=await fixture({plan,security,connected:true,api});view.render();
 view.replay();await button(view,'중단 작업 조회').props.onClick();assert.equal(button(view,'중단 작업 조회').props.disabled,false);
 button(view,'중단 작업 복구').props.onClick();await button(view,'서비스 중단 복구 확인').props.onClick();
 assert(view.nodes().some(node=>node.props?.role==='alert'&&String(node.props.children).includes('원본은 복원했지만')));view.dispose();
});

test('parent busy feedback disables other actions without discarding an in-flight recovery lookup',async()=>{
 let finish;const view=await fixture({plan,security,connected:true,api:()=>new Promise(resolve=>finish=resolve)});view.props.onBusy=value=>{view.props.disabled=value;view.render();};view.render();const pending=button(view,'중단 작업 조회').props.onClick();assert(button(view,'중단 작업 조회').props.disabled);finish(review);await pending;assert.equal(button(view,'중단 작업 복구').props.disabled,false);assert.equal(view.props.disabled,false);view.dispose();
});


test('only a completed recovery notifies the parent and completion survives notification failure',async()=>{
 for(const recovered of [true,false]){
  const output={recovered,restored:true,backupId:'owned-backup'};let callbacks=0;
  const view=await fixture({plan,security,connected:true,api:async action=>action.includes('recovery-plan')?review:output,onRecovered:value=>{callbacks++;assert.equal(value,output);throw Error('refresh failed');}});view.render();await button(view,'중단 작업 조회').props.onClick();button(view,'중단 작업 복구').props.onClick();await button(view,'서비스 중단 복구 확인').props.onClick();assert.equal(callbacks,recovered?1:0);if(recovered)assert(view.nodes().some(node=>node.props?.role==='status'));view.dispose();
 }
});

test('Node interrupted recovery cancelled approval cannot be reused for a fresh confirmation',async()=>{
 let writes=0;const api=async action=>{if(action.includes('recovery-plan'))return review;writes++;return {recovered:true};};
 const view=await fixture({plan,security,connected:true,api});view.render();await button(view,'중단 작업 조회').props.onClick();button(view,'중단 작업 복구').props.onClick();
 const stale=button(view,'서비스 중단 복구 확인').props.onClick;button(view,'취소').props.onClick();await stale();assert.equal(writes,0);
 button(view,'중단 작업 복구').props.onClick();const fresh=button(view,'서비스 중단 복구 확인').props.onClick;
 await stale();assert.equal(writes,0);await fresh();assert.equal(writes,1);await fresh();assert.equal(writes,1);view.dispose();
});
