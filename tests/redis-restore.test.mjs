import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {redisTopology} from '../lib/redis-topology.ts';
import {restoreRedisConfig} from '../lib/redis-restore.ts';
const hash=text=>createHash('sha256').update(text).digest('hex');
test('Redis reviewed restore binds backup and graph versions and preserves full bytes with undo backup',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','redis-reviewed-restore-')),base=path.join(root,'config'),backupRoot=path.join(root,'backups');
 try{
  await mkdir(base,{mode:0o700});await mkdir(backupRoot,{mode:0o700});const main=path.join(base,'redis.conf'),before='port 6379\nrequirepass current-secret\n',restored='port 6380\nrequirepass restored-secret\n';await writeFile(main,before,{mode:0o600});const id=randomUUID(),record={id,target:'/etc/redis/redis.conf',text:restored,version:hash(restored),createdAt:new Date().toISOString()};await writeFile(path.join(backupRoot,id+'.json'),JSON.stringify(record),{mode:0o600});
  const graph=await redisTopology(undefined,base),next=await redisTopology(undefined,base,new Map([[record.target,restored]]));const input={id,confirm:true,version:hash(before),graphVersion:graph.version,restoreGraphVersion:next.version,backupVersion:record.version};let activated=0;const hooks={base,backupRoot,uid:process.getuid(),validatePrepared:async candidate=>assert.equal(await readFile(candidate.main,'utf8'),restored),inspectService:async()=>{},activate:async()=>{activated++;},recover:async()=>{}};
  await assert.rejects(restoreRedisConfig({...input,backupVersion:'0'.repeat(64)},hooks),/backup changed/);await assert.rejects(restoreRedisConfig({...input,version:'0'.repeat(64)},hooks),/configuration changed/);assert.equal(activated,0);assert.equal(await readFile(main,'utf8'),before);
  await assert.rejects(restoreRedisConfig(input,{...hooks,validatePrepared:async()=>{const text='port 6381\n';await writeFile(path.join(backupRoot,id+'.json'),JSON.stringify({...record,text,version:hash(text)}),{mode:0o600});}}),/Configuration changed during validation/);assert.equal(await readFile(main,'utf8'),before);assert.equal(activated,0);await writeFile(path.join(backupRoot,id+'.json'),JSON.stringify(record),{mode:0o600});
  const result=await restoreRedisConfig(input,hooks);assert.equal(result.changed,true);assert.equal(activated,1);assert.equal(await readFile(main,'utf8'),restored);assert.equal((await readdir(backupRoot)).filter(name=>/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}\.json$/.test(name)).length,2);assert(!JSON.stringify(result).includes('secret'));
 }finally{await rm(root,{recursive:true,force:true});}
});
test('reviewed Redis restore recovers original bytes on activation failure but preserves concurrent edits',async()=>{
 for(const externalEdit of [false,true]){
  const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','redis-restore-recovery-')),base=path.join(root,'config'),backupRoot=path.join(root,'backups');
  try{
   await mkdir(base,{mode:0o700});await mkdir(backupRoot,{mode:0o700});const main=path.join(base,'redis.conf'),before='port 6379\nrequirepass original-secret\n',restored='port 6380\nrequirepass backup-secret\n',external='port 6382\nrequirepass concurrent-secret\n';await writeFile(main,before,{mode:0o600});const id=randomUUID(),record={id,target:'/etc/redis/redis.conf',text:restored,version:hash(restored),createdAt:new Date().toISOString()};await writeFile(path.join(backupRoot,id+'.json'),JSON.stringify(record),{mode:0o600});
   const graph=await redisTopology(undefined,base),candidate=await redisTopology(undefined,base,new Map([[record.target,restored]]));let recovered=0;
   const result=await restoreRedisConfig({id,confirm:true,version:hash(before),graphVersion:graph.version,restoreGraphVersion:candidate.version,backupVersion:record.version},{base,backupRoot,uid:process.getuid(),validatePrepared:async()=>{},inspectService:async()=>{},activate:async()=>{if(externalEdit)await writeFile(main,external,{mode:0o600});throw Error('fixture activation failure with secret');},recover:async()=>{recovered++;}});
   assert.equal(result.failed,true);assert.equal(result.restored,!externalEdit);assert.equal(result.recovered,!externalEdit);assert.equal(recovered,externalEdit?0:1);assert.equal(await readFile(main,'utf8'),externalEdit?external:before);assert.equal((await readdir(backupRoot)).filter(name=>/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}\.json$/.test(name)).length,2);assert(!JSON.stringify(result).includes('secret'));
  }finally{await rm(root,{recursive:true,force:true});}
 }
});

test('Redis restore rejects backup replacement during precommit service inspection',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','redis-restore-inspection-')),base=path.join(root,'config'),backupRoot=path.join(root,'backups');
 try{
  await mkdir(base,{mode:0o700});await mkdir(backupRoot,{mode:0o700});const main=path.join(base,'redis.conf'),before='port 6379\n',restored='port 6380\n';await writeFile(main,before,{mode:0o600});
  const id=randomUUID(),record={id,target:'/etc/redis/redis.conf',text:restored,version:hash(restored),createdAt:new Date().toISOString()},backupFile=path.join(backupRoot,id+'.json');await writeFile(backupFile,JSON.stringify(record),{mode:0o600});
  const graph=await redisTopology(undefined,base),next=await redisTopology(undefined,base,new Map([[record.target,restored]]));let inspections=0,activated=0;
  await assert.rejects(restoreRedisConfig({id,confirm:true,version:hash(before),graphVersion:graph.version,restoreGraphVersion:next.version,backupVersion:record.version},{base,backupRoot,uid:process.getuid(),validatePrepared:async()=>{},inspectService:async()=>{if(++inspections===2)await writeFile(backupFile,JSON.stringify({...record,createdAt:'2020-01-01T00:00:00Z'}));},activate:async()=>{activated++;},recover:async()=>{}}),{status:409});
  assert.equal(inspections,2);assert.equal(activated,0);assert.equal(await readFile(main,'utf8'),before);
 }finally{await rm(root,{recursive:true,force:true});}
});
