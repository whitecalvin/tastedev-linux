import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,stat,writeFile,readFile,symlink,link} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {withNetworkSettingsLock,networkSettings,saveNetworkSettings} from '../lib/network-settings.ts';
async function fixture(operation){const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','network-lock-'));try{return await operation(root);}finally{await rm(root,{recursive:true,force:true});}}
test('network save lock blocks overlap, retains its inode, and releases on normal errors',()=>fixture(async root=>{
 let release;const first=withNetworkSettingsLock(root,()=>new Promise(resolve=>release=resolve));
 while(!release)await new Promise(resolve=>setImmediate(resolve));
 const inode=(await stat(join(root,'network-settings.flock'))).ino;
 try{await assert.rejects(withNetworkSettingsLock(root,()=>assert.fail('overlap')),e=>e.status===409);}finally{release();await first;}
 await assert.rejects(withNetworkSettingsLock(root,()=>{throw Error('fixture failure');}),/fixture failure/);
 assert.equal(await withNetworkSettingsLock(root,()=>42),42);assert.equal((await stat(join(root,'network-settings.flock'))).ino,inode);
}));
test('actual holder SIGKILL releases network lock and permits a version-checked settings save',{timeout:15000},()=>fixture(async root=>{
 const old=process.env.LINUX_STATE_ROOT;process.env.LINUX_STATE_ROOT=root;
 const module=new URL('../lib/network-settings.ts',import.meta.url).href;
 const child=spawn(process.execPath,['--input-type=module','-e',`import {withNetworkSettingsLock} from ${JSON.stringify(module)};await withNetworkSettingsLock(${JSON.stringify(root)},async()=>{setInterval(()=>{},1000);process.stdout.write('held\\n');await new Promise(()=>{});});`],{stdio:['ignore','pipe','pipe']});
 const closed=once(child,'close');
 try{
  await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('lock holder did not start')),5000);child.stdout.on('data',data=>{output+=data;if(output.includes('held')){clearTimeout(timer);resolve();}});child.once('error',error=>{clearTimeout(timer);reject(error);});child.once('exit',()=>{clearTimeout(timer);if(!output.includes('held'))reject(Error('holder exited before locking'));});});
  const initial=networkSettings();const request={...initial,externalEnabled:false,host:'127.0.0.1',port:initial.port===8792?8793:8792};
  await assert.rejects(saveNetworkSettings(request),e=>e.status===409);
  child.kill('SIGKILL');await closed;
  const saved=await saveNetworkSettings(request);assert.equal(saved.port,request.port);
  assert.equal(JSON.parse(await readFile(join(root,'network-settings.json'),'utf8')).port,request.port);
  await assert.rejects(saveNetworkSettings(request),e=>e.status===409);
 }finally{if(child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await closed;}if(old===undefined)delete process.env.LINUX_STATE_ROOT;else process.env.LINUX_STATE_ROOT=old;}
}));
test('network lock preserves legacy records and refuses symlink or hardlink lock files',()=>fixture(async root=>{
 const legacy=join(root,'network-settings.lock'),lock=join(root,'network-settings.flock'),target=join(root,'target');
 await writeFile(legacy,'legacy owner');await assert.rejects(withNetworkSettingsLock(root,()=>assert.fail('legacy bypass')),e=>e.status===409);assert.equal(await readFile(legacy,'utf8'),'legacy owner');await rm(legacy);
 await writeFile(target,'unchanged',{mode:0o600});await symlink(target,lock);await assert.rejects(withNetworkSettingsLock(root,()=>assert.fail('symlink bypass')));assert.equal(await readFile(target,'utf8'),'unchanged');await rm(lock);
 await link(target,lock);await assert.rejects(withNetworkSettingsLock(root,()=>assert.fail('hardlink bypass')),e=>e.status===503);assert.equal(await readFile(target,'utf8'),'unchanged');
}));
