import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';import assert from 'node:assert/strict';
import {retainSettingInputs} from '../lib/file-settings-draft.ts';
import React from 'react';import {createRequire} from 'node:module';import {readFile} from 'node:fs/promises';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
test('pending rows survive unrelated code edits and are removed when their original row changes',()=>{
 for(const [kind,original,changed] of [['postgresql','port = 5432\nmax_connections = 100\n','port = 5433\nmax_connections = 100\n'],['redis','port 6379\nmaxclients 100\n','port 6380\nmaxclients 100\n'],['mariadb','[mariadbd]\nport=3306\nmax_connections=100\n','[mariadbd]\nport=3307\nmax_connections=100\n']]){
  const line=kind==='mariadb'?2:1,key=line+':port',raw=original.split('\n')[line-1]+'\n';const pending={[key]:{raw,value:"'unfinished",enabled:true,error:'invalid'}};
  assert.deepEqual(retainSettingInputs(kind,original,pending),pending);
  assert.deepEqual(retainSettingInputs(kind,original.replace('100','200'),pending),pending);
  assert.deepEqual(retainSettingInputs(kind,changed,pending),{});
  assert.deepEqual(retainSettingInputs(kind,'# shifted\n'+original,pending,original),{[(line+1)+':port']:pending[key]});
  const reordered=kind==='mariadb'?'[mariadbd]\nmax_connections=100\nport=3306\n':original.split('\n').slice(0,2).reverse().join('\n')+'\n';
  assert.deepEqual(retainSettingInputs(kind,reordered,pending,original),{[(kind==='mariadb'?3:2)+':port']:pending[key]});
 }
});
test('file settings preserve incomplete input across remounts, isolate files, and resolve one pending row independently',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/file-settings.tsx',import.meta.url),'utf8'),{filename:'file-settings.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),module={exports:{}},controls=Object.fromEntries(['Button','Switch','TextInput','Dropdown'].map(name=>[name,()=>null]));let states=[],index=0;
 const hooks={...React,useRef:value=>({current:value}),useId:()=>"fixture-setting-names",useState:initial=>{const at=index++;if(!(at in states))states[at]=initial;const active=states;return[active[at],value=>active[at]=typeof value==='function'?value(active[at]):value];},useMemo:fn=>fn(),useEffect:()=>{}};
 const require=name=>name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value,locale:'ko'})}:name==='./ui/controls'?controls:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 let record={sourcePath:'/fixture/main/postgresql.conf',text:'port = 5432\nmax_connections = 100\n'};const original=record.text,onChange=change=>record={...record,...change};
 const nodes=tree=>!tree||typeof tree!=='object'?[]:[tree,...React.Children.toArray(tree.props?.children).flatMap(nodes)];
 function row(name){states=[];index=0;return nodes(module.exports.default({record,onChange})).find(node=>node.props?.row?.name===name);}
 function control(element){states=[];index=0;return nodes(element.type(element.props)).find(node=>node.type===controls.TextInput);}
 const firstKey=row('port').key;
 control(row('port')).props.onChange({target:{value:"'unfinished"}});
 control(row('max_connections')).props.onChange({target:{value:"'also unfinished"}});
 assert.equal(record.text,original,'invalid input cannot rewrite source');
 assert.equal(control(row('port')).props.value,"'unfinished",'fresh row instance recovers input from its file record');
 assert.equal(control(row('max_connections')).props.value,"'also unfinished");
 const saved=record;const shifted='# inserted\n'+record.text;record={...record,text:shifted,pendingSettingInputs:retainSettingInputs('postgresql',shifted,record.pendingSettingInputs,record.text)};
 assert.equal(control(row('port')).props.value,"'unfinished",'remounted moved row retains pending input');
 assert.equal(control(row('max_connections')).props.value,"'also unfinished");
 record={sourcePath:'/fixture/other/postgresql.conf',text:original};assert.notEqual(row('port').key,firstKey,'equal line/value on another file must remount the input');assert.equal(control(row('port')).props.value,'5432');
 record=saved;control(row('port')).props.onChange({target:{value:'5433'}});
 assert(record.text.startsWith('port = 5433\n'));assert(!record.pendingSettingInputs['1:port']);assert.equal(record.pendingSettingInputs['2:max_connections'].value,"'also unfinished");
 control(row('max_connections')).props.onChange({target:{value:'200'}});assert.deepEqual(record.pendingSettingInputs,{});assert(record.text.includes('max_connections = 200'));
});

test('pending input never moves to another MariaDB group or an ambiguous duplicate',()=>{
 const original='[mariadbd]\nport=3306\n',pending={'2:port':{raw:'port=3306\n',value:"'unfinished"}};
 assert.deepEqual(retainSettingInputs('mariadb','[client]\nport=3306\n',pending,original),{});
 const duplicates='port 6379\nport 6379\n',duplicate={'1:port':{raw:'port 6379\n',value:"'unfinished"}};
 assert.deepEqual(retainSettingInputs('redis','# inserted\n'+duplicates,duplicate,duplicates),{});
 assert.deepEqual(retainSettingInputs('redis','port 6379\n'+duplicates,duplicate,duplicates),{});
 assert.deepEqual(retainSettingInputs('redis','port 6380\n',duplicate,'port 6379\n'),{});
});
