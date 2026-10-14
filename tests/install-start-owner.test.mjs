import {hasErrorCode} from '../lib/error-code.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {setTimeout as delay} from 'node:timers/promises';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {readInstallJob,saveInstallJob} from '../lib/install-job-record.ts';
import {observeInstallJob,installProcessIdentity} from '../lib/install-job-monitor.ts';
import {installProcessOutput} from '../lib/install-process-output.ts';

test('original installer stores a real owner identity and completes without a stale monitoring warning',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','install-start-owner-')),native=createRequire(import.meta.url);
 const oldRoot=process.env.LINUX_AUTH_ROOT,oldEnabled=process.env.LINUX_ENABLE_INSTALL;let child;
 try{
  process.env.LINUX_AUTH_ROOT=root;process.env.LINUX_ENABLE_INSTALL='true';
  await loadBindings();const compiled=await transform(await readFile(new URL('../lib/packages.ts',import.meta.url),'utf8'),{filename:'packages.mjs',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});
  const mocks={
   './error-code.ts':{hasErrorCode},
   './runtime-paths.ts':{stateRoot:()=>root},'./install-job-record.ts':{readInstallJob,saveInstallJob},
   './install-job-monitor.ts':{observeInstallJob,installProcessIdentity},'./install-process-output.ts':{installProcessOutput},
   './inventory-snapshot.ts':{inventorySnapshot:load=>load},'./security.ts':{auditEvent:async()=>{}},
   './privilege.ts':{helperStatus:()=>({ready:true}),spawnHelper:(action,input)=>{assert.equal(action,'install');assert.deepEqual(input,{packages:['nginx'],confirm:true});child=spawn(process.execPath,['-e',"setTimeout(()=>{console.log(JSON.stringify({logs:'테스트 설치 출력\\n'}));},300)"]);return child;}},
   'node:fs/promises':{...native('node:fs/promises'),readFile:(file,...args)=>file==='/etc/os-release'?Promise.resolve('ID=debian\n'):native('node:fs/promises').readFile(file,...args)},
  };
  const module={exports:{}};new Function('require','module','exports',compiled.code)(name=>Object.hasOwn(mocks,name)?mocks[name]:name.startsWith('.')?{}:native(name),module,module.exports);
  const job=await module.exports.startInstall(['nginx']),lock=join(root,'install-jobs/install.lock');
  const owner=JSON.parse(await readFile(lock,'utf8'));assert.equal(owner.jobId,job.id);assert.equal(owner.identity,await installProcessIdentity(process.pid));
  assert.equal((await module.exports.getJob()).monitoringUnavailable,undefined);
  let final;
  for(let attempt=0;attempt<100;attempt++){final=await module.exports.getJob();if(final.status==='success')break;await delay(10);}
  assert.equal(final.status,'success');assert.equal(final.exitCode,0);assert.deepEqual(final.logs,['테스트 설치 출력']);assert.equal(final.monitoringUnavailable,undefined);
  for(let attempt=0;attempt<100;attempt++){try{await readFile(lock);}catch(error){if(error.code==='ENOENT')break;throw error;}await delay(10);}
  await assert.rejects(readFile(lock),{code:'ENOENT'});
 }finally{
  child?.kill();if(oldRoot===undefined)delete process.env.LINUX_AUTH_ROOT;else process.env.LINUX_AUTH_ROOT=oldRoot;
  if(oldEnabled===undefined)delete process.env.LINUX_ENABLE_INSTALL;else process.env.LINUX_ENABLE_INSTALL=oldEnabled;
  await rm(root,{recursive:true,force:true});
 }
});
