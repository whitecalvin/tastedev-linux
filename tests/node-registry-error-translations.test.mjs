import test from 'node:test';import assert from 'node:assert/strict';import {readFile,mkdtemp,rm,writeFile,unlink,chmod} from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';import {loadBindings,parse,transform} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';import {translate,languageCatalog} from '../lib/i18n.ts';import {nodeApps,saveNodeApp,removeNodeApp} from '../lib/node-apps.ts';import {nodeAppProfile} from '../lib/node-app-profile.ts';
const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
const localized=(error,status)=>{assert.equal(error.status,status);for(const locale of locales){assert.notEqual(translate(locale,error.message),error.message);assert(!/[가-힣]/.test(translate(locale,error.message)));}return true;};
const profile={id:'fixture-app',label:'Fixture app',directory:'/srv/fixture-app',entry:'server.js',environmentFile:'.env'};
test('all app registry/profile/environment backup static errors have direct native entries',async()=>{
 await loadBindings();const keys=new Set();for(const file of ['node-apps','node-app-profile','node-app-env-backups']){const extension='.ts';const {literals}=diagnosticCandidates(await parse(await readFile(new URL('../lib/'+file+extension,import.meta.url),'utf8'),{filename:file+extension,...(extension==='.ts'?{syntax:'typescript'}:{})}));literals.forEach(key=>keys.add(key));}assert.equal(keys.size,12);
 for(const locale of locales){const catalog=languageCatalog(locale);for(const key of keys){assert(Object.hasOwn(catalog,key));assert.equal(translate(locale,key),catalog[key]);assert(!/[가-힣]/.test(catalog[key]));if(key.includes('50'))assert(catalog[key].includes('50'));}}
});
test('private registry rejects conflicts, unsafe records and limits while preserving fixture registrations',async()=>{
 const root=await mkdtemp('/mnt/data/build/tastedev-linux/node-registry-errors-'),old=process.env.LINUX_STATE_ROOT;process.env.LINUX_STATE_ROOT=root;
 try{
  for(const patch of [{id:'../escape'},{directory:'/srv/../etc'},{entry:'npm start'},{environmentFile:'/etc/passwd'}])assert.throws(()=>nodeAppProfile({...profile,...patch}),error=>localized(error,400));
  const initial=await nodeApps(),saved=await saveNodeApp({profile,version:initial.version}),file=path.join(root,'node-apps/apps.json'),lock=path.join(root,'node-apps/apps.lock'),original=await readFile(file,'utf8');
  await assert.rejects(saveNodeApp({profile,version:initial.version}),error=>localized(error,409));assert.equal(await readFile(file,'utf8'),original);
  await writeFile(lock,'fixture lock',{mode:0o600});try{await assert.rejects(saveNodeApp({profile,version:saved.version}),error=>localized(error,409));}finally{await unlink(lock);}
  await assert.rejects(removeNodeApp({id:profile.id,version:saved.version}),error=>localized(error,400));await assert.rejects(removeNodeApp({id:'../escape',confirm:true}),error=>localized(error,400));await assert.rejects(removeNodeApp({id:'missing',confirm:true,version:saved.version}),error=>localized(error,404));assert.equal(await readFile(file,'utf8'),original);
  await chmod(file,0o644);await assert.rejects(nodeApps(),error=>localized(error,403));await chmod(file,0o600);
  await writeFile(file,JSON.stringify([profile,profile]));await assert.rejects(nodeApps(),error=>localized(error,400));
  await writeFile(file,'x'.repeat(65537));await assert.rejects(nodeApps(),error=>localized(error,403));
  for(const corrupt of [Buffer.from('{\"fixture-private-marker\": invalid}'),Buffer.from([0xff,0xfe]),Buffer.from('[] trailing-fixture-secret')]){await writeFile(file,corrupt);await assert.rejects(nodeApps(),error=>{assert.equal(error.message,'앱 등록 파일을 확인하세요.');assert(!error.message.includes('fixture'));return localized(error,400);});assert.deepEqual(await readFile(file),corrupt);}

  const fifty=Array.from({length:50},(_,i)=>({...profile,id:'fixture-'+i}));await writeFile(file,JSON.stringify(fifty));const full=await nodeApps();await assert.rejects(saveNodeApp({profile,version:full.version}),error=>localized(error,400));assert.deepEqual((await nodeApps()).apps,full.apps);
  const uid=process.getuid;process.getuid=()=>0;try{await assert.rejects(saveNodeApp({profile,version:full.version}),error=>localized(error,403));}finally{process.getuid=uid;}
 }finally{if(old===undefined)delete process.env.LINUX_STATE_ROOT;else process.env.LINUX_STATE_ROOT=old;await rm(root,{recursive:true,force:true});}
});

test('authenticated registry API returns safe localized corruption guidance and preserves damaged bytes',async()=>{
 await loadBindings();const root=await mkdtemp('/mnt/data/build/tastedev-linux/node-registry-api-errors-'),old=process.env.LINUX_STATE_ROOT;process.env.LINUX_STATE_ROOT=root;
 try{
  await nodeApps();const file=path.join(root,'node-apps/apps.json'),corrupt='{"fixture-private-marker": not-json}';await writeFile(file,corrupt,{mode:0o600});
  const {code}=await transform(await readFile(new URL('../lib/api.ts',import.meta.url),'utf8'),{filename:'api.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});let authenticated=false,registryReads=0;
  const mocks={'./auth.ts':{cookieSession:async()=>authenticated?{username:'fixture'}:null},'./node-apps.ts':{nodeApps:async()=>{registryReads++;return nodeApps();}}},module={exports:{}};
  new Function('require','module','exports',code)(name=>mocks[name]??(name.startsWith('.')?{}:createRequire(import.meta.url)(name)),module,module.exports);
  let response=await module.exports.handle(new Request('http://127.0.0.1:8787/api/node-apps'),'node-apps');assert.equal(response.status,401);assert.equal(registryReads,0);
  authenticated=true;response=await module.exports.handle(new Request('http://127.0.0.1:8787/api/node-apps'),'node-apps');assert.equal(response.status,400);assert.equal(response.headers.get('cache-control'),'no-store');const result=await response.json();assert.deepEqual(result,{error:'앱 등록 파일을 확인하세요.'});assert(!JSON.stringify(result).includes('fixture-private-marker'));for(const locale of locales)assert(!/[가-힣]/.test(translate(locale,result.error)));assert.equal(await readFile(file,'utf8'),corrupt);assert.equal(registryReads,1);
 }finally{if(old===undefined)delete process.env.LINUX_STATE_ROOT;else process.env.LINUX_STATE_ROOT=old;await rm(root,{recursive:true,force:true});}
});
