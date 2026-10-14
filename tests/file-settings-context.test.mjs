import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
test('file settings reject stale row edits, pending inputs and additions after a file or code change',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/file-settings.tsx',import.meta.url),'utf8'),{filename:'file-settings.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url);
 for(const transition of ['file','code','format','group','unmount']){
  const refs=[],states=[],effects=[];let ri=0,si=0;const hooks={...React,useId:()=> 'fixture-id',useMemo:fn=>fn(),useEffect:(fn,deps)=>{if(!deps.length)effects.push(fn);},useRef:value=>refs[ri++]??(refs[ri-1]={current:value}),useState:value=>{const i=si++;if(!(i in states))states[i]=value;return[states[i],next=>states[i]=next];}};
  const module={exports:{}};const require=name=>name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value,locale:'ko'})}:name==='./ui/controls'?{Button:'Button',Switch:'Switch',TextInput:'TextInput',Dropdown:'Dropdown'}:native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);
  const changes=[],props={format:'postgresql',record:{sourcePath:'/fixture/first.conf',text:'port = 5432\n'},onChange:value=>changes.push(value)};
  const nodes=tree=>{const result=[];function visit(node){if(!node||typeof node!=='object')return;result.push(node);React.Children.forEach(node.props?.children,visit);}visit(tree);return result;};
  function render(){ri=si=0;return nodes(module.exports.default(props));}
  if(transition==='group'){props.format='mariadb';props.record={sourcePath:'/fixture/server.cnf',text:'[mariadbd]\nport=3306\n'};props.requestedGroup='mariadbd';}
  const original=render(),row=original.find(node=>node.type?.name==='Setting'),add=original.find(node=>node.type==='Button'&&node.props.children==='초안에 항목 추가');assert(row&&add);
  row.props.onChange({text:'port = 5433\n'});assert.equal(changes.length,1);
  if(transition==='file')props.record={sourcePath:'/fixture/second.conf',text:'port = 5432\n'};
  if(transition==='code')props.record={...props.record,text:'port = 5440\n'};
  if(transition==='format')props.format='redis';
  if(transition==='group')props.requestedGroup='client';
  if(transition==='unmount')effects[0]()();else render();
  row.props.onChange({text:'obsolete text'});row.props.onPending({raw:'port = 5432\n',value:"'unfinished",error:'fixture'});add.props.onClick();
  assert.equal(changes.length,1,transition);
 }
});
