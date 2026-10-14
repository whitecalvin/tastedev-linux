import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {loadBindings,parse,transform} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';
import {translate,languageCatalog} from '../lib/i18n.ts';
import {preparePostgresqlBackupLookup,preparePostgresqlConfigBackup} from '../lib/postgresql-backup-request.ts';
import {createPostgresqlHbaBackup,postgresqlHbaBackups} from '../lib/postgresql-hba-backups.ts';
import {publishPostgresqlRestoreBackup} from '../lib/postgresql-restore-undo-backup.ts';
const locales=['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk'],native=createRequire(import.meta.url);
const localized=(error,status)=>{assert.equal(error.status,status);for(const locale of locales){assert.notEqual(translate(locale,error.message),error.message);assert(!/[가-힣]/.test(translate(locale,error.message)));}assert.equal(translate('ko',error.message),error.message);return true;};
test('all static PostgreSQL backup and reviewed-recovery diagnostics have direct native catalog entries',async()=>{
 await loadBindings();const keys=new Set();for(const file of ['postgresql-backup-request','postgresql-config-backup','postgresql-hba-backups','postgresql-restore-undo-backup','postgresql-reviewed-graph-recovery']){const extension=['postgresql-backup-request','postgresql-config-backup','postgresql-hba-backups','postgresql-restore-undo-backup','postgresql-reviewed-graph-recovery'].includes(file)?'.ts':'.mjs';const {literals}=diagnosticCandidates(await parse(await readFile(new URL('../lib/'+file+extension,import.meta.url),'utf8'),{filename:file+extension,...(extension==='.ts'?{syntax:'typescript'}:{})}));literals.forEach(key=>keys.add(key));}assert(keys.size>=7);
 for(const locale of locales){const catalog=languageCatalog(locale);for(const key of keys){assert(Object.hasOwn(catalog,key),locale+': '+key);assert.equal(translate(locale,key),catalog[key]);assert(!/[가-힣]/.test(catalog[key]));if(key.includes('PostgreSQL'))assert(catalog[key].includes('PostgreSQL'));}}
});
test('backup request and unsafe record guards reject before accessing arbitrary paths',async()=>{
 for(const value of ['../escape','/etc/passwd','/etc/postgresql/16/main/pg_hba.conf',123])assert.throws(()=>preparePostgresqlBackupLookup(value),error=>localized(error,400));
 const input={path:'/etc/postgresql/16/main/postgresql.conf',version:'a'.repeat(64),confirm:true};assert.deepEqual(preparePostgresqlConfigBackup(input),input);assert.deepEqual(preparePostgresqlBackupLookup(undefined),{});
 for(const change of [{confirm:false},{version:'stale'},{ownerUid:0},{path:null}])assert.throws(()=>preparePostgresqlConfigBackup({...input,...change}),error=>localized(error,400));
 await assert.rejects(createPostgresqlHbaBackup({path:'/etc/passwd',version:'a'.repeat(64)}),error=>localized(error,400));await assert.rejects(postgresqlHbaBackups({path:input.path,unexpected:true}),error=>localized(error,400));await assert.rejects(publishPostgresqlRestoreBackup({id:'../escape'},'/unused',()=>{}),error=>localized(error,409));
});
test('verified recovery retention failure stays distinct from original recovery failure',async()=>{
 await loadBindings();const {code}=await transform(await readFile(new URL('../lib/postgresql-reviewed-graph-recovery.ts',import.meta.url),'utf8'),{filename:'postgresql-reviewed-graph-recovery.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});let recoveryCalls=0,retentionCalls=0;
 const marker=Error('fixture retention failed');const mocks={'./postgresql-graph-restore-journal.ts':{assertPostgresqlGraphRestoreJournal:async journal=>journal,postgresqlGraphRestoreJournalBody:()=>({ownerUid:1000}),postgresqlGraphRestoreJournalServiceContext:()=>({scope:{unit:'fixture.service'}})},'./postgresql-code-operation.ts':{postgresqlCodeDependencies:()=>({control:async()=>{}})},'./postgresql-graph-swap-progress.ts':{readPostgresqlGraphSwapProgress:async()=>({fixture:true})},'./postgresql-graph-swap-recovery.ts':{recoverPostgresqlGraphSwap:async()=>{recoveryCalls++;return {restored:true,journalId:'fixture-journal',phase:'rolled-back',filesystemRecoveryVerified:true,serviceCoordinatorInvoked:true,intentPreserved:true};}},'./postgresql-completed-restore.ts':{completePostgresqlGraphRestore:async()=>{retentionCalls++;throw marker;}}};
 const module={exports:{}};new Function('require','module','exports',code)(name=>mocks[name]??(name.startsWith('.')?{}:native(name)),module,module.exports);const journal={record:{id:'fixture-journal'}},options={inspectService:async()=>{},inspectRecovery:async()=>{},validateOriginal:async()=>{}};
 await assert.rejects(module.exports.recoverReviewedPostgresqlGraph(journal,'/unused',{...options,retainCompleted:'yes'}),error=>localized(error,409));assert.equal(recoveryCalls,0);
 await assert.rejects(module.exports.recoverReviewedPostgresqlGraph(journal,'/unused',options),error=>{assert.equal(error.rollbackComplete,true);assert.equal(error.retentionComplete,false);assert.equal(error.journalId,'fixture-journal');assert.equal(error.cause,marker);assert.equal(error.message,'PostgreSQL 원본 복구는 확인됐지만 완료 기록 보관을 확인하세요.');return localized(error,409);});
 assert.deepEqual(await module.exports.recoverReviewedPostgresqlGraph(journal,'/unused',{...options,retainCompleted:false}),{restored:true,journalId:'fixture-journal',phase:'rolled-back',filesystemRecoveryVerified:true,serviceCoordinatorInvoked:true,intentPreserved:true});assert.equal(recoveryCalls,2);assert.equal(retentionCalls,1);
});
