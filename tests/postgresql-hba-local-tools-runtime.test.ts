import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {adminRuntimeFiles} from '../scripts/admin/runtime-files.mts';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
test('Node22 emitted local HBA verifier runs seven real private parser cases without a TypeScript loader',async()=>{
 const root=await verificationWorkDirectory('postgresql-hba-local-tools-runtime-');
 const script='scripts/verification/postgresql-hba-local.mjs';
 const files=[script,'scripts/verification/work-directory.mjs','scripts/verification/nginx-native-report.mjs',...adminRuntimeFiles.map(name=>'lib/'+name),'lib/postgresql-hba.mjs'];
 try{
  for(const file of new Set(files)){await mkdir(dirname(join(root,file)),{recursive:true,mode:0o700});await writeFile(join(root,file),await readRuntimeModule(file,files),{mode:0o600});}
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',script],{cwd:root,env:process.env,encoding:'utf8',timeout:30000});assert.equal(result.status,0,result.stderr||result.stdout);const report:unknown=JSON.parse(result.stdout);assert(object(report)&&report.status==='PASS'&&Array.isArray(report.checks)&&typeof report.evidence==='string');assert.equal(report.checks.length,7);assert.equal(report.operatingFilesChanged,false);assert.equal(report.postmasterStarted,false);assert(!result.stdout.includes('secret_value'));
  const saved:unknown=JSON.parse(await readFile(report.evidence,'utf8'));assert(object(saved)&&saved.fixtureCleaned===true);
 }finally{await rm(root,{recursive:true,force:true});}
});
