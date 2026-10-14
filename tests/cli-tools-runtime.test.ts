import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {startupRuntimeFiles} from '../scripts/startup-runtime-source.ts';

test('Node22 emitted startup, CLI preparation, cargo dispatch and test runner preserve their runtime contracts',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','cli-tools-runtime-'));
 try{
  const allowed=[...startupRuntimeFiles,'scripts/run-tests.mjs','scripts/build-workspace.mjs','scripts/desktop-cargo.mjs','scripts/desktop-cargo-paths.mjs'];
  for(const file of allowed){await mkdir(dirname(join(root,file)),{recursive:true,mode:0o700});await writeFile(join(root,file),await readRuntimeModule(file,allowed),{mode:0o600});}
  const environment:NodeJS.ProcessEnv={...process.env,LINUX_PACKAGED:'false',LINUX_STATE_ROOT:join(root,'state'),LINUX_AUTH_ROOT:join(root,'auth'),LINUX_HOST:'127.0.0.1',PORT:'9876'};delete environment.NODE_TEST_CONTEXT;
  const run=(file:string,args:string[]=[],env:NodeJS.ProcessEnv=environment)=>spawnSync('/usr/bin/node',['--no-experimental-strip-types',join(root,file),...args],{cwd:root,env,encoding:'utf8',timeout:15000,maxBuffer:4*1024*1024});
  await mkdir(join(root,'node_modules/@next/env'),{recursive:true});await writeFile(join(root,'node_modules/@next/env/package.json'),JSON.stringify({type:'module',exports:'./index.js'}));await writeFile(join(root,'node_modules/@next/env/index.js'),'export default {loadEnvConfig(){}};');
  await mkdir(join(root,'node_modules/next/dist/bin'),{recursive:true});
  await writeFile(join(root,'node_modules/next/dist/bin/next'),"console.log(JSON.stringify({args:process.argv.slice(2),host:process.env.LINUX_ACTIVE_HOST,port:process.env.PORT,origins:JSON.parse(process.env.LINUX_RUNTIME_NETWORK_ORIGINS||'[]')}));");
  const missing=run('scripts/start-server.mjs');assert.equal(missing.status,1);assert.match(missing.stderr,/먼저 npm run build/);
  await mkdir(join(root,'.next'));await writeFile(join(root,'.next/BUILD_ID'),'fixture');
  const started=run('scripts/start-server.mjs');assert.equal(started.status,0,started.stderr);assert.deepEqual(JSON.parse(started.stdout),{args:['start','--hostname','127.0.0.1','--port','9876'],host:'127.0.0.1',port:'9876',origins:['http://127.0.0.1:9876','http://localhost:9876']});
  const prepared=run('scripts/prepare-next-cli.mjs');assert.equal(prepared.status,0,prepared.stderr);const first=await readFile(join(root,'node_modules/.bin/next'),'utf8');assert(first.includes('../next/dist/bin/next'));await writeFile(join(root,'node_modules/.bin/next'),'existing cli');assert.equal(run('scripts/prepare-next-cli.mjs').status,0);assert.equal(await readFile(join(root,'node_modules/.bin/next'),'utf8'),'existing cli');
  await mkdir(join(root,'bin'));await writeFile(join(root,'bin/cargo'),'#!/bin/sh\nprintf "%s\\n" "$1" "$CARGO_TARGET_DIR"\n',{mode:0o700});
  const cargo=run('scripts/desktop-cargo.mjs',['check'],{...environment,PATH:join(root,'bin')+':'+environment.PATH});assert.equal(cargo.status,0,cargo.stderr);assert.deepEqual(cargo.stdout.trim().split('\n'),['check','/mnt/data/build/tastedev-linux/tauri-target']);assert.equal(run('scripts/desktop-cargo.mjs',['invalid']).status,1);
  await mkdir(join(root,'tests'));await writeFile(join(root,'tests/fixture.test.mjs'),"import test from 'node:test';test('owned fixture',()=>{});");
  const passed=run('scripts/run-tests.mjs',['tests/fixture.test.mjs']);assert.equal(passed.status,0,passed.stdout+passed.stderr);
  const evidence=(output:string):string=>{const value:unknown=JSON.parse(output.trim().split('\n').at(-1)??'');assert(value&&typeof value==='object'&&'testEvidence' in value&&typeof value.testEvidence==='string');return value.testEvidence;};
  const success=evidence(passed.stdout);assert(success.startsWith('/mnt/data/build/tastedev-linux/tastedev-linux-tests-'));assert.match(await readFile(join(success,'test.log'),'utf8'),/owned fixture/);assert.equal(JSON.parse(await readFile(join(success,'result.json'),'utf8')).concurrency,1);
  await writeFile(join(root,'tests/fixture.test.mjs'),"import test from 'node:test';test('owned failure',()=>{throw Error('fixture failure');});");
  const failed=run('scripts/run-tests.mjs',['tests/fixture.test.mjs']);assert.equal(failed.status,1);const failure=evidence(failed.stdout);assert.match(await readFile(join(failure,'test.log'),'utf8'),/fixture failure/);assert.equal(JSON.parse(await readFile(join(failure,'result.json'),'utf8')).status,'FAIL');
  assert.equal(run('scripts/run-tests.mjs',['../outside.test.mjs']).status,1);assert.equal(run('scripts/run-tests.mjs',[],{...environment,LINUX_TEST_CONCURRENCY:'5'}).status,1);
 }finally{await rm(root,{recursive:true,force:true});}
});
