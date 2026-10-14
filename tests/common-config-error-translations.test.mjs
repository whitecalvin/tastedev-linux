import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,symlink,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {loadBindings,parse} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';
import {translate,languageCatalog} from '../lib/i18n.ts';
import {configProfile} from '../lib/config-profiles.ts';
import {databaseConfigProfile} from '../lib/database-config-profile.ts';
import {parseLiveConfig,readLiveConfig} from '../lib/config-live.ts';
import {basicCronSchedule} from '../lib/cron-basic-schedule.ts';
import {parseMariaDBSettings} from '../lib/mariadb-settings-text.ts';
import {parsePostgresqlSettings} from '../lib/postgresql-settings-text.ts';
import {parseRedisSettings} from '../lib/redis-settings-text.ts';
const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
function localized(error,message,status){
 assert.equal(error.message,message);if(status!==undefined)assert.equal(error.status,status);
 for(const locale of locales){const catalog=languageCatalog(locale);assert(Object.hasOwn(catalog,message));assert.equal(translate(locale,message),catalog[message]);assert(!/[가-힣]/.test(catalog[message]));}
 return true;
}
test('all static diagnostics in shared config and schedule modules have native entries',async()=>{
 await loadBindings();
 for(const file of ['config-live','config-profiles','config-value-parser','database-config-profile','cron-basic-schedule','mariadb-settings-text','postgresql-settings-text','redis-settings-text']){
  const extension='.ts';const {literals}=diagnosticCandidates(await parse(await readFile(new URL('../lib/'+file+extension,import.meta.url),'utf8'),{filename:file+extension,...(extension==='.ts'?{syntax:'typescript'}:{})}));
  assert(literals.length);for(const message of literals)localized(Error(message),message);
 }
});
test('three settings editors reject invalid content and enforce the actual UTF-8 size limit',()=>{
 for(const parseSettings of [parseMariaDBSettings,parsePostgresqlSettings,parseRedisSettings]){
  for(const text of [null,'port=1\0','port=1\rnext'])assert.throws(()=>parseSettings(text),error=>localized(error,'설정 파일 내용을 확인하세요.'));
  assert.throws(()=>parseSettings('#'+'a'.repeat(262144)),error=>localized(error,'설정 파일은 256 KiB 이하만 편집할 수 있습니다.'));
  assert.throws(()=>parseSettings('#'+'한'.repeat(87382)),error=>localized(error,'설정 파일은 256 KiB 이하만 편집할 수 있습니다.'));
  assert.doesNotThrow(()=>parseSettings('#'+'a'.repeat(262143)));
 }
 for(const locale of locales)assert(translate(locale,'설정 파일은 256 KiB 이하만 편집할 수 있습니다.').includes('256 KiB'));
});
test('unsupported packages and invalid cron entries return the corresponding localized diagnostic',()=>{
 assert.throws(()=>configProfile('unknown',{}),error=>localized(error,'지원하는 패키지를 선택하세요.',400));
 assert.throws(()=>databaseConfigProfile('unknown',{}),error=>localized(error,'지원하는 데이터베이스를 선택하세요.',400));
 assert.throws(()=>parseLiveConfig('unknown',''),error=>localized(error,'운영 설정 조회를 지원하는 패키지를 선택하세요.',400));
 assert.throws(()=>basicCronSchedule({kind:'unknown',hour:0,minute:0}),error=>localized(error,'예약 반복 유형을 선택하세요.'));
 for(const input of [{kind:'daily',hour:24,minute:0},{kind:'daily',hour:0,minute:60},{kind:'weekly',hour:0,minute:0,day:7},{kind:'monthly',hour:0,minute:0,day:32}])assert.throws(()=>basicCronSchedule(input),error=>localized(error,'예약 시간 범위를 확인하세요.'));
});
test('operating config reads reject arbitrary paths and symlinks without touching fixture contents',async()=>{
 await assert.rejects(readLiveConfig('redis','/etc/passwd'),error=>localized(error,'허용된 운영 설정 파일을 선택하세요.',400));
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','config-error-guidance-'));
 try{
  await mkdir(path.join(root,'redis'));const original=path.join(root,'original'),bytes=Buffer.from('requirepass fixture-private\n');await writeFile(original,bytes);await symlink(original,path.join(root,'redis/redis.conf'));
  await assert.rejects(readLiveConfig('redis','/etc/redis/redis.conf',root),error=>localized(error,'설정 파일의 심볼릭 링크는 지원하지 않습니다.',400));assert.deepEqual(await readFile(original),bytes);
 }finally{await rm(root,{recursive:true,force:true});}
});
