import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import * as packageIdeTypes from '../components/package-ide-types.ts';
import test from 'node:test';import assert from 'node:assert/strict';
import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
test('MariaDB initial server HTML contains file and actual groups with no config-source request or selected inspector',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/package-config-ide.tsx',import.meta.url),'utf8'),{filename:'package-config-ide.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),module={exports:{}};
 const mocks={'./language-provider':{useLanguage:()=>({t:value=>value})},'./draft-provider':{useDraftState:(_,initial)=>[initial,()=>{}]},'./ui/controls':{Button:({children,loading,variant,...props})=>React.createElement('button',props,children)}};
 mocks['./ui/toast-provider']=toastTestModuleWithReact(React);
 for(const name of ['postgresql-data-backups','redis-backups','mariadb-backups','postgresql-completed-history','postgresql-code-recovery','postgresql-code-operation','mariadb-code-operation','redis-code-operation','package-config','mariadb-settings','redis-settings','postgresql-settings','postgresql-hba-settings','server-manager','config-code-editor','postgresql-restore','postgresql-hba-operation'])mocks['./'+name]={__esModule:true,default:()=>{throw Error('Inspector must start empty');}};
 new Function('require','module','exports',compiled.code)(name=>name==='./package-ide-types'?packageIdeTypes:name==='./console-types'?consoleTypes:Object.hasOwn(mocks,name)?mocks[name]:name==='./ui/ide-split-layout'?{__esModule:true,default:'div'}:native(name),module,module.exports);
 const api=()=>{throw Error('Server HTML must use its metadata snapshot');};
 const html=renderToStaticMarkup(React.createElement(module.exports.default,{kind:'mariadb',connected:true,api,security:null,initialData:{kind:'mariadb',files:[{path:'/etc/mysql/conf.d/site.cnf',groups:['client','mysqld','empty'],values:{},version:'fixture'}],service:{ActiveState:'active'}}}));
 assert(html.includes('conf.d/site.cnf'));for(const name of ['client','mysqld','empty'])assert(html.includes('['+name+']'));assert(html.includes('왼쪽 노드를 선택하세요.'));assert(!html.includes('package-ide-settings'));assert(!html.includes('불러오는 중'));assert(html.includes('<details open="">'));
});
