import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../lib/locales/en.json' with {type:'json'};
import id from '../lib/locales/id.json' with {type:'json'};
import {resolveLocale,translate,languageCatalog,languageCoverage,languageCoverageSummary,localeFlag} from '../lib/i18n.ts';
import {loadLanguageCatalog} from '../lib/i18n-client.ts';
import {initialLanguage,languageCookie,languageDirection} from '../lib/language-preference.ts';

test('Indonesian Linux locale shares its native catalog between server and lazy client',async()=>{
 assert.equal(resolveLocale('id_ID.UTF-8'),'id-ID');
 assert.equal(localeFlag('id-ID'),'🇮🇩');
 assert.deepEqual(initialLanguage('id-ID','ko'),{locale:'id-ID',persisted:true});
 assert.equal(initialLanguage(null,'ko;q=0.2,id-ID;q=0.9').locale,'id-ID');
 assert.equal(languageDirection('id-ID'),'ltr');
 assert(languageCookie('id_ID').startsWith('linux-language=id-ID;'));
 assert.deepEqual(await loadLanguageCatalog('id-ID'),languageCatalog('id-ID'));
 for(const locale of ['id','id-ID']){
  assert.equal(translate(locale,'관리자 로그인'),'Masuk administrator');
  assert.equal(translate(locale,'설치된 패키지'),'Paket terpasang');
  assert.equal(translate(locale,'왼쪽 노드를 선택하세요.'),'Pilih simpul di sebelah kiri.');
 }
});

test('Indonesian covers every canonical message and preserves placeholders and unknown content',()=>{
 const coverage=languageCoverage('id-ID');
 assert.equal(coverage.translatedEntries,Object.keys(id).length);
 assert.equal(coverage.totalEntries,Object.keys(en).length);
 assert.equal(coverage.complete,true);
 assert.deepEqual(languageCoverageSummary().id,coverage);
 assert.deepEqual(Object.keys(id).sort(),Object.keys(en).sort());
 assert.equal(translate('id-ID','Unregistered runtime content'),'Unregistered runtime content');
 assert.equal(translate('id-ID','/etc/nginx/nginx.conf'),'/etc/nginx/nginx.conf');
 for(const [key,value] of Object.entries(id)){
  assert(Object.hasOwn(en,key),key);assert(value.trim());assert(!/[가-힣]/.test(value),key);
  assert.deepEqual((value.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort(),(en[key].match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)||[]).sort(),key);
 }
 const warning=translate('id-ID','패키지와 의존성을 설치하며, 패키지 기본 동작에 따라 서비스가 시작될 수 있습니다. 이미 설치된 선택 패키지는 업그레이드하지 않습니다. 인증서 발급과 nginx 설정은 포함하지 않습니다.');
 for(const phrase of ['Layanan dapat dimulai','tidak akan ditingkatkan','konfigurasi nginx tidak termasuk'])assert(warning.includes(phrase));
});
