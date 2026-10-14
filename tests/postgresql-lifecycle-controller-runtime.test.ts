import test from 'node:test';import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,readdir,symlink,cp,rm} from 'node:fs/promises';import {join,dirname,resolve} from 'node:path';import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';import {jsonRecord} from '../scripts/verification/http-json.ts';
test('Node22 emitted PostgreSQL lifecycle controller exercises an existing isolated container with six native checks',async()=>{
 const root=await verificationWorkDirectory('postgresql-lifecycle-runtime-'),script='scripts/verification/postgresql-lifecycle.mjs';const files=[script,...['work-directory','http-json'].map(n=>'scripts/verification/'+n+'.mjs')];
 async function collect(dir:string):Promise<void>{for(const item of await readdir(dir,{withFileTypes:true})){const file=dir+'/'+item.name;if(item.isDirectory())await collect(file);else if(/\.(ts|mts)$/.test(file))files.push(file.replace(/\.(ts|mts)$/,'.mjs'));}}
 await collect('lib');let passed=false;
 try{
  await symlink(resolve('node_modules'),join(root,'node_modules'),'dir');for(const file of files){await mkdir(dirname(join(root,file)),{recursive:true});await writeFile(join(root,file),await readRuntimeModule(file,files));}await cp('lib/locales',join(root,'lib/locales'),{recursive:true});
  const checked=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--check',join(root,script)],{encoding:'utf8'});assert.equal(checked.status,0,checked.stderr);
  const run=spawnSync('/usr/bin/node',['--no-experimental-strip-types',join(root,script)],{env:process.env,encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024});await writeFile(join(root,'stdout.log'),run.stdout);await writeFile(join(root,'stderr.log'),run.stderr);assert.equal(run.status,0,run.stderr);const result=jsonRecord(JSON.parse(run.stdout.trim().split('\n').at(-1)||'null'));assert.equal(result.status,'PASS');assert(typeof result.evidence==='string');const record=jsonRecord(JSON.parse(await readFile(result.evidence,'utf8')));assert.equal(record.hostBindMounts,false);assert.equal(record.publishedPorts,false);assert.equal(record.network,'none');assert(Array.isArray(record.checks));assert.equal(record.checks.length,6);assert.equal(record.hostPackageOrServiceChanges,false);passed=true;
 }finally{if(passed)await rm(root,{recursive:true,force:true});}
});
