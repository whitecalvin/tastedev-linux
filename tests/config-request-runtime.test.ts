import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readAdminRuntimeModule} from '../scripts/admin/runtime-source.mts';

test('fixed helper sudo policy and nginx locale modules run in Node22 without TS loading or privilege changes',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-policy-runtime-'));
 try{
  for(const file of ['sudo-policy.mjs','helper-actions.mjs','nginx-locale.mjs'])await writeFile(join(root,file),await readAdminRuntimeModule(file),{mode:0o600});
  const worker=join(root,'worker.mjs');await writeFile(worker,`import assert from 'node:assert/strict';import {sudoPolicyPlan,parseSudoPolicy} from './sudo-policy.mjs';import {nginxValidationLocale} from './nginx-locale.mjs';const account={username:'fixture',uid:1234},plan=sudoPolicyPlan({passwordless:true,actions:['nginx-apply']},account);assert.equal(plan.applied,false);assert.equal(parseSudoPolicy(plan.text,account).version,plan.version);assert.throws(()=>sudoPolicyPlan({passwordless:true,actions:['ALL']},account));assert.throws(()=>parseSudoPolicy(plan.text.replace('fixture','other'),account));assert.deepEqual(nginxValidationLocale({LANG:'ko_KR.UTF-8'}),{LANG:'ko_KR.UTF-8'});assert.throws(()=>nginxValidationLocale({PATH:'/private'}));console.log('PASS');`,{mode:0o600});
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{encoding:'utf8',env:process.env});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'PASS');
 }finally{await rm(root,{recursive:true,force:true});}
});
