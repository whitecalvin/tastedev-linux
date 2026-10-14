import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../lib/locales/en.json' with {type:'json'};
import nl from '../lib/locales/nl.json' with {type:'json'};
import {resolveLocale,translate,languageCatalog,languageCoverage,localeFlag} from '../lib/i18n.ts';
import {loadLanguageCatalog} from '../lib/i18n-client.ts';
import {initialLanguage,languageDirection} from '../lib/language-preference.ts';

test('Dutch Linux locale uses the same native catalog on server and client',async()=>{
 assert.equal(resolveLocale('nl_NL.UTF-8'),'nl-NL');
 assert.equal(localeFlag('nl-NL'),'🇳🇱');
 assert.equal(languageDirection('nl-NL'),'ltr');
 assert.equal(initialLanguage('nl-NL','ko').locale,'nl-NL');
 assert.equal(initialLanguage(null,'ko;q=0.2,nl-NL;q=0.9').locale,'nl-NL');
 assert.deepEqual(await loadLanguageCatalog('nl-NL'),languageCatalog('nl-NL'));
 assert.equal(translate('nl-NL','관리자 로그인'),'Aanmelden als beheerder');
 assert.equal(translate('nl','왼쪽 노드를 선택하세요.'),'Selecteer een knooppunt aan de linkerkant.');
});

test('Dutch covers every canonical message and preserves placeholders and unknown content',()=>{
 const coverage=languageCoverage('nl-NL');
 assert.equal(coverage.translatedEntries,Object.keys(nl).length);
 assert.equal(coverage.totalEntries,Object.keys(en).length);
 assert.equal(coverage.complete,true);
 assert.deepEqual(Object.keys(nl).sort(),Object.keys(en).sort());
 assert.equal(translate('nl-NL','unknown-runtime-message'),'unknown-runtime-message');
 assert.equal(translate('nl-NL','/etc/nginx/nginx.conf'),'/etc/nginx/nginx.conf');
 for(const [key,value] of Object.entries(nl)){
  assert(Object.hasOwn(en,key));assert(value.trim());assert(!/[가-힣]/.test(value));
  assert.deepEqual((value.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort(),(en[key].match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort());
 }
});
