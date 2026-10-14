import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';

async function fixture(name,state,props){
 await loadBindings();
 const compiled=await transform(await readFile(new URL('../components/'+name+'.tsx',import.meta.url),'utf8'),{filename:name+'.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const refs=[],effects=[],pending=[];let si,ri,ei;
 const hooks={...React,useState:initial=>{const i=si++;if(!(i in state))state[i]=initial;return[state[i],next=>state[i]=typeof next==='function'?next(state[i]):next];},useRef:initial=>{const i=ri++;return refs[i]??(refs[i]={current:initial});},useEffect:(fn,deps)=>{const i=ei++;if(!effects[i]||deps.some((x,k)=>!Object.is(x,effects[i].deps[k])))pending.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,cleanup:fn()};});}};
 const native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModuleWithReact(hooks):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./ui/controls'?{Button:'button',Checkbox:'checkbox',TextInput:'input',Dropdown:'select',Badge:'badge'}:name==='./language-provider'?{useLanguage:()=>({t:x=>x})}:name==='./nginx-apply-panel'?{default:'apply-panel'}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 return{state,render(next=props){props=next;si=ri=ei=0;return module.exports.default(props);},flush(){while(pending.length)pending.shift()();}};
}
function find(node,label){if(!node||typeof node!=='object')return;if(node.props?.children===label||node.props?.['aria-label']===label||node.props?.label===label)return node;for(const child of React.Children.toArray(toastTestChildren(node))){const match=find(child,label);if(match)return match;}}
const path='/etc/nginx/nginx.conf',context={version:'a'.repeat(64),graph:{version:'b'.repeat(64)},service:{pid:12,start:'34'}};

test('nginx confirmation is consumed before execution and retained handlers cannot replay it',async()=>{
 let calls=0;const props={connected:true,allowed:true,path,text:'events {}',baseline:'events {}',api:async()=>{calls++;return{changed:true};}};
 const f=await fixture('nginx-apply-panel',[context,{LC_ALL:'',LC_COLLATE:'',LANG:''},true,false,''],props);
 const tree=f.render(),apply=find(tree,'검사 후 적용'),confirmation=find(tree,'설정 변경, locale 및 nginx reload 영향을 검토했습니다.');await apply.props.onClick();confirmation.props.onChange({target:{checked:true}});await apply.props.onClick();
 assert.equal(calls,1);assert.equal(f.state[2],false);
});

test('nginx apply hides old approval and rejects retained actions before scope reset effects',async()=>{
 for(const changed of ['api','allowed','policyVersion','path']){
  let calls=0;const api=async()=>{calls++;return{changed:true};};
  const props={api,connected:true,allowed:true,policyVersion:1,path,text:'events {}',baseline:'events {}'};
  const f=await fixture('nginx-apply-panel',[context,{LC_ALL:'',LC_COLLATE:'',LANG:''},true,false,''],props);
  const old=find(f.render(),'검사 후 적용');
  const next={...props,[changed]:changed==='api'?async()=>{calls++;}:changed==='allowed'?false:changed==='path'?'/etc/nginx/conf.d/other.conf':2};
  const tree=f.render(next);assert.equal(find(tree,'검사 후 적용'),undefined);assert.equal(find(tree,'설정·서비스 검토').props.disabled,true);
  await old.props.onClick();assert.equal(calls,0,changed);f.flush();
 }
});

test('nginx backups hide old restore plan and reject old selection callbacks before effects',async()=>{
 for(const changed of ['api','allowed','policyVersion','backupIds']){
  let calls=0;const props={api:async()=>{calls++;return{backups:[]};},connected:true,allowed:true,policyVersion:1};
  const plan={path,changed:true,includeComplete:true,version:'v',backupVersion:'b'};
  const f=await fixture('nginx-backups-panel',[[{id:'fixture',target:path}], 'fixture',plan,false,'',false,null],props);
  const original=f.render(),old=find(original,'nginx 설정 변경 백업 복구 검토'),selection=find(original,'복구할 백업');
  const next={...props,[changed]:changed==='api'?async()=>{calls++;}:changed==='allowed'?false:changed==='backupIds'?['other']:2};
  const tree=f.render(next);assert.equal(find(tree,'설정 버전'),undefined);assert.equal(find(tree,'복구할 백업').props.value,'');
  await old.props.onClick();selection.props.onChange({target:{value:'other'}});assert.equal(calls,0,changed);assert.equal(f.state[1],'fixture','old event must not change new scope');f.flush();
 }
});

test('nginx late restore review cannot publish during the render before API reset effects',async()=>{
 let resolve;const props={api:()=>new Promise(done=>resolve=done),connected:true,allowed:true};
 const f=await fixture('nginx-backups-panel',[[{id:'fixture',target:path}],'fixture',null,false,'',false,null],props);
 const pending=find(f.render(),'nginx 설정 변경 백업 복구 검토').props.onClick();
 f.render({...props,api:async()=>({backups:[]})});resolve({path,changed:true,includeComplete:true});await pending;
 assert.equal(f.state[2],null);assert.equal(f.state[4],'');f.flush();
});
