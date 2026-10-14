import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import React from 'react';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
test('Node control GUI submits one confirmed operation and balances busy state',async()=>{
 const source=await readFile(new URL('../components/node-service-control.tsx',import.meta.url),'utf8');await loadBindings();const compiled=await transform(source,{filename:'node-service-control.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const state=[null,false,null,''],refs=[];let cursor=0,refCursor=0,effected=false;const hooks={...React,useState:()=>{const index=cursor++;return[state[index],value=>{state[index]=value;}];},useRef:value=>refs[refCursor++]??(refs[refCursor-1]={current:value}),useEffect:fn=>{if(!effected){effected=true;fn();}}};
 const Button=()=>null,native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?{Button}:name==='../lib/capabilities.ts'?{featureAllowed:()=>true,featureReason:()=>''}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const calls=[],events=[];let resolve;const plan={id:'fixture',unit:'tastedev-node-fixture.service',files:[],serviceOptions:{},registryVersion:'a'.repeat(64)};
 const props={connected:true,security:{},plan,onBusy:value=>events.push(value),api:(action,payload)=>{calls.push({action,payload});return new Promise(done=>{resolve=done;});}};
 const render=()=>{cursor=refCursor=0;return module.exports.default(props);};let tree=render();
 const buttons=[];function visit(node){if(!node||typeof node!=='object')return;if(node.type===Button)buttons.push(node);React.Children.forEach(toastTestChildren(node),visit);}visit(tree);buttons.find(item=>item.props['aria-label']==='재시작').props.onClick();tree=render();buttons.length=0;visit(tree);
 const button=buttons.find(item=>item.props.children==='실행 확인');assert(button);const first=button.props.onClick(),second=button.props.onClick();assert.equal(calls.length,1);assert.equal(calls[0].action,'node-app-service-control');assert.equal(calls[0].payload.operation,'restart');assert.equal(calls[0].payload.confirm,true);assert.equal(state[0],null);assert.equal(state[1],true);
 resolve({changed:true,operation:'restart'});await Promise.all([first,second]);assert.equal(state[1],false);assert.equal(state[2].changed,true);assert.deepEqual(events,[true,false]);
});

test('Node degraded control view renders only stop and disable without executing requests',async()=>{
 const {renderToStaticMarkup}=await import('react-dom/server');const source=await readFile(new URL('../components/node-service-control.tsx',import.meta.url),'utf8');await loadBindings();const compiled=await transform(source,{filename:'node-service-control.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?{Button:props=>React.createElement('button',{disabled:props.disabled,'aria-label':props['aria-label']},props.children)}:name==='../lib/capabilities.ts'?{featureAllowed:()=>true,featureReason:()=>''}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const html=renderToStaticMarkup(React.createElement(module.exports.default,{connected:true,security:{},plan:{id:'fixture',registryVersion:'a'.repeat(64),unit:'fixture.service'},stopOnly:true,api:()=>{throw Error('Unexpected request');}}));
 assert(html.includes('aria-label="중지"'));assert(html.includes('aria-label="자동 시작 끄기"'));for(const label of ['시작','재시작','자동 시작 켜기'])assert(!html.includes('aria-label="'+label+'"'));
});
