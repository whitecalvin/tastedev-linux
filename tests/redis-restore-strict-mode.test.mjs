import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {createRequire} from 'node:module';
const native=createRequire(import.meta.url);
import {readFile} from 'node:fs/promises';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';

async function fixture(props){
 await loadBindings();
 const compiled=await transform(await readFile(new URL('../components/redis-restore-plan.tsx',import.meta.url),'utf8'),{filename:'redis-restore-plan.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],effects=[],pending=[],module={exports:{}};let si=0,ri=0,ei=0;
 const hooks={...React,useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return[states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},useRef:initial=>{const i=ri++;return refs[i]??(refs[i]={current:initial});},useEffect:(fn,deps)=>{const i=ei++;if(!effects[i]||deps.some((value,j)=>value!==effects[i].deps[j]))pending.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,fn,cleanup:fn()};});}};
 new Function('require','module','exports',compiled.code)(name=>name==='./console-types'?consoleTypes:name==='./ui/toast-provider'?toastTestModuleWithReact(hooks):name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button:()=>null}:name==='./redis-operation'?{__esModule:true,default:()=>null}:native(name),module,module.exports);
 const nodes=tree=>!tree||typeof tree!=='object'?[]:[tree,...React.Children.toArray(toastTestChildren(tree)).flatMap(nodes)];
 return{props,render(){si=ri=ei=0;const tree=module.exports.default(props);while(pending.length)pending.shift()();return nodes(tree);},replay(){for(const effect of effects){effect.cleanup?.();effect.cleanup=effect.fn();}},dispose(){for(const effect of effects)effect.cleanup?.();}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const plan=id=>({id,target:'/etc/redis/redis.conf',notice:'검토',fields:[],warnings:[],changed:true});
test('Redis restore Strict Mode replay shares one pending request and renders its result',async()=>{
 let resolve,calls=0;const view=await fixture({id:'one',connected:true,api:()=>{calls++;return new Promise(done=>resolve=done);}});
 view.render();view.replay();assert.equal(calls,1);resolve(plan('one'));await settle();
 assert(view.render().some(node=>node.props?.children==='/etc/redis/redis.conf'));view.dispose();
});
test('Redis restore context changes request a new plan and discard the previous response',async()=>{
 const resolves=[],calls=[];const view=await fixture({id:'one',connected:true,api:action=>{calls.push(action);return new Promise(done=>resolves.push(done));}});
 view.render();view.replay();view.props.id='two';view.render();view.replay();assert.deepEqual(calls,['redis-restore-plan?id=one','redis-restore-plan?id=two']);
 resolves[0](plan('one'));await settle();assert(!view.render().some(node=>node.props?.children==='/etc/redis/redis.conf'));
 resolves[1](plan('two'));await settle();assert(view.render().some(node=>node.props?.children==='/etc/redis/redis.conf'));view.dispose();
});
