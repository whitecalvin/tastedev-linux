import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {loadBindings,transform} from 'next/dist/build/swc/index.js';
test('app confirmation opens a nonblocking dialog, focuses cancel, and separates cancellation from approval',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/ui/confirm-dialog.tsx',import.meta.url),'utf8'),{filename:'confirm-dialog.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const effects=[],calls=[],dialog={open:false,showModal(){this.open=true;calls.push('open');},close(){this.open=false;calls.push('close');},querySelector(){return {focus:()=>calls.push('focus-cancel')};}};
 let id=0;const hooks={...React,useId:()=>String(++id),useRef:()=>({current:dialog}),useEffect:fn=>effects.push(fn)},native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='react'?hooks:name==='../language-provider'?{useLanguage:()=>({t:x=>x})}:name==='./controls'?{Button:'button'}:native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);
 let confirmed=0,cancelled=0;const props={request:{title:'초안 초기화',message:'초안 변경을 버릴까요?',detail:'/etc/nginx/nginx.conf'},onConfirm:()=>confirmed++,onCancel:()=>cancelled++};
 const render=()=>{effects.length=0;const view=module.exports.default(props);effects.forEach(effect=>effect());return view;};
 let view=render();assert.equal(view.type,'dialog');assert.ok(view.props['aria-labelledby']);assert.ok(view.props['aria-describedby']);assert.deepEqual(calls,['open','focus-cancel']);
 let prevented=false;view.props.onCancel({preventDefault(){prevented=true;}});assert.equal(prevented,true);assert.equal(cancelled,1);assert.equal(confirmed,0);
 const footer=React.Children.toArray(view.props.children).find(child=>child.type==='footer'),buttons=React.Children.toArray(footer.props.children);buttons[0].props.onClick();assert.equal(cancelled,2);buttons[1].props.onClick();assert.equal(confirmed,1);
 props.request=null;view=render();assert.equal(dialog.open,false);assert.equal(calls.at(-1),'close');view.props.onClose();assert.equal(cancelled,2);
});
