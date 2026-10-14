import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture(props){await loadBindings();const compiled=await transform(await readFile(new URL('../components/mariadb-recovery.tsx',import.meta.url),'utf8'),{filename:'mariadb-recovery.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});const states=[],refs=[],effects=[];let stateIndex=0,refIndex=0,effectIndex=0,pending=[];const Button=()=>null,native=createRequire(import.meta.url),module={exports:{}};
 const hooks={...React,useState:init=>{const at=stateIndex++;if(!(at in states))states[at]=init;return[states[at],next=>states[at]=typeof next==='function'?next(states[at]):next];},useRef:init=>refs[refIndex++]??(refs[refIndex-1]={current:init}),useEffect:(fn,deps)=>{const at=effectIndex++,old=effects[at];if(!old||deps.some((value,index)=>!Object.is(value,old.deps[index])))pending.push(()=>{old?.cleanup?.();effects[at]={deps,fn,cleanup:fn()};});}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button,Dropdown:'Dropdown',TextInput:'TextInput'}:name==='../lib/capabilities.ts'?{featureAllowed:(policy,key)=>Boolean(policy&&!policy.settings.readOnly&&policy.settings[key])}:native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);
 function render(){stateIndex=refIndex=effectIndex=0;const tree=module.exports.default(props);const queued=pending;pending=[];queued.forEach(fn=>fn());return tree;}
 function nodes(){const all=[];function visit(node){if(!node||typeof node!=='object')return;all.push(node);React.Children.forEach(toastTestChildren(node),visit);}visit(render());return all;}
 return {props,Button,render,nodes,replay:()=>effects.forEach(effect=>{effect.cleanup?.();effect.cleanup=effect.fn();}),dispose:()=>effects.forEach(effect=>effect.cleanup?.())};}



const root='/etc/mysql/my.cnf',target='/etc/mysql/mariadb.conf.d/50-server.cnf',security={settings:{readOnly:false,databaseChanges:true,sudoWithoutPrompt:true},available:{databaseChanges:true},privilege:{ready:true}},review={root,target,recoveryRequired:true,reviewVersion:'a'.repeat(64),backupId:'fixture',currentFiles:[{path:target,version:'b'.repeat(64)}],originalFiles:[{path:target,version:'c'.repeat(64)}],service:{pid:123,main:root,notice:'fixture scope'}};
const button=(view,label)=>view.nodes().find(node=>node.type===view.Button&&node.props.children===label);
test('MariaDB recovery GUI requires final restart confirmation and submits one reviewed fixed-target request',async()=>{const calls=[];let finish;const view=await fixture({security,connected:true,api:async(action,data)=>{calls.push({action,data});return action.startsWith('mariadb-recovery-plan')?review:new Promise(resolve=>finish=resolve);}});view.render();assert.equal(calls.length,0);await button(view,'중단 작업 조회').props.onClick();assert(!button(view,'MariaDB 중단 복구 확인'));button(view,'중단 작업 복구').props.onClick();assert(view.nodes().some(node=>node.props?.role==='alertdialog'));const commit=button(view,'MariaDB 중단 복구 확인'),first=commit.props.onClick(),second=commit.props.onClick();assert.equal(calls.length,2);assert.deepEqual(calls[1].data,{root,target,reviewVersion:review.reviewVersion,confirm:true});finish({recovered:true});await Promise.all([first,second]);assert(view.nodes().some(node=>node.props?.role==='status'));view.dispose();});
test('MariaDB recovery GUI discards old target responses and disables restoration in read-only mode',async()=>{let finish;const view=await fixture({security,connected:true,api:()=>new Promise(resolve=>finish=resolve)});view.render();const pending=button(view,'중단 작업 조회').props.onClick();view.nodes().find(node=>node.type==='TextInput').props.onChange({target:{value:'/etc/mysql/conf.d/other.cnf'}});view.render();finish(review);await pending;assert(!button(view,'중단 작업 복구'));view.nodes().find(node=>node.type==='TextInput').props.onChange({target:{value:target}});view.props.security={...security,settings:{...security.settings,readOnly:true}};view.render();const current=button(view,'중단 작업 조회').props.onClick();finish(review);await current;assert(button(view,'중단 작업 복구').props.disabled);view.dispose();});

test('previous connection recovery handlers cannot submit after API, policy, disabled or unmount change',async()=>{
 for(const change of ['api','policy','disabled','unmount']){
  const calls=[],api=async(action,data)=>{calls.push({action,data});return review;},view=await fixture({security,connected:true,api});view.render();
  const lookup=button(view,'중단 작업 조회').props.onClick;await lookup();const open=button(view,'중단 작업 복구').props.onClick;open();
  const commit=button(view,'MariaDB 중단 복구 확인').props.onClick;
  if(change==='api')view.props.api=(...args)=>api(...args);
  if(change==='policy')view.props.security={...security,version:'new-policy'};
  if(change==='disabled')view.props.disabled=true;
  if(change==='unmount')view.dispose();else{const nodes=view.nodes();if(change!=='disabled')assert(!nodes.some(node=>node.props?.role==='alertdialog'),'old confirmation hidden on first render');}
  const before=calls.length;open();await lookup();await commit();assert.equal(calls.length,before,'no stale transport after '+change);view.dispose();
 }
});
test('response from a previous API does not unlock recovery on the new connection',async()=>{
 let finish;const api=()=>new Promise(resolve=>finish=resolve),view=await fixture({security,connected:true,api});view.render();
 const request=button(view,'중단 작업 조회').props.onClick;const pending=request();view.props.api=async()=>review;view.nodes();finish(review);await pending;
 assert(!button(view,'중단 작업 복구'));await button(view,'중단 작업 조회').props.onClick();assert(button(view,'중단 작업 복구'));view.dispose();
});

test('StrictMode recovery lookup finishes and incomplete recovery remains an alert',async()=>{
 const api=async action=>action.includes('recovery-plan')?review:{recovered:false,restored:true},view=await fixture({security,connected:true,api});view.render();
 view.replay();await button(view,'중단 작업 조회').props.onClick();assert.equal(button(view,'중단 작업 조회').props.disabled,false);
 button(view,'중단 작업 복구').props.onClick();await button(view,'MariaDB 중단 복구 확인').props.onClick();
 assert(view.nodes().some(node=>node.props?.role==='alert'&&String(node.props.children).includes('원본은 복원했지만')));view.dispose();
});


test('MariaDB successful recovery passes the exact result to parent and retains refresh failure',async()=>{
 const output={recovered:true,backupId:'restored-fixture'},seen=[];
 const view=await fixture({connected:true,security,api:async action=>action.includes('recovery-plan')?review:output,onRecovered:async value=>{seen.push(value);throw Error('refresh failed');}});view.render();await button(view,'중단 작업 조회').props.onClick();button(view,'중단 작업 복구').props.onClick();await button(view,'MariaDB 중단 복구 확인').props.onClick();assert.deepEqual(seen,[output]);assert(JSON.stringify(view.nodes()).includes('복구는 완료되었지만 목록 갱신에 실패했습니다.'));assert(JSON.stringify(view.nodes()).includes('원본 설정 복원 및 서비스 복구 완료'));view.dispose();
});

 test('MariaDB inline recovery starts at the selected main and target',async()=>{
  const calls=[],selectedRoot='/etc/mysql/mariadb.cnf',selectedTarget='/etc/mysql/conf.d/app.cnf';
  const view=await fixture({connected:true,security,initialRoot:selectedRoot,initialTarget:selectedTarget,api:async action=>{calls.push(action);return {...review,root:selectedRoot,target:selectedTarget};}});view.render();await button(view,'중단 작업 조회').props.onClick();assert.equal(calls[0],'mariadb-recovery-plan?root='+encodeURIComponent(selectedRoot)+'&target='+encodeURIComponent(selectedTarget));view.dispose();
 });
