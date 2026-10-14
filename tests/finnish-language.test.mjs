import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../lib/locales/en.json' with {type:'json'};
import fi from '../lib/locales/fi.json' with {type:'json'};
import {resolveLocale,translate,languageCatalog,languageCoverage,localeFlag} from '../lib/i18n.ts';
import {loadLanguageCatalog} from '../lib/i18n-client.ts';
import {initialLanguage,languageDirection} from '../lib/language-preference.ts';

test('Finnish Linux locale preserves preference and shares server and client translations',async()=>{
 assert.equal(resolveLocale('fi_FI.UTF-8'),'fi-FI');
 assert.equal(localeFlag('fi-FI'),'🇫🇮');
 assert.equal(languageDirection('fi-FI'),'ltr');
 assert.equal(initialLanguage('fi-FI','ko').locale,'fi-FI');
 assert.equal(initialLanguage(null,'ko;q=0.2,fi-FI;q=0.9').locale,'fi-FI');
 assert.deepEqual(await loadLanguageCatalog('fi-FI'),languageCatalog('fi-FI'));
 assert.equal(translate('fi-FI','관리자 로그인'),'Ylläpitäjän kirjautuminen');
 assert.equal(translate('fi','왼쪽 노드를 선택하세요.'),'Valitse solmu vasemmalta.');
});

test('Finnish covers every canonical message and preserves runtime content and placeholders',()=>{
 const coverage=languageCoverage('fi-FI');
 assert.equal(coverage.translatedEntries,Object.keys(fi).length);
 assert.equal(coverage.totalEntries,Object.keys(en).length);
 assert.equal(coverage.complete,true);
 assert.deepEqual(Object.keys(fi).sort(),Object.keys(en).sort());
 assert.equal(translate('fi-FI','unknown-runtime-message'),'unknown-runtime-message');
 assert.equal(translate('fi-FI','/etc/nginx/nginx.conf'),'/etc/nginx/nginx.conf');
 for(const [key,value] of Object.entries(fi)){
  assert(Object.hasOwn(en,key));assert(value.trim());assert(!/[가-힣]/.test(value));
  assert.deepEqual((value.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort(),(en[key].match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort());
  assert.equal(value.split('\n').length,en[key].split('\n').length);
 }
});
