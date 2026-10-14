import test from 'node:test';
import assert from 'node:assert/strict';
import descriptions from '../lib/locales/postgresql-descriptions.json' with {type:'json'};
import {postgresqlSettingDescription as describe} from '../lib/postgresql-setting-description.ts';

test('PostgreSQL common setting explanations follow every translated UI language and regional locale',()=>{
 for(const locale of ['ko-KR','en-US','ja-JP','zh-CN','es-ES','fr-FR','de-DE','ru-RU','pt-BR','ar-SA']){
  for(const name of ['listen_addresses','port','max_connections','shared_buffers','work_mem','logging_collector','log_directory']){
   const value=describe(name,locale);
   assert.equal(value.translated,true,`${locale}: ${name}`);
   assert.equal(value.language,locale.split('-')[0]);
   assert(value.paragraphs.every(text=>typeof text==='string'&&text.length>0));
  }
 }
 assert.notDeepEqual(describe('work_mem','ko').paragraphs,describe('work_mem','ja').paragraphs);
});

test('All imported parameters have Korean descriptions; unknown extensions and translation gaps are explicit',()=>{
 assert.equal(Object.keys(descriptions.en).length,348);
 for(const name of Object.keys(descriptions.en))assert(describe(name,'ko').translated,name);
 const unavailable=describe('custom.feature','ja');
 assert.deepEqual(unavailable.paragraphs,[]);
 assert.equal(unavailable.translated,false);
 assert.match(unavailable.unavailable,/説明/);
 const gap=describe('io_workers','is-IS');
 assert.equal(gap.translated,false);
 assert.equal(gap.language,'en');
 assert.match(gap.fallbackLabel,/English/);
 for(const name of ['constructor','__proto__','toString'])assert.deepEqual(describe(name,'ko').paragraphs,[]);
});

test('Include directives have descriptions in all UI languages, including English fallback for other locales',()=>{
 for(const locale of ['ko','en','ja','zh','es','fr','de','ru','pt','ar']){
  for(const name of ['include','include_if_exists','include_dir']){
   {const value=describe(name,locale);assert(value.translated,`${locale}: ${name}`);if(locale==='ka-GE')assert(value.paragraphs.every(text=>/[\u10a0-\u10ff]/.test(text)),name);}
   assert(describe(name,locale).paragraphs.length>0);
  }
 }
 assert.deepEqual(describe('PORT','ko').paragraphs,describe('port','ko').paragraphs);
 assert(describe('datestyle','ko').translated);
 assert.deepEqual(describe('datestyle','ko').paragraphs,describe('DateStyle','ko').paragraphs);
 assert.deepEqual(describe('timezone','ko').paragraphs,describe('TimeZone','ko').paragraphs);
 assert.equal(describe('include','is-IS').language,'en');
 assert(describe('include','is-IS').paragraphs.length>0);
});

test('Every translated UI language covers the full imported parameter set',()=>{
 for(const locale of ['ko-KR','en-US','ja-JP','de-DE','ru-RU','fr-FR','es-ES','zh-CN','pt-BR','ar-SA'])
  for(const name of Object.keys(descriptions.en)){const value=describe(name,locale);assert(value.translated,`${locale}: ${name}`);if(locale==='ka-GE')assert(value.paragraphs.every(text=>/[\u10a0-\u10ff]/.test(text)),name);}
});

test('Arabic recovery, WAL, vacuum and TLS settings have local descriptions',()=>{
 const scope=/^(archive_|autovacuum_|ssl_|vacuum_|wal_|recovery_|hot_standby|primary_|synchronous_|max_wal_senders)/;
 for(const name of Object.keys(descriptions.en).filter(name=>scope.test(name))){
  const value=describe(name,'ar-SA');
  assert(value.translated,name);
  assert.equal(value.language,'ar');
  assert(value.paragraphs.every(text=>/[\u0600-\u06ff]/.test(text)),name);
 }
});

test('Additional upstream languages select local paragraphs and honestly label untranslated settings',()=>{
 for(const locale of ['id-ID','it-IT','ka-GE','pl-PL','sv-SE','tr-TR','uk-UA']){
  const language=locale.split('-')[0];
  for(const [name,paragraphs] of Object.entries(descriptions[language])){
   const result=describe(name,locale);
   assert.equal(result.translated,true,`${locale}: ${name}`);
   assert.equal(result.language,language);
   assert(result.paragraphs.length>0);
   assert(paragraphs.every(text=>typeof text==='string'&&text.trim().length>0));
  }
  for(const name of ['include','include_if_exists','include_dir'])assert(describe(name,locale).translated);
  assert.notEqual(describe('unknown.extension',locale).unavailable,describe('unknown.extension','en').unavailable);
  const missing=Object.keys(descriptions.en).find(name=>!describe(name,locale).translated);
  if(missing){
   const result=describe(missing,locale);
   assert.equal(result.language,'en');
   assert.deepEqual(result.paragraphs,describe(missing,'en').paragraphs);
   assert.notEqual(result.fallbackLabel,describe(missing,'en').fallbackLabel);
  }
 }
 for(const locale of ['sv-SE','uk-UA','it-IT','pl-PL','tr-TR','id-ID','ka-GE'])
  for(const name of Object.keys(descriptions.en)){const value=describe(name,locale);assert(value.translated,`${locale}: ${name}`);if(locale==='ka-GE')assert(value.paragraphs.every(text=>/[\u10a0-\u10ff]/.test(text)),name);}
});

test('Row-security help distinguishes query failure from bypass, including roles exempt from policies',()=>{
 for(const locale of ['ko','en','ja','zh','es','fr','de','ru','pt','ar','id','it','ka','pl','sv','tr','uk']){
  const value=describe('row_security',locale);
  assert.equal(value.language,locale);
  const text=value.paragraphs.join(' ');
  for(const keyword of ['on','off','BYPASSRLS'])assert(text.includes(keyword),locale+': '+keyword);
 }
 assert.match(describe('row_security','en').paragraphs.join(' '),/queries.*fail.*does not grant unrestricted row access/);
 assert.match(describe('transaction_timeout','it').paragraphs.join(' '),/transazioni preparate.*0/);
 assert.match(describe('max_locks_per_transaction','it').paragraphs.join(' '),/Non è un limite rigido/);
 assert.match(describe('log_min_duration_sample','it').paragraphs.join(' '),/-1.*0/);
 assert.match(describe('max_locks_per_transaction','pl').paragraphs.join(' '),/Nie jest to sztywny limit/);
 assert.match(describe('transaction_timeout','pl').paragraphs.join(' '),/transakcji przygotowanych.*0/);
 assert.match(describe('log_min_duration_sample','pl').paragraphs.join(' '),/-1.*0/);
});
