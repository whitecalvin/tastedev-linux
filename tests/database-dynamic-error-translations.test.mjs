import test from 'node:test';
import assert from 'node:assert/strict';
import {databaseConfigProfile} from '../lib/database-config-profile.ts';
import {translate,languageCatalog} from '../lib/i18n.ts';
import {translateWithCatalog} from '../lib/i18n-core.ts';

const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
const rangeKey='{label}: {min}~{max} 범위의 정수를 입력하세요.',choiceKey='{label} 값을 확인하세요.';
const ranges=[
 ['postgresql','port','포트',1,65535],['postgresql','connections','최대 연결 수',1,10000],
 ['postgresql','sharedBuffers','공유 버퍼',16,65536],['postgresql','workMem','작업 메모리',1,4096],
 ['mariadb','bufferPool','InnoDB 버퍼 풀',16,65536],['mariadb','slowSeconds','느린 쿼리 기준',1,3600],
 ['redis','maxMemory','Redis 메모리',0,65536],
];
const choices=[
 ['mariadb','charset','문자셋','invalid'],['redis','eviction','제거 정책','invalid'],['redis','fsync','AOF 동기화','invalid'],
 ['postgresql','logging','로그 파일 수집','true'],['mariadb','slowLog','느린 쿼리 로그','false'],['redis','appendOnly','AOF 지속성',1],
];
test('real database validation errors translate their label and preserve exact allowed bounds',()=>{
 for(const [kind,field,label,min,max] of ranges){
  assert.throws(()=>databaseConfigProfile(kind,{[field]:max+1}),error=>{
   assert.equal(error.status,400);assert.equal(error.message,`${label}: ${min}~${max} 범위의 정수를 입력하세요.`);
   assert.equal(translate('ko',error.message),error.message);
   for(const locale of locales){const catalog=languageCatalog(locale),expected=catalog[rangeKey].replace('{label}',()=>catalog[label]).replace('{min}',()=>String(min)).replace('{max}',()=>String(max));
    assert(Object.hasOwn(catalog,rangeKey));assert(Object.hasOwn(catalog,label));assert.equal(translate(locale,error.message),expected);assert(!/[가-힣]/.test(expected));assert(expected.includes(String(min)));assert(expected.includes(String(max)));
   }
   return true;
  });
 }
});
test('real choice and boolean validation errors translate across all registered catalogs',()=>{
 for(const [kind,field,label,value] of choices){
  assert.throws(()=>databaseConfigProfile(kind,{[field]:value}),error=>{
   assert.equal(error.status,400);assert.equal(error.message,label+' 값을 확인하세요.');
   for(const locale of locales){const catalog=languageCatalog(locale);assert.equal(translate(locale,error.message),catalog[choiceKey].replace('{label}',()=>catalog[label]));assert(!/[가-힣]/.test(translate(locale,error.message)));}
   return true;
  });
 }
});
test('unknown labels and altered ranges or technical output are left unchanged',()=>{
 const messages=['다른 항목: 1~65535 범위의 정수를 입력하세요.','포트: 0~65535 범위의 정수를 입력하세요.','포트: 1~99999 범위의 정수를 입력하세요.','포트 값을 확인하세요.','stderr /tmp/private: 문자셋 값을 확인하세요.','문자셋 값을 확인하세요.\nraw-output'];
 for(const message of messages)for(const locale of locales)assert.equal(translate(locale,message),message);
});
test('known request wrappers translate bounded dynamic details and preserve arbitrary stderr',()=>{
 const wrappers=[['요청 처리 실패: ','요청 처리 실패: {detail}'],['관리 명령 실패. 전용 helper와 NOPASSWD 권한을 확인하세요. ','관리 명령 실패. 전용 helper와 NOPASSWD 권한을 확인하세요. {detail}']];
 for(const locale of locales)for(const [prefix,key] of wrappers){
  const catalog=languageCatalog(locale),detail='포트: 1~65535 범위의 정수를 입력하세요.';
  assert.equal(translate(locale,prefix+detail),catalog[key].replace('{detail}',()=>translate(locale,detail)));
  const raw='/tmp/custom: 포트: 1~65535 범위의 정수를 입력하세요. $&';
  assert.equal(translate(locale,prefix+raw),catalog[key].replace('{detail}',()=>raw));
 }
});
test('English fallback, whitespace and replacement metacharacters remain safe',()=>{
 const english=languageCatalog('en'),message='  포트: 1~65535 범위의 정수를 입력하세요.  ';
 assert.equal(translateWithCatalog('aa',message,null,{},english),'  Port: enter an integer from 1 to 65535.  ');
 const catalog={[rangeKey]:'{label}: {min} to {max}',포트:'Port $& $` $\''};
 assert.equal(translateWithCatalog('fr',message,null,catalog,english),'  Port $& $` $\': 1 to 65535  ');
 const exact={'문자셋 값을 확인하세요.':'Explicit override'};
 assert.equal(translateWithCatalog('fr','문자셋 값을 확인하세요.',null,exact,english),'Explicit override');
});
