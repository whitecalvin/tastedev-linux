import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
import {readRuntimeModule} from '../scripts/runtime-source.ts';

test('Node22 package harness confines HTTP, strips inherited secrets and stops its actual synthetic server',async()=>{
 const root=await verificationWorkDirectory('package-server-harness-'),app=join(root,'app'),bin=join(root,'bin');
 const files=['scripts/verification/package-server-harness.mjs','scripts/verification/work-directory.mjs','lib/error-code.mjs'];
 try{
  await mkdir(app);await mkdir(bin);
  for(const file of files){await mkdir(dirname(join(root,file)),{recursive:true});await writeFile(join(root,file),await readRuntimeModule(file,files));}
  const server=join(root,'synthetic-server.mjs');
  await writeFile(server,"import http from 'node:http';import {writeFileSync} from 'node:fs';const port=Number(process.argv[process.argv.indexOf('--port')+1]);const server=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({privateKeyPresent:Boolean(process.env.FIXTURE_API_KEY),nodeOptionsPresent:Boolean(process.env.NODE_OPTIONS),admin:process.env.LINUX_ENABLE_ADMIN,terminal:process.env.LINUX_ENABLE_TERMINAL,auth:process.env.LINUX_AUTH_ROOT}));});server.listen(port,'127.0.0.1',()=>console.log('Ready'));process.once('SIGTERM',()=>server.close(()=>{writeFileSync(new URL('./stopped',import.meta.url),'closed');process.exit(0);}));");
  await writeFile(join(bin,'npm'),"#!/bin/sh\nexec /usr/bin/node "+server+" \"$@\"\n",{mode:0o700});
  const worker=join(root,'verify.mjs');
  await writeFile(worker,"import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createPackageServerHarness} from './scripts/verification/package-server-harness.mjs';process.env.FIXTURE_API_KEY='synthetic-only';process.env.LINUX_ENABLE_ADMIN='true';process.env.NODE_OPTIONS='--invalid-fixture-option';const root=new URL('./',import.meta.url).pathname.slice(0,-1);process.env.PATH=root+'/bin:/usr/bin:/bin';const harness=await createPackageServerHarness(root+'/app',root);try{await harness.waitReady();const response=await harness.packageFetch('http://127.0.0.1:'+harness.port+'/status?marker=SyntheticQueryOnly');assert.equal(response.status,200);const data=await response.json();assert.equal(data.privateKeyPresent,false);assert.equal(data.nodeOptionsPresent,false);assert.equal(data.admin,'false');assert.equal(data.terminal,'false');assert.equal(data.auth,root+'/isolated-auth');await assert.rejects(harness.packageFetch('http://example.invalid/'),/Unexpected package/);await assert.rejects(harness.packageFetch('http://127.0.0.1:1/'),/Unexpected package/);assert((await readFile(harness.cliFile,'utf8')).includes('not an executable'));const evidence=await harness.recordFailure(Error('synthetic fixture failure'));const record=JSON.parse(await readFile(evidence,'utf8'));assert.equal(record.status,'FAIL');assert.equal(record.lastRequestPath,'/status');assert(!JSON.stringify(record).includes('SyntheticQueryOnly'));}finally{await harness.close();await harness.close();}assert.equal(await readFile(root+'/stopped','utf8'),'closed');console.log('PASS');");
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{env:process.env,encoding:'utf8',timeout:15000});await writeFile(join(root,'stdout.log'),result.stdout);await writeFile(join(root,'stderr.log'),result.stderr);assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'PASS');assert.equal(await readFile(join(root,'stopped'),'utf8'),'closed');
 }finally{await rm(root,{recursive:true,force:true});}
});
