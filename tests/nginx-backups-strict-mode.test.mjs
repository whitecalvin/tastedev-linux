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
 const compiled=await transform(await readFile(new URL('../components/nginx-backups-panel.tsx',import.meta.url),'utf8'),{filename:'nginx-backups-panel.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],effects=[],pending=[],module={exports:{}};let si=0,ri=0,ei=0;
 const hooks={...React,useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return[states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},useRef:initial=>{const i=ri++;return refs[i]??(refs[i]={current:initial});},useEffect:(fn,deps)=>{const i=ei++;if(!effects[i]||deps.some((value,j)=>value!==effects[i].deps[j]))pending.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,fn,cleanup:fn()};});}};
 new Function('require','module','exports',compiled.code)(name=>name==='./console-types'?consoleTypes:name==='./ui/toast-provider'?toastTestModuleWithReact(hooks):name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button:()=>null,Dropdown:()=>null,Badge:()=>null,Checkbox:()=>null}:name==='./nginx-apply-panel'?{__esModule:true,default:()=>null}:native(name),module,module.exports);
 const nodes=tree=>!tree||typeof tree!=='object'?[]:[tree,...React.Children.toArray(toastTestChildren(tree)).flatMap(nodes)];
 return{props,render(){si=ri=ei=0;const tree=module.exports.default(props);while(pending.length)pending.shift()();return nodes(tree);},replay(){for(const effect of effects){effect.cleanup?.();effect.cleanup=effect.fn();}},dispose(){for(const effect of effects)effect.cleanup?.();}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const row=id=>({id,target:'/etc/nginx/conf.d/reviewed.conf',createdAt:'2026-10-08'});
const catalogContains=(view,id)=>view.render().some(node=>node.props?.label==='복구할 백업'&&node.props.options.some(option=>option.value===id));
test('nginx automatic backup catalog Strict Mode replay sends one request and displays the result',async()=>{
 let resolve,calls=0;const api=action=>{assert.equal(action,'nginx-config-backups');calls++;return new Promise(done=>resolve=done);};
 const view=await fixture({api,connected:true,allowed:true,expanded:true});view.render();view.replay();assert.equal(calls,1);resolve({backups:[row('first')]});await settle();assert(catalogContains(view,'first'));
 const manual=view.render().find(node=>node.props?.['aria-label']==='백업 목록 조회');const pending=manual.props.onClick();assert.equal(calls,2);resolve({backups:[row('manual')]});await pending;assert(catalogContains(view,'manual'));view.dispose();
});
test('nginx backup catalog connection change discards old automatic responses and queries the new context once',async()=>{
 let oldResolve,newResolve,oldCalls=0,newCalls=0;const view=await fixture({api:()=>{oldCalls++;return new Promise(done=>oldResolve=done);},connected:true,allowed:true,expanded:true});
 view.render();view.replay();view.props.api=()=>{newCalls++;return new Promise(done=>newResolve=done);};view.render();view.replay();assert.equal(oldCalls,1);assert.equal(newCalls,1);
 oldResolve({backups:[row('old')]});await settle();assert(!catalogContains(view,'old'));newResolve({backups:[row('new')]});await settle();assert(catalogContains(view,'new'));view.dispose();
});
