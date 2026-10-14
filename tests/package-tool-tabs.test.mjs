import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';

test('Node package tabs retain edited code, reopen hidden drafts and review replacement before switching code',async()=>{
 await loadBindings();
 const source=await readFile(new URL('../components/package-tool.tsx',import.meta.url),'utf8');
 const compiled=await transform(source,{filename:'package-tool.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],drafts=new Map();let si=0,ri=0,view='settings',section='settings',recordKey='nodejs',requestedCode=null;
 const Button=()=>null,noop=()=>null;
 const hooks={...React,useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return[states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},useId:()=> 'node-tabs',useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial})};
 const mocks={react:hooks,'./package-config':{__esModule:true,default:'PackageConfig'},'./config-code-editor':{__esModule:true,default:'ConfigCodeEditor'},'./language-provider':{useLanguage:()=>({t:value=>value})},'./ui/controls':{Button},'./draft-provider':{useDraftState:(key,initial)=>{if(!drafts.has(key))drafts.set(key,initial);return[drafts.get(key),value=>drafts.set(key,typeof value==='function'?value(drafts.get(key)):value)];}}};
 const native=createRequire(import.meta.url),module={exports:{}};
 new Function('require','module','exports',compiled.code)(name=>name==='./console-types'?consoleTypes:mocks[name]||native(name),module,module.exports);
 const render=()=>{si=ri=0;return module.exports.default({connected:true,api:noop,requestedProfile:{kind:'nodejs'},security:null,recordKey,requestedCode,nodeSection:section,tabbed:true,view,onViewChange:next=>view=next});};
 const nodes=tree=>{const list=[];function visit(node){if(!node||typeof node!=='object')return;list.push(node);React.Children.forEach(node.props?.children,visit);}visit(tree);return list;};
 let output=nodes(render());assert.equal(output.find(n=>n.props.role==='tab'&&n.props.children==='설정').props.tabIndex,0);assert(!output.some(n=>n.type==='ConfigCodeEditor'));
 output.find(n=>n.type==='PackageConfig').props.onOpen({name:'node.env',text:'PORT=3000\n'});assert.equal(view,'code');
 output=nodes(render());const editor=output.find(n=>n.type==='ConfigCodeEditor');assert.equal(editor.props.record.text,'PORT=3000\n');editor.props.onChange({text:'PORT=4000\n'});
 output=nodes(render());let form=output.find(n=>n.type==='PackageConfig');assert.equal(form.props.controlledDraft.port,4000);assert.deepEqual(form.props.fieldOrder,['port']);assert.equal(output.find(n=>n.type==='ConfigCodeEditor').props.guiSynchronized,true);
 form.props.onFieldChange('port','4010');output=nodes(render());assert.equal(output.find(n=>n.type==='ConfigCodeEditor').props.record.text,'PORT=4010\n');assert.equal(output.find(n=>n.type==='ConfigCodeEditor').props.record.stale,false);
 output.find(n=>n.type==='ConfigCodeEditor').props.onChange({text:'# keep\nTOKEN=fixture-private\nLOG_LEVEL=debug\nPORT=4000 # app\n'});
 output=nodes(render());form=output.find(n=>n.type==='PackageConfig');assert.deepEqual(form.props.fieldOrder,['logLevel','port']);assert.equal(form.props.controlledDraft.logLevel,'debug');assert.equal(form.props.onFieldChange('port',''), '포트: 1~65535 범위의 정수를 입력하세요.');
 output=nodes(render());form=output.find(n=>n.type==='PackageConfig');assert.equal(form.props.controlledDraft.port,'');assert.equal(form.props.onFieldChange('port','4001'),'');assert.equal(drafts.get('packageCodeRecords').nodejs.text,'# keep\nTOKEN=fixture-private\nLOG_LEVEL=debug\nPORT=4001 # app\n');
 output=nodes(render());output.find(n=>n.type==='ConfigCodeEditor').props.onChange({text:'PORT=1\nPORT=2\n'});assert.equal(drafts.get('packageDrafts').nodejs.port,4001,'duplicate variables cannot corrupt the last valid GUI state');
 output=nodes(render());assert.match(output.find(n=>n.type==='PackageConfig').props.onFieldChange('port','5000'),/중복/);assert.equal(drafts.get('packageCodeRecords').nodejs.text,'PORT=1\nPORT=2\n');
 output=nodes(render());form=output.find(n=>n.type==='PackageConfig');const beforeRejectedGui={...form.props.controlledDraft};assert.match(form.props.onImportValues({port:6000}),/중복/);output=nodes(render());assert.deepEqual(output.find(n=>n.type==='PackageConfig').props.controlledDraft,beforeRejectedGui,'a rejected import must not partially change GUI values');assert.match(output.find(n=>n.type==='PackageConfig').props.onResetDraft(),/중복/);output=nodes(render());assert.deepEqual(output.find(n=>n.type==='PackageConfig').props.controlledDraft,beforeRejectedGui,'a rejected default reset must not partially change GUI values');assert.equal(output.find(n=>n.type==='ConfigCodeEditor').props.record.stale,false);

 output=nodes(render());output.find(n=>n.type==='ConfigCodeEditor').props.onChange({text:'LOG_LEVEL=info\n'});assert.equal(drafts.get('packageDrafts').nodejs.port,4001,'deleting a code variable retains its last valid GUI value');
 output=nodes(render());form=output.find(n=>n.type==='PackageConfig');assert.equal(form.props.onImportValues({port:4000,host:'::1'}),'');assert.equal(drafts.get('packageCodeRecords').nodejs.text,'LOG_LEVEL=info\nPORT=4000\nHOST=::1\n');
 output=nodes(render());output.find(n=>n.type==='ConfigCodeEditor').props.onChange({text:'PORT=4000\n'});
 output=nodes(render());assert.equal(output.find(n=>n.props.role==='tabpanel'&&n.props.id.endsWith('settings-panel')).props.hidden,true);
 output.find(n=>n.type==='ConfigCodeEditor').props.onHide();assert.equal(view,'settings');assert.equal(drafts.get('packageCodeRecords').nodejs.text,'PORT=4000\n');
 output=nodes(render());let focused='',prevented=false;output.find(n=>n.props.role==='tab'&&n.props.children==='설정').props.onKeyDown({key:'ArrowRight',preventDefault:()=>prevented=true,currentTarget:{parentElement:{querySelector:selector=>({focus:()=>focused=selector})}}});assert(prevented);assert.equal(view,'code');assert(focused.includes('node-tabs-code-tab'));
 output=nodes(render());assert.equal(output.find(n=>n.type==='ConfigCodeEditor').props.record.text,'PORT=4000\n');assert.equal(output.find(n=>n.props.role==='tab'&&n.props.children==='코드 보기').props['aria-controls'],'node-tabs-code-panel');
 section='environment';view='settings';output=nodes(render());assert.equal(output.find(n=>n.type==='PackageConfig').props.nodeSection,'environment');assert.equal(output.find(n=>n.type==='ConfigCodeEditor').props.record.text,'PORT=4000\n');
 output.find(n=>n.type==='PackageConfig').props.onOpen({name:'replacement.env',text:'PORT=5000\n'});assert.equal(view,'settings','unsaved replacement must be reviewed before opening new code');
 output=nodes(render());assert(output.some(n=>n.props.role==='alertdialog'));assert.equal(drafts.get('packageCodeRecords').nodejs.text,'PORT=4000\n');output.find(n=>n.type===Button&&n.props.children==='편집한 코드 유지').props.onClick();assert(!nodes(render()).some(n=>n.props.role==='alertdialog'));
 output=nodes(render());output.find(n=>n.type==='PackageConfig').props.onOpen({name:'replacement.env',text:'PORT=5000\n'});output=nodes(render());output.find(n=>n.type===Button&&n.props.children==='새 초안으로 교체').props.onClick();assert.equal(view,'code');assert.equal(nodes(render()).find(n=>n.type==='ConfigCodeEditor').props.record.text,'PORT=5000\n');
 recordKey='nodejs:one.env';requestedCode={name:'one.env',text:'PORT=8000\nTOKEN=fixture-private\n',version:'disk-one'};output=nodes(render());assert.equal(output.find(n=>n.type==='ConfigCodeEditor').props.record.version,'disk-one');assert.equal(output.find(n=>n.type==='PackageConfig').props.controlledDraft.port,8000);output.find(n=>n.type==='PackageConfig').props.onFieldChange('port','8001');assert.equal(drafts.get('packageCodeRecords')[recordKey].text,'PORT=8001\nTOKEN=fixture-private\n');
 recordKey='nodejs:two.env';requestedCode={name:'two.env',text:'LOG_LEVEL=debug\n',version:'disk-two'};output=nodes(render());assert.equal(output.find(n=>n.type==='PackageConfig').props.controlledDraft.port,3000,'missing values must not inherit another file GUI');output.find(n=>n.type==='PackageConfig').props.onFieldChange('port','9001');
 recordKey='nodejs:one.env';requestedCode={name:'one.env',text:'PORT=9999\n',version:'external'};output=nodes(render());assert.equal(output.find(n=>n.type==='ConfigCodeEditor').props.record.text,'PORT=8001\nTOKEN=fixture-private\n','returning to a file preserves its own unsaved buffer');assert.equal(output.find(n=>n.type==='ConfigCodeEditor').props.record.version,'disk-one','external reads cannot replace the stored disk baseline');assert.equal(drafts.get('packageCodeRecords')['nodejs:two.env'].text,'LOG_LEVEL=debug\nPORT=9001\n');assert.equal(drafts.get('packageCodeRecords').nodejs.text,'PORT=5000\n');

 output=nodes(render());output.find(n=>n.type==='PackageConfig').props.onOpen({name:'newer.env',text:'PORT=6000\n'});output=nodes(render());const staleReplace=output.find(n=>n.type===Button&&n.props.children==='새 초안으로 교체').props.onClick;
 output.find(n=>n.type===Button&&n.props.children==='편집한 코드 유지').props.onClick();staleReplace();assert.equal(drafts.get('packageCodeRecords')['nodejs:one.env'].name,'one.env','cancelled replacement cannot be reused');
 output=nodes(render());output.find(n=>n.type==='PackageConfig').props.onOpen({name:'replacement.env',text:'PORT=7000\n'});output=nodes(render());const otherFileReplace=output.find(n=>n.type===Button&&n.props.children==='새 초안으로 교체').props.onClick;
 recordKey='nodejs:two.env';requestedCode={name:'two.env',text:'PORT=9999\n',version:'external'};output=nodes(render());assert(!output.some(n=>n.props.role==='alertdialog'),'replacement review must not appear on another file');otherFileReplace();assert.equal(drafts.get('packageCodeRecords')['nodejs:one.env'].name,'one.env');assert.equal(drafts.get('packageCodeRecords')['nodejs:two.env'].name,'two.env');

});
