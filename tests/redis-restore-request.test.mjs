import test from 'node:test';import assert from 'node:assert/strict';
import {prepareRedisRestore} from '../lib/redis-restore-request.ts';
test('Redis restore request freezes reviewed identity and rejects paths commands and missing versions',()=>{
 const input={id:'12345678-1234-1234-1234-123456789abc',confirm:true,version:'a'.repeat(64),graphVersion:'b'.repeat(64),restoreGraphVersion:'c'.repeat(64),backupVersion:'d'.repeat(64)};
 const result=prepareRedisRestore(input);input.id='changed';assert.notEqual(result.id,input.id);assert.ok(Object.isFrozen(result));
 for(const change of [{path:'/tmp/config'},{command:'restart'},{confirm:false},{graphVersion:undefined},{backupVersion:42},{id:'../backup'}])assert.throws(()=>prepareRedisRestore({...result,...change}),{status:400});
});
