import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,readdir,symlink,rm} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {jsonRecord} from '../scripts/verification/http-json.ts';

test('Node22 isolated cron workers refuse the host and preserve native syntax and environment in a private spool',async()=>{
 const root=await verificationWorkDirectory('cron-isolated-controller-runtime-'),script='scripts/verification/cron-isolated.mjs';
 const workers=['scripts/fixtures/cron-isolated-worker.mjs','scripts/fixtures/cron-isolated-scheduler-worker.mjs'];
 const files=[script,...workers,'scripts/runtime-source.mjs',...['work-directory','http-json','nginx-native-report'].map(name=>'scripts/verification/'+name+'.mjs')];
 async function collect(dir:string):Promise<void>{for(const item of await readdir(dir,{withFileTypes:true})){const file=dir+'/'+item.name;if(item.isDirectory())await collect(file);else if(/\.(ts|mts)$/.test(file))files.push(file.replace(/\.(ts|mts)$/,'.mjs'));}}
 await collect('lib');let passed=false;
 try{
  await symlink(resolve('node_modules'),join(root,'node_modules'),'dir');
  for(const file of files){await mkdir(dirname(join(root,file)),{recursive:true});await writeFile(join(root,file),await readRuntimeModule(file,files));}
  for(const worker of workers){
   const filename=join(root,worker),checked=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--check',filename],{encoding:'utf8'});assert.equal(checked.status,0,checked.stderr);
   const refused=spawnSync('/usr/bin/node',['--no-experimental-strip-types',filename],{encoding:'utf8',timeout:10000});assert.equal(refused.status,1);assert(refused.stderr.includes('AssertionError'),refused.stderr);
  }
  const run=spawnSync('/usr/bin/node',['--no-experimental-strip-types',join(root,script)],{env:process.env,encoding:'utf8',timeout:60000,maxBuffer:4*1024*1024});
  await writeFile(join(root,'stdout.log'),run.stdout);await writeFile(join(root,'stderr.log'),run.stderr);assert.equal(run.status,0,run.stderr+'\n'+run.stdout);
  const result=jsonRecord(JSON.parse(run.stdout.trim()));assert.equal(result.status,'PASS');assert(typeof result.evidence==='string');
  const stored=jsonRecord(JSON.parse(await readFile(result.evidence,'utf8')));
  assert.equal(stored.hostCrontabChanged,false);assert.equal(stored.networkIsolated,true);assert.equal(stored.schedulerExecutionVerified,false);
  assert.equal(stored.appMutationApiVerified,false);assert(Array.isArray(stored.checks));assert.equal(stored.checks.length,8);passed=true;
 }finally{if(passed)await rm(root,{recursive:true,force:true});}
});
