import {toastTestModule,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
test('Redis graph GUI renders disconnected and connected manual controls without requesting data during render',async()=>{
 const source=await readFile(new URL('../components/redis-topology.tsx',import.meta.url),'utf8');await loadBindings();
 const compiled=await transform(source,{filename:'redis-topology.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?{Button:props=>React.createElement('button',{disabled:props.disabled},props.children),Badge:props=>React.createElement('span',null,props.children)}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 for(const connected of [false,true]){
  const html=renderToStaticMarkup(React.createElement(module.exports.default,{connected,api:()=>{throw Error('Unexpected API call during render');}}));
  assert(html.includes('Redis include 연결'));assert(html.includes('include 연결 조회'));assert.equal(html.includes('disabled=""'),!connected);
 }
});

test('Redis tree reload clears previous data and selection before a failed request',async()=>{
 const source=await readFile(new URL('../components/redis-topology.tsx',import.meta.url),'utf8');await loadBindings();
 const compiled=await transform(source,{filename:'redis-topology.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const state=[{root:'/old/redis.conf',files:[],edges:[],warnings:[]},false,'','/old/redis.conf'];let cursor=0;
 const hooks={...React,useState:()=>{const index=cursor++;return [state[index],value=>{state[index]=typeof value==='function'?value(state[index]):value;}];},useRef:()=>({current:0}),useEffect:()=>{}};
 const Button=()=>null,native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?{Button,Badge:()=>null}:name==='../lib/redis-config-tree.ts'?{redisConfigTree:()=>null,redisFileDetails:()=>null}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 let reject;const pending=new Promise((resolve,rejectRequest)=>{reject=rejectRequest;});
 const tree=module.exports.default({connected:true,api:()=>pending});
 const button=tree.props.children[0].props.children.find(child=>child.type===Button);
 const loading=button.props.onClick();
 assert.equal(state[0],null);assert.equal(state[3],null);assert.equal(state[1],true);
 reject(new Error('Fixture unavailable'));await loading;
 assert.equal(state[0],null);assert.equal(state[3],null);assert.equal(state[1],false);assert.equal(state[2],'Fixture unavailable');
});
