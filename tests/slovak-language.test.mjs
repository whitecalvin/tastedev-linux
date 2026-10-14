import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../lib/locales/en.json' with {type:'json'};
import sk from '../lib/locales/sk.json' with {type:'json'};
import {resolveLocale,translate,languageCatalog,languageCoverage,localeFlag} from '../lib/i18n.ts';
import {loadLanguageCatalog} from '../lib/i18n-client.ts';
import {initialLanguage,languageDirection} from '../lib/language-preference.ts';

test('Slovak preserves locale preference and shares client/server translations',async()=>{
 assert.equal(resolveLocale('sk_SK.UTF-8'),'sk-SK');
 assert.equal(localeFlag('sk-SK'),'🇸🇰');
 assert.equal(languageDirection('sk-SK'),'ltr');
 assert.equal(initialLanguage('sk-SK','ko').locale,'sk-SK');
 assert.deepEqual(await loadLanguageCatalog('sk-SK'),languageCatalog('sk-SK'));
 assert.equal(translate('sk-SK','관리자 계정'),'Účet správcu');
 assert.equal(translate('sk','대시보드'),'Prehľadový panel');
});

test('complete Slovak catalog covers canonical messages and preserves runtime content',()=>{
 const coverage=languageCoverage('sk-SK');
 assert.equal(coverage.translatedEntries,Object.keys(en).length);
 assert.equal(coverage.totalEntries,Object.keys(en).length);
 assert.equal(coverage.complete,true);
 assert.equal(translate('sk-SK','/etc/nginx/nginx.conf'),'/etc/nginx/nginx.conf');
 assert.equal(translate('sk-SK','unknown-runtime-message'),'unknown-runtime-message');
 assert.deepEqual(Object.keys(sk),Object.keys(en));
 for(const [key,value] of Object.entries(sk)){
  assert(Object.hasOwn(en,key));assert(value.trim());assert(!/[가-힣]/.test(value));
  assert.deepEqual((value.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort(),(en[key].match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort());
  assert.equal(value.split('\n').length,en[key].split('\n').length);
 }
});
