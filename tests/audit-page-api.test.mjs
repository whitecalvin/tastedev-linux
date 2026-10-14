import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
test('audit page API authenticates before reading, forwards the cursor and preserves page error status',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../lib/api.ts',import.meta.url),'utf8'),{filename:'api.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});let loggedIn=false,fail=false;const calls=[],module={exports:{}};
 const page={events:[{at:'2026-10-05T00:00:00Z',action:'service',result:'completed'}],cursor:'head',nextCursor:'older',skipped:false};
 const require=name=>name==='./auth.ts'?{cookieSession:async()=>loggedIn?{username:'fixture'}:null}:name==='./security.ts'?{auditPage:async cursor=>{calls.push(cursor);if(fail)throw Object.assign(Error('stale page'),{status:409});return page;}}:{};
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const get=()=>module.exports.handle(new Request('http://localhost/api/audit?cursor=test_cursor'),'audit');assert.equal((await get()).status,401);assert.deepEqual(calls,[]);
 loggedIn=true;const response=await get();assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.deepEqual(await response.json(),page);assert.deepEqual(calls,['test_cursor']);
 fail=true;const rejected=await get();assert.equal(rejected.status,409);assert.deepEqual(await rejected.json(),{error:'stale page'});
});
