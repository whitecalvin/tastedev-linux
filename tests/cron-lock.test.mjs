import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,readFile,chmod,symlink,link,stat} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {withCronLock} from '../lib/cron-lock.ts';
const fixture=async fn=>{const folder=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','cron-lock-test-'));try{return await fn(folder);}finally{await rm(folder,{recursive:true,force:true});}};
test('cron flock rejects overlap and reuses its private inode after release',()=>fixture(async folder=>{
 let release;const first=withCronLock(folder,()=>new Promise(resolve=>{release=resolve;}));
 while(!release)await new Promise(resolve=>setImmediate(resolve));
 const inode=(await stat(path.join(folder,'cron.flock'))).ino;
 try{await assert.rejects(withCronLock(folder,()=>assert.fail('overlap')),e=>e.status===409);}finally{release();await first;}
 assert.equal(await withCronLock(folder,()=>42),42);assert.equal((await stat(path.join(folder,'cron.flock'))).ino,inode);
 await assert.rejects(withCronLock(folder,()=>{throw Error('fixture operation failed');}),/fixture operation failed/);
 assert.equal(await withCronLock(folder,()=>43),43);
}));
test('kernel releases cron flock after abrupt holder death',{timeout:15000},()=>fixture(async folder=>{
 const module=new URL('../lib/cron-lock.ts',import.meta.url).href;
 const code=`import {withCronLock} from ${JSON.stringify(module)};await withCronLock(${JSON.stringify(folder)},async()=>{setInterval(()=>{},1000);process.stdout.write('held\\n');await new Promise(()=>{});});`;
 const child=spawn(process.execPath,['--input-type=module','-e',code],{stdio:['ignore','pipe','pipe']});
 const closed=once(child,'close');let output='';
 try{
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('holder did not acquire lock')),5000);child.stdout.on('data',data=>{output+=data;if(output.includes('held')){clearTimeout(timer);resolve();}});child.once('error',error=>{clearTimeout(timer);reject(error);});child.once('exit',()=>{clearTimeout(timer);if(!output.includes('held'))reject(Error('holder exited early'));});});
  await assert.rejects(withCronLock(folder,()=>assert.fail('live holder bypass')),e=>e.status===409);
  child.kill('SIGKILL');await closed;
  assert.equal(await withCronLock(folder,()=> 'restarted'),'restarted');
 }finally{if(child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await closed;}}
}));
test('cron lock refuses unsafe symlink public and hardlink files',()=>fixture(async folder=>{
 const lock=path.join(folder,'cron.flock'),target=path.join(folder,'target');await writeFile(target,'unchanged',{mode:0o600});
 await symlink(target,lock);await assert.rejects(withCronLock(folder,()=>assert.fail('symlink')));assert.equal(await readFile(target,'utf8'),'unchanged');await rm(lock);
 await link(target,lock);await assert.rejects(withCronLock(folder,()=>assert.fail('hardlink')),e=>e.status===403);await rm(lock);
 await writeFile(lock,'',{mode:0o600});await chmod(lock,0o644);await assert.rejects(withCronLock(folder,()=>assert.fail('public')),e=>e.status===403);
}));
test('legacy cron lock is preserved and never treated as a stale kernel lock',()=>fixture(async folder=>{
 const legacy=path.join(folder,'cron.lock');await writeFile(legacy,'legacy owner fixture',{mode:0o600});
 await assert.rejects(withCronLock(folder,()=>assert.fail('legacy lock bypass')),e=>e.status===409);assert.equal(await readFile(legacy,'utf8'),'legacy owner fixture');
}));
