import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';
import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
test('password change GUI locks duplicate requests and clears current credential on failed transport',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/account-panel.tsx',import.meta.url),'utf8'),{filename:'account-panel.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const state=['old-fixture','new-fixture','new-fixture',false,''];let index=0,calls=0,reject,changed=0;
 const hooks={...React,useState:()=>{const at=index++;return[state[at],value=>state[at]=value];},useRef:value=>({current:value})};
 const native=createRequire(import.meta.url),noop=()=>null,module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button:noop,TextInput:noop}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const original=globalThis.fetch;try{
  globalThis.fetch=()=>{calls++;return new Promise((_,fail)=>reject=fail);};
  const tree=module.exports.default({onChanged:()=>changed++});let form;
  function visit(node){if(!node||typeof node!=='object')return;if(node.type==='form')form=node;React.Children.forEach(toastTestChildren(node),visit);}visit(tree);
  const pending=form.props.onSubmit({preventDefault:noop});await form.props.onSubmit({preventDefault:noop});assert.equal(calls,1);
  reject(Error('transport failed'));await pending;assert.equal(state[0],'');assert.equal(state[3],false);assert.equal(changed,0);
  const retry=form.props.onSubmit({preventDefault:noop});assert.equal(calls,2);reject(Error('retry failed'));await retry;
 }finally{globalThis.fetch=original;}
});
