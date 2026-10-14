import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,rm} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
test('Node22 systemd verifier plan exposes exact disposable scope and non-root execution stops before operations',async()=>{
 assert.notEqual(process.getuid?.(),0);const root=await verificationWorkDirectory('postgresql-systemd-plan-runtime-');
 const script='scripts/verification/postgresql-systemd-fixture.mjs';const files=[script,...['http-json','work-directory','nginx-native-report'].map(name=>'scripts/verification/'+name+'.mjs'),'lib/error-code.mjs'];
 try{
  for(const file of files){await mkdir(dirname(join(root,file)),{recursive:true,mode:0o700});await writeFile(join(root,file),await readRuntimeModule(file,files),{mode:0o600});}
  for(const mode of [[],['--daemon-only']]){const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',script,'--plan',...mode],{cwd:root,encoding:'utf8',timeout:10000});assert.equal(result.status,0,result.stderr);const plan:unknown=JSON.parse(result.stdout);assert(object(plan));assert.equal(plan.host,'192.168.0.103');assert.equal(plan.cluster,'linuxverify20261008');assert.equal(plan.unit,'postgresql@18-linuxverify20261008.service');assert.equal(plan.tcpListener,false);assert.equal(plan.automaticStartup,false);assert.equal(plan.existingClusterChanged,false);assert(Array.isArray(plan.operations)&&plan.operations.length>=6);}
  const prepared=spawnSync(process.execPath,[resolve('scripts/verification/postgresql-systemd-source.ts')],{cwd:process.cwd(),env:process.env,encoding:'utf8',maxBuffer:16000000,timeout:30000});assert.equal(prepared.status,0,prepared.stderr);const payload:unknown=JSON.parse(prepared.stdout);assert(object(payload)&&payload.format==='tastedev-postgresql-systemd-source-v1'&&typeof payload.fixture==='string'&&object(payload.files));assert(Object.keys(payload.files).length>100);const streamed=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--input-type=module','-','--plan'],{cwd:root,input:payload.fixture,encoding:'utf8',timeout:10000});assert.equal(streamed.status,0,streamed.stderr);const streamedPlan:unknown=JSON.parse(streamed.stdout);assert(object(streamedPlan)&&streamedPlan.cluster==='linuxverify20261008');
  const rejected=spawnSync('/usr/bin/node',['--no-experimental-strip-types',script,'--execute'],{cwd:root,env:{...process.env,TASTEDEV_SYSTEMD_VERIFY_CONFIRM:''},encoding:'utf8',timeout:10000});assert.equal(rejected.status,1);assert(rejected.stderr.includes('AssertionError'));assert(!rejected.stderr.includes('MODULE_NOT_FOUND'));
 }finally{await rm(root,{recursive:true,force:true});}
});
