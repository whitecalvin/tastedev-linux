import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {adminRuntimeFiles} from '../scripts/admin/runtime-files.mts';

test('Node22 Redis graph display review and native composition preserve regressions without native service execution',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','redis-review-runtime-'));
 try{
  const allowed=[...new Set([...adminRuntimeFiles.map(name=>'lib/'+name),'lib/redis-config-tree.mjs','lib/redis-context-review.mjs','lib/redis-native-validation.mjs'])];
  for(const file of allowed)await writeFile(join(root,file.slice(4)),await readRuntimeModule(file,allowed),{mode:0o600});
  const files:string[]=[];
  for(const name of ['redis-config-tree','redis-context-review','redis-native-validation']){
   const source=await readFile(new URL('./'+name+'.test.mjs',import.meta.url),'utf8'),output=join(root,name+'.test.mjs');
   await writeFile(output,source.replace(/\.\.\/lib\/([a-z-]+)\.(?:ts|mjs)/g,'./$1.mjs'),{mode:0o600});files.push(output);
  }
  const environment={...process.env};delete environment.NODE_TEST_CONTEXT;
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--test','--test-reporter=tap','--test-concurrency=1',...files],{encoding:'utf8',env:environment,timeout:15000,maxBuffer:8*1024*1024});assert.equal(result.status,0,result.stdout+result.stderr);assert.match(result.stdout,/# pass 8\b/);
 }finally{await rm(root,{recursive:true,force:true});}
});
