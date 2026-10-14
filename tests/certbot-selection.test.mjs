import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {loadBindings,transform} from 'next/dist/build/swc/index.js';

test('Certbot detail retains its tree selection until a completed inventory proves removal',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/server-manager.tsx',import.meta.url),'utf8'),{filename:'server-manager.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],effects=[],pending=[];let si=0,ri=0,ei=0;
 const hooks={...React,useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return[states[i],next=>states[i]=typeof next==='function'?next(states[i]):next];},useRef:initial=>{const i=ri++;return refs[i]??(refs[i]={current:initial});},useCallback:fn=>fn,useEffect:(fn,deps)=>{const i=ei++;if(!effects[i]||deps.some((value,k)=>value!==effects[i].deps[k]))pending.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,cleanup:fn()};});}};
 const native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./draft-provider'?{useDraftState:(_key,value)=>hooks.useState(value)}:name==='./language-provider'?{useLanguage:()=>({t:value=>value,locale:'ko'})}:name==='./ui/controls'?Object.fromEntries(['Button','TextInput','Dropdown','Checkbox','Switch','Progress','Badge'].map(key=>[key,key])):name.startsWith('./')?{__esModule:true,default:'child'}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const calls=[],resolvers=[];const props={connected:true,requestedTab:'certbot',requestedCertificate:{operation:'renew-check',name:'selected.example-0001'},api:(...args)=>{calls.push(args);return new Promise(resolve=>resolvers.push(resolve));}};
 const render=()=>{si=ri=ei=0;const tree=module.exports.default(props);while(pending.length)pending.shift()();return tree;};
 const nodes=tree=>!tree||typeof tree!=='object'?[]:[tree,...React.Children.toArray(toastTestChildren(tree)).flatMap(nodes)];
 const settle=()=>{render();render();return nodes(render());};
 let tree=settle();const target=()=>tree.find(node=>node.props?.label==='갱신 테스트 대상');
 assert.equal(target().props.value,'selected.example-0001','unloaded inventory is not evidence of deletion');assert(target().props.options.some(option=>option.value==='selected.example-0001'),'pending inventory still displays the explicit target');assert.equal(calls.length,0);
 props.certificatesSnapshot=[{name:'selected.example-0001',status:'valid'},{name:'other.example',status:'valid'}];tree=settle();assert.equal(target().props.value,'selected.example-0001');assert(target().props.options.some(option=>option.value==='other.example'));assert.deepEqual(tree.filter(node=>node.props?.className==='live-site').map(node=>React.Children.toArray(toastTestChildren(node)).find(child=>child.type==='strong').props.children),['selected.example-0001'],'IDE detail shows only the selected certificate while retaining all dropdown choices');
 const plan=tree.find(node=>node.props?.children==='연계 명령 검토').props.onClick();assert.deepEqual(calls.at(-1)[1].certName,'selected.example-0001');resolvers.at(-1)({command:['/usr/bin/certbot','renew','--dry-run','--cert-name','selected.example-0001']});await plan;
 props.certificatesSnapshot=[{name:'other.example',status:'valid'}];tree=settle();assert.equal(target().props.value,'__select__');assert.equal(tree.find(node=>node.props?.children==='연계 명령 검토').props.disabled,true,'removal must never broaden the request to every certificate');
 props.requestedCertificate={operation:'renew-check',name:'other.example'};tree=settle();assert.equal(target().props.value,'other.example');
 props.requestedTab='nginx';settle();assert.deepEqual(calls.slice(-2).map(item=>item[0]),['nginx-live','nginx-tree'],'a certificate snapshot must not suppress nginx loading');resolvers.at(-2)({sites:[]});resolvers.at(-1)({files:[],warnings:[]});await new Promise(resolve=>setImmediate(resolve));
 for(const effect of effects)effect?.cleanup?.();
});
