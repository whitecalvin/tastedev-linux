import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,copyFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {adminRuntimeFiles} from '../scripts/admin/runtime-files.mts';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
import {jsonRecord,recordField} from '../scripts/verification/http-json.ts';
test('Node22 emitted PostgreSQL tools contain private native diagnostics and preserve ten real multifile restore scenarios',async()=>{
 const root=await verificationWorkDirectory('postgresql-diagnostics-restore-runtime-');
 const scripts=['scripts/verify-postgresql-private-diagnostics-host.mjs','scripts/verify-postgresql-graph-restore-host.mjs'];
 const files=[...scripts,'scripts/postgresql-restore-fixture-worker.mjs','scripts/build-workspace.mjs','scripts/verification/work-directory.mjs','scripts/verification/http-json.mjs',...adminRuntimeFiles.map(name=>'lib/'+name)];
 try{
  for(const file of new Set(files)){await mkdir(dirname(join(root,file)),{recursive:true,mode:0o700});await writeFile(join(root,file),await readRuntimeModule(file,files),{mode:0o600});}
  // Exact source bytes are retained for the verifiers' source fingerprints;
  // child execution and all runtime imports use emitted MJS.
  for(const name of adminRuntimeFiles)await copyFile('lib/'+name.replace(/\.mjs$/,'.ts'),join(root,'lib',name.replace(/\.mjs$/,'.ts')));
  for(const script of scripts){const run=spawnSync('/usr/bin/node',['--no-experimental-strip-types',script],{cwd:root,env:process.env,encoding:'utf8',timeout:90000,maxBuffer:1000000});assert.equal(run.status,0,run.stderr||run.stdout);assert.equal(run.stderr,'');assert(!run.stdout.includes('private-setting-value'));const report=jsonRecord(JSON.parse(run.stdout));assert.equal(report.status,'PASS');assert(Array.isArray(report.checks));assert.equal(report.operatingConfigurationChanged,false);assert.equal(report.operatingServiceChanged,false);assert.equal(report.rootHelperInvoked,false);if(script.includes('diagnostics'))assert.equal(report.checks.length,2);else{assert.equal(report.checks.length,20);assert.equal(report.realServiceActivation,false);assert.equal(report.serviceCallbacks,'fixture-only');assert(report.checks.some(row=>typeof row==='string'&&row.startsWith('process-interruption:')));assert(Object.keys(recordField(report,'sourceSha256')).every(file=>file.endsWith('.ts')));}}
 }finally{await rm(root,{recursive:true,force:true});}
});
