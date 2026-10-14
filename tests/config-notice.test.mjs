import test from 'node:test';
import assert from 'node:assert/strict';
import {configNotice} from '../lib/config-notice.ts';
import {translate} from '../lib/i18n.ts';
test('configuration diagnostics translate their explanation without changing literal paths',()=>{
 const path='/etc/postgresql/18/main/pg_hba.conf',reason='설정 파일을 안전하게 읽을 수 없습니다.';
 for(const locale of ['en','ja','ar','ru','fr','de','es','zh','pt']){
  const t=text=>translate(locale,text);
  assert.equal(configNotice(path+': '+reason,t),path+': '+t(reason));
  assert.notEqual(t(reason),reason);
  const unusual='/tmp/설정: {name}.conf';
  assert.equal(configNotice(unusual+': '+reason+' · '+path+': '+reason,t),unusual+': '+t(reason)+' · '+path+': '+t(reason));
  assert.equal(configNotice('설정 파일: ENOENT',t),'설정 파일: ENOENT');
 }
 assert.equal(configNotice(null,text=>text),null);
});
test('known complete diagnostics preserve colons and separator-like text in operating error details',()=>{
 for(const locale of ['en','ja','ar','ru','fr','de','es','zh','pt','it','tr','uk']){
  const t=text=>translate(locale,text);
  for(const detail of ['/tmp/$&/file: EACCES','private · path: EACCES','line one\nline two: error']){
   const raw='운영 설정을 조회할 수 없습니다. '+detail;
   assert.equal(configNotice(raw,t),t(raw));
   assert(configNotice(raw,t).endsWith(detail));
   assert.equal(configNotice(raw,text=>text),raw);
  }
  const raw='운영 설정을 조회할 수 없습니다. ENOENT · 인증서 디렉토리가 없습니다.';
  const exact=text=>text===raw?'Exact translated composite':t(text);
  assert.equal(configNotice(raw,exact),'Exact translated composite');
 }
});
