import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,stat,rm} from 'node:fs/promises';import path from 'node:path';import {tmpdir} from 'node:os';
import {redisTopology} from '../lib/redis-topology.ts';import {validateReviewedRedis} from '../lib/redis-reviewed-validation.ts';
test('reviewed Redis validation preserves original and removes candidate, rejects stale graph and native detail',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','redis-reviewed-validation-'));try{
  const base=path.join(root,'redis');await mkdir(base,{mode:0o700});const main=path.join(base,'redis.conf'),original='port 6379\nrequirepass fixture-private\n';await writeFile(main,original,{mode:0o600});
  const graph=await redisTopology(undefined,base),input={path:'/etc/redis/redis.conf',version:graph.files[0].version,graphVersion:graph.version,changes:{port:6380},confirm:true};let directory,calls=0;
  const result=await validateReviewedRedis(input,{base,validate:async candidate=>{calls++;directory=candidate.directory;assert.match(await readFile(candidate.main,'utf8'),/port 6380/);return {valid:true,secret:'native-secret'};}});
  assert.equal(result.valid,true);assert.equal(result.operatingConfigurationChanged,false);assert.equal(result.operationalResourcesVerified,false);assert.equal(JSON.stringify(result).includes('secret'),false);
  assert.equal(await readFile(main,'utf8'),original);await assert.rejects(stat(directory),{code:'ENOENT'});
  await assert.rejects(validateReviewedRedis(input,{base,validate:async()=>{throw Error('native-secret');}}),error=>!error.message.includes('native-secret'));
  await assert.rejects(validateReviewedRedis(input,{base,validate:async()=>{throw Object.assign(Error('private binary path'),{code:'REDIS_EXECUTABLE_UNAVAILABLE'});}}),error=>error.status===400&&error.message.includes('패키지 설치')&&!error.message.includes('private binary path'));
 await assert.rejects(validateReviewedRedis(input,{base,validate:async()=>{throw Object.assign(Error('private namespace path'),{status:503,code:'REDIS_SANDBOX_UNAVAILABLE'});}}),error=>error.status===503&&error.code==='REDIS_SANDBOX_UNAVAILABLE'&&!error.message.includes('private namespace path'));
  await writeFile(main,'port 6390\n',{mode:0o600});await assert.rejects(validateReviewedRedis(input,{base,validate:async()=>{calls++;}}),{status:409});assert.equal(calls,1);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('reviewed Redis validation rejects edits during inspection and retains candidate on unresolved cleanup',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','redis-reviewed-conflict-'));let retained;
 try{
  const base=path.join(root,'redis');await mkdir(base,{mode:0o700});const main=path.join(base,'redis.conf');await writeFile(main,'port 6379\n',{mode:0o600});
  const graph=await redisTopology(undefined,base),input={path:'/etc/redis/redis.conf',version:graph.files[0].version,graphVersion:graph.version,changes:{port:6380},confirm:true};let directory;
  await assert.rejects(validateReviewedRedis(input,{base,validate:async candidate=>{directory=candidate.directory;await writeFile(main,'port 6390\n',{mode:0o600});return {valid:true};}}),{status:409});
  assert.equal(await readFile(main,'utf8'),'port 6390\n');await assert.rejects(stat(directory),{code:'ENOENT'});
  await writeFile(main,'port 6379\n',{mode:0o600});
  await assert.rejects(validateReviewedRedis(input,{base,validate:async candidate=>{retained=candidate;throw Object.assign(Error('private cleanup detail'),{status:500});}}),error=>error.status===500&&!error.message.includes('private cleanup detail'));
  assert.ok((await stat(retained.directory)).isDirectory());assert.equal(await readFile(main,'utf8'),'port 6379\n');
 }finally{await retained?.cleanup();await rm(root,{recursive:true,force:true});}
});
