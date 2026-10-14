import test from 'node:test';
import assert from 'node:assert/strict';
import {postgresqlSettingDescription as describe} from '../lib/postgresql-setting-description.ts';

test('reviewed WAL archive mode help names command and library alternatives without changing configuration',()=>{
 for(const language of ['ar','fr','id','it','pl','pt','tr','zh']){
  const result=describe('archive_mode',language);assert(result.translated,language);const text=result.paragraphs.join(' ');
  assert(text.includes('WAL')&&text.includes('archive_command')&&text.includes('archive_library'),language);
 }
});

test('existing always-mode recovery explanations remain in reviewed native help',()=>{
 const markers={ar:'الاستعادة',fr:'restauration',pt:'recuperação',zh:'恢复'};
 for(const [language,marker]of Object.entries(markers)){
  const text=describe('archive_mode',language).paragraphs.join(' ');assert(text.includes('always')&&text.includes(marker),language);
 }
});
