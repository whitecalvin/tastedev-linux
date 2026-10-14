import test from 'node:test';
import assert from 'node:assert/strict';
import {redisSettingNames,redisSettingSuggestionNames} from '../lib/redis-setting-names.ts';
import {parseRedisSettings,updateRedisSetting} from '../lib/redis-settings-text.ts';
test('Redis suggestions distinguish current canonical options from hidden, deprecated and alias spellings',()=>{
 assert.equal(redisSettingNames.length,223);assert.equal(redisSettingSuggestionNames.length,185);
 for(const list of [redisSettingNames,redisSettingSuggestionNames]){assert(Object.isFrozen(list));assert.deepEqual(list,[...new Set(list)].sort());assert(!list.includes('no'));}
 for(const name of redisSettingSuggestionNames)assert(redisSettingNames.includes(name));
 for(const name of ['hide-user-data-from-log','replica-full-sync-buffer-limit','set-max-listpack-entries','set-max-listpack-value','locale-collate','max-new-connections-per-cycle'])assert(redisSettingSuggestionNames.includes(name),name);
 for(const name of ['include','rename-command','loadmodule','user','sentinel'])assert(redisSettingSuggestionNames.includes(name));
 for(const name of ['repl-rdb-channel','req-res-logfile','list-max-ziplist-entries','lua-replicate-commands','io-threads-do-reads','server_cpulist','slaveof']){assert(redisSettingNames.includes(name));assert(!redisSettingSuggestionNames.includes(name));}
 assert(redisSettingSuggestionNames.includes('server-cpulist'));assert(redisSettingSuggestionNames.includes('replicaof'));
});
test('Redis 8 options in spaced comments are editable while prose beginning with no stays prose',()=>{
 const text='# no changes should run\n# hide-user-data-from-log yes\n# set-max-listpack-entries 128\n# server_cpulist 0-1\n# io-threads-do-reads yes\n';
 const rows=parseRedisSettings(text);assert.deepEqual(rows.map(r=>r.line),[2,3,4,5]);
 const updated=updateRedisSetting(text,rows[0],{value:'no',enabled:true});assert.equal(updated,'# no changes should run\nhide-user-data-from-log no\n# set-max-listpack-entries 128\n# server_cpulist 0-1\n# io-threads-do-reads yes\n');
 assert.deepEqual(parseRedisSettings(updated).map(r=>r.name),rows.map(r=>r.name));
});
