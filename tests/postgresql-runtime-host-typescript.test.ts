import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,copyFile,symlink,rm,readFile} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {adminRuntimeFiles} from '../scripts/admin/runtime-files.mts';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
import {jsonRecord} from '../scripts/verification/http-json.ts';
test('Node22 emitted runtime host verifies real private postmaster, restore and conflict preservation without a TypeScript loader',async()=>{
 const root=await verificationWorkDirectory('postgresql-runtime-host-typescript-');
 const host='scripts/verify-postgresql-runtime-host.mjs',worker='scripts/verify-postgresql-runtime-worker.mjs';
 const files=[host,worker,...adminRuntimeFiles.map(name=>'lib/'+name),'scripts/admin/runtime-files.mjs','scripts/runtime-source.mjs','scripts/verification/work-directory.mjs','scripts/verification/http-json.mjs','scripts/verification/nginx-native-report.mjs'];
 try{
  for(const file of new Set(files)){await mkdir(dirname(join(root,file)),{recursive:true,mode:0o700});await writeFile(join(root,file),await readRuntimeModule(file,files),{mode:0o600});}
  // Retain exact TS source alongside emitted modules for the verifier's source
  // hashes. Node22 execution is explicitly forbidden from loading these files.
  for(const file of ['lib/postgresql-graph-restore-stages.ts','lib/postgresql-code-restore.ts','lib/postgresql-reviewed-graph-restore.ts','lib/postgresql-graph-swap.ts','lib/postgresql-graph-swap-recovery.ts','lib/postgresql-graph-swap-progress.ts','lib/postgresql-hba-service.ts','lib/postgresql-config-service.ts','lib/postgresql-code-operation.ts','lib/config-transaction.ts','lib/postgresql-config-validation.ts','scripts/verify-postgresql-runtime-host.ts','scripts/verify-postgresql-runtime-worker.ts'])await copyFile(file,join(root,file));
  await symlink(resolve('node_modules'),join(root,'node_modules'),'dir');
  const invalid=spawnSync('/usr/bin/node',['--no-experimental-strip-types',host,'invalid'],{cwd:root,env:process.env,encoding:'utf8',timeout:10000});assert.equal(invalid.status,1);assert(invalid.stderr.includes('AssertionError'));assert(!invalid.stderr.includes('MODULE_NOT_FOUND'));
  const run=spawnSync('/usr/bin/node',['--no-experimental-strip-types',host],{cwd:root,env:process.env,encoding:'utf8',timeout:90000});assert.equal(run.status,0,run.stderr||run.stdout);const report=jsonRecord(JSON.parse(run.stdout));assert.equal(report.status,'PASS');assert.equal(report.checks,19);assert.equal(report.realPostmasterStarted,true);assert.equal(report.operatingServiceChanged,false);assert.equal(report.privateFixtureCleanupVerified,true);assert(typeof report.evidence==='string');const evidence=jsonRecord(JSON.parse(await readFile(report.evidence,'utf8')));assert.equal(evidence.separatePidNamespaceVerified,true);assert.equal(evidence.separateNetworkNamespaceVerified,true);assert.equal(evidence.realConcurrentEditPreserved,true);assert.equal(evidence.realStartupFailureRollbackVerified,true);assert.equal(evidence.systemdManager,'fixture-only');
 }finally{await rm(root,{recursive:true,force:true});}
});
test('Typed MTS emission keeps Unicode spans and dynamic imports inside the caller allowlist',async()=>{
 const root=await verificationWorkDirectory('mts-runtime-source-');
 const files=['main.mjs','dependency.mjs'];
 try{
  await writeFile(join(root,'dependency.mts'),'export const value:number=7;\n',{mode:0o600});
  await writeFile(join(root,'main.mts'),"// 한국어 바이트 경계\nimport {value} from './dependency.mts';\nconst again=await import('./dependency.mts');console.log(value+again.value);\n",{mode:0o600});
  for(const file of files)await writeFile(join(root,file),await readRuntimeModule(file,files,root),{mode:0o600});
  const run=spawnSync('/usr/bin/node',['--no-experimental-strip-types',join(root,'main.mjs')],{encoding:'utf8',timeout:10000});assert.equal(run.status,0,run.stderr);assert.equal(run.stdout.trim(),'14');
  await rm(join(root,'main.mjs'));await assert.rejects(readRuntimeModule('main.mjs',['main.mjs'],root),/Unapproved typed admin dependency/);
 }finally{await rm(root,{recursive:true,force:true});}
});
