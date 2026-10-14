import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
async function fixture(props){await loadBindings();const compiled=await transform(await readFile(new URL('../components/redis-code-operation.tsx',import.meta.url),'utf8'),{filename:'redis-code-operation.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});const states=[],refs=[],effects=[],pending=[],Button=()=>null,Checkbox=()=>null,Recovery=()=>null,module={exports:{}},native=createRequire(import.meta.url);let si=0,ri=0,ei=0;
 const hooks={...React,useState:initial=>{const at=si++;if(!(at in states))states[at]=initial;return[states[at],value=>states[at]=typeof value==='function'?value(states[at]):value];},useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),useEffect:(fn,deps)=>{const at=ei++;if(!effects[at]||deps.some((value,i)=>value!==effects[at].deps[i]))pending.push(()=>{effects[at]?.cleanup?.();effects[at]={deps,fn,cleanup:fn()};});}};
 new Function('require','module','exports',compiled.code)(name=>name==='./console-types'?consoleTypes:name==='./ui/toast-provider'?toastTestModuleWithReact(hooks):name==='react'?hooks:name==='./redis-recovery'?{__esModule:true,default:Recovery}:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button,Checkbox}:name==='./redis-resource-review'?{__esModule:true,default:()=>null}:native(name),module,module.exports);
 const render=()=>{si=ri=ei=0;const tree=module.exports.default(props);while(pending.length)pending.shift()();return tree;};const all=tree=>!tree||typeof tree!=='object'?[]:[tree,...React.Children.toArray(toastTestChildren(tree)).flatMap(all)];const nodes=()=>all(render());return{props,nodes,Button,Checkbox,Recovery,replay:()=>effects.forEach(effect=>{effect.cleanup?.();effect.cleanup=effect.fn();}),dispose:()=>effects.forEach(effect=>effect.cleanup?.())};
}
const input={path:'/etc/redis/redis.conf',version:'a'.repeat(64),text:'save 300 10\n'},security={settings:{readOnly:false,databaseChanges:true,sudoWithoutPrompt:true},available:{},privilege:{ready:true}},plan={changed:true,graphVersion:'b'.repeat(64),candidateGraphVersion:'c'.repeat(64),reviewVersion:'d'.repeat(64),resourceReview:{resources:[]}};
test('Redis code GUI sends exact reviewed text only after validation and explicit confirmation, prevents duplicate apply',async()=>{
 const requests=[],applied=[];let finish;const view=await fixture({input,security,connected:true,api:async(action,data)=>{requests.push({action,data});return action==='redis-code-plan'?plan:new Promise(resolve=>finish=resolve);},onApplied:value=>applied.push(value)});
 view.nodes();await view.nodes().find(node=>node.type===view.Button&&node.props.children==='검수').props.onClick();let nodes=view.nodes();assert.equal(nodes.find(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용').props.disabled,true);nodes.find(node=>node.type===view.Checkbox).props.onChange({target:{checked:true}});nodes=view.nodes();const button=nodes.find(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용');const first=button.props.onClick(),second=button.props.onClick();assert.equal(requests.length,2);assert.deepEqual(requests[1].data,{...input,graphVersion:plan.graphVersion,candidateGraphVersion:plan.candidateGraphVersion,reviewVersion:plan.reviewVersion,confirm:true});finish({changed:true,version:'e'.repeat(64)});await Promise.all([first,second]);assert.equal(applied.length,1);assert(view.nodes().some(node=>node.props?.role==='status'));view.dispose();
});
test('Redis code GUI rejects unauthorized requests and discards late responses after input change or unmount',async()=>{
 let finish;const requests=[],view=await fixture({input,security:{...security,settings:{...security.settings,readOnly:true}},connected:true,api:async action=>{requests.push(action);return new Promise(resolve=>finish=resolve);}});view.nodes();await view.nodes().find(node=>node.type===view.Button).props.onClick();assert.equal(requests.length,0);view.props.security=security;view.nodes();const validation=view.nodes().find(node=>node.type===view.Button).props.onClick();view.props.input={...input,text:'save 20 2\n'};view.nodes();finish(plan);await validation;assert(!view.nodes().some(node=>node.type===view.Checkbox));const next=view.nodes().find(node=>node.type===view.Button).props.onClick();view.dispose();finish(plan);await next;
});

for(const failed of [false,true])test('redis completion retains apply or rollback result when async refresh fails and prevents duplicate execution: '+failed,async()=>{
 let rejectRefresh,applyCalls=0,refreshCalls=0;
 const output={changed:!failed,failed,restored:failed,recovered:failed,version:'e'.repeat(64)};
 const view=await fixture({input,security,connected:true,api:async action=>action==='redis-code-plan'?plan:(applyCalls++,output),onApplied:()=>{refreshCalls++;return new Promise((resolve,reject)=>rejectRefresh=reject);}});
 view.nodes();await view.nodes().find(node=>node.type===view.Button&&node.props.children==='검수').props.onClick();view.nodes().find(node=>node.type===view.Checkbox).props.onChange({target:{checked:true}});
 const button=view.nodes().find(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용');const executing=button.props.onClick();await Promise.resolve();assert.equal(refreshCalls,1);await button.props.onClick();assert.equal(applyCalls,1);
 rejectRefresh(Error('refresh unavailable'));await executing;const nodes=view.nodes();assert(nodes.some(node=>node.props?.role==='alert'&&node.props.children===(failed?'refresh unavailable':'설정 적용은 완료되었지만 목록 갱신에 실패했습니다.')));assert(JSON.stringify(nodes).includes(failed?'변경 적용에 실패하여 원본 설정을 복원하고 서비스를 복구했습니다.':'설정 적용 완료'));assert(nodes.find(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용').props.disabled);view.dispose();
});
test('redis late refresh rejection after disconnect does not populate the next scope',async()=>{
 let rejectRefresh;
 const view=await fixture({input,security,connected:true,api:async action=>action==='redis-code-plan'?plan:{changed:true,version:'e'.repeat(64)},onApplied:()=>new Promise((resolve,reject)=>rejectRefresh=reject)});
 view.nodes();await view.nodes().find(node=>node.type===view.Button&&node.props.children==='검수').props.onClick();view.nodes().find(node=>node.type===view.Checkbox).props.onChange({target:{checked:true}});
 const executing=view.nodes().find(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용').props.onClick();await Promise.resolve();view.props.connected=false;view.nodes();rejectRefresh(Error('old refresh failed'));await executing;
 assert(!view.nodes().some(node=>node.props?.role==='alert'));assert(!JSON.stringify(view.nodes()).includes('설정 적용 완료'));view.dispose();
});


test('redis apply outcomes distinguish rollback failure as an alert and successful application as a status',async()=>{
 for(const [output,message] of [
  [{changed:false,failed:true,restored:true,recovered:true},'변경 적용에 실패하여 원본 설정을 복원하고 서비스를 복구했습니다.'],
  [{changed:false,failed:true,restored:true,recovered:false},'원본은 복원했지만 서비스 복구가 필요합니다.'],
  [{changed:true,failed:true,restored:false,recovered:false},'자동 복원 실패: 백업을 확인하세요.'],
  [{changed:true},'설정 적용 완료']
 ]){
  let commits=0;const view=await fixture({input,security,connected:true,api:async action=>action==='redis-code-plan'?plan:(commits++,output)});
  view.nodes();await view.nodes().find(node=>node.type===view.Button&&node.props.children==='검수').props.onClick();view.nodes().find(node=>node.type===view.Checkbox).props.onChange({target:{checked:true}});
  await view.nodes().find(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용').props.onClick();const nodes=view.nodes();const outcome=nodes.find(node=>node.type==='div'&&node.props?.role===(output.failed?'alert':'status'));assert(outcome);assert(JSON.stringify(outcome).includes(message));assert.equal(commits,1);assert(nodes.find(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용').props.disabled);view.dispose();
 }
});

test('StrictMode effect replay preserves pending validation and unlocks reviewed apply',async()=>{
 let finish;const requests=[],view=await fixture({input,security,connected:true,api:async action=>{requests.push(action);return new Promise(resolve=>finish=resolve);}});
 view.nodes();view.replay();const validation=view.nodes().find(node=>node.type===view.Button&&node.props.children==='검수').props.onClick();
 assert.equal(view.nodes().find(node=>node.type===view.Button&&node.props.children==='검수').props.disabled,true);
 finish(plan);await validation;let nodes=view.nodes();assert.equal(nodes.find(node=>node.type===view.Button&&node.props.children==='검수').props.disabled,false);
 nodes.find(node=>node.type===view.Checkbox).props.onChange({target:{checked:true}});nodes=view.nodes();assert.equal(nodes.find(node=>node.type===view.Button&&node.props.children==='검토한 설정 적용').props.disabled,false);assert.equal(requests.length,1);view.dispose();
});


test('Redis unknown commit failure offers explicit same-popup recovery and retains completed recovery',async()=>{
 const calls=[],view=await fixture({input,security,connected:true,api:async action=>{calls.push(action);if(action==='redis-code-plan')return plan;throw Error('적용 결과를 확인할 수 없습니다.');}});
 view.nodes();await view.nodes().find(n=>n.type===view.Button&&n.props.children==='검수').props.onClick();view.nodes().find(n=>n.type===view.Checkbox).props.onChange({target:{checked:true}});await view.nodes().find(n=>n.type===view.Button&&n.props.children==='검토한 설정 적용').props.onClick();
 const recovery=view.nodes().find(n=>n.type===view.Recovery);assert(recovery);assert.deepEqual(calls,['redis-code-plan','redis-code-apply']);assert(!view.nodes().some(n=>n.type===view.Checkbox));
 
 await recovery.props.onRecovered({recovered:true,backupId:'fixture-backup'});const nodes=view.nodes();assert(!nodes.some(n=>n.type===view.Recovery));assert(JSON.stringify(nodes).includes('원본 설정 복원 및 서비스 복구 완료'));assert(!JSON.stringify(nodes).includes('설정 적용 완료'));assert(nodes.find(n=>n.type===view.Button&&n.props.children==='검수').props.disabled);view.dispose();
});

test('Redis old recovery callbacks cannot publish results after input changes',async()=>{
 const view=await fixture({input,security,connected:true,api:async action=>{if(action==='redis-code-plan')return plan;throw Error('중단');}});view.nodes();await view.nodes().find(n=>n.type===view.Button&&n.props.children==='검수').props.onClick();view.nodes().find(n=>n.type===view.Checkbox).props.onChange({target:{checked:true}});await view.nodes().find(n=>n.type===view.Button&&n.props.children==='검토한 설정 적용').props.onClick();
 const recovery=view.nodes().find(n=>n.type===view.Recovery);assert(recovery);view.props.input={...input,text:input.text+'\n'};assert(!view.nodes().some(n=>n.type===view.Recovery));await recovery.props.onRecovered({recovered:true});assert(!JSON.stringify(view.nodes()).includes('원본 설정 복원 및 서비스 복구 완료'));view.dispose();
});
