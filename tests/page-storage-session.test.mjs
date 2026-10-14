import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {isAuthStorageError} from '../lib/auth-storage-error.ts';

test('protected pages preserve the destination when auth storage fails and propagate unrelated failures',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../lib/page-session.ts',import.meta.url),'utf8'),{filename:'page-session.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});
 let session=null,failure=null;const module={exports:{}};
 const require=name=>name==='react'?{cache:fn=>fn}:name==='next/headers'?{headers:async()=>new Headers()}:name==='next/navigation'?{redirect:value=>{throw Object.assign(Error('redirect'),{destination:value});}}:name==='./auth.ts'?{cookieSession:async()=>{if(failure)throw failure;return session;}}:{isAuthStorageError};
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const destination='/ide/packages/nginx';
 await assert.rejects(module.exports.requirePageSession(destination),error=>error.destination==='/login?next=%2Fide%2Fpackages%2Fnginx');
 await assert.rejects(module.exports.requirePageSession(destination,Promise.resolve({view:'code',filter:['first','second']})),error=>error.destination==='/login?next='+encodeURIComponent(destination+'?view=code&filter=first&filter=second'));
 failure=Error('인증 저장 경로 권한을 확인하세요.');
 await assert.rejects(module.exports.requirePageSession(destination),error=>error.destination==='/login?next=%2Fide%2Fpackages%2Fnginx');
 failure=Error('unrelated server failure');await assert.rejects(module.exports.requirePageSession(destination),/unrelated server failure/);
 failure=null;session={username:'fixture'};await module.exports.requirePageSession(destination);
});
