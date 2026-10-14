import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';
import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {featureAllowed,featureReason} from '../lib/capabilities.ts';
test('Redis apply GUI binds reviewed fields, locks duplicate requests and rejects stale output',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/redis-operation.tsx',import.meta.url),'utf8'),{filename:'redis-operation.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const state=[true,false,null,''],effects=[];let index=0,calls=0,resolve;
 const hooks={...React,useState:initial=>{const at=index++;if(!(at in state))state[at]=initial;return[state[at],value=>state[at]=value];},useRef:value=>({current:value}),useEffect:effect=>effects.push(effect)};
 const Button=()=>null,Checkbox=()=>null,native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./ui/controls'?{Button,Checkbox}:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name.includes('capabilities')?{featureAllowed,featureReason}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const plan={path:'/etc/redis/redis.conf',version:'a'.repeat(64),graphVersion:'b'.repeat(64),fields:[{key:'port',after:6380}]};
 const tree=module.exports.default({plan,connected:true,security:{settings:{readOnly:false,databaseChanges:true,sudoWithoutPrompt:true},available:{databaseChanges:true},privilege:{ready:true}},api:(action,payload)=>{calls++;assert.equal(action,'redis-config-apply');assert.deepEqual(payload,{path:plan.path,version:plan.version,graphVersion:plan.graphVersion,changes:{port:6380},confirm:true});return new Promise(done=>resolve=done);}});
 const button=React.Children.toArray(toastTestChildren(tree)).find(node=>node?.type===Button);
 React.Children.toArray(toastTestChildren(tree)).find(node=>node?.type===Checkbox).props.onChange({target:{checked:true}});
 const pending=button.props.onClick();await button.props.onClick();assert.equal(calls,1);
 const cleanup=effects[0]();cleanup();resolve({changed:true});await pending;assert.equal(state[2],null);assert.equal(state[1],false);
});

test('Redis restore GUI binds backup and include graph identities and locks duplicate requests',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/redis-operation.tsx',import.meta.url),'utf8'),{filename:'redis-operation.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const state=[true,false,null,''],effects=[];let index=0,calls=0,resolve;
 const hooks={...React,useState:initial=>{const at=index++;if(!(at in state))state[at]=initial;return[state[at],value=>state[at]=value];},useRef:value=>({current:value}),useEffect:effect=>effects.push(effect)};
 const Button=()=>null,Checkbox=()=>null,native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./ui/controls'?{Button,Checkbox}:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name.includes('capabilities')?{featureAllowed,featureReason}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const plan={id:'12345678-1234-4123-8123-123456789abc',changed:true,version:'a'.repeat(64),graphVersion:'b'.repeat(64),backupVersion:'c'.repeat(64),restoreGraphVersion:'d'.repeat(64)};
 const tree=module.exports.default({plan,restore:true,connected:true,security:{settings:{readOnly:false,databaseChanges:true,sudoWithoutPrompt:true},available:{databaseChanges:true},privilege:{ready:true}},api:(action,payload)=>{calls++;assert.equal(action,'redis-config-restore');assert.deepEqual(payload,{id:plan.id,version:plan.version,graphVersion:plan.graphVersion,backupVersion:plan.backupVersion,restoreGraphVersion:plan.restoreGraphVersion,confirm:true});return new Promise(done=>resolve=done);}});
 const button=React.Children.toArray(toastTestChildren(tree)).find(node=>node?.type===Button);
 React.Children.toArray(toastTestChildren(tree)).find(node=>node?.type===Checkbox).props.onChange({target:{checked:true}});
 const pending=button.props.onClick();await button.props.onClick();assert.equal(calls,1);
 const cleanup=effects[0]();cleanup();resolve({changed:true});await pending;assert.equal(state[2],null);assert.equal(state[1],false);
});
