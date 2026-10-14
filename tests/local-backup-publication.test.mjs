import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readdir,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('local cron backups publish complete records and ignore interrupted staging files during concurrent catalog reads',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-local-backup-publication-')),previous=process.env.LINUX_STATE_ROOT,admin=process.env.LINUX_ENABLE_ADMIN;
 process.env.LINUX_STATE_ROOT=root;process.env.LINUX_ENABLE_ADMIN='false';
 try{
  const {createBackup,backupCatalog,backupPreview}=await import('../lib/operations.ts');
  const folder=join(root,'server-tools');await mkdir(folder,{recursive:true,mode:0o700});
  await writeFile(join(folder,'.abandoned.pending'),'{incomplete',{mode:0o600});
  const expected=new Map();let done=false;
  const publishing=Promise.all(Array.from({length:12},(_,i)=>{
   const text='# cron snapshot '+i+'\n'+('한글 backup '+i+'\n').repeat(12000);
   return createBackup('cron','current-user',text).then(record=>{expected.set(record.id,text);return record;});
  })).finally(()=>{done=true;});
  let observations=0;
  do{const catalog=await backupCatalog();assert.deepEqual(catalog.warnings,[]);for(const item of catalog.backups){const record=await backupPreview(item.id);assert(record.text.startsWith('# cron snapshot '));assert.equal(item.sha256,record.sha256);}observations++;}while(!done);
  const records=await publishing;assert(observations>0);assert.equal((await backupCatalog()).backups.length,12);
  for(const record of records)assert.equal((await backupPreview(record.id)).text,expected.get(record.id));
  const entries=await readdir(folder);assert.deepEqual(entries.filter(name=>name.endsWith('.pending')),['.abandoned.pending']);
  await assert.rejects(createBackup('cron','current-user','x'.repeat(1048577)));
  assert.equal((await backupCatalog()).backups.length,12,'oversized input must not publish an unreadable backup');
 }finally{if(previous===undefined)delete process.env.LINUX_STATE_ROOT;else process.env.LINUX_STATE_ROOT=previous;if(admin===undefined)delete process.env.LINUX_ENABLE_ADMIN;else process.env.LINUX_ENABLE_ADMIN=admin;await rm(root,{recursive:true,force:true});}
});

test('a real publisher SIGKILL before rename leaves no visible backup',async()=>{
 const {spawn}=await import('node:child_process');const {once}=await import('node:events');
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-local-backup-kill-'));let child,closed;
 try{
  const original=await readFile(new URL('../lib/operations.ts',import.meta.url),'utf8');
  const checkpoint='    await file.sync();';assert.equal(original.split(checkpoint).length,2);
  // Only the fixture adds a checkpoint; production code is not modified.
  const instrumented=original.replace(/from '([.][/]([^']+))'/g,(_,relative)=>'from '+JSON.stringify(new URL('../lib/'+relative.slice(2),import.meta.url).href)).replace(checkpoint,checkpoint+"process.send({stage:'synced'});await new Promise(()=>{});");
  await loadBindings();const {code}=await transform(instrumented,{filename:'publisher.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'es6'}});
  const module=join(root,'publisher.mjs');await writeFile(module,code);
  child=spawn(process.execPath,['--input-type=module','-e',`import {createBackup} from ${JSON.stringify(new URL('file://'+module).href)};await createBackup('cron','current-user',${JSON.stringify('snapshot\n')});`],{env:{...process.env,LINUX_STATE_ROOT:join(root,'state'),LINUX_ENABLE_ADMIN:'false'},stdio:['ignore','ignore','pipe','ipc']});
  let diagnostic='';child.stderr.on('data',chunk=>{diagnostic+=chunk;});closed=once(child,'close');const message=await Promise.race([once(child,'message'),closed.then(()=>{throw Error('publisher exited before checkpoint: '+diagnostic);}),new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('checkpoint timeout')),5000);timer.unref();})]);assert.equal(message[0].stage,'synced');
  child.kill('SIGKILL');await closed;
  const entries=await readdir(join(root,'state/server-tools'));assert.equal(entries.filter(name=>name.endsWith('.backup.json')).length,0);assert.equal(entries.filter(name=>name.endsWith('.pending')).length,1);
 }finally{if(child&&child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await closed;}await rm(root,{recursive:true,force:true});}
});
