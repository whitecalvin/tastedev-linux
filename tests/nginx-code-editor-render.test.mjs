import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {hasUnsavedFiles} from '../lib/draft-state.ts';
test('code editor clears undone edits and protects edits against external source changes',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/nginx-code-editor.tsx',import.meta.url),'utf8'),{filename:'nginx-code-editor.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 let buffers={},viewStates={},error='',committed;const state=['',null],refs=[],effects=[];let cursor=0,refCursor=0;
 const native=createRequire(import.meta.url),module={exports:{}};
 const hooks={...React,useEffect:callback=>effects.push(callback),useRef:()=>{const index=refCursor++;return refs[index]||(refs[index]={current:null});},useState:()=>{const index=cursor++;return [state[index],next=>{state[index]=next;if(index===0)error=next;}];}};
 const require=name=>name==='./console-types'?consoleTypes:name==='./nginx-icon'?{__esModule:true,default:'nginx-icon'}:name==='./ui/confirm-dialog'?{__esModule:true,default:'confirm-dialog'}:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./draft-provider'?{useDraftGeneration:()=>0,useDraftState:key=>key==='nginxCodeViewStates'?[viewStates,next=>viewStates=typeof next==='function'?next(viewStates):next]:[buffers,next=>buffers=typeof next==='function'?next(buffers):next]}:name==='./ui/controls'?{Button:'button'}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const props={identity:'fixture',source:'server { listen 80; }',onCommit:value=>committed=value};
 const find=(node,predicate)=>{if(!node||typeof node!=='object')return;if(predicate(node))return node;for(const child of React.Children.toArray(node.props?.children)){const result=find(child,predicate);if(result)return result;}};
 const render=()=>{cursor=0;refCursor=0;effects.length=0;return module.exports.default(props);};
 const input=text=>find(render(),node=>node.type==='textarea').props.onChange({target:{value:text}});
 input('server { listen 8080; }');assert.equal(buffers.fixture.baseline,props.source);assert(hasUnsavedFiles({nginxCodeBuffers:buffers}));
 input(props.source);assert.deepEqual(buffers,{});
 input('server { listen 8080; }');props.source='server { listen 81; }';
 find(render(),node=>node.type==='button'&&node.props['aria-label']==='초안에 반영').props.onClick();assert.match(error,/설정이 변경/);assert.equal(committed,undefined);assert.equal(buffers.fixture.text,'server { listen 8080; }');
 input('server { listen 80; }');assert.equal(buffers.fixture.text,buffers.fixture.baseline);assert.equal(buffers.fixture.dirty,true);assert(hasUnsavedFiles({nginxCodeBuffers:buffers}));

 const reset=()=>find(render(),node=>node.type==='button'&&node.props['aria-label']==='편집 초기화').props.onClick();
 const confirmation=()=>find(render(),node=>node.type==='confirm-dialog');
 const other={text:'other edits',baseline:'other source',dirty:true};buffers.other=other;
 reset();assert(confirmation().props.request);confirmation().props.onCancel();assert.equal(confirmation().props.request,null);assert.ok(buffers.fixture);
 reset();input('newer edit');confirmation().props.onConfirm();assert.equal(buffers.fixture.text,'newer edit');assert.match(error,/설정이 변경/);
 reset();props.source='server { listen 82; }';const changed=confirmation();assert.equal(changed.props.request,null);changed.props.onConfirm();assert.ok(buffers.fixture);
 reset();props.readOnly=true;const protectedReset=confirmation();assert.equal(protectedReset.props.request,null);protectedReset.props.onConfirm();assert.ok(buffers.fixture);props.readOnly=false;
 reset();confirmation().props.onConfirm();assert.equal(buffers.fixture,undefined);assert.equal(buffers.other,other);assert.equal(committed,undefined,'reset changes only the unsaved buffer');
 const positioned=find(render(),node=>node.type==='textarea');
 const view={value:positioned.props.value,selectionStart:3,selectionEnd:9,selectionDirection:'backward',scrollTop:154,scrollLeft:88};
 positioned.props.onSelect({currentTarget:view});assert.equal(viewStates.fixture.start,3);assert.equal(viewStates.fixture.direction,'backward');
 assert.equal(hasUnsavedFiles({nginxCodeViewStates:viewStates}),false,'view positions alone do not create unsaved configuration');
 const restored=find(render(),node=>node.type==='textarea'),scrollGutter={},scrollHighlight={};
 refs[0].current=scrollGutter;refs[1].current=scrollHighlight;let restoredSelection;
 const element={value:restored.props.value,scrollTop:0,scrollLeft:0,setSelectionRange:(...args)=>restoredSelection=args};restored.props.ref.current=element;
 effects.at(-1)();assert.deepEqual(restoredSelection,[3,9,'backward']);assert.equal(element.scrollTop,154);assert.equal(element.scrollLeft,88);assert.equal(scrollGutter.scrollTop,154);assert.equal(scrollHighlight.scrollLeft,88);
 restoredSelection=undefined;element.value='externally changed text';effects.at(-1)();assert.equal(restoredSelection,undefined,'positions from another text snapshot must not be replayed');
 for(let index=0;index<40;index++){props.identity='view-'+index;find(render(),node=>node.type==='textarea').props.onScroll({currentTarget:view});}
 assert.equal(Object.keys(viewStates).length,32);assert.equal(viewStates.fixture,undefined);assert.equal(viewStates['view-39'].left,88);props.identity='fixture';
 props.readOnly=true;
 const locked=find(render(),node=>node.type==='textarea');assert.equal(locked.props.readOnly,true);assert.equal(locked.props.value,props.source);assert(!find(render(),node=>node.type==='button'));
 const before=JSON.stringify(buffers);locked.props.onChange({target:{value:'injected'}});locked.props.onKeyDown({key:'s',ctrlKey:true,preventDefault(){}});assert.equal(JSON.stringify(buffers),before);assert.equal(committed,undefined);props.readOnly=false;
 const previousFrame=globalThis.requestAnimationFrame;let selection,prevented=false;
 try{
  globalThis.requestAnimationFrame=callback=>callback();
  input('    server {}');
  const textarea=find(render(),node=>node.type==='textarea');
  const event={key:'Tab',shiftKey:true,currentTarget:{selectionStart:4,selectionEnd:4,setSelectionRange:(start,end)=>selection=[start,end]},preventDefault:()=>prevented=true};
  textarea.props.onKeyDown({...event,ctrlKey:true});assert.equal(prevented,false);assert.equal(buffers.fixture.text,'    server {}');
  for(const marker of [{isComposing:true},{nativeEvent:{isComposing:true}},{keyCode:229},{nativeEvent:{keyCode:229}}])for(const key of ['Tab','s'])textarea.props.onKeyDown({...event,key,ctrlKey:key==='s',...marker});
  assert.equal(prevented,false);assert.equal(committed,undefined);assert.equal(buffers.fixture.text,'    server {}','IME composition must not indent or commit a partial buffer');
  textarea.props.onKeyDown(event);assert(prevented);assert.equal(buffers.fixture.text,'server {}');assert.deepEqual(selection,[0,0]);
 }finally{if(previousFrame===undefined)delete globalThis.requestAnimationFrame;else globalThis.requestAnimationFrame=previousFrame;}
});
