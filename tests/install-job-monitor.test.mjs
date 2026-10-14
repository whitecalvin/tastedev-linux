import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {observeInstallJob,installProcessIdentity} from '../lib/install-job-monitor.ts';

test('real owner exit produces a review warning without changing the running record or lock',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','install-monitor-')),file=join(root,'install.lock');
 const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)']);
 const job={id:'test-job',status:'running',logs:['기존 설치 로그'],exitCode:null};
 try{
  await once(child,'spawn');
  const text=JSON.stringify({pid:child.pid,jobId:job.id,identity:await installProcessIdentity(child.pid)});await writeFile(file,text,{mode:0o600});
  assert.equal(await observeInstallJob(job,file),job);
  const exited=once(child,'exit');child.kill('SIGTERM');await exited;
  const value=await observeInstallJob(job,file);
  assert.equal(value.monitoringUnavailable,true);assert.equal(value.status,'running');assert.deepEqual(value.logs,job.logs);
  assert(value.monitoringMessage.includes('아직 실행 중일 수'));assert.equal(await readFile(file,'utf8'),text);
  assert(!Object.hasOwn(job,'monitoringUnavailable'));
 }finally{child.kill();await rm(root,{recursive:true,force:true});}
});
test('missing/mismatched/symlink locks require review, permission-limited alive owner is retained',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','install-monitor-')),file=join(root,'install.lock'),job={id:'test-job',status:'running'};
 try{
  assert.equal((await observeInstallJob(job,file)).monitoringUnavailable,true);
  await writeFile(file,JSON.stringify({pid:process.pid,jobId:'other'}),{mode:0o600});
  assert.equal((await observeInstallJob(job,file)).monitoringUnavailable,true);
  await writeFile(file,JSON.stringify({pid:process.pid,jobId:job.id,identity:await installProcessIdentity(process.pid)}));
  assert.equal(await observeInstallJob(job,file,{probe:()=>{throw Object.assign(Error('permission'),{code:'EPERM'});}}),job);
  await symlink(file,join(root,'link'));assert.equal((await observeInstallJob(job,join(root,'link'))).monitoringUnavailable,true);
  const done={...job,status:'success'};assert.equal(await observeInstallJob(done,'/unread'),done);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('a live PID with a different start identity or a legacy PID-only lock remains unproven',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','install-monitor-')),file=join(root,'install.lock'),job={id:'test-job',status:'running'};
 try{
  const current=await installProcessIdentity(process.pid);
  for(const owner of [{pid:process.pid,jobId:job.id},{pid:process.pid,jobId:job.id,identity:current+'0'}]){
   const text=JSON.stringify(owner);await writeFile(file,text,{mode:0o600});
   assert.equal((await observeInstallJob(job,file)).monitoringUnavailable,true);
   assert.equal(await readFile(file,'utf8'),text);
  }
 }finally{await rm(root,{recursive:true,force:true});}
});
