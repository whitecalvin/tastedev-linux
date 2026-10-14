import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {translateWithCatalog} from '../lib/i18n-core.ts';
import {translate,languageCatalog} from '../lib/i18n.ts';
import {loadLanguageCatalog,englishCatalog} from '../lib/i18n-client.ts';
const native=createRequire(import.meta.url),locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
const wrappers=[['로그 조회 권한 또는 서비스 상태를 확인하세요: ','로그 조회 권한 또는 서비스 상태를 확인하세요: {detail}'],['crontab 조회 실패: ','crontab 조회 실패: {detail}']];
test('operation wrappers translate known diagnostics but preserve arbitrary shell paths and error text',()=>{
 for(const locale of locales)for(const [prefix,key] of wrappers){const catalog=languageCatalog(locale);assert(Object.hasOwn(catalog,key));
  for(const detail of ['/tmp/$&/literal: EACCES','stderr\nsecond line','']){const raw='  '+prefix+detail+'\n',translated=translate(locale,raw);const expected=detail?catalog[key].replace('{detail}',()=>detail):catalog[prefix.trim()]+' ';
   assert.equal(translated,'  '+expected+'\n');assert.equal(translate('ko',raw),raw);
  }
  const raw=prefix+'검수 요청을 확인하세요.';assert.equal(translate(locale,raw),catalog[key].replace('{detail}',()=>catalog['검수 요청을 확인하세요.']));
 }
 const raw=wrappers[0][0]+'EACCES';assert.equal(translateWithCatalog('en',raw,undefined,{},{}),raw);
 assert.equal(translateWithCatalog('en',raw,undefined,{[raw]:'Exact override'},{}),'Exact override');
});
test('actual log and crontab readers preserve status and wire diagnostics while all catalogs translate wrappers',async()=>{
 await loadBindings();const source=await readFile(new URL('../lib/operations.ts',import.meta.url),'utf8');
 const {code}=await transform(source,{filename:'operations.mjs',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});const calls=[];
 const mockExec=(binary,args,options,callback)=>{calls.push({binary,args,options});callback(Object.assign(Error('ignored message'),{stderr:'permission denied: /tmp/$&/literal',code:2}));};
 const mocks={'./system-settings.ts':{systemSettings:()=>({logLines:150,logRefreshSeconds:3})},'./runtime-paths.ts':{stateRoot:()=>'/tmp/operation-error-fixture'},'node:child_process':{execFile:mockExec}};
 const module={exports:{}};new Function('require','module','exports',code)(name=>Object.hasOwn(mocks,name)?mocks[name]:name.startsWith('.')?{}:native(name),module,module.exports);
 for(const [run,status,prefix] of [[()=>module.exports.readLogs('nginx.service'),403,wrappers[0][0]],[()=>module.exports.currentCron(),400,wrappers[1][0]]])await assert.rejects(run(),error=>{assert.equal(error.status,status);assert.equal(error.message,prefix+'permission denied: /tmp/$&/literal');for(const locale of locales){const value=translate(locale,error.message);assert(value.endsWith('permission denied: /tmp/$&/literal'));assert(!/[가-힣]/.test(value));}return true;});
 assert.equal(calls.length,2);assert.equal(calls[0].binary,'/usr/bin/journalctl');assert.equal(calls[1].binary,'/usr/bin/crontab');assert.equal(calls[1].options.env.LC_ALL,'C');
});
test('lazy client and server catalogs agree for operational wrappers, including fallback locale',async()=>{
 for(const locale of [...locales,'aa']){const catalog=await loadLanguageCatalog(locale);for(const [prefix] of wrappers){const raw=prefix+'permission denied: /tmp/$&/literal';assert.equal(translateWithCatalog(locale,raw,undefined,catalog,englishCatalog),translate(locale,raw));}}
});
