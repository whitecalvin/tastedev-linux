import test from 'node:test';
import assert from 'node:assert/strict';
import {translate,languageCatalog,languageCoverage,languageCoverageSummary} from '../lib/i18n.ts';
import {terminalFeatureMessage} from '../lib/capabilities.ts';
const reviewed=Object.keys(languageCoverageSummary()).filter(locale=>locale!=='ko');

test('reviewed dynamic service status labels distinguish runtime-only state and manual startup',()=>{
 for(const locale of reviewed){
  const catalog=languageCatalog(locale);
  for(const key of ['자동 시작','자동 시작 (이번 부팅)','수동 시작','차단됨','차단됨 (이번 부팅)','연결됨','연결됨 (이번 부팅)'])assert(Object.hasOwn(catalog,key),locale+': '+key);
  assert.notEqual(translate(locale,'자동 시작'),translate(locale,'자동 시작 (이번 부팅)'),locale);
  assert.notEqual(translate(locale,'차단됨'),translate(locale,'차단됨 (이번 부팅)'),locale);
  assert.notEqual(translate(locale,'연결됨'),translate(locale,'연결됨 (이번 부팅)'),locale);
  assert.notEqual(translate(locale,'자동 시작'),translate(locale,'수동 시작'),locale);
 }
});

test('reviewed terminal server-gate help preserves environment path, enablement value and restart warning',()=>{
 const gate=terminalFeatureMessage({settings:{readOnly:true,terminal:true},available:{terminal:false}});
 for(const locale of reviewed){
  assert(Object.hasOwn(languageCatalog(locale),gate),locale);
  const text=translate(locale,gate);
  for(const token of ['/etc/tastedev-linux/environment','LINUX_ENABLE_TERMINAL=true','tastedev-linux'])assert(text.includes(token),locale+': '+token);
  assert(!/[가-힣]/.test(text),locale);
 }
 assert.equal(terminalFeatureMessage({settings:{readOnly:true,terminal:true},available:{terminal:true}}),'','read-only banner must not produce a redundant terminal warning');
});

test('reviewed security groups are localized and runtime inventory coverage is complete',()=>{
 for(const locale of reviewed){
  const catalog=languageCatalog(locale);
  for(const key of ['기본 정책','조회 전용 여부와 작업 기록을 설정합니다.','서버에서 사용할 관리 기능을 선택합니다.','관리자 권한','sudo 실행 방식과 전용 helper 정책을 설정합니다.']){
   assert(Object.hasOwn(catalog,key),locale+': '+key);assert(!/[가-힣]/.test(translate(locale,key)),locale+': '+key);
  }
  assert(languageCoverage(locale).complete,locale);
 }
});

test('Korean runtime copy remains the native source without requiring a translation catalog',()=>{
 for(const key of ['자동 시작','자동 시작 (이번 부팅)','수동 시작','기본 정책','관리자 권한'])assert.equal(translate('ko',key),key);
 const gate=terminalFeatureMessage({settings:{readOnly:true,terminal:true},available:{terminal:false}});assert.equal(translate('ko',gate),gate);assert(languageCoverage('ko').complete);
});
