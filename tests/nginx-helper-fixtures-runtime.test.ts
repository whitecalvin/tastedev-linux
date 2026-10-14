import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
import {readRuntimeModule} from '../scripts/runtime-source.ts';

test('Node22 nginx command and checkpoint fixtures are plain JavaScript and refuse ordinary-host execution',async()=>{
 const root=await verificationWorkDirectory('nginx-helper-fixtures-runtime-');
 try{
  for(const name of ['nginx-helper-command','nginx-site-checkpoint']){
   const module='scripts/fixtures/'+name+'.mjs',filename=join(root,name+'.mjs');
   await writeFile(filename,await readRuntimeModule(module,[module]));
   const syntax=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--check',filename],{encoding:'utf8'});assert.equal(syntax.status,0,syntax.stderr);
   let launcher=filename;
   if(name==='nginx-site-checkpoint'){
    const imported=spawnSync('/usr/bin/node',['--no-experimental-strip-types',filename],{encoding:'utf8',timeout:10000});assert.equal(imported.status,0,imported.stderr);assert.equal(imported.stdout,'');
    launcher=join(root,'checkpoint-call.mjs');await writeFile(launcher,"import {fixtureCheckpoint} from './nginx-site-checkpoint.mjs';await fixtureCheckpoint('prepared');");
   }
   const refused=spawnSync('/usr/bin/node',['--no-experimental-strip-types',launcher],{encoding:'utf8',timeout:10000});assert.equal(refused.status,1);assert(refused.stderr.includes('AssertionError'),refused.stderr);assert.equal(refused.stdout,'');
  }
 }finally{await rm(root,{recursive:true,force:true});}
});
