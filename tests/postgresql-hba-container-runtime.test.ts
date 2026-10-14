import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,symlink,rm,readdir,readFile} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {adminRuntimeFiles} from '../scripts/admin/runtime-files.mts';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
import {jsonRecord} from '../scripts/verification/http-json.ts';
test('Node22 emitted HBA native verifier applies, reloads, restores and recovers a killed fixture in a private container',async()=>{
 const candidates=(await readdir('/mnt/data/build/tastedev-linux')).filter(name=>/^node22-portable-[A-Za-z0-9]+$/.test(name));let portable:string|undefined;for(const name of candidates){const metadata=jsonRecord(JSON.parse(await readFile('/mnt/data/build/tastedev-linux/'+name+'/result.json','utf8')));if(metadata.status==='PASS'&&metadata.version==='v22.22.1'&&metadata.binary==='/mnt/data/build/tastedev-linux/'+name+'/node-v22.22.1-linux-x64/bin/node')portable=metadata.binary;}assert(portable,'Official private portable Node22 verification fixture required');
 const root=await verificationWorkDirectory('postgresql-hba-container-runtime-');
 const script='scripts/verify-postgresql-hba-operation-native.mjs';
 const files=[script,'scripts/fixtures/postgresql-hba-operation-driver.mjs','scripts/fixtures/postgresql-hba-crash-driver.mjs','scripts/admin/runtime-files.mjs','scripts/admin/runtime-source.mjs','scripts/runtime-source.mjs','scripts/verification/work-directory.mjs','scripts/verification/http-json.mjs',...adminRuntimeFiles.map(name=>'lib/'+name)];
 try{
  for(const file of new Set(files)){await mkdir(dirname(join(root,file)),{recursive:true,mode:0o700});await writeFile(join(root,file),await readRuntimeModule(file,files),{mode:0o600});}
  await symlink(resolve('node_modules'),join(root,'node_modules'),'dir');
  const run=spawnSync('/usr/bin/node',['--no-experimental-strip-types',script],{cwd:root,env:{...process.env,LINUX_VERIFY_CONTAINER_NODE:portable},encoding:'utf8',timeout:150000,maxBuffer:1000000});assert.equal(run.status,0,run.stderr||run.stdout);const report=jsonRecord(JSON.parse(run.stdout));assert.equal(report.status,'PASS');assert.equal(report.containerNodeVersion,'v22.22.1');assert.equal(report.uid,999);assert.equal(report.cleanupVerified,true);assert.equal(report.operatingClusterAccess,false);assert.equal(report.hostPackageOrServiceChanges,false);assert.equal(report.hostBindMounts,false);assert.equal(report.imagePull,false);assert.equal(report.network,'none');assert(Array.isArray(report.checks));assert.equal(report.checks.length,6);assert(report.checks.some(row=>typeof row==='string'&&row.includes('SIGKILL')));assert.equal(report.productionReloadAcceptanceVerified,false);
 }finally{await rm(root,{recursive:true,force:true});}
});
