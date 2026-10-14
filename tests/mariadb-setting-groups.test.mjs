import test from 'node:test';import assert from 'node:assert/strict';
import {mariadbSettingGroups} from '../lib/mariadb-setting-groups.ts';
test('MariaDB group metadata keeps first-seen order, empty groups and original names without option values',()=>{
 const source='!includedir /etc/mysql/conf.d\r\n# [comment]\r\n[client]\r\npassword=fixture-secret\r\n[mysqld]\r\n[empty]\r\n[mariadb-11.4]\r\n[client]\r\n';
 assert.deepEqual(mariadbSettingGroups(source),['client','mysqld','empty','mariadb-11.4']);assert.deepEqual(mariadbSettingGroups('[mysqld]\n[client]\n'),['mysqld','client']);assert(!JSON.stringify(mariadbSettingGroups(source)).includes('fixture-secret'));
 for(const value of [null,'x\0','x\ry','가'.repeat(87382)])assert.throws(()=>mariadbSettingGroups(value));
});
