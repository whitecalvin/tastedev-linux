import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm,chmod,readFile,symlink,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {savePendingAdminJob,savePendingAdminJobProgress,readPendingAdminJob,saveCompletedAdminJob} from '../lib/admin-job-record.ts';
import {adminJobProgressWriter} from '../lib/admin-job-progress.ts';
import {execFile,spawn} from 'node:child_process';import {promisify} from 'node:util';import {once} from 'node:events';
const id='aacdab81-2019-4b5a-9c8c-419a8bc80562',record={id,status:'running',command:['/usr/bin/certbot','renew','--dry-run'],logs:[],startedAt:'2026-10-08T00:00:00Z',exitCode:null};
test('running backup and Korean output snapshots survive a fresh server process without releasing the lock',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','certificate-progress-')),folder=join(root,'certificate-jobs');try{
  await savePendingAdminJob(folder,record);await writeFile(join(root,'admin.lock'),'held',{mode:0o600});const writer=adminJobProgressWriter(folder),active=structuredClone(record);
  active.logs.push(JSON.stringify({logs:'nginx 설정 백업 · /etc/nginx/nginx.conf · '+id+'\n'}));writer.write(active);active.logs.push(JSON.stringify({logs:'한글 진행 😀\n'}));writer.write(active);active.status='failed';
  assert.deepEqual(await writer.finish(),{failed:false});
  const code="import {operationJob} from './lib/server-tools.ts';console.log(JSON.stringify(await operationJob(process.argv[1])));";
  const {stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',code,id],{cwd:new URL('..',import.meta.url),env:{...process.env,LINUX_AUTH_ROOT:root,LINUX_STATE_ROOT:root},timeout:10000});
  const recovered=JSON.parse(stdout);assert.equal(recovered.status,'recovery-required');assert.equal(recovered.logs.length,2);assert.match(recovered.logs[0],/nginx.conf/);assert.match(recovered.logs[1],/한글/);assert.equal(recovered.exitCode,null);assert.equal(await readFile(join(root,'admin.lock'),'utf8'),'held');
  await saveCompletedAdminJob(folder,{...record,logs:recovered.logs,status:'failed',exitCode:1});await assert.rejects(savePendingAdminJobProgress(folder,record),e=>e.status===409);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('progress cannot create a new intent, change command or start time, or replace an unsafe file',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','certificate-progress-reject-'));try{
  await assert.rejects(savePendingAdminJobProgress(root,record),e=>e.status===404);await savePendingAdminJob(root,record);
  for(const patch of [{startedAt:'2026-10-08T00:00:01Z'},{command:['/usr/bin/certbot','delete']},{status:'success'},{logs:['x'.repeat(8001)]}])await assert.rejects(savePendingAdminJobProgress(root,{...record,...patch}),e=>e.status===409);
  const file=join(root,id+'.pending.json');await chmod(file,0o644);await assert.rejects(savePendingAdminJobProgress(root,record),e=>e.status===403);await chmod(file,0o600);await rm(file);const original=join(root,'original');await writeFile(original,'untouched',{mode:0o600});await symlink(original,file);await assert.rejects(savePendingAdminJobProgress(root,record));assert.equal(await readFile(original,'utf8'),'untouched');
 }finally{await rm(root,{recursive:true,force:true});}
});
test('serialized progress catches write failures, captures snapshots, and waits before completion',async()=>{
 const seen=[];let release;const writer=adminJobProgressWriter('/private-fixture',async(folder,snapshot)=>{seen.push(snapshot.logs.slice());if(seen.length===1)await new Promise(resolve=>release=resolve);if(seen.length===2)throw Error('private disk failure');});
 const active=structuredClone(record);active.logs=['first'];writer.write(active);active.logs=['second'];writer.write(active);active.logs=['third'];writer.write(active);
 let finished=false;const done=writer.finish().then(value=>{finished=true;return value;});await Promise.resolve();assert.equal(finished,false);release();assert.deepEqual(await done,{failed:true});assert.deepEqual(seen,[['first'],['second'],['third']]);assert.throws(()=>writer.write(record),/종료/);
});
test('SIGKILL of the owning process leaves durable progress for a fresh process without claiming completion',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','certificate-progress-kill-'));let child;
 try{
  const worker="import {savePendingAdminJob} from './lib/admin-job-record.ts';import {adminJobProgressWriter} from './lib/admin-job-progress.ts';import {writeFile} from 'node:fs/promises';const folder=process.argv[1]+'/certificate-jobs',record=JSON.parse(process.argv[2]);await savePendingAdminJob(folder,record);await writeFile(process.argv[1]+'/admin.lock','held',{mode:0o600});const writer=adminJobProgressWriter(folder);record.logs=[JSON.stringify({logs:'백업 ID · '+record.id+'\\n한글 중단 검수 😀\\n'})];writer.write(record);if((await writer.finish()).failed)throw Error('Progress did not persist');process.stdout.write('READY\\n');setInterval(()=>{},1000);";
  child=spawn(process.execPath,['--input-type=module','-e',worker,root,JSON.stringify(record)],{cwd:new URL('..',import.meta.url),stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Worker readiness timeout')),10000);let output='';child.stdout.on('data',chunk=>{output+=chunk;if(output.includes('READY\n')){clearTimeout(timer);resolve();}});child.once('error',error=>{clearTimeout(timer);reject(error);});child.once('exit',()=>{clearTimeout(timer);if(!output.includes('READY\n'))reject(Error('Worker exited before progress persistence'));});});
  const closed=once(child,'close');child.kill('SIGKILL');assert.deepEqual(await closed,[null,'SIGKILL']);
  const {stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',"import {operationJob} from './lib/server-tools.ts';console.log(JSON.stringify(await operationJob(process.argv[1])));",id],{cwd:new URL('..',import.meta.url),env:{...process.env,LINUX_AUTH_ROOT:root,LINUX_STATE_ROOT:root},timeout:10000});
  const recovered=JSON.parse(stdout);assert.equal(recovered.status,'recovery-required');assert.match(recovered.logs[0],/백업 ID/);assert.match(recovered.logs[0],/한글 중단 검수/);assert.equal(recovered.exitCode,null);assert.equal(recovered.finishedAt,undefined);assert.equal(await readFile(join(root,'admin.lock'),'utf8'),'held');
 }finally{if(child&&child.exitCode===null&&child.signalCode===null){const closed=once(child,'close');child.kill('SIGKILL');await closed;}await rm(root,{recursive:true,force:true});}
});
