import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../lib/locales/en.json' with {type:'json'};
import cs from '../lib/locales/cs.json' with {type:'json'};
import {resolveLocale,translate,languageCatalog,languageCoverage,localeFlag} from '../lib/i18n.ts';
import {loadLanguageCatalog} from '../lib/i18n-client.ts';
import {initialLanguage,languageDirection} from '../lib/language-preference.ts';

test('Czech Linux locale preserves preference and shares server and client translations',async()=>{
 assert.equal(resolveLocale('cs_CZ.UTF-8'),'cs-CZ');
 assert.equal(localeFlag('cs-CZ'),'🇨🇿');
 assert.equal(languageDirection('cs-CZ'),'ltr');
 assert.equal(initialLanguage('cs-CZ','ko').locale,'cs-CZ');
 assert.equal(initialLanguage(null,'ko;q=0.2,cs-CZ;q=0.9').locale,'cs-CZ');
 assert.deepEqual(await loadLanguageCatalog('cs-CZ'),languageCatalog('cs-CZ'));
 assert.equal(translate('cs-CZ','관리자 로그인'),'Přihlášení správce');
 assert.equal(translate('cs','왼쪽 노드를 선택하세요.'),'Vyberte uzel vlevo.');
});

test('Czech covers every canonical message and preserves runtime content and placeholders',()=>{
 const coverage=languageCoverage('cs-CZ');
 assert.equal(coverage.translatedEntries,Object.keys(cs).length);
 assert.equal(coverage.totalEntries,Object.keys(en).length);
 assert.equal(coverage.complete,true);
 assert.deepEqual(Object.keys(cs).sort(),Object.keys(en).sort());
 assert.equal(translate('cs-CZ','unknown-runtime-message'),'unknown-runtime-message');
 assert.equal(translate('cs-CZ','/etc/nginx/nginx.conf'),'/etc/nginx/nginx.conf');
 for(const [key,value] of Object.entries(cs)){
  assert(Object.hasOwn(en,key));assert(value.trim());assert(!/[가-힣]/.test(value));
  assert.deepEqual((value.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort(),(en[key].match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort());
  assert.equal(value.split('\n').length,en[key].split('\n').length);
 }
});
