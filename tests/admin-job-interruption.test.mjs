import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm,chmod,readFile,writeFile,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {savePendingAdminJob,readPendingAdminJob,completedAdminJobs,saveCompletedAdminJob} from '../lib/admin-job-record.ts';
const id='aacdab81-2019-4b5a-9c8c-419a8bc80562';
const pending={id,status:'running',command:['/usr/bin/certbot','renew','--dry-run'],logs:[],startedAt:'2026-10-07T00:00:00Z',exitCode:null};
test('unfinished certificate intent survives server restart without claiming success, failure or releasing its lock',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','certificate-interruption-')),folder=join(root,'certificate-jobs');
 try{
  await savePendingAdminJob(folder,pending);await mkdir(join(root,'server-tools'),{mode:0o700});const lock=join(root,'server-tools','admin.lock');await writeFile(lock,'fixture lock',{mode:0o600});
  const script="import {operationJob,operationHistory} from './lib/server-tools.ts';process.stdout.write(JSON.stringify({job:await operationJob(process.argv[1]),history:await operationHistory()}));";
  const {stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',script,id],{cwd:new URL('..',import.meta.url),env:{...process.env,LINUX_AUTH_ROOT:root,LINUX_STATE_ROOT:root},timeout:10000});
  const result=JSON.parse(stdout);assert.equal(result.job.status,'recovery-required');assert.equal(result.job.exitCode,null);assert.equal(result.job.finishedAt,undefined);assert.match(result.job.notice,/종료 결과/);assert.match(result.job.notice,/자동 재실행하지 않습니다/);assert.equal(result.history.jobs[0].status,'recovery-required');assert.equal(await readFile(lock,'utf8'),'fixture lock');
  assert.equal(JSON.parse(await readFile(join(folder,id+'.pending.json'),'utf8')).status,'running','query does not rewrite the original intent');
 }finally{await rm(root,{recursive:true,force:true});}
});
test('completed result takes precedence over intent and publication remains exclusive',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','certificate-intent-complete-'));
 try{
  await savePendingAdminJob(root,pending);await assert.rejects(savePendingAdminJob(root,pending),error=>error.status===409);
  for(const status of ['success','failed']){
   const target=status==='success'?pending:{...pending,id:'bbcdab81-2019-4b5a-9c8c-419a8bc80562'};
   if(status==='failed')await savePendingAdminJob(root,target);
   await saveCompletedAdminJob(root,{...target,status,exitCode:status==='success'?0:1,finishedAt:'2026-10-07T00:00:01Z'});
  }
  const history=await completedAdminJobs(root);assert.equal(history.jobs.length,2);assert.deepEqual(new Set(history.jobs.map(job=>job.status)),new Set(['success','failed']));assert.equal(history.warnings,0);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('unsafe or malformed pending records never become recoverable jobs',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','certificate-intent-invalid-'));
 try{
  for(const changed of [{status:'success'},{exitCode:0},{finishedAt:'2026-10-07T00:00:01Z'},{signal:'SIGTERM'},{command:['/bin/sh']}])await assert.rejects(savePendingAdminJob(root,{...pending,...changed}),error=>error.status===409);
  await savePendingAdminJob(root,pending);const file=join(root,id+'.pending.json');await chmod(file,0o644);await assert.rejects(readPendingAdminJob(root,id),error=>error.status===403);await chmod(file,0o600);
  await writeFile(file,'{ broken',{mode:0o600});assert.equal((await completedAdminJobs(root)).warnings,1);
  const linked=join(root,'linked');await symlink(root,linked);await assert.rejects(readPendingAdminJob(linked,id),error=>error.status===403);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('the live process reports running jobs while fresh processes require completion review',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','certificate-intent-live-'));
 try{
  await savePendingAdminJob(join(root,'certificate-jobs'),pending);
  const script="globalThis.__linuxAdminOperations=new Map([[process.argv[1],JSON.parse(process.argv[2])]]);const {operationJob,operationHistory}=await import('./lib/server-tools.ts');process.stdout.write(JSON.stringify({job:await operationJob(process.argv[1]),history:await operationHistory()}));";
  const {stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',script,id,JSON.stringify(pending)],{cwd:new URL('..',import.meta.url),env:{...process.env,LINUX_AUTH_ROOT:root,LINUX_STATE_ROOT:root},timeout:10000});
  const result=JSON.parse(stdout);assert.equal(result.job.status,'running');assert.equal(result.history.jobs.length,1);assert.equal(result.history.jobs[0].status,'running');assert.equal(result.history.jobs[0].logs,undefined);assert.equal(result.history.jobs[0].command,undefined);
 }finally{await rm(root,{recursive:true,force:true});}
});
