import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {configDefaults,configSchemas} from '../lib/config-schema.ts';
import {nodeEnvSavedSnapshot} from '../lib/node-env-outcome.ts';
test('Restoration invalidates a pending environment request without leaving loading stuck or accepting stale values',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/node-workspace-env.tsx',import.meta.url),'utf8'),{filename:'node-workspace-env.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 let index=0,effectIndex=0,queued=[];const effects=[];let resolve;const state=[],pending=new Promise(done=>resolve=done),native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?{useEffect:(fn,deps)=>{const i=effectIndex++,old=effects[i];if(!old||deps.some((value,j)=>!Object.is(value,old.deps[j])))queued.push(()=>{old?.cleanup?.();effects[i]={deps,cleanup:fn()};});},useState:initial=>{const key=index++;if(!(key in state))state[key]=initial;return [state[key],value=>state[key]=value];},useRef:initial=>{const key=index++;if(!(key in state))state[key]={current:initial};return state[key];}}:name==='./node-env-backups'?{__esModule:true,default:'backup-panel'}:name==='./ui/controls'?{Button:'button',TextInput:'input'}:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='../lib/config-schema.ts'?{configSchemas}:name==='../lib/capabilities.ts'?{featureAllowed:()=>true}:name==='../lib/node-env-outcome.ts'?{nodeEnvSavedSnapshot}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const api=()=>pending;const render=()=>{index=effectIndex=0;const tree=module.exports.default({connected:true,draft:configDefaults('nodejs'),api});const pendingEffects=queued;queued=[];pendingEffects.forEach(fn=>fn());return tree;};
 function nodes(tree){if(!tree||typeof tree!=='object')return [];if(Array.isArray(tree))return tree.flatMap(nodes);return [tree,...nodes(toastTestChildren(tree))];}
 const find=(tree,type,label)=>nodes(tree).find(node=>node.type===type&&(!label||node.props.children===label));
 let tree=render();find(tree,'input').props.onChange({target:{value:'app.env'}});tree=render();const request=find(tree,'button','환경 파일 조회').props.onClick();tree=render();assert.equal(find(tree,'input').props.disabled,true);find(tree,'backup-panel').props.onRestored();tree=render();assert.equal(find(tree,'input').props.disabled,false);resolve({name:'app.env',values:{port:9999},version:'a'.repeat(64)});await request;tree=render();assert.equal(find(tree,'input').props.disabled,false);assert(!JSON.stringify(tree).includes('9999'));assert.equal(find(tree,'button','GUI 값을 파일에 저장'),undefined);
});


test('workspace environment import rejection retains the file snapshot and displays the rejection',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/node-workspace-env.tsx',import.meta.url),'utf8'),{filename:'node-workspace-env.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 let index=0,effectIndex=0,queued=[];const effects=[];let rejection='지원 환경 변수에 중복 항목이 있습니다.';const state=[],native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?{useEffect:(fn,deps)=>{const i=effectIndex++,old=effects[i];if(!old||deps.some((value,j)=>!Object.is(value,old.deps[j])))queued.push(()=>{old?.cleanup?.();effects[i]={deps,cleanup:fn()};});},useState:initial=>{const key=index++;if(!(key in state))state[key]=initial;return[state[key],value=>state[key]=value];},useRef:initial=>{const key=index++;if(!(key in state))state[key]={current:initial};return state[key];}}:name==='./node-env-backups'?{__esModule:true,default:'backup-panel'}:name==='./ui/controls'?{Button:'button',TextInput:'input'}:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='../lib/config-schema.ts'?{configSchemas}:name==='../lib/capabilities.ts'?{featureAllowed:()=>true}:name==='../lib/node-env-outcome.ts'?{nodeEnvSavedSnapshot}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const api=async()=>({name:'app.env',values:{port:9999},version:'a'.repeat(64)});const render=()=>{index=effectIndex=0;const tree=module.exports.default({connected:true,draft:configDefaults('nodejs'),api,onImport:()=>rejection});const pendingEffects=queued;queued=[];pendingEffects.forEach(fn=>fn());return tree;};
 function nodes(tree){if(!tree||typeof tree!=='object')return[];if(Array.isArray(tree))return tree.flatMap(nodes);return[tree,...nodes(toastTestChildren(tree))];}
 const find=(tree,type,label)=>nodes(tree).find(node=>node.type===type&&(!label||node.props.children===label));
 let tree=render();find(tree,'input').props.onChange({target:{value:'app.env'}});tree=render();await find(tree,'button','환경 파일 조회').props.onClick();tree=render();find(tree,'button','폼에 반영').props.onClick();tree=render();assert(nodes(tree).some(node=>node.props?.role==='alert'&&node.props.children===rejection));assert(JSON.stringify(tree).includes('9999'));assert(find(tree,'button','폼에 반영'));rejection='';find(tree,'button','폼에 반영').props.onClick();tree=render();assert(!nodes(tree).some(node=>node.props?.role==='alert'));assert(JSON.stringify(tree).includes('9999'));
});
