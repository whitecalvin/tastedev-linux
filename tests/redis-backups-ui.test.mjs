import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';
import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
test('Redis backup GUI locks duplicate requests before React rerenders',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/redis-backups.tsx',import.meta.url),'utf8'),{filename:'redis-backups.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const state=[null,false,'','old-backup'];let cursor=0,calls=0,resolve;
 const hooks={...React,useState:initial=>{const index=cursor++;if(!(index in state))state[index]=typeof initial==='function'?initial():initial;return [state[index],value=>state[index]=typeof value==='function'?value(state[index]):value];},useRef:value=>({current:value}),useEffect:()=>{}};
 const Button=()=>null,native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./ui/controls'?{Button}:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./redis-restore-plan'?{default:()=>null}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const tree=module.exports.default({connected:true,security:{settings:{sudoWithoutPrompt:true},available:{databaseChanges:true},privilege:{ready:true}},api:()=>{calls++;return new Promise(done=>resolve=done);}});
 const button=React.Children.toArray(toastTestChildren(tree)).find(node=>node?.type===Button);
 const first=button.props.onClick();await button.props.onClick();assert.equal(calls,1);assert.equal(state[3],null);
 resolve({backups:[],warnings:0,truncated:false});await first;
 assert.equal(state[1],false);assert.deepEqual(state[0].backups,[]);
});
