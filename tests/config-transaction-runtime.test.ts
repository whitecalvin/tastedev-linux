import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readAdminRuntimeModule} from '../scripts/admin/runtime-source.mts';

test('fixed helper transaction runs Node22 file rollback and explicit recovery without TS loading or service commands',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-config-transaction-runtime-'));
 try{
  for(const file of ['config-transaction.mjs','config-journal.mjs','config-operation-lease.mjs','error-code.mjs'])await writeFile(join(root,file),await readAdminRuntimeModule(file),{mode:0o600});
  const worker=join(root,'worker.mjs');await writeFile(worker,`import assert from 'node:assert/strict';import {mkdir,writeFile,readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {configTransaction,recoverConfigTransaction} from './config-transaction.mjs';import {readConfigJournal} from './config-journal.mjs';const root=new URL('.',import.meta.url).pathname.slice(0,-1),file=root+'/config',backupRoot=root+'/backups',original='port 6379\\n';await mkdir(backupRoot,{mode:0o700});await writeFile(file,original,{mode:0o600});const version=createHash('sha256').update(original).digest('hex'),options={file,backupRoot,version,transform:()=> 'port 6380\\n',validate:async path=>{assert.equal(await readFile(path,'utf8'),'port 6380\\n');},activate:async()=>{throw Error('synthetic activation failure');},recover:async()=>{throw Error('synthetic recovery failure');}};const failed=await configTransaction(options);assert.equal(failed.restored,true);assert.equal(failed.recovered,false);assert.equal(await readFile(file,'utf8'),original);assert(await readConfigJournal(file,backupRoot));await assert.rejects(configTransaction(options),e=>e.status===409);let activated=0;const recovered=await recoverConfigTransaction({file,backupRoot,confirm:true,beforeRecovery:async()=>{},validate:async path=>assert.equal(await readFile(path,'utf8'),original),recover:async()=>activated++});assert.equal(recovered.recovered,true);assert.equal(activated,1);assert.equal(await readConfigJournal(file,backupRoot),null);const applied=await configTransaction({...options,activate:async()=>activated++,recover:async()=>{}});assert.equal(applied.changed,true);assert.equal(await readFile(file,'utf8'),'port 6380\\n');assert.equal(activated,2);console.log('PASS');`,{mode:0o600});
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{encoding:'utf8',env:process.env});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'PASS');
 }finally{await rm(root,{recursive:true,force:true});}
});
