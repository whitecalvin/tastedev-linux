import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {loadBindings,parse,transform} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';import {translate,languageCatalog} from '../lib/i18n.ts';
import {redisRecoveryPlan,recoverRedisConfiguration} from '../lib/redis-recovery.ts';import {mariaDBRecoveryPlan,recoverMariaDBConfiguration} from '../lib/mariadb-recovery.ts';
const native=createRequire(import.meta.url),locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
const phrases=['{product} 복구 검수와 서비스 실행 기능이 필요합니다.','{product} 복구 검토 이후 설정·백업 또는 서비스가 변경되었습니다. 다시 검토하세요.','{product} 복구 검토가 만료되었습니다. 중단 작업을 다시 조회하세요.','{product} 복구 대상 서비스 조회 기능이 필요합니다.','{product} 복구 중 대상 설정·백업 또는 서비스가 변경되었습니다. 다시 조회하세요.'];
const localized=(error,status)=>{assert.equal(error.status,status);for(const locale of locales){assert.notEqual(translate(locale,error.message),error.message);assert(!/[가-힣]/.test(translate(locale,error.message)));}return true;};
const maria={root:'/etc/mysql/my.cnf',target:'/etc/mysql/my.cnf'},confirmation={confirm:true,reviewVersion:'a'.repeat(64)};
test('all Redis and MariaDB static recovery diagnostics exist in every native catalog',async()=>{
 await loadBindings();for(const [product,file] of [['Redis','redis-recovery'],['MariaDB','mariadb-recovery']]){const {literals}=diagnosticCandidates(await parse(await readFile(new URL('../lib/'+file+'.ts',import.meta.url),'utf8'),{filename:file+'.ts',syntax:'typescript'}));assert.equal(literals.length,product==='Redis'?14:13);for(const phrase of phrases)assert(literals.includes(phrase.replace('{product}',product)));for(const key of literals){for(const locale of locales){const catalog=languageCatalog(locale);assert(Object.hasOwn(catalog,key));assert.equal(translate(locale,key),catalog[key]);assert(catalog[key].includes(product));assert(!/[가-힣]/.test(catalog[key]));}}}
});
test('missing recovery dependencies fail before filesystem or service activity',async()=>{
 await assert.rejects(redisRecoveryPlan(),error=>localized(error,400));await assert.rejects(mariaDBRecoveryPlan(maria),error=>localized(error,400));await assert.rejects(recoverRedisConfiguration(confirmation),error=>localized(error,400));await assert.rejects(recoverMariaDBConfiguration({...maria,...confirmation}),error=>localized(error,400));
});
test('expired recovery review releases its lease without calling restore or service hooks',async()=>{
 await loadBindings();for(const [product,file,method,input] of [['Redis','redis-recovery','recoverRedisConfiguration',confirmation],['MariaDB','mariadb-recovery','recoverMariaDBConfiguration',{...maria,...confirmation}]]){
  let acquired=0,released=0,operations=0;const forbidden=()=>{operations++;throw Error('must not execute');};
  const mocks={'./config-journal.ts':{readConfigJournal:async()=>null},'./config-operation-lease.ts':{acquireConfigOperationLease:async()=>{acquired++;return async()=>{released++;};}}};
  const {code}=await transform(await readFile(new URL('../lib/'+file+'.ts',import.meta.url),'utf8'),{filename:file+'.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});const module={exports:{}};new Function('require','module','exports',code)(name=>mocks[name]??(name.startsWith('.')?{}:native(name)),module,module.exports);
  await assert.rejects(module.exports[method](input,{inspectService:forbidden,validatePrepared:forbidden,recover:forbidden,run:forbidden}),error=>{assert.equal(error.message,product+' 복구 검토가 만료되었습니다. 중단 작업을 다시 조회하세요.');return localized(error,409);});assert.equal(acquired,1);assert.equal(released,1);assert.equal(operations,0);
 }
});
