import test from 'node:test';
import assert from 'node:assert/strict';
import {rm,stat,writeFile,readFile,symlink,link} from 'node:fs/promises';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {withSystemSettingsLock,systemSettings,saveSystemSettings} from '../lib/system-settings.ts';
async function fixture(operation){const root=await verificationWorkDirectory('tastedev-system-lock-');try{return await operation(root);}finally{await rm(root,{recursive:true,force:true});}}
test('system settings save lock blocks overlap, retains its inode, and releases on normal errors',()=>fixture(async root=>{
 let release;const first=withSystemSettingsLock(root,()=>new Promise(resolve=>release=resolve));
 while(!release)await new Promise(resolve=>setImmediate(resolve));
 const inode=(await stat(join(root,'system-settings.flock'))).ino;
 try{await assert.rejects(withSystemSettingsLock(root,()=>assert.fail('overlap')),e=>e.status===409);}finally{release();await first;}
 await assert.rejects(withSystemSettingsLock(root,()=>{throw Error('fixture failure');}),/fixture failure/);
 assert.equal(await withSystemSettingsLock(root,()=>42),42);assert.equal((await stat(join(root,'system-settings.flock'))).ino,inode);
}));
test('actual holder SIGKILL releases system settings lock and permits a version-checked settings save',{timeout:15000},()=>fixture(async root=>{
 const old=process.env.LINUX_STATE_ROOT;process.env.LINUX_STATE_ROOT=root;
 const module=new URL('../lib/system-settings.ts',import.meta.url).href;
 const child=spawn(process.execPath,['--input-type=module','-e',`import {withSystemSettingsLock} from ${JSON.stringify(module)};await withSystemSettingsLock(${JSON.stringify(root)},async()=>{setInterval(()=>{},1000);process.stdout.write('held\\n');await new Promise(()=>{});});`],{stdio:['ignore','pipe','pipe']});
 const closed=once(child,'close');
 try{
  await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('lock holder did not start')),5000);child.stdout.on('data',data=>{output+=data;if(output.includes('held')){clearTimeout(timer);resolve();}});child.once('error',error=>{clearTimeout(timer);reject(error);});child.once('exit',()=>{clearTimeout(timer);if(!output.includes('held'))reject(Error('holder exited before locking'));});});
  const initial=systemSettings();const request={...initial,logLines:300,logRefreshSeconds:10};
  await assert.rejects(saveSystemSettings(request),e=>e.status===409);
  child.kill('SIGKILL');await closed;
  const saved=await saveSystemSettings(request);assert.equal(saved.logLines,request.logLines);
  assert.equal(JSON.parse(await readFile(join(root,'system-settings.json'),'utf8')).logLines,request.logLines);
  await assert.rejects(saveSystemSettings(request),e=>e.status===409);
 }finally{if(child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await closed;}if(old===undefined)delete process.env.LINUX_STATE_ROOT;else process.env.LINUX_STATE_ROOT=old;}
}));
test('system settings lock preserves legacy records and refuses symlink or hardlink lock files',()=>fixture(async root=>{
 const legacy=join(root,'system-settings.lock'),lock=join(root,'system-settings.flock'),target=join(root,'target');
 await writeFile(legacy,'legacy owner');await assert.rejects(withSystemSettingsLock(root,()=>assert.fail('legacy bypass')),e=>e.status===409);assert.equal(await readFile(legacy,'utf8'),'legacy owner');await rm(legacy);
 await writeFile(target,'unchanged',{mode:0o600});await symlink(target,lock);await assert.rejects(withSystemSettingsLock(root,()=>assert.fail('symlink bypass')));assert.equal(await readFile(target,'utf8'),'unchanged');await rm(lock);
 await link(target,lock);await assert.rejects(withSystemSettingsLock(root,()=>assert.fail('hardlink bypass')),e=>e.status===503);assert.equal(await readFile(target,'utf8'),'unchanged');
}));
