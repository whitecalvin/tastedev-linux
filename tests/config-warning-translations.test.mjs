import test from 'node:test';
import assert from 'node:assert/strict';
import {parseLiveConfig} from '../lib/config-value-parser.ts';
import {translate,languageCatalog} from '../lib/i18n.ts';
import {translateWithCatalog} from '../lib/i18n-core.ts';
const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
test('actual configuration parser warnings translate their explanation while preserving field identifiers',()=>{
 for(const [kind,text] of [['postgresql','shared_buffers = invalid'],['mariadb','[mysqld]\nmax_connections=invalid'],['redis','maxmemory invalid']]){
  const parsed=parseLiveConfig(kind,text);assert.equal(parsed.warnings.length,1);
  for(const locale of locales){const raw=parsed.warnings[0],key=raw.split(': ')[0];assert.equal(translate(locale,raw),key+': '+languageCatalog(locale)['GUI에서 지원하는 값으로 읽을 수 없습니다.']);assert.equal(translate('ko',raw),raw);}
 }
});
test('configuration paths and operating error details remain intact; unrelated paths/text are never rewritten',()=>{
 const paths=['/etc/mysql/conf.d','/etc/mysql/mariadb.conf.d/custom.cnf','/etc/postgresql/18/main-test/pg_hba.conf','/etc/redis/redis.conf'];
 for(const locale of locales){const catalog=languageCatalog(locale);
  for(const target of paths)for(const reason of ['설정 목록을 읽을 수 없습니다.','설정 파일을 안전하게 읽을 수 없습니다.']){
   const raw='  '+target+': '+reason+'\n';assert.equal(translate(locale,raw),'  '+target+': '+catalog[reason]+'\n');assert.equal(translate('ko',raw),raw);
  }
  for(const detail of ['EACCES','/tmp/$&/literal','unknown\nprovider detail']){
   const raw='운영 설정을 조회할 수 없습니다. '+detail;assert.equal(translate(locale,raw),catalog['운영 설정을 조회할 수 없습니다. {detail}'].replace('{detail}',()=>detail));
  }
  for(const raw of ['/tmp/user.conf: 설정 파일을 안전하게 읽을 수 없습니다.','/etc/postgresql/18/../pg_hba.conf: 설정 목록을 읽을 수 없습니다.','arbitrary: GUI에서 지원하는 값으로 읽을 수 없습니다.','/etc/redis/redis.conf: private stderr'])assert.equal(translate(locale,raw),raw);
 }
 const raw='/etc/redis/redis.conf: 설정 목록을 읽을 수 없습니다.';assert.equal(translateWithCatalog('en',raw,undefined,{},{}),raw);assert.equal(translateWithCatalog('en',raw,undefined,{[raw]:'Exact override'},{}),'Exact override');
});
