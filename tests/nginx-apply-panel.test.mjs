import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
test('nginx apply GUI ignores stale review and locks duplicate inspection',async()=>{await loadBindings();const compiled=await transform(await readFile(new URL('../components/nginx-apply-panel.tsx',import.meta.url),'utf8'),{filename:'nginx-apply-panel.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});const state=[null,{LC_ALL:'',LC_COLLATE:'',LANG:''},false,false,''],effects=[];let cursor=0,calls=0,resolve;const hooks={...React,useState:()=>{const index=cursor++;return[state[index],value=>state[index]=value];},useRef:value=>({current:value}),useEffect:effect=>effects.push(effect)},Button=()=>null,native=createRequire(import.meta.url),module={exports:{}};const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./ui/controls'?{Button,Checkbox:()=>null,TextInput:()=>null}:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);const tree=module.exports.default({connected:true,allowed:true,baseline:'events {}',path:'/etc/nginx/nginx.conf',text:'events { worker_connections 1024; }',api:()=>{calls++;return new Promise(done=>resolve=done);}});let button;function visit(node){if(!node||typeof node!=='object')return;if(node.type===Button)button=node;React.Children.forEach(toastTestChildren(node),visit);}visit(tree);const first=button.props.onClick(),second=button.props.onClick();assert.equal(calls,1);effects[0]();resolve({graph:{complete:true,files:[]},service:{ready:false}});await Promise.all([first,second]);assert.equal(state[0],null);assert.equal(state[3],false);});

test('nginx apply refreshes only successful results and distinguishes a refresh failure',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/nginx-apply-panel.tsx',import.meta.url),'utf8'),{filename:'nginx-apply-panel.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 for(const scenario of ['success','rolled-back','refresh-failed']){
  const state=[{version:'a'.repeat(64),graph:{version:'b'.repeat(64)},service:{pid:12,start:'34'}},{LC_ALL:'',LC_COLLATE:'',LANG:''},true,false,''];let cursor=0,refreshed=0;
  const hooks={...React,useState:()=>{const index=cursor++;return[state[index],value=>state[index]=typeof value==='function'?value(state[index]):value];},useRef:value=>({current:value}),useEffect:()=>{}},Button=()=>null,native=createRequire(import.meta.url),module={exports:{}};
  const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./ui/controls'?{Button,Checkbox:()=>null,TextInput:()=>null}:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);
  const tree=module.exports.default({connected:true,allowed:true,path:'/etc/nginx/nginx.conf',text:'events {}',baseline:'events {}',api:async()=>scenario==='rolled-back'?{failed:true,restored:true,recovered:true}:{changed:true},onApplied:async()=>{refreshed++;if(scenario==='refresh-failed')throw Error('offline');}});
  let apply;function visit(node){if(!node||typeof node!=='object')return;if(node.type===Button&&node.props.children==='검사 후 적용')apply=node;React.Children.forEach(toastTestChildren(node),visit);}visit(tree);assert.ok(apply);await apply.props.onClick();assert.equal(refreshed,scenario==='rolled-back'?0:1);assert.equal(state[2],false);assert.equal(state[3],false);if(scenario==='refresh-failed')assert.deepEqual(state[4],{key:'설정 적용은 완료되었지만 목록 갱신에 실패했습니다.',detail:'offline'});if(scenario==='rolled-back')assert.equal(state[4],'설정 적용에 실패하여 원본 설정을 복원하고 서비스를 복구했습니다.');if(scenario==='rolled-back')assert.equal(state[5],true);
 }
});


