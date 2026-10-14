import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture(props){await loadBindings();const compiled=await transform(await readFile(new URL('../components/nginx-recovery-panel.tsx',import.meta.url),'utf8'),{filename:'nginx-recovery-panel.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});const states=[],refs=[],effects=[];let stateIndex=0,refIndex=0,effectIndex=0,pending=[];const Button=()=>null,native=createRequire(import.meta.url),module={exports:{}};
 const hooks={...React,useState:init=>{const at=stateIndex++;if(!(at in states))states[at]=init;return[states[at],next=>states[at]=typeof next==='function'?next(states[at]):next];},useRef:init=>refs[refIndex++]??(refs[refIndex-1]={current:init}),useEffect:(fn,deps)=>{const at=effectIndex++,old=effects[at];if(!old||deps.some((value,index)=>!Object.is(value,old.deps[index])))pending.push(()=>{old?.cleanup?.();effects[at]={deps,fn,cleanup:fn()};});}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button,Dropdown:'Dropdown',TextInput:'TextInput'}:name==='../lib/capabilities.ts'?{featureAllowed:(policy,key)=>Boolean(policy&&!policy.settings.readOnly&&policy.settings[key])}:native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);
 function render(){stateIndex=refIndex=effectIndex=0;const tree=module.exports.default(props);const queued=pending;pending=[];queued.forEach(fn=>fn());return tree;}
 function nodes(){const all=[];function visit(node){if(!node||typeof node!=='object')return;all.push(node);React.Children.forEach(toastTestChildren(node),visit);}visit(render());return all;}
 return {props,Button,render,nodes,replay:()=>effects.forEach(effect=>{effect.cleanup?.();effect.cleanup=effect.fn();}),dispose:()=>effects.forEach(effect=>effect.cleanup?.())};}


const path='/etc/nginx/nginx.conf',other='/etc/nginx/conf.d/site.conf',security={settings:{readOnly:false,nginxChanges:true,sudoWithoutPrompt:true},available:{nginxChanges:true},privilege:{ready:true}},review={path,recoveryRequired:true,reviewVersion:'a'.repeat(64),backupId:'fixture',currentFiles:[{path,version:'b'.repeat(64)}],originalFiles:[{path,version:'c'.repeat(64)}],service:{pid:123,main:path,locale:{LC_ALL:'C'}}};
const button=(view,label)=>view.nodes().find(node=>node.type===view.Button&&node.props.children===label),choose=(view,path)=>{view.nodes().find(node=>node.type==='Dropdown').props.onChange({target:{value:path}});view.render();};
test('nginx recovery GUI selects target, attests locale and locks duplicate confirmed reloads',async()=>{const calls=[];let finish,reloads=0;const view=await fixture({files:[{path},{path:other}],security,connected:true,onRecovered:async()=>reloads++,api:async(action,data)=>{calls.push({action,data});return action.startsWith('nginx-recovery-plan')?review:new Promise(resolve=>finish=resolve);}});view.render();assert.equal(calls.length,0);assert(button(view,'중단 작업 조회').props.disabled);choose(view,path);await button(view,'중단 작업 조회').props.onClick();assert.equal(calls[0].action,'nginx-recovery-plan?path='+encodeURIComponent(path));button(view,'중단 작업 복구').props.onClick();assert(view.nodes().some(node=>node.props?.role==='alertdialog'));view.nodes().find(node=>node.type==='TextInput'&&node.props.label==='LC_ALL').props.onChange({target:{value:'C.UTF-8'}});assert(!view.nodes().some(node=>node.props?.role==='alertdialog'));button(view,'중단 작업 복구').props.onClick();const commit=button(view,'nginx 중단 복구 확인'),first=commit.props.onClick(),second=commit.props.onClick();assert.equal(calls.length,2);assert.deepEqual(calls[1].data,{path,reviewVersion:review.reviewVersion,locale:{LC_ALL:'C.UTF-8'},confirm:true});finish({recovered:true});await Promise.all([first,second]);assert.equal(reloads,1);assert(view.nodes().some(node=>node.props?.role==='status'));view.dispose();});
test('nginx recovery GUI discards stale target reviews and disables recovery in read-only mode',async()=>{let finish;const view=await fixture({files:[{path},{path:other}],security,connected:true,api:()=>new Promise(resolve=>finish=resolve)});view.render();choose(view,path);const stale=button(view,'중단 작업 조회').props.onClick();choose(view,other);finish(review);await stale;assert(!button(view,'중단 작업 복구'));choose(view,path);view.props.security={...security,settings:{...security.settings,readOnly:true}};view.render();const current=button(view,'중단 작업 조회').props.onClick();finish(review);await current;assert(button(view,'중단 작업 복구').props.disabled);view.dispose();});
test('nginx recovery GUI preserves confirmed recovery result if tree refresh fails',async()=>{const view=await fixture({files:[{path}],security,connected:true,api:async action=>action.startsWith('nginx-recovery-plan')?review:{recovered:true},onRecovered:async()=>{throw Error('fixture refresh failed');}});view.render();choose(view,path);await button(view,'중단 작업 조회').props.onClick();button(view,'중단 작업 복구').props.onClick();await button(view,'nginx 중단 복구 확인').props.onClick();const nodes=view.nodes();assert(nodes.some(node=>node.props?.role==='status'));assert(nodes.some(node=>node.props?.role==='alert'&&node.props.children==='복구는 완료되었지만 트리 갱신에 실패했습니다.'));view.dispose();});

test('previous connection recovery handlers cannot submit after API, policy, disabled or unmount change',async()=>{
 for(const change of ['api','policy','disabled','unmount']){
  const calls=[],api=async(action,data)=>{calls.push({action,data});return review;},view=await fixture({files:[{path},{path:other}],security,connected:true,api});view.render();choose(view,path);
  const lookup=button(view,'중단 작업 조회').props.onClick;await lookup();const open=button(view,'중단 작업 복구').props.onClick;open();
  const commit=button(view,'nginx 중단 복구 확인').props.onClick;
  if(change==='api')view.props.api=(...args)=>api(...args);
  if(change==='policy')view.props.security={...security,version:'new-policy'};
  if(change==='disabled')view.props.disabled=true;
  if(change==='unmount')view.dispose();else{const nodes=view.nodes();if(change!=='disabled')assert(!nodes.some(node=>node.props?.role==='alertdialog'),'old confirmation hidden on first render');}
  const before=calls.length;open();await lookup();await commit();assert.equal(calls.length,before,'no stale transport after '+change);view.dispose();
 }
});
test('response from a previous API does not unlock recovery on the new connection',async()=>{
 let finish;const api=()=>new Promise(resolve=>finish=resolve),view=await fixture({files:[{path},{path:other}],security,connected:true,api});view.render();choose(view,path);
 const request=button(view,'중단 작업 조회').props.onClick;const pending=request();view.props.api=async()=>review;view.nodes();finish(review);await pending;
 assert(!button(view,'중단 작업 복구'));await button(view,'중단 작업 조회').props.onClick();assert(button(view,'중단 작업 복구'));view.dispose();
});

test('StrictMode recovery lookup finishes and incomplete recovery remains an alert',async()=>{
 const api=async action=>action.includes('recovery-plan')?review:{recovered:false,restored:true},view=await fixture({files:[{path},{path:other}],security,connected:true,api});view.render();choose(view,path);
 view.replay();await button(view,'중단 작업 조회').props.onClick();assert.equal(button(view,'중단 작업 조회').props.disabled,false);
 button(view,'중단 작업 복구').props.onClick();await button(view,'nginx 중단 복구 확인').props.onClick();
 assert(view.nodes().some(node=>node.props?.role==='alert'&&String(node.props.children).includes('원본은 복원했지만')));view.dispose();
});
