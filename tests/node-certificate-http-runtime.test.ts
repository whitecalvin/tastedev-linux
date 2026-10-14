import type {SpawnSyncReturns} from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,symlink,rm} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {adminRuntimeFiles} from '../scripts/admin/runtime-files.mts';
import {startupRuntimeFiles} from '../scripts/startup-runtime-source.ts';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
import {jsonRecord} from '../scripts/verification/http-json.ts';
test('Node22 emitted Node app and certificate record HTTP verifiers preserve actual authenticated lifecycle against the current build',async()=>{
 const ledger=jsonRecord(JSON.parse(await readFile('.runtime/verification/requirements-ledger-current-20261010.json','utf8')));assert(typeof ledger.currentProductionBuildEvidence==='string');const proof=jsonRecord(JSON.parse(await readFile(ledger.currentProductionBuildEvidence,'utf8')));assert(proof.status==='PASS'&&typeof proof.root==='string'&&proof.root.startsWith('/mnt/data/build/tastedev-linux/tastedev-current-build-'));
 const root=await verificationWorkDirectory('node-certificate-http-runtime-');
 const scripts=['scripts/verification/node-app-http.mjs','scripts/verification/certificate-history-http.mjs'];
 const files=[...scripts,...startupRuntimeFiles,...adminRuntimeFiles.map(name=>'lib/'+name),...['work-directory','http-json','nginx-native-report','compiled-source-check'].map(name=>'scripts/verification/'+name+'.mjs'),...['security','audit-log-page','privilege','helper-error','helper-json-output','helper-korean-message','capabilities','admin-job-record','install-job-record'].map(name=>'lib/'+name+'.mjs')];
 try{
  for(const file of new Set(files)){await mkdir(dirname(join(root,file)),{recursive:true,mode:0o700});await writeFile(join(root,file),await readRuntimeModule(file,files),{mode:0o600});}
  await symlink(resolve('node_modules'),join(root,'node_modules'),'dir');
  for(const script of scripts){const run:SpawnSyncReturns<string>=spawnSync('/usr/bin/node',['--no-experimental-strip-types',join(root,script),proof.root],{cwd:process.cwd(),env:process.env,encoding:'utf8',timeout:90000,maxBuffer:1000000});assert.equal(run.status,0,run.stderr||run.stdout);const report=jsonRecord(JSON.parse(run.stdout));assert.equal(report.status,'PASS');assert.equal(report.temporaryServerStopped,true);assert(Array.isArray(report.checks)&&report.checks.length>=8);if(script.includes('node-app')){assert.equal(report.hostOperationalChanges,false);assert.equal(report.realServiceControl,false);}else{assert.equal(report.certificateCommandsExecuted,false);assert.equal(report.installationCommandsExecuted,false);assert.equal(report.operatingMutationsEnabled,false);assert(!('gui' in report));}}
 }finally{await rm(root,{recursive:true,force:true});}
});
