import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import * as packageIdeTypes from '../components/package-ide-types.ts';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {terminalEventResponse} from '../lib/terminal-events.ts';

test('a revoked terminal stream closes client streams and navigates through the shared API to login without replaying a shell',async()=>{
 await loadBindings();const native=createRequire(import.meta.url),noop=()=>null;
 async function compile(name,require){
  const result=await transform(await readFile(new URL('../components/'+name,import.meta.url),'utf8'),{filename:name,jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
  const module={exports:{}};new Function('require','module','exports',result.code)(require,module,module.exports);return module.exports.default;
 }
 const job={id:'fixture-shell',status:'running',pty:true,stdinOpen:true,logSequence:1,logs:[{sequence:1,text:'retained output'}]};
 const drafts={consoleStatus:{hostname:'fixture',packages:[],job:null},consoleSecurity:{settings:{readOnly:false},available:{}},terminalTabs:[{id:'tab',label:'Terminal 1',job}],terminalActive:'tab'};
 const setter=(key,initial)=>[drafts[key]??initial,next=>drafts[key]=typeof next==='function'?next(drafts[key]??initial):next];
 const errors=[],redirects=[],requests=[],timers=new Map(),sources=[];let serial=0,cleared=0;
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch;
 const marker=()=>null;
 class Source{constructor(url){this.url=url;this.handlers={};sources.push(this);}addEventListener(name,fn){this.handlers[name]=fn;}close(){this.closed=true;}}
 const consoleStates=[];let ci=0;const consoleHooks={...React,useState:initial=>{const i=ci++;consoleStates[i]=initial;return[consoleStates[i],next=>consoleStates[i]=typeof next==='function'?next(consoleStates[i]):next];},useRef:initial=>({current:initial}),useEffect:noop,useMemo:fn=>fn(),useCallback:fn=>fn};
 const Console=await compile('console-workspace.tsx',name=>{if(name==='./package-ide-types')return packageIdeTypes;if(name==='./console-types')return consoleTypes;
  if(name==='./ui/toast-provider')return toastTestModuleWithReact(consoleHooks);
  if(name==='react')return consoleHooks;
  if(name==='next/dynamic')return {__esModule:true,default:loader=>loader.toString().includes('tabbed-terminal')?marker:noop};
  if(name==='next/navigation')return {useRouter:()=>({replace:path=>{throw Error('must navigate the whole document for an expired session');},push:noop,refresh:noop})};
  if(name.includes('language-provider'))return {useLanguage:()=>({t:value=>value}),LanguagePicker:noop};
  if(name.includes('draft-provider'))return {useDraftState:setter,useClearDrafts:()=>()=>{cleared++;for(const key of Object.keys(drafts))delete drafts[key];}};
  if(name==='./tabbed-terminal')return {__esModule:true,default:marker};
  if(name.includes('ui/controls'))return {Button:noop,Checkbox:noop,TextInput:noop,Badge:noop,Progress:noop,Dropdown:noop,CustomSelect:noop};
  if((name.endsWith('.mjs')||name.endsWith('.ts')))return native(name);
  if(name.startsWith('.')||name==='next/link')return {default:noop};return native(name);
 });
 function find(tree,type){if(!tree||typeof tree!=='object')return null;if(tree.type===type)return tree;for(const child of React.Children.toArray(toastTestChildren(tree))){const found=find(child,type);if(found)return found;}return null;}
 const terminalProps=find(Console({view:'terminal'}),marker).props;
 const refs=[],states=[],effects=[];let ri=0,si=0;
 const terminalHooks={...React,useId:()=> 'fixture',useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),useState:initial=>{const i=si++;states[i]??=initial;return[states[i],next=>states[i]=typeof next==='function'?next(states[i]):next];},useEffect:fn=>effects.push(fn),useCallback:fn=>fn};
 const Terminal=await compile('tabbed-terminal.tsx',name=>name==='./console-types'?consoleTypes:name==='./ui/toast-provider'?toastTestModuleWithReact(terminalHooks):name==='react'?terminalHooks:name==='./draft-provider'?{useDraftState:setter}:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button:noop,Dropdown:noop}:(name.endsWith('.mjs')||name.endsWith('.ts'))?native(name):name.startsWith('.')?{__esModule:true,default:noop}:native(name));
 let allowed=true,reader;
 try{
  globalThis.window={EventSource:Source,location:{replace:path=>redirects.push(path)},setTimeout:(fn,ms)=>{timers.set(++serial,{fn,ms});return serial;},clearTimeout:id=>timers.delete(id)};
  globalThis.fetch=async url=>{requests.push(url);return {ok:false,status:401,json:async()=>{errors.push('unexpected body parsing');throw Error('unauthorized body must not be parsed');}};};
  Terminal(terminalProps);const cleanup=effects[3]();assert.equal(sources.length,1);
  const response=await terminalEventResponse(new Request('http://localhost/api/terminal-events?job='+job.id),{readJob:()=>job,authorize:async()=>allowed,authInterval:0,interval:1});
  reader=response.body.getReader();await reader.read();allowed=false;
  const text=new TextDecoder().decode((await reader.read()).value);assert.match(text,/event: terminal-error/);
  const payload=JSON.parse(text.split('\n').find(line=>line.startsWith('data: ')).slice(6));assert.equal(payload.status,401);
  sources[0].handlers['terminal-error']({data:JSON.stringify(payload)});
  assert(sources.every(source=>source.closed));const poll=[...timers.values()].find(timer=>timer.ms===100);assert(poll);await poll.fn();
  assert.deepEqual(redirects,['/login?next=%2Fterminal']);assert.equal(cleared,1);assert.deepEqual(requests,['/api/terminal?job=fixture-shell']);
  assert.equal(consoleStates[4],'','no expired-session error banner');assert.equal(states[2],'');assert.deepEqual(errors,[]);
  assert.equal(job.status,'running','auth loss is not evidence that the OS shell exited');assert.equal(job.logs[0].text,'retained output');
  assert.equal((await reader.read()).done,true);cleanup();
 }finally{await reader?.cancel();globalThis.window=oldWindow;globalThis.fetch=oldFetch;}
});
