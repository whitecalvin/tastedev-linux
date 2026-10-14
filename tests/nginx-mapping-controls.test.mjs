import {toastTestModule,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {parseNginxTree} from '../lib/nginx-syntax.ts';

test('tree edit and add handlers validate mapping results by their ancestry and preserve native directive limits',async()=>{
 await loadBindings();
 const compiled=await transform(await readFile(new URL('../components/nginx-config-tree.tsx',import.meta.url),'utf8'),{filename:'nginx-config-tree.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const state=[];let cursor=0,refCursor=0,drafts={};
 const refs=[];
 const hooks={...React,useRef:initial=>{const i=refCursor++;return refs[i]??(refs[i]={current:initial});},useEffect(){},useState(initial){const index=cursor++;if(!(index in state))state[index]=initial;return[state[index],value=>state[index]=typeof value==='function'?value(state[index]):value];}};
 const native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./draft-provider'?{useDraftGeneration:()=>0,useDraftState:key=>[key==='nginxDrafts'?drafts:'',next=>{if(key==='nginxDrafts')drafts=typeof next==='function'?next(drafts):next;}]}:name==='./ui/controls'?{Button:'button',Badge:'badge',TextInput:'input',Switch:'switch',Dropdown:'select'}:name.startsWith('./nginx-')||name==='./ui/confirm-dialog'?{__esModule:true,default:name==='./nginx-block-settings'?'block-settings':'stub'}:name==='./ui/ide-split-layout'?{__esModule:true,default:'div'}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const source='events { worker_connections 2; } http { map $host $target { worker_connections 2; gzip on; server_tokens off; } }';
 const file={name:'nginx.conf',path:'/etc/nginx/nginx.conf',source,nodes:parseNginxTree(source)};
 function find(node,type){if(!node||typeof node!=='object')return null;if(node.type===type)return node;for(const child of React.Children.toArray(toastTestChildren(node))){const result=find(child,type);if(result)return result;}return null;}
 function render(node,target=file,files=[file]){state[2]={file:target,node};cursor=refCursor=0;return find(module.exports.default({data:{root:'/etc/nginx',files}}),'block-settings');}
 const map=file.nodes[1].children[0];
 let view=render(map);assert.equal(view.props.context,'map');
 view.props.onEdit(map.children[0],'backend.example');assert.match(drafts[file.path].source,/worker_connections backend\.example;/);assert.equal(state[7],'');
 drafts={};view=render(map.children[1]);assert.equal(view.props.context,'map');view.props.onEdit(map.children[1],'enabled-backend');assert.match(drafts[file.path].source,/gzip enabled-backend;/);
 drafts={};view=render(map);assert.equal(view.props.onAdd('server_tokens','new-backend'),true);assert.match(drafts[file.path].source,/server_tokens new-backend;/);
 drafts={};view=render(map.children[1]);assert.equal(view.props.onAdd('default','sibling-backend'),true);const added=parseNginxTree(drafts[file.path].source)[1].children[0];assert(added.children.some(node=>node.label==='default sibling-backend'));assert.equal(added.children.find(node=>node.label==='gzip on').kind,'directive');
 drafts={};view=render(file.nodes[0]);view.props.onEdit(file.nodes[0].children[0],'backend.example');assert.deepEqual(drafts,{});assert.match(state[7],/숫자 설정/);
 assert.equal(view.props.onAdd('worker_connections','backend.example'),false);assert.deepEqual(drafts,{});
 assert.equal(view.props.onAdd('worker_connections','256'),true);assert.match(drafts[file.path].source,/worker_connections 256;/);
 assert.equal(file.source,source,'handlers only change the draft, never the inspected source');
 drafts={};
 const main={...file,source:'http { map $host $out { include mapped.conf; } }'};main.nodes=parseNginxTree(main.source);
 const included={name:'mapped.conf',path:'/etc/nginx/mapped.conf',source:'worker_connections 2;',nodes:parseNginxTree('worker_connections 2;')};
 view=render(included.nodes[0],included,[main,included]);assert.equal(view.props.context,'map');view.props.onEdit(included.nodes[0],'included-backend');assert.match(drafts[included.path].source,/worker_connections included-backend;/);assert.equal(included.source,'worker_connections 2;');
 drafts={};view=render(included.nodes[0],included,[main,included]);assert.equal(view.props.onAdd('default','included-fallback'),true);assert.equal(parseNginxTree(drafts[included.path].source).at(-1).label,'default included-fallback');
 drafts={};view=render(null,included,[main,included]);assert.equal(view.props.onAdd('"~Opera Mini"','mobile'),true);assert.match(drafts[included.path].source,/"~Opera Mini" mobile;/);
 drafts={};const quoted={...file,source:'http { map $http_user_agent $device { "~Opera Mini" mobile; } }'};quoted.nodes=parseNginxTree(quoted.source);const rule=quoted.nodes[0].children[0].children[0];
 view=render(rule,quoted,[quoted]);view.props.onEdit(rule,'mobile_v2');assert.match(drafts[quoted.path].source,/"~Opera Mini" mobile_v2;/);assert.doesNotMatch(drafts[quoted.path].source,/"~Opera mobile_v2/);
 drafts={};const upstream={...file,source:'http { upstream backend { ip_hash; server 127.0.0.1:3000; } }'};upstream.nodes=parseNginxTree(upstream.source);
 view=render(upstream.nodes[0].children[0],upstream,[upstream]);assert.equal(view.props.onAdd('least_conn',''),false);assert.deepEqual(drafts,{});assert.match(state[7],/부하 분산 방식이 이미/);assert.match(upstream.source,/ip_hash;/);
 for(const mode of ['settings','code']){
  state[10]=mode;cursor=refCursor=0;
  const tree=module.exports.default({data:{root:'/etc/nginx',files:[upstream]}});
  function flatten(node,result=[]){if(!node||typeof node!=='object')return result;result.push(node);React.Children.forEach(toastTestChildren(node),child=>flatten(child,result));return result;}
  const inspector=flatten(tree).find(node=>node.props?.className?.split(' ').includes('nginx-node-inspector'));
  const children=React.Children.toArray(toastTestChildren(inspector)).flatMap(node=>node.type===React.Fragment?React.Children.toArray(toastTestChildren(node)):[node]);
  const tabs=children.findIndex(node=>node.props?.className==='nginx-inspector-tabs');
  const alert=children.findIndex(node=>node.props?.role==='alert');
  assert.equal(alert,tabs+1,'a conflict remains visible directly under the tabs in both views');
  assert.match(children[alert].props.children,/부하 분산 방식이 이미/);
  assert.equal(flatten(tree).filter(node=>node.props?.role==='alert').length,1);
 }
 assert.equal(view.props.onAdd('server','127.0.0.1:3001'),true);assert.match(drafts[upstream.path].source,/127\.0\.0\.1:3001/);assert.equal(state[7],'');
});
