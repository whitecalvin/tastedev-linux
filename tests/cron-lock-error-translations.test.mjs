import {hasErrorCode} from '../lib/error-code.ts';
import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {EventEmitter} from 'node:events';
import {loadBindings,parse,transform} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';
import {translate,languageCatalog} from '../lib/i18n.ts';
const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
const guidance='cron 잠금을 확인할 수 없습니다.';
test('all cron lock diagnostics have direct native entries and preserve cron identifier',async()=>{
 await loadBindings();const {literals}=diagnosticCandidates(await parse(await readFile(new URL('../lib/cron-lock.ts',import.meta.url),'utf8'),{filename:'cron-lock.ts',syntax:'typescript'}));assert.equal(literals.length,3);
 for(const message of literals)for(const locale of locales){const catalog=languageCatalog(locale);assert(Object.hasOwn(catalog,message));assert.equal(translate(locale,message),catalog[message]);assert(!/[가-힣]/.test(catalog[message]));assert(catalog[message].includes('cron'));}
});
test('spawn, exit and timeout failures close the handle and never run the protected operation',async()=>{
 await loadBindings();const {code}=await transform(await readFile(new URL('../lib/cron-lock.ts',import.meta.url),'utf8'),{filename:'cron-lock.ts',jsc:{parser:{syntax:'typescript'},target:'es2022'},module:{type:'commonjs'}});const native=createRequire(import.meta.url);
 for(const kind of ['spawn','exit','timeout']){
  let closes=0,operations=0,kills=0;const privateError=Object.assign(Error('/private/internal-spawn-details'),{code:'ENOENT'});
  const child=new EventEmitter();child.kill=signal=>{assert.equal(signal,'SIGKILL');kills++;};
  const mocks={
   'node:fs/promises':{mkdir:async()=>{},lstat:async()=>{throw Object.assign(Error(),{code:'ENOENT'});},open:async()=>({fd:100,stat:async()=>({isFile:()=>true,nlink:1,uid:1000,mode:0o600}),close:async()=>{closes++;}})},
   'node:child_process':{spawn:(binary,args,options)=>{assert.equal(binary,'/usr/bin/flock');assert.deepEqual(args,['--nonblock','3']);assert.equal(options.stdio[3],100);queueMicrotask(()=>{if(kind==='spawn')child.emit('error',privateError);else if(kind==='exit')child.emit('close',2);});return child;}}
  };
  const module={exports:{}};new Function('require','module','exports','process','setTimeout','clearTimeout',code)(name=>name==='./error-code.ts'?{hasErrorCode}:mocks[name]??native(name),module,module.exports,{geteuid:()=>1000},callback=>setTimeout(callback,0),clearTimeout);
  await assert.rejects(module.exports.withCronLock('/tmp/no-files-fixture',async()=>{operations++;}),error=>{
   assert.equal(error.message,guidance);assert(!error.message.includes('/private/'));if(kind==='spawn')assert.equal(error.cause,privateError);
   for(const locale of locales){const catalog=languageCatalog(locale);assert.equal(translate(locale,error.message),catalog[guidance]);}
   return true;
  });
  assert.equal(closes,1);assert.equal(operations,0);assert.equal(kills,kind==='timeout'?1:0);
 }
});
