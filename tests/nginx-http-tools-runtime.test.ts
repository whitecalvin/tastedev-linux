import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
test('Node22 emitted nginx HTTP tools verify 30 own upstream/proxy/TLS behaviors and stop every fixture server',async()=>{
 const root=await verificationWorkDirectory('nginx-http-tools-runtime-');
 const tools=['nginx-upstream-http-local','nginx-tls-http-local','nginx-proxy-http-local'];
 const files=[...tools.map(name=>'scripts/verification/'+name+'.mjs'),...['work-directory','nginx-native-report','http-json'].map(name=>'scripts/verification/'+name+'.mjs'),...['nginx-syntax','nginx-setting-name','nginx-server-presets','error-code'].map(name=>'lib/'+name+'.mjs')];
 try{
  for(const file of files){await mkdir(dirname(join(root,file)),{recursive:true,mode:0o700});await writeFile(join(root,file),await readRuntimeModule(file,files),{mode:0o600});}
  const counts=[9,10,11];
  for(let index=0;index<tools.length;index++){
   const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types','scripts/verification/'+tools[index]+'.mjs'],{cwd:root,env:process.env,encoding:'utf8',timeout:45000});assert.equal(result.status,0,result.stderr||result.stdout);const summary:unknown=JSON.parse(result.stdout);assert(object(summary)&&summary.status==='PASS'&&typeof summary.evidence==='string');assert(summary.evidence.startsWith('/mnt/data/build/tastedev-linux/'));
   const report:unknown=JSON.parse(await readFile(join(summary.evidence,'result.json'),'utf8'));assert(object(report)&&Array.isArray(report.checks));assert.equal(report.checks.length,counts[index]);assert.equal(report.fixtureRemoved,true);assert.equal(report.temporaryNginxStopped,true);assert.equal(report.operatingServicesChanged,false);if(tools[index]!=='nginx-tls-http-local')assert.equal(report.temporaryUpstreamsStopped,true);assert(typeof report.binarySHA256==='string'&&/^[a-f0-9]{64}$/.test(report.binarySHA256));
  }
 }finally{await rm(root,{recursive:true,force:true});}
});
