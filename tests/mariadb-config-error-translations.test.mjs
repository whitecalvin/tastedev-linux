import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadBindings,parse} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';
import {languageCatalog,translate} from '../lib/i18n.ts';
import {mariadbConfigHooks} from '../lib/mariadb-config-hooks.ts';

const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
const target='/etc/mysql/mariadb.conf.d/50-server.cnf';
const candidate='/etc/mysql/mariadb.conf.d/.tastedev-config-12345678-1234-1234-1234-123456789abc';
const secret='private-output-never-expose';
function localized(error,expected){
 assert.equal(error.status,400);assert.equal(error.message,expected);assert(!error.message.includes(secret));
 for(const locale of locales){const catalog=languageCatalog(locale);assert(Object.hasOwn(catalog,expected));assert.equal(translate(locale,expected),catalog[expected]);assert(!/[가-힣]/.test(catalog[expected]));assert(catalog[expected].includes('MariaDB'));}
 return true;
}
test('all MariaDB configuration hook diagnostics have direct native catalog entries',async()=>{
 await loadBindings();const ast=await parse(await readFile(new URL('../lib/mariadb-config-hooks.ts',import.meta.url),'utf8'),{filename:'mariadb-config-hooks.ts',syntax:'typescript'});
 const {literals}=diagnosticCandidates(ast);assert.equal(literals.length,13);
 for(const message of literals)localized(Object.assign(Error(message),{status:400}),message);
 const include=literals.find(value=>value.includes('include 파일'));
 for(const locale of locales)assert(languageCatalog(locale)[include].includes('include'));
});
test('invalid targets and unreviewed candidate paths fail before command execution',async()=>{
 let calls=0;const run=async()=>{calls++;return '';};
 assert.throws(()=>mariadbConfigHooks('/tmp/foreign.cnf',{port:3307},run),error=>localized(error,'MariaDB 설정 대상 파일과 변경할 항목을 확인하세요.'));assert.equal(calls,0);
 const hooks=mariadbConfigHooks(target,{port:3307},run);
 await assert.rejects(hooks.validate(candidate),error=>localized(error,'MariaDB 실행 파일의 지원 옵션을 먼저 확인하세요.'));assert.equal(calls,0);
 await hooks.preflight();const before=calls;
 await assert.rejects(hooks.validate('/tmp/foreign.cnf'),error=>localized(error,'MariaDB 후보 설정 파일의 경로를 확인하세요.'));
 await assert.rejects(hooks.validatePrepared({}),error=>localized(error,'MariaDB 후보 설정 검토가 만료되었거나 올바르지 않습니다. 다시 검토하세요.'));assert.equal(calls,before);
});
test('service and executable query failures return safe translated guidance',async()=>{
 let calls=0;const stopped=mariadbConfigHooks(target,{port:3307},async()=>{calls++;throw Error(secret);});
 await assert.rejects(stopped.preflight(),error=>localized(error,'MariaDB 서비스를 시작한 후 설정을 변경하세요.'));assert.equal(calls,1);
 const malformed=mariadbConfigHooks(target,{port:3307},async(binary)=>binary==='/usr/sbin/mariadbd'?{}:'');
 await assert.rejects(malformed.preflight(),error=>localized(error,'MariaDB 실행 파일의 지원 옵션을 확인할 수 없습니다.'));
});
test('candidate command failures and effective value mismatches never restart the service',async()=>{
 const cases=[
  ['validate','MariaDB 후보 설정 검수에 실패했습니다. 변경한 설정을 확인하세요.'],
  ['defaults','MariaDB 후보 설정의 실제 옵션을 조회하지 못했습니다. 실행 파일과 설정을 확인하세요.'],
  ['malformed','MariaDB 설정 옵션 조회 결과를 확인할 수 없습니다.'],
  ['mismatch','MariaDB 후보 설정의 실제 값이 요청한 값과 다릅니다. include 파일과 중복 설정을 확인하세요.']
 ];
 for(const [kind,message] of cases){
  const calls=[];const hooks=mariadbConfigHooks(target,{port:3307},async(binary,args)=>{
   calls.push([binary,args]);
   if(args[0]==='--no-defaults')return '--validate-config';
   if(binary==='/usr/sbin/mariadbd'&&kind==='validate')throw Error(secret);
   if(binary==='/usr/bin/my_print_defaults'){
    if(kind==='defaults')throw Error(secret);
    if(kind==='malformed')return {};
    return '--password='+secret+'\n--port=3306\n';
   }
   return '';
  });
  await hooks.preflight();await assert.rejects(hooks.validate(candidate),error=>localized(error,message));
  assert(!calls.some(([,args])=>args.includes('restart')));
 }
});
