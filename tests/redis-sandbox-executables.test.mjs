import test from 'node:test';
import assert from 'node:assert/strict';
import {redisSandboxExecutables,reviewedRedisSandboxExecutables} from '../lib/redis-sandbox-executables.ts';
test('sandbox executable review binds both fixed paths and rejects changed hashes',()=>{
 const seen=[];
 const inspect=({binary})=>{seen.push(binary);return {path:binary,sha256:'a'.repeat(64),ino:1,dev:2,bytes:3};};
 const snapshot=redisSandboxExecutables({inspect});
 assert.deepEqual(seen,['/usr/bin/bwrap','/usr/bin/prlimit']);
 assert.deepEqual(reviewedRedisSandboxExecutables(snapshot,{inspect}),snapshot);
 assert.throws(()=>reviewedRedisSandboxExecutables(snapshot,{inspect:({binary})=>({...inspect({binary}),sha256:'b'.repeat(64)})}));
 assert.throws(()=>redisSandboxExecutables({inspect:()=>({path:'/tmp/other'})}));
 assert.throws(()=>snapshot.push({}));
});
