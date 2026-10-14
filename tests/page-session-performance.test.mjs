import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadBindings,transform} from 'next/dist/build/swc/index.js';
test('layout/page authentication shares one read per render and rechecks expiry on the next request',async()=>{
 await loadBindings();
 const {code}=await transform(await readFile(new URL('../lib/page-session.ts',import.meta.url),'utf8'),{filename:'page-session.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});
 let render=new Map(),reads=0,user='first';
 const mocks={react:{cache:fn=>()=>{if(!render.has(fn))render.set(fn,fn());return render.get(fn);}},
 'next/headers':{headers:async()=>new Headers({'cookie':'fixture='+user})},
 'next/navigation':{redirect:url=>{throw Object.assign(Error('redirect'),{url});}},
 './auth.ts':{cookieSession:async({headers})=>{reads++;return user?{username:headers.get('cookie')}:null;}},
 './auth-storage-error.ts':{isAuthStorageError:()=>false}};
 const module={exports:{}};new Function('require','module','exports',code)(name=>mocks[name],module,module.exports);
 const {pageSession,requirePageSession}=module.exports;
 await Promise.all([pageSession(),requirePageSession('/overview'),requirePageSession('/daemon')]);assert.equal(reads,1);
 render=new Map();user='second';assert.equal((await pageSession()).username,'fixture=second');assert.equal(reads,2);
 render=new Map();user='';await assert.rejects(requirePageSession('/terminal',{tab:'two'}),error=>error.url==='/login?next=%2Fterminal%3Ftab%3Dtwo');assert.equal(await pageSession(),null);assert.equal(reads,3);
});
