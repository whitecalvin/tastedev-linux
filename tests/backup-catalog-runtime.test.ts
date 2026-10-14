import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readAdminRuntimeModule} from '../scripts/admin/runtime-source.mts';
import {adminRuntimeFiles} from '../scripts/admin/runtime-files.mts';

test('typed Redis nginx and Node backup readers run as plain JavaScript on Node22',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','catalog-runtime-'));
 try {
  for(const file of adminRuntimeFiles)await writeFile(join(root,file),await readAdminRuntimeModule(file),{mode:0o600});
  const worker=join(root,'worker.mjs');await writeFile(worker,`import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';import {createHash,randomUUID} from 'node:crypto';import {redisBackupRecord,redisBackups} from './redis-backups.mjs';import {nginxConfigBackupRecord,nginxConfigBackups} from './nginx-config-backups.mjs';import {nodeServiceBackups} from './node-app-service-backups.mjs';const root=new URL('.',import.meta.url).pathname.slice(0,-1),uid=process.getuid();for(const kind of ['redis','nginx']){const dir=root+'/'+kind;await mkdir(dir,{mode:448});const id=randomUUID(),text='synthetic-secret',record={id,target:kind==='redis'?'/etc/redis/redis.conf':'/etc/nginx/conf.d/test.conf',text,version:createHash('sha256').update(text).digest('hex'),createdAt:new Date().toISOString()},file=dir+'/'+id+'.json';await writeFile(file,JSON.stringify(record),{mode:384});const read=()=>kind==='redis'?redisBackupRecord(id,dir,uid):nginxConfigBackupRecord(id,{root:dir,ownerUid:uid});assert.equal((await read()).text,text);const list=kind==='redis'?await redisBackups(dir,uid):await nginxConfigBackups({root:dir,ownerUid:uid});assert.equal(list.backups.length,1);assert(!JSON.stringify(list).includes(text));delete record.target;await writeFile(file,JSON.stringify(record));await assert.rejects(read());}await assert.rejects(nodeServiceBackups(null,{callerUid:uid}));console.log('PASS');`,{mode:0o600});
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{encoding:'utf8',env:process.env,timeout:15000});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'PASS');
 }finally{await rm(root,{recursive:true,force:true});}
});
