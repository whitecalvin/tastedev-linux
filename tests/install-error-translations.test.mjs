import * as errorCode from '../lib/error-code.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {EventEmitter} from 'node:events';
import {parse,transform,loadBindings} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';
import {translate} from '../lib/i18n.ts';
import {installJobRecord} from '../lib/install-job-record.ts';
const native=createRequire(import.meta.url),locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
const localized=(error,status)=>{if(status!==undefined)assert.equal(error.status,status);for(const locale of locales){const value=translate(locale,error.message);assert.notEqual(value,error.message);assert(!/[가-힣]/.test(value));}assert.equal(translate('ko',error.message),error.message);return true;};
async function compiled(file){await loadBindings();const extension='.ts';return (await transform(await readFile(new URL('../lib/'+file+extension,import.meta.url),'utf8'),{filename:file+extension,jsc:{parser:{syntax:extension==='.ts'?'typescript':'ecmascript'}},module:{type:'commonjs'}})).code;}
test('all static package, installation-record and cron-install errors have direct catalog entries',async()=>{
 await loadBindings();const keys=new Set();for(const file of ['packages','install-job-record','cron-install']){const extension='.ts';const {literals}=diagnosticCandidates(await parse(await readFile(new URL('../lib/'+file+extension,import.meta.url),'utf8'),{filename:file+extension,...(extension==='.ts'?{syntax:'typescript'}:{})}));literals.forEach(key=>keys.add(key));}assert.equal(keys.size,5);
 for(const locale of locales){const catalog=JSON.parse(await readFile(new URL('../lib/locales/'+locale+'.json',import.meta.url),'utf8'));for(const key of keys){assert(Object.hasOwn(catalog,key),locale+': '+key);assert.equal(translate(locale,key),catalog[key]);assert(!/[가-힣]/.test(catalog[key]));if(key.includes('Ubuntu/Debian'))assert(catalog[key].includes('Ubuntu/Debian'));}}
});
test('installation capability and both lock paths remain blocked without spawning an installer',async()=>{
 let phase='blocked',spawned=0,opened=0;
 const forbidden=()=>{spawned++;throw Error('must not spawn');};
 const mocks={'./error-code.ts':errorCode,'./runtime-paths.ts':{stateRoot:()=>'/tmp/install-errors-fixture'},'./inventory-snapshot.ts':{inventorySnapshot:load=>load},'./privilege.ts':{helperStatus:()=>({ready:true}),spawnHelper:forbidden},'node:child_process':{spawn:forbidden},'node:fs/promises':{readFile:async()=> 'ID=ubuntu\n',lstat:async()=>{if(phase==='legacy')return {};throw Object.assign(Error('missing'),{code:'ENOENT'});},mkdir:async()=>{},open:async()=>{opened++;throw Object.assign(Error('locked'),{code:'EEXIST'});}}};
 const module={exports:{}};new Function('require','module','exports',await compiled('packages'))(name=>Object.hasOwn(mocks,name)?mocks[name]:name.startsWith('.')?{}:native(name),module,module.exports);const api=module.exports;
 for(const names of [[],['unknown'],['nginx','nginx'],'nginx'])assert.throws(()=>api.commandFor(names),error=>localized(error));
 const old=process.env.LINUX_ENABLE_INSTALL;try{
  process.env.LINUX_ENABLE_INSTALL='false';await assert.rejects(api.startInstall(['nginx']),error=>localized(error,403));assert.equal(opened,0);
  process.env.LINUX_ENABLE_INSTALL='true';phase='legacy';await assert.rejects(api.startInstall(['nginx']),error=>localized(error,409));assert.equal(opened,0);
  phase='current';await assert.rejects(api.startInstall(['nginx']),error=>localized(error,409));assert.equal(opened,1);
 }finally{if(old===undefined)delete process.env.LINUX_ENABLE_INSTALL;else process.env.LINUX_ENABLE_INSTALL=old;}
 assert.equal(spawned,0);assert.throws(()=>installJobRecord({status:'success',command:['/bin/sh']}),error=>localized(error,409));
});
test('real cron installer timeout branch rejects with localized text using a mock child and clock',async()=>{
 const child=new EventEmitter();child.stderr=new EventEmitter();child.stdin=new EventEmitter();let timer,input,spawnCalls=0,kills=0;
 child.stdin.end=(text,encoding)=>{input={text,encoding};};child.kill=signal=>{kills++;assert.equal(signal,'SIGKILL');child.emit('close',null,signal);};
 const module={exports:{}};new Function('require','module','exports','setTimeout','clearTimeout',await compiled('cron-install'))(name=>name==='node:child_process'?{spawn:(binary,args,options)=>{spawnCalls++;assert.equal(binary,'/usr/bin/crontab');assert.deepEqual(args,['-']);assert.equal(options.env.LC_ALL,'C');return child;}}:native(name),module,module.exports,(fn,ms)=>{assert.equal(ms,5000);timer=fn;return 1;},()=>{});
 const pending=module.exports.installCron('0 1 * * * echo fixture\n');timer();await assert.rejects(pending,error=>{assert.equal(error.message,'cron 저장 시간이 초과되었습니다.');assert.equal(error.signal,'SIGKILL');return localized(error);});assert.equal(kills,1);assert.equal(spawnCalls,1);assert.deepEqual(input,{text:'0 1 * * * echo fixture\n',encoding:'utf8'});
});
