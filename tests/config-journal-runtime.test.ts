import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readAdminRuntimeModule} from '../scripts/admin/runtime-source.mts';

test('fixed helper journal and lease modules run in Node22 and preserve interrupted records without TS loading',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-config-journal-runtime-'));
 try{
  for(const file of ['config-journal.mjs','config-operation-lease.mjs','error-code.mjs'])await writeFile(join(root,file),await readAdminRuntimeModule(file),{mode:0o600});
  const worker=join(root,'worker.mjs');await writeFile(worker,`import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {createConfigJournal,readConfigJournal,clearConfigJournal,assertConfigJournalClear} from './config-journal.mjs';import {acquireConfigOperationLease} from './config-operation-lease.mjs';const root=new URL('.',import.meta.url).pathname.slice(0,-1),backup=root+'/backups',target=root+'/target';await mkdir(backup,{mode:0o700});const record={backupId:'12345678-1234-1234-1234-123456789abc',kind:'configuration-transaction-v1',target,originalVersion:'a'.repeat(64),draftVersion:'b'.repeat(64),originalIdentity:{dev:1,ino:1,uid:1,gid:1,mode:384},stagedIdentity:{dev:1,ino:2,uid:1,gid:1,mode:384},temp:'.tastedev-config-12345678-1234-1234-1234-123456789abc'};await createConfigJournal(record,backup);const current=await readConfigJournal(target,backup);assert.deepEqual(current.record,record);await assert.rejects(assertConfigJournalClear(target,backup));await assert.rejects(createConfigJournal({...record,temp:42},backup));await clearConfigJournal(target,current,backup);assert.equal(await readConfigJournal(target,backup),null);const release=await acquireConfigOperationLease(root+'/lock');await assert.rejects(acquireConfigOperationLease(root+'/lock'));await release();await release();console.log('PASS');`,{mode:0o600});
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{encoding:'utf8',env:process.env});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'PASS');
 }finally{await rm(root,{recursive:true,force:true});}
});
