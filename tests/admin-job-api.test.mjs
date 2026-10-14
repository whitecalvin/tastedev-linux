import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
test('admin job API authenticates before stored lookup and awaits its result and failures',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../lib/api.ts',import.meta.url),'utf8'),{filename:'api.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}}),module={exports:{}},calls=[];let authenticated=false,failure=null;
 const record={id:'aacdab81-2019-4b5a-9c8c-419a8bc80562',status:'success',logs:['fixture']};
 const require=name=>name==='./auth.ts'?{cookieSession:async()=>authenticated?{username:'fixture'}:null}:name==='./server-tools.ts'?{operationJob:async id=>{calls.push(id);await Promise.resolve();if(failure)throw failure;return record;}}:{};
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const get=()=>module.exports.handle(new Request('http://localhost/api/admin-job?id='+record.id),'admin-job');
 assert.equal((await get()).status,401);assert.deepEqual(calls,[]);authenticated=true;
 const response=await get();assert.equal(response.status,200);assert.deepEqual(await response.json(),{job:record});assert.deepEqual(calls,[record.id]);
 for(const status of [403,404,409]){failure=Object.assign(Error('record unavailable'),{status});const response=await get();assert.equal(response.status,status);assert.equal((await response.json()).error,'record unavailable');}
});

test('malformed thrown API failures return bounded error responses instead of failing the response constructor',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../lib/api.ts',import.meta.url),'utf8'),{filename:'api.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}}),module={exports:{}};let failure;
 const mocks={'./auth.ts':{cookieSession:async()=>({username:'fixture'})},'./server-tools.ts':{operationJob:async()=>{throw failure;}}};
 new Function('require','module','exports',compiled.code)(name=>mocks[name]||{},module,module.exports);
 for(const value of [null,undefined,'failed',{status:200,message:'invalid status'},{status:700,message:'invalid status'},{status:'401',message:'invalid status'},{status:403,message:{private:'details'}}]){failure=value;const response=await module.exports.handle(new Request('http://localhost/api/admin-job?id=fixture'),'admin-job');assert.equal(response.status,typeof value==='object'&&value?.status===403?403:400);const body=await response.json();assert.equal(typeof body.error,'string');assert(!JSON.stringify(body).includes('private'));}
});
