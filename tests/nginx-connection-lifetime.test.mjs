import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
async function fixture(name){
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/'+name+'.tsx',import.meta.url),'utf8'),{filename:name+'.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],effects=[],pending=[];let si=0,ri=0,ei=0;
 const hooks={...React,useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return [states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},useRef:initial=>{const i=ri++;return refs[i]??(refs[i]={current:initial});},useEffect:(fn,deps)=>{const i=ei++;if(!effects[i]||deps.some((value,k)=>value!==effects[i].deps[k]))pending.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,cleanup:fn()};});}};
 const native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModuleWithReact(hooks):name==='./console-types'?consoleTypes:name==='./ui/confirm-dialog'?{__esModule:true,default:'confirm-dialog'}:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button:'button',Dropdown:'select',Checkbox:'input',Badge:'span'}:name==='./nginx-icon'?{__esModule:true,default:'svg'}:name==='./nginx-recovery-panel'||name==='./nginx-backups-panel'||name==='./nginx-apply-panel'?{default:'section'}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const render=props=>{si=ri=ei=0;const tree=module.exports.default(props);while(pending.length)pending.shift()();return tree;};
 const find=(node,predicate)=>{if(!node||typeof node!=='object')return null;if(predicate(node))return node;let found;React.Children.forEach(toastTestChildren(node),child=>found??=find(child,predicate));return found;};
 return {render,find,states,cleanup:()=>effects.forEach(effect=>effect?.cleanup?.())};
}
test('expanded nginx backup catalog switches connections while the old lookup remains pending',async()=>{
 const f=await fixture('nginx-backups-panel');let oldResolve,newResolve,newCalls=0;
 let props={connected:true,allowed:true,expanded:true,api:()=>new Promise(resolve=>oldResolve=resolve)};f.render(props);
 props={...props,api:()=>{newCalls++;return new Promise(resolve=>newResolve=resolve);}};f.render(props);
 assert.equal(newCalls,1,'new connection must not wait for old request');
 oldResolve({backups:[{id:'old'}]});await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(f.states[0],[]);assert.equal(f.states[3],true,'old finally must not unlock the new request');
 newResolve({backups:[{id:'new',target:'/etc/nginx/nginx.conf'}]});await new Promise(resolve=>setImmediate(resolve));assert.equal(f.states[0][0].id,'new');assert.equal(f.states[3],false);f.cleanup();
});
test('nginx header discards old modal output and permits checks on a new connection',async()=>{
 const f=await fixture('nginx-toolbar');let oldResolve,newResolve;
 const security={settings:{readOnly:false,nginxChanges:true,sudoWithoutPrompt:true},available:{}};
 let props={connected:true,security,api:action=>action==='operations?unit=nginx.service'?Promise.resolve({services:[]}):new Promise(resolve=>oldResolve=resolve)};
 const button=tree=>f.find(tree,node=>node.props?.['aria-label']==='검수');button(f.render(props)).props.onClick();
 props={...props,api:action=>action==='operations?unit=nginx.service'?Promise.resolve({services:[]}):new Promise(resolve=>newResolve=resolve)};f.render(props);assert.equal(f.states[0],null);
 button(f.render(props)).props.onClick();assert.equal(typeof newResolve,'function');
 oldResolve({logs:'old server output'});await new Promise(resolve=>setImmediate(resolve));assert.equal(f.states[3],'$ nginx -t\n');assert.equal(f.states[2],true);
 newResolve({logs:'new server output'});await new Promise(resolve=>setImmediate(resolve));assert.match(f.states[3],/new server output/);assert.equal(f.states[2],false);f.cleanup();
});

