import test from 'node:test';
import assert from 'node:assert/strict';
import {patchConfig} from '../lib/config-patch.ts';
import {parseLiveConfig} from '../lib/config-live.ts';
test('Redis patch changes selected settings while preserving authentication, includes and unrelated bytes',()=>{
 const before='# private\r\nrequirepass secret\r\ninclude /etc/redis/local.conf\r\nport 6379\r\nmaxmemory 128mb\r\nport 6380\r\nsave 900 1\r\n';
 const after=patchConfig('redis',before,{port:6390,maxMemory:512});
 assert.equal(after,before.replaceAll(/port 63(?:79|80)/g,'port 6390').replace('maxmemory 128mb','maxmemory 512mb'));
 assert.deepEqual(parseLiveConfig('redis',after).values,{port:6390,maxMemory:512});
 assert.equal(patchConfig('redis',before,{}),before);
});
test('database patch preserves client settings and comments, appending missing fields in a server group',()=>{
 const before='[client]\nport=3306\npassword=secret\n[mysqld]\nport=3307 # existing comment\n[mariadbd]\nport=3308\n';
 const after=patchConfig('mariadb',before,{port:3310,slowLog:true});
 assert(after.startsWith('[client]\nport=3306\npassword=secret\n'));
 assert(after.includes('port = 3310 # existing comment'));
 assert(after.endsWith('[mariadbd]\nslow_query_log = ON\n'));
 assert.deepEqual(parseLiveConfig('mariadb',after).values,{port:3310,slowLog:true});
 const pg=patchConfig('postgresql',"# work_mem = '4MB'\nwork_mem = '8MB' # per session\ninclude = 'local.conf'",{workMem:16,logging:true});
 assert(pg.includes("# work_mem = '4MB'\nwork_mem = '16MB' # per session\ninclude = 'local.conf'\nlogging_collector = on\n"));
});
test('configuration patch rejects injected values and fields without modifying source text',()=>{
 for(const [kind,changes] of [['redis',{port:'6379\nrequirepass injected'}],['redis',{requirepass:'secret'}],['mariadb',{charset:'utf8mb4\n!include /tmp/x'}],['postgresql',{logging:'on'}]])assert.throws(()=>patchConfig(kind,'# original\n',changes));
 assert.throws(()=>patchConfig('nodejs','',{port:3000}));
 assert.throws(()=>patchConfig('redis','\0',{port:6379}));
});

test('MariaDB patch matches underscore and dash aliases while preserving client groups and spelling',()=>{
 const before='[client]\ncharacter_set_server=utf8\n[mysqld]\ncharacter_set_server=utf8\nmax-connections=100 # limit\n[mariadbd]\ncharacter-set-server=utf8\n';
 const after=patchConfig('mariadb',before,{charset:'utf8mb4',connections:200});
 assert.equal(after,'[client]\ncharacter_set_server=utf8\n[mysqld]\ncharacter_set_server = utf8mb4\nmax-connections = 200 # limit\n[mariadbd]\ncharacter-set-server = utf8mb4\n');
 assert.deepEqual(parseLiveConfig('mariadb',after).values,{charset:'utf8mb4',connections:200});
});
