import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../lib/locales/en.json' with {type:'json'};
import ro from '../lib/locales/ro.json' with {type:'json'};
import {resolveLocale,translate,languageCatalog,languageCoverage,localeFlag} from '../lib/i18n.ts';
import {loadLanguageCatalog} from '../lib/i18n-client.ts';
import {initialLanguage,languageDirection} from '../lib/language-preference.ts';

test('Romanian Linux locale preserves preference and shares server and client translations',async()=>{
 assert.equal(resolveLocale('ro_RO.UTF-8'),'ro-RO');
 assert.equal(localeFlag('ro-RO'),'🇷🇴');
 assert.equal(languageDirection('ro-RO'),'ltr');
 assert.equal(initialLanguage('ro-RO','ko').locale,'ro-RO');
 assert.equal(initialLanguage(null,'ko;q=0.2,ro-RO;q=0.9').locale,'ro-RO');
 assert.deepEqual(await loadLanguageCatalog('ro-RO'),languageCatalog('ro-RO'));
 assert.equal(translate('ro-RO','관리자 계정'),'Cont de administrator');
 assert.equal(translate('ro','대시보드'),'Tablou de bord');
});

test('Romanian covers every canonical message and preserves runtime content and placeholders',()=>{
 const coverage=languageCoverage('ro-RO');
 assert.equal(coverage.translatedEntries,Object.keys(ro).length);
 assert.equal(coverage.totalEntries,Object.keys(en).length);
 assert.equal(coverage.complete,true);
 assert.deepEqual(Object.keys(ro).sort(),Object.keys(en).sort());
 assert.equal(translate('ro-RO','unknown-runtime-message'),'unknown-runtime-message');
 assert.equal(translate('ro-RO','/etc/nginx/nginx.conf'),'/etc/nginx/nginx.conf');
 for(const [key,value] of Object.entries(ro)){
  assert(Object.hasOwn(en,key));assert(value.trim());assert(!/[가-힣]/.test(value));
  assert.deepEqual((value.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort(),(en[key].match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort());
  assert.equal(value.split('\n').length,en[key].split('\n').length);
 }
});
