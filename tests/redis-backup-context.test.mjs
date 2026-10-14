import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
async function fixture(file,api,additional={}){
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/'+file+'.tsx',import.meta.url),'utf8'),{filename:file+'.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],effects=[],queue=[];let si=0,ri=0,ei=0;
 const hooks={useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return[states[i],v=>states[i]=typeof v==='function'?v(states[i]):v];},useRef:initial=>refs[ri]??(refs[ri++]={current:initial}),useEffect:(fn,deps)=>{const i=ei++;if(!effects[i]||deps.some((x,k)=>x!==effects[i].deps[k]))queue.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,cleanup:fn()};});}};
 // Always advance the ref cursor, including existing refs.
 hooks.useRef=initial=>{const i=ri++;return refs[i]??(refs[i]={current:initial});};
 const native=createRequire(import.meta.url),module={exports:{}};new Function('require','module','exports',compiled.code)(name=>name==='./ui/toast-provider'?toastTestModuleWithReact(hooks):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:x=>x})}:name==='./ui/controls'?{Button:'Button',Checkbox:'Checkbox'}:name==='./redis-restore-plan'?{default:'RedisRestorePlan',__esModule:true}:name==='./redis-operation'?{default:'RedisOperation',__esModule:true}:native(name),module,module.exports);
 const busy=[],props={api,connected:true,disabled:false,id:'fixture',onBusy:v=>busy.push(v),security:{settings:{readOnly:false,databaseChanges:true,sudoWithoutPrompt:true},available:{databaseChanges:true},privilege:{ready:true}},...additional};
 const flush=()=>{while(queue.length)queue.shift()();};function render(run=true){si=ri=ei=0;const tree=module.exports.default(props);if(run)flush();return tree;}
 function find(node,label){if(!node||typeof node!=='object')return;if((node.type==='Button'||node.type==='Checkbox')&&(node.props?.children===label||node.props?.label===label))return node; if(node.props?.['aria-label']===label)return node;for(const child of [node.props?.children].flat(Infinity)){const found=find(child,label);if(found)return found;}}
 render();return {states,props,busy,render,flush,find,button:label=>find(render(),label),dispose:()=>effects.forEach(e=>e?.cleanup?.())};
}


const policy={settings:{readOnly:false,databaseChanges:true,sudoWithoutPrompt:true},available:{databaseChanges:true},privilege:{ready:true}};
const plan={id:'fixture',path:'/etc/redis/redis.conf',target:'/etc/redis/redis.conf',changed:true,version:'v1',graphVersion:'g1',backupVersion:'b1',restoreGraphVersion:'r1',fields:[{key:'port',after:6380}],warnings:[]};
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
function button(f,label){function walk(node){if(!node||typeof node!=='object')return;if((node.type==='Button'||node.type==='Checkbox')&&(node.props.children===label||node.props.label===label))return node;for(const child of [node.props?.children].flat(Infinity)){const found=walk(child);if(found)return found;}}return walk(f.render());}
function confirm(f){button(f,'Redis 재시작과 설정 변경 영향을 확인했습니다.').props.onChange({target:{checked:true}});}
test('Redis apply and restore consume confirmation and reject retained handlers after completion',async()=>{
 for(const restore of [false,true]){let calls=0;const f=await fixture('redis-operation',async()=>{calls++;return {changed:true};},{plan,restore});try{confirm(f);const old=button(f,restore?'Redis 설정 복원':'Redis 설정 적용');await old.props.onClick();await old.props.onClick();assert.equal(calls,1);assert.equal(f.states[0],false);}finally{f.dispose();}}
});
test('Redis old confirmed handler cannot submit before API, plan or permission effects',async()=>{
 for(const change of [f=>f.props.api=async()=>({}),f=>f.props.plan={...plan,version:'new'},f=>f.props.connected=false,f=>f.props.security.settings.readOnly=true]){let calls=0;const f=await fixture('redis-operation',async()=>{calls++;return {};},{plan,security:structuredClone(policy)});try{confirm(f);const old=button(f,'Redis 설정 적용');change(f);f.render(false);await old.props.onClick();assert.equal(calls,0);assert.equal(f.find(f.render(false),'Redis 재시작과 설정 변경 영향을 확인했습니다.').props.checked,false);}finally{f.dispose();}}
});
test('Redis old operation responses cannot refresh a replacement connection',async()=>{
 for(const rejected of [false,true]){const d=deferred(),refreshed=[];const f=await fixture('redis-operation',()=>d.promise,{plan,onApplied:(...v)=>refreshed.push(v)});try{confirm(f);const request=button(f,'Redis 설정 적용').props.onClick();f.props.api=async()=>({});f.render(false);if(rejected)d.reject(Error('old'));else d.resolve({version:'updated'});await request;assert.equal(f.states[2],null);assert.equal(f.states[3],'');assert.equal(refreshed.length,0);}finally{f.dispose();}}
});
test('Redis catalog holds one flight across connection effects and discards old responses',async()=>{
 const d=deferred();let calls=0;const f=await fixture('redis-backups',()=>{calls++;return d.promise;});try{const old=button(f,'Redis 백업 조회');const request=old.props.onClick();await old.props.onClick();assert.equal(calls,1);f.props.api=async()=>{calls++;return {backups:[]};};f.render();await button(f,'Redis 백업 조회').props.onClick();assert.equal(calls,1);d.resolve({backups:[{id:'old'}]});await request;assert.equal(f.states[0],null);await button(f,'Redis 백업 조회').props.onClick();assert.equal(calls,2);}finally{f.dispose();}
});
test('Redis restore plan hides previous data before a new selection effect and ignores late result',async()=>{
 const d=deferred();const f=await fixture('redis-restore-plan',()=>d.promise);try{f.props.id='new';const tree=f.render(false);assert.equal(f.find(tree,'설정'),undefined);d.resolve(plan);await Promise.resolve();await Promise.resolve();assert.equal(f.states[0],null);}finally{f.dispose();}
});
