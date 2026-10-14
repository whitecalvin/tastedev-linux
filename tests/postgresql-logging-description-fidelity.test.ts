import test from 'node:test';
import assert from 'node:assert/strict';
import {postgresqlSettingDescription} from '../lib/postgresql-setting-description.ts';
import {languageCoverageSummary} from '../lib/i18n.ts';

test('every provided translated logging collector explanation identifies all three captured streams',()=>{
 for(const language of Object.keys(languageCoverageSummary())){
  const description=postgresqlSettingDescription('logging_collector',language);
  assert(description.translated,language);
  const text=description.paragraphs.join(' ');
  const streams=language==='ja'?['標準エラー出力','CSVログ','JSONログ']:['stderr','csvlog','jsonlog'];
  for(const stream of streams)assert(text.includes(stream),language+': missing '+stream);
 }
});

test('corrected logging collector descriptions identify a subprocess rather than generic logging',()=>{
 const words={ar:'عملية فرعية',fr:'sous-processus',pt:'subprocesso',zh:'子进程'};
 for(const [language,word] of Object.entries(words))assert(postgresqlSettingDescription('logging_collector',language).paragraphs.join(' ').includes(word),language);
});
