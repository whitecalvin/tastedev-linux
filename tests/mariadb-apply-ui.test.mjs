import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
async function fixture(api){
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/mariadb-apply.tsx',import.meta.url),'utf8'),{filename:'mariadb-apply.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],effects=[],queue=[];let si=0,ri=0,ei=0;
 const hooks={useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return[states[i],v=>states[i]=typeof v==='function'?v(states[i]):v];},useRef:initial=>refs[ri]??(refs[ri++]={current:initial}),useEffect:(fn,deps)=>{const i=ei++;if(!effects[i]||deps.some((x,k)=>x!==effects[i].deps[k]))queue.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,cleanup:fn()};});}};
 // Always advance the ref cursor, including existing refs.
 hooks.useRef=initial=>{const i=ri++;return refs[i]??(refs[i]={current:initial});};
 const native=createRequire(import.meta.url),module={exports:{}};new Function('require','module','exports',compiled.code)(name=>name==='./console-types'?consoleTypes:name==='./ui/toast-provider'?toastTestModuleWithReact(hooks):name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:x=>x})}:name==='./ui/controls'?{Button:'Button'}:native(name),module,module.exports);
 const busy=[],props={api,connected:true,busy:false,onBusy:v=>busy.push(v),security:{settings:{readOnly:false,databaseChanges:true,sudoWithoutPrompt:true},available:{databaseChanges:true},privilege:{ready:true}},plan:{root:'/etc/mysql/my.cnf',path:'/etc/mysql/mariadb.conf.d/50-server.cnf',version:'v1',graphVersion:'g1',fields:[{key:'max_connections',after:120}]}};
 const flush=()=>{while(queue.length)queue.shift()();};function render(run=true){si=ri=ei=0;const tree=module.exports.default(props);if(run)flush();return tree;}
 function find(node,label){if(!node||typeof node!=='object')return;if(node.props?.children===label||node.props?.['aria-label']===label)return node;for(const child of [node.props?.children].flat(Infinity)){const found=find(child,label);if(found)return found;}}
 render();return {states,props,busy,render,flush,find,button:label=>find(render(),label),dispose:()=>effects.forEach(e=>e?.cleanup?.())};
}
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
test('MariaDB apply requires confirmation and submits once even before parent busy rendering',async()=>{
 const d=deferred(),calls=[];const f=await fixture((action,input)=>{calls.push({action,input});return d.promise;});try{
  assert.equal(f.find(f.render(),'적용 및 재시작'),undefined);f.button('MariaDB 설정 적용').props.onClick();const button=f.button('적용 및 재시작');const request=button.props.onClick();await button.props.onClick();assert.equal(calls.length,1);assert.equal(calls[0].action,'mariadb-apply');assert.equal(calls[0].input.confirm,true);assert.deepEqual(calls[0].input.changes,{max_connections:120});d.resolve({backupId:'fixture'});await request;assert.deepEqual(f.busy,[true,false]);assert.equal(f.states[0],false);
 }finally{f.dispose();}
});
test('MariaDB reviewed apply cannot submit after API, plan or permission changes before effects',async()=>{
 for(const change of [f=>f.props.api=async()=>({}),f=>f.props.plan={...f.props.plan,version:'v2'},f=>f.props.connected=false,f=>f.props.security.settings.readOnly=true]){
  const calls=[];const f=await fixture(async(...args)=>{calls.push(args);return {};});try{
   f.button('MariaDB 설정 적용').props.onClick();const old=f.button('적용 및 재시작');change(f);const tree=f.render(false);assert.equal(f.find(tree,'MariaDB 재시작 확인'),undefined);await old.props.onClick();assert.equal(calls.length,0);
  }finally{f.dispose();}
 }
});
test('MariaDB apply discards late result or error after replacing the connection',async()=>{
 for(const failed of [false,true]){const d=deferred();const f=await fixture(()=>d.promise);try{
  f.button('MariaDB 설정 적용').props.onClick();const request=f.button('적용 및 재시작').props.onClick();f.props.api=async()=>({});f.render(false);if(failed)d.reject(Error('old failure'));else d.resolve({backupId:'old'});await request;assert.equal(f.states[1],null);assert.equal(f.states[2],'');assert.deepEqual(f.busy,[true,false]);
 }finally{f.dispose();}}
});
