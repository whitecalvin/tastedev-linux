import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';

test('emitted cron modules run in Node 22 without TypeScript loading and reuse the private lock',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-cron-runtime-'));
 try{
  const allowed=['lib/cron-lock.mjs','lib/cron-install.mjs','lib/error-code.mjs'];await mkdir(join(root,'lib'),{mode:0o700});
  for(const file of allowed){const bytes=await readRuntimeModule(file,allowed);await writeFile(join(root,file),bytes,{mode:0o600});const checked=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--check',join(root,file)],{encoding:'utf8'});assert.equal(checked.status,0,checked.stderr);}
  const worker=join(root,'worker.mjs');await writeFile(worker,"import assert from 'node:assert/strict';import {withCronLock} from './lib/cron-lock.mjs';import {installCron} from './lib/cron-install.mjs';assert.equal(typeof installCron,'function');const folder=new URL('./locks/',import.meta.url).pathname;assert.equal(await withCronLock(folder,()=>42),42);await assert.rejects(withCronLock(folder,()=>{throw Error('fixture failure');}),/fixture failure/);assert.equal(await withCronLock(folder,()=>43),43);console.log('PASS');",{mode:0o600});
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{encoding:'utf8',env:process.env});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'PASS');
 }finally{await rm(root,{recursive:true,force:true});}
});
