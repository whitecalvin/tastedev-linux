import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {retainPostgresqlHbaInputs} from '../lib/postgresql-hba.ts';
import {hasPendingIdeInputs,hasUnsavedIdeRecord} from '../lib/draft-state.ts';
test('HBA typed values are retained in their file record before explicit code apply',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/postgresql-hba-settings.tsx',import.meta.url),'utf8'),{filename:'postgresql-hba-settings.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const refs=[];let ri=0;const hooks={...React,useState:initial=>[initial,()=>{}],useRef:value=>refs[ri++]??(refs[ri-1]={current:value})};
 const native=createRequire(import.meta.url),module={exports:{}};const require=name=>name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value,locale:'ko'})}:name==='./ui/controls'?{Button:'button',TextInput:'input',Dropdown:'select'}:name==='./ui/confirm-dialog'?{__esModule:true,default:'dialog'}:native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const source='local all all peer\nlocal app app scram-sha-256\n';let record={sourcePath:'/fixture/pg_hba.conf',text:source,baseline:source},changes=0;
 const props=()=>({record,onChange:change=>{changes++;const inputs=typeof change.text==='string'?retainPostgresqlHbaInputs(record.text,change.text,change.pendingSettingInputs??record.pendingSettingInputs):change.pendingSettingInputs;record={...record,...change,...(inputs?{pendingSettingInputs:inputs}:{})};}});
 function nodes(tree){const result=[];function visit(node){if(!node||typeof node!=='object')return;result.push(node);React.Children.forEach(node.props?.children,visit);}visit(tree);return result;}
 function rows(){ri=0;return nodes(module.exports.default(props())).filter(node=>node.type?.name==='Rule');}
 let first=rows()[0];const fields=nodes(first.type(first.props)).find(node=>node.type?.name==='RuleFields');fields.props.onChange({...first.props.entry,user:'한글사용자'});
 assert.equal(record.text,source);assert(hasPendingIdeInputs(record));assert(hasUnsavedIdeRecord(record));assert.equal(record.pendingSettingInputs['1:hba'].value.user,'한글사용자');
 first=rows()[0];assert.equal(first.props.pending.value.user,'한글사용자');rows()[1].props.onPending({...rows()[1].props.entry,database:'other'});
 first=rows()[0];const apply=nodes(first.type(first.props)).find(node=>node.type==='button'&&node.props.children==='초안에 반영');apply.props.onClick();assert(record.text.startsWith('local all 한글사용자 peer\n'));assert(!record.pendingSettingInputs['1:hba']);assert(record.pendingSettingInputs['2:hba']);
 ri=0;let tree=nodes(module.exports.default(props()));const newFields=tree.find(node=>node.type?.name==='RuleFields');newFields.props.onChange({...newFields.props.value,user:'새한글사용자'});assert.equal(record.pendingSettingInputs['$hba:new'].value.user,'새한글사용자');const beforeNew=record.text;
 ri=0;tree=nodes(module.exports.default(props()));assert.equal(tree.find(node=>node.type?.name==='RuleFields').props.value.user,'새한글사용자');tree.find(node=>node.type==='button'&&node.props.children==='초안에 항목 추가').props.onClick();assert(record.text.startsWith(beforeNew));assert(record.text.endsWith('host all 새한글사용자 127.0.0.1/32 scram-sha-256\n'));assert(!record.pendingSettingInputs['$hba:new']);assert(record.pendingSettingInputs['2:hba']);
 ri=0;tree=nodes(module.exports.default(props()));assert.equal(tree.find(node=>node.type?.name==='RuleFields').props.value.user,'all');
 const resetFields=tree.find(node=>node.type?.name==='RuleFields');resetFields.props.onChange({...resetFields.props.value,user:'임시'});assert(record.pendingSettingInputs['$hba:new']);ri=0;tree=nodes(module.exports.default(props()));const resetCurrent=tree.find(node=>node.type?.name==='RuleFields');resetCurrent.props.onChange({...resetCurrent.props.value,user:'all'});assert(!record.pendingSettingInputs['$hba:new']);assert(record.pendingSettingInputs['2:hba']);
 const pendingBeforeMove=record.pendingSettingInputs['2:hba'];const moveRow=rows()[1];const moveButton=nodes(moveRow.type(moveRow.props)).find(node=>node.type==='button'&&node.props['aria-label']==='위로 이동');moveButton.props.onClick();assert.deepEqual(record.pendingSettingInputs['1:hba'],pendingBeforeMove,'moving a rule must reattach its unapplied fields to the new line');assert(!record.pendingSettingInputs['2:hba']);assert(record.text.startsWith('local app app scram-sha-256\n'));
 const stale=rows()[0];record={sourcePath:'/fixture/other_hba.conf',text:source,baseline:source};rows();const count=changes;stale.props.onPending({...stale.props.entry,user:'obsolete'});stale.props.onChange('obsolete text');assert.equal(changes,count);
});
test('code insertions remap unique pending HBA rules and never attach changed or ambiguous rules',()=>{
 const source='local all all peer\n',pending={'1:hba':{raw:source,value:{user:'한글'}}};
 assert.deepEqual(retainPostgresqlHbaInputs(source,'# inserted\n'+source,pending),{'2:hba':pending['1:hba']});
 assert.deepEqual(retainPostgresqlHbaInputs(source,'local all all reject\n',pending),{});
 assert.deepEqual(retainPostgresqlHbaInputs(source,source+source,pending),{});
 assert.deepEqual(retainPostgresqlHbaInputs(source,'',pending),{});
 const other='local app app scram-sha-256\n',moving={'2:hba':{raw:other,value:{database:'한글'}}};assert.deepEqual(retainPostgresqlHbaInputs(source+other,other+source,moving),{'1:hba':moving['2:hba']});
 const newInput={'$hba:new':{raw:'',value:{user:'새한글사용자'}}};assert.deepEqual(retainPostgresqlHbaInputs(source,'# changed\n'+source,newInput),newInput);
});
