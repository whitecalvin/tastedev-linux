import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {loadBindings,transform} from 'next/dist/build/swc/index.js';
import {translate} from '../lib/i18n.ts';
const native=createRequire(import.meta.url);
async function fixture(){
 await loadBindings();const {code}=await transform(await readFile(new URL('../components/network-settings.tsx',import.meta.url),'utf8'),{filename:'network-settings.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],language={locale:'ko'};let si=0,ri=0;
 const hooks={...React,useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return[states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial})};
 const controls=Object.fromEntries(['Button','TextInput','Switch','Badge'].map(key=>[key,key]));const module={exports:{}};
 new Function('require','module','exports',code)(name=>name==='./ui/toast-provider'?toastTestModuleWithReact(hooks):name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:(value,vars)=>translate(language.locale,value,vars)})}:name==='next/navigation'?{useRouter:()=>({replace:()=>{}})}:name==='./ui/controls'?controls:name==='./ui/confirm-dialog'?{__esModule:true,default:'Confirmation'}:native(name),module,module.exports);
 const props={readOnly:false,initial:{host:'0.0.0.0',port:8791,externalEnabled:true,version:'reviewed-version',active:{host:'0.0.0.0',port:8791,externalEnabled:true,urls:['http://192.168.0.103:8791']},restartAvailable:true,restartRequired:false,development:false}};
 const nodes=tree=>!tree||typeof tree!=='object'?[]:[tree,...React.Children.toArray(toastTestChildren(tree)).flatMap(nodes)];
 return{props,language,render(){si=ri=0;return nodes(module.exports.default(props));}};
}
test('network setting labels translate in all registered catalogs while listener identity and permission gates remain intact',async()=>{
 const view=await fixture();
 view.props.initial.restartReason='재시작 버튼은 deb로 설치한 관리 앱에서 사용할 수 있습니다.';
 view.props.initial.restartAvailable=false;
 for(const locale of ['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk']){
  view.language.locale=locale;const nodes=view.render();
  assert(nodes.some(n=>n.type==='h2'&&n.props.children===translate(locale,'관리 앱 접속')));
  const address=nodes.find(n=>n.props.label===translate(locale,'접속 주소 (IPv4)'));assert.equal(address.props.value,'0.0.0.0');
  const port=nodes.find(n=>n.props.label===translate(locale,'접속 포트'));assert.equal(port.props.value,8791);
  assert(nodes.some(n=>n.type==='Button'&&n.props.disabled&&n.props.title===translate(locale,view.props.initial.restartReason)));
  assert(nodes.some(n=>n.type==='a'&&n.props.href==='http://192.168.0.103:8791'));
 }
 view.props.readOnly=true;assert(view.render().filter(n=>n.type==='Button').every(n=>n.props.disabled));
});
test('restart result translates with a stable local URL without issuing another restart on language change',async()=>{
 const view=await fixture(),priorFetch=globalThis.fetch,priorWindow=globalThis.window;let calls=0;
 globalThis.window={location:{href:'http://192.168.0.103:8791/settings'}};
 globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,'/api/app-restart');assert.deepEqual(JSON.parse(options.body),{confirm:true,version:'reviewed-version'});return{status:200,ok:true,json:async()=>({host:'127.0.0.1',port:8792})};};
 try{
  view.render().find(n=>n.type==='Button'&&n.props.className.includes('app-restart')).props.onClick();
  const dialog=view.render().find(n=>n.type==='Confirmation');assert.equal(dialog.props.request.kind,'restart');await dialog.props.onConfirm();
  for(const locale of ['en','ja','ar','uk','ko']){
   view.language.locale=locale;const status=view.render().find(n=>n.props.role==='status').props.children;
   assert(status.includes('http://127.0.0.1:8792'));if(locale!=='ko')assert(!/[가-힣]/.test(status));
  }
  assert.equal(calls,1);
 }finally{globalThis.fetch=priorFetch;globalThis.window=priorWindow;}
});
test('server conflict and restart-failure notices retranslate without changing settings or retrying',async()=>{
 const prior=globalThis.fetch;let requests=0;
 try{
  for(const [kind,message] of [['save','접속 설정이 변경됐습니다. 다시 조회하세요.'],['restart','앱 재시작을 예약하지 못했습니다.']]){
   const view=await fixture();globalThis.fetch=async(url)=>{requests++;assert.equal(url,kind==='save'?'/api/network-settings':'/api/app-restart');return{status:kind==='save'?409:503,ok:false,json:async()=>({error:message})};};
   view.render().find(n=>n.type==='Button'&&(kind==='save'?n.props.className==='settings-save-button':n.props.className.includes('app-restart'))).props.onClick();
   await view.render().find(n=>n.type==='Confirmation').props.onConfirm();
   for(const locale of ['en','ja','ar','uk','ko']){view.language.locale=locale;const nodes=view.render();assert(nodes.some(n=>n.props.role==='status'&&n.props.children===translate(locale,message)));assert.equal(nodes.find(n=>n.props.label===translate(locale,'접속 포트')).props.value,8791);assert.equal(nodes.find(n=>n.props.label===translate(locale,'접속 주소 (IPv4)')).props.value,'0.0.0.0');}
  }
  assert.equal(requests,2);
 }finally{globalThis.fetch=prior;}
});

