import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
async function fixture(api){
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/mariadb-backups.tsx',import.meta.url),'utf8'),{filename:'mariadb-backups.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],effects=[],queue=[];let si=0,ri=0,ei=0;
 const hooks={useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return[states[i],v=>states[i]=typeof v==='function'?v(states[i]):v];},useRef:initial=>refs[ri]??(refs[ri++]={current:initial}),useEffect:(fn,deps)=>{const i=ei++;if(!effects[i]||deps.some((x,k)=>x!==effects[i].deps[k]))queue.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,cleanup:fn()};});}};
 // Always advance the ref cursor, including existing refs.
 hooks.useRef=initial=>{const i=ri++;return refs[i]??(refs[i]={current:initial});};
 const native=createRequire(import.meta.url),module={exports:{}};new Function('require','module','exports',compiled.code)(name=>name==='./console-types'?consoleTypes:name==='./ui/toast-provider'?toastTestModuleWithReact(hooks):name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:x=>x})}:name==='./ui/controls'?{Button:'Button',Dropdown:'Dropdown'}:native(name),module,module.exports);
 const busy=[],props={api,connected:true,disabled:false,onBusy:v=>busy.push(v),security:{settings:{readOnly:false,databaseChanges:true,sudoWithoutPrompt:true},available:{databaseChanges:true},privilege:{ready:true}}};
 const flush=()=>{while(queue.length)queue.shift()();};function render(run=true){si=ri=ei=0;const tree=module.exports.default(props);if(run)flush();return tree;}
 function find(node,label){if(!node||typeof node!=='object')return;if(node.props?.children===label||node.props?.['aria-label']===label)return node;for(const child of [node.props?.children].flat(Infinity)){const found=find(child,label);if(found)return found;}}
 render();return {states,props,busy,render,flush,find,button:label=>find(render(),label),dispose:()=>effects.forEach(e=>e?.cleanup?.())};
}
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};

const catalog={backups:[{id:'fixture',target:'/etc/mysql/conf.d/server.cnf',bytes:10}],warnings:0};
const reviewed={id:'fixture',root:'/etc/mysql/my.cnf',target:'/etc/mysql/conf.d/server.cnf',version:'v1',graphVersion:'g1',backupVersion:'b1',fields:[],warnings:[],changed:true};
async function ready(f){await f.button('MariaDB 백업 조회').props.onClick();await f.button('복원 검토').props.onClick();f.button('백업으로 복원').props.onClick();return f.button('복원 및 재시작');}
test('MariaDB old restore review and retained handler are rejected before connection or policy effects',async()=>{
 for(const change of [f=>f.props.api=async()=>({}),f=>f.props.connected=false,f=>f.props.security.settings.readOnly=true]){
  const calls=[];const f=await fixture(async action=>{calls.push(action);return action==='mariadb-backups'?catalog:reviewed;});try{
   const old=await ready(f);change(f);const tree=f.render(false);assert.equal(f.find(tree,'MariaDB 복원 및 재시작 확인'),undefined);await old.props.onClick();assert.equal(calls.filter(x=>x==='mariadb-restore').length,0);
  }finally{f.dispose();}
 }
});
test('MariaDB restore single flight survives parent disabled updates and discards old connection results',async()=>{
 for(const replaced of [false,true]){const d=deferred(),calls=[],refreshed=[];const f=await fixture(action=>{calls.push(action);return action==='mariadb-backups'?Promise.resolve(catalog):action.startsWith('mariadb-restore-plan')?Promise.resolve(reviewed):d.promise;});try{
  f.props.onRestored=(...args)=>refreshed.push(args);const button=await ready(f);const request=button.props.onClick();await button.props.onClick();assert.equal(calls.filter(x=>x==='mariadb-restore').length,1);f.props.disabled=true;if(replaced)f.props.api=async()=>({});f.render(false);d.resolve({backupId:'fixture',version:'applied'});await request;assert.equal(refreshed.length,replaced?0:1);assert.deepEqual(f.busy,[true,false]);assert.equal(f.states[2],false);if(replaced)assert.equal(f.states[3],null);else assert.equal(f.states[3].version,'applied');
 }finally{f.dispose();}}
});
test('MariaDB old catalog response and errors cannot populate a replacement connection',async()=>{
 for(const rejected of [false,true]){const d=deferred();const f=await fixture(()=>d.promise);try{
  const request=f.button('MariaDB 백업 조회').props.onClick();f.props.api=async()=>catalog;f.render(false);if(rejected)d.reject(Error('old connection'));else d.resolve(catalog);await request;assert.equal(f.states[4],null);assert.equal(f.states[6],'');
 }finally{f.dispose();}}
});
test('MariaDB main change preserves catalog but hides old review and refuses retained restore',async()=>{
 const calls=[];const f=await fixture(async action=>{calls.push(action);return action==='mariadb-backups'?catalog:reviewed;});try{
  const old=await ready(f),tree=f.render();const dropdown=(function walk(node){if(!node||typeof node!=='object')return;if(node.type==='Dropdown')return node;for(const c of [node.props?.children].flat(Infinity)){const r=walk(c);if(r)return r;}})(tree);dropdown.props.onChange({target:{value:'/etc/mysql/mariadb.cnf'}});const next=f.render(false);assert.equal(f.find(next,'MariaDB 복원 및 재시작 확인'),undefined);assert(f.find(next,'복원 검토'));await old.props.onClick();assert.equal(calls.filter(x=>x==='mariadb-restore').length,0);
 }finally{f.dispose();}
});

test('MariaDB consumed confirmation cannot be reused after completing restoration',async()=>{
 let restores=0;const f=await fixture(async action=>action==='mariadb-backups'?catalog:action.startsWith('mariadb-restore-plan')?reviewed:(restores++,{backupId:'fixture'}));try{const old=await ready(f);await old.props.onClick();await old.props.onClick();assert.equal(restores,1);}finally{f.dispose();}
});
