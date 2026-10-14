import {treeExpansion} from '../lib/nginx-tree-expansion.ts';
import {terminalPreferences} from '../lib/terminal-preferences.ts';
import {terminalScreenCache} from '../lib/terminal-screen-cache.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';

test('session draft clearing immediately releases an installed unsaved-page guard before React rerenders',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/draft-provider.tsx',import.meta.url),'utf8'),{filename:'draft-provider.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 let drafts={editorTabs:[{path:'example.conf',baseline:'original',text:'edited'}]},guard,stateIndex=0,preferencesReady=false;const effects=[];
 const hooks={...React,useState:()=>stateIndex++===0?[drafts,next=>{drafts=typeof next==='function'?next(drafts):next;}]:[preferencesReady,next=>{preferencesReady=next;}],useRef:value=>({current:value}),useCallback:fn=>fn,useEffect:fn=>effects.push(fn)};
 const native=createRequire(import.meta.url),module={exports:{}};
 new Function('require','module','exports',compiled.code)(name=>name==='react'?hooks:native(name),module,module.exports);
 const oldWindow=globalThis.window;
 try{
  globalThis.window={addEventListener:(type,fn)=>{if(type==='beforeunload')guard=fn;},removeEventListener:()=>{}};
  const provider=module.exports.DraftProvider({children:null});effects.forEach(effect=>effect());
  let blocked=false;guard({preventDefault(){blocked=true;}});assert.equal(blocked,true,'normal navigation protects unsaved work');
  let disposed=false;const ticket=terminalScreenCache.generation;assert(terminalScreenCache.put('logout-fixture',{instance:{dispose:()=>{disposed=true;}}},ticket));
  provider.props.value.clear();assert.deepEqual(drafts,{...terminalPreferences({}),nginxTreeExpansion:treeExpansion(null)});assert.equal(disposed,true);assert.equal(terminalScreenCache.take('logout-fixture'),null);assert.equal(terminalScreenCache.put('late-cleanup',{},ticket),false,'old terminal cleanup cannot restore screen data after logout');
  blocked=false;guard({preventDefault(){blocked=true;}});assert.equal(blocked,false,'expired session navigation must not be blocked by the old guard');
 }finally{globalThis.window=oldWindow;}
});

test('the installed leave guard follows edited and saved drafts before passive effects, and works after logout',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/draft-provider.tsx',import.meta.url),'utf8'),{filename:'draft-provider.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 let drafts={},guard,refIndex=0,stateIndex=0,preferencesReady=false;const refs=[],effects=[];
 const hooks={...React,useState:()=>stateIndex++===0?[drafts,next=>{drafts=typeof next==='function'?next(drafts):next;}]:[preferencesReady,next=>{preferencesReady=next;}],useRef:value=>refs[refIndex++]??(refs[refIndex-1]={current:value}),useCallback:fn=>fn,useEffect:fn=>effects.push(fn)};
 const native=createRequire(import.meta.url),module={exports:{}};
 new Function('require','module','exports',compiled.code)(name=>name==='react'?hooks:native(name),module,module.exports);
 const oldWindow=globalThis.window;
 try{
  let installs=0;globalThis.window={addEventListener:(type,fn)=>{if(type==='beforeunload'){guard=fn;installs++;}},removeEventListener:()=>{}};
  const render=()=>{refIndex=0;stateIndex=0;effects.length=0;return module.exports.DraftProvider({children:null}).props.value;};
  let context=render();effects.forEach(effect=>effect());const blocked=()=>{let result=false;const event={preventDefault(){result=true;}};guard(event);return result;};assert.equal(blocked(),false);
  context.update('packageIdeCodeRecords',{redis:{text:'edited',baseline:'original'}},{},context.generation);context=render();assert.equal(blocked(),true,'newly edited drafts must protect the next browser event before passive effects run');
  context.update('packageIdeCodeRecords',{redis:{text:'edited',baseline:'edited'}},{},context.generation);context=render();assert.equal(blocked(),false,'a successful save releases the existing guard immediately');
  context.update('packageIdeCodeRecords',{redis:{text:'again',baseline:'edited'}},{},context.generation);context=render();assert.equal(blocked(),true);context.clear();assert.equal(blocked(),false,'logout clears protection before rendering');context=render();
  context.update('editorTabs',[{text:'new-session-edit',baseline:'original'}],[],context.generation);context=render();assert.equal(blocked(),true,'the next session is protected by the same listener');assert.equal(installs,1);
 }finally{globalThis.window=oldWindow;}
});
