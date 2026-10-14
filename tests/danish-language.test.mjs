import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../lib/locales/en.json' with {type:'json'};
import da from '../lib/locales/da.json' with {type:'json'};
import {resolveLocale,translate,languageCatalog,languageCoverage,localeFlag} from '../lib/i18n.ts';
import {loadLanguageCatalog} from '../lib/i18n-client.ts';
import {initialLanguage,languageDirection} from '../lib/language-preference.ts';

test('Danish Linux locale preserves preference and shares server and client translations',async()=>{
 assert.equal(resolveLocale('da_DK.UTF-8'),'da-DK');
 assert.equal(localeFlag('da-DK'),'🇩🇰');
 assert.equal(languageDirection('da-DK'),'ltr');
 assert.equal(initialLanguage('da-DK','ko').locale,'da-DK');
 assert.equal(initialLanguage(null,'ko;q=0.2,da-DK;q=0.9').locale,'da-DK');
 assert.deepEqual(await loadLanguageCatalog('da-DK'),languageCatalog('da-DK'));
 assert.equal(translate('da-DK','관리자 로그인'),'Administratorlogin');
 assert.equal(translate('da','왼쪽 노드를 선택하세요.'),'Vælg en node til venstre.');
});

test('Danish covers every canonical message and preserves runtime content and placeholders',()=>{
 const coverage=languageCoverage('da-DK');
 assert.equal(coverage.translatedEntries,Object.keys(da).length);
 assert.equal(coverage.totalEntries,Object.keys(en).length);
 assert.equal(coverage.complete,true);
 assert.deepEqual(Object.keys(da).sort(),Object.keys(en).sort());
 assert.equal(translate('da-DK','unknown-runtime-message'),'unknown-runtime-message');
 assert.equal(translate('da-DK','/etc/nginx/nginx.conf'),'/etc/nginx/nginx.conf');
 for(const [key,value] of Object.entries(da)){
  assert(Object.hasOwn(en,key));assert(value.trim());assert(!/[가-힣]/.test(value));
  assert.deepEqual((value.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort(),(en[key].match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort());
  assert.equal(value.split('\n').length,en[key].split('\n').length);
 }
});
