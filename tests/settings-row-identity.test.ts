import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePostgresqlSettings,updatePostgresqlSetting} from '../lib/postgresql-settings-text.ts';
import {parseMariaDBSettings,updateMariaDBSetting} from '../lib/mariadb-settings-text.ts';
import {parseRedisSettings,updateRedisSetting} from '../lib/redis-settings-text.ts';

test('row updates use canonical source metadata and preserve later includes and credentials',()=>{
 const cases=[{source:"port = 5432 # 보존\r\ninclude = 'local.conf'\r\n",parse:parsePostgresqlSettings,update:updatePostgresqlSetting},{source:'[mysqld]\r\nport = 3306 # 보존\r\n!include /etc/mysql/local.cnf\r\n[client]\r\npassword = retained\r\n',parse:parseMariaDBSettings,update:updateMariaDBSetting},{source:'port 6379\r\nrequirepass retained\r\ninclude /etc/redis/local.conf\r\n',parse:parseRedisSettings,update:updateRedisSetting}];
 for(const item of cases){const row=item.parse(item.source)[0];assert(row);const spoofed={...row,name:'injected',indent:'evil\n',separator:'\n',comment:'injected',ending:'\n'};assert.equal(item.update(item.source,spoofed,{value:'1234'}),item.update(item.source,row,{value:'1234'}));assert.throws(()=>item.update(item.source,{...spoofed,raw:'stale'},{value:'1234'}));}
});
