import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
async function fixture(props){
 await loadBindings();
 const compiled=await transform(await readFile(new URL('../components/node-app-logs.tsx',import.meta.url),'utf8'),{filename:'node-app-logs.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],effects=[];let stateIndex=0,refIndex=0,effectIndex=0,queued=[];
 const Button=()=>null,Ai=()=>null;
 const hooks={...React,useState:init=>{const i=stateIndex++;if(!(i in states))states[i]=init;return[states[i],next=>states[i]=typeof next==='function'?next(states[i]):next];},useRef:init=>{const i=refIndex++;return refs[i]??(refs[i]={current:init});},useEffect:(fn,deps)=>{const i=effectIndex++,old=effects[i];if(!old||deps.some((value,j)=>!Object.is(value,old.deps[j])))queued.push(()=>{old?.cleanup?.();effects[i]={deps,cleanup:fn()};});}};
 const native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./ui/controls'?{Button}:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ai-log-assistant'?{__esModule:true,default:Ai}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 function render(flush=true){stateIndex=refIndex=effectIndex=0;const tree=module.exports.default(props);if(flush){const jobs=queued;queued=[];jobs.forEach(fn=>fn());}const all=[];function visit(node){if(!node||typeof node!=='object')return;all.push(node);React.Children.forEach(toastTestChildren(node),visit);}visit(tree);return all;}
 return {props,Button,Ai,render,button:()=>render().find(node=>node.type===Button),dispose:()=>effects.forEach(effect=>effect.cleanup?.())};
}
const record={unit:'fixture.service',at:'2026-10-07',notice:'',text:'첫 연결의 오류 로그'};
test('Node app logs query uses the selected app and locks repeated clicks until completion',async()=>{
 let calls=0,finish;const view=await fixture({id:'app name',connected:true,api:action=>{calls++;assert.equal(action,'node-app-logs?id=app%20name');return new Promise(resolve=>finish=resolve);}});
 view.render();const button=view.button();assert.equal(button.props.className,'nginx-icon-button');assert.equal(button.props['aria-label'],'앱 오류 로그 조회');assert.equal(button.props.children.type,'svg');
 const request=button.props.onClick();await button.props.onClick();assert.equal(calls,1);assert.equal(view.button().props.disabled,true);
 finish(record);await request;const ai=view.render().find(node=>node.type===view.Ai);assert.equal(ai.props.text,record.text);assert.equal(ai.props.source,record.unit);assert.equal(view.button().props.disabled,false);view.dispose();
});
test('API replacement hides existing logs and AI input before effects and rejects captured old clicks',async()=>{
 let calls=0;const view=await fixture({id:'app',connected:true,api:async()=>{calls++;return record;}});view.render();const old=view.button();await old.props.onClick();assert(view.render().some(node=>node.type===view.Ai));
 view.props.api=async()=>({...record,text:'새 연결 로그'});const immediate=view.render(false);assert(!immediate.some(node=>node.type===view.Ai||node.type==='pre'));await old.props.onClick();assert.equal(calls,1);
 view.render();await view.button().props.onClick();assert.equal(view.render().find(node=>node.type===view.Ai).props.text,'새 연결 로그');view.dispose();
});
test('late old success cannot replace new logs and late failure cannot unlock a new request',async()=>{
 let rejectOld,finishNew;const view=await fixture({id:'first',connected:true,api:()=>new Promise((resolve,reject)=>rejectOld=reject)});view.render();const old=view.button().props.onClick();
 view.props.id='second';view.props.api=()=>new Promise(resolve=>finishNew=resolve);view.render();const next=view.button().props.onClick();rejectOld(Error('old connection failed'));await old;assert.equal(view.button().props.disabled,true);assert(!view.render().some(node=>node.props?.role==='alert'));
 finishNew({...record,text:'둘째 로그'});await next;assert.equal(view.render().find(node=>node.type===view.Ai).props.text,'둘째 로그');
 let finishOld;view.props.id='third';view.props.api=()=>new Promise(resolve=>finishOld=resolve);view.render();const late=view.button().props.onClick();view.props.connected=false;view.render();finishOld(record);await late;assert(!view.render().some(node=>node.type===view.Ai));view.dispose();
});
test('disabled, disconnected, missing app and unmounted views do not publish logs',async()=>{
 for(const override of [{disabled:true},{connected:false},{id:''}]){let calls=0;const view=await fixture({id:'app',connected:true,api:async()=>{calls++;return record;},...override});view.render();await view.button().props.onClick();assert.equal(calls,0);view.dispose();}
 let finish;const view=await fixture({id:'app',connected:true,api:()=>new Promise(resolve=>finish=resolve)});view.render();const pending=view.button().props.onClick();view.dispose();finish(record);await pending;assert(!view.render().some(node=>node.type===view.Ai));
});
