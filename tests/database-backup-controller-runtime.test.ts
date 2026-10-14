import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,symlink,rm} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {jsonRecord} from '../scripts/verification/http-json.ts';

test('Node22 typed backup controller executes real helper backups inside an isolated fixture',async()=>{
 const root=await verificationWorkDirectory('database-backup-controller-runtime-');
 const script='scripts/verification/database-backup-isolated.mjs';
 const files=[script,'scripts/runtime-source.mjs','scripts/admin/runtime-source.mjs','scripts/admin/runtime-files.mjs',...['work-directory','http-json','nginx-native-report','compiled-source-check'].map(name=>'scripts/verification/'+name+'.mjs')];
 let passed=false;
 try{
  await symlink(resolve('node_modules'),join(root,'node_modules'),'dir');
  for(const file of files){await mkdir(dirname(join(root,file)),{recursive:true});await writeFile(join(root,file),await readRuntimeModule(file,files));}
  for(const name of ['database-backup-worker','database-backup-command']){
   const worker='scripts/fixtures/'+name+'.mjs',allowed=[worker,'scripts/verification/http-json.mjs','lib/auth-store.mjs','lib/auth-password.mjs','lib/security.mjs'];
   const filename=join(root,worker);await mkdir(dirname(filename),{recursive:true});await writeFile(filename,await readRuntimeModule(worker,allowed));
   assert.equal(spawnSync('/usr/bin/node',['--no-experimental-strip-types','--check',filename],{encoding:'utf8'}).status,0);
   const refused=spawnSync('/usr/bin/node',['--no-experimental-strip-types',filename],{encoding:'utf8',timeout:10000});
   assert.equal(refused.status,1);assert(refused.stderr.includes('AssertionError'),refused.stderr);
  }
  const invalid=spawnSync('/usr/bin/node',['--no-experimental-strip-types',join(root,script),'--next-build','relative-path'],{encoding:'utf8',timeout:10000});
  assert.equal(invalid.status,1);assert(invalid.stderr.includes('absolute source build'));
  const run=spawnSync('/usr/bin/node',['--no-experimental-strip-types',join(root,script)],{env:process.env,encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024});
  await writeFile(join(root,'stdout.log'),run.stdout);await writeFile(join(root,'stderr.log'),run.stderr);
  assert.equal(run.status,0,run.stderr+'\n'+run.stdout);
  const result=jsonRecord(JSON.parse(run.stdout.trim()));assert.equal(result.status,'PASS');assert(typeof result.evidence==='string');
  const stored=jsonRecord(JSON.parse(await readFile(result.evidence,'utf8')));
  assert.equal(stored.hostOperationalChanges,false);assert.equal(stored.networkIsolated,true);
  assert.equal(stored.operatingDatabaseVerified,false);assert.equal(stored.serviceControlVerified,false);assert.equal(stored.realSudoVerified,false);
  assert(Array.isArray(stored.checks));assert.equal(stored.checks.length,5);passed=true;
 }finally{if(passed)await rm(root,{recursive:true,force:true});}
});
