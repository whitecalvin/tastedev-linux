import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRedisSettings} from '../lib/redis-settings-text.ts';
import {parseMariaDBSettings} from '../lib/mariadb-settings-text.ts';
import {parsePostgresqlSettings} from '../lib/postgresql-settings-text.ts';

for(const [name,parse] of Object.entries({Redis:parseRedisSettings,MariaDB:parseMariaDBSettings,PostgreSQL:parsePostgresqlSettings})){
 test(`${name} 설정 파일 오류를 한국어로 구분하고 UTF-8 크기 제한을 지킨다`,()=>{
  for(const text of [null,{},'port\0 6379','port 6379\r'])assert.throws(()=>parse(text),{message:'설정 파일 내용을 확인하세요.'});
  const maximum='#'+ '가'.repeat(87381);
  assert.equal(new TextEncoder().encode(maximum).length,262144);
  assert.doesNotThrow(()=>parse(maximum));
  for(const text of [maximum+'a','가'.repeat(87382)])assert.throws(()=>parse(text),{message:'설정 파일은 256 KiB 이하만 편집할 수 있습니다.'});
 });
}
