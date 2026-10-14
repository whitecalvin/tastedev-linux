import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture(props){await loadBindings();const compiled=await transform(await readFile(new URL('../components/node-service-control.tsx',import.meta.url),'utf8'),{filename:'node-service-control.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});const states=[],refs=[],effects=[];let stateIndex=0,refIndex=0,effectIndex=0,pending=[];const Button=()=>null,native=createRequire(import.meta.url),module={exports:{}};
 const hooks={...React,useState:init=>{const at=stateIndex++;if(!(at in states))states[at]=init;return[states[at],next=>states[at]=typeof next==='function'?next(states[at]):next];},useRef:init=>refs[refIndex++]??(refs[refIndex-1]={current:init}),useEffect:(fn,deps)=>{const at=effectIndex++,old=effects[at];if(!old||deps.some((value,index)=>!Object.is(value,old.deps[index])))pending.push(()=>{old?.cleanup?.();effects[at]={deps,cleanup:fn()};});}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button}:name==='../lib/capabilities.ts'?{featureAllowed:(policy,key)=>Boolean(policy&&!policy.settings.readOnly&&policy.settings[key]),featureReason:()=> '권한이 없습니다.'}:native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);
 function render(flush=true){stateIndex=refIndex=effectIndex=0;const tree=module.exports.default(props);const queued=pending;pending=[];if(flush)queued.forEach(fn=>fn());else pending.push(...queued);return tree;}
 function nodes(){const all=[];function visit(node){if(!node||typeof node!=='object')return;all.push(node);React.Children.forEach(toastTestChildren(node),visit);}visit(render());return all;}
 return {props,Button,render,nodes,dispose:()=>effects.forEach(effect=>effect.cleanup?.())};}

const security={settings:{readOnly:false,serviceChanges:true,sudoWithoutPrompt:true},available:{serviceChanges:true},privilege:{ready:true}},plan={id:'fixture',registryVersion:'a'.repeat(64),unit:'tastedev-node-fixture.service',files:[],serviceOptions:{restart:'on-failure'}};
const button=(view,label)=>view.nodes().find(node=>node.type===view.Button&&(node.props.children===label||node.props['aria-label']===label));
test('Node service control retains completion and awaits status refresh while locking duplicate execution',async()=>{
 const output={changed:true,unit:plan.unit,operation:'start'},events=[];let rejectRefresh,calls=0,callbacks=0;
 const view=await fixture({plan,connected:true,security,api:async(action,payload)=>{assert.equal(action,'node-app-service-control');assert.equal(payload.operation,'start');calls++;return output;},onBusy:value=>events.push(value),onCompleted:result=>{assert.equal(result,output);callbacks++;return new Promise((resolve,reject)=>rejectRefresh=reject);}});
 view.render();const start=button(view,'시작');assert.equal(start.props.className,'nginx-icon-button');assert.equal(start.props.title,'시작');assert(start.props.children.type==='svg');start.props.onClick();const commit=button(view,'실행 확인'),pending=commit.props.onClick();await tick();assert.equal(callbacks,1);assert.equal(button(view,'시작').props.disabled,true);await commit.props.onClick();assert.equal(calls,1);
 rejectRefresh(Error('status lookup unavailable'));await pending;const nodes=view.nodes();assert(nodes.some(node=>node.props?.role==='status'));assert(nodes.some(node=>node.props?.role==='alert'));assert.deepEqual(events,[true,false]);view.dispose();
});
test('Node service control ignores late results after API connection replacement',async()=>{
 let finish,callbacks=0;const events=[];
 const view=await fixture({plan,connected:true,security,api:()=>new Promise(resolve=>finish=resolve),onCompleted:()=>callbacks++,onBusy:value=>events.push(value)});view.render();button(view,'중지').props.onClick();const pending=button(view,'실행 확인').props.onClick();view.props.api=async()=>assert.fail('unexpected request');view.render();finish({changed:true,operation:'stop'});await pending;assert.equal(callbacks,0);assert(!view.nodes().some(node=>node.props?.role==='status'));assert.deepEqual(events,[true],'old completion cannot unlock a new context');view.dispose();
});
test('Node service control skips status refresh when the actual operation fails',async()=>{
 let callbacks=0;const view=await fixture({plan,connected:true,security,api:async()=>{throw Error('operation failed');},onCompleted:()=>callbacks++});view.render();button(view,'재시작').props.onClick();await button(view,'실행 확인').props.onClick();assert.equal(callbacks,0);assert(view.nodes().some(node=>node.props?.role==='alert'));assert(!view.nodes().some(node=>node.props?.role==='status'));view.dispose();
});

for(const change of ['api','plan','policy','disabled','stopOnly','unmount'])test('Node control blocks retained confirmation before effects after '+change,async()=>{
 const calls=[],view=await fixture({plan,connected:true,security,api:async(action,data)=>{calls.push({action,data});return {operation:'restart'};}});view.render();button(view,'재시작').props.onClick();const confirm=button(view,'실행 확인').props.onClick;
 if(change==='api')view.props.api=async()=>assert.fail('new connection must not receive old approval');
 if(change==='plan')view.props.plan={...plan,id:'other'};
 if(change==='policy')view.props.security={...security,settings:{...security.settings,readOnly:true}};
 if(change==='disabled')view.props.disabled=true;
 if(change==='stopOnly')view.props.stopOnly=true;
 if(change==='unmount')view.dispose();else view.render(false);
 await confirm();assert.equal(calls.length,0);view.dispose();
});
test('Node control consumes a confirmation so a retained handler cannot replay it',async()=>{
 let calls=0;const view=await fixture({plan,connected:true,security,api:async()=>{calls++;return {operation:'start'};}});view.render();button(view,'시작').props.onClick();const confirm=button(view,'실행 확인').props.onClick;await confirm();await confirm();assert.equal(calls,1);view.dispose();
});

test('Node control cannot reuse cancelled approval for a newly selected same operation',async()=>{
 let calls=0;const view=await fixture({plan,connected:true,security,api:async()=>{calls++;return {operation:'start'};}});view.render();button(view,'시작').props.onClick();const old=button(view,'실행 확인').props.onClick;button(view,'취소').props.onClick();button(view,'시작').props.onClick();const fresh=button(view,'실행 확인').props.onClick;await old();assert.equal(calls,0);await fresh();assert.equal(calls,1);view.dispose();
});
test('Node service start without a reviewed plan never sends an incomplete mutation',async()=>{
 let writes=0;const identity={id:plan.id,unit:plan.unit,registryVersion:plan.registryVersion};const view=await fixture({plan:identity,connected:true,security,api:async()=>{writes++;return {changed:true,operation:'start'};}});
 view.render();button(view,'시작').props.onClick();await button(view,'실행 확인').props.onClick();assert.equal(writes,0);assert(view.nodes().some(node=>node.props?.role==='alert'&&node.props.children==='서비스 설정을 다시 검토하세요.'));view.dispose();
});
test('Node service stop accepts server-owned identity without unavailable runtime or files',async()=>{
 let writes=0;const identity={id:plan.id,unit:plan.unit,registryVersion:plan.registryVersion};const view=await fixture({plan:identity,connected:true,security,stopOnly:true,api:async(action,data)=>{assert.equal(action,'node-app-service-control');assert.equal(data.operation,'stop');assert.equal(data.id,identity.id);assert.equal(data.registryVersion,identity.registryVersion);assert.equal(data.options,undefined);assert.equal(data.files,undefined);writes++;return {changed:true,operation:'stop'};}});
 view.render();button(view,'중지').props.onClick();await button(view,'실행 확인').props.onClick();assert.equal(writes,1);assert(view.nodes().some(node=>node.props?.role==='status'));view.dispose();
});
