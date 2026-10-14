import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';
import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import * as settings from '../lib/postgresql-settings-text.ts';
import {postgresqlSettingDescription as describe} from '../lib/postgresql-setting-description.ts';
test('PostgreSQL file settings GUI edits unknown parameters, retains focus identity and clears values without removing rows',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/file-settings.tsx',import.meta.url),'utf8'),{filename:'file-settings.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const Button=()=>null,Switch=()=>null,TextInput=()=>null,Dropdown=()=>null,module={exports:{}},native=createRequire(import.meta.url),rootStates=[],rowStates=[];let states=rootStates,index=0;
 const hooks={...React,useRef:value=>({current:value}),useId:()=>"fixture-setting-names",useState:value=>{const at=index++;if(!(at in states))states[at]=value;const store=states;return[store[at],next=>store[at]=typeof next==='function'?next(store[at]):next];},useMemo:fn=>fn(),useEffect:()=>{}};
 let locale='ko';
 const require=name=>name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({locale,t:value=>value})}:name==='./ui/controls'?{Button,Switch,TextInput,Dropdown}:name==='../lib/postgresql-settings-text.ts'?settings:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 let record={text:"#custom.feature = 'first' # retained\nlogging_collector = on\n#wal_level = REPLICA # retained\nport = 5432\n"},commits=0;
 const onChange=value=>{record={...record,...value};if(Object.hasOwn(value,'text'))commits++;};
 const nodes=tree=>!tree||typeof tree!=='object'?[]:[tree,...React.Children.toArray(tree.props?.children).flatMap(nodes)];
 function render(){states=rootStates;index=0;return module.exports.default({record,onChange});}
 function row(tree){return nodes(tree).find(node=>node.props?.row?.name==='custom.feature');}
 function renderRow(element){states=rowStates;index=0;return element.type(element.props);}
 let tree=render(),element=row(tree),key=element.key,view=renderRow(element);
 const completion=nodes(tree).find(node=>node.type==='datalist');
 const nameInput=nodes(render()).find(node=>node.type===TextInput&&node.props.label==='설정 이름');
 assert.equal(nameInput.props.list,completion.props.id);
 const candidates=React.Children.toArray(completion.props.children);
 assert.equal(candidates.length,348);
 assert.equal(new Set(candidates.map(node=>node.props.value)).size,348);
 assert.equal(candidates.find(node=>node.props.value==='shared_buffers').props.label,describe('shared_buffers','ko').paragraphs[0]);
 assert.equal(candidates.find(node=>node.props.value==='port').props.label,describe('port','ko').paragraphs[0]);

 const port=()=>nodes(render()).find(node=>node.props?.row?.name==='port');
 assert(nodes(renderRow(port())).some(node=>node.props?.lang==='ko'));
 locale='ja';assert(nodes(renderRow(port())).some(node=>node.props?.lang==='ja'));
 for(locale of ['ko','en','ja','zh','es','fr','de','ru','pt','ar','id','it','ka','pl','sv','tr','uk','ca','fi','nl','da','nb','ro','vi','hu','el','bg','cs','sk','hi']){
  const help=describe('port',locale).paragraphs.join(' ');
  assert.equal(nodes(renderRow(port())).find(node=>node.type===TextInput).props['aria-description'],help);
  nodes(render()).find(node=>node.type===TextInput&&node.props.label==='설정 이름').props.onChange({target:{value:'port'}});
  const draft=render();assert(nodes(draft).some(node=>node.props?.lang===locale),'New setting help follows '+locale);
  assert.equal(nodes(draft).find(node=>node.type===TextInput&&node.props.label==='설정 이름').props['aria-description'],help);
 }
 assert.equal(commits,0,'Changing language and inspecting help must not alter the file');
 locale='ja';
 nodes(render()).find(node=>node.type===TextInput&&node.props.label==='설정 이름').props.onChange({target:{value:'custom.feature'}});
 assert.equal(nodes(render()).find(node=>node.type===TextInput&&node.props.label==='설정 이름').props['aria-description'],describe('custom.feature','ja').unavailable);
 nodes(render()).find(node=>node.type===TextInput&&node.props.label==='설정 이름').props.onChange({target:{value:''}});

 nodes(render()).find(node=>node.type===TextInput&&node.props.type==='search').props.onChange({target:{value:'TCPポート'}});
 assert(port(),'Japanese explanations are searchable');
 nodes(render()).find(node=>node.type===TextInput&&node.props.type==='search').props.onChange({target:{value:''}});
 for(const [language,query] of [['ka','ჟურნალის ფაილებში შესაგროვებლად'],['id','mengumpulkan stderr'],['it','raccoglie stderr'],['pl','zbierający stderr'],['tr','GÜNLÜK DOSYALARINA TOPLAMAK'],['ca','CAPTURAR STDERR'],['fi','KERÄÄ STDERR'],['nl','UITVOER IN LOGBESTANDEN'],['da','OPSAMLER STDERR'],['nb','SAMLER STDERR'],['ro','COLECTEAZĂ IEȘIREA STDERR'],['vi','THU THẬP ĐẦU RA STDERR'],['hu','NAPLÓFÁJLOKBA GYŰJTI'],['el','ΣΥΛΛΈΓΕΙ ΤΗΝ ΈΞΟΔΟ STDERR'],['bg','СЪБИРА ИЗХОДА STDERR'],['cs','SHROMAŽĎUJE VÝSTUP STDERR'],['sk','ZHROMAŽĎOVANIE VÝSTUPU STDERR'],['hi','लॉग फ़ाइलों में एकत्र']]){
  locale=language;
  nodes(render()).find(node=>node.type===TextInput&&node.props.type==='search').props.onChange({target:{value:query}});
  const collector=nodes(render()).find(node=>node.props?.row?.name==='logging_collector');
  assert(collector,'New explanations are searchable in '+language);
  assert(nodes(renderRow(collector)).some(node=>node.props?.lang===language));
  nodes(render()).find(node=>node.type===TextInput&&node.props.type==='search').props.onChange({target:{value:''}});
 }
 assert.equal(commits,0,'Searching translated explanations must not edit configuration');
 locale='ko';
 record={...record,text:record.text.replace('logging_collector = on','logging_collector = TRUE')};
 const booleanRow=nodes(render()).find(node=>node.props?.row?.name==='logging_collector');
 rowStates.length=0;
 const select=nodes(renderRow(booleanRow)).find(node=>node.type===Dropdown);
 assert(select,'Boolean settings use a select rather than unrestricted text');
 assert(select.props.options.some(option=>option.value==='TRUE'),'Existing spelling remains selectable without automatic changes');
 const saved=record.text;select.props.onChange({target:{value:'off'}});
 assert.equal(record.text,saved.replace('logging_collector = TRUE','logging_collector = off'));

 rowStates.length=0;
 const enumRow=nodes(render()).find(node=>node.props?.row?.name==='wal_level');
 const enumSelect=nodes(renderRow(enumRow)).find(node=>node.type===Dropdown);
 assert.deepEqual(enumSelect.props.options.map(option=>option.value),['','REPLICA','minimal','replica','logical']);
 const enumSource=record.text;enumSelect.props.onChange({target:{value:'logical'}});
 assert.equal(record.text,enumSource.replace('#wal_level = REPLICA # retained','#wal_level = logical # retained'));

 rowStates.length=0;
 const collectorAfter=nodes(render()).find(node=>node.props?.row?.name==='logging_collector');
 const clearSelect=nodes(renderRow(collectorAfter)).find(node=>node.type===Dropdown);
 const beforeClear=record.text;clearSelect.props.onChange({target:{value:''}});
 assert.equal(record.text,beforeClear.replace('logging_collector = off','# logging_collector = '));
 const cleared=nodes(render()).find(node=>node.props?.row?.name==='logging_collector');
 assert(cleared,'Clearing select retains the row');assert.equal(cleared.props.row.enabled,false);
 for(const [name,choices] of [['ssl',['','on','off']],['ssl_max_protocol_version',['',"''",'TLSv1','TLSv1.1','TLSv1.2','TLSv1.3']],['wal_level',['','minimal','replica','logical']]]){
  nodes(render()).find(node=>node.type===TextInput&&node.props.label==='설정 이름').props.onChange({target:{value:name}});
  const addSelect=nodes(render()).find(node=>node.type===Dropdown&&node.props.label==='설정값');
  assert(addSelect,'Adding known setting uses its allowed choices');
  assert.deepEqual(addSelect.props.options.map(option=>option.value),choices);
 }
 const additionBefore=record.text;
 nodes(render()).find(node=>node.type===Dropdown&&node.props.label==='설정값').props.onChange({target:{value:'logical'}});
 nodes(render()).find(node=>node.type===Button&&node.props.children==='초안에 항목 추가').props.onClick();
 assert(record.text.startsWith(additionBefore),'Adding leaves all prior settings in place');
 assert(record.text.includes('wal_level = logical'),'Added enum choice is committed to the draft');
 nodes(render()).find(node=>node.type===TextInput&&node.props.label==='설정 이름').props.onChange({target:{value:'custom.feature'}});
 assert(nodes(render()).some(node=>node.type===TextInput&&node.props.label==='설정값'),'Unknown extension settings retain unrestricted text');
 nodes(render()).find(node=>node.type===TextInput&&node.props.label==='설정 이름').props.onChange({target:{value:''}});
 rowStates.length=0;commits=0;
 locale='ja';
 view=renderRow(row(render()));
 const input=nodes(view).find(node=>node.type===TextInput);
 input.props.onChange({target:{value:"'second # text'"}});assert.equal(commits,1);assert(record.text.includes("#custom.feature = 'second # text' # retained"));
 tree=render();assert.equal(row(tree).key,key,'value edits keep the same row component and input focus identity');
 view=renderRow(row(tree));nodes(view).find(node=>node.type===Switch).props.onChange({target:{checked:true}});assert(record.text.startsWith("custom.feature = 'second # text'"));
 tree=render();view=renderRow(row(tree));const before=record.text;nodes(view).find(node=>node.type===TextInput).props.onChange({target:{value:'bad\nport = 9999'}});assert.equal(record.text,before,'invalid GUI input cannot inject another setting');assert.equal(rowStates[1],'설정값을 확인하세요.');
 view=renderRow(row(tree));nodes(view).find(node=>node.type===Button).props.onClick();tree=render();assert(row(tree));assert.equal(row(tree).props.row.value,'');assert.equal(row(tree).props.row.enabled,false);assert(record.text.includes('port = 5432\n'));
 nodes(render()).find(node=>node.type===TextInput&&node.props.type==='search').props.onChange({target:{value:'missing'}});assert(!row(render()));
 record={text:'port = 5432\rbad'};tree=render();assert(nodes(tree).some(node=>node.props?.role==='alert'),'unreadable GUI syntax reports an error instead of crashing the IDE');
});
