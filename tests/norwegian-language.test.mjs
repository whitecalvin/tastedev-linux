import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../lib/locales/en.json' with {type:'json'};
import nb from '../lib/locales/nb.json' with {type:'json'};
import {resolveLocale,translate,languageCatalog,languageCoverage,localeFlag} from '../lib/i18n.ts';
import {loadLanguageCatalog} from '../lib/i18n-client.ts';
import {initialLanguage,languageDirection} from '../lib/language-preference.ts';

test('Norwegian Bokmål preserves locale preference and shares client/server translations',async()=>{
 assert.equal(resolveLocale('nb_NO.UTF-8'),'nb-NO');
 assert.equal(localeFlag('nb-NO'),'🇳🇴');
 assert.equal(languageDirection('nb-NO'),'ltr');
 assert.equal(initialLanguage('nb-NO','ko').locale,'nb-NO');
 assert.deepEqual(await loadLanguageCatalog('nb-NO'),languageCatalog('nb-NO'));
 assert.equal(translate('nb-NO','관리자 계정'),'Administratorkonto');
 assert.equal(translate('nb','대시보드'),'Dashbord');
});

test('complete Norwegian catalog covers canonical messages and preserves runtime content',()=>{
 const coverage=languageCoverage('nb-NO');
 assert.equal(coverage.translatedEntries,Object.keys(en).length);
 assert.equal(coverage.totalEntries,Object.keys(en).length);
 assert.equal(coverage.complete,true);
 assert.equal(translate('nb-NO','/etc/nginx/nginx.conf'),'/etc/nginx/nginx.conf');
 assert.equal(translate('nb-NO','unknown-runtime-message'),'unknown-runtime-message');
 assert.deepEqual(Object.keys(nb).sort(),Object.keys(en).sort());
 for(const [key,value] of Object.entries(nb)){
  assert(Object.hasOwn(en,key));assert(value.trim());assert(!/[가-힣]/.test(value));
  assert.deepEqual((value.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort(),(en[key].match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort());
  assert.equal(value.split('\n').length,en[key].split('\n').length);
 }
});
