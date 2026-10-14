import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readAdminRuntimeModule} from '../scripts/admin/runtime-source.mts';
import {adminRuntimeFiles} from '../scripts/admin/runtime-files.mts';

test('Node22 PostgreSQL data context and private backup review run emitted JavaScript without operating database commands',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','pg-data-runtime-'));
 try{
  for(const file of adminRuntimeFiles)await writeFile(join(root,file),await readAdminRuntimeModule(file),{mode:0o600});
  const files:string[]=[];
  for(const name of ['context','backup']){
   const source=await readFile(new URL('./postgresql-data-'+name+'.test.mjs',import.meta.url),'utf8');
   const output=join(root,name+'.test.mjs');
   await writeFile(output,source.replace(/\.\.\/lib\/([a-z-]+)\.(?:ts|mjs)/g,'./$1.mjs'),{mode:0o600});files.push(output);
  }
  const environment={...process.env};delete environment.NODE_TEST_CONTEXT;
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--test','--test-reporter=tap','--test-concurrency=1',...files],{encoding:'utf8',env:environment,timeout:15000,maxBuffer:8*1024*1024});
  assert.equal(result.status,0,result.stdout+result.stderr);assert.match(result.stdout,/# pass 8\b/);
 }finally{await rm(root,{recursive:true,force:true});}
});
