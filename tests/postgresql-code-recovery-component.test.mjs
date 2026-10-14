import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
async function fixture(props){await loadBindings();const compiled=await transform(await readFile(new URL('../components/postgresql-code-recovery.tsx',import.meta.url),'utf8'),{filename:'postgresql-code-recovery.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});const states=[],refs=[],effects=[],pending=[],Button=()=>null,Checkbox=()=>null,NativeSelect=()=>null,module={exports:{}},native=createRequire(import.meta.url);let si=0,ri=0,ei=0;
 const hooks={...React,useState:initial=>{const at=si++;if(!(at in states))states[at]=initial;return[states[at],value=>states[at]=typeof value==='function'?value(states[at]):value];},useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),useEffect:(fn,deps)=>{const at=ei++;if(!effects[at]||deps.some((value,i)=>value!==effects[at].deps[i]))pending.push(()=>{effects[at]?.cleanup?.();effects[at]={deps,cleanup:fn()};});}};
 new Function('require','module','exports',compiled.code)(name=>name==='./console-types'?consoleTypes:name==='./ui/toast-provider'?toastTestModuleWithReact(hooks):name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button,Checkbox,NativeSelect}:name==='./mariadb-resource-review'?{__esModule:true,default:()=>null}:native(name),module,module.exports);
 const render=()=>{si=ri=ei=0;const tree=module.exports.default(props);while(pending.length)pending.shift()();return tree;};const all=tree=>!tree||typeof tree!=='object'?[]:[tree,...React.Children.toArray(toastTestChildren(tree)).flatMap(all)];const nodes=()=>all(render());return{props,nodes,Button,Checkbox,NativeSelect,dispose:()=>effects.forEach(effect=>effect.cleanup?.())};
}
const path='/etc/postgresql/16/main/postgresql.conf',security={settings:{readOnly:false,databaseChanges:true,sudoWithoutPrompt:true},available:{},privilege:{ready:true}},plan={path,recoveryRequired:true,reviewVersion:'a'.repeat(64),backupId:'d834ae1b-1108-4835-a860-82077d70d4f8',service:{unit:'postgresql@16-main.service',activeState:'failed'}};
test('PostgreSQL recovery GUI reviews selected cluster and confirms once before recovering, with no duplicate request',async()=>{
 const requests=[],recovered=[];let finish;const view=await fixture({initialPath:path,security,connected:true,api:async(action,data)=>{requests.push({action,data});return action==='postgresql-code-recovery-plan'?plan:new Promise(resolve=>finish=resolve);},onRecovered:data=>recovered.push(data)});view.nodes();await view.nodes().find(node=>node.type===view.Button&&node.props.children==='중단 작업 조회').props.onClick();assert.deepEqual(requests[0],{action:'postgresql-code-recovery-plan',data:{path}});view.nodes().find(node=>node.type===view.Button&&node.props.children==='중단 작업 복구').props.onClick();const button=view.nodes().find(node=>node.type===view.Button&&node.props.children==='PostgreSQL 중단 복구 확인');const first=button.props.onClick(),duplicate=button.props.onClick();assert.equal(requests.length,2);assert.deepEqual(requests[1],{action:'postgresql-code-recover',data:{path,reviewVersion:plan.reviewVersion,confirm:true}});finish({recovered:true,restored:true,journalCleanupVerified:true});await Promise.all([first,duplicate]);assert.equal(recovered.length,1);assert(view.nodes().some(node=>node.props?.role==='status'));view.dispose();
});
test('PostgreSQL recovery GUI denies read-only policy and drops response after cluster change or unmount',async()=>{
 const requests=[];let finish;const view=await fixture({initialPath:path,security:{...security,settings:{...security.settings,readOnly:true}},connected:true,api:async action=>{requests.push(action);return new Promise(resolve=>finish=resolve);}});view.nodes();await view.nodes().find(node=>node.type===view.Button&&node.props.children==='중단 작업 조회').props.onClick();assert.equal(requests.length,0);view.props.security=security;view.nodes();const pending=view.nodes().find(node=>node.type===view.Button&&node.props.children==='중단 작업 조회').props.onClick();view.props.initialPath='/etc/postgresql/17/main/postgresql.conf';view.nodes();finish(plan);await pending;assert(!view.nodes().some(node=>node.props?.role==='alertdialog'));assert(!view.nodes().some(node=>node.type===view.Button&&node.props.children==='중단 작업 복구'));const next=view.nodes().find(node=>node.type===view.Button&&node.props.children==='중단 작업 조회').props.onClick();view.dispose();finish(plan);await next;
});
test('PostgreSQL recovery cluster chooser discovers actual main paths on explicit refresh and clears on connection change',async()=>{
 const requests=[],api=async action=>{requests.push(action);return {configs:[{path},{path:'/etc/postgresql/17/other/postgresql.conf'},{path:'/etc/postgresql/16/main/pg_hba.conf'}]};};const view=await fixture({security,connected:true,api});view.nodes();assert.equal(requests.length,0);await view.nodes().find(node=>node.type===view.Button&&node.props.children==='클러스터 목록 조회').props.onClick();let select=view.nodes().find(node=>node.type===view.NativeSelect);assert.deepEqual(select.props.options.map(option=>option.value),['',path,'/etc/postgresql/17/other/postgresql.conf']);select.props.onChange({target:{value:path}});view.nodes();assert.equal(view.nodes().find(node=>node.type===view.Button&&node.props.children==='중단 작업 조회').props.disabled,false);view.props.api=async()=>({configs:[]});view.nodes();select=view.nodes().find(node=>node.type===view.NativeSelect);assert.equal(select.props.value,'');assert.equal(select.props.options.length,1);view.dispose();
});
test('PostgreSQL recovery GUI displays all include-graph file paths from the reviewed request',async()=>{
 const files=[{path},{path:'/etc/postgresql/16/main/conf.d/app.conf'}];
 const view=await fixture({initialPath:path,security,connected:true,api:async()=>({...plan,kind:'postgresql-include-graph',files})});
 view.nodes();await view.nodes().find(node=>node.type===view.Button&&node.props.children==='중단 작업 조회').props.onClick();
 assert.deepEqual(view.nodes().filter(node=>node.type==='code').map(node=>node.props.children),files.map(file=>file.path));view.dispose();
});

