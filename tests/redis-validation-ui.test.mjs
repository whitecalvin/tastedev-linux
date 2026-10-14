import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';
import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {featureAllowed,featureReason} from '../lib/capabilities.ts';
test('Redis validation GUI submits reviewed fields once and discards response after input invalidation',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/redis-validation.tsx',import.meta.url),'utf8'),{filename:'redis-validation.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const state=[true,false,null,''],effects=[];let index=0,calls=0,resolve;
 const hooks={...React,useState:()=>{const at=index++;return[state[at],value=>state[at]=value];},useRef:value=>({current:value}),useEffect:effect=>effects.push(effect)};
 const Button=()=>null,native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./ui/controls'?{Button,Checkbox:()=>null}:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name.includes('capabilities')?{featureAllowed,featureReason}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const plan={path:'/etc/redis/redis.conf',version:'a'.repeat(64),graphVersion:'b'.repeat(64),fields:[{key:'port',after:6380}]};
 const tree=module.exports.default({plan,connected:true,security:{settings:{readOnly:false,databaseChanges:true,sudoWithoutPrompt:true},available:{databaseChanges:true},privilege:{ready:true}},api:(action,payload)=>{calls++;assert.equal(action,'redis-config-validate');assert.deepEqual(payload,{path:plan.path,version:plan.version,graphVersion:plan.graphVersion,changes:{port:6380},confirm:true});return new Promise(done=>resolve=done);}});
 const button=React.Children.toArray(toastTestChildren(tree)).find(node=>node?.type===Button);
 const pending=button.props.onClick();await button.props.onClick();assert.equal(calls,1);
 const cleanup=effects[0]();cleanup();resolve({valid:true});await pending;assert.equal(state[2],null);assert.equal(state[1],false);
});
