import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import * as consoleTypes from '../components/console-types.ts';
async function fixture(props,drafts={editorTabs:[],editorActive:''}){
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/ide-editor.tsx',import.meta.url),'utf8'),{filename:'ide-editor.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],effects=[];let si=0,ri=0,ei=0,queued=[];const Button=()=>null,Input=()=>null;
 const hooks={...React,useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return[states[i],next=>states[i]=typeof next==='function'?next(states[i]):next];},useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),useMemo:fn=>fn(),useEffect:(fn,deps)=>{const i=ei++,old=effects[i];if(!old||deps.some((value,j)=>!Object.is(value,old.deps[j])))queued.push(()=>{old?.cleanup?.();effects[i]={deps,cleanup:fn()};});}};
 const native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='react'?hooks:name==='./console-types'?consoleTypes:name==='./draft-provider'?{useDraftState:(key,initial)=>[drafts[key]??initial,next=>drafts[key]=typeof next==='function'?next(drafts[key]??initial):next]}:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?{Button,TextInput:Input,Badge:()=>null}:name==='./ui/confirm-dialog'?{__esModule:true,default:()=>null}:name==='./package-config'?{__esModule:true,default:()=>null}:name==='../lib/capabilities.ts'?{featureAllowed:policy=>Boolean(policy&&!policy.settings.readOnly&&policy.settings.fileEditing)}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 function render(flush=true){si=ri=ei=0;const tree=module.exports.default(props);if(flush){const pending=queued;queued=[];pending.forEach(fn=>fn());}return tree;}
 function nodes(tree=render()){const all=[];function visit(node){if(!node||typeof node!=='object')return;all.push(node);React.Children.forEach(node.props?.children,visit);}visit(tree);return all;}
 return{props,drafts,render,nodes,button:label=>nodes().find(n=>n.type===Button&&n.props.children===label),dispose:()=>effects.forEach(e=>e.cleanup?.())};
}
const security={settings:{readOnly:false,fileEditing:true}};
test('workspace file catalog rejects retained refresh and old response without unlocking a new query',async()=>{
 let finishOld,finishNew,calls=0;const view=await fixture({connected:true,security,api:()=>{calls++;return new Promise(resolve=>finishOld=resolve);},log:()=>{}});view.render();const old=view.button('새로고침').props.onClick,pending=old();await old();assert.equal(calls,1);
 view.props.api=()=>new Promise(resolve=>finishNew=resolve);view.render(false);await old();assert.equal(calls,1);view.render();const fresh=view.button('새로고침').props.onClick();finishOld({root:'/old',files:['old.js']});await pending;assert.equal(view.button('새로고침').props.disabled,true);assert(!JSON.stringify(view.render()).includes('old.js'));
 finishNew({root:'/new',files:['new.js']});await fresh;assert(JSON.stringify(view.render()).includes('new.js'));assert.equal(view.button('새로고침').props.disabled,false);view.dispose();
});
test('workspace editor ignores late file open on disconnected view and rejects wrong path',async()=>{
 let finish;const logs=[],api=async action=>action==='files'?{root:'/fixture',files:['one.js']} : new Promise(resolve=>finish=resolve);
 const view=await fixture({connected:true,security,api,log:(...args)=>logs.push(args)});view.render();await view.button('새로고침').props.onClick();const node=view.nodes().find(n=>n.type==='button'&&n.props.title==='one.js');const pending=node.props.onClick();view.props.connected=false;view.render(false);finish({name:'one.js',text:'late',version:'v1'});await pending;assert.equal(view.drafts.editorTabs.length,0);
 view.props.connected=true;view.render();await view.button('새로고침').props.onClick();const wrong=view.nodes().find(n=>n.type==='button'&&n.props.title==='one.js').props.onClick();finish({name:'other.js',text:'wrong',version:'v2'});await wrong;assert.equal(view.drafts.editorTabs.length,0);assert.match(logs.at(-1)[0],/파일 경로/);view.dispose();
});
test('workspace editor save keeps original baseline after API replacement and old save cannot restart',async()=>{
 let finish,writes=0;const tab={name:'app.js',text:'edited',baseline:'original',version:'v1'},drafts={editorTabs:[tab],editorActive:'app.js'};
 const view=await fixture({connected:true,security,api:(action,body)=>{assert.equal(action,'file');assert.equal(body.version,'v1');writes++;return new Promise(resolve=>finish=resolve);},log:()=>{}},drafts);view.render();const stale=view.button('저장 · Ctrl+S').props.onClick,pending=stale();view.props.api=async()=>assert.fail('old save reached new API');view.render(false);await stale();assert.equal(writes,1);finish({text:'edited',version:'v2'});await pending;assert.equal(drafts.editorTabs[0].baseline,'original');assert.equal(drafts.editorTabs[0].version,'v1');view.dispose();await stale();assert.equal(writes,1);
});
