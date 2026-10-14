import {toastTestModule,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {parseNginxTree} from '../lib/nginx-syntax.ts';
test('tree clipboard opens domain dialog, focuses pasted block and drag moves it once',async()=>{
 await loadBindings();const source=await readFile(new URL('../components/nginx-config-tree.tsx',import.meta.url),'utf8');const compiled=await transform(source,{filename:'nginx-config-tree.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const state=[],refs=[],drafts={};let cursor=0,refCursor=0;const effects=[];
 const hooks={...React,useState:initial=>{const i=cursor++;if(!(i in state))state[i]=initial;return [state[i],update=>{state[i]=typeof update==='function'?update(state[i]):update;}];},useRef:initial=>refs[refCursor++]??(refs[refCursor-1]={current:initial}),useEffect:fn=>effects.push(fn)};
 const Button=()=>null,native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./draft-provider'?{useDraftGeneration:()=>0,useDraftState:(key,initial)=>{if(!(key in drafts))drafts[key]=initial;return [drafts[key],update=>{drafts[key]=typeof update==='function'?update(drafts[key]):update;}];}}:name==='./ui/controls'?{Button,Badge:()=>null,TextInput:()=>null,Switch:()=>null,Dropdown:()=>null}:name.startsWith('./')?{__esModule:true,default:name}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const file={name:'conf.d/example.conf',path:'/etc/nginx/conf.d/example.conf',source:'server { listen 80; server_name old.test; location / {} }\nserver { server_name second.test; }'};file.nodes=parseNginxTree(file.source);const props={data:{root:'/etc/nginx',files:[file]}};
 let elements=[];function render(){cursor=0;refCursor=0;elements=[];const tree=module.exports.default(props);function visit(node){if(!node||typeof node!=='object')return;elements.push(node);React.Children.forEach(toastTestChildren(node),visit);}visit(tree);return tree;}
 const servers=()=>elements.filter(el=>el.type==='button'&&el.props['data-nginx-drop-key']&&JSON.stringify(el.props.children).includes('server'));
 render();const event={key:'c',ctrlKey:true,preventDefault(){},stopPropagation(){}};servers()[0].props.onKeyDown(event);assert.match(drafts.nginxNodeClipboard.text,/old.test/);
 render();const fileButton=elements.find(el=>el.type==='button'&&el.props['data-nginx-drop-path']===file.path&&el.props['data-nginx-drop-key']==='');fileButton.props.onKeyDown({...event,key:'v'});render();const dialog=elements.find(el=>el.props.request?.text&&el.props.onConfirm);assert(dialog);assert(!drafts.nginxDrafts[file.path]);dialog.props.onConfirm('copied.test');render();const nodes=parseNginxTree(drafts.nginxDrafts[file.path].source);assert.equal(nodes.length,3);assert.equal(nodes[2].children.find(el=>el.label.startsWith('server_name')).label,'server_name copied.test');assert.equal(servers().at(-1).props['aria-pressed'],true);
 const transfer={effectAllowed:'',dropEffect:'',setData(){}};servers().at(-1).props.onDragStart({stopPropagation(){},dataTransfer:transfer});servers()[0].props.onDrop({preventDefault(){},stopPropagation(){},dataTransfer:transfer});render();const moved=parseNginxTree(drafts.nginxDrafts[file.path].source);assert.equal(moved.length,3);assert.equal(moved[0].children.find(el=>el.label.startsWith('server_name')).label,'server_name copied.test');assert.equal(servers()[0].props['aria-pressed'],true);assert.equal(drafts.nginxDrafts[file.path].past.length,2);assert.equal(file.source,'server { listen 80; server_name old.test; location / {} }\nserver { server_name second.test; }');
 const previousWindow=globalThis.window;try{globalThis.window={innerWidth:1200,innerHeight:800};
 // A context menu can outlive its node while a newer file snapshot arrives.
 servers()[0].props.onContextMenu({preventDefault(){},stopPropagation(){},clientX:20,clientY:20,currentTarget:{getBoundingClientRect:()=>({left:20,bottom:20})}});
 const replacement='server renamed { listen 8080; }';drafts.nginxDrafts[file.path]={...drafts.nginxDrafts[file.path],source:replacement};render();
 const pasteMenu=elements.find(el=>el.type===Button&&el.props.role==='menuitem'&&JSON.stringify(el.props.children).includes('노드 붙여넣기'));assert(pasteMenu);pasteMenu.props.onClick();render();
 assert.equal(drafts.nginxDrafts[file.path].source,replacement,'a missing old destination must not fall back to pasting at the file root');
 assert(elements.some(el=>el.props?.role==='alert'&&el.props.children==='대상 노드를 다시 선택하세요.'));
 assert(!elements.some(el=>el.props.request?.text&&el.props.onConfirm),'an invalid old destination must not open a new domain prompt');
 }finally{if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;}

});
