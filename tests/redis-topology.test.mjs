import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {redisTopology,assertRedisGraphVersion} from '../lib/redis-topology.ts';
test('Redis graph preserves include order and binds file contents without exposing secrets',async()=>{
 const base=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','linux-redis-graph-'));
 try{
  await mkdir(path.join(base,'conf.d'));
  await writeFile(path.join(base,'redis.conf'),'requirepass private-secret\ninclude "/etc/redis/conf.d/cache.conf"\nport 6379\n');
  await writeFile(path.join(base,'conf.d/cache.conf'),'port 6380\n');
  const first=await redisTopology(undefined,base);assert.equal(first.complete,true);assert.equal(first.files.length,2);assert.equal(first.edges[0].line,2);assert(!JSON.stringify(first).includes('private-secret'));
  await writeFile(path.join(base,'conf.d/cache.conf'),'port 6381\n');assert.notEqual((await redisTopology(undefined,base)).version,first.version);
 }finally{await rm(base,{recursive:true,force:true});}
});
test('Redis precommit graph gate rejects changed files and directory membership',async()=>{
 const base=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','linux-redis-gate-'));
 try{
  await mkdir(path.join(base,'conf.d'));await writeFile(path.join(base,'redis.conf'),'include /etc/redis/conf.d/*.conf\n');
  const initial=await redisTopology(undefined,base);assert.equal((await assertRedisGraphVersion(initial.version,base)).version,initial.version);
  await writeFile(path.join(base,'conf.d/new.conf'),'port 6380\n');await assert.rejects(assertRedisGraphVersion(initial.version,base),error=>error.status===409);
  const added=await redisTopology(undefined,base);await writeFile(path.join(base,'conf.d/new.conf'),'port 6381\n');await assert.rejects(assertRedisGraphVersion(added.version,base),error=>error.status===409);
  await assert.rejects(assertRedisGraphVersion('invalid',base),error=>error.status===400);
 }finally{await rm(base,{recursive:true,force:true});}
});
test('Redis graph refuses cycles, glob assumptions, symlinks and malformed UTF8',async()=>{
 const base=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','linux-redis-graph-'));
 try{
  for(const text of ['include /etc/redis/redis.conf\n','include /etc/redis/*.conf\n','include /tmp/private-secret.conf\n',Buffer.from([0xff])]){
   await writeFile(path.join(base,'redis.conf'),text);const result=await redisTopology(undefined,base);assert.equal(result.complete,false);assert(!JSON.stringify(result).includes('private-secret'));
  }
  await symlink('/tmp/unrelated.conf',path.join(base,'linked.conf'));await writeFile(path.join(base,'redis.conf'),'include /etc/redis/linked.conf\n');assert.equal((await redisTopology(undefined,base)).complete,false);
 }finally{await rm(base,{recursive:true,force:true});}
});
test('Redis wildcard graph tracks empty and changing directory membership without hidden files',async()=>{
 const base=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','linux-redis-glob-'));
 try{
  await mkdir(path.join(base,'conf.d'));await writeFile(path.join(base,'redis.conf'),'include /etc/redis/conf.d/*.conf\n');
  const empty=await redisTopology(undefined,base);assert.equal(empty.complete,true);assert.deepEqual(empty.edges[0].targets,[]);
  await writeFile(path.join(base,'conf.d/.hidden.conf'),'requirepass private-secret');
  assert.equal((await redisTopology(undefined,base)).version,empty.version);
  await writeFile(path.join(base,'conf.d/90-last.conf'),'port 6380');await writeFile(path.join(base,'conf.d/10-first.conf'),'maxclients 100');
  const populated=await redisTopology(undefined,base);assert.equal(populated.complete,true);assert.notEqual(populated.version,empty.version);
  assert.deepEqual(populated.edges[0].targets,['/etc/redis/conf.d/10-first.conf','/etc/redis/conf.d/90-last.conf']);
  assert.notEqual(populated.directories[0].version,empty.directories[0].version);
  await symlink('/tmp/unrelated.conf',path.join(base,'conf.d/50-linked.conf'));assert.equal((await redisTopology(undefined,base)).complete,false);
 }finally{await rm(base,{recursive:true,force:true});}
});
