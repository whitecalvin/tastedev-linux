import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {adminRuntimeFiles} from '../scripts/admin/runtime-files.mts';

test('Node22 session maintenance and certificate-linked nginx backups preserve existing regressions without native ACME calls',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','session-certificate-runtime-'));
 try{
  const allowed=[...adminRuntimeFiles.map(file=>'lib/'+file),'lib/browser-session-maintenance.mjs','lib/node-env-files.mjs','lib/certificate-job-log.mjs'];
  for(const file of allowed)await writeFile(join(root,file.slice(4)),await readRuntimeModule(file,allowed),{mode:0o600});
  const files:string[]=[];
  for(const name of ['browser-session-maintenance','certificate-nginx-backup']){
   const source=await readFile(new URL('./'+name+'.test.mjs',import.meta.url),'utf8');
   const output=join(root,name+'.test.mjs');
   await writeFile(output,source.replace(/\.\.\/lib\/([a-z-]+)\.(?:ts|mjs)/g,'./$1.mjs'),{mode:0o600});files.push(output);
  }
  const worker=join(root,'env.test.mjs');await writeFile(worker,`import test from 'node:test';import assert from 'node:assert/strict';import {nodeEnvFiles,nodeEnvDraftFiles} from './node-env-files.mjs';test('workspace environment catalogs retain only safe paths and dirty Node buffers',()=>{assert.deepEqual(nodeEnvFiles({root:'/fixture',files:['app.env','.env','../bad.env','nested/app.env',null,'app.env']}),{root:'/fixture',files:['app.env','nested/app.env']});assert.deepEqual(nodeEnvFiles(null),{root:'',files:[]});assert.deepEqual(nodeEnvDraftFiles({'nodejs:app.env':{kind:'nodejs',name:'app.env',text:'changed',baseline:'old'},'nodejs:clean.env':{kind:'nodejs',name:'clean.env',text:'same',baseline:'same'},invalid:null}),['app.env']);});`,{mode:0o600});files.push(worker);
  const environment={...process.env};delete environment.NODE_TEST_CONTEXT;
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--test','--test-reporter=tap','--test-concurrency=1',...files],{encoding:'utf8',env:environment,timeout:15000,maxBuffer:8*1024*1024});assert.equal(result.status,0,result.stdout+result.stderr);assert.match(result.stdout,/# pass 19\b/);
 }finally{await rm(root,{recursive:true,force:true});}
});
