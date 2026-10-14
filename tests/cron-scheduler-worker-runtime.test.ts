import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
import {readRuntimeModule} from '../scripts/runtime-source.ts';

test('Node22 emitted cron scheduler worker imports without running commands and refuses the ordinary host',async()=>{
 const root=await verificationWorkDirectory('cron-scheduler-worker-runtime-');
 try{
  const name='scripts/fixtures/cron-scheduler-worker.mjs',filename=join(root,'worker.mjs');
  await writeFile(filename,await readRuntimeModule(name,[name]));
  const syntax=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--check',filename],{encoding:'utf8'});assert.equal(syntax.status,0,syntax.stderr);
  const imported=spawnSync('/usr/bin/node',['--no-experimental-strip-types',filename],{encoding:'utf8',timeout:10000});assert.equal(imported.status,0,imported.stderr);assert.equal(imported.stdout,'');
  const launcher=join(root,'refuse.mjs');await writeFile(launcher,"import {verifyCronSchedule} from './worker.mjs';await verifyCronSchedule({initial:'',updated:''});");
  const refused=spawnSync('/usr/bin/node',['--no-experimental-strip-types',launcher],{encoding:'utf8',timeout:10000});
  assert.equal(refused.status,1);assert(refused.stderr.includes('AssertionError'));assert.equal(refused.stdout,'');
 }finally{await rm(root,{recursive:true,force:true});}
});
