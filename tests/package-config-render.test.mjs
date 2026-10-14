import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
test('PostgreSQL package GUI compiles and renders backup controls without calling the API',async()=>{
 const source=await readFile(new URL('../components/package-config.tsx',import.meta.url),'utf8');
 await loadBindings();
 const compiled=await transform(source,{filename:'package-config.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='./redis-operation'||name==='./redis-validation'||name==='./redis-resource-review'||name==='./nginx-context-panel'?{default:()=>null}:['./node-apps','./node-workspace-env','./node-env-import','./mariadb-recovery','./mariadb-backups','./mariadb-topology','./mariadb-apply','./redis-topology','./redis-recovery','./redis-backups'].includes(name)?{default:()=>null}:name==='./postgresql-restore'?{default:()=>null}:name==='./draft-provider'?{useDraftState:(key,initial)=>React.useState(key==='packageKind'?'postgresql':initial)}:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?Object.fromEntries(['Button','Switch','Dropdown','TextInput','Badge'].map(key=>[key,props=>React.createElement('div',null,props.label||props.children)])):native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const html=renderToStaticMarkup(React.createElement(module.exports.default,{connected:true,api:()=>{throw new Error('API called during render');}}));
 assert(html.includes('PostgreSQL 백업 조회'));assert(html.includes('운영 설정 조회'));
});

test('Certbot GUI exposes renewal target only for renewal and issue fields only for issuance',async()=>{
 const source=await readFile(new URL('../components/package-config.tsx',import.meta.url),'utf8');await loadBindings();
 const compiled=await transform(source,{filename:'package-config.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 for(const operation of ['issue','renew-check'])for(const authenticator of ['nginx','webroot','standalone']){
  const native=createRequire(import.meta.url),module={exports:{}};
  const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='./redis-operation'||name==='./redis-validation'||name==='./redis-resource-review'||name==='./nginx-context-panel'?{default:()=>null}:['./node-apps','./node-workspace-env','./node-env-import','./mariadb-recovery','./mariadb-backups','./mariadb-topology','./mariadb-apply','./redis-topology','./redis-recovery','./redis-backups','./postgresql-restore'].includes(name)?{default:()=>null}:name==='./draft-provider'?{useDraftState:(key,initial)=>React.useState(key==='packageKind'?'certbot':key==='packageDrafts'?{certbot:{operation,authenticator,webroot:'/srv/public',certName:'example.com'}}:initial)}:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?Object.fromEntries(['Button','Switch','Dropdown','TextInput','Badge'].map(key=>[key,props=>React.createElement('div',{'data-control':key},props.label||props.children)])):native(name);
  new Function('require','module','exports',compiled.code)(require,module,module.exports);
  const html=renderToStaticMarkup(React.createElement(module.exports.default,{connected:true,api:()=>{throw new Error('API called during render');}}));
  assert.equal(html.includes('갱신할 인증서 이름 (비우면 전체)'),operation==='renew-check');
  assert.equal(html.includes('웹 루트 경로'),operation==='issue'&&authenticator==='webroot');
  for(const label of ['인증서 도메인','연락 이메일','테스트 인증서 사용','인증 방식'])assert.equal(html.includes(label),operation==='issue');
 }
});

test('selected-file GUI uses controlled values and delegates edits reset and code review without generating a replacement fragment',async()=>{
 await loadBindings();
 const compiled=await transform(await readFile(new URL('../components/package-config.tsx',import.meta.url),'utf8'),{filename:'package-config.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(new URL('../components/package-config.tsx',import.meta.url)),module={exports:{}},states=[],refs=[];let stateIndex=0,refIndex=0,reviewed=0,reset=0,invalidated=0;
 const noop=()=>null,controls=Object.fromEntries(['Button','Switch','Dropdown','TextInput','Badge'].map(name=>[name,()=>null]));
 const hooks={...React,useState:initial=>{const at=stateIndex++;if(!(at in states))states[at]=typeof initial==='function'?initial():initial;return [states[at],value=>states[at]=typeof value==='function'?value(states[at]):value];},useRef:value=>refs[refIndex++]??(refs[refIndex-1]={current:value}),useEffect:noop,useMemo:fn=>fn()};
 const drafts={postgresql:{port:9999,connections:999}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./draft-provider'?{useDraftState:(key,initial)=>key==='packageKind'?['postgresql',noop]:key==='packageDrafts'?[drafts,()=>{throw Error('Selected-file edits wrote unrelated global draft');}]:key==='packageBaselines'?[{},noop]:[typeof initial==='function'?initial():initial,noop]}:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?controls:name.startsWith('./')?{default:noop}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const edits=[],nodes=[];
 const tree=module.exports.default({connected:true,api:()=>{throw Error('Code review generated a replacement fragment');},controlledDraft:{port:5433,connections:250},onFieldChange:(key,value)=>{edits.push({key,value});return 'fixture field error';},onInvalidate:()=>invalidated++,onResetDraft:()=>{reset++;return '';},onReviewCode:()=>reviewed++});
 function visit(node){if(!node||typeof node!=='object')return;nodes.push(node);React.Children.forEach(toastTestChildren(node),visit);}visit(tree);
 const port=nodes.find(node=>node.type===controls.TextInput&&node.props.label==='DB 포트');assert.equal(port.props.value,5433);port.props.onChange({target:{value:'5444'}});assert.deepEqual(edits,[{key:'port',value:'5444'}]);assert(states.includes('fixture field error'));
 await nodes.find(node=>node.type===controls.Button&&node.props.children==='코드 보기').props.onClick();assert.equal(reviewed,1);assert(!nodes.some(node=>node.type===controls.Button&&['작업 폴더에 초안 저장','설정 초안 다운로드'].includes(node.props.children)),'selected-file GUI cannot overwrite full code with a generated fragment');
 nodes.find(node=>node.type===controls.Button&&node.props.children==='이 패키지 기본값').props.onClick();
 stateIndex=0;refIndex=0;nodes.length=0;visit(module.exports.default({connected:true,api:noop,controlledDraft:{port:5433,connections:250},onFieldChange:noop,onInvalidate:()=>invalidated++,onResetDraft:()=>{reset++;return '';},onReviewCode:noop}));
 nodes.find(node=>node.type===controls.Button&&node.props.children==='기본값으로 복원').props.onClick();assert.equal(reset,1);assert.equal(invalidated,0,'a delegated reset must validate before changing code state');assert.equal(drafts.postgresql.port,9999);
});

test('requested package is rendered in initial HTML even when the previous package draft is PostgreSQL',async()=>{
 const source=await readFile(new URL('../components/package-config.tsx',import.meta.url),'utf8');
 await loadBindings();
 const compiled=await transform(source,{filename:'package-config.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='./redis-operation'||name==='./redis-validation'||name==='./redis-resource-review'||name==='./nginx-context-panel'?{__esModule:true,default:()=>null}:['./node-apps','./node-workspace-env','./node-env-import','./mariadb-recovery','./mariadb-backups','./mariadb-topology','./mariadb-apply','./redis-topology','./redis-recovery','./redis-backups'].includes(name)?{__esModule:true,default:()=>null}:name==='./postgresql-restore'?{__esModule:true,default:()=>null}:name==='./draft-provider'?{useDraftState:(key,initial)=>React.useState(key==='packageKind'?'postgresql':initial)}:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?Object.fromEntries(['Button','Switch','Dropdown','TextInput','Badge'].map(key=>[key,props=>React.createElement('div',null,props.label||props.children)])):native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 for(const [kind,label] of [['nodejs','Node.js'],['mariadb','MariaDB'],['redis','Redis']]){
  const html=renderToStaticMarkup(React.createElement(module.exports.default,{requestedProfile:{kind},connected:true,api:()=>{throw new Error('API called during render');}}));
  assert(html.includes(label+' 환경 설정'),kind+' must render before effects run');
  assert(!html.includes('PostgreSQL 환경 설정'),kind+' must not flash the previous package form');
 }
});


test('opening the requested package does not invalidate code; actual field edits still do',async()=>{
 await loadBindings();
 const compiled=await transform(await readFile(new URL('../components/package-config.tsx',import.meta.url),'utf8'),{filename:'package-config.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(new URL('../components/package-config.tsx',import.meta.url)),module={exports:{}},effects=[];let invalidated=0;
 const noop=()=>null,controls=Object.fromEntries(['Button','Switch','Dropdown','TextInput','Badge'].map(name=>[name,noop]));
 const hooks={...React,useState:initial=>[typeof initial==='function'?initial():initial,noop],useRef:value=>({current:value}),useEffect:fn=>effects.push(fn),useMemo:fn=>fn()};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./draft-provider'?{useDraftState:(key,initial)=>[typeof initial==='function'?initial():initial,noop]}:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?controls:name.startsWith('./')?{default:noop}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const tree=module.exports.default({requestedProfile:{kind:'nodejs'},connected:true,api:noop,onInvalidate:()=>invalidated++,onImportValues:()=> 'fixture import rejection'});
 for(const effect of effects)effect();assert.equal(invalidated,0,'initialization must not claim a GUI edit');
 let port;function visit(node){if(!node||typeof node!=='object')return;if(node.props?.label==='앱 포트')port=node;React.Children.forEach(toastTestChildren(node),visit);}visit(tree);
 port.props.onChange({target:{value:'4000'}});assert.equal(invalidated,1);
 const imports=[];function findImports(node){if(!node||typeof node!=='object')return;if(node.props?.onImport)imports.push(node);React.Children.forEach(toastTestChildren(node),findImports);}findImports(tree);assert.equal(imports.length,2);for(const node of imports)assert.equal(node.props.onImport({port:5000}),'fixture import rejection','both imports must pass rejection back to the review UI');assert.equal(invalidated,1);
});

test('selected-file IDE suppresses duplicate source import while standalone import remains available',async()=>{
 await loadBindings();
 const compiled=await transform(await readFile(new URL('../components/package-config.tsx',import.meta.url),'utf8'),{filename:'package-config.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(new URL('../components/package-config.tsx',import.meta.url));let locale='ko-KR';
 const {postgresqlSettingDescription}=await import('../lib/postgresql-setting-description.ts');
 for(const kind of ['postgresql','mariadb','redis']){
  const module={exports:{}},states=[],refs=[],effects=[];let stateIndex=0,refIndex=0,writes=0;
  const noop=()=>null,controls=Object.fromEntries(['Button','Switch','Dropdown','TextInput','Badge'].map(name=>[name,()=>null]));
  const hooks={...React,useState:initial=>{const at=stateIndex++;if(!(at in states))states[at]=typeof initial==='function'?initial():initial;return [states[at],value=>states[at]=typeof value==='function'?value(states[at]):value];},useRef:value=>refs[refIndex++]??(refs[refIndex-1]={current:value}),useEffect:fn=>effects.push(fn),useMemo:fn=>fn()};
  const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./draft-provider'?{useDraftState:(key,initial)=>[key==='packageKind'?kind:key==='packageBaselines'?{[kind]:{path:'/fixture/previous',values:{},version:'previous'}}:typeof initial==='function'?initial():initial,()=>{if(['packageDrafts','packageBaselines'].includes(key))writes++;}]}:name==='./language-provider'?{useLanguage:()=>({t:value=>value,locale})}:name==='./ui/controls'?controls:name.startsWith('./')?{default:noop}:native(name);
  new Function('require','module','exports',compiled.code)(require,module,module.exports);
  const requestedConfig={path:'/fixture/current',values:{port:5433},version:'current',warnings:[]},props={connected:true,api:()=>{throw Error('Unexpected source request');},requestedProfile:{kind},requestedConfig};
  function render(extra={}){stateIndex=0;refIndex=0;effects.length=0;return module.exports.default({...props,...extra});}
  function labels(tree){const found=[];function visit(node){if(!node||typeof node!=='object')return;if(node.props?.['aria-label'])found.push(node.props['aria-label']);if(node.type===controls.Button)found.push(node.props.children);if(node.type==='summary')found.push(React.Children.toArray(toastTestChildren(node)).join(''));React.Children.forEach(toastTestChildren(node),visit);}visit(tree);return found;}
  render();for(const effect of [...effects])effect();
  assert(labels(render()).includes('운영 설정 불러오기 확인'),kind+' standalone import confirmation must remain');
  const controlled={controlledDraft:requestedConfig.values,onFieldChange:noop};
  if(kind==='postgresql')assert(labels(render()).includes('PostgreSQL 백업 조회'),'standalone backup access remains');
  for(const label of ['운영 설정 조회','이 파일의 설정 불러오기','운영 설정 불러오기 확인',...(kind==='postgresql'?['PostgreSQL 백업 조회']:[])])assert(!labels(render(controlled)).includes(label),kind+' selected source must not prompt again');
  assert(!labels(render(controlled)).some(label=>String(label).startsWith('운영 설정과 비교')),kind+' previous standalone baseline must not leak into IDE');
  const html=JSON.stringify(render(controlled));assert(!html.includes('값은 패키지별로 유지됩니다.'),'selected file does not display unrelated generator storage advice');assert(!html.includes('조회 전용 모드입니다.'),'common header already displays read-only mode');
  if(kind==='postgresql')for(const language of ['ko','en','ja','zh','es','fr','de','ru','pt','ar','id','it','ka','pl','sv','tr','uk','ca','fi','nl','da','nb','ro','vi','hu','el','bg','cs','sk','hi']){
   locale=language;const localized=JSON.stringify(render(controlled));
   for(const name of ['port','max_connections','shared_buffers','work_mem','logging_collector']){
    const description=postgresqlSettingDescription(name,locale);assert(description.translated,language+' '+name);
    for(const paragraph of description.paragraphs)assert(localized.includes(JSON.stringify(paragraph).slice(1,-1)),language+' grouped setting description '+name);
   }
  }
  const before=writes;for(const effect of [...effects])effect();assert.equal(writes,before,'mode transition cannot modify shared drafts');
  render({requestedConfig:undefined});for(const effect of [...effects])effect();
  assert(!labels(render({requestedConfig:undefined})).includes('운영 설정 불러오기 확인'),'previous import request must be cleared after controlled mode');
 }
});


test('MariaDB selected-file settings initialize recovery at the selected main and file without making requests',async()=>{
 await loadBindings();
 const compiled=await transform(await readFile(new URL('../components/package-config.tsx',import.meta.url),'utf8'),{filename:'package-config.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(new URL('../components/package-config.tsx',import.meta.url)),module={exports:{}},seen=[];
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='./mariadb-recovery'?{__esModule:true,default:props=>{seen.push(props);return React.createElement('span',null,props.initialTarget);}}:name==='./draft-provider'?{useDraftState:(key,initial)=>React.useState(initial)}:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?Object.fromEntries(['Button','Switch','Dropdown','TextInput','Badge'].map(key=>[key,()=>null])):name.startsWith('./')?{__esModule:true,default:()=>null}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 for(const path of ['/etc/mysql/conf.d/vhost.cnf','/etc/mysql/mariadb.conf.d/50-server.cnf']){
  const html=renderToStaticMarkup(React.createElement(module.exports.default,{requestedProfile:{kind:'mariadb'},requestedConfig:{path},requestedMain:'/etc/mysql/mariadb.cnf',controlledDraft:{port:3306},onFieldChange:()=>{},connected:true,api:()=>{throw Error('Unexpected recovery during render');}}));
  assert(html.includes(path));assert.equal(seen.at(-1).initialTarget,path);assert.equal(seen.at(-1).initialRoot,'/etc/mysql/mariadb.cnf');
 }
});
