import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
test('daemon refresh preserves newer state and ignores responses from disconnected sessions',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/operations-panel.tsx',import.meta.url),'utf8'),{filename:'operations-panel.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[];let si=0,ri=0;const hooks={useState:initial=>{const index=si++;if(!(index in states))states[index]=initial;return [states[index],value=>{states[index]=typeof value==='function'?value(states[index]):value;}];},useRef:initial=>{const index=ri++;return refs[index]??(refs[index]={current:initial});},useCallback:fn=>fn,useEffect:()=>{}};
 const native=createRequire(import.meta.url),module={exports:{}};const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:text=>text,locale:'ko'})}:name==='./ui/controls'?Object.fromEntries(['Button','Dropdown','TextInput','Checkbox','Switch','Badge'].map(key=>[key,key])):name==='./postgresql-code-recovery'?{__esModule:true,default:'PostgreSQLCodeRecovery'}:name==='./nginx-backups-panel'?{__esModule:true,default:'NginxBackupsPanel'}:name==='./ai-log-assistant'?{default:'div'}:name==='./node-apps'?{__esModule:true,default:'NodeApps'}:native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const requests=[];let props={connected:true,initialTab:'services',api:()=>new Promise(resolve=>requests.push(resolve))};
 const render=()=>{si=ri=0;return module.exports.default(props);};const find=(tree,predicate)=>{if(!tree)return null;if(Array.isArray(tree))return tree.map(child=>find(child,predicate)).find(Boolean);if(predicate(tree))return tree;return find(toastTestChildren(tree),predicate);};
 const click=()=>find(render(),node=>node.props?.['aria-label']==='서비스 상태 조회').props.onClick();
 const first=click(),second=click();requests[1]({services:[{unit:'new.service'}],permissions:{}});await second;requests[0]({services:[{unit:'old.service'}],permissions:{}});await first;
 let tree=render();assert(find(tree,node=>node.type==='strong'&&node.props.children==='new.service'));assert(!find(tree,node=>node.type==='strong'&&node.props.children==='old.service'));
 const third=click();props={...props,connected:false};render();requests[2]({services:[{unit:'disconnected.service'}],permissions:{}});await third;tree=render();assert(!find(tree,node=>node.type==='strong'&&node.props.children==='disconnected.service'));
});

test('daemon rows distinguish permanent startup, runtime-only startup and link states in Korean',async()=>{
 const React=await import('react');const {renderToStaticMarkup}=await import('react-dom/server');
 await loadBindings();const {code}=await transform(await readFile(new URL('../components/operations-panel.tsx',import.meta.url),'utf8'),{filename:'operations-panel.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),module={exports:{}},noop=()=>null;
 const control=({children})=>React.createElement('span',null,children);
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?{...React,useEffect:()=>{}}:name==='next/link'?{__esModule:true,default:control}:name==='./language-provider'?{useLanguage:()=>({t:text=>text,locale:'ko'})}:name==='./ui/controls'?Object.fromEntries(['Button','Dropdown','TextInput','Checkbox','Switch','Badge'].map(key=>[key,control])):name==='./postgresql-code-recovery'||name==='./nginx-backups-panel'||name==='./ai-log-assistant'?{__esModule:true,default:noop}:name==='./node-apps'?{__esModule:true,default:'NodeApps'}:native(name);
 new Function('require','module','exports',code)(require,module,module.exports);
 const statuses=['enabled','enabled-runtime','masked-runtime','linked','linked-runtime','alias','bad','constructor','future-state'];
 const services=statuses.map((state,index)=>({unit:'fixture'+index+'.service',ActiveState:'active',SubState:'running',LoadState:'loaded',UnitFileState:state}));
 const html=renderToStaticMarkup(React.createElement(module.exports.default,{connected:true,initialData:{services,permissions:{}},api:noop,security:{settings:{readOnly:true}}}));
 for(const label of ['자동 시작 (이번 부팅)','차단됨 (이번 부팅)','연결됨 (이번 부팅)','별칭','잘못된 설정'])assert(html.includes(label),label);
 for(const state of ['enabled-runtime','masked-runtime','linked-runtime'])assert(!html.includes(state),state+' must use its Korean label');
 assert(html.includes('constructor')&&html.includes('future-state'),'unknown states are rendered as data without inherited object properties');
 const rows=html.match(/<div class="service-row[^]*?<\/div>/g);assert(rows);
 assert(rows[0].includes('실행 중 · 자동 시작'));
 assert(rows[1].includes('실행 중 · 자동 시작 (이번 부팅)'));
 assert(rows[3].includes('실행 중 · 연결됨')&&!rows[3].includes('자동 시작'),'linked does not mean enabled');
});
