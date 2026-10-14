import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readAdminRuntimeModule} from '../scripts/admin/runtime-source.mts';
import {adminRuntimeFiles} from '../scripts/admin/runtime-files.mts';

test('Node22 emitted HBA backup catalog and PostgreSQL restore service context validate private records without a TypeScript loader',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','pg-backup-context-runtime-'));
 try{
  for(const file of adminRuntimeFiles)await writeFile(join(root,file),await readAdminRuntimeModule(file),{mode:0o600});
  const files:string[]=[];
  for(const name of ['hba-backups']){
   const source=await readFile(new URL('./postgresql-'+name+'.test.mjs',import.meta.url),'utf8');
   const output=join(root,name+'.test.mjs');
   await writeFile(output,source.replace(/\.\.\/lib\/([a-z-]+)\.(?:ts|mjs)/g,'./$1.mjs'),{mode:0o600});files.push(output);
  }
  const worker=join(root,'context.test.mjs');await writeFile(worker,`import test from 'node:test';import assert from 'node:assert/strict';import {assertPostgresqlRestoreServiceContext} from './postgresql-restore-service-context.mjs';test('validated service context preserves identity and rejects malformed nested records',()=>{const target='/etc/postgresql/16/main/postgresql.conf',values={port:'5432',max_connections:'100',shared_buffers:'16384',work_mem:'4096',logging_collector:'off'},record={format:'postgresql-restore-service-v1',reviewVersion:'a'.repeat(64),serviceVersion:'b'.repeat(64),scope:{config:target,data:'/var/lib/postgresql/16/main',hba:'/etc/postgresql/16/main/pg_hba.conf',unit:'postgresql@16-main.service',major:16,autoConfiguration:{present:true,version:'c'.repeat(64)}},originalValues:values,candidateValues:values,pid:123,start:'42'};assert.equal(assertPostgresqlRestoreServiceContext(record,target),record);for(const invalid of [null,[],{...record,extra:true},{...record,pid:'123'},{...record,scope:{...record.scope,config:'/etc/other'}},{...record,originalValues:{...values,password:'private'}},{...record,scope:{...record.scope,autoConfiguration:{present:'true',version:'c'.repeat(64)}}}])assert.throws(()=>assertPostgresqlRestoreServiceContext(invalid,target),{status:409});});`,{mode:0o600});files.push(worker);
  const environment={...process.env};delete environment.NODE_TEST_CONTEXT;
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--test','--test-reporter=tap','--test-concurrency=1',...files],{encoding:'utf8',env:environment,timeout:15000,maxBuffer:8*1024*1024});assert.equal(result.status,0,result.stdout+result.stderr);assert.match(result.stdout,/# pass 3/);
 }finally{await rm(root,{recursive:true,force:true});}
});
