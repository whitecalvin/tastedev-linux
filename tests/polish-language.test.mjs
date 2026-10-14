import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../lib/locales/en.json' with {type:'json'};
import pl from '../lib/locales/pl.json' with {type:'json'};
import {resolveLocale,translate,languageCatalog,languageCoverage,localeFlag} from '../lib/i18n.ts';
import {loadLanguageCatalog} from '../lib/i18n-client.ts';
import {initialLanguage,languageDirection} from '../lib/language-preference.ts';

test('Polish Linux locale preserves saved preference and loads the same server and client catalog',async()=>{
 assert.equal(resolveLocale('pl_PL.UTF-8'),'pl-PL');
 assert.equal(localeFlag('pl-PL'),'🇵🇱');
 assert.equal(languageDirection('pl-PL'),'ltr');
 assert.equal(initialLanguage('pl-PL','ko').locale,'pl-PL');
 assert.equal(initialLanguage(null,'ko;q=0.2,pl-PL;q=0.9').locale,'pl-PL');
 assert.deepEqual(await loadLanguageCatalog('pl-PL'),languageCatalog('pl-PL'));
 assert.equal(translate('pl-PL','관리자 로그인'),'Logowanie administratora');
 assert.equal(translate('pl','왼쪽 노드를 선택하세요.'),'Wybierz węzeł po lewej stronie.');
});

test('Polish covers every canonical message and preserves placeholders and runtime content',()=>{
 const coverage=languageCoverage('pl-PL');
 assert.equal(coverage.translatedEntries,Object.keys(pl).length);
 assert.equal(coverage.totalEntries,Object.keys(en).length);
 assert.equal(coverage.complete,true);
 assert.deepEqual(Object.keys(pl).sort(),Object.keys(en).sort());
 assert.equal(translate('pl-PL','unknown-runtime-message'),'unknown-runtime-message');
 assert.equal(translate('pl-PL','/etc/nginx/nginx.conf'),'/etc/nginx/nginx.conf');
 for(const [key,value] of Object.entries(pl)){
  assert(Object.hasOwn(en,key));assert(value.trim());assert(!/[가-힣]/.test(value));
  assert.deepEqual((value.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort(),(en[key].match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort());
 }
});
