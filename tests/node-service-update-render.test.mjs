import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture(props){await loadBindings();const compiled=await transform(await readFile(new URL('../components/node-service-update.tsx',import.meta.url),'utf8'),{filename:'node-service-update.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});const states=[],refs=[],effects=[];let stateIndex=0,refIndex=0,effectIndex=0,pending=[];const Button=()=>null,native=createRequire(import.meta.url),module={exports:{}};
 const hooks={...React,useState:init=>{const at=stateIndex++;if(!(at in states))states[at]=init;return[states[at],next=>states[at]=typeof next==='function'?next(states[at]):next];},useRef:init=>refs[refIndex++]??(refs[refIndex-1]={current:init}),useEffect:(fn,deps)=>{const at=effectIndex++,old=effects[at];if(!old||deps.some((value,index)=>!Object.is(value,old.deps[index])))pending.push(()=>{old?.cleanup?.();effects[at]={deps,fn,cleanup:fn()};});}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button}:name==='../lib/capabilities.ts'?{featureAllowed:(policy,key)=>Boolean(policy&&!policy.settings.readOnly&&policy.settings[key])}:native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);
 function render(){stateIndex=refIndex=effectIndex=0;const tree=module.exports.default(props);const queued=pending;pending=[];queued.forEach(fn=>fn());return tree;}
 function nodes(){const all=[];function visit(node){if(!node||typeof node!=='object')return;all.push(node);React.Children.forEach(toastTestChildren(node),visit);}visit(render());return all;}
 return {props,Button,render,nodes,replay:()=>effects.forEach(effect=>{effect.cleanup?.();effect.cleanup=effect.fn();}),dispose:()=>effects.forEach(effect=>effect.cleanup?.())};}

const security={settings:{readOnly:false,serviceChanges:true,sudoWithoutPrompt:true},available:{},privilege:{ready:true}},plan={id:'fixture',registryVersion:'a'.repeat(64),unit:'tastedev-node-fixture.service',files:[],serviceOptions:{restart:'always',restartSeconds:30,stopSeconds:null},runtime:{status:'ready'}},review={...plan,registered:true,unitVersion:'b'.repeat(64),serviceOptions:{restart:'no'},currentOptions:{restart:'always'},backupId:'12345678-1234-1234-1234-123456789abc',backupVersion:'c'.repeat(64)};
const button=(view,label)=>view.nodes().find(node=>node.type===view.Button&&node.props.children===label);
test('Node update reviews through API, consumes final confirmation once and preserves reviewed payload',async()=>{
 const calls=[],busy=[];let finish;const api=async(action,data)=>{calls.push({action,data});if(action==='node-app-service-update')return new Promise(resolve=>finish=resolve);return review;};
 const view=await fixture({plan,security,connected:true,api,onBusy:value=>busy.push(value)});view.nodes();await button(view,'기존 서비스 설정 변경').props.onClick();
 const commit=button(view,'서비스 설정 변경 확인').props.onClick,first=commit(),duplicate=commit();assert.equal(calls.filter(call=>call.action==='node-app-service-update').length,1);
 const payload=calls.at(-1).data;assert.equal(payload.id,plan.id);assert.equal(payload.unitVersion,review.unitVersion);assert.equal(payload.confirm,true);
 finish({changed:true});await Promise.all([first,duplicate]);assert(view.nodes().some(node=>node.props?.role==='status'));assert.equal(busy.at(-1),false);view.dispose();
});
for(const change of ['api','plan','policy','disabled','unmount'])test('Node update invalidates old action handlers after '+change,async()=>{
 const calls=[],api=async(action,data)=>{calls.push({action,data});return review;},view=await fixture({plan,security,connected:true,api});view.nodes();await button(view,'기존 서비스 설정 변경').props.onClick();
 const lookup=button(view,'기존 서비스 설정 변경').props.onClick,commit=button(view,'서비스 설정 변경 확인').props.onClick;
 if(change==='api')view.props.api=(...args)=>api(...args);if(change==='plan')view.props.plan={...plan,id:'other'};if(change==='policy')view.props.security={...security,version:'next'};if(change==='disabled')view.props.disabled=true;
 if(change==='unmount')view.dispose();else{const nodes=view.nodes();if(change!=='disabled')assert(!nodes.some(node=>node.props?.role==='alertdialog'));}
 const count=calls.length;await lookup();await commit();assert.equal(calls.length,count);view.dispose();
});
test('Node update ignores previous connection response and accepts a fresh review',async()=>{
 let finish;const view=await fixture({plan,security,connected:true,api:()=>new Promise(resolve=>finish=resolve)});view.nodes();const pending=button(view,'기존 서비스 설정 변경').props.onClick();view.props.api=async action=>{return review;};view.nodes();finish(review);await pending;
 assert(!view.nodes().some(node=>node.props?.role==='alertdialog'));await button(view,'기존 서비스 설정 변경').props.onClick();assert(button(view,'서비스 설정 변경 확인'));view.dispose();
});

test('Node update discards pending completion after connection replacement',async()=>{
 let finish;const api=async name=>{if(name==='node-app-service-update')return new Promise(resolve=>finish=resolve);return review;};const view=await fixture({plan,security,connected:true,api});view.nodes();await button(view,'기존 서비스 설정 변경').props.onClick();
 const pending=button(view,'서비스 설정 변경 확인').props.onClick();view.props.api=(...args)=>api(...args);view.nodes();finish({changed:true});await pending;assert(!view.nodes().some(node=>node.props?.role==='status'));view.dispose();
});
test('Node update flags failed mutation with original rollback as an alert',async()=>{
 const api=async name=>{if(name==='node-app-service-update')return {changed:false,failed:true,restored:true,recovered:true};return review;};const view=await fixture({plan,security,connected:true,api});view.nodes();await button(view,'기존 서비스 설정 변경').props.onClick();
 await button(view,'서비스 설정 변경 확인').props.onClick();assert(view.nodes().some(node=>node.props?.role==='alert'&&JSON.stringify(node.props.children).includes('설정 변경 실패: 이전 설정으로 복구했습니다.')));view.dispose();
});


test('completed explicit recovery hides an earlier unknown update error and invalidates saved approvals',async()=>{
 const calls=[],api=async action=>{calls.push(action);if(action==='node-app-service-update')throw Error('관리 작업 실행이 중단되어 적용 결과를 확인할 수 없습니다.');return review;};
 const view=await fixture({plan,security,connected:true,api,recoveryVersion:0});view.nodes();await button(view,'기존 서비스 설정 변경').props.onClick();const old=button(view,'서비스 설정 변경 확인').props.onClick;await old();assert(view.nodes().some(node=>node.props?.role==='alert'));
 view.props.recoveryVersion=1;assert(!view.nodes().some(node=>node.props?.role==='alert'));const count=calls.length;await old();assert.equal(calls.length,count);await button(view,'기존 서비스 설정 변경').props.onClick();assert(button(view,'서비스 설정 변경 확인'));view.dispose();
});

 test('Node update cancelled confirmation cannot replay or authorize a newer review',async()=>{
  let writes=0;const api=async action=>{if(action==='node-app-service-update'){writes++;return {changed:true};}return action.startsWith('node-app-service-backups')?{id:plan.id,registryVersion:plan.registryVersion,backups:[{id:review.backupId}],warnings:0,truncated:false}:review;};
  const view=await fixture({plan,security,connected:true,api});view.nodes();
  async function prepare(){await button(view,'기존 서비스 설정 변경').props.onClick();}
  await prepare();const stale=button(view,'서비스 설정 변경 확인').props.onClick;
  button(view,'취소').props.onClick();await stale();assert.equal(writes,0);
  await prepare();const fresh=button(view,'서비스 설정 변경 확인').props.onClick;
  await stale();assert.equal(writes,0);await fresh();assert.equal(writes,1);await fresh();assert.equal(writes,1);view.dispose();
 });
