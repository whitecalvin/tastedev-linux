import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
test('package code editor renders synchronized syntax and line-number layers while escaping source',async()=>{
 await loadBindings();const source=await readFile(new URL('../components/config-code-editor.tsx',import.meta.url),'utf8');const compiled=await transform(source,{filename:'config-code-editor.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),module={exports:{}};const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./draft-provider'?{useDraftState:()=>[{},()=>{}]}:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?Object.fromEntries(['Button','IconButton','Badge','TextInput'].map(key=>[key,props=>React.createElement('div',null,props.children)])):native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const text='# comment\nport 6379;\nname "<script>";\n',html=renderToStaticMarkup(React.createElement(module.exports.default,{record:{name:'nginx.conf',text,baseline:text},connected:true,api:()=>{throw Error('Unexpected render API');}}));
 const pendingHtml=renderToStaticMarkup(React.createElement(module.exports.default,{record:{name:'nginx.conf',text,baseline:text,pendingSettingInputs:{'1:port':{value:"'unfinished"}}},connected:true,api:()=>{throw Error('Unexpected render API');}}));assert(pendingHtml.includes('코드에 반영되지 않은 입력이 있습니다. 설정 화면에서 값을 확인하세요.'));assert(!html.includes('코드에 반영되지 않은 입력이 있습니다.'));
 assert(html.includes('syntax-comment'));assert(html.includes('syntax-number'));assert(html.includes('syntax-string'));assert(html.includes('1\n2\n3\n4'));assert(html.includes('&lt;script&gt;'));assert(!html.includes('<script>'));assert(html.includes('aria-label="설정 코드 편집"'));
});
