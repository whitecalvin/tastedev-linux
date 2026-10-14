import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {POST} from '../app/api/auth/[operation]/route.ts';

test('password API explicitly identifies a missing session before credential storage is accessed',async()=>{
 const response=await POST(new Request('http://localhost/api/auth/password',{method:'POST',headers:{'Content-Type':'application/json',origin:'http://localhost'},body:JSON.stringify({currentPassword:'fixture-current',newPassword:'fixture-next-password'})}),{params:Promise.resolve({operation:'password'})});
 assert.equal(response.status,401);
 assert.deepEqual(await response.json(),{error:'로그인이 필요합니다.',code:'SESSION_EXPIRED'});
});

test('account screen redirects only confirmed expiry and clears credentials without reporting a password change',async()=>{
 await loadBindings();
 const compiled=await transform(await readFile(new URL('../components/account-panel.tsx',import.meta.url),'utf8'),{filename:'account-panel.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),noop=()=>null,oldFetch=globalThis.fetch;
 try{
  for(const scenario of ['expired','wrong-password','unclassified']){
   const values=['fixture-current','fixture-next-password','fixture-next-password',false,''];let at=0,redirected=0,changed=0;
   const module={exports:{}},hooks={...React,useRef:value=>({current:value}),useState:()=>{const index=at++;return [values[index],next=>values[index]=next];}};
   new Function('require','module','exports',compiled.code)(name=>name==='./ui/toast-provider'?toastTestModuleWithReact(hooks):name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button:noop,TextInput:noop}:native(name),module,module.exports);
   globalThis.fetch=async()=>new Response(JSON.stringify(scenario==='expired'?{error:'로그인이 필요합니다.',code:'SESSION_EXPIRED'}:{error:'사용자명 또는 비밀번호를 확인하세요.'}),{status:401,headers:{'Content-Type':'application/json'}});
   const tree=module.exports.default({onChanged:()=>changed++,onSessionExpired:()=>redirected++});
   let form;function visit(node){if(!node||typeof node!=='object')return;if(node.type==='form')form=node;React.Children.forEach(toastTestChildren(node),visit);}visit(tree);
   await form.props.onSubmit({preventDefault:noop});
   assert.equal(changed,0);assert.equal(values[0],'');assert.equal(values[3],false);
   assert.equal(redirected,scenario==='expired'?1:0);
   if(scenario==='expired'){assert.equal(values[1],'');assert.equal(values[2],'');assert.equal(values[4],'');}
   else{assert.equal(values[1],'fixture-next-password');assert.equal(values[4],'사용자명 또는 비밀번호를 확인하세요.');}
  }
 }finally{globalThis.fetch=oldFetch;}
});
