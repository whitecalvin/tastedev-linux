import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readdir,rm,readFile} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
import {jsonRecord} from '../scripts/verification/http-json.ts';

test('Node22 local PostgreSQL controller preserves native apply, rollback and restore in a private cluster',async()=>{
 const root=await verificationWorkDirectory('postgresql-local-controller-');
 const script='scripts/verification/postgresql-local-lifecycle.mjs';
 const files=[script,...['work-directory','http-json','nginx-native-report','postgresql-local-api'].map(name=>'scripts/verification/'+name+'.mjs')];
 async function collect(dir:string):Promise<void>{for(const item of await readdir(dir,{withFileTypes:true})){const file=dir+'/'+item.name;if(item.isDirectory())await collect(file);else if(/\.(ts|mts)$/.test(file))files.push(file.replace(/\.(ts|mts)$/,'.mjs'));}}
 await collect('lib');let passed=false;
 try{
  for(const file of files){await mkdir(dirname(join(root,file)),{recursive:true});await writeFile(join(root,file),await readRuntimeModule(file,files));}
  const checked=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--check',join(root,script)],{encoding:'utf8'});
  assert.equal(checked.status,0,checked.stderr);
  const rejected=spawnSync('/usr/bin/node',['--no-experimental-strip-types',join(root,script),'--unknown'],{env:process.env,encoding:'utf8',timeout:10000});
  assert.equal(rejected.status,1,rejected.stderr);assert(rejected.stderr.includes('Usage:'));
  const run=spawnSync('/usr/bin/node',['--no-experimental-strip-types',join(root,script)],{env:process.env,encoding:'utf8',timeout:120000,maxBuffer:1048576});
  await writeFile(join(root,'stdout.log'),run.stdout);await writeFile(join(root,'stderr.log'),run.stderr);
  assert.equal(run.status,0,run.stderr+'\n'+run.stdout);
  const result=jsonRecord(JSON.parse(run.stdout.trim().split('\n').at(-1)||'null'));
  assert.equal(result.status,'PASS');assert.equal(result.fixtureRemoved,true);
  assert.equal(result.hostPackageOrServiceChanges,false);assert.equal(result.networkListenAddresses,'');
  assert.equal(result.privilegedHelperTested,false);assert.equal(result.systemdTested,false);
  assert(Array.isArray(result.checks));assert.equal(result.checks.length,6);
  assert(typeof result.evidence==='string');assert.equal(jsonRecord(JSON.parse(await readFile(result.evidence,'utf8'))).status,'PASS');
  passed=true;
 }finally{if(passed)await rm(root,{recursive:true,force:true});}
});
