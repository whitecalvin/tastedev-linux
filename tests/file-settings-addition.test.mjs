import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';
import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {retainSettingInputs} from '../lib/file-settings-draft.ts';import {hasUnsavedIdeRecord} from '../lib/draft-state.ts';
test('package setting additions survive file/group switches and only successful additions clear their pending form',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/file-settings.tsx',import.meta.url),'utf8'),{filename:'file-settings.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}}),native=createRequire(import.meta.url);
 for(const format of ['postgresql','redis','mariadb']){
  const module={exports:{}},hooks={...React,useRef:value=>({current:value}),useId:()=> 'fixture',useState:value=>[value,()=>{}],useEffect:()=>{},useMemo:fn=>fn()};
  new Function('require','module','exports',compiled.code)(name=>name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({locale:'ko',t:value=>value})}:name==='./ui/controls'?{Button:'Button',Switch:'Switch',TextInput:'TextInput',Dropdown:'Dropdown'}:native(name),module,module.exports);
  const source=format==='postgresql'?'port = 5432\n':format==='redis'?'port 6379\n':'[mariadbd]\nport = 3306\n';let record={sourcePath:'/fixture/first.conf',text:source,baseline:source},requestedGroup=format==='mariadb'?'mariadbd':undefined;
  const nodes=tree=>!tree||typeof tree!=='object'?[]:[tree,...React.Children.toArray(tree.props?.children).flatMap(nodes)];const render=()=>nodes(module.exports.default({format,record,requestedGroup,onChange:change=>record={...record,...change}}));
  const input=label=>render().find(node=>node.type==='TextInput'&&node.props.label===label);
  input('설정 이름').props.onChange({target:{value:format==='redis'?'maxclients':'max_connections'}});input('설정값').props.onChange({target:{value:'200'}});
  assert.equal(record.text,source);assert(hasUnsavedIdeRecord(record));const original=record;
  record={sourcePath:'/fixture/second.conf',text:source,baseline:source};assert.equal(input('설정 이름').props.value,'');record=original;assert.equal(input('설정값').props.value,'200');
  if(format==='mariadb'){requestedGroup='client';assert.equal(input('설정 이름').props.value,'');requestedGroup='mariadbd';assert.equal(input('설정값').props.value,'200');}
  const altered='# inserted\n'+record.text;record={...record,text:altered,pendingSettingInputs:retainSettingInputs(format,altered,record.pendingSettingInputs,record.text)};assert.equal(input('설정값').props.value,'200');
  record={...record,pendingSettingInputs:{...record.pendingSettingInputs,other:{raw:'fixture',value:'미완성'}}};render().find(node=>node.type==='Button'&&node.props.children==='초안에 항목 추가').props.onClick();
  assert(record.text.includes(format==='redis'?'maxclients 200':'max_connections = 200'));assert.equal(input('설정 이름').props.value,'');assert.equal(input('설정값').props.value,'');assert.equal(record.pendingSettingInputs.other.value,'미완성');
  input('설정 이름').props.onChange({target:{value:'bad\nname'}});input('설정값').props.onChange({target:{value:'300'}});const before=record.text;render().find(node=>node.type==='Button'&&node.props.children==='초안에 항목 추가').props.onClick();assert.equal(record.text,before);assert.equal(input('설정값').props.value,'300','failed additions retain the entered form');
 }
});
