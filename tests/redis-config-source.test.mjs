import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,chmod,rm,symlink,link,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {liveConfig,readRedisConfigSource} from '../lib/config-live.ts';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';

test('Redis protected configuration stays selectable without changing permissions',async()=>{
 const root=await verificationWorkDirectory('redis-source-discovery-'),directory=join(root,'redis'),file=join(directory,'redis.conf');
 try{
  await mkdir(directory);await writeFile(file,'port 6379\n',{mode:0o600});await chmod(file,0);
  assert.notEqual(process.getuid(),0,'permission fixture must run as an ordinary user');
  const result=await liveConfig('redis',root);
  assert.equal(result.configs.length,1);assert.equal(result.configs[0].path,'/etc/redis/redis.conf');assert.equal(result.configs[0].error,'EACCES');assert.equal(result.configs[0].version,null);
  assert.equal((await stat(file)).mode&0o777,0);assert.deepEqual(result.warnings,[]);
 }finally{await chmod(file,0o600).catch(()=>{});await rm(root,{recursive:true,force:true});}
});

test('privileged Redis source rejects inputs, links and unsafe bytes; returns exact text and digest',async()=>{
 const root=await verificationWorkDirectory('redis-source-safety-'),directory=join(root,'redis'),file=join(directory,'redis.conf'),other=join(root,'other');
 try{
  await mkdir(directory);const text='port 6379\n# 한국어\n';await writeFile(file,text,{mode:0o600});
  assert.deepEqual(await readRedisConfigSource({},root),{text,version:createHash('sha256').update(text).digest('hex')});
  for(const input of [null,[],{path:'/etc/passwd'},{command:'cat /etc/passwd'}])await assert.rejects(readRedisConfigSource(input,root),/경로나 명령/);
  await writeFile(other,'secret');await rm(file);await symlink(other,file);await assert.rejects(readRedisConfigSource({},root),/심볼릭 링크/);
  await rm(file);await link(other,file);await assert.rejects(readRedisConfigSource({},root),/안전하게/);
  await rm(file);await writeFile(file,Buffer.from([0xff]));await assert.rejects(readRedisConfigSource({},root),/안전하게/);
  await writeFile(file,'x\0y');await assert.rejects(readRedisConfigSource({},root),/안전하게/);
  await writeFile(file,'x'.repeat(262145));await assert.rejects(readRedisConfigSource({},root),/안전하게/);
 }finally{await rm(root,{recursive:true,force:true});}
});
