import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {rememberCodeView,restoreCodeView} from '../lib/code-view-state.ts';
import {hasUnsavedFiles} from '../lib/draft-state.ts';
test('package editor retains selection and both scroll axes across remount and keeps files separate',async()=>{
 await loadBindings();const source=await readFile(new URL('../components/config-code-editor.tsx',import.meta.url),'utf8');const compiled=await transform(source,{filename:'config-code-editor.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 let views={},effects=[],refs=[],states=[],ri=0,si=0;const hooks={useEffect:(fn,deps)=>effects.push({fn,deps}),useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return [states[i],value=>states[i]=value];},useMemo:fn=>fn()};
 const native=createRequire(import.meta.url),module={exports:{}};const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='react'?hooks:name==='./draft-provider'?{useDraftState:()=>[views,update=>views=update(views)]}:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?{Button:'Button',IconButton:'IconButton',Badge:'Badge',TextInput:'TextInput'}:native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);
 function find(tree,type){if(!tree)return null;if(Array.isArray(tree))return tree.map(node=>find(node,type)).find(Boolean);if(tree.type===type)return tree;return find(toastTestChildren(tree),type);}
 function mount(record){refs=[];states=[];effects=[];ri=si=0;const tree=module.exports.default({record,connected:true,api:()=>{throw Error('Unexpected API');}}),textarea=find(tree,'textarea'),gutter={},highlight={},input={value:record.text,selectionStart:0,selectionEnd:0,selectionDirection:'none',scrollTop:0,scrollLeft:0,parentElement:{previousSibling:gutter,firstChild:highlight},setSelectionRange(start,end,direction){this.selectionStart=start;this.selectionEnd=end;this.selectionDirection=direction;}};textarea.props.ref.current=input;for(const effect of effects)effect.fn();return {textarea,input,gutter,highlight};}
 const record={kind:'postgresql',sourcePath:'/etc/postgresql/18/main/postgresql.conf',name:'postgresql.conf',text:'a'.repeat(1000),baseline:'a'.repeat(1000)};
 let active=mount(record);Object.assign(active.input,{selectionStart:600,selectionEnd:610,selectionDirection:'backward',scrollTop:400,scrollLeft:80});active.textarea.props.onSelect({currentTarget:active.input});active.textarea.props.onScroll({currentTarget:active.input});assert.equal(active.highlight.scrollLeft,80);assert.equal(active.gutter.scrollTop,400);
 active=mount({...record,sourcePath:'/etc/postgresql/18/other/postgresql.conf'});assert.equal(active.input.selectionStart,0,'same basename in another cluster has no position');
 active=mount({...record,version:'saved-version'});assert.equal(active.input.selectionStart,600);assert.equal(active.input.selectionEnd,610);assert.equal(active.input.selectionDirection,'backward');assert.equal(active.input.scrollTop,400);assert.equal(active.highlight.scrollTop,400);assert.equal(active.highlight.scrollLeft,80);assert.equal(active.gutter.scrollTop,400);
 active=mount({...record,text:'new source'});assert.equal(active.input.selectionStart,0,'changed content cannot inherit obsolete offsets');assert.equal(active.input.scrollTop,0);
 assert.equal(hasUnsavedFiles({configCodeViewStates:views}),false,'position alone never makes an unsaved file');
});
test('code position cache is bounded and stale text restoration leaves the input untouched',()=>{
 let cache={};for(let index=0;index<40;index++)cache=rememberCodeView(cache,String(index),{value:'text',selectionStart:1,selectionEnd:3,selectionDirection:'forward',scrollTop:10,scrollLeft:20});assert.equal(Object.keys(cache).length,32);assert(!Object.hasOwn(cache,'0'));assert(Object.hasOwn(cache,'39'));
 const input={value:'different',scrollTop:5,setSelectionRange(){throw Error('Unexpected selection');}};assert.equal(restoreCodeView(input,cache['39']),false);assert.equal(input.scrollTop,5);assert.equal(restoreCodeView(null,cache['39']),false);
});
