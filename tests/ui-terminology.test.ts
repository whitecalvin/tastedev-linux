import test from 'node:test';
import assert from 'node:assert/strict';
import {terminalFeatureMessage} from '../lib/capabilities.ts';
import {translate,languageCoverageSummary} from '../lib/i18n.ts';

test('terminal guidance names the exact security option in every supplied language',()=>{
 const message=terminalFeatureMessage({settings:{readOnly:false,terminal:false},available:{terminal:true}});
 for(const locale of Object.keys(languageCoverageSummary())){
  const option=translate(locale,'웹 터미널 명령 실행');
  assert(translate(locale,message).includes(option),locale+' must refer to the actual option label');
 }
 assert(!message.includes('터미널 사용 옵션'));
 const blocked=terminalFeatureMessage({settings:{readOnly:false,terminal:false},available:{terminal:false}});
 assert(blocked.includes('LINUX_ENABLE_TERMINAL=true'),'a server gate must describe the required server change');
 assert(!blocked.includes('옵션을 켜면'),'a GUI switch cannot override a server gate');
});

test('AI input guidance refers to the current settings link without renaming processing priority as reasoning',()=>{
 for(const locale of Object.keys(languageCoverageSummary())){
  assert(translate(locale,'AI 업체·모델·API 설정 · 설정값을 확인하세요.').includes(translate(locale,'AI 업체·모델·API 설정')),locale);
 }
});
