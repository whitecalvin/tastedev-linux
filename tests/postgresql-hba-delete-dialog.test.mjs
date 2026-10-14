import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';

test('HBA deletion confirmation cancels, rejects changed drafts and cannot delete a second rule through a stale approval',async()=>{
 await loadBindings();const source=await readFile(new URL('../components/postgresql-hba-settings.tsx',import.meta.url),'utf8');assert(!source.includes('window.confirm'));
 const compiled=await transform(source,{filename:'postgresql-hba-settings.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),module={exports:{}},state=[],refs=[];let cursor=0,refCursor=0;
 const hooks={...React,useState:initial=>{const index=cursor++;if(!(index in state))state[index]=initial;return[state[index],next=>state[index]=typeof next==='function'?next(state[index]):next];},useRef:()=>{const index=refCursor++;return refs[index]??=( {current:null});}};
 const require=name=>name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./ui/confirm-dialog'?{__esModule:true,default:'confirm-dialog'}:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button:'button',TextInput:'input',Dropdown:'select'}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 let changes=[];const props={record:{sourcePath:'/fixture/pg_hba.conf',text:'# preserve comment\nlocal all all peer\nhost all all 127.0.0.1/32 scram-sha-256\ninclude rules.conf\n'},onChange:next=>changes.push(next),onCode:()=>{}};
 const find=(node,predicate)=>{if(!node||typeof node!=='object')return;if(predicate(node))return node;for(const child of React.Children.toArray(node.props?.children)){const found=find(child,predicate);if(found)return found;}};
 const render=()=>{cursor=0;refCursor=0;return module.exports.default(props);};
 const dialog=()=>find(render(),node=>node.type==='confirm-dialog');
 const request=(index=0)=>{const nodes=[];const visit=node=>{if(!node||typeof node!=='object')return;if(typeof node.type==='function'&&node.props.entry)nodes.push(node);React.Children.forEach(node.props?.children,visit);};visit(render());nodes[index].props.onDelete(nodes[index].props.entry);};
 request();assert.equal(dialog().props.request.detail.trimEnd(),'local all all peer');assert.deepEqual(changes,[]);dialog().props.onCancel();assert.equal(dialog().props.request,null);assert.deepEqual(changes,[]);
 request();const oldApproval=dialog().props.onConfirm;props.record={...props.record,text:props.record.text.replace('local all all peer','local all all scram-sha-256')};assert.equal(dialog().props.request,null);oldApproval();assert.deepEqual(changes,[]);assert.match(find(render(),node=>node.props?.role==='alert').props.children,/설정이 변경/);
 request();const stale=dialog().props.onConfirm;request(1);const current=dialog();stale();assert.deepEqual(changes,[]);assert.equal(dialog().props.request.detail.trimEnd(),'host all all 127.0.0.1/32 scram-sha-256');current.props.onConfirm();assert.equal(changes.length,1);assert.equal(changes[0].text,'# preserve comment\nlocal all all scram-sha-256\ninclude rules.conf\n');current.props.onConfirm();assert.equal(changes.length,1,'Duplicate approval must be ignored');
 request();const changedInPlace=dialog().props.onConfirm;props.record.text+='host all all ::1/128 scram-sha-256\n';render();changedInPlace();assert.equal(changes.length,1,'Changed source bytes must be preserved');
});
