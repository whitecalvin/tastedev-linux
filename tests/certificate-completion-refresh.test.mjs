import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';

async function fixture(api){
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/server-manager.tsx',import.meta.url),'utf8'),{filename:'server-manager.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],effects=[],callbacks=[],pending=[],timers=new Map();let si=0,ri=0,ei=0,ci=0,nextTimer=0;
 const changed=(a,b)=>!a||a.length!==b.length||a.some((value,i)=>value!==b[i]);
 const hooks={useState:initial=>{const at=si++;if(!(at in states))states[at]=initial;return [states[at],value=>states[at]=typeof value==='function'?value(states[at]):value];},useRef:initial=>{const at=ri++;return refs[at]??(refs[at]={current:initial});},useEffect:(fn,deps)=>{const at=ei++;if(changed(effects[at]?.deps,deps))pending.push(()=>{effects[at]?.cleanup?.();effects[at]={deps,cleanup:fn()};});},useCallback:(fn,deps)=>{const at=ci++;if(changed(callbacks[at]?.deps,deps))callbacks[at]={deps,fn};return callbacks[at].fn;}};
 const native=createRequire(import.meta.url),module={exports:{}},draft={useDraftState:(key,initial)=>hooks.useState(key==='operationsCertJob'?{id:'fixture-job',status:'running',command:['certbot'],logs:[]}:initial)};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./draft-provider'?draft:name==='./language-provider'?{useLanguage:()=>({t:value=>value,locale:'ko'})}:name==='./ui/controls'?Object.fromEntries(['Button','TextInput','Dropdown','Checkbox','Switch','Progress','Badge'].map(key=>[key,key])):name.startsWith('./')&&!name.endsWith('.mjs')?{__esModule:true,default:name}:native(name);
 new Function('require','module','exports','setTimeout','clearTimeout',compiled.code)(require,module,module.exports,fn=>{const id=++nextTimer;timers.set(id,fn);return id;},id=>timers.delete(id));
 const props={api,connected:true,requestedTab:'certbot',security:null};
 const render=()=>{si=ri=ei=ci=0;const tree=module.exports.default(props);while(pending.length)pending.shift()();return tree;};
 const all=tree=>!tree||typeof tree!=='object'?[]:[tree,...React.Children.toArray(toastTestChildren(tree)).flatMap(all)];
 return {props,render,nodes:()=>all(render()),tick:async()=>{const entry=timers.entries().next().value;assert(entry,'scheduled job poll');timers.delete(entry[0]);return entry[1]();},timers,dispose:()=>effects.forEach(effect=>effect.cleanup?.())};
}
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
test('successful certificate status render retains pending inventory refresh, including nginx warnings',async()=>{
 const calls=[],pending=new Map(),view=await fixture(action=>{calls.push(action);return new Promise(resolve=>pending.set(action,resolve));});view.render();view.render();const running=view.tick();
 pending.get('admin-job?id=fixture-job')({job:{id:'fixture-job',status:'success',command:['certbot'],logs:['completed\n']}});await settle();let nodes=view.nodes();assert(JSON.stringify(nodes).includes('인증서 작업이 완료되었습니다.'));assert(calls.includes('certificates'));
 pending.get('certificates')({certificates:[{name:'fresh.example.test',status:'valid'}],warning:''});pending.get('nginx-live')({sites:[{domain:'fresh.example.test',enabled:true}],warning:'nginx fixture warning'});await running;
 nodes=view.nodes();assert(JSON.stringify(nodes).includes('fresh.example.test'));assert(JSON.stringify(nodes).includes('nginx fixture warning'));assert.equal(view.timers.size,0);view.dispose();
});
test('inventory refresh failure preserves successful certificate logs and does not keep polling a completed job',async()=>{
 const calls=[],view=await fixture(async action=>{calls.push(action);if(action.startsWith('admin-job'))return {job:{id:'fixture-job',status:'success',command:['certbot'],logs:['retained log\n']}};throw Error('inventory unavailable');});view.render();view.render();await view.tick();const nodes=view.nodes();assert(JSON.stringify(nodes).includes('인증서 작업이 완료되었습니다.'));assert(JSON.stringify(nodes).includes('retained log'));assert(JSON.stringify(nodes).includes('inventory unavailable'));assert.equal(view.timers.size,0);assert.equal(calls.filter(action=>action.startsWith('admin-job')).length,1);view.dispose();
});
test('old connection completion inventory cannot populate the new connection',async()=>{
 const pending=new Map(),view=await fixture(action=>new Promise(resolve=>pending.set(action,resolve)));view.render();view.render();const running=view.tick();pending.get('admin-job?id=fixture-job')({job:{id:'fixture-job',status:'success',command:['certbot'],logs:[]}});await settle();view.nodes();view.props.connected=false;view.nodes();pending.get('certificates')({certificates:[{name:'stale.example.test',status:'valid'}]});pending.get('nginx-live')({sites:[{domain:'stale.example.test',enabled:true}]});await running;assert(!JSON.stringify(view.nodes()).includes('stale.example.test'));assert.equal(view.timers.size,0);view.dispose();
});