test('PostgreSQL preparation GUI confirms cancellation without presenting restart or restored-file claims',async()=>{
 const requests=[],cancelPlan={...plan,kind:'postgresql-stage-cancellation',phase:'ready',serviceRestartRequired:false};
 const view=await fixture({initialPath:path,security,connected:true,api:async(action,data)=>{requests.push({action,data});return action==='postgresql-code-recovery-plan'?cancelPlan:{kind:'postgresql-stage-cancellation',preparationCancelled:true,recovered:true,restored:false,journalCleanupVerified:true};}});
 view.nodes();await view.nodes().find(node=>node.type===view.Button&&node.props.children==='중단 작업 조회').props.onClick();
 view.nodes().find(node=>node.type===view.Button&&node.props.children==='준비 작업 취소').props.onClick();
 assert(!view.nodes().some(node=>node.props?.children==='원본 PostgreSQL 설정을 검수하고 복원한 뒤 클러스터를 재시작합니다. 연결 중인 작업이 중단될 수 있습니다.'));
 view.nodes().find(node=>node.type===view.Button&&node.props.children==='취소').props.onClick();assert.equal(requests.length,1);
 view.nodes().find(node=>node.type===view.Button&&node.props.children==='준비 작업 취소').props.onClick();
 await view.nodes().find(node=>node.type===view.Button&&node.props.children==='PostgreSQL 준비 작업 취소 확인').props.onClick();
 assert.deepEqual(requests[1],{action:'postgresql-code-recover',data:{path,reviewVersion:plan.reviewVersion,confirm:true}});
 assert(view.nodes().some(node=>node.props?.role==='status'&&node.props.children==='PostgreSQL 준비 작업 취소 완료'));view.dispose();
});


test('old interrupted recovery and lookup handlers cannot submit after cluster, API, policy or lifetime changes',async()=>{
 for(const change of ['file','api','policy','disabled','unmount']){
  const calls=[],api=async(action,data)=>{calls.push({action,data});return plan;};
  const view=await fixture({initialPath:path,security,connected:true,api});view.nodes();
  const lookup=view.nodes().find(node=>node.type===view.Button&&node.props.children==='중단 작업 조회').props.onClick;await lookup();
  const open=view.nodes().find(node=>node.type===view.Button&&node.props.children==='중단 작업 복구').props.onClick;open();
  const commit=view.nodes().find(node=>node.type===view.Button&&node.props.children==='PostgreSQL 중단 복구 확인').props.onClick;
  if(change==='file')view.props.initialPath='/etc/postgresql/16/other/postgresql.conf';
  if(change==='api')view.props.api=(...args)=>api(...args);
  if(change==='policy')view.props.security={...security,version:'next-policy'};
  if(change==='disabled')view.props.disabled=true;
  if(change==='unmount')view.dispose();else assert(!view.nodes().some(node=>node.props?.role==='alertdialog'),'hide old recovery immediately');
  const before=calls.length;open();await lookup();await commit();assert.equal(calls.length,before,'stale recovery must not reach transport after '+change);view.dispose();
 }
});
