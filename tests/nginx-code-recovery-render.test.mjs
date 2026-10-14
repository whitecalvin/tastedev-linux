import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {loadBindings,transform} from 'next/dist/build/swc/index.js';
import {parseNginxTree} from '../lib/nginx-syntax.ts';
import {nginxNodeKey} from '../lib/nginx-node-key.ts';
import {nginxEditorTarget} from '../lib/nginx-code-recovery.ts';

test('code recovery app dialog separates requests, cancellation and guarded approval',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/nginx-code-recovery.tsx',import.meta.url),'utf8'),{filename:'nginx-code-recovery.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const original={path:'/etc/nginx/nginx.conf',source:'server {}',nodes:parseNginxTree('server {}')},live={...original,source:'server renamed {}',nodes:parseNginxTree('server renamed {}')};
 const id=JSON.stringify([original.path,nginxNodeKey(original.nodes,original.nodes[0].id)]),targetId=JSON.stringify([live.path,nginxNodeKey(live.nodes,live.nodes[0].id)]);
 const seed=()=>({[id]:{text:'server { listen 8080; }',baseline:original.source},[targetId]:{text:'server renamed { listen 9090; }',baseline:live.source}});
 let buffers=seed(),cursor=0,opened=0;const state=[false,'','',null];
 const hooks={...React,useId:()=> 'recovery-dialog',useRef:()=>({current:null}),useEffect:()=>{},useState:()=>{const index=cursor++;return [state[index],value=>{state[index]=typeof value==='function'?value(state[index]):value;}];}};
 const native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:x=>x})}:name==='./draft-provider'?{useDraftGeneration:()=>0,useDraftState:()=>[buffers,value=>{buffers=typeof value==='function'?value(buffers):value;}]}:name==='./ui/controls'?{Button:'button',NativeSelect:'select'}:name==='./ui/confirm-dialog'?{__esModule:true,default:'confirm-dialog'}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const props={files:[live],target:nginxEditorTarget(targetId,[live]),onEdit:()=>opened++};
 function render(){cursor=0;return module.exports.default(props);}
 function find(node,predicate){if(!node||typeof node!=='object')return null;if(predicate(node))return node;for(const child of React.Children.toArray(toastTestChildren(node))){const result=find(child,predicate);if(result)return result;}return null;}
 const button=(view,text)=>find(view,node=>node.type==='button'&&node.props.children===text),confirm=view=>find(view,node=>node.type==='confirm-dialog');
 button(render(),'선택한 노드에서 편집').props.onClick();assert.equal(state[3].kind,'replace');assert.equal(opened,0);assert.deepEqual(buffers,seed());
 confirm(render()).props.onCancel();assert.equal(state[3],null);assert.deepEqual(buffers,seed());
 button(render(),'선택한 노드에서 편집').props.onClick();buffers[targetId]={...buffers[targetId],text:'newer destination edits'};
 confirm(render()).props.onConfirm();assert.equal(buffers[targetId].text,'newer destination edits');assert.ok(buffers[id]);assert.equal(opened,0);assert.match(state[2],/설정이 변경/);
 button(render(),'선택한 노드에서 편집').props.onClick();confirm(render()).props.onConfirm();assert.equal(buffers[id],undefined);assert.equal(buffers[targetId].text,'server { listen 8080; }');assert.equal(opened,1);
 buffers=seed();state[1]='';state[2]='';button(render(),'편집 버리기').props.onClick();assert.equal(state[3].kind,'discard');confirm(render()).props.onCancel();assert.deepEqual(buffers,seed());
 button(render(),'편집 버리기').props.onClick();confirm(render()).props.onConfirm();assert.equal(buffers[id],undefined);assert.deepEqual(buffers[targetId],seed()[targetId]);
 buffers=seed();props.target={...props.target,readOnly:true};assert.equal(button(render(),'선택한 노드에서 편집').props.disabled,true);
 assert.equal(original.source,'server {}');assert.equal(live.source,'server renamed {}');
});
