import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
test('Node22 emitted nginx syntax verifiers run 445 native checks, preserve two unsupported proposals, and stop own mapping server without a TS loader',async()=>{
 const root=await verificationWorkDirectory('nginx-native-tools-runtime-');
 const tools=['nginx-valueless-local','nginx-upstream-local','nginx-tls-local','nginx-core-blocks-local','nginx-main-local','nginx-events-local','nginx-http-core-local','nginx-proxy-local','nginx-mapping-local'];
 const files=[...tools.map(name=>'scripts/verification/'+name+'.mjs'),'scripts/verification/nginx-native-report.mjs','scripts/verification/work-directory.mjs',...['nginx-syntax','nginx-setting-name','nginx-server-presets','nginx-upstream-settings','nginx-tls-settings','nginx-presets','nginx-main-settings','nginx-http-core-settings','nginx-proxy-settings','nginx-protocol-help','nginx-module-settings','nginx-mapping-help'].map(name=>'lib/'+name+'.mjs')];
 try{
  for(const file of files){await mkdir(dirname(join(root,file)),{recursive:true,mode:0o700});await writeFile(join(root,file),await readRuntimeModule(file,files),{mode:0o600});}
  const counts=[3,17,60,11,17,5,117,209,8];
  for(let index=0;index<tools.length;index++){
   const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types','scripts/verification/'+tools[index]+'.mjs'],{cwd:root,env:process.env,encoding:'utf8',timeout:45000});assert.equal(result.status,0,result.stderr||result.stdout);const summary:unknown=JSON.parse(result.stdout);assert(object(summary)&&summary.status===(tools[index]==='nginx-main-local'?'PARTIAL':'PASS')&&typeof summary.evidence==='string');assert(summary.evidence.startsWith('/mnt/data/build/tastedev-linux/'));
   const report:unknown=JSON.parse(await readFile(join(summary.evidence,'result.json'),'utf8'));assert(object(report)&&Array.isArray(report.checks));assert.equal(report.checks.length,counts[index]);assert.equal(report.fixtureRemoved,true);if(tools[index]==='nginx-mapping-local'){assert.equal(report.serverStarted,true);assert.equal(report.temporaryServerStopped,true);assert.equal(report.operationalFilesChanged,false);}else assert(report.serverStarted===false||report.operatingServicesChanged===false);if(tools[index]==='nginx-main-local'){const pending=report.checks.filter((row:unknown)=>object(row)&&row.status==='NOT_RUN');assert.equal(pending.length,2);assert.deepEqual(pending.map((row:unknown)=>{assert(object(row));return row.name;}).sort(),['load_module','ssl_engine']);}assert(typeof report.binarySHA256==='string'&&/^[a-f0-9]{64}$/.test(report.binarySHA256));
  }
 }finally{await rm(root,{recursive:true,force:true});}
});
