import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
async function fixture(props){await loadBindings();const compiled=await transform(await readFile(new URL('../components/postgresql-completed-history.tsx',import.meta.url),'utf8'),{filename:'postgresql-completed-history.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});const states=[],refs=[],effects=[],pending=[],Button=()=>null,IconButton=()=>null,ConfirmDialog=()=>null,Checkbox=()=>null,NativeSelect=()=>null,module={exports:{}},native=createRequire(import.meta.url);let si=0,ri=0,ei=0;
 const hooks={...React,useState:initial=>{const at=si++;if(!(at in states))states[at]=initial;return[states[at],value=>states[at]=typeof value==='function'?value(states[at]):value];},useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),useEffect:(fn,deps)=>{const at=ei++;if(!effects[at]||deps.some((value,i)=>value!==effects[at].deps[i]))pending.push(()=>{effects[at]?.cleanup?.();effects[at]={deps,cleanup:fn()};});}};
 new Function('require','module','exports',compiled.code)(name=>name==='./console-types'?consoleTypes:name==='./ui/toast-provider'?toastTestModuleWithReact(hooks):name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/confirm-dialog'?{__esModule:true,default:ConfirmDialog}:name==='./ui/controls'?{Button,IconButton,Checkbox,NativeSelect}:name==='./mariadb-resource-review'?{__esModule:true,default:()=>null}:native(name),module,module.exports);
 const render=()=>{si=ri=ei=0;const tree=module.exports.default(props);while(pending.length)pending.shift()();return tree;};const all=tree=>!tree||typeof tree!=='object'?[]:[tree,...React.Children.toArray(toastTestChildren(tree)).flatMap(all)];const nodes=()=>all(render());return{props,nodes,Button,IconButton,ConfirmDialog,Checkbox,NativeSelect,dispose:()=>effects.forEach(effect=>effect.cleanup?.())};
}

const path='/etc/postgresql/18/fixture/postgresql.conf',id='d834ae1b-1108-4835-a860-82077d70d4f8',version='a'.repeat(64),security={settings:{readOnly:false,databaseChanges:true,sudoWithoutPrompt:true},available:{},privilege:{ready:true}};
const record={id,path,version,createdAt:'2026-10-05T00:00:00Z',phase:'committed',fileCount:2,backupAvailable:true};
const catalog={path,records:[record],warnings:0,truncated:false};
test('history GUI refreshes explicitly, confirms import exactly once, then offers a separate backup review',async()=>{
 const requests=[],opened=[];let finish;
 const view=await fixture({path,security,connected:true,onReviewBackup:value=>opened.push(value),api:async(action,data)=>{requests.push({action,data});return action.startsWith('postgresql-restore-history?')?catalog:new Promise(resolve=>finish=resolve);}});
 view.nodes();assert.equal(requests.length,0);
 await view.nodes().find(node=>node.type===view.IconButton&&node.props['aria-label']==='새로고침').props.onClick();
 view.nodes().find(node=>node.type===view.IconButton&&node.props['aria-label']==='원본 설정을 백업으로 가져오기').props.onClick();
 const dialog=view.nodes().find(node=>node.type===view.ConfirmDialog);assert(dialog.props.request);const first=dialog.props.onConfirm(),second=dialog.props.onConfirm();
 assert.equal(requests.length,2);assert.deepEqual(requests[1],{action:'postgresql-history-backup',data:{path,id,version,confirm:true}});
 finish({path,id,created:true});await Promise.all([first,second]);assert.equal(opened.length,0);
 view.nodes().find(node=>node.type===view.IconButton&&node.props['aria-label']==='복원 검토').props.onClick();assert.deepEqual(opened,[id]);view.dispose();
});
test('history GUI drops stale node and confirmation callbacks after cluster or policy changes',async()=>{
 const requests=[],view=await fixture({path,security,connected:true,api:async(action,data)=>{requests.push({action,data});return catalog;}});
 view.nodes();await view.nodes().find(node=>node.type===view.IconButton&&node.props['aria-label']==='새로고침').props.onClick();
 const old=view.nodes().find(node=>node.type===view.IconButton&&node.props['aria-label']==='원본 설정을 백업으로 가져오기');old.props.onClick();const dialog=view.nodes().find(node=>node.type===view.ConfirmDialog);
 view.props.path='/etc/postgresql/18/other/postgresql.conf';view.nodes();old.props.onClick();dialog.props.onConfirm();assert.equal(requests.length,1);
 assert(!view.nodes().find(node=>node.type===view.ConfirmDialog).props.request);view.dispose();
});
test('history GUI allows readonly metadata refresh but blocks original backup creation and rejects malformed server rows',async()=>{
 const requests=[],view=await fixture({path,security:{...security,settings:{...security.settings,readOnly:true}},connected:true,api:async(action,data)=>{requests.push({action,data});return catalog;}});
 view.nodes();await view.nodes().find(node=>node.type===view.IconButton&&node.props['aria-label']==='새로고침').props.onClick();
 const button=view.nodes().find(node=>node.type===view.IconButton&&node.props['aria-label']==='원본 설정을 백업으로 가져오기');assert.equal(button.props.disabled,true);button.props.onClick();assert(!view.nodes().find(node=>node.type===view.ConfirmDialog).props.request);assert.equal(requests.length,1);
 view.props.api=async()=>({...catalog,records:[{...record,version:'invalid'}]});view.nodes();await view.nodes().find(node=>node.type===view.IconButton&&node.props['aria-label']==='새로고침').props.onClick();assert(view.nodes().some(node=>node.props?.role==='alert'));view.dispose();
});
