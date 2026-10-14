import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
async function fixture(props){await loadBindings();const compiled=await transform(await readFile(new URL('../components/postgresql-restore.tsx',import.meta.url),'utf8'),{filename:'postgresql-restore.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});const states=[],refs=[],effects=[],pending=[],Button=()=>null,IconButton=()=>null,Checkbox=()=>null,NativeSelect=()=>null,module={exports:{}},native=createRequire(import.meta.url);let si=0,ri=0,ei=0;
 const hooks={...React,useState:initial=>{const at=si++;if(!(at in states))states[at]=initial;return[states[at],value=>states[at]=typeof value==='function'?value(states[at]):value];},useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),useEffect:(fn,deps)=>{const at=ei++;if(!effects[at]||deps.some((value,i)=>value!==effects[at].deps[i]))pending.push(()=>{effects[at]?.cleanup?.();effects[at]={deps,fn,cleanup:fn()};});}};
 new Function('require','module','exports',compiled.code)(name=>name==='./console-types'?consoleTypes:name==='./ui/toast-provider'?toastTestModuleWithReact(hooks):name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button,IconButton,Checkbox,NativeSelect}:name==='./mariadb-resource-review'?{__esModule:true,default:()=>null}:native(name),module,module.exports);
 const render=()=>{si=ri=ei=0;const tree=module.exports.default(props);while(pending.length)pending.shift()();return tree;};const all=tree=>!tree||typeof tree!=='object'?[]:[tree,...React.Children.toArray(toastTestChildren(tree)).flatMap(all)];const nodes=()=>all(render());return{props,nodes,Button,IconButton,Checkbox,NativeSelect,replayEffects:()=>effects.forEach(effect=>{effect.cleanup?.();effect.cleanup=effect.fn();}),dispose:()=>effects.forEach(effect=>effect.cleanup?.())};
}
const path='/etc/postgresql/16/main/postgresql.conf',id='d834ae1b-1108-4835-a860-82077d70d4f8',security={settings:{readOnly:false,databaseChanges:true,sudoWithoutPrompt:true},available:{},privilege:{ready:true}};
const metadata={id,target:path,changed:true,codeRestoreAvailable:true,fields:[],notice:'fixture'};
const plan={path,id,changed:true,fields:[{key:'port',before:'5433',after:'5432'}],...Object.fromEntries(['version','graphVersion','candidateGraphVersion','serviceVersion','backupVersion','backupIdentity','reviewVersion'].map(key=>[key,'a'.repeat(64)]))};
const settle=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
test('PostgreSQL backup GUI chooses graph-bound restore, confirms exact proof and prevents duplicate execution',async()=>{
 const requests=[];let finish;const view=await fixture({id,security,connected:true,api:async(action,data)=>{requests.push({action,data});return action.startsWith('postgresql-restore-plan?')?metadata:action==='postgresql-code-restore-plan'?plan:new Promise(resolve=>finish=resolve);}});view.nodes();await settle();assert.deepEqual(requests[1],{action:'postgresql-code-restore-plan',data:{path,id}});
 view.nodes().find(node=>node.type===view.Button&&node.props.children==='선택한 백업 복원').props.onClick();const button=view.nodes().find(node=>node.type===view.Button&&node.props.children==='복원 및 재시작'),first=button.props.onClick(),duplicate=button.props.onClick();assert.equal(requests.length,3);assert.deepEqual(requests[2],{action:'postgresql-code-restore',data:{...Object.fromEntries(['path','id','version','graphVersion','candidateGraphVersion','serviceVersion','backupVersion','backupIdentity','reviewVersion'].map(key=>[key,plan[key]])),confirm:true}});finish({changed:true,journalCleanupVerified:true});await Promise.all([first,duplicate]);assert(!view.nodes().some(node=>node.props?.role==='alertdialog'));view.dispose();
});
test('PostgreSQL backup GUI refuses graph validation without falling back to legacy restore',async()=>{
 const requests=[];const view=await fixture({id,security,connected:true,api:async action=>{requests.push(action);if(action.startsWith('postgresql-restore-plan?'))return metadata;throw Error('include changed');}});view.nodes();await settle();assert.deepEqual(requests,['postgresql-restore-plan?id='+id,'postgresql-code-restore-plan']);assert(view.nodes().some(node=>node.props?.role==='alert'));assert(!view.nodes().some(node=>node.type===view.Button&&node.props.children==='선택한 백업 복원'));view.dispose();
});
test('PostgreSQL backup GUI ignores old response and clears confirmation after policy changes',async()=>{
 let finish;const requests=[],api=async action=>{requests.push(action);return new Promise(resolve=>finish=resolve);};const view=await fixture({id,security,connected:true,api});view.nodes();view.props.security={...security,settings:{...security.settings,readOnly:true}};view.nodes();finish(metadata);await settle();assert.equal(requests.length,1);assert(!view.nodes().some(node=>node.type===view.Button&&node.props.children==='선택한 백업 복원'));view.dispose();
});
test('PostgreSQL backup GUI retains explicit legacy backup restore for older context-free backups',async()=>{
 const requests=[];const view=await fixture({id,security,connected:true,api:async(action,data)=>{requests.push({action,data});return action.startsWith('postgresql-restore-plan?')?{...metadata,codeRestoreAvailable:false,version:'a'.repeat(64),backupVersion:'b'.repeat(64)}:{changed:true};}});view.nodes();await settle();view.nodes().find(node=>node.type===view.Button&&node.props.children==='선택한 백업 복원').props.onClick();await view.nodes().find(node=>node.type===view.Button&&node.props.children==='복원 및 재시작').props.onClick();assert.deepEqual(requests[1],{action:'postgresql-restore',data:{id,version:'a'.repeat(64),backupVersion:'b'.repeat(64),confirm:true}});view.dispose();
});

