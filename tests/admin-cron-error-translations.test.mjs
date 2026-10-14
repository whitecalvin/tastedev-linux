import {hasErrorCode} from '../lib/error-code.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {loadBindings,parse,transform} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';
import {translateWithCatalog} from '../lib/i18n-core.ts';
import {translate,languageCatalog} from '../lib/i18n.ts';
import {loadLanguageCatalog,englishCatalog} from '../lib/i18n-client.ts';
import {savePendingAdminJob,readPendingAdminJob,adminJobId} from '../lib/admin-job-record.ts';
import {adminJobProgressWriter} from '../lib/admin-job-progress.ts';
const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'],native=createRequire(import.meta.url);
const prefix='현재 사용자 crontab을 읽을 수 없습니다: ',key=prefix+'{detail}';
test('cron error wrapper localizes known details and preserves original stderr, paths and Korean',async()=>{
 for(const locale of [...locales,'aa']){
  const catalog=locale==='aa'?languageCatalog('en'):languageCatalog(locale),client=await loadLanguageCatalog(locale);
  for(const detail of ['/tmp/$&/path: EACCES','stderr\nline 2','']){
   const raw='  '+prefix+detail+'\n',expected=detail?catalog[key].replace('{detail}',()=>detail):catalog[prefix.trim()]+' ';
   assert.equal(translate(locale,raw),'  '+expected+'\n');assert.equal(translateWithCatalog(locale,raw,undefined,client,englishCatalog),translate(locale,raw));assert.equal(translate('ko',raw),raw);
  }
  const detail='관리 작업을 찾을 수 없습니다.';assert.equal(translate(locale,prefix+detail),catalog[key].replace('{detail}',()=>catalog[detail]));
 }
 assert.equal(translateWithCatalog('en',prefix+'failure',undefined,{},{}),prefix+'failure');
 assert.equal(translateWithCatalog('en',prefix+'failure',undefined,{[prefix+'failure']:'Exact'},{}),'Exact');
});
test('actual cron status failure retains account and disables writes without a false empty-crontab snapshot',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../lib/server-tools.ts',import.meta.url),'utf8'),{filename:'server-tools.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});let calls=0;
 const mocks={'./error-code.ts':{hasErrorCode},'./runtime-paths.ts':{stateRoot:()=>'/fixture'},'node:os':{userInfo:()=>({username:'fixture',uid:1000,gid:1000})},'node:child_process':{execFile:(binary,args,options,callback)=>{calls++;assert.equal(binary,'/usr/bin/crontab');assert.deepEqual(args,['-l']);assert.equal(options.env.LC_ALL,'C');callback(Object.assign(Error('fallback'),{code:2,stderr:'EACCES /tmp/$&/literal'}));}}};
 const module={exports:{}};new Function('require','module','exports',compiled.code)(name=>mocks[name]??(name.startsWith('.')?{}:native(name)),module,module.exports);
 const result=await module.exports.cronStatus();assert.equal(calls,1);assert.deepEqual(result.account,{username:'fixture',uid:1000,gid:1000});assert.equal(result.error,prefix+'EACCES /tmp/$&/literal');assert.equal(result.text,null);assert.equal(result.version,null);assert.equal(result.canApply,false);assert.deepEqual(result.jobs,[]);
 for(const locale of locales){const value=translate(locale,result.error);assert(!/[가-힣]/.test(value));assert(value.endsWith('EACCES /tmp/$&/literal'));}
});
test('administrative record errors and interrupted-job notice have native entries; closed progress rejects late writes',async()=>{
 await loadBindings();const keys=new Set();for(const file of ['admin-job-record','admin-job-progress']){const {literals}=diagnosticCandidates(await parse(await readFile(new URL('../lib/'+file+'.ts',import.meta.url),'utf8'),{filename:file+'.ts',syntax:'typescript'}));for(const key of literals)keys.add(key);}assert.equal(keys.size,3);
 for(const bad of [null,'../escape','unknown'])assert.throws(()=>adminJobId(bad),error=>{assert.equal(error.status,404);for(const locale of locales)assert.notEqual(translate(locale,error.message),error.message);return true;});
 const writes=[],writer=adminJobProgressWriter('/fixture',async(_folder,value)=>writes.push(value));const record={logs:['initial']};writer.write(record);record.logs.push('later');assert.deepEqual(await writer.finish(),{failed:false});assert.deepEqual(writes,[{logs:['initial']}]);assert.throws(()=>writer.write(record),error=>{assert.equal(error.message,'관리 작업 진행 기록이 종료되었습니다.');return true;});
 const root=await mkdtemp('/mnt/data/build/tastedev-linux/admin-cron-translations-'),id='aacdab81-2019-4b5a-9c8c-419a8bc80562';
 try{
  const job={id,status:'running',command:['/usr/bin/certbot','renew','--dry-run'],logs:['fixture result'],startedAt:'2026-10-10T00:00:00Z',exitCode:null};await savePendingAdminJob(root,job);const result=await readPendingAdminJob(root,id);assert.equal(result.status,'recovery-required');assert.equal(result.exitCode,null);assert.deepEqual(result.logs,job.logs);keys.add(result.notice);
  for(const locale of locales){const catalog=languageCatalog(locale);for(const key of keys){assert(Object.hasOwn(catalog,key));assert.equal(translate(locale,key),catalog[key]);assert(!/[가-힣]/.test(catalog[key]));}for(const token of ['Certbot','nginx'])assert(catalog[result.notice].includes(token));}
 }finally{await rm(root,{recursive:true,force:true});}
});
