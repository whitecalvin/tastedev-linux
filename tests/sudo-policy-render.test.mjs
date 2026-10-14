import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import React from 'react';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
async function fixture(api,initial){
 const source=await readFile(new URL('../components/sudo-policy-panel.tsx',import.meta.url),'utf8');await loadBindings();const compiled=await transform(source,{filename:'sudo-policy-panel.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const state=initial||[['nginx-apply'],['nginx-apply'],true,null,false,''],effects=[],events=[];let cursor=0;
 const hooks={...React,useState:()=>{const index=cursor++;return[state[index],value=>{state[index]=value;}];},useRef:value=>({current:value}),useEffect:fn=>effects.push(fn)};
 const Button=()=>null,native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='../lib/helper-action-labels.ts'?{helperActionLabels:{}}:name==='./ui/controls'?{Button,Checkbox:()=>null,Switch:()=>null}:name==='../lib/capabilities.ts'?{featureAllowed:()=>true,featureReason:()=>''}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const tree=module.exports.default({connected:true,api});const buttons=[];
 function visit(node){if(!node||typeof node!=='object')return;if(node.type===Button)buttons.push(node);React.Children.forEach(toastTestChildren(node),visit);}visit(tree);
 return {state,effects,events,click:label=>buttons.find(item=>item.props.children===label).props.onClick()};
}
test('sudo GUI locks duplicate previews and invalidates late response after disconnect',async()=>{
 const calls=[];let resolve;const f=await fixture((action,payload)=>{calls.push({action,payload});return new Promise(done=>{resolve=done;});});const first=f.click('권한 규칙 미리보기'),second=f.click('권한 규칙 미리보기');assert.equal(calls.length,1);assert.equal(calls[0].action,'sudo-policy-plan');assert.deepEqual(calls[0].payload,{actions:['nginx-apply'],passwordless:true});
 f.effects[0]();resolve({text:'fixture',applied:false});await Promise.all([first,second]);assert.equal(f.state[3],null);assert.equal(f.state[4],false);
});
test('sudo GUI successful preview stores review-only plan',async()=>{
 const f=await fixture(async()=>({text:'fixture',applied:false}));await f.click('권한 규칙 미리보기');assert.equal(f.state[3].applied,false);assert.equal(f.state[4],false);
});

test('sudo GUI imports only registered actions from the server allowlist',async()=>{const f=await fixture(async action=>action==='sudo-policy-actions'?{actions:['nginx-apply','service']}:{registered:true,actions:['service'],passwordless:false,version:'a'.repeat(64)});await f.click('현재 sudo 규칙 조회');assert.deepEqual(f.state[1],['service']);assert.equal(f.state[2],false);assert.equal(f.state[6].registered,true);});
test('sudo GUI rejects an unexpected action in the current rule',async()=>{const f=await fixture(async action=>action==='sudo-policy-actions'?{actions:['service']}:{registered:true,actions:['unexpected'],passwordless:true,version:'a'.repeat(64)});await f.click('현재 sudo 규칙 조회');assert.equal(f.state[6],null);assert.match(f.state[5],/확인할 수 없습니다/);});

test('sudo GUI consumes confirmation and submits only reviewed fields once',async()=>{const calls=[];let resolve;const initial=[['service'],['service'],true,{actions:['service'],passwordless:true,version:'b'.repeat(64),text:'reviewed'},false,'',{registered:true,version:'a'.repeat(64)},true,''];const f=await fixture((action,payload)=>{calls.push({action,payload});return new Promise(done=>resolve=done);},initial);const first=f.click('sudo 규칙 적용'),second=f.click('sudo 규칙 적용');assert.equal(calls.length,1);assert.deepEqual(calls[0],{action:'sudo-policy-update',payload:{confirm:true,version:'a'.repeat(64),passwordless:true,actions:['service']}});assert.equal(f.state[7],false);resolve({changed:true});await Promise.all([first,second]);assert.equal(f.state[6],null);assert.equal(f.state[3],null);assert.match(f.state[8],/다시 조회/);});
test('sudo GUI refuses applying without confirmation',async()=>{let calls=0;const f=await fixture(async()=>{calls++;},[['service'],['service'],true,{actions:['service'],passwordless:true,version:'b'.repeat(64),text:'reviewed'},false,'',{registered:true,version:'a'.repeat(64)},false,'']);await f.click('sudo 규칙 적용');assert.equal(calls,0);});

test('sudo GUI password-required result explains web lockout and server recovery',async()=>{
 const initial=[['sudo-policy-inspect','sudo-policy-update'],['sudo-policy-inspect','sudo-policy-update'],false,{actions:['sudo-policy-inspect','sudo-policy-update'],passwordless:false,version:'b'.repeat(64),text:'reviewed'},false,'',{registered:true,version:'a'.repeat(64)},true,''];
 const f=await fixture(async()=>({changed:true,passwordless:false,effectiveAuthorizationVerified:false}),initial);
 await f.click('sudo 규칙 적용');assert.match(f.state[8],/웹 sudo 작업은 차단/);assert.match(f.state[8],/서버 터미널에서 권한을 복구/);assert.equal(f.state[6],null);assert.equal(f.state[3],null);assert.equal(f.state[7],false);
});

test('sudo GUI ignores apply result after saved security policy changes',async()=>{let resolve;const f=await fixture(()=>new Promise(done=>resolve=done),[['service'],['service'],true,{actions:['service'],passwordless:true,version:'b'.repeat(64),text:'reviewed'},false,'',{registered:true,version:'a'.repeat(64)},true,'']);const pending=f.click('sudo 규칙 적용');f.effects[1]();resolve({changed:true});await pending;assert.equal(f.state[8],'');assert.equal(f.state[7],false);assert.equal(f.state[4],false);});
