import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readAdminRuntimeModule} from '../scripts/admin/runtime-source.mts';

test('fixed helper Redis candidate and sandbox plans run Node22 without starting Redis or mounting operating data',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','rplan-'));
 try{
  for(const file of ['redis-candidate.mjs','redis-candidate-resources.mjs','redis-resource-review.mjs','redis-validation-plan.mjs','redis-sandbox-plan.mjs','redis-work-directory.mjs','redis-topology.mjs','config-patch.mjs','database-config-profile.mjs','config-schema.mjs'])await writeFile(join(root,file),await readAdminRuntimeModule(file),{mode:0o600});
  const worker=join(root,'worker.mjs');await writeFile(worker,`import assert from 'node:assert/strict';import {mkdir,writeFile,readFile,rm} from 'node:fs/promises';import {redisTopology} from './redis-topology.mjs';import {redisCandidate,assertRedisCandidate} from './redis-candidate.mjs';import {redisWorkDirectory} from './redis-work-directory.mjs';import {redisSandboxPlan,assertRedisSandboxPlan} from './redis-sandbox-plan.mjs';const root=new URL('.',import.meta.url).pathname.slice(0,-1),base=root+'/redis',text='port 6379\\ndir /var/lib/redis\\nrequirepass synthetic-secret\\n';await mkdir(base,{mode:0o700});await writeFile(base+'/redis.conf',text,{mode:0o600});const graph=await redisTopology(undefined,base),candidate=await redisCandidate({version:graph.version,changes:{port:6380}},base),runtime=await redisWorkDirectory('tastedev-redis-validation-');try{const plan=await redisSandboxPlan(candidate,runtime);assert.equal(assertRedisSandboxPlan(plan),plan);assert.throws(()=>assertRedisSandboxPlan({...plan}));assert.equal(plan.executed,false);assert.equal(plan.resourceIsolationVerified,false);assert(!JSON.stringify(plan.validation.resourceReview).includes('synthetic-secret'));assert(plan.args.includes('/var/lib/redis'));assert(!plan.args.some((value,index)=>value==='--bind'&&plan.args[index+1]==='/var/lib/redis'));assert.equal(await readFile(base+'/redis.conf','utf8'),text);await writeFile(candidate.main,'port 6390\\n');await assert.rejects(assertRedisCandidate(candidate));console.log('PASS');}finally{await candidate.cleanup();await rm(runtime,{recursive:true,force:true});}`,{mode:0o600});
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{encoding:'utf8',env:{...process.env,TMPDIR:root,TMP:root,TEMP:root},timeout:15000});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'PASS');
 }finally{await rm(root,{recursive:true,force:true});}
});
