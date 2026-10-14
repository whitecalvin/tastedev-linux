import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {adminRuntimeFiles} from '../scripts/admin/runtime-files.mts';

test('Node22 before-restore graph generator and snapshots run emitted JavaScript without TypeScript support',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','pg-before-graph-runtime-'));
 try{
  const testFile='tests/postgresql-restore-before-graph.test.mjs',allowed=[...adminRuntimeFiles.map(name=>'lib/'+name),testFile];
  await mkdir(join(root,'lib'),{mode:0o700});await mkdir(join(root,'tests'),{mode:0o700});
  for(const file of allowed)await writeFile(join(root,file),await readRuntimeModule(file,allowed),{mode:0o600});
  const original=await readFile(new URL('./postgresql-graph-restore-snapshot.test.mjs',import.meta.url),'utf8'),snapshot=join(root,'tests/snapshot.test.mjs');
  await writeFile(snapshot,original.replace(/\.\.\/lib\/([a-z-]+)\.(?:ts|mjs)/g,'../lib/$1.mjs'),{mode:0o600});
  const environment={...process.env};delete environment.NODE_TEST_CONTEXT;
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--test','--test-reporter=tap','--test-concurrency=1',join(root,testFile),snapshot],{encoding:'utf8',env:environment,timeout:15000,maxBuffer:8*1024*1024});assert.equal(result.status,0,result.stdout+result.stderr);assert.match(result.stdout,/# pass 14\b/);
 }finally{await rm(root,{recursive:true,force:true});}
});
