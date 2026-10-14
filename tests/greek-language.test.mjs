import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../lib/locales/en.json' with {type:'json'};
import el from '../lib/locales/el.json' with {type:'json'};
import {resolveLocale,translate,languageCatalog,languageCoverage,localeFlag} from '../lib/i18n.ts';
import {loadLanguageCatalog} from '../lib/i18n-client.ts';
import {initialLanguage,languageDirection} from '../lib/language-preference.ts';

test('Greek Linux locale preserves preference and shares server and client translations',async()=>{
 assert.equal(resolveLocale('el_GR.UTF-8'),'el-GR');
 assert.equal(localeFlag('el-GR'),'🇬🇷');
 assert.equal(languageDirection('el-GR'),'ltr');
 assert.equal(initialLanguage('el-GR','ko').locale,'el-GR');
 assert.equal(initialLanguage(null,'ko;q=0.2,el-GR;q=0.9').locale,'el-GR');
 assert.deepEqual(await loadLanguageCatalog('el-GR'),languageCatalog('el-GR'));
 assert.equal(translate('el-GR','관리자 계정'),'Λογαριασμός διαχειριστή');
 assert.equal(translate('el','대시보드'),'Πίνακας ελέγχου');
});

test('Greek covers every canonical message and preserves runtime content and placeholders',()=>{
 const coverage=languageCoverage('el-GR');
 assert.equal(coverage.translatedEntries,Object.keys(el).length);
 assert.equal(coverage.totalEntries,Object.keys(en).length);
 assert.equal(coverage.complete,true);
 assert.deepEqual(Object.keys(el).sort(),Object.keys(en).sort());
 assert.equal(translate('el-GR','unknown-runtime-message'),'unknown-runtime-message');
 assert.equal(translate('el-GR','/etc/nginx/nginx.conf'),'/etc/nginx/nginx.conf');
 for(const [key,value] of Object.entries(el)){
  assert(Object.hasOwn(en,key));assert(value.trim());assert(!/[가-힣]/.test(value));
  assert.deepEqual((value.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort(),(en[key].match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort());
  assert.equal(value.split('\n').length,en[key].split('\n').length);
 }
});
