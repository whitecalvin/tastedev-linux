import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {loadBindings,transform} from 'next/dist/build/swc/index.js';
import {translate} from '../lib/i18n.ts';
const native=createRequire(import.meta.url),locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
async function compiled(file,mocks){
 await loadBindings();const {code}=await transform(await readFile(new URL(file,import.meta.url),'utf8'),{filename:file,jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const module={exports:{}};new Function('require','module','exports',code)(name=>name==='./console-types'?consoleTypes:mocks[name]??native(name),module,module.exports);return module.exports.default;
}
async function demo(){
 const state=[],language={locale:'ko'};let cursor=0;
 const hooks={...React,useState:initial=>{const at=cursor++;if(!(at in state))state[at]=initial;return[state[at],value=>state[at]=typeof value==='function'?value(state[at]):value];}};
 const component=await compiled('../app/components/page.tsx',{'react':hooks,'../../components/language-provider':{useLanguage:()=>({t:value=>translate(language.locale,value)})},'../../components/theme-picker':{__esModule:true,default:'ThemePicker'},'../../components/ui/controls':Object.fromEntries(['Button','Checkbox','Radio','Switch','NativeSelect','CustomSelect','Progress'].map(name=>[name,name])), './ui/toast-provider':toastTestModuleWithReact(hooks)});
 const nodes=tree=>!tree||typeof tree!=='object'?[]:[tree,...React.Children.toArray(toastTestChildren(tree)).flatMap(nodes)];
 return{language,render(){cursor=0;return nodes(component());}};
}
test('component examples show translated copy and keep select values and disabled options in all registered languages',async()=>{
 const view=await demo();
 for(const locale of locales){
  view.language.locale=locale;const nodes=view.render();
  assert(nodes.some(n=>n.type==='h1'&&n.props.children===translate(locale,'사용자 컴포넌트')));
  assert(nodes.some(n=>n.type==='p'&&n.props.children===translate(locale,'화면에 사용하는 공통 UI입니다. 이 화면의 조작은 장비 설정이나 패키지를 변경하지 않습니다.')));
  const labels=nodes.flatMap(n=>React.Children.toArray(n.props.children).filter(child=>typeof child==='string'));
  assert(!labels.some(text=>/[가-힣]/.test(text)),locale+' untranslated visible copy');
  for(const type of ['NativeSelect','CustomSelect']){
   const select=nodes.find(n=>n.type===type&&!n.props.disabled);assert.equal(select.props.value,'nginx');
   assert.equal(select.props.options[3].value,'unavailable');assert.equal(select.props.options[3].disabled,true);
   assert.equal(select.props.options[3].label,translate(locale,'비활성 옵션'));
  }
 }
});
test('translated checkbox/select/radio/switch examples preserve local state without any server request',async()=>{
 const view=await demo(),prior=globalThis.fetch;globalThis.fetch=()=>{throw Error('Demo must never call the server');};
 try{
  view.language.locale='ja';let nodes=view.render();nodes.find(n=>n.type==='Checkbox'&&!n.props.disabled).props.onChange({target:{checked:true}});
  assert(view.render().filter(n=>n.type==='Checkbox'&&!n.props.disabled).every(n=>n.props.checked));
  nodes.find(n=>n.type==='NativeSelect').props.onChange({target:{value:'certbot'}});assert(view.render().filter(n=>['NativeSelect','CustomSelect'].includes(n.type)).every(n=>n.props.value==='certbot'));
  view.render().find(n=>n.type==='Radio'&&n.props.value==='detail').props.onChange({target:{value:'detail'}});assert(view.render().find(n=>n.type==='Radio'&&n.props.value==='detail').props.checked);
  view.render().find(n=>n.type==='Switch'&&!n.props.disabled).props.onChange({target:{checked:true}});assert(view.render().find(n=>n.type==='Switch'&&!n.props.disabled).props.checked);
  assert.equal(view.render().find(n=>n.type==='Progress'&&n.props.value!==undefined).props.value,65);
 }finally{globalThis.fetch=prior;}
});
test('Redis context title is translated by the actual shared context component before any API request',async()=>{
 const language={locale:'en'},title='Redis 전체 설정·실행 상태 조회';
 const component=await compiled('../components/nginx-context-panel.tsx',{'react':{...React,useEffect:()=>{}},'./language-provider':{useLanguage:()=>({t:value=>translate(language.locale,value)})},'./ui/controls':{Button:()=>null,Badge:()=>null}, './ui/toast-provider':toastTestModuleWithReact({...React,useEffect:()=>{}})});
 for(const locale of locales){language.locale=locale;const html=renderToStaticMarkup(React.createElement(component,{title,action:'redis-context',connected:true,api:()=>{throw Error('Read performed during render');}}));assert(html.includes(translate(locale,title)));assert(!/[가-힣]/.test(html));}
});
