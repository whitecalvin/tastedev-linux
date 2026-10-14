import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {parse,transform,loadBindings} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';
import {translate} from '../lib/i18n.ts';
const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'];
const localized=(error,status=400)=>{assert.equal(error.status,status);for(const locale of locales){const value=translate(locale,error.message);assert.notEqual(value,error.message,locale+': '+error.message);assert(!/[가-힣]/.test(value));}assert.equal(translate('ko',error.message),error.message);return true;};
test('all literal operation factory diagnostics have direct translations in the 12 catalogs',async()=>{
 await loadBindings();const source=await readFile(new URL('../lib/operations.ts',import.meta.url),'utf8');const {literals}=diagnosticCandidates(await parse(source,{filename:'operations.ts',syntax:'typescript'}));assert.equal(literals.length,17);
 for(const locale of locales){const catalog=JSON.parse(await readFile(new URL('../lib/locales/'+locale+'.json',import.meta.url),'utf8'));for(const key of literals){assert(Object.hasOwn(catalog,key),locale+': '+key);assert.equal(translate(locale,key),catalog[key]);assert(!/[가-힣]/.test(catalog[key]));if(key.includes('200'))assert(catalog[key].includes('200'));if(key.includes('nginx'))assert(catalog[key].includes('nginx'));if(key.includes('cron'))assert(catalog[key].includes('cron'));}}
});
test('actual operation guard failures keep status and avoid helper, subprocess or write calls',async()=>{
 await loadBindings();const native=createRequire(import.meta.url);const {code}=await transform(await readFile(new URL('../lib/operations.ts',import.meta.url),'utf8'),{filename:'operations.mjs',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});
 const id='11111111-1111-1111-1111-111111111111',text='0 1 * * * echo fixture\n',record={id,kind:'cron',target:'current-user',text,createdAt:'2026-10-10T00:00:00Z',sha256:createHash('sha256').update(text).digest('hex')};let safeFile=true,mutations=0;
 const forbidden=()=>{mutations++;throw Error('must not execute');};
 const mocks={'./runtime-paths.ts':{stateRoot:()=>'/tmp/operations-error-fixture'},'./privilege.ts':{adminConfigured:()=>false,runHelper:forbidden},'./system-settings.ts':{systemSettings:()=>({logLines:150})},'node:child_process':{execFile:forbidden},'node:fs/promises':{lstat:async()=>({isFile:()=>safeFile,isSymbolicLink:()=>false,nlink:1,size:100}),readFile:async()=>JSON.stringify(record),writeFile:forbidden,mkdir:forbidden,open:forbidden,rename:forbidden,unlink:forbidden},'./cron-lock.ts':{withCronLock:forbidden}};
 const module={exports:{}};new Function('require','module','exports',code)(name=>Object.hasOwn(mocks,name)?mocks[name]:name.startsWith('.')?{}:name==='./node-apps'?{__esModule:true,default:'NodeApps'}:native(name),module,module.exports);const api=module.exports;
 for(const run of [()=>api.serviceCommand('arbitrary.service','start'),()=>api.serviceCommand('cron.service','reload'),()=>api.logCommand('arbitrary'),()=>api.logCommand('nginx.service',null,123),()=>api.backupId('../file'),()=>api.validateLocalBackup({...record,target:'other-user'},id),()=>api.validateLocalBackup({...record,sha256:'0'.repeat(64)},id)])assert.throws(run,error=>localized(error,error.message.includes('cron 백업')?403:400));
 await assert.rejects(api.controlService({unit:'nginx.service',action:'start',confirm:true}),error=>localized(error,403));
 await assert.rejects(api.readLogs('nginx.service','a'.repeat(201)),localized);
 await assert.rejects(api.createBackup('nginx','other','text'),localized);
 await assert.rejects(api.restoreBackup({id,confirm:false}),localized);
 const previous=process.env.LINUX_ENABLE_CRON;process.env.LINUX_ENABLE_CRON='false';try{await assert.rejects(api.restoreBackup({id,confirm:true}),error=>localized(error,403));}finally{if(previous===undefined)delete process.env.LINUX_ENABLE_CRON;else process.env.LINUX_ENABLE_CRON=previous;}
 safeFile=false;await assert.rejects(api.backupPreview(id),error=>localized(error,403));assert.equal(mutations,0);
});
