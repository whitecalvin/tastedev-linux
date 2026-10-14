import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {loadBindings,transform} from 'next/dist/build/swc/index.js';
import {parseNginxTree} from '../lib/nginx-syntax.ts';
test('site context keeps the selected enabled alias while configuration editing follows its original file',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/nginx-config-tree.tsx',import.meta.url),'utf8'),{filename:'nginx-config-tree.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],drafts=new Map();let si=0,ri=0;const hooks={...React,useState:initial=>{const i=si++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return[states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),useEffect:()=>{}};
 const Button=()=>null,native=createRequire(import.meta.url),module={exports:{}};
 const replacements={'react':hooks,'./language-provider':{useLanguage:()=>({t:value=>value})},'./draft-provider':{useDraftGeneration:()=>0,useDraftState:(key,initial)=>{if(!drafts.has(key))drafts.set(key,typeof initial==='function'?initial():initial);return[drafts.get(key),value=>drafts.set(key,typeof value==='function'?value(drafts.get(key)):value)];}},'./ui/controls':{Button,Badge:()=>null,TextInput:()=>null,Switch:()=>null,Dropdown:()=>null}};
 for(const name of ['ui/ide-split-layout','ui/confirm-dialog','nginx-code-recovery','nginx-code-editor','nginx-block-settings','nginx-apply-panel','nginx-site-dialog'])replacements['./'+name]={__esModule:true,default:name};
 new Function('require','module','exports',compiled.code)(name=>name==='./console-types'?consoleTypes:Object.hasOwn(replacements,name)?replacements[name]:native(name),module,module.exports);
 const original={name:'sites-available/default',path:'/etc/nginx/sites-available/default',source:'server { listen 80; }',readOnly:false};original.nodes=parseNginxTree(original.source);
 const alias={...original,name:'sites-enabled/alternate',path:'/etc/nginx/sites-enabled/alternate',symbolicLink:true,linkTarget:original.path,readOnly:true};
 const props={data:{root:'/etc/nginx',files:[original,alias]},api:async()=>{},connected:true};
 const render=()=>{si=ri=0;return module.exports.default(props);};
 const nodes=tree=>!tree||typeof tree!=='object'?[]:[tree,...React.Children.toArray(tree.props?.children).flatMap(nodes)];
 const previousWindow=globalThis.window;globalThis.window={innerWidth:1200,innerHeight:900};
 try{
  const button=nodes(render()).find(node=>node.type==='button'&&JSON.stringify(node.props.children).includes('alternate'));
  assert(button);button.props.onContextMenu({preventDefault(){},stopPropagation(){},clientX:120,clientY:150,currentTarget:{getBoundingClientRect:()=>({left:120,bottom:150})}});
  const tree=render(),menu=nodes(tree).find(node=>node.type===Button&&node.props.role==='menuitem'&&node.props.children==='사이트 연결');assert(menu);menu.props.onClick();
  const dialog=nodes(render()).find(node=>node.type==='nginx-site-dialog');assert.deepEqual(dialog.props.request,{path:original.path,link:alias.path});
 }finally{globalThis.window=previousWindow;}
});
