import test from 'node:test';
import assert from 'node:assert/strict';
import {nodeConfigProfile} from '../lib/node-config-profile.ts';
import {configProfile} from '../lib/config-profiles.ts';
import {patchNodeEnv} from '../lib/node-env-patch.ts';
import {translate,languageCatalog} from '../lib/i18n.ts';
const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
const rangeKey='{label}: {min}~{max} 범위의 정수를 입력하세요.',choiceKey='{label} 값을 확인하세요.';
test('Node profile memory and choice errors are rendered in every native language',()=>{
 const cases=[
  [{memory:63},'Node 메모리: 64~65536 범위의 정수를 입력하세요.','Node 메모리',true],
  [{environment:'invalid'},'실행 환경 값을 확인하세요.','실행 환경'],
  [{host:'remote.invalid'},'앱 수신 주소 값을 확인하세요.','앱 수신 주소'],
  [{logLevel:'invalid'},'로그 수준 값을 확인하세요.','로그 수준'],
 ];
 for(const [input,message,label,range] of cases)for(const producer of [nodeConfigProfile,value=>configProfile('nodejs',value)]){
  assert.throws(()=>producer(input),error=>{
   assert.equal(error.status,400);assert.equal(error.message,message);assert.equal(translate('ko',message),message);
   for(const locale of locales){const catalog=languageCatalog(locale);let expected=catalog[range?rangeKey:choiceKey].replace('{label}',()=>catalog[label]);if(range)expected=expected.replace('{min}','64').replace('{max}','65536');assert.equal(translate(locale,message),expected);assert(!/[가-힣]/.test(expected));
    const wrapper='요청 처리 실패: '+message;assert.equal(translate(locale,wrapper),catalog['요청 처리 실패: {detail}'].replace('{detail}',()=>expected));
   }
   return true;
  });
 }
});
test('Certbot shared form operation and boolean guards also translate their selected field',()=>{
 for(const [field,value,label] of [['operation','invalid','작업'],['staging','true','테스트 인증서 사용'],['installNginx',1,'발급 후 nginx HTTPS 자동 연계']]){
  assert.throws(()=>configProfile('certbot',{[field]:value}),error=>{
   const message=label+' 값을 확인하세요.';assert.equal(error.status,400);assert.equal(error.message,message);
   for(const locale of locales){const catalog=languageCatalog(locale);assert.equal(translate(locale,message),catalog[choiceKey].replace('{label}',()=>catalog[label]));}
   return true;
  });
 }
});
test('Node env patch rejects unsupported keys and oversized UTF-8 without exposing source values',()=>{
 const cases=[['TOKEN=private-fixture\n',{unknown:true},'지원하는 Node.js 환경 항목을 선택하세요.'],['#'+'a'.repeat(262143),{port:3000},'환경 파일은 최대 256KB까지 저장할 수 있습니다.'],['#'+'한'.repeat(87380),{port:3000},'환경 파일은 최대 256KB까지 저장할 수 있습니다.']];
 for(const [source,changes,message] of cases)assert.throws(()=>patchNodeEnv(source,changes),error=>{
  assert.equal(error.status,400);assert.equal(error.message,message);assert(!error.message.includes('private-fixture'));
  for(const locale of locales){const catalog=languageCatalog(locale);assert(Object.hasOwn(catalog,message));assert.equal(translate(locale,message),catalog[message]);assert(!/[가-힣]/.test(catalog[message]));}
  return true;
 });
 const original='TOKEN=private-fixture\nPORT=3000\n';assert.equal(patchNodeEnv(original,{port:3001}),'TOKEN=private-fixture\nPORT=3001\n');
});
test('unexpected Node memory ranges and arbitrary technical text are left intact',()=>{
 for(const message of ['Node 메모리: 64~65535 범위의 정수를 입력하세요.','/tmp/app: 로그 수준 값을 확인하세요.','알 수 없는 값 값을 확인하세요.'])for(const locale of locales)assert.equal(translate(locale,message),message);
});
