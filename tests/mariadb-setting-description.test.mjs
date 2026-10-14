import test from 'node:test';
import assert from 'node:assert/strict';
import {mariadbKoreanHelpNames,mariadbSettingSuggestionNames,mariadbSettingDescription as describe} from '../lib/mariadb-setting-description.ts';
test('MariaDB Korean descriptions recognize option aliases and only server groups',()=>{
 assert.equal(mariadbKoreanHelpNames.length,67);
 for(const name of mariadbKoreanHelpNames){const result=describe(name,'ko-KR','mysqld');assert.equal(result.language,'ko');assert(result.translated);assert.match(result.paragraphs[0],/[가-힣]/);assert.deepEqual(describe(name.replaceAll('_','-')),describe(name));}
 for(const group of ['server','mysqld','mariadb','mariadbd','mariadb-11.8','mysqld-10.11'])assert(describe('port','ko',group));
 for(const group of ['client','mysql','mariadb-client','client-server','custom',null])assert.equal(describe('port','ko',group),null);
 for(const name of ['plugin_custom','constructor','__proto__',null])assert.equal(describe(name),null);
 assert.equal(describe('port','en'),null);
 assert.deepEqual(describe('BIND-ADDRESS'),describe('bind_address'));
 assert.match(describe('skip-networking').paragraphs[0],/TCP.*Unix 소켓.*별도로/);
 assert.match(describe('character-set-server').paragraphs[0],/기존 테이블.*변환하지/);
 assert.match(describe('innodb-file-per-table').paragraphs[0],/새 InnoDB/);
});
test('MariaDB operational help distinguishes security, units, exceptions and deprecated suggestions',()=>{
 assert.match(describe('require_secure_transport').paragraphs[0],/TLS.*Unix 소켓/);
 assert.match(describe('read_only').paragraphs[0],/READ ONLY ADMIN/);
 assert.match(describe('binlog_expire_logs_seconds').paragraphs[0],/초/);
 assert.match(describe('expire_logs_days').paragraphs[0],/일/);
 assert.match(describe('ssl_key').paragraphs[0],/키 내용 대신 파일 경로/);
 assert.match(describe('tmp_table_size').paragraphs[0],/max_heap_table_size/);
 assert.match(describe('default_storage_engine').paragraphs[0],/기존 테이블.*변경하지/);
 assert.match(describe('innodb_flush_method').paragraphs[0],/11\.0.*폐기/);
 assert(!mariadbSettingSuggestionNames.includes('innodb_flush_method'));
 assert(mariadbSettingSuggestionNames.includes('innodb_data_file_buffering'));
});