test('nginx backup does not execute after its connection changes during digest calculation',async()=>{
 const f=await fixture('nginx-toolbar');let backupCalls=0,deliverDigest;
 let props={connected:true,security:{settings:{readOnly:false,nginxChanges:true,sudoWithoutPrompt:true},available:{}},files:[{path:'/etc/nginx/nginx.conf',name:'nginx.conf',source:'events {}'}],api:async action=>{if(action==='nginx-config-backup')backupCalls++;return {services:[]};}};
 const original=Object.getOwnPropertyDescriptor(globalThis,'crypto');
 try{
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{subtle:{digest:()=>new Promise(resolve=>deliverDigest=resolve)}}});
  f.find(f.render(props),node=>node.props?.['aria-label']==='백업').props.onClick();
  f.find(f.render(props),node=>node.props?.label==='설정 파일').props.onChange({target:{value:'/etc/nginx/nginx.conf'}});
  const pending=f.find(f.render(props),node=>node.type==='button'&&node.props.children==='백업').props.onClick();
  assert.equal(typeof deliverDigest,'function');
  props={...props,api:async()=>({services:[]})};f.render(props);
  deliverDigest(new Uint8Array(32).buffer);await pending;
  assert.equal(backupCalls,0,'invalidated backup must not invoke the previous API');
 }finally{if(original)Object.defineProperty(globalThis,'crypto',original);else delete globalThis.crypto;f.cleanup();}
});

test('configuration context lookup uses only the current connection and keeps its pending state',async()=>{
 const f=await fixture('nginx-context-panel');let oldResolve,newResolve;
 let props={connected:true,api:()=>new Promise(resolve=>oldResolve=resolve)};
 const lookup=tree=>f.find(tree,node=>node.type==='button'&&node.props.children==='설정 조회');
 const old=lookup(f.render(props)).props.onClick();
 props={...props,api:()=>new Promise(resolve=>newResolve=resolve)};f.render(props);
 const current=lookup(f.render(props)).props.onClick();assert.equal(typeof newResolve,'function');
 oldResolve({service:{pid:11},graph:{}});await old;
 assert.equal(f.states[0],null);assert.equal(f.states[1],true);
 newResolve({service:{pid:22,ready:true},graph:{complete:true,files:[],warnings:[],version:'current'}});await current;
 assert.equal(f.states[0].service.pid,22);assert.equal(f.states[1],false);
 props={...props,api:async()=>({})};f.render(props);assert.equal(f.states[0],null,'previous server PID must not remain visible');f.cleanup();
});

test('nginx service connection change cancels review and isolates late service responses',async()=>{
 const f=await fixture('nginx-toolbar');const calls=[];let oldResolve,newResolve;
 const security={version:'v1',settings:{readOnly:false,serviceChanges:true,sudoWithoutPrompt:true},available:{}};
 const oldApi=action=>action==='operations?unit=nginx.service'?Promise.resolve({services:[]}):new Promise(resolve=>{calls.push('old');oldResolve=resolve;});
 const newApi=action=>action==='operations?unit=nginx.service'?Promise.resolve({services:[]}):new Promise(resolve=>{calls.push('new');newResolve=resolve;});
 let props={connected:true,security,api:oldApi};const start=()=>f.find(f.render(props),node=>node.props?.['aria-label']==='시작').props.onClick();const dialog=()=>f.find(f.render(props),node=>node.type==='confirm-dialog');
 try{
  f.render(props);start();const oldReview=dialog();assert(oldReview.props.request);props={...props,api:newApi};f.render(props);assert.equal(dialog().props.request,null);await oldReview.props.onConfirm();assert.deepEqual(calls,[]);
  props={...props,api:oldApi};f.render(props);start();const oldRun=dialog().props.onConfirm();assert.deepEqual(calls,['old']);
  props={...props,api:newApi};f.render(props);start();const newRun=dialog().props.onConfirm();assert.deepEqual(calls,['old','new']);
  oldResolve({services:[{unit:'nginx.service',ActiveState:'failed'}],logs:'old failure'});await oldRun;assert.equal(f.states[2],true);assert.notEqual(f.states[1]?.ActiveState,'failed');assert(!f.states[3].includes('old failure'));
  newResolve({services:[{unit:'nginx.service',ActiveState:'active'}],logs:'new success'});await newRun;assert.equal(f.states[1].ActiveState,'active');assert.equal(f.states[2],false);assert.match(f.states[3],/new success/);
 }finally{f.cleanup();}
});
