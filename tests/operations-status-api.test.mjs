import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';

test('authenticated operations API scopes reads, retains full inventory and rejects ambiguous units',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../lib/api.ts',import.meta.url),'utf8'),{filename:'api.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});
 const module={exports:{}},calls=[];let authenticated=true;
 const require=name=>name==='./auth.ts'?{cookieSession:async()=>authenticated?{username:'fixture'}:null}:name==='./operations.ts'?{serviceStatus:async options=>{calls.push(options);if(options&&!['nginx.service','postgresql.service'].includes(options.unit))throw Object.assign(Error('허용된 서비스와 작업을 선택하세요.'),{status:400});return[{unit:options?.unit||'nginx.service',ActiveState:'active'}];},permissions:()=>({admin:false})}:{};
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const get=query=>module.exports.handle(new Request('http://localhost/api/operations'+query),'operations');
 let response=await get('?unit=nginx.service');assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.deepEqual((await response.json()).services,[{unit:'nginx.service',ActiveState:'active'}]);assert.deepEqual(calls,[{unit:'nginx.service'}]);
 assert.equal((await get('')).status,200);assert.equal(calls.at(-1),undefined,'daemon inventory keeps all service reads');
 assert.equal((await get('?unit=postgresql.service')).status,200);assert.deepEqual(calls.at(-1),{unit:'postgresql.service'});
 for(const query of ['?unit=unknown.service','?unit=','?unit=%3Bshutdown'])assert.equal((await get(query)).status,400);
 const before=calls.length;assert.equal((await get('?unit=nginx.service&unit=postgresql.service')).status,400);assert.equal(calls.length,before,'ambiguous unit never reaches service lookup');
 authenticated=false;assert.equal((await get('?unit=nginx.service')).status,401);assert.equal(calls.length,before,'unauthenticated request never reaches lookup');
});
