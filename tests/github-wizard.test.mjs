import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';
import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {transform,loadBindings} from 'next/dist/build/swc/index.js';

test('GitHub wizard verifies without saving, binds confirmation to the verified account and clears tokens on completion',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/github-connect-wizard.tsx',import.meta.url),'utf8'),{filename:'wizard.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[];let si=0,ri=0,effects=[],elements=[],saved=null,closed=0;const calls=[];const oldFetch=globalThis.fetch;
 globalThis.fetch=(url,options)=>new Promise(resolve=>calls.push({url,options,body:JSON.parse(options.body),resolve}));
 const hooks={...React,useState:initial=>{const at=si++;if(!(at in states))states[at]=initial;return[states[at],next=>states[at]=typeof next==='function'?next(states[at]):next];},useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),useEffect:fn=>effects.push(fn),useId:()=> 'wizard'};
 const native=createRequire(import.meta.url),module={exports:{}};const require=name=>name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button:'Button',IconButton:'IconButton',TextInput:'TextInput',Badge:'Badge'}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const props={version:'original',readOnly:false,onConnected:snapshot=>saved=snapshot,onClose:()=>closed++};
 function render(){si=0;ri=0;effects=[];elements=[];const tree=module.exports.default(props);function visit(node){if(!node||typeof node!=='object')return;elements.push(node);React.Children.forEach(node.props?.children,visit);}visit(tree);return tree;}
 const button=label=>elements.find(node=>node.type==='Button'&&node.props.children===label),submit=()=>elements.find(node=>node.type==='form').props.onSubmit({preventDefault(){}});
 try{
  render();const unmount=effects[0]();button('토큰 입력으로').props.onClick();render();elements.find(node=>node.type==='TextInput').props.onChange({target:{value:'invalid'}});render();await submit();assert.equal(calls.length,0);assert(elements.find(node=>node.type==='form'));
  elements.find(node=>node.type==='TextInput').props.onChange({target:{value:'github_pat_synthetic_wizard_token'}});render();const pending=submit();await submit();assert.equal(calls.length,1,'duplicate submit is locked');assert.equal(calls[0].body.action,'verify');assert.equal(saved,null);
  calls[0].resolve(Response.json({account:{login:'fixture-user',name:'Fixture'},repositoryCount:2,hasMore:false,sample:['fixture-user/repo']}));await pending;render();assert(button('연결 및 저장'));assert(!elements.some(node=>node.type==='TextInput'),'token is hidden on account review');
  button('이전').props.onClick();render();assert.equal(states[3],null,'back invalidates verification');assert(elements.find(node=>node.type==='TextInput'));
  const retry=submit();calls[1].resolve(Response.json({account:{login:'fixture-user',name:'Fixture'},repositoryCount:2,hasMore:false,sample:[]}));await retry;render();const saving=submit();assert.equal(calls[2].body.action,'connect');assert.equal(calls[2].body.expectedAccount,'fixture-user');
  calls[2].resolve(Response.json({connected:true,account:{login:'fixture-user'},version:'new'}));await saving;render();assert(saved.connected);assert.equal(states[1],'');assert(button('저장소 목록 보기'));button('저장소 목록 보기').props.onClick();assert.equal(closed,1);unmount();
 }finally{globalThis.fetch=oldFetch;}
});
