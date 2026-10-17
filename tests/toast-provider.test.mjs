import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';

test('shared notifications stack, dismiss independently, repeat events and clear on page unmount',async(t)=>{
 await loadBindings();
 const code=await transform(await readFile(new URL('../components/ui/toast-provider.tsx',import.meta.url),'utf8'),{filename:'toast-provider.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 let active,api=null;
 const hooks={...React,useId:()=>active.id,useContext:()=>api,useRef:initial=>{const owner=active,index=owner.refIndex++;return owner.refs[index]??(owner.refs[index]={current:initial});},
  useState:initial=>{const owner=active,index=owner.stateIndex++;if(!(index in owner.states))owner.states[index]=initial;return [owner.states[index],next=>{owner.states[index]=typeof next==='function'?next(owner.states[index]):next;}];},
  useCallback:(fn,deps)=>memo(()=>fn,deps),useMemo:(fn,deps)=>memo(fn,deps),
  useEffect:(fn,deps)=>{const owner=active,index=owner.effectIndex++;const old=owner.effects[index];if(!old||deps.some((d,i)=>d!==old.deps[i]))owner.pending.push(()=>{old?.cleanup?.();owner.effects[index]={deps,cleanup:fn()};});},
 };
 function memo(fn,deps){const owner=active,index=owner.memoIndex++,old=owner.memos[index];if(!old||deps.some((d,i)=>d!==old.deps[i]))owner.memos[index]={deps,value:fn()};return owner.memos[index].value;}
 function driver(id){return {id,states:[],refs:[],memos:[],effects:[],pending:[],render(fn,props){active=this;this.stateIndex=this.refIndex=this.memoIndex=this.effectIndex=0;const value=fn(props);while(this.pending.length)this.pending.shift()();return value;},dispose(){for(const effect of this.effects)effect?.cleanup?.();}};}
 const native=createRequire(import.meta.url),module={exports:{}},Toast=()=>null,ToastViewport=()=>null;
 new Function('require','module','exports',code.code)(name=>name==='react'?hooks:name==='../language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./toast'?{Toast,ToastViewport}:native(name),module,module.exports);
 const {ToastProvider,ToastNotice,useFeedback}=module.exports;
 const provider=driver('provider'),view=()=>provider.render(ToastProvider,{children:null});api=view().props.value;
 const first=driver('first'),second=driver('second');
 first.render(ToastNotice,{message:'saved',kind:'success',eventId:1});second.render(ToastNotice,{message:'failed',kind:'error'});
 let tree=view(),viewport=React.Children.toArray(tree.props.children).find(n=>n.type===ToastViewport);
 assert.deepEqual(viewport.props.children.map(n=>n.props.kind),['success','error']);
 viewport.props.children[0].props.onDismiss();assert.equal(provider.states[0].length,1);
 first.render(ToastNotice,{message:'saved',kind:'success',eventId:1});assert.equal(provider.states[0].length,1,'rerender must not reopen a dismissed event');
 first.render(ToastNotice,{message:'saved',kind:'success',eventId:2});assert.equal(provider.states[0].length,2,'another identical successful operation must be announced');
 second.dispose();assert.deepEqual(provider.states[0].map(n=>n.message),['saved'],'leaving a page clears its old error');
 const feedback=driver('feedback');let state=feedback.render(()=>useFeedback(''));state[1]('completed','success');state=feedback.render(()=>useFeedback(''));assert.equal(state[0],'completed');assert.equal(state[2],'success');const revision=state[3];state[1]('completed','error');state=feedback.render(()=>useFeedback(''));assert.equal(state[2],'error');assert.equal(state[3],revision+1);
 t.mock.timers.enable({apis:['setTimeout']});const timed=driver('timed'),persistent=driver('persistent');persistent.render(ToastNotice,{message:'error stays',kind:'error'});timed.render(ToastNotice,{message:'saved for 3 seconds',kind:'success',eventId:1,autoDismissMs:3000});t.mock.timers.tick(2999);assert(provider.states[0].some(n=>n.id==='timed'));t.mock.timers.tick(1);assert(!provider.states[0].some(n=>n.id==='timed'));assert(provider.states[0].some(n=>n.id==='persistent'));timed.render(ToastNotice,{message:'saved for 3 seconds',kind:'success',eventId:2,autoDismissMs:3000});t.mock.timers.tick(1000);timed.render(ToastNotice,{message:'saved for 3 seconds',kind:'success',eventId:3,autoDismissMs:3000});t.mock.timers.tick(2000);assert(provider.states[0].some(n=>n.id==='timed'));t.mock.timers.tick(1000);assert(!provider.states[0].some(n=>n.id==='timed'));timed.dispose();persistent.dispose();t.mock.timers.reset();
 api=null;const standalone=driver('standalone');let fallback=standalone.render(ToastNotice,{message:'warning',kind:'warning'});fallback.props.children.props.onDismiss();assert.equal(standalone.render(ToastNotice,{message:'warning',kind:'warning'}),null);
 first.dispose();standalone.dispose();
});
