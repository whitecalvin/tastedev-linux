import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';

test('emitted admin record storage preserves pending recovery and completion in Node 22 without TS loading',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-admin-record-runtime-'));
 try{
  const allowed=['lib/admin-job-record.mjs','lib/error-code.mjs'];await mkdir(join(root,'lib'),{mode:0o700});
  for(const file of allowed){await writeFile(join(root,file),await readRuntimeModule(file,allowed),{mode:0o600});}
  const worker=join(root,'worker.mjs');await writeFile(worker,`import assert from 'node:assert/strict';import {savePendingAdminJob,readPendingAdminJob,savePendingAdminJobProgress,saveCompletedAdminJob,readCompletedAdminJob,completedAdminJobs} from './lib/admin-job-record.mjs';const folder=new URL('./jobs/',import.meta.url).pathname,id='aacdab81-2019-4b5a-9c8c-419a8bc80562',record={id,status:'running',command:['/usr/bin/certbot','renew'],logs:[],startedAt:'2026-10-06T00:00:00Z',exitCode:null};await savePendingAdminJob(folder,record);record.logs=['한글 진행 😀'];await savePendingAdminJobProgress(folder,record);const pending=await readPendingAdminJob(folder,id);assert.equal(pending.status,'recovery-required');assert.deepEqual(pending.logs,record.logs);const done={...record,status:'success',exitCode:0,finishedAt:'2026-10-06T00:00:01Z'};await saveCompletedAdminJob(folder,done);assert.deepEqual(await readCompletedAdminJob(folder,id),done);assert.equal((await completedAdminJobs(folder)).jobs[0].status,'success');await assert.rejects(savePendingAdminJobProgress(folder,record),e=>e.status===409);console.log('PASS');`,{mode:0o600});
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{encoding:'utf8',env:process.env});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'PASS');
 }finally{await rm(root,{recursive:true,force:true});}
});
