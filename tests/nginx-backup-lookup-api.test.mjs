import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {prepareNginxBackupLookup} from '../lib/nginx-config-backups.ts';
test('nginx scoped catalog GET requires session and sudo policy, validates IDs and forwards no filesystem overrides',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../lib/api.ts',import.meta.url),'utf8'),{filename:'api.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});
 let loggedIn=false,allowed=false;const calls=[],module={exports:{}};
 const require=name=>name==='./nginx-config-backups.ts'?{prepareNginxBackupLookup}:name==='./auth.ts'?{cookieSession:async()=>loggedIn?{username:'fixture'}:null}:name==='./security.ts'?{securitySettings:async()=>({settings:{sudoWithoutPrompt:allowed}})}:name==='./privilege.ts'?{runHelper:async(action,input)=>{calls.push({action,input});return{backups:[]};}}:{};
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const get=ids=>module.exports.handle(new Request('http://localhost/api/nginx-config-backups'+(ids===undefined?'':'?ids='+encodeURIComponent(ids))),'nginx-config-backups');
 assert.equal((await get()).status,401);loggedIn=true;assert.equal((await get()).status,403);assert.equal(calls.length,0);allowed=true;
 for(const ids of ['{','null','{}','["../escape"]',JSON.stringify(Array(101).fill('a'.repeat(36)))])assert.equal((await get(ids)).status,400);
 assert.equal(calls.length,0);const id='12345678-1234-1234-1234-123456789abc';assert.equal((await get(JSON.stringify([id,id]))).status,200);assert.deepEqual(calls[0],{action:'nginx-config-backups',input:{ids:[id]}});
 assert.equal((await get()).status,200);assert.deepEqual(calls[1].input,{});
 for(const input of [{root:'/tmp'},{ownerUid:0},{base:'/etc'},{ids:[id],text:'override'}])assert.throws(()=>prepareNginxBackupLookup(input),{status:400});
});
