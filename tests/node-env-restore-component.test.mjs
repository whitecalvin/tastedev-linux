import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import {requireNodeEnvSaved} from '../lib/node-env-outcome.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture(props){await loadBindings();const compiled=await transform(await readFile(new URL('../components/node-env-backups.tsx',import.meta.url),'utf8'),{filename:'node-env-backups.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});const states=[],refs=[],effects=[];let stateIndex=0,refIndex=0,effectIndex=0,pending=[];const Button=()=>null,native=createRequire(import.meta.url),module={exports:{}};
 const hooks={...React,useState:init=>{const at=stateIndex++;if(!(at in states))states[at]=init;return[states[at],next=>states[at]=typeof next==='function'?next(states[at]):next];},useRef:init=>refs[refIndex++]??(refs[refIndex-1]={current:init}),useEffect:(fn,deps)=>{const at=effectIndex++,old=effects[at];if(!old||deps.some((value,index)=>!Object.is(value,old.deps[index])))pending.push(()=>{old?.cleanup?.();effects[at]={deps,cleanup:fn()};});}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button}:name==='../lib/node-env-outcome.ts'?{requireNodeEnvSaved}:name==='../lib/capabilities.ts'?{featureAllowed:(policy,key)=>Boolean(policy&&!policy.settings.readOnly&&policy.settings[key])}:native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);
 function render(flush=true){stateIndex=refIndex=effectIndex=0;const tree=module.exports.default(props);const queued=pending;pending=[];if(flush)queued.forEach(fn=>fn());else pending.push(...queued);return tree;}
 function nodes(){const all=[];function visit(node){if(!node||typeof node!=='object')return;all.push(node);React.Children.forEach(toastTestChildren(node),visit);}visit(render());return all;}
 return {props,Button,render,nodes,dispose:()=>effects.forEach(effect=>effect.cleanup?.())};}

const security={settings:{readOnly:false,fileEditing:true}},plan={id:'fixture',name:'app.env',version:'a'.repeat(64),backupVersion:'b'.repeat(64),changed:true,fields:[],notice:''},output={saved:true,version:'c'.repeat(64),values:{port:3000},backupId:'fixture'};
const button=(view,label)=>view.nodes().find(node=>node.type===view.Button&&node.props.children===label);
async function prepared(props){const view=await fixture({...props,security,connected:true});view.render();await button(view,'환경 파일 백업 조회').props.onClick();await button(view,'복원 검토').props.onClick();button(view,'환경 파일 복원').props.onClick();return view;}
function apiWith(restore){return async(action,payload)=>action==='node-env-backups'?{backups:[{id:plan.id,name:plan.name,bytes:20}]}:action.startsWith('node-env-restore-plan?')?plan:restore(action,payload);}
test('Node environment restore submits once and awaits refresh without losing success',async()=>{
 let finish,rejectRefresh,calls=0,callbacks=0;
 const view=await prepared({api:apiWith((action,payload)=>{assert.equal(action,'node-env-restore');assert.deepEqual(payload,{id:plan.id,name:plan.name,version:plan.version,backupVersion:plan.backupVersion,confirm:true});calls++;return new Promise(resolve=>finish=resolve);}),onRestored:(result,name)=>{assert.equal(result,output);assert.equal(name,plan.name);callbacks++;return new Promise((resolve,reject)=>rejectRefresh=reject);}});
 const commit=button(view,'복원 실행'),pending=commit.props.onClick();await commit.props.onClick();assert.equal(calls,1);finish(output);await tick();assert.equal(callbacks,1);assert.equal(button(view,'환경 파일 백업 조회').props.disabled,true);
 rejectRefresh(Error('refresh failure'));await pending;const nodes=view.nodes();assert(nodes.some(node=>node.props?.role==='status'));assert(nodes.some(node=>node.props?.role==='alert'&&node.props.children==='설정 적용은 완료되었지만 목록 갱신에 실패했습니다.'));assert.equal(button(view,'환경 파일 백업 조회').props.disabled,false);view.dispose();
});
test('Node environment restore discards the previous connection result',async()=>{
 let finish,callbacks=0;
 const view=await prepared({api:apiWith(()=>new Promise(resolve=>finish=resolve)),onRestored:()=>callbacks++});const pending=button(view,'복원 실행').props.onClick();view.props.api=apiWith(()=>assert.fail('unexpected restore'));view.render();finish(output);await pending;assert.equal(callbacks,0);assert(!view.nodes().some(node=>node.props?.role==='status'));view.dispose();
});
test('Node environment restore preserves failure and never refreshes unsaved output',async()=>{
 let callbacks=0;const view=await prepared({api:apiWith(async()=>({...output,saved:false,failed:true})),onRestored:()=>callbacks++});await button(view,'복원 실행').props.onClick();assert.equal(callbacks,0);assert(view.nodes().some(node=>node.props?.role==='alert'));assert(!view.nodes().some(node=>node.props?.role==='status'));view.dispose();
});
test('Node environment restore rechecks read-only policy at final execution',async()=>{
 let calls=0;const view=await prepared({api:apiWith(async()=>{calls++;return output;})});const commit=button(view,'복원 실행');view.props.security={settings:{readOnly:true,fileEditing:true}};view.render();await button(view,'복원 실행').props.onClick();assert.equal(calls,0);view.dispose();
});

