import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
test('log source changes reject stale responses and clear previous filtered output',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/operations-panel.tsx',import.meta.url),'utf8'),{filename:'operations-panel.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[];let si=0,ri=0;const hooks={useState:initial=>{const index=si++;if(!(index in states))states[index]=initial;return [states[index],value=>{states[index]=typeof value==='function'?value(states[index]):value;}];},useRef:initial=>{const index=ri++;return refs[index]??(refs[index]={current:initial});},useCallback:fn=>fn,useEffect:()=>{}};
 const native=createRequire(import.meta.url),module={exports:{}};const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:text=>text,locale:'ko'})}:name==='./ui/controls'?Object.fromEntries(['Button','Dropdown','TextInput','Checkbox','Switch','Badge'].map(key=>[key,key])):name==='./postgresql-code-recovery'?{__esModule:true,default:'PostgreSQLCodeRecovery'}:name==='./nginx-backups-panel'?{__esModule:true,default:'NginxBackupsPanel'}:name==='./ai-log-assistant'?{default:'div'}:name==='./node-apps'?{__esModule:true,default:'NodeApps'}:native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);
 let resolveLogs;const props={connected:true,initialTab:'logs',api:()=>new Promise(resolve=>{resolveLogs=resolve;})};
 const render=()=>{si=ri=0;return module.exports.default(props);};const find=(tree,predicate)=>{if(!tree)return null;if(Array.isArray(tree))return tree.map(child=>find(child,predicate)).find(Boolean);if(predicate(tree))return tree;return find(toastTestChildren(tree),predicate);};let tree=render();
 const first=find(tree,node=>node.props?.['aria-label']==='로그 조회').props.onClick();tree=render();
 for(const source of ['cron.service','nginx.service']){find(tree,node=>node.props?.label==='로그 소스').props.onChange({target:{value:source}});tree=render();}
 resolveLogs({text:'stale source'});await first;tree=render();assert(!find(tree,node=>node.props?.children==='stale source'));
 const next=find(tree,node=>node.props?.['aria-label']==='로그 조회').props.onClick();resolveLogs({text:'current source'});await next;tree=render();assert(find(tree,node=>node.props?.children==='current source'));
 const openAi=find(tree,node=>node.props?.['aria-label']==='AI 오류 해결 도우미');assert.equal(openAi.props.disabled,false);openAi.props.onClick();tree=render();assert(find(tree,node=>node.type==='dialog'));assert(find(tree,node=>node.props?.text==='current source'&&node.props.source==='nginx.service'));
 find(tree,node=>node.props?.label==='로그 내용 검색').props.onChange({target:{value:'error'}});tree=render();assert(!find(tree,node=>node.props?.children==='current source'));assert(find(tree,node=>node.props?.text==='current source'),'analysis uses the captured log while live content changes');
 const dialog=find(tree,node=>node.type==='dialog');let prevented=false;dialog.props.onCancel({preventDefault:()=>{prevented=true;}});tree=render();assert(prevented);assert(!find(tree,node=>node.type==='dialog'));

});
