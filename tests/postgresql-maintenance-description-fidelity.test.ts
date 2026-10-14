import test from 'node:test';
import assert from 'node:assert/strict';
import {postgresqlSettingDescription as describe} from '../lib/postgresql-setting-description.ts';

test('reviewed eager-freeze translations preserve successful-freeze reduction below full scan',()=>{
 const markers={ar:'أقل من 100',es:'inferior al 100',fr:'inférieure à 100',pt:'abaixo de 100',zh:'低于 100%'};
 for(const [language,marker]of Object.entries(markers)){
  const result=describe('vacuum_max_eager_freeze_failure_rate',language);assert(result.translated);
  const text=result.paragraphs.join(' ');assert(text.includes('0.0')&&text.includes('1.0')&&text.includes(marker),language);assert(text.includes('VACUUM'),language);
 }
});

test('reviewed maintenance concurrency translations identify the related setting and zero disable',()=>{
 for(const language of ['ar','es','fr','pt','zh']){
  const result=describe('maintenance_io_concurrency',language);assert(result.translated);assert(result.paragraphs[0].includes('effective_io_concurrency'),language);assert(result.paragraphs[1].includes('0'),language);
 }
});

test('Arabic Unix socket permission help preserves numeric octal prefix and system calls',()=>{
 const result=describe('unix_socket_permissions','ar-SA');assert(result.translated);const text=result.paragraphs.join(' ');
 assert(text.includes('chmod')&&text.includes('umask')&&text.includes('بـ0')&&text.includes('الثمانية'));
});
