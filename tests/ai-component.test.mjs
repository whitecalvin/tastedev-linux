import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
test('AI assistant renders without an explicit source or accessing API during render',async()=>{
 const source=await readFile(new URL('../components/ai-log-assistant.tsx',import.meta.url),'utf8');
 await loadBindings();
 const compiled=await transform(source,{filename:'ai-log-assistant.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?Object.fromEntries(['Button','Checkbox','TextInput','Badge'].map(key=>[key,props=>React.createElement('div',null,props.label||props.children)])):native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const html=renderToStaticMarkup(React.createElement(module.exports.default,{connected:true,api:()=>{throw new Error('API called during render');}}));
 assert(html.includes('AI 오류 해결 도우미'));assert(html.includes('분석 로그 소스'));
});
test('AI assistant ignores late connection responses and errors after disconnect or source change',async()=>{
 const source=await readFile(new URL('../components/ai-log-assistant.tsx',import.meta.url),'utf8');await loadBindings();const compiled=await transform(source,{filename:'ai-log-assistant.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],effects=[];let stateIndex=0,refIndex=0,effectIndex=0;const pending=[];
 const hooks={useState:initial=>{const i=stateIndex++;if(!(i in states))states[i]=initial;return [states[i],value=>{states[i]=typeof value==='function'?value(states[i]):value;}];},useRef:initial=>{const i=refIndex++;return refs[i]??(refs[i]={current:initial});},useEffect:(fn,deps)=>{const i=effectIndex++;if(!effects[i]||deps.some((value,k)=>value!==effects[i].deps[k]))pending.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,cleanup:fn()};});}};
 const native=createRequire(import.meta.url),module={exports:{}};const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?Object.fromEntries(['Button','Checkbox','TextInput','Badge'].map(key=>[key,key])):native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const render=props=>{stateIndex=refIndex=effectIndex=0;const tree=module.exports.default(props);while(pending.length)pending.shift()();return tree;};
 const find=(tree,label)=>{if(!tree)return null;if(Array.isArray(tree))return tree.map(child=>find(child,label)).find(Boolean);if(tree.props?.children===label)return tree;return find(toastTestChildren(tree),label);};
 let resolve,reject;const api=()=>new Promise((yes,no)=>{resolve=yes;reject=no;});let props={connected:true,text:'old log',source:'old-app',api};render(props);let tree=render(props);const request=find(tree,'AI 연결 상태 확인').props.onClick();assert.equal(states[4],true);
 props={...props,connected:false};render(props);resolve({enabled:true,configured:true});await request;assert.equal(states[0],null);assert.equal(states[4],false);
 props={...props,connected:true};render(props);tree=render(props);const failed=find(tree,'현재 오류 로그 불러오기').props.onClick();props={...props,text:'new log',source:'new-app'};render(props);reject(Error('old request error'));await failed;assert.equal(states[1],'');assert.equal(states[2],'new-app');assert.equal(states[5],'');assert.equal(states[4],false);
 for(const effect of effects)effect?.cleanup?.();
});

async function assistantFixture(){
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/ai-log-assistant.tsx',import.meta.url),'utf8'),{filename:'ai-log-assistant.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],effects=[],pending=[];let si=0,ri=0,ei=0;
 const hooks={useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return [states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},useRef:initial=>{const i=ri++;return refs[i]??(refs[i]={current:initial});},useEffect:(fn,deps)=>{const i=ei++;if(!effects[i]||deps.some((value,k)=>value!==effects[i].deps[k]))pending.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,cleanup:fn()};});}};
 const native=createRequire(import.meta.url),module={exports:{}};const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?Object.fromEntries(['Button','Checkbox','TextInput','Badge'].map(key=>[key,key])):native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const flush=()=>{while(pending.length)pending.shift()();},render=(props,runEffects=true)=>{si=ri=ei=0;const tree=module.exports.default(props);if(runEffects)flush();return tree;};
 function find(node,label){if(!node||typeof node!=='object')return;if(node.props?.children===label||node.props?.label===label)return node;for(const child of React.Children.toArray(toastTestChildren(node))){const found=find(child,label);if(found)return found;}}
 return {states,render,flush,find,dispose:()=>effects.forEach(effect=>effect?.cleanup?.())};
}
test('AI analysis is single-flight and ignores a replaced API before reset effects run',async()=>{
 const f=await assistantFixture();try{
  const calls=[];let resolve;const oldApi=(action,payload)=>{calls.push({action,payload});return new Promise(yes=>resolve=yes);},nextApi=async()=>({enabled:true,configured:true});let props={api:oldApi,connected:true,text:'original log',source:'original service'};f.render(props);f.states[0]={enabled:true,configured:true};f.states[1]='reviewed fixture log';f.states[3]=true;
  const button=f.find(f.render(props),'원인 및 해결 방법 분석'),request=button.props.onClick();await button.props.onClick();assert.equal(calls.length,1,'the reviewed log must only be submitted once');assert.equal(f.states[4],true);
  props={...props,api:nextApi};const beforeReset=f.render(props,false);assert.equal(f.find(beforeReset,'원인 및 해결 방법 분석').props.disabled,true,'new scope cannot send an old reviewed draft before reset');await f.find(beforeReset,'원인 및 해결 방법 분석').props.onClick();assert.equal(calls.length,1);resolve({model:'fixture',analysis:'old connection response'});await request;assert.equal(f.states[6],null,'a stale response cannot enter the new connection even before effects');await button.props.onClick();assert.equal(calls.length,1,'a retained old-connection handler cannot submit');f.flush();assert.equal(f.states[0],null);assert.equal(f.states[4],false);assert.equal(f.states[1],'');
 }finally{f.dispose();}
});
test('editing an analysis source clears its old result and invalidates retained consent',async()=>{
 const f=await assistantFixture();try{
  const calls=[],props={api:async(action,payload)=>{calls.push({action,payload});return {model:'fixture',analysis:'updated source response'};},connected:true,text:'same log',source:'original'};f.render(props);f.states[0]={enabled:true,configured:true,version:'fixture-version'};f.states[1]='reviewed fixture log';f.states[3]=true;f.states[6]={model:'fixture',analysis:'original source response'};
  const tree=f.render(props),old=f.find(tree,'원인 및 해결 방법 분석');f.find(tree,'분석 로그 소스').props.onChange({target:{value:'edited source'}});assert.equal(f.states[6],null);assert.equal(f.states[3],false);await old.props.onClick();assert.equal(calls.length,0,'editing must revoke approval of the old source');
  f.find(f.render(props),'위 로그를 검토했으며 설정한 AI 업체로 전송하는 데 동의합니다.').props.onChange({target:{checked:true}});await f.find(f.render(props),'원인 및 해결 방법 분석').props.onClick();assert.deepEqual(calls,[{action:'ai-analyze',payload:{text:'reviewed fixture log',source:'edited source',confirm:true,configVersion:'fixture-version'}}]);assert.equal(f.states[6].analysis,'updated source response');assert.equal(f.states[3],false);
 }finally{f.dispose();}
});
test('late AI preview rejection from a replaced log does not appear in the next log',async()=>{
 const f=await assistantFixture();try{
  let reject;const api=()=>new Promise((_,no)=>reject=no);let props={api,connected:true,text:'first log',source:'first service'};f.render(props);const button=f.find(f.render(props),'현재 오류 로그 불러오기'),request=button.props.onClick();props={...props,text:'second log',source:'second service'};f.render(props,false);reject(Error('obsolete failure'));await request;assert.equal(f.states[5],'');f.flush();assert.equal(f.states[1],'');assert.equal(f.states[2],'second service');assert.equal(f.states[4],false);
 }finally{f.dispose();}
});
