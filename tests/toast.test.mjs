import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';

test('toast kinds announce errors urgently and keep dismissal separate from actions',async()=>{
 await loadBindings();
 const compiled=await transform(await readFile(new URL('../components/ui/toast.tsx',import.meta.url),'utf8'),{filename:'toast.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),module={exports:{}};
 new Function('require','module','exports',compiled.code)(name=>name==='./toast.css'?{}:native(name),module,module.exports);
 const {Toast,ToastViewport}=module.exports;
 let dismissed=0,acted=0;
 for(const kind of ['success','info','warning','error']){
  const props={kind,title:'작업 안내',message:'여러 줄\n설정 파일 /etc/tastedev-linux/environment',closeLabel:'닫기',onDismiss:()=>dismissed++,action:{label:'설정 열기',onClick:()=>acted++}};
  const html=renderToStaticMarkup(React.createElement(ToastViewport,null,React.createElement(Toast,props)));
  assert(html.includes(`ui-toast--${kind}`));assert(html.includes(`role="${kind==='error'?'alert':'status'}"`));assert(html.includes('aria-label="닫기"'));assert(html.includes('/etc/tastedev-linux/environment'));
  const tree=Toast(props),nodes=value=>!value||typeof value!=='object'?[]:[value,...React.Children.toArray(value.props?.children).flatMap(nodes)];
  const beforeAction=acted;nodes(tree).find(n=>n.props?.className==='ui-toast__close').props.onClick();assert.equal(acted,beforeAction,'close never runs an operation');
  const beforeDismiss=dismissed;nodes(tree).find(n=>n.props?.className==='ui-toast__action').props.onClick();assert.equal(dismissed,beforeDismiss,'actions do not silently discard guidance');
  let stopped=false,prevented=false;tree.props.onKeyDown({key:'Escape',preventDefault:()=>prevented=true,stopPropagation:()=>stopped=true});assert(stopped);assert(prevented,'Escape must dismiss the toast without closing its parent dialog');assert.equal(dismissed,beforeDismiss+1);
 }
 assert.equal(acted,4);assert.equal(dismissed,8);
});
