import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../lib/locales/en.json' with {type:'json'};
import hu from '../lib/locales/hu.json' with {type:'json'};
import {resolveLocale,translate,languageCatalog,languageCoverage,localeFlag} from '../lib/i18n.ts';
import {loadLanguageCatalog} from '../lib/i18n-client.ts';
import {initialLanguage,languageDirection} from '../lib/language-preference.ts';

test('Hungarian Linux locale preserves preference and shares server and client translations',async()=>{
 assert.equal(resolveLocale('hu_HU.UTF-8'),'hu-HU');
 assert.equal(localeFlag('hu-HU'),'🇭🇺');
 assert.equal(languageDirection('hu-HU'),'ltr');
 assert.equal(initialLanguage('hu-HU','ko').locale,'hu-HU');
 assert.equal(initialLanguage(null,'ko;q=0.2,hu-HU;q=0.9').locale,'hu-HU');
 assert.deepEqual(await loadLanguageCatalog('hu-HU'),languageCatalog('hu-HU'));
 assert.equal(translate('hu-HU','관리자 계정'),'Rendszergazdai fiók');
 assert.equal(translate('hu','대시보드'),'Áttekintő');
});

test('Hungarian covers every canonical message and preserves runtime content and placeholders',()=>{
 const coverage=languageCoverage('hu-HU');
 assert.equal(coverage.translatedEntries,Object.keys(hu).length);
 assert.equal(coverage.totalEntries,Object.keys(en).length);
 assert.equal(coverage.complete,true);
 assert.deepEqual(Object.keys(hu).sort(),Object.keys(en).sort());
 assert.equal(translate('hu-HU','unknown-runtime-message'),'unknown-runtime-message');
 assert.equal(translate('hu-HU','/etc/nginx/nginx.conf'),'/etc/nginx/nginx.conf');
 for(const [key,value] of Object.entries(hu)){
  assert(Object.hasOwn(en,key));assert(value.trim());assert(!/[가-힣]/.test(value));
  assert.deepEqual((value.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort(),(en[key].match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort());
  assert.equal(value.split('\n').length,en[key].split('\n').length);
 }
});
