import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,chmod,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {redisBackupRecord,redisBackups} from '../lib/redis-backups.ts';
test('Redis backup reader validates private full records while public catalog omits credentials',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','linux-redis-backups-')),uid=process.getuid(),id=randomUUID(),text='requirepass private-secret\nport 6379\n';
 try{
  const record={id,target:'/etc/redis/redis.conf',text,version:createHash('sha256').update(text).digest('hex'),createdAt:new Date().toISOString()};
  const file=path.join(root,id+'.json');await writeFile(file,JSON.stringify(record),{mode:0o600});assert.equal((await redisBackupRecord(id,root,uid)).text,text);
  let result=await redisBackups(root,uid);assert.equal(result.backups.length,1);assert(!JSON.stringify(result).includes('private-secret'));assert(!Object.hasOwn(result.backups[0],'text'));
  const missingTarget={...record};delete missingTarget.target;await writeFile(file,JSON.stringify(missingTarget));await assert.rejects(redisBackupRecord(id,root,uid,undefined));await writeFile(file,JSON.stringify(record));
  await chmod(file,0o644);await assert.rejects(redisBackupRecord(id,root,uid));result=await redisBackups(root,uid);assert.equal(result.warnings,1);assert.equal(result.backups.length,0);
  await chmod(file,0o600);await writeFile(file,JSON.stringify({...record,target:'/tmp/unrelated.conf'}));await assert.rejects(redisBackupRecord(id,root,uid));
  await assert.rejects(redisBackupRecord('../private-secret',root,uid));
  await rm(file);await symlink('/tmp/unrelated.json',file);await assert.rejects(redisBackupRecord(id,root,uid));
 }finally{await rm(root,{recursive:true,force:true});}
});