test('successful restart reservation blocks settings mutation and duplicate requests until reconnect',async()=>{
 const view=await fixture(),priorFetch=globalThis.fetch,priorWindow=globalThis.window;let requests=0;
 globalThis.window={location:{href:'http://127.0.0.1:8791/settings'}};
 globalThis.fetch=async()=>{requests++;return{status:200,ok:true,json:async()=>({scheduled:true,host:'127.0.0.1',port:8791})};};
 try{
  const button=view.render().find(n=>n.type==='Button'&&n.props.className.includes('app-restart'));button.props.onClick();
  const restart=view.render().find(n=>n.type==='Confirmation').props.onConfirm;
  await restart();
  const nodes=view.render();
  assert(nodes.filter(n=>n.type==='Button').every(n=>n.props.disabled));
  assert.equal(nodes.find(n=>n.type==='fieldset').props.disabled,true);
  assert(nodes.some(n=>n.type==='a'&&n.props.href==='http://127.0.0.1:8791/settings'&&n.props.children==='관리 앱 다시 접속'));
  await restart();
  nodes.find(n=>n.type==='Button'&&n.props.className==='settings-save-button').props.onClick();
  await view.render().find(n=>n.type==='Confirmation').props.onConfirm();
  assert.equal(requests,1);
 }finally{globalThis.fetch=priorFetch;globalThis.window=priorWindow;}
});
test('rejected restart unlocks settings and allows an explicit retry',async()=>{
 const view=await fixture(),priorFetch=globalThis.fetch,priorWindow=globalThis.window;let requests=0;
 globalThis.window={location:{href:'http://127.0.0.1:8791/settings'}};
 globalThis.fetch=async()=>{requests++;return requests===1?{status:503,ok:false,json:async()=>({error:'앱 재시작을 예약하지 못했습니다.'})}:{status:200,ok:true,json:async()=>({scheduled:true,host:'127.0.0.1',port:8791})};};
 try{
  const invoke=async()=>{view.render().find(n=>n.type==='Button'&&n.props.className.includes('app-restart')).props.onClick();await view.render().find(n=>n.type==='Confirmation').props.onConfirm();};
  await invoke();
  assert.equal(view.render().find(n=>n.type==='fieldset').props.disabled,false);
  assert.equal(view.render().find(n=>n.type==='Button'&&n.props.className.includes('app-restart')).props.disabled,false);
  await invoke();assert.equal(requests,2);
  assert.equal(view.render().find(n=>n.type==='fieldset').props.disabled,true);
 }finally{globalThis.fetch=priorFetch;globalThis.window=priorWindow;}
});
