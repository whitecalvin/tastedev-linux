import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../lib/locales/en.json' with {type:'json'};
import bg from '../lib/locales/bg.json' with {type:'json'};
import {resolveLocale,translate,languageCatalog,languageCoverage,localeFlag} from '../lib/i18n.ts';
import {loadLanguageCatalog} from '../lib/i18n-client.ts';
import {initialLanguage,languageDirection} from '../lib/language-preference.ts';

test('Bulgarian Linux locale preserves preference and shares server and client translations',async()=>{
 assert.equal(resolveLocale('bg_BG.UTF-8'),'bg-BG');
 assert.equal(localeFlag('bg-BG'),'🇧🇬');
 assert.equal(languageDirection('bg-BG'),'ltr');
 assert.equal(initialLanguage('bg-BG','ko').locale,'bg-BG');
 assert.equal(initialLanguage(null,'ko;q=0.2,bg-BG;q=0.9').locale,'bg-BG');
 assert.deepEqual(await loadLanguageCatalog('bg-BG'),languageCatalog('bg-BG'));
 assert.equal(translate('bg-BG','관리자 계정'),'Администраторски акаунт');
 assert.equal(translate('bg','대시보드'),'Табло');
});

test('Bulgarian covers the complete catalog and preserves runtime content and placeholders',()=>{
 const coverage=languageCoverage('bg-BG');
 assert.equal(coverage.translatedEntries,Object.keys(bg).length);
 assert.equal(coverage.totalEntries,Object.keys(en).length);
 assert.equal(coverage.complete,true);
 assert.deepEqual(Object.keys(bg).sort(),Object.keys(en).sort());
 assert.equal(translate('bg-BG','unknown-runtime-message'),'unknown-runtime-message');
 assert.equal(translate('bg-BG','/etc/nginx/nginx.conf'),'/etc/nginx/nginx.conf');
 for(const [key,value] of Object.entries(bg)){
  assert(Object.hasOwn(en,key));assert(value.trim());assert(!/[가-힣]/.test(value));
  assert.deepEqual((value.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort(),(en[key].match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort());
  assert.equal(value.split('\n').length,en[key].split('\n').length);
 }
});
