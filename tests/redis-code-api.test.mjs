import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {prepareRedisCode,redisCodeReviewVersion} from '../lib/redis-code-request.ts';
test('Redis code APIs authenticate and gate privilege before forwarding complete text, rejecting stale reviews and oversized bodies',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../lib/api.ts',import.meta.url),'utf8'),{filename:'api.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});let loggedIn=false,allowed=false;const calls=[],module={exports:{}};
 const require=name=>name==='./auth.ts'?{cookieSession:async()=>loggedIn?{username:'fixture'}:null}:name==='./security.ts'?{assertFeature:async(feature,options)=>{assert.equal(feature,'databaseChanges');assert.equal(options.sudo,true);if(!allowed)throw Object.assign(Error('disabled'),{status:403});},auditEvent:async()=>{}}:name==='./privilege.ts'?{runHelper:async(action,input)=>{calls.push({action,input});return{changed:true,reviewVersion:'fixture'};}}:name==='./redis-code-request.ts'?{prepareRedisCode}:{};
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const input={path:'/etc/redis/redis.conf',version:'a'.repeat(64),text:'# '+ 'x'.repeat(20000)+'\nsave 300 10\n'},post=(action,data=input)=>module.exports.handle(new Request('http://localhost/api/'+action,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)}),action);
 assert.equal((await post('redis-code-plan')).status,401);assert.equal(calls.length,0);loggedIn=true;assert.equal((await post('redis-code-plan')).status,403);assert.equal(calls.length,0);allowed=true;
 assert.equal((await post('redis-code-plan')).status,200);assert.equal(calls[0].input.text,input.text);
 const reviewed={...input,graphVersion:'b'.repeat(64),candidateGraphVersion:'c'.repeat(64)},commit={...reviewed,confirm:true,reviewVersion:redisCodeReviewVersion(reviewed)};assert.equal((await post('redis-code-apply',commit)).status,200);assert.deepEqual(calls.at(-1),{action:'redis-code-apply',input:commit});
 const count=calls.length;assert.equal((await post('redis-code-apply',{...commit,text:'changed'})).status,400);assert.equal(calls.length,count);
 assert.equal((await post('redis-code-plan',{...input,text:'x'.repeat(1600001)})).status,413);assert.equal(calls.length,count);
});
