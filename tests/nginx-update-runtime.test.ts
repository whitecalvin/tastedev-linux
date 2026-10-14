import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readAdminRuntimeModule} from '../scripts/admin/runtime-source.mts';

test('fixed helper nginx file update runs Node22 candidate review and rollback with synthetic hooks',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-nginx-update-runtime-'));
 try{
  for(const file of ['nginx-file-update.mjs','nginx-isolate-output.mjs','nginx-config-paths.mjs','nginx-syntax.mjs','nginx-setting-name.mjs','nginx-server-presets.mjs','config-transaction.mjs','config-journal.mjs','config-operation-lease.mjs','error-code.mjs'])await writeFile(join(root,file),await readAdminRuntimeModule(file),{mode:0o600});
  const worker=join(root,'worker.mjs');await writeFile(worker,`import assert from 'node:assert/strict';import {mkdir,writeFile,readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {updateNginxFile} from './nginx-file-update.mjs';import {isolateNginxOutput} from './nginx-isolate-output.mjs';const root=new URL('.',import.meta.url).pathname.slice(0,-1),base=root+'/nginx',backupRoot=root+'/backups',original='events {}\\nhttp {}\\n';await mkdir(base,{mode:0o700});await mkdir(backupRoot,{mode:0o700});await writeFile(base+'/nginx.conf',original,{mode:0o600});let reviewed=0,recovered=0;const result=await updateNginxFile({path:'/etc/nginx/nginx.conf',text:'events { worker_connections 16; }\\nhttp {}\\n',version:createHash('sha256').update(original).digest('hex'),confirm:true},{base,backupRoot,inspectGraph:async info=>assert.equal(info.target,'/etc/nginx/nginx.conf'),validatePrepared:async info=>{assert.match(await readFile(info.candidate,'utf8'),/worker_connections 16/);reviewed++;},activate:async()=>{throw Error('synthetic reload failure');},recover:async()=>recovered++});assert.equal(result.restored,true);assert.equal(result.recovered,true);assert.equal(reviewed,1);assert.equal(recovered,1);assert.equal(await readFile(base+'/nginx.conf','utf8'),original);const isolated=isolateNginxOutput('pid /private/pid; events {} http { access_log /private/log combined; }',root+'/tastedev-nginx-candidate-fixture');assert(!isolated.includes('/private/'));assert.match(isolated,/combined/);console.log('PASS');`,{mode:0o600});
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{encoding:'utf8',env:process.env,timeout:15000});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'PASS');
 }finally{await rm(root,{recursive:true,force:true});}
});
