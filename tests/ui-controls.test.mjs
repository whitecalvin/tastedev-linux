import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {translate} from '../lib/i18n.ts';

async function component(file,hooks,locale='ko'){
 await loadBindings();
 const compiled=await transform(await readFile(new URL('../components/ui/'+file,import.meta.url),'utf8'),{filename:file,jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='react'?hooks:name==='react-dom'?{createPortal:node=>node}:name==='../language-provider'?{useLanguage:()=>({t:value=>translate(locale,value)})}:name.endsWith('.css')||name==='./custom-select'?{}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 return module.exports;
}
function find(node,type){if(!node||typeof node!=='object')return; if(node.type===type)return node;for(const child of React.Children.toArray(node.props?.children)){const match=find(child,type);if(match)return match;}}
async function selectHarness(props){
 const state=[false,-1,null],refs=[];let cursor=0,refCursor=0;
 const hooks={...React,useId:()=> 'select-fixture',useEffect:()=>{},useState:()=>{const index=cursor++;return[state[index],next=>{state[index]=typeof next==='function'?next(state[index]):next;}];},useRef:value=>refs[refCursor++]??=( {current:value} )};
 const {CustomSelect}=await component('custom-select.tsx',hooks);
 const render=()=>{cursor=0;refCursor=0;return CustomSelect(props);};
 const key=(key,extra={})=>{let prevented=false;find(render(),'button').props.onKeyDown({key,preventDefault:()=>prevented=true,...extra});return prevented;};
 return{state,render,key,refs};
}
test('custom select navigates enabled options and commits only on selection',async()=>{
 const changes=[],options=[{value:0,label:'Unavailable',disabled:true},{value:1,label:'Alpha'},{value:2,label:'Beta'},{value:3,label:'Alpine'}];
 const h=await selectHarness({label:'Package',name:'package',options,value:2,onChange:event=>changes.push(event.target)});
 assert.equal(h.key('Home'),true);assert.equal(h.state[0],true);assert.equal(h.state[1],1);
 h.key('End');assert.equal(h.state[1],3);h.key('ArrowDown');assert.equal(h.state[1],1);h.key('ArrowUp');assert.equal(h.state[1],3);assert.deepEqual(changes,[]);
 const trigger=find(h.render(),'button');assert.equal(trigger.props['aria-activedescendant'],'select-fixture-options-3');assert.equal(trigger.props['aria-labelledby'],'select-fixture-label');
 h.key('Enter');assert.deepEqual(changes,[{value:'3',name:'package'}]);assert.equal(h.state[0],false);
 h.key('ArrowDown');h.key('Escape');assert.equal(h.state[0],false);assert.equal(changes.length,1);
 h.key('ArrowDown');assert.equal(h.key('Tab'),false);assert.equal(h.state[0],false);assert.equal(find(h.render(),'input').props.name,'package');
});
test('custom select typeahead cycles matching options and respects disabled state',async()=>{
 const options=[{value:'a',label:'Alpha'},{value:'x',label:'Albatross',disabled:true},{value:'b',label:'Beta'},{value:'c',label:'Alpine'}];
 const props={label:'Package',options,value:'b'},h=await selectHarness(props);
 h.key('a');assert.equal(h.state[1],3);h.key('a');assert.equal(h.state[1],0);h.key('l');assert.equal(h.state[1],0);
 h.key('Escape');h.key('b',{ctrlKey:true});assert.equal(h.state[0],false);
 props.disabled=true;h.key('Home');assert.equal(h.state[0],false);assert.equal(find(h.render(),'button').props.disabled,true);
 props.disabled=false;props.options=options.map(option=>({...option,disabled:true}));h.key('End');assert.equal(h.state[0],false);assert.equal(Number.isNaN(h.state[1]),false);
});
test('native select and switch preserve native semantics and label linkage',async()=>{
 let index=0;const {NativeSelect,Switch,Dropdown}=await component('controls.tsx',{...React,useId:()=> 'control-'+index++});
 assert.equal(Dropdown,NativeSelect);
 const tree=NativeSelect({label:'Package',value:'nginx',name:'package',options:[{value:'nginx',label:'nginx'},{value:'redis',label:'Redis',disabled:true}]});
 assert.equal(find(tree,'label').props.htmlFor,find(tree,'select').props.id);assert.equal(find(tree,'select').props.name,'package');assert.equal(React.Children.toArray(find(tree,'select').props.children)[1].props.disabled,true);
 const toggle=Switch({label:'Enabled',checked:true,disabled:true}),input=find(toggle,'input');assert.equal(toggle.props.htmlFor,input.props.id);assert.equal(input.props.type,'checkbox');assert.equal(input.props.role,'switch');assert.equal(input.props.checked,true);assert.equal(input.props.disabled,true);
});

test('indeterminate progress translates visible and accessible status while retaining determinate values',async()=>{
 for(const locale of ['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk']){
  const {Progress}=await component('controls.tsx',React,locale);
  const pending=Progress({label:'진행 중'}),bar=find(pending,'div').props.children[1];
  assert.equal(bar.props.role,'progressbar');
  assert.equal(bar.props['aria-valuetext'],translate(locale,'진행 중 · 전체 진행률 미확인'));
  assert.equal(bar.props['aria-valuenow'],undefined);
  assert(JSON.stringify(pending).includes(translate(locale,'진행 중')));
  const complete=Progress({label:'진행 중',value:50,max:100});
  assert(JSON.stringify(complete).includes('50%'));
 }
});