test('completed restore opens only the original backup review through its icon and drops stale policy callbacks',async()=>{
 const undoId='d834ae1b-1108-4835-a860-82077d70d4f9',opened=[];
 const view=await fixture({id,security,connected:true,onReviewBackup:value=>opened.push(value),api:async action=>action.startsWith('postgresql-restore-plan?')?metadata:action==='postgresql-code-restore-plan'?plan:{backupId:undoId,changed:true,journalCleanupVerified:true}});
 view.nodes();await settle();view.nodes().find(node=>node.type===view.Button&&node.props.children==='선택한 백업 복원').props.onClick();
 await view.nodes().find(node=>node.type===view.Button&&node.props.children==='복원 및 재시작').props.onClick();
 const button=view.nodes().find(node=>node.type===view.IconButton);assert.equal(button.props['aria-label'],'복원 검토');button.props.onClick();assert.deepEqual(opened,[undoId]);
 view.props.security={...security,settings:{...security.settings,readOnly:true}};view.nodes();button.props.onClick();assert.deepEqual(opened,[undoId]);view.dispose();
});

test('selected configuration refuses a backup from another cluster before planning or restoring',async()=>{
 const calls=[];const view=await fixture({id,expectedPath:'/etc/postgresql/16/other/postgresql.conf',security,connected:true,api:async action=>{calls.push(action);return metadata;}});
 view.nodes();await settle();assert.deepEqual(calls,['postgresql-restore-plan?id='+id]);assert(view.nodes().some(node=>node.props?.role==='alert'));
 assert(!view.nodes().some(node=>node.type===view.Button&&node.props.children==='선택한 백업 복원'));view.dispose();
});

test('changing the selected path discards an old backup review even with the same backup ID',async()=>{
 const pending=[];const view=await fixture({id,expectedPath:path,security,connected:true,api:action=>new Promise(resolve=>pending.push({action,resolve}))});
 view.nodes();view.props.expectedPath='/etc/postgresql/16/other/postgresql.conf';view.nodes();
 pending[0].resolve(metadata);await settle();assert.equal(pending.length,2,'stale selected path cannot start graph planning');
 assert(!view.nodes().some(node=>node.type===view.Button&&node.props.children==='선택한 백업 복원'));
 pending[1].resolve(metadata);await settle();assert(view.nodes().some(node=>node.props?.role==='alert'));view.dispose();
});


test('restore publishes completion once, refreshes exact target, and retains outcome if refresh rejects',async()=>{
 const callbacks=[],requests=[];let finish;
 const view=await fixture({id,expectedPath:path,security,connected:true,onRestored:(data,target)=>{callbacks.push({data,target});return new Promise((resolve,reject)=>finish=reject);},api:async action=>{requests.push(action);return action.startsWith('postgresql-restore-plan?')?metadata:action==='postgresql-code-restore-plan'?plan:{changed:true,journalCleanupVerified:true};}});
 view.nodes();await settle();view.nodes().find(node=>node.type===view.Button&&node.props.children==='선택한 백업 복원').props.onClick();const button=view.nodes().find(node=>node.type===view.Button&&node.props.children==='복원 및 재시작');const running=button.props.onClick();await settle();await button.props.onClick();assert.equal(callbacks.length,1);assert.equal(callbacks[0].target,path);assert.equal(requests.filter(action=>action==='postgresql-code-restore').length,1);
 finish(Error('refresh unavailable'));await running;const nodes=view.nodes();assert(JSON.stringify(nodes).includes('백업 복원 완료'));assert(nodes.some(node=>node.props?.role==='alert'&&node.props.children==='복구는 완료되었지만 목록 갱신에 실패했습니다.'));assert(nodes.find(node=>node.type===view.Button&&node.props.children==='선택한 백업 복원').props.disabled);view.dispose();
});

