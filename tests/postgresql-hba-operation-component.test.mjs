import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture(props){await loadBindings();const compiled=await transform(await readFile(new URL('../components/postgresql-hba-operation.tsx',import.meta.url),'utf8'),{filename:'postgresql-hba-operation.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});const states=[],refs=[],effects=[];let stateIndex=0,refIndex=0,effectIndex=0,pending=[];const Button=()=>null,native=createRequire(import.meta.url),module={exports:{}};
 const hooks={...React,useState:init=>{const at=stateIndex++;if(!(at in states))states[at]=init;return[states[at],next=>states[at]=typeof next==='function'?next(states[at]):next];},useRef:init=>refs[refIndex++]??(refs[refIndex-1]={current:init}),useEffect:(fn,deps)=>{const at=effectIndex++,old=effects[at];if(!old||deps.some((value,index)=>!Object.is(value,old.deps[index])))pending.push(()=>{old?.cleanup?.();effects[at]={deps,fn,cleanup:fn()};});}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button,IconButton:Button}:native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);
 function render(){stateIndex=refIndex=effectIndex=0;const tree=module.exports.default(props);const queued=pending;pending=[];queued.forEach(fn=>fn());return tree;}
 function nodes(){const all=[];function visit(node){if(!node||typeof node!=='object')return;all.push(node);React.Children.forEach(toastTestChildren(node),visit);}visit(render());return all;}
 return {props,Button,render,nodes,replayEffects:()=>effects.forEach(effect=>{effect.cleanup?.();effect.cleanup=effect.fn();}),dispose:()=>effects.forEach(effect=>effect.cleanup?.())};}
const security={settings:{readOnly:false,databaseChanges:true,sudoWithoutPrompt:true},available:{},privilege:{ready:true}},input={path:'/etc/postgresql/16/main/pg_hba.conf',version:'a'.repeat(64),text:'local all all peer\n'},plan={changed:true,reviewVersion:'b'.repeat(64),service:{unit:'postgresql@16-main.service',port:5432},difference:{before:['old'],after:['new']}};
test('HBA GUI requires final confirmation, freezes review and prevents duplicate commits',async()=>{const requests=[],applied=[];let finish;const api=async(action,data)=>{requests.push({action,data});return action.startsWith('postgresql-hba-recovery-status')?{recoveryRequired:false}:action.endsWith('-plan')?plan:new Promise(resolve=>finish=resolve);};const view=await fixture({input,api,connected:true,security,onApplied:value=>applied.push(value)});view.render();await tick();let nodes=view.nodes();const open=nodes.find(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용');assert(open);assert.equal(requests.length,2);open.props.onClick();nodes=view.nodes();assert(nodes.some(node=>node.props?.role==='alertdialog'));const commit=nodes.find(node=>node.type===view.Button&&node.props.children==='적용 및 reload');const first=commit.props.onClick(),second=commit.props.onClick();assert.equal(requests.length,3);assert.deepEqual(requests[2].data,{...input,confirm:true,reviewVersion:plan.reviewVersion});finish({version:'c'.repeat(64),changed:true});await Promise.all([first,second]);assert.equal(applied.length,1);assert(view.nodes().some(node=>node.props?.role==='status'));view.dispose();});
test('HBA GUI denies unauthorized review and ignores responses after scope change or unmount',async()=>{let resolve;const calls=[],applied=[];const api=async action=>{calls.push(action);return new Promise(done=>resolve=done);};const view=await fixture({input,api,connected:true,security:{...security,settings:{...security.settings,readOnly:true}},onApplied:value=>applied.push(value)});view.render();await tick();assert.deepEqual(calls,[]);view.props.security=security;view.render();assert.equal(calls.length,1);const stale=resolve;view.props.input={...input,text:'local all all reject\n'};view.render();stale(plan);await tick();assert(!view.nodes().some(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용'));view.dispose();resolve(plan);await tick();assert.deepEqual(applied,[]);});

test('HBA GUI shows interrupted operation recovery instead of new draft review and submits only confirmed target',async()=>{
 const requests=[],applied=[],backupId='d834ae1b-1108-4835-a860-82077d70d4f8';let finish;
 const api=async(action,data)=>{requests.push({action,data});if(action.startsWith('postgresql-hba-recovery-status'))return {recoveryRequired:true,backupId};return new Promise(resolve=>finish=resolve);};
 const view=await fixture({input,api,connected:true,security,onApplied:value=>applied.push(value)});view.render();await tick();let nodes=view.nodes();assert(!nodes.some(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용'));const open=nodes.find(node=>node.type===view.Button&&node.props.children==='중단 작업 복구');assert(open);open.props.onClick();nodes=view.nodes();const commit=nodes.find(node=>node.type===view.Button&&node.props.children==='복원 및 reload');assert(commit);const first=commit.props.onClick(),second=commit.props.onClick();assert.equal(requests.length,2);assert.equal(requests[1].action,'postgresql-hba-recover');assert.deepEqual(requests[1].data,{path:input.path,confirm:true});finish({changed:false,restored:true,recovered:true,recoveryRequired:false,version:'c'.repeat(64)});await Promise.all([first,second]);assert.equal(applied.length,1);assert(view.nodes().some(node=>node.props?.role==='status'));view.dispose();
});


test('HBA completed reload waits for refresh and retains outcome when asynchronous refresh rejects',async()=>{
 let rejectRefresh;const calls=[];
 const view=await fixture({input,connected:true,security,onApplied:()=>new Promise((resolve,reject)=>rejectRefresh=reject),api:async action=>{calls.push(action);return action.startsWith('postgresql-hba-recovery-status')?{recoveryRequired:false}:action.endsWith('-plan')?plan:{version:'c'.repeat(64),changed:true};}});
 view.render();await tick();view.nodes().find(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용').props.onClick();const button=view.nodes().find(node=>node.type===view.Button&&node.props.children==='적용 및 reload');const running=button.props.onClick();await tick();await button.props.onClick();assert.equal(calls.filter(action=>action==='postgresql-hba-operation').length,1);
 rejectRefresh(Error('refresh unavailable'));await running;const nodes=view.nodes();assert(JSON.stringify(nodes).includes('파일 저장 및 reload 요청 완료'));assert(nodes.some(node=>node.props?.role==='alert'&&node.props.children==='refresh unavailable'));assert(nodes.find(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용').props.disabled);view.dispose();
});

test('HBA late refresh failure is ignored after connection scope changes',async()=>{
 let rejectRefresh;const view=await fixture({input,connected:true,security,onApplied:()=>new Promise((resolve,reject)=>rejectRefresh=reject),api:async action=>action.startsWith('postgresql-hba-recovery-status')?{recoveryRequired:false}:action.endsWith('-plan')?plan:{version:'c'.repeat(64),changed:true}});
 view.render();await tick();view.nodes().find(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용').props.onClick();const running=view.nodes().find(node=>node.type===view.Button&&node.props.children==='적용 및 reload').props.onClick();await tick();view.props.connected=false;view.nodes();rejectRefresh(Error('old connection error'));await running;assert(!JSON.stringify(view.nodes()).includes('old connection error'));view.dispose();
});

test('HBA old confirmation cannot send apply after file, transport, permission or lifetime changes',async()=>{
 for(const change of ['file','transport','policy-version','permission','unmount']){
  const calls=[],api=async(action,data)=>{calls.push({action,data});return action.startsWith('postgresql-hba-recovery-status')?{recoveryRequired:false}:action.endsWith('-plan')?plan:{changed:true};};
  const view=await fixture({input,api,connected:true,security});view.render();await tick();
  view.nodes().find(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용').props.onClick();
  const oldCommit=view.nodes().find(node=>node.type===view.Button&&node.props.children==='적용 및 reload').props.onClick;
  if(change==='file')view.props.input={...input,path:'/etc/postgresql/16/other/pg_hba.conf'};
  if(change==='transport')view.props.api=(...args)=>api(...args);
  if(change==='policy-version')view.props.security={...security,version:'new-policy'};
  if(change==='permission')view.props.security={...security,settings:{...security.settings,readOnly:true}};
  if(change==='unmount')view.dispose();
  else assert(!view.nodes().some(node=>node.props?.role==='alertdialog'),'old confirmation is hidden on '+change);
  await tick();const before=calls.length;await oldCommit();assert.equal(calls.length,before,'old callback must not reach transport after '+change);
  assert(!calls.some(call=>call.action==='postgresql-hba-operation'));
  view.dispose();
 }
});

test('HBA old recovery confirmation cannot target the previous file and disabled review explains its permission',async()=>{
 const calls=[],api=async(action,data)=>{calls.push({action,data});return {recoveryRequired:true,backupId:'fixture-backup'};};
 const view=await fixture({input,api,connected:true,security});view.render();await tick();
 view.nodes().find(node=>node.type===view.Button&&node.props.children==='중단 작업 복구').props.onClick();
 const commit=view.nodes().find(node=>node.type===view.Button&&node.props.children==='복원 및 reload').props.onClick;
 view.props.input={...input,path:'/etc/postgresql/16/other/pg_hba.conf'};assert(!view.nodes().some(node=>node.props?.role==='alertdialog'));
 const before=calls.length;await commit();assert.equal(calls.length,before);assert(!calls.some(call=>call.action==='postgresql-hba-recover'));
 view.props.security={...security,settings:{...security.settings,databaseChanges:false}};
 assert(JSON.stringify(view.nodes()).includes('보안 옵션에서 이 기능을 켜세요.'));view.dispose();
});

test('HBA service diagnostic is visible and explicit retry rechecks recovery before a new plan',async()=>{
 const diagnostic='PostgreSQL 서비스 경로를 안전하게 확인할 수 없습니다: /media/user/data — root 또는 PostgreSQL 실행 계정 소유여야 합니다.',calls=[];let failed=true;
 const api=async action=>{calls.push(action);if(action.startsWith('postgresql-hba-recovery-status'))return {recoveryRequired:false};if(failed)throw Object.assign(Error(diagnostic),{status:409});return plan;};
 const view=await fixture({input,api,connected:true,security});view.render();await tick();
 assert(view.nodes().some(node=>node.props?.role==='alert'&&node.props.children===diagnostic));
 assert(!view.nodes().some(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용'));
 const retry=view.nodes().find(node=>node.props?.['aria-label']==='다시 검토').props.onClick;failed=false;retry();retry();view.render();await tick();
 assert.equal(calls.length,4);assert(calls[2].startsWith('postgresql-hba-recovery-status'));assert.equal(calls[3],'postgresql-hba-operation-plan');
 assert(!view.nodes().some(node=>node.props?.role==='alert'));assert(view.nodes().some(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용'));
 const before=calls.length;retry();await tick();assert.equal(calls.length,before,'consumed retry must not start another review');view.dispose();
});

test('HBA stale retry cannot run after permission, input or lifetime changes',async()=>{
 for(const change of ['permission','input','unmount']){
  const calls=[],api=async action=>{calls.push(action);throw Error('서비스 경로를 확인하세요.');},view=await fixture({input,api,connected:true,security});view.render();await tick();
  const retry=view.nodes().find(node=>node.props?.['aria-label']==='다시 검토').props.onClick;
  if(change==='permission')view.props.security={...security,settings:{...security.settings,readOnly:true}};
  if(change==='input')view.props.input={...input,path:'/etc/postgresql/16/other/pg_hba.conf'};
  if(change==='unmount')view.dispose();else view.render();
  const before=calls.length;retry();await tick();assert.equal(calls.length,before,change);assert(!calls.some(action=>action==='postgresql-hba-operation'));view.dispose();
 }
});


test('HBA auto rollback reports failed application as an alert while successful recovery remains a status',async()=>{
 for(const recovery of [false,true]){
  const result=recovery?{changed:false,restored:true,recovered:true,recoveryRequired:false,version:input.version}:{changed:false,failed:true,restored:true,recovered:true,version:input.version};
  const calls=[],view=await fixture({input,connected:true,security,api:async action=>{calls.push(action);return action.startsWith('postgresql-hba-recovery-status')?(recovery?{recoveryRequired:true,backupId:'fixture-backup'}:{recoveryRequired:false}):action.endsWith('-plan')?plan:result;}});
  view.render();await tick();view.nodes().find(node=>node.type===view.Button&&node.props.children===(recovery?'중단 작업 복구':'검토한 설정 적용')).props.onClick();await view.nodes().find(node=>node.type===view.Button&&node.props.children===(recovery?'복원 및 reload':'적용 및 reload')).props.onClick();
  const outcome=view.nodes().find(node=>node.props?.role===(recovery?'status':'alert'));assert(outcome);const text=JSON.stringify(outcome);assert(text.includes(recovery?'원본 설정 복원 및 서비스 복구 완료':'변경 적용에 실패하여 원본 설정을 복원하고 서비스를 복구했습니다.'));assert(!text.includes('파일 저장 및 reload 요청 완료'));assert.equal(calls.filter(action=>action===(recovery?'postgresql-hba-recover':'postgresql-hba-operation')).length,1);view.dispose();
 }
});


test('HBA completed interrupted recovery removes the obsolete warning only after journal cleanup is verified',async()=>{
 for(const cleanup of [true,false,undefined]){
  const result={changed:false,restored:true,recovered:true,recoveryRequired:false,version:input.version,...(cleanup===undefined?{}:{journalCleanupVerified:cleanup})};
  const view=await fixture({input,connected:true,security,api:async action=>action.startsWith('postgresql-hba-recovery-status')?{recoveryRequired:true,backupId:'fixture-backup'}:result});
  view.render();await tick();assert(JSON.stringify(view.nodes()).includes('중단된 접속 규칙 작업이 있습니다.'));view.nodes().find(node=>node.type===view.Button&&node.props.children==='중단 작업 복구').props.onClick();await view.nodes().find(node=>node.type===view.Button&&node.props.children==='복원 및 reload').props.onClick();
  const nodes=view.nodes(),text=JSON.stringify(nodes);assert(text.includes('원본 설정 복원 및 서비스 복구 완료'));assert.equal(text.includes('중단된 접속 규칙 작업이 있습니다.'),cleanup!==true);assert.equal(nodes.some(node=>node.type===view.Button&&node.props.children==='중단 작업 복구'),cleanup!==true);view.dispose();
 }
});


test('HBA StrictMode effect replay shares initial query and avoids helper lock collision',async()=>{
 const calls=[];let finishStatus;
 const api=async action=>{calls.push(action);if(action.startsWith('postgresql-hba-recovery-status'))return new Promise(resolve=>finishStatus=resolve);return plan;};
 const view=await fixture({input,api,connected:true,security});view.render();view.replayEffects();
 assert.equal(calls.length,1);finishStatus({recoveryRequired:false});await tick();
 assert.deepEqual(calls,[
  'postgresql-hba-recovery-status?path='+encodeURIComponent(input.path),
  'postgresql-hba-operation-plan'
 ]);assert(view.nodes().some(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용'));view.dispose();
});
