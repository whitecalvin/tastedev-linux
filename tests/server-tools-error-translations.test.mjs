import {hasErrorCode} from '../lib/error-code.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {loadBindings,parse,transform} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';
import {translate} from '../lib/i18n.ts';
import {cronSchedule,cronEntry,updateCron,removeCron} from '../lib/server-tools.ts';
const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'],native=createRequire(import.meta.url);
const localized=(error,status=400)=>{assert.equal(error.status,status);for(const locale of locales){const text=translate(locale,error.message);assert.notEqual(text,error.message);assert(!/[가-힣]/.test(text));}assert.equal(translate('ko',error.message),error.message);return true;};
test('all static server-tools diagnostics have direct native entries and preserve configuration tokens',async()=>{
 await loadBindings();const {literals}=diagnosticCandidates(await parse(await readFile(new URL('../lib/server-tools.ts',import.meta.url),'utf8'),{filename:'server-tools.ts',syntax:'typescript'}));assert.equal(literals.length,19);
 for(const locale of locales){const catalog=JSON.parse(await readFile(new URL('../lib/locales/'+locale+'.json',import.meta.url),'utf8'));for(const key of literals){assert(Object.hasOwn(catalog,key),locale+': '+key);assert.equal(translate(locale,key),catalog[key]);assert(!/[가-힣]/.test(catalog[key]));for(const token of ['LINUX_ENABLE_ADMIN=true','LINUX_ENABLE_CRON=true','ACME','nginx','crontab'])if(key.includes(token))assert(catalog[key].includes(token));}}
});
test('invalid cron edits report translated errors and preserve original managed blocks',()=>{
 for(const value of [null,'* * * *','a * * * *','*/0 * * * *','*/61 * * * *','60 * * * *','0 24 * * *','0 0 0 * *','0 0 * 13 *','0 0 * * 8','5-1 * * * *'])assert.throws(()=>cronSchedule(value),localized);
 assert.equal(cronSchedule(' */5   0-23 1,15 * 0-7 '),'*/5 0-23 1,15 * 0-7');
 const valid={enabled:true,name:'fixture_job',schedule:'0 1 * * *',command:'/bin/true'};
 for(const change of [{enabled:'true'},{command:'echo one\necho two'},{command:''},{name:'../other'}])assert.throws(()=>cronEntry({...valid,...change}),localized);
 const before='MAILTO=fixture@example.invalid\n# LINUX: fixture_job\n0 1 * * * /bin/true\n';
 assert.throws(()=>updateCron(before+before,valid),localized);assert.throws(()=>removeCron(before,'../bad'),localized);assert.throws(()=>removeCron(before,'missing'),error=>localized(error,409));
 assert.equal(updateCron(before,{...valid,enabled:false}),'MAILTO=fixture@example.invalid\n# LINUX: fixture_job\n# disabled: 0 1 * * * /bin/true\n');
 assert.equal(before,'MAILTO=fixture@example.invalid\n# LINUX: fixture_job\n0 1 * * * /bin/true\n');
});
test('cron mutation gates and stale-version conflict never install a crontab or create a backup',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../lib/server-tools.ts',import.meta.url),'utf8'),{filename:'server-tools.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});
 let reads=0,locks=0,mutations=0;const forbidden=()=>{mutations++;throw Error('unexpected mutation');};
 const mocks={'./error-code.ts':{hasErrorCode},'./runtime-paths.ts':{stateRoot:()=>'/fixture'},'./cron-lock.ts':{withCronLock:async(_folder,fn)=>{locks++;return fn();}},'./cron-install.ts':{installCron:forbidden},'./operations.ts':{createBackup:forbidden},'node:child_process':{execFile:(binary,args,options,callback)=>{reads++;assert.equal(binary,'/usr/bin/crontab');assert.deepEqual(args,['-l']);callback(null,{stdout:'# untouched fixture\n',stderr:''});},spawn:forbidden}};
 const module={exports:{}};new Function('require','module','exports',compiled.code)(name=>mocks[name]??(name.startsWith('.')?{}:native(name)),module,module.exports);
 const input={enabled:true,name:'fixture',schedule:'0 1 * * *',command:'/bin/true',version:'0'.repeat(64)},old=process.env.LINUX_ENABLE_CRON,uid=process.getuid;
 try{
  process.getuid=()=>1000;process.env.LINUX_ENABLE_CRON='false';await assert.rejects(module.exports.applyCron(input),error=>localized(error,403));
  process.env.LINUX_ENABLE_CRON='true';process.getuid=()=>0;await assert.rejects(module.exports.applyCron(input),error=>localized(error,403));
  process.getuid=()=>1000;await assert.rejects(module.exports.applyCron(input),localized);await assert.rejects(module.exports.deleteCron({name:'fixture'}),localized);assert.equal(locks,0);assert.equal(reads,0);
  await assert.rejects(module.exports.applyCron({...input,confirm:true}),error=>localized(error,409));assert.equal(locks,1);assert.equal(reads,1);assert.equal(mutations,0);
 }finally{process.getuid=uid;if(old===undefined)delete process.env.LINUX_ENABLE_CRON;else process.env.LINUX_ENABLE_CRON=old;}
});
