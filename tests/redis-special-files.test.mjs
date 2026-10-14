import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {redisTopology} from '../lib/redis-topology.ts';
import {redisBackupRecord} from '../lib/redis-backups.ts';
test('Redis graph and backup readers reject real FIFO fixtures without waiting for a writer',{timeout:5000},async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','linux-redis-fifo-')),base=path.join(root,'config'),backups=path.join(root,'backups');
 try{
  await mkdir(base,{mode:0o700});await mkdir(backups,{mode:0o700});await writeFile(path.join(base,'redis.conf'),'include /etc/redis/pipe.conf\n');
  const id=randomUUID();await promisify(execFile)('/usr/bin/mkfifo',[path.join(base,'pipe.conf'),path.join(backups,id+'.json')]);
  assert.equal((await redisTopology(undefined,base)).complete,false);await assert.rejects(redisBackupRecord(id,backups,process.getuid()));
 }finally{await rm(root,{recursive:true,force:true});}
});
