import test from 'node:test';import assert from 'node:assert/strict';import {inspectRedisContext} from '../lib/redis-context-inspect.ts';
test('Redis context distinguishes missing executable and unsafe ownership without native details',async()=>{
 const hooks={readGraph:async()=>({version:'a'.repeat(64),complete:true}),inspectService:async()=>({})};
 const missing=await inspectRedisContext({...hooks,inspectBinary:()=>{throw Object.assign(Error('private-detail'),{code:'ENOENT'});}});
 assert.match(missing.binary.reason,/없습니다/);assert.equal(JSON.stringify(missing).includes('private-detail'),false);
 const unsafe=await inspectRedisContext({...hooks,inspectBinary:()=>{throw Error('private-detail');}});
 assert.match(unsafe.binary.reason,/소유권/);
 assert.deepEqual((await inspectRedisContext({...hooks,inspectBinary:()=>({})})).binary,{ready:true});
});
test('Redis context lookup omits process arguments and rejects concurrent graph changes',async()=>{const graph={version:'a'.repeat(64),complete:true};const result=await inspectRedisContext({readGraph:async()=>graph,inspectService:async()=>({main:'/etc/redis/redis.conf',pid:42,argv:['private-secret']})});assert.equal(JSON.stringify(result).includes('private-secret'),false);const unavailable=await inspectRedisContext({readGraph:async()=>graph,inspectService:async()=>{throw Error('private-secret');}});assert.equal(unavailable.service.ready,false);assert.equal(JSON.stringify(unavailable).includes('private-secret'),false);let count=0;await assert.rejects(inspectRedisContext({readGraph:async()=>({version:++count===1?'a':'b'}),inspectService:async()=>({})}),error=>error.status===409);});

test('Redis context exposes observed identity separately from unverified startup main',async()=>{const graph={root:'/etc/redis/redis.conf',version:'a'.repeat(64),complete:true};const result=await inspectRedisContext({readGraph:async()=>graph,inspectService:async()=>({identityVerified:true,pid:42,uid:105,start:'123',service:'redis-server.service',startupMainVerified:false,argv:['private-secret']})});assert.equal(result.service.ready,true);assert.equal(result.service.identityVerified,true);assert.equal(result.service.startupMainVerified,false);assert.equal(Object.hasOwn(result.service,'main'),false);assert.equal(JSON.stringify(result).includes('private-secret'),false);});