test('Node environment backup connection replacement hides old review before effects and rejects retained actions',async()=>{
 let calls=0;const view=await prepared({api:apiWith(async()=>{calls++;return output;})});
 const oldRefresh=button(view,'환경 파일 백업 조회').props.onClick,oldRestore=button(view,'복원 실행').props.onClick;
 view.props.api=apiWith(async()=>assert.fail('old approval must not reach a new connection'));
 const tree=view.render(false);assert(!JSON.stringify(tree).includes('환경 파일 복원 확인'));
 await oldRefresh();await oldRestore();assert.equal(calls,0);
 view.dispose();
});
test('Node environment backup late query cannot display the old connection data before effects',async()=>{
 let finish;const view=await fixture({connected:true,security,api:()=>new Promise(resolve=>finish=resolve)});view.render();
 const pending=button(view,'환경 파일 백업 조회').props.onClick();
 view.props.api=apiWith(async()=>output);view.render(false);
 finish({backups:[{id:'old-query',name:'old.env'}],warnings:0,truncated:false});await pending;
 assert(!JSON.stringify(view.render(false)).includes('old.env'));view.dispose();
});

test('Node environment backup cancelled approval cannot be reused for a new confirmation',async()=>{
 let calls=0;const view=await prepared({api:apiWith(async()=>{calls++;return output;})});
 const stale=button(view,'복원 실행').props.onClick;
 button(view,'취소').props.onClick();button(view,'환경 파일 복원').props.onClick();
 const fresh=button(view,'복원 실행').props.onClick;
 await stale();assert.equal(calls,0);await fresh();assert.equal(calls,1);await fresh();assert.equal(calls,1);view.dispose();
});
test('Node environment backup unmounted view rejects captured review and restore actions',async()=>{
 let calls=0;const view=await prepared({api:apiWith(async()=>{calls++;return output;})});
 const restore=button(view,'복원 실행').props.onClick,refresh=button(view,'환경 파일 백업 조회').props.onClick;
 view.dispose();await restore();await refresh();assert.equal(calls,0);
});

test('restore rejects an invalid successful response before notifying the editor',async()=>{
 let callbacks=0;const view=await prepared({api:apiWith(async()=>({...output,values:{PORT:'3000'}})),onRestored:()=>callbacks++});await button(view,'복원 실행').props.onClick();assert.equal(callbacks,0);assert(view.nodes().some(node=>node.props?.role==='alert'));assert(!view.nodes().some(node=>node.props?.role==='status'));view.dispose();
});
