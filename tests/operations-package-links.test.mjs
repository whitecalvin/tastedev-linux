import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {loadBindings,transform} from 'next/dist/build/swc/index.js';
import {servicePackageRoute} from '../lib/console-route.ts';
test('daemon GUI links only loaded supported services and suppresses links when disconnected',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/operations-panel.tsx',import.meta.url),'utf8'),{filename:'operations-panel.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 for(const connected of [true,false]){
  let index=0;const native=createRequire(import.meta.url),module={exports:{}};
  const services=[{unit:'nginx.service',LoadState:'loaded'},{unit:'redis-server.service',LoadState:'not-found'},{unit:'custom.service',LoadState:'loaded'},{unit:'postgresql@18-main.service',ActiveState:'unknown',LoadState:'unknown',error:'서비스 상태 조회 시간이 초과되었습니다. 잠시 후 다시 갱신하세요.'}];
  const hooks={...React,useState:initial=>[index++===1?services:initial,()=>{}],useEffect:()=>{}};
  const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='next/link'?{__esModule:true,default:props=>React.createElement('a',props)}:name.includes('console-route')?{servicePackageRoute}:name==='./language-provider'?{useLanguage:()=>({t:value=>value,locale:'ko'})}:name==='./postgresql-code-recovery'?{__esModule:true,default:'PostgreSQLCodeRecovery'}:name==='./nginx-backups-panel'?{__esModule:true,default:'NginxBackupsPanel'}:name==='./ai-log-assistant'?{default:()=>null}:name==='./ui/controls'?Object.fromEntries(['Button','Dropdown','TextInput','Checkbox','Switch','Badge'].map(key=>[key,props=>React.createElement('div',null,props.label||props.children)])):name==='./node-apps'?{__esModule:true,default:'NodeApps'}:native(name);
  new Function('require','module','exports',compiled.code)(require,module,module.exports);
  const html=renderToStaticMarkup(React.createElement(module.exports.default,{connected,api:()=>{throw Error('render must not call API');}}));
  assert.equal(html.includes('href="/ide/packages/nginx"'),connected);
  assert(html.includes('<p>서비스 상태 조회 시간이 초과되었습니다. 잠시 후 다시 갱신하세요.</p>'));
  assert(!html.includes('href="/ide/packages/redis"'));assert(!html.includes('href="/ide/packages/custom"'));
 }
});

test('changing daemon filters updates the visible list without changing the control target or requesting the server',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/operations-panel.tsx',import.meta.url),'utf8'),{filename:'operations-panel.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[];let si=0,ri=0;const native=createRequire(import.meta.url),module={exports:{}};
 const hooks={...React,useState:initial=>{const i=si++;if(!(i in states))states[i]=i===1?[{unit:'nginx.service',ActiveState:'active',LoadState:'loaded'},{unit:'redis-server.service',ActiveState:'failed',LoadState:'loaded'}]:initial;return [states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},useRef:value=>refs[ri++]??(refs[ri-1]={current:value}),useEffect:()=>{},useCallback:fn=>fn};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='next/link'?{__esModule:true,default:'a'}:name.includes('console-route')?{servicePackageRoute}:name==='./language-provider'?{useLanguage:()=>({t:value=>value,locale:'ko'})}:name==='./postgresql-code-recovery'?{__esModule:true,default:'PostgreSQLCodeRecovery'}:name==='./nginx-backups-panel'?{__esModule:true,default:'NginxBackupsPanel'}:name==='./ai-log-assistant'?{default:()=>null}:name==='./ui/controls'?Object.fromEntries(['Button','Dropdown','TextInput','Checkbox','Switch','Badge'].map(key=>[key,key])):name==='./node-apps'?{__esModule:true,default:'NodeApps'}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const render=()=>{si=ri=0;return module.exports.default({connected:true,installedPackages:[{id:'postgresql',installed:true},{id:'mariadb',installed:false}],api:()=>{throw Error('local filter must not request API');}});};
 const find=(node,predicate)=>{if(!node)return null;if(Array.isArray(node))return node.map(child=>find(child,predicate)).find(Boolean);if(predicate(node))return node;return find(toastTestChildren(node),predicate);};
 let tree=render();find(tree,node=>node.props?.label==='상태 필터').props.onChange({target:{value:'failed'}});tree=render();
 assert(find(tree,node=>node.type==='strong'&&node.props.children==='redis-server.service'));assert(!find(tree,node=>node.type==='strong'&&node.props.children==='nginx.service'));
 assert.equal(find(tree,node=>node.props?.label==='대상 서비스').props.value,'nginx.service');
 find(tree,node=>node.props?.label==='서비스 검색').props.onChange({target:{value:'nginx'}});tree=render();assert(find(tree,node=>node.props?.children==='조건에 맞는 서비스가 없습니다.'));
 find(tree,node=>node.props?.children==='백업 / 복구').props.onClick();tree=render();const recovery=find(tree,node=>node.type==='NginxBackupsPanel');assert(recovery,'recovery page must expose full nginx config backups');assert.equal(recovery.props.connected,true);assert.equal(recovery.props.allowed,false);assert(find(tree,node=>node.type==='a'&&node.props.href==='/ide/packages/postgresql'));assert(!find(tree,node=>node.type==='a'&&node.props.href==='/ide/packages/mariadb')); 
});

test('Node.js recovery navigation translates review text in every provided language while preserving its route',async()=>{
 const {translate,languageCoverageSummary}=await import('../lib/i18n.ts');
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/operations-panel.tsx',import.meta.url),'utf8'),{filename:'operations-panel.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url);
 for(const locale of ['ko',...Object.keys(languageCoverageSummary())]){
  const module={exports:{}};
  const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?React:name==='next/link'?{__esModule:true,default:props=>React.createElement('a',props)}:name==='./language-provider'?{useLanguage:()=>({t:(key,values)=>translate(locale,key,values),locale})}:name==='./ui/controls'?Object.fromEntries(['Button','Dropdown','TextInput','Checkbox','Switch','Badge'].map(key=>[key,props=>React.createElement('div',null,props.label||props.children)])):name.startsWith('./')?{__esModule:true,default:()=>null}:native(name);
  new Function('require','module','exports',compiled.code)(require,module,module.exports);
  const html=renderToStaticMarkup(React.createElement(module.exports.default,{connected:true,initialTab:'backups',dedicated:true,security:null,installedPackages:[{id:'nodejs',installed:true}],api:()=>{throw Error('render must not call API');}}));
  const expected=renderToStaticMarkup(React.createElement('a',{className:'package-config-link',href:'/ide/packages/nodejs'},'Node.js ',translate(locale,'복원 검토'),' ↗'));
  assert(html.includes(expected),locale);
  if(locale!=='ko')assert(!html.includes('Node.js 복원 검토'),locale);
 }
});
