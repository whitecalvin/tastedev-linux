import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {redisTopology} from '../lib/redis-topology.ts';
import {redisCandidate,isRedisCandidate,assertRedisCandidate} from '../lib/redis-candidate.ts';
test('Redis private candidate copies all includes, preserves wildcard and never changes source',async()=>{
 const base=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','linux-redis-candidate-fixture-'));let candidate;
 try{
  await mkdir(path.join(base,'conf.d'));const original='requirepass private-secret\nport 6379\ninclude /etc/redis/conf.d/*.conf\n';
  await writeFile(path.join(base,'redis.conf'),original);await writeFile(path.join(base,'conf.d/90.conf'),'port 6380\n');
  const graph=await redisTopology(undefined,base);candidate=await redisCandidate({version:graph.version,changes:{port:6381}},base);
  assert(isRedisCandidate(candidate));assert(!isRedisCandidate({...candidate}));assert.equal((await stat(candidate.directory)).mode&0o777,0o700);assert.equal((await stat(candidate.main)).mode&0o777,0o600);
  const text=await readFile(candidate.main,'utf8');assert(text.includes('port 6381'));assert(text.includes('include "'+candidate.directory+'/conf.d/*.conf"'));assert(text.includes('private-secret'));
  assert.equal(await readFile(path.join(candidate.directory,'conf.d/90.conf'),'utf8'),'port 6380\n');assert.equal(await readFile(path.join(base,'redis.conf'),'utf8'),original);
  await candidate.cleanup();assert(!isRedisCandidate(candidate));await assert.rejects(stat(candidate.directory),{code:'ENOENT'});
  await writeFile(path.join(base,'conf.d/90.conf'),'port 6382\n');await assert.rejects(redisCandidate({version:graph.version,changes:{port:6381}},base),error=>error.status===409);
 }finally{await candidate?.cleanup();await rm(base,{recursive:true,force:true});}
});
test('Redis restoration candidate copies newly referenced includes and preserves full private text',async()=>{
 const base=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','linux-redis-restore-fixture-'));let candidate;
 try{
  const original='port 6379\n';await writeFile(path.join(base,'redis.conf'),original);await writeFile(path.join(base,'extra.conf'),'maxclients 150\n');
  const graph=await redisTopology(undefined,base),restoreText='requirepass restored-private-secret\nport 6380\ninclude /etc/redis/extra.conf\n';
  candidate=await redisCandidate({version:graph.version,changes:{},restoreText},base);
  const text=await readFile(candidate.main,'utf8');assert(text.includes('restored-private-secret'));assert(text.includes('port 6380'));assert(text.includes(candidate.directory+'/extra.conf'));
  assert.equal(await readFile(path.join(candidate.directory,'extra.conf'),'utf8'),'maxclients 150\n');assert.equal(await readFile(path.join(base,'redis.conf'),'utf8'),original);
  assert.match(candidate.restoreVersion,/^[a-f0-9]{64}$/);assert.notEqual(candidate.candidateVersion,graph.version);
  await assert.rejects(redisCandidate({version:graph.version,changes:{},restoreText:'include /etc/redis/missing.conf\n'},base));
  await assert.rejects(redisCandidate({version:graph.version,changes:{port:6379},restoreText},base));
 }finally{await candidate?.cleanup();await rm(base,{recursive:true,force:true});}
});

test('Redis native candidate integrity rejects changed bytes and new wildcard members',async()=>{
 const base=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','linux-redis-integrity-'));let candidate;
 try{
  await mkdir(path.join(base,'conf.d'));await writeFile(path.join(base,'redis.conf'),'port 6379\ninclude /etc/redis/conf.d/*.conf\n');
  const graph=await redisTopology(undefined,base);candidate=await redisCandidate({version:graph.version,changes:{port:6380}},base);
  await assertRedisCandidate(candidate);await assert.rejects(assertRedisCandidate({...candidate}),error=>error.status===409);
  const text=await readFile(candidate.main,'utf8');await writeFile(candidate.main,text.replace('6380','6381'));
  await assert.rejects(assertRedisCandidate(candidate),error=>error.status===409);await writeFile(candidate.main,text);await assertRedisCandidate(candidate);
  await writeFile(path.join(candidate.directory,'conf.d/new.conf'),'port 6390\n',{mode:0o600});await assert.rejects(assertRedisCandidate(candidate),error=>error.status===409);
 }finally{await candidate?.cleanup();await rm(base,{recursive:true,force:true});}
});
