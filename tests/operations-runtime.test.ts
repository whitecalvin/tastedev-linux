import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';

test('Node22 operation guards and local cron backup publication run plain JavaScript with denied native dependencies',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','operations-runtime-'));
 try{
  const dependencies:Record<string,string>={
   'system-settings':'export const systemSettings=()=>({logLines:150,logRefreshSeconds:10});',
   'node-app-service-status':'export const nodeAppServiceInventory=async()=>({services:[],warnings:[]});',
   'postgresql-cluster-status':'export const discoverPostgresqlClusters=async()=>[];export const postgresqlClusterStatuses=async()=>[];',
   'postgresql-service-request':'export const postgresqlServiceRequest=()=>{throw Error("unexpected cluster request")};',
   'manual-backup-request':'export const manualBackupRequest=()=>{throw Error("unexpected backup request")};',
   'security':'export const assertFeature=()=>{throw Error("unexpected mutation")};export const auditEvent=async()=>{};',
   'cron-lock':'export const withCronLock=()=>{throw Error("unexpected cron mutation")};',
   'cron-install':'export const installCron=()=>{throw Error("unexpected cron installation")};',
   'runtime-paths':`export const stateRoot=()=>${JSON.stringify(join(root,'state'))};`,
   'privilege':'export const adminConfigured=()=>false;export const helperStatus=()=>({ready:false,reason:"fixture"});export const runHelper=()=>{throw Error("unexpected helper execution")};',
  };
  const allowed=['lib/operations.mjs','lib/error-code.mjs',...Object.keys(dependencies).map(name=>'lib/'+name+'.mjs')];
  for(const file of ['operations','error-code'])await writeFile(join(root,file+'.mjs'),await readRuntimeModule('lib/'+file+'.mjs',allowed),{mode:0o600});
  for(const [name,source] of Object.entries(dependencies))await writeFile(join(root,name+'.mjs'),source,{mode:0o600});
  const worker=join(root,'worker.mjs');await writeFile(worker,`import assert from 'node:assert/strict';import {createBackup,backupPreview,backupCatalog,serviceCommand,logCommand,controlService,restoreBackup} from './operations.mjs';assert.deepEqual(serviceCommand('nginx.service','reload'),['/usr/bin/systemctl','--no-ask-password','reload','nginx.service']);assert.throws(()=>serviceCommand('arbitrary.service','start'));assert.throws(()=>logCommand('nginx.service',null,123));await assert.rejects(controlService(null),{status:400});await assert.rejects(controlService({unit:'nginx.service',action:'start',confirm:true}),{status:403});const text='# private fixture cron\\n',record=await createBackup('cron','current-user',text);assert.equal((await backupPreview(record.id)).text,text);const catalog=await backupCatalog();assert.equal(catalog.backups.length,1);assert.equal(catalog.backups[0].id,record.id);assert(!JSON.stringify(catalog).includes(text));await assert.rejects(restoreBackup({id:record.id,confirm:false}),{status:400});await assert.rejects(restoreBackup({id:record.id,confirm:true}),{status:403});console.log('PASS');`,{mode:0o600});
  const environment:NodeJS.ProcessEnv={...process.env,LINUX_ENABLE_CRON:'false',LINUX_ENABLE_ADMIN:'false'};delete environment.NODE_TEST_CONTEXT;
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{encoding:'utf8',env:environment,timeout:15000});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'PASS');
 }finally{await rm(root,{recursive:true,force:true});}
});
