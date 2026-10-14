import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../lib/locales/en.json' with {type:'json'};
import sv from '../lib/locales/sv.json' with {type:'json'};
import {resolveLocale,translate,languageCatalog,languageCoverage,localeFlag} from '../lib/i18n.ts';
import {loadLanguageCatalog} from '../lib/i18n-client.ts';
import {initialLanguage,languageDirection} from '../lib/language-preference.ts';

test('Swedish Linux locale preserves preference and shares server and client translations',async()=>{
 assert.equal(resolveLocale('sv_SE.UTF-8'),'sv-SE');
 assert.equal(localeFlag('sv-SE'),'🇸🇪');
 assert.equal(languageDirection('sv-SE'),'ltr');
 assert.equal(initialLanguage('sv-SE','ko').locale,'sv-SE');
 assert.equal(initialLanguage(null,'ko;q=0.2,sv-SE;q=0.9').locale,'sv-SE');
 assert.deepEqual(await loadLanguageCatalog('sv-SE'),languageCatalog('sv-SE'));
 assert.equal(translate('sv-SE','관리자 로그인'),'Administratörsinloggning');
 assert.equal(translate('sv','왼쪽 노드를 선택하세요.'),'Välj en nod till vänster.');
});

test('Swedish covers every canonical message and preserves runtime content and placeholders',()=>{
 const coverage=languageCoverage('sv-SE');
 assert.equal(coverage.translatedEntries,Object.keys(sv).length);
 assert.equal(coverage.totalEntries,Object.keys(en).length);
 assert.equal(coverage.complete,true);
 assert.deepEqual(Object.keys(sv).sort(),Object.keys(en).sort());
 assert.equal(translate('sv-SE','unknown-runtime-message'),'unknown-runtime-message');
 assert.equal(translate('sv-SE','/etc/nginx/nginx.conf'),'/etc/nginx/nginx.conf');
 for(const [key,value] of Object.entries(sv)){
  assert(Object.hasOwn(en,key));assert(value.trim());assert(!/[가-힣]/.test(value));
  assert.deepEqual((value.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort(),(en[key].match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort());
  assert.equal(value.split('\n').length,en[key].split('\n').length);
 }
});