test('restoration response from a previous selection does not refresh the new file',async()=>{
 const callbacks=[];let finish;
 const view=await fixture({id,expectedPath:path,security,connected:true,onRestored:(...args)=>callbacks.push(args),api:async action=>action.startsWith('postgresql-restore-plan?')?metadata:action==='postgresql-code-restore-plan'?plan:new Promise(resolve=>finish=resolve)});
 view.nodes();await settle();view.nodes().find(node=>node.type===view.Button&&node.props.children==='선택한 백업 복원').props.onClick();const running=view.nodes().find(node=>node.type===view.Button&&node.props.children==='복원 및 재시작').props.onClick();view.props.expectedPath='/etc/postgresql/16/other/postgresql.conf';view.nodes();finish({changed:true});await running;assert.equal(callbacks.length,0);view.dispose();
});


test('old backup restore confirmation cannot submit after file, backup, transport, policy or unmount changes',async()=>{
 for(const change of ['file','backup','api','policy','unmount']){
  const calls=[],api=async(action,data)=>{calls.push({action,data});return action.startsWith('postgresql-restore-plan?')?metadata:plan;};
  const view=await fixture({id,expectedPath:path,security,connected:true,api});view.nodes();await settle();
  const open=view.nodes().find(node=>node.type===view.Button&&node.props.children==='선택한 백업 복원').props.onClick;open();
  const commit=view.nodes().find(node=>node.type===view.Button&&node.props.children==='복원 및 재시작').props.onClick;
  if(change==='file')view.props.expectedPath='/etc/postgresql/16/other/postgresql.conf';
  if(change==='backup')view.props.id='d834ae1b-1108-4835-a860-82077d70d4f9';
  if(change==='api')view.props.api=(...args)=>api(...args);
  if(change==='policy')view.props.security={...security,version:'next-policy'};
  if(change==='unmount')view.dispose();else assert(!view.nodes().some(node=>node.props?.role==='alertdialog'),'hide old confirmation immediately');
  await settle();const before=calls.length;open();await commit();assert.equal(calls.length,before,'stale restore must not reach transport after '+change);
  assert(!calls.some(call=>['postgresql-code-restore','postgresql-restore'].includes(call.action)));view.dispose();
 }
});


test('Strict Mode effect replay shares one metadata request and starts one graph review',async()=>{
 const pending=[],view=await fixture({id,expectedPath:path,security,connected:true,api:action=>new Promise(resolve=>pending.push({action,resolve}))});
 view.nodes();view.replayEffects();assert.equal(pending.length,1,'replayed mount shares the same pending metadata request');
 pending[0].resolve(metadata);await settle();assert.equal(pending.length,2,'only the active mount starts graph review');assert.equal(pending[1].action,'postgresql-code-restore-plan');
 pending[1].resolve(plan);await settle();assert(view.nodes().some(node=>node.type===view.Button&&node.props.children==='선택한 백업 복원'));view.dispose();
});


test('backup restore outcomes identify failed restore and automatic rollback without implying success',async()=>{
 for(const failed of [false,true]){
  let commits=0;const view=await fixture({id,security,connected:true,api:async action=>action.startsWith('postgresql-restore-plan?')?metadata:action==='postgresql-code-restore-plan'?plan:(commits++,{changed:!failed,failed,restored:failed,recovered:failed})});
  view.nodes();await settle();view.nodes().find(node=>node.type===view.Button&&node.props.children==='선택한 백업 복원').props.onClick();await view.nodes().find(node=>node.type===view.Button&&node.props.children==='복원 및 재시작').props.onClick();
  const nodes=view.nodes(),outcome=nodes.find(node=>node.type==='div'&&node.props?.role===(failed?'alert':'status'));assert(outcome);assert(JSON.stringify(outcome).includes(failed?'백업 복원에 실패하여 원본 설정을 복원하고 서비스를 복구했습니다.':'백업 복원 완료'));assert.equal(commits,1);assert(nodes.find(node=>node.type===view.Button&&node.props.children==='선택한 백업 복원').props.disabled);view.dispose();
 }
});
