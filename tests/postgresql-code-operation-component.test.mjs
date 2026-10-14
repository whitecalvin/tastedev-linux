import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
async function fixture(props){await loadBindings();const compiled=await transform(await readFile(new URL('../components/postgresql-code-operation.tsx',import.meta.url),'utf8'),{filename:'postgresql-code-operation.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});const states=[],refs=[],effects=[],pending=[],Button=()=>null,Checkbox=()=>null,NativeSelect=()=>null,module={exports:{}},native=createRequire(import.meta.url);let si=0,ri=0,ei=0;
 const hooks={...React,useState:initial=>{const at=si++;if(!(at in states))states[at]=initial;return[states[at],value=>states[at]=typeof value==='function'?value(states[at]):value];},useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),useEffect:(fn,deps)=>{const at=ei++;if(!effects[at]||deps.some((value,i)=>value!==effects[at].deps[i]))pending.push(()=>{effects[at]?.cleanup?.();effects[at]={deps,cleanup:fn()};});}};
 const Recovery=()=>null;
 new Function('require','module','exports',compiled.code)(name=>name==='./console-types'?consoleTypes:name==='./ui/toast-provider'?toastTestModuleWithReact(hooks):name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button,Checkbox,NativeSelect}:name==='./postgresql-code-recovery'?{__esModule:true,default:Recovery}:name==='./mariadb-resource-review'?{__esModule:true,default:()=>null}:native(name),module,module.exports);
 const render=()=>{si=ri=ei=0;const tree=module.exports.default(props);while(pending.length)pending.shift()();return tree;};const all=tree=>!tree||typeof tree!=='object'?[]:[tree,...React.Children.toArray(toastTestChildren(tree)).flatMap(all)];const nodes=()=>all(render());return{props,nodes,Button,Checkbox,NativeSelect,Recovery,dispose:()=>effects.forEach(effect=>effect.cleanup?.())};
}
const input={path:'/etc/postgresql/16/main/postgresql.conf',version:'a'.repeat(64),text:'save 300 10\n'},security={settings:{readOnly:false,databaseChanges:true,sudoWithoutPrompt:true},available:{},privilege:{ready:true}},plan={changed:true,graphVersion:'b'.repeat(64),candidateGraphVersion:'c'.repeat(64),serviceVersion:'f'.repeat(64),reviewVersion:'d'.repeat(64),resourceReview:{resources:[]}};
test('PostgreSQL code GUI sends exact reviewed text only after validation and explicit confirmation, prevents duplicate apply',async()=>{
 const requests=[],applied=[];let finish;const view=await fixture({input,security,connected:true,api:async(action,data)=>{requests.push({action,data});return action==='postgresql-code-plan'?plan:new Promise(resolve=>finish=resolve);},onApplied:value=>applied.push(value)});
 view.nodes();await view.nodes().find(node=>node.type===view.Button&&node.props.children==='검수').props.onClick();let nodes=view.nodes();assert.equal(nodes.find(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용').props.disabled,true);nodes.find(node=>node.type===view.Checkbox).props.onChange({target:{checked:true}});nodes=view.nodes();const button=nodes.find(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용');const first=button.props.onClick(),second=button.props.onClick();assert.equal(requests.length,2);assert.deepEqual(requests[1].data,{...input,graphVersion:plan.graphVersion,candidateGraphVersion:plan.candidateGraphVersion,serviceVersion:plan.serviceVersion,reviewVersion:plan.reviewVersion,confirm:true});finish({changed:true,version:'e'.repeat(64)});await Promise.all([first,second]);assert.equal(applied.length,1);assert(view.nodes().some(node=>node.props?.role==='status'));view.dispose();
});
test('PostgreSQL code GUI rejects unauthorized requests and discards late responses after input change or unmount',async()=>{
 let finish;const requests=[],view=await fixture({input,security:{...security,settings:{...security.settings,readOnly:true}},connected:true,api:async action=>{requests.push(action);return new Promise(resolve=>finish=resolve);}});view.nodes();await view.nodes().find(node=>node.type===view.Button).props.onClick();assert.equal(requests.length,0);view.props.security=security;view.nodes();const validation=view.nodes().find(node=>node.type===view.Button).props.onClick();view.props.input={...input,text:'save 20 2\n'};view.nodes();finish(plan);await validation;assert(!view.nodes().some(node=>node.type===view.Checkbox));const next=view.nodes().find(node=>node.type===view.Button).props.onClick();view.dispose();finish(plan);await next;
});

test('PostgreSQL code GUI invalidates review when policy or connection changes',async()=>{
 const view=await fixture({input,security,connected:true,api:async()=>plan});view.nodes();await view.nodes().find(node=>node.type===view.Button).props.onClick();view.nodes().find(node=>node.type===view.Checkbox).props.onChange({target:{checked:true}});view.props.connected=false;view.nodes();assert(!view.nodes().some(node=>node.type===view.Checkbox));assert(view.nodes().find(node=>node.type===view.Button).props.disabled);view.props.connected=true;view.nodes();await view.nodes().find(node=>node.type===view.Button).props.onClick();view.props.security={...security,settings:{...security.settings,databaseChanges:false}};view.nodes();assert(!view.nodes().some(node=>node.type===view.Checkbox));view.dispose();
});


test('PostgreSQL apply waits for refresh, catches rejected refresh and retains completed result without duplicate apply',async()=>{
 let finish,refreshCalls=0,applyCalls=0;
 const view=await fixture({input,security,connected:true,api:async action=>action==='postgresql-code-plan'?plan:(applyCalls++,{changed:true,version:'e'.repeat(64)}),onApplied:()=>{refreshCalls++;return new Promise((resolve,reject)=>finish=reject);}});
 view.nodes();await view.nodes().find(node=>node.type===view.Button&&node.props.children==='검수').props.onClick();view.nodes().find(node=>node.type===view.Checkbox).props.onChange({target:{checked:true}});
 const button=view.nodes().find(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용');const running=button.props.onClick();await Promise.resolve();assert.equal(refreshCalls,1);await button.props.onClick();assert.equal(applyCalls,1);
 finish(Error('refresh unavailable'));await running;const nodes=view.nodes();assert(nodes.some(node=>node.props?.role==='alert'&&node.props.children==='설정 적용은 완료되었지만 목록 갱신에 실패했습니다.'));assert(JSON.stringify(nodes).includes('설정 적용 완료'));assert(nodes.find(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용').props.disabled);view.dispose();
});


test('old PostgreSQL validation, confirmation and apply handlers cannot act after target or policy changes',async()=>{
 for(const change of ['file','api','policy','disconnect','unmount']){
  const calls=[],api=async(action,data)=>{calls.push({action,data});return plan;};
  const view=await fixture({input,security,connected:true,api});view.nodes();
  const validate=view.nodes().find(node=>node.type===view.Button&&node.props.children==='검수').props.onClick;
  await validate();const checkbox=view.nodes().find(node=>node.type===view.Checkbox);checkbox.props.onChange({target:{checked:true}});
  const apply=view.nodes().find(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용').props.onClick;
  if(change==='file')view.props.input={...input,path:'/etc/postgresql/16/other/postgresql.conf'};
  if(change==='api')view.props.api=(...args)=>api(...args);
  if(change==='policy')view.props.security={...security,version:'next-policy'};
  if(change==='disconnect')view.props.connected=false;
  if(change==='unmount')view.dispose();else assert(!view.nodes().some(node=>node.type===view.Checkbox),'hide old review on first render');
  const before=calls.length;checkbox.props.onChange({target:{checked:true}});await validate();await apply();
  assert.equal(calls.length,before,'stale handlers must not send requests after '+change);view.dispose();
 }
});


test('postgresql apply outcomes distinguish rollback failure as an alert and successful application as a status',async()=>{
 for(const [output,message] of [
  [{changed:false,failed:true,restored:true,recovered:true},'변경 적용에 실패하여 원본 설정을 복원하고 서비스를 복구했습니다.'],
  [{changed:false,failed:true,restored:true,recovered:false},'원본은 복원했지만 서비스 복구가 필요합니다.'],
  [{changed:true,failed:true,restored:false,recovered:false},'자동 복원 실패: 백업을 확인하세요.'],
  [{changed:true},'설정 적용 완료']
 ]){
  let commits=0;const view=await fixture({input,security,connected:true,api:async action=>action==='postgresql-code-plan'?plan:(commits++,output)});
  view.nodes();await view.nodes().find(node=>node.type===view.Button&&node.props.children==='검수').props.onClick();view.nodes().find(node=>node.type===view.Checkbox).props.onChange({target:{checked:true}});
  await view.nodes().find(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용').props.onClick();const nodes=view.nodes();const outcome=nodes.find(node=>node.type==='div'&&node.props?.role===(output.failed?'alert':'status'));assert(outcome);assert(JSON.stringify(outcome).includes(message));assert.equal(commits,1);assert(nodes.find(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용').props.disabled);view.dispose();
 }
});

test('unknown apply failure exposes recovery for the exact file without asserting rollback or repeating apply',async()=>{
 const calls=[],view=await fixture({input,security,connected:true,api:async action=>{calls.push(action);if(action==='postgresql-code-plan')return plan;throw Error('관리 작업 실행이 중단되어 적용 결과를 확인할 수 없습니다.');}});
 view.nodes();await view.nodes().find(n=>n.type===view.Button&&n.props.children==='검수').props.onClick();view.nodes().find(n=>n.type===view.Checkbox).props.onChange({target:{checked:true}});await view.nodes().find(n=>n.type===view.Button&&n.props.children==='검토한 설정 적용').props.onClick();
 let nodes=view.nodes();const recovery=nodes.find(n=>n.type===view.Recovery);assert(recovery);assert.equal(recovery.props.initialPath,input.path);assert.deepEqual(calls,['postgresql-code-plan','postgresql-code-apply']);assert(!nodes.some(n=>n.type===view.Checkbox));assert(!JSON.stringify(nodes).includes('설정 적용 완료'));
 view.props.input={...input,path:'/etc/postgresql/18/other/postgresql.conf'};assert(!view.nodes().some(n=>n.type===view.Recovery));await recovery.props.onRecovered({recovered:true});assert(!view.nodes().some(n=>n.type===view.Recovery));view.dispose();
});


test('recovery completion remains visible and consumes the old apply review',async()=>{
 const view=await fixture({input,security,connected:true,api:async action=>{if(action==='postgresql-code-plan')return plan;throw Error('interrupted');}});view.nodes();await view.nodes().find(n=>n.type===view.Button&&n.props.children==='검수').props.onClick();view.nodes().find(n=>n.type===view.Checkbox).props.onChange({target:{checked:true}});await view.nodes().find(n=>n.type===view.Button&&n.props.children==='검토한 설정 적용').props.onClick();await view.nodes().find(n=>n.type===view.Recovery).props.onRecovered({recovered:true});const nodes=view.nodes();assert(!nodes.some(n=>n.type===view.Recovery));assert(JSON.stringify(nodes).includes('원본 설정 복원 및 서비스 복구 완료'));assert(!JSON.stringify(nodes).includes('설정 적용 완료'));assert(nodes.find(n=>n.type===view.Button&&n.props.children==='검수').props.disabled);view.dispose();
});