test('nginx apply review is invalidated when the API connection changes',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/nginx-apply-panel.tsx',import.meta.url),'utf8'),{filename:'nginx-apply-panel.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const state=[],refs=[],effects=[],pending=[];let si=0,ri=0,ei=0;
 const hooks={...React,useState:initial=>{const index=si++;if(!(index in state))state[index]=initial;return [state[index],value=>state[index]=typeof value==='function'?value(state[index]):value];},useRef:initial=>{const index=ri++;return refs[index]??(refs[index]={current:initial});},useEffect:(fn,deps)=>{const index=ei++;if(!effects[index]||deps.some((value,k)=>value!==effects[index].deps[k]))pending.push(()=>{effects[index]?.cleanup?.();effects[index]={deps,cleanup:fn()};});}};
 const Button=()=>null,native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./ui/controls'?{Button,Checkbox:()=>null,TextInput:()=>null}:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const render=props=>{si=ri=ei=0;const tree=module.exports.default(props);while(pending.length)pending.shift()();return tree;};
 const reviewButton=tree=>{let button;function visit(node){if(!node||typeof node!=='object')return;if(node.type===Button&&node.props.children==='설정·서비스 검토')button=node;React.Children.forEach(toastTestChildren(node),visit);}visit(tree);return button;};
 let resolveOld;let props={connected:true,allowed:true,baseline:'events {}',text:'events {}',path:'/etc/nginx/nginx.conf',api:()=>new Promise(resolve=>resolveOld=resolve)};
 const version=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(props.baseline)))).map(byte=>byte.toString(16).padStart(2,'0')).join('');
 const context=pid=>({graph:{complete:true,version:'graph',files:[{path:props.path,version}]},service:{ready:true,pid,start:'1'}});
 const old=reviewButton(render(props)).props.onClick();
 let resolveNew;props={...props,api:()=>new Promise(resolve=>resolveNew=resolve)};render(props);
 const current=reviewButton(render(props)).props.onClick();
 assert.equal(typeof resolveNew,'function','new connection review must not wait for the old request');
 resolveOld(context(11));await old;
 assert.equal(state[0],null,'late old connection review must not restore a stale context');assert.equal(state[4],'');
 assert.equal(state[3],true,'old finally must not clear current review busy state');
 resolveNew(context(22));await current;
 assert.equal(state[0].service.pid,22,'new connection review must use the current API');
 state[2]=true;props={...props,api:async()=>context(33)};render(props);
 assert.equal(state[0],null);assert.equal(state[2],false,'connection changes must discard approval for the previous server');
 for(const effect of effects)effect?.cleanup?.();
});

 test('pending nginx settings or code invalidate review and reject even retained apply handlers',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/nginx-apply-panel.tsx',import.meta.url),'utf8'),{filename:'nginx-apply-panel.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const state=[],refs=[],effects=[],pending=[];let si=0,ri=0,ei=0;
 const hooks={...React,useState:initial=>{const i=si++;if(!(i in state))state[i]=initial;return[state[i],next=>state[i]=typeof next==='function'?next(state[i]):next];},useRef:initial=>{const i=ri++;return refs[i]??(refs[i]={current:initial});},useEffect:(fn,deps)=>{const i=ei++;if(!effects[i]||deps.some((x,k)=>x!==effects[i].deps[k]))pending.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,cleanup:fn()};});}};
 const native=createRequire(import.meta.url),module={exports:{}};const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./ui/controls'?{Button:'button',Checkbox:'checkbox',TextInput:'input'}:name==='./language-provider'?{useLanguage:()=>({t:x=>x})}:native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const baseline='events {}',path='/etc/nginx/nginx.conf',version=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(baseline))).toString('hex'),calls=[];
 let props={connected:true,allowed:true,path,baseline,text:'events { worker_connections 512; }',hasPendingInputs:false,api:async action=>{calls.push(action);return{graph:{complete:true,version:'g',files:[{path,version}]},service:{ready:true,pid:1,start:'s'}};}};
 const render=()=>{si=ri=ei=0;return module.exports.default(props);},flush=()=>{while(pending.length)pending.shift()();};
 const find=(node,predicate)=>{if(!node||typeof node!=='object')return;if(predicate(node))return node;for(const child of React.Children.toArray(toastTestChildren(node))){const found=find(child,predicate);if(found)return found;}};
 render();flush();await find(render(),node=>node.type==='button'&&node.props.children==='설정·서비스 검토').props.onClick();
 const approval=find(render(),node=>node.type==='checkbox');approval.props.onChange({target:{checked:true}});const oldApply=find(render(),node=>node.type==='button'&&node.props.children==='검사 후 적용');assert.equal(oldApply.props.disabled,false);
 props={...props,hasPendingInputs:true};const blocked=render();assert.equal(find(blocked,node=>node.type==='button'&&node.props.children==='설정·서비스 검토').props.disabled,true);await oldApply.props.onClick();assert.deepEqual(calls,['nginx-context'],'retained apply handler cannot send old text after pending input appears');flush();assert.equal(state[0],null);assert.equal(state[2],false);
 props={...props,hasPendingInputs:false};render();flush();assert.equal(state[0],null,'clearing pending does not revive previously approved review');assert.equal(find(render(),node=>node.type==='button'&&node.props.children==='설정·서비스 검토').props.disabled,false);
 });
