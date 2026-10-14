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
 const compiled=await transform(await readFile(new URL('../components/nginx-apply-panel.tsx',import.meta.url),'utf8'),{filename:'nginx-apply-panel.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],effects=[],pending=[],module={exports:{}};let si=0,ri=0,ei=0;
 const hooks={...React,useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return[states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},useRef:initial=>{const i=ri++;return refs[i]??(refs[i]={current:initial});},useEffect:(fn,deps)=>{const i=ei++;if(!effects[i]||deps.some((value,j)=>value!==effects[i].deps[j]))pending.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,fn,cleanup:fn()};});}};
 new Function('require','module','exports',compiled.code)(name=>name==='./console-types'?consoleTypes:name==='./ui/toast-provider'?toastTestModuleWithReact(hooks,true):name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button:()=>null,Dropdown:()=>null,Badge:()=>null,Checkbox:()=>null,TextInput:()=>null}:name==='./nginx-apply-panel'?{__esModule:true,default:()=>null}:native(name),module,module.exports);
 const nodes=tree=>!tree||typeof tree!=='object'?[]:[tree,...React.Children.toArray(toastTestChildren(tree)).flatMap(nodes)];
 return{props,render(){si=ri=ei=0;const tree=module.exports.default(props);while(pending.length)pending.shift()();return nodes(tree);},replay(){for(const effect of effects){effect.cleanup?.();effect.cleanup=effect.fn();}},dispose(){for(const effect of effects)effect.cleanup?.();}};
}
const baseline='events {}';
const version='0'.repeat(64),graphVersion='a'.repeat(64);
for(const restore of [false,true])test('nginx '+(restore?'restore':'apply')+' rollback is an alert, retains failed result, and cannot reuse its confirmation',async()=>{
 const {createHash}=await import('node:crypto');const hash=createHash('sha256').update(baseline).digest('hex');let writes=0,refreshes=0;
 const api=async action=>{if(action==='nginx-context')return{graph:{complete:true,version:graphVersion,files:[{path:'/etc/nginx/nginx.conf',version:hash}]},service:{ready:true,pid:12,start:'34'}};writes++;return{failed:true,restored:true,recovered:true};};
 const view=await fixture({api,connected:true,allowed:true,path:'/etc/nginx/nginx.conf',text:'events { worker_connections 64; }',baseline,restorePlan:restore?{backupId:'fixture',version:hash,graphVersion,includeComplete:true}:undefined,onApplied:()=>refreshes++});
 view.render();await view.render().find(node=>node.props?.children==='설정·서비스 검토').props.onClick();
 view.render().find(node=>node.props?.label==='설정 변경, locale 및 nginx reload 영향을 검토했습니다.').props.onChange({target:{checked:true}});
 const apply=view.render().find(node=>node.props?.children==='검사 후 적용');await apply.props.onClick();await apply.props.onClick();assert.equal(writes,1);assert.equal(refreshes,0);
 const expected=restore?'백업 복원에 실패하여 원본 설정을 복원하고 서비스를 복구했습니다.':'설정 적용에 실패하여 원본 설정을 복원하고 서비스를 복구했습니다.';
 assert(view.render().some(node=>node.props?.role==='alert'&&node.props.children===expected));view.props.api=()=>Promise.reject(Error('new connection'));assert(!view.render().some(node=>node.props?.role==='alert'));view.dispose();
});
