import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,chmod,symlink} from 'node:fs/promises';
import path from 'node:path';
import {redisWorkDirectory,isRedisWorkPath} from '../lib/redis-work-directory.ts';

test('Redis work paths reject temporary fallbacks and traversal before allocation',async()=>{
 const previous=process.env.TMPDIR;let created;
 try{
  delete process.env.TMPDIR;
  created=await redisWorkDirectory('tastedev-redis-candidate-');
  assert.equal(path.dirname(created),'/mnt/data/build/tastedev-linux');
  assert(isRedisWorkPath(created,'tastedev-redis-candidate-'));
  for(const parent of ['/tmp','/var/tmp','/mnt/data/build/x/../escape','/mnt/data/build//alias','/mnt/data/build/x;command']){
   process.env.TMPDIR=parent;await assert.rejects(redisWorkDirectory('tastedev-redis-validation-'),/작업 경로/);
  }
  for(const value of ['/tmp/tastedev-redis-validation-x','/mnt/data/build/x/../tastedev-redis-validation-x','/mnt/data/build/x/tastedev-redis-candidate-x'])assert(!isRedisWorkPath(value,'tastedev-redis-validation-'));
  await assert.rejects(redisWorkDirectory('../unknown'),/작업 종류/);
 }finally{if(previous===undefined)delete process.env.TMPDIR;else process.env.TMPDIR=previous;if(created)await rm(created,{recursive:true,force:true});}
});
test('Redis long designated paths use a short designated runtime for Linux Unix sockets',async()=>{
 const previous=process.env.TMPDIR;let runtime;
 try{
  process.env.TMPDIR='/mnt/data/build/'+('long'.repeat(25));
  runtime=await redisWorkDirectory('tastedev-redis-validation-');
  assert.equal(path.dirname(runtime),'/mnt/data/build/tastedev-linux');
  assert(Buffer.byteLength(runtime+'/redis.sock')<108);
 }finally{if(previous===undefined)delete process.env.TMPDIR;else process.env.TMPDIR=previous;if(runtime)await rm(runtime,{recursive:true,force:true});}
});
test('Redis runtime work rejects shared and symlinked parents; valid custom directories remain private',async()=>{
 const previous=process.env.TMPDIR,root=await mkdtemp('/mnt/data/build/tastedev-linux/redis-work-parent-');
 try{
  process.env.TMPDIR=root;await chmod(root,0o755);
  await assert.rejects(redisWorkDirectory('tastedev-redis-validation-'),/권한/);
  await chmod(root,0o700);process.env.TMPDIR=path.join(root,'alias');await symlink(root,process.env.TMPDIR);
  await assert.rejects(redisWorkDirectory('tastedev-redis-validation-'),/권한/);
  process.env.TMPDIR=root;const runtime=await redisWorkDirectory('tastedev-redis-validation-');assert.equal(path.dirname(runtime),root);
 }finally{if(previous===undefined)delete process.env.TMPDIR;else process.env.TMPDIR=previous;await rm(root,{recursive:true,force:true});}
});
