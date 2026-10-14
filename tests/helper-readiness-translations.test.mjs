import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {loadBindings,transform} from 'next/dist/build/swc/index.js';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {translate,languageCatalog} from '../lib/i18n.ts';
const native=createRequire(import.meta.url),locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
async function compiled(file,mocks,fixtureProcess=process){await loadBindings();const {code}=await transform(await readFile(new URL(file,import.meta.url),'utf8'),{filename:file,jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});const module={exports:{}};new Function('require','module','exports','process',code)(name=>name==='./ui/toast-provider'?toastTestModuleWithReact(mocks.react??React):name==='./console-types'?consoleTypes:Object.hasOwn(mocks,name)?mocks[name]:native(name),module,module.exports,fixtureProcess);return module.exports;}
test('actual helper readiness cases stay conservative and appear translated in the security component',async()=>{
 let scenario='valid',spawnCalls=0,apiCalls=0,locale='en';const helper='/usr/local/libexec/linux-admin';
 const mocks={'./helper-actions.ts':{helperActions:['nginx-check']},'./helper-error.ts':{},'./redis-validation-error.ts':{},'./helper-json-output.ts':{},'node:child_process':{execFile:()=>{spawnCalls++;throw Error('unexpected execution');},spawn:()=>{spawnCalls++;throw Error('unexpected execution');}},'node:fs':{lstatSync:name=>{
  if(name==='/usr/bin/node'&&scenario==='missing-node'||name===helper&&['missing-helper','unreadable-helper'].includes(scenario))throw Object.assign(Error('fixture'),{code:scenario==='unreadable-helper'?'EPERM':'ENOENT'});
  const file=name===helper||name==='/usr/bin/node';return {isSymbolicLink:()=>false,isFile:()=>file,isDirectory:()=>!file,uid:name==='/usr/bin/node'&&scenario==='unsafe-node'?1000:0,mode:name==='/usr/local'&&scenario==='unsafe-parent'?0o775:0o755};
 },readFileSync:name=>Buffer.from(name===helper&&scenario==='mismatch'?'different':'fixture')}};
 const privilege=await compiled('../lib/privilege.ts',mocks,{env:{LINUX_PACKAGED:'false'},cwd:()=>'/fixture'});
 const control=({children})=>React.createElement('span',null,children);const ui=await compiled('../components/security-panel.tsx',{'./sudo-policy-panel':{__esModule:true,default:()=>null},'./language-provider':{useLanguage:()=>({t:(text,values)=>translate(locale,text,values)})},'./ui/controls':Object.fromEntries(['Button','Switch','Badge','Dropdown','TextInput'].map(name=>[name,control]))});
 for(scenario of ['missing-node','unsafe-node','unsafe-parent','missing-helper','unreadable-helper','mismatch','valid']){
  const status=privilege.helperStatus();assert.equal(status.ready,scenario==='valid');assert.equal(status.sudoPermission,'unchecked');assert.equal(status.path,helper);
  for(locale of locales){const translated=translate(locale,status.reason);assert(!/[가-힣]/.test(translated));assert.notEqual(translated,status.reason);const encoded=renderToStaticMarkup(React.createElement('span',null,translated)).replace(/^<span>|<\/span>$/g,'');const html=renderToStaticMarkup(React.createElement(ui.default,{connected:true,initialData:{privilege:status},api:()=>{apiCalls++;throw Error('unexpected API');}}));assert(html.includes(encoded));assert(html.includes(helper));}
 }
 assert.equal(spawnCalls,0);assert.equal(apiCalls,0);
});
test('helper failure wrapper translates known detail and preserves native stderr and empty-detail messages',()=>{
 const prefix='관리 명령 실패. 전용 helper와 NOPASSWD 권한을 확인하세요. ';
 for(const locale of locales){const c=languageCatalog(locale);assert.equal(translate(locale,prefix+'검수 요청을 확인하세요.'),c[prefix+'{detail}'].replace('{detail}',c['검수 요청을 확인하세요.']));assert.equal(translate(locale,prefix+'sudo: /tmp/$&/fixture'),c[prefix+'{detail}'].replace('{detail}',()=>'sudo: /tmp/$&/fixture'));assert.equal(translate(locale,prefix),c[prefix.trim()]+' ');assert(translate(locale,prefix).includes('NOPASSWD'));}assert.equal(translate('ko',prefix+'details'),prefix+'details');
});
