import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import React from 'react';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
test('Node service GUI consumes confirmation and locks duplicate install requests',async()=>{
 const source=await readFile(new URL('../components/node-apps.tsx',import.meta.url),'utf8');await loadBindings();const compiled=await transform(source,{filename:'node-apps.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const profile={id:'fixture',label:'Fixture'},plan={id:'fixture',registryVersion:'a'.repeat(64),files:[],serviceOptions:{restart:'always'},runtime:{status:'ready'},text:'unit',unit:'fixture.service'};
 const state=['registration',true,null,{restart:'always',restartSeconds:'5',stopSeconds:''},{apps:[profile]},profile,false,'',null,plan,null,false];let cursor=0;
 const hooks={...React,useId:()=>'fixture-id',useState:()=>{const index=cursor++;return[state[index],value=>{state[index]=typeof value==='function'?value(state[index]):value;}];},useRef:value=>({current:value}),useEffect:()=>{}};
 const Button=()=>null,native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?{Button,Dropdown:()=>null,TextInput:()=>null,Checkbox:()=>null}:name==='../lib/capabilities.ts'?{featureAllowed:()=>true,featureReason:()=>''}:['./node-service-recovery','./node-service-backups','./node-service-update','./node-service-control','./node-app-env','./node-app-logs'].includes(name)?{default:()=>null}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 let resolve,refreshes=0;const calls=[];const tree=module.exports.default({connected:true,security:{},onServiceChanged:async()=>{refreshes++;},api:(action,payload)=>{calls.push({action,payload});return new Promise(done=>{resolve=done;});}});
 const buttons=[];function visit(node){if(!node||typeof node!=='object')return;if(node.type===Button)buttons.push(node);React.Children.forEach(toastTestChildren(node),visit);}visit(tree);
 buttons.find(item=>item.props.children==='서비스 등록').props.onClick();
 const button=buttons.find(item=>item.props.children==='서비스 등록 확인');assert(button);
 const first=button.props.onClick(),second=button.props.onClick();assert.equal(calls.length,1);assert.equal(calls[0].action,'node-app-service-install');assert.equal(calls[0].payload.confirm,true);assert(!Object.hasOwn(calls[0].payload,'uid'));assert.equal(state[1],false);assert.equal(state[6],true);
 resolve({installed:true});await Promise.all([first,second]);assert.equal(state[2].installed,true);assert.equal(refreshes,1);assert.equal(state[6],false);await button.props.onClick();assert.equal(calls.length,1);
});

test('Node installed settings import clears confirmation and binds registry before changing options',async()=>{
 const source=await readFile(new URL('../components/node-apps.tsx',import.meta.url),'utf8');await loadBindings();const compiled=await transform(source,{filename:'node-apps.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 for(const kind of ['valid','absent','stale']){
  const version='a'.repeat(64),profile={id:'fixture',label:'Fixture'},plan={id:'fixture',unit:'fixture.service',runtime:{status:'ready'},text:'unit'};
  const initial={restart:'no',restartSeconds:'5',stopSeconds:''},state=['registration',true,{installed:true},initial,{version,apps:[profile]},profile,false,'',null,plan,null,false];let cursor=0;
  const hooks={...React,useId:()=>'fixture-id',useState:()=>{const index=cursor++;return[state[index],value=>{state[index]=typeof value==='function'?value(state[index]):value;}];},useRef:value=>({current:value}),useEffect:()=>{}};
  const Button=()=>null,native=createRequire(import.meta.url),module={exports:{}};
  const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?{Button,Dropdown:()=>null,TextInput:()=>null,Checkbox:()=>null}:name==='../lib/capabilities.ts'?{featureAllowed:()=>true,featureReason:()=>''}:['./node-service-recovery','./node-service-backups','./node-service-update','./node-service-control','./node-app-env','./node-app-logs'].includes(name)?{default:()=>null}:native(name);
  new Function('require','module','exports',compiled.code)(require,module,module.exports);
  let resolve;const calls=[];const tree=module.exports.default({connected:true,security:{settings:{sudoWithoutPrompt:true},privilege:{ready:true},available:{serviceChanges:true}},api:action=>{calls.push(action);return new Promise(done=>{resolve=done;});}});
  const buttons=[];function visit(node){if(!node||typeof node!=='object')return;if(node.type===Button)buttons.push(node);React.Children.forEach(toastTestChildren(node),visit);}visit(tree);
  const button=buttons.find(item=>item.props.children==='등록된 서비스 설정 가져오기');assert(button);assert.equal(button.props.disabled,false);
  const pending=button.props.onClick();assert.equal(state[1],false);assert.equal(state[2],null);assert.equal(state[9],null);assert.equal(state[6],true);assert.deepEqual(calls,['node-app-service-settings?id=fixture']);
  resolve({registered:kind!=='absent',registryVersion:kind==='stale'?'b'.repeat(64):version,serviceOptions:{restart:'always',restartSeconds:30,stopSeconds:60}});await pending;
  assert.equal(state[6],false);if(kind==='valid'){assert.deepEqual(state[3],{restart:'always',restartSeconds:'30',stopSeconds:'60'});assert.equal(state[7],'');}else{assert.deepEqual(state[3],initial);assert(state[7]);}
 }
});
