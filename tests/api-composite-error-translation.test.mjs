import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {translateWithCatalog} from '../lib/i18n-core.ts';
import {translate,languageCatalog} from '../lib/i18n.ts';
test('composite legacy API diagnostics translate wrapper and exact known detail while preserving whitespace and Korean',()=>{
 const catalog={'요청 처리 실패: {detail}':'Request failed: {detail}','검수 요청을 확인하세요.':'Check validation.'};
 const value='  요청 처리 실패: 검수 요청을 확인하세요.\n';assert.equal(translateWithCatalog('en',value,undefined,catalog,{}),'  Request failed: Check validation.\n');assert.equal(translateWithCatalog('ko',value,undefined,catalog,{}),value);
 assert.equal(translateWithCatalog('en','요청 처리 실패: /tmp/$&/unknown',undefined,catalog,{}),'Request failed: /tmp/$&/unknown');
 assert.equal(translateWithCatalog('en',value,undefined,{},{}),value,'no template must preserve original rather than discard details');
 assert.equal(translateWithCatalog('en',value,undefined,{...catalog,'요청 처리 실패: 검수 요청을 확인하세요.':'Exact override'},{}),'  Exact override\n');
});
test('actual API legacy error wire format and status stay compatible while all twelve catalogs translate it',async()=>{
 await loadBindings();const {code}=await transform(await readFile(new URL('../lib/api.ts',import.meta.url),'utf8'),{filename:'api.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});const module={exports:{}};
 new Function('require','module','exports',code)(name=>name==='./auth.ts'?{cookieSession:async()=>({username:'fixture'})}:name==='./workspace.ts'?{listFiles:async()=>{throw Error('검수 요청을 확인하세요.');}}:{},module,module.exports);
 const response=await module.exports.handle(new Request('http://127.0.0.1:8791/api/files'),'files');assert.equal(response.status,400);const {error}=await response.json();assert.equal(error,'요청 처리 실패: 검수 요청을 확인하세요.');
 for(const locale of ['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk']){const c=languageCatalog(locale);assert.equal(translate(locale,error),c['요청 처리 실패: {detail}'].replace('{detail}',c['검수 요청을 확인하세요.']));assert(!/[가-힣]/.test(translate(locale,error)));}assert.equal(translate('ko',error),error);
});
test('lazy client catalogs and SSR catalogs produce identical composite error translations',async()=>{
 const {loadLanguageCatalog,englishCatalog}=await import('../lib/i18n-client.ts');const message='요청 처리 실패: 검수 요청을 확인하세요.';
 for(const locale of ['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk','aa'])assert.equal(translateWithCatalog(locale,message,undefined,await loadLanguageCatalog(locale),englishCatalog),translate(locale,message));
 assert.equal(translateWithCatalog('en','  요청 처리 실패: 검수 요청을 확인하세요.\n',undefined,{},englishCatalog),'  Request failed: Check the validation request.\n');
});
