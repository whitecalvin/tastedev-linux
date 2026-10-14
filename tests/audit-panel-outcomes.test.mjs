import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import {translate} from '../lib/i18n.ts';
import {auditResultLabel} from '../lib/audit-view.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';
import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
test('audit GUI offers and filters recovery outcomes without requesting the server',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/audit-panel.tsx',import.meta.url),'utf8'),{filename:'audit-panel.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[];let si=0,ri=0,locale='ko';const hooks={...React,useState:initial=>{const i=si++;if(!(i in states))states[i]=i===0?['rolled-back','recovery-required','unchanged','invalid','recovered','cancelled','scheduled'].map(result=>({at:'2026-10-03T00:00:00Z',action:'nginx-config-apply',result})):initial;return [states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},useRef:value=>{const i=ri++;return refs[i]??(refs[i]={current:value});},useEffect:()=>{}};
 const native=createRequire(import.meta.url),module={exports:{}};const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>translate(locale,value),locale})}:name==='./ui/controls'?Object.fromEntries(['Button','TextInput','Dropdown'].map(key=>[key,key])):native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const render=()=>{si=ri=0;return module.exports.default({connected:true,api:()=>{throw Error('local audit filtering must not request API');}});};
 const find=(node,predicate)=>{if(!node)return null;if(Array.isArray(node))return node.map(child=>find(child,predicate)).find(Boolean);if(predicate(node))return node;return find(toastTestChildren(node),predicate);};
 for(const result of ['rolled-back','recovery-required','unchanged','invalid','recovered','cancelled','scheduled']){let tree=render();const selector=find(tree,node=>node.props?.label==='작업 결과');assert(selector.props.options.some(option=>option.value===result));selector.props.onChange({target:{value:result}});tree=render();assert(find(tree,node=>node.props?.className==='audit-result'&&node.props.children===auditResultLabel(result)));for(const other of ['rolled-back','recovery-required','unchanged','invalid','recovered','cancelled','scheduled'].filter(value=>value!==result))assert(!find(tree,node=>node.props?.className==='audit-result'&&node.props.children===auditResultLabel(other)));}

 // The component must pass the active language into its local search helper.
 states[2]='';locale='vi-VN';let tree=render();
 const search=find(tree,node=>node.props?.label===translate(locale,'감사 기록 검색'));
 search.props.onChange({target:{value:translate(locale,'복구 완료')}});tree=render();
 assert(find(tree,node=>node.props?.className==='audit-result'&&node.props.children===translate(locale,'복구 완료')));
 assert(!find(tree,node=>node.props?.className==='audit-result'&&node.props.children===translate(locale,'변경 없음')));
 search.props.onChange({target:{value:'not-a-result'}});tree=render();
 assert(!find(tree,node=>node.props?.className==='audit-result'));

});
