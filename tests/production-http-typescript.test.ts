import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,rm,symlink,cp,readFile} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
import {jsonRecord} from '../scripts/verification/http-json.ts';
test('Node22 emitted production HTTP controller rejects relative snapshots and exercises the current compiled app',async()=>{
 const root=await verificationWorkDirectory('production-http-typescript-');
 const script='scripts/verification/production-http.mjs';
 const files=[script,'scripts/build-workspace.mjs',...['compiled-source-check','page-redirect','http-json','nginx-native-report'].map(name=>'scripts/verification/'+name+'.mjs'),...['i18n','i18n-core','language-preference','install-job-monitor','auth-password','auth-store','runtime-paths','error-code','system-settings'].map(name=>'lib/'+name+'.mjs')];
 let passed=false;
 try{
  await symlink(resolve('node_modules'),join(root,'node_modules'),'dir');
  for(const file of files){await mkdir(dirname(join(root,file)),{recursive:true,mode:0o700});await writeFile(join(root,file),await readRuntimeModule(file,files),{mode:0o600});}
  await cp('lib/locales',join(root,'lib/locales'),{recursive:true});
  const check=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--check',join(root,script)],{encoding:'utf8'});assert.equal(check.status,0,check.stderr);
  const invalid=spawnSync('/usr/bin/node',['--no-experimental-strip-types',join(root,script),'relative-source'],{encoding:'utf8',timeout:10000});assert.equal(invalid.status,1);assert(invalid.stderr.includes('Pass an absolute compiled source snapshot'));assert(!invalid.stderr.includes('MODULE_NOT_FOUND'));
  const ledger=jsonRecord(JSON.parse(await readFile('.runtime/verification/completion-blocker-audit-current.json','utf8')));assert(typeof ledger.currentProductionBuildEvidence==='string');const compiled=jsonRecord(JSON.parse(await readFile(ledger.currentProductionBuildEvidence,'utf8')));const build=process.env.LINUX_VERIFY_COMPILED_SOURCE||compiled.root;assert(typeof build==='string');
  const run=spawnSync('/usr/bin/node',['--no-experimental-strip-types',join(root,script),build],{encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024});
  await writeFile(join(root,'stdout.log'),run.stdout);await writeFile(join(root,'stderr.log'),run.stderr);assert.equal(run.status,0,run.stderr);
  const lines=run.stdout.trim().split('\n');const result=jsonRecord(JSON.parse(lines.at(-1)||'null'));assert.equal(result.status,'PASS');assert(typeof result.evidence==='string');
  const evidence=jsonRecord(JSON.parse(await readFile(result.evidence,'utf8')));assert.equal(evidence.sourceFiles,compiled.sourceFiles);assert.equal(evidence.temporaryServerStopped,true);assert(Array.isArray(evidence.checks));assert.equal(evidence.checks.length,38);assert(evidence.checks.some(value=>typeof value==='string'&&value.startsWith('ca-ES saved cookie')));assert(evidence.checks.some(value=>typeof value==='string'&&value.startsWith('hi-IN saved cookie')));passed=true;
 }finally{if(passed)await rm(root,{recursive:true,force:true});}
});
