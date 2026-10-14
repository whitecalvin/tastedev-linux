import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,symlink,rm} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {adminRuntimeFiles} from '../scripts/admin/runtime-files.mts';
import {jsonRecord} from '../scripts/verification/http-json.ts';

test('Node22 administrator lock fixture verifies real supervisor lifetime and four controller recoveries in a disposable container',async()=>{
 const root=await verificationWorkDirectory('admin-lock-controller-runtime-'),script='scripts/verify-admin-lock-native.mjs';
 const files=[script,'scripts/runtime-source.mjs','scripts/admin/runtime-source.mjs','scripts/admin/runtime-files.mjs',...['work-directory','http-json','nginx-native-report'].map(name=>'scripts/verification/'+name+'.mjs')];
 const portable='/mnt/data/build/tastedev-linux/node22-portable-mwFoEi/node-v22.22.1-linux-x64/bin/node';
 let passed=false;
 try{
  await symlink(resolve('node_modules'),join(root,'node_modules'),'dir');
  for(const file of files){await mkdir(dirname(join(root,file)),{recursive:true});await writeFile(join(root,file),await readRuntimeModule(file,files));}
  for(const name of ['admin-lock-native-driver','admin-lock-native-parent']){
   const file='scripts/fixtures/'+name+'.mjs',filename=join(root,file),allowed=[file,...adminRuntimeFiles.map(name=>'lib/'+name)];
   await mkdir(dirname(filename),{recursive:true});await writeFile(filename,await readRuntimeModule(file,allowed));
   const syntax=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--check',filename],{encoding:'utf8'});assert.equal(syntax.status,0,syntax.stderr);
   const refusal=spawnSync('/usr/bin/node',['--no-experimental-strip-types',filename],{encoding:'utf8',timeout:10000});assert.equal(refusal.status,1);assert(refusal.stderr.includes('AssertionError'));
  }
  const invalid=spawnSync('/usr/bin/node',['--no-experimental-strip-types',join(root,script),'--node-binary','relative'],{encoding:'utf8',timeout:10000});
  assert.equal(invalid.status,1);assert(invalid.stderr.includes('AssertionError'));
  const run=spawnSync('/usr/bin/node',['--no-experimental-strip-types',join(root,script),'--node-binary',portable],{env:process.env,encoding:'utf8',timeout:150000,maxBuffer:4*1024*1024});
  await writeFile(join(root,'stdout.log'),run.stdout);await writeFile(join(root,'stderr.log'),run.stderr);
  assert.equal(run.status,0,run.stderr+'\n'+run.stdout);
  const result=jsonRecord(JSON.parse(run.stdout.trim()));assert.equal(result.status,'PASS');assert(typeof result.evidence==='string');
  const stored=jsonRecord(JSON.parse(await readFile(result.evidence,'utf8')));
  assert(typeof stored.nodeVersion==='string'&&stored.nodeVersion.startsWith('v22.'));
  assert.equal(stored.hostBindMounts,false);assert.equal(stored.network,'none');assert.equal(stored.cleanupVerified,true);
  assert.equal(stored.hostPackageOrServiceChanges,false);assert.equal(stored.databaseConnections,false);
  assert(Array.isArray(stored.checks));assert.equal(stored.checks.length,13);passed=true;
 }finally{if(passed)await rm(root,{recursive:true,force:true});}
});
