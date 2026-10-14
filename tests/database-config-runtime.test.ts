import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {readAdminRuntimeModule} from '../scripts/admin/runtime-source.mts';
import {databaseConfigProfile} from '../lib/database-config-profile.ts';
import {parseLiveConfig} from '../lib/config-value-parser.ts';

test('emitted database schema and parser retain memory units, defaults and numeric rejection without TypeScript loading',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-database-runtime-'));
 try{
  await mkdir(join(root,'lib'));
  for(const file of ['config-schema.mjs','database-config-profile.mjs','config-value-parser.mjs']){const bytes=await readAdminRuntimeModule(file);assert.deepEqual(bytes,await readAdminRuntimeModule(file));await writeFile(join(root,'lib',file),bytes,{mode:0o600});}
  const worker=join(root,'worker.mjs');await writeFile(worker,`import assert from 'node:assert/strict';import {databaseConfigProfile} from './lib/database-config-profile.mjs';import {parseLiveConfig} from './lib/config-value-parser.mjs';const pg=parseLiveConfig('postgresql',"shared_buffers = '1GB'\\nwork_mem = 4096\\nlogging_collector = on\\n");const redis=parseLiveConfig('redis','port 0\\nmaxmemory 256mb\\nappendonly yes\\n');for(const value of [true,null,[],{},'1e3','0x100'])assert.throws(()=>databaseConfigProfile('redis',{maxMemory:value}));assert.throws(()=>parseLiveConfig('constructor',''));console.log(JSON.stringify({pg,redis,text:databaseConfigProfile('redis',redis.values)}));`,{mode:0o600});
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);const redis=parseLiveConfig('redis','port 0\nmaxmemory 256mb\nappendonly yes\n');assert.deepEqual(JSON.parse(result.stdout),{pg:parseLiveConfig('postgresql',"shared_buffers = '1GB'\nwork_mem = 4096\nlogging_collector = on\n"),redis,text:databaseConfigProfile('redis',redis.values)});
 }finally{await rm(root,{recursive:true,force:true});}
});

test('emitted PostgreSQL row editor and DB patch preserve source bytes without a TypeScript loader',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-settings-runtime-'));
 try{
  await mkdir(join(root,'lib'));
  for(const file of ['config-schema.mjs','database-config-profile.mjs','config-patch.mjs','postgresql-settings-text.mjs'])await writeFile(join(root,'lib',file),await readAdminRuntimeModule(file),{mode:0o600});
  const worker=join(root,'worker.mjs');await writeFile(worker,`import assert from 'node:assert/strict';import {patchConfig} from './lib/config-patch.mjs';import {parsePostgresqlSettings,updatePostgresqlSetting} from './lib/postgresql-settings-text.mjs';const text="# 한글 😀\\r\\nport = 5432 # 보존\\r\\ninclude = 'local.conf'\\r\\n";const row=parsePostgresqlSettings(text)[0];const edited=updatePostgresqlSetting(text,{...row,name:'injected',indent:'evil\\n'},{value:'5433'});assert.equal(edited,text.replace('5432','5433'));assert.equal(patchConfig('postgresql',text,{port:5433}),edited);assert.throws(()=>patchConfig('constructor',text,{}));assert.throws(()=>updatePostgresqlSetting(text,{...row,raw:'stale'},{value:'5433'}));console.log('PASS');`,{mode:0o600});
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'PASS');
 }finally{await rm(root,{recursive:true,force:true});}
});

test('emitted HBA validation metadata runs without a TypeScript loader and exposes no authentication options',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-hba-report-runtime-'));
 try{
  await mkdir(join(root,'lib'));
  for(const file of ['postgresql-hba-validation.mjs','postgresql-work-directory.mjs'])await writeFile(join(root,'lib',file),await readAdminRuntimeModule(file),{mode:0o600});
  const worker=join(root,'worker.mjs');await writeFile(worker,`import assert from 'node:assert/strict';import {postgresqlHbaValidationPlan,postgresqlHbaValidationReport} from './lib/postgresql-hba-validation.mjs';const root='/mnt/data/build/tastedev-linux/linux-pg-hba-fixture',files=[{nativePath:root+'/pg_hba.conf',sourcePath:'/etc/postgresql/16/main/pg_hba.conf'}];const plan=postgresqlHbaValidationPlan(root,16);assert(plan.inspect.args.includes('listen_addresses='));assert.throws(()=>postgresqlHbaValidationPlan('/var/lib/postgresql/16/main',16));const report=postgresqlHbaValidationReport(JSON.stringify({schema:1,rows:[{file:files[0].nativePath,line:3,method:null,error:'invalid-option',privateOption:'fixture-secret'}]}),{major:16,files});assert.equal(report.valid,false);assert(!JSON.stringify(report).includes('fixture-secret'));assert.deepEqual(report.diagnostics,[{path:files[0].sourcePath,line:3,category:'invalid-option'}]);console.log('PASS');`,{mode:0o600});
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'PASS');
 }finally{await rm(root,{recursive:true,force:true});}
});
