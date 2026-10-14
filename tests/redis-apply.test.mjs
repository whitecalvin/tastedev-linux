import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {applyRedisConfig} from '../lib/redis-apply.ts';
import {redisTopology} from '../lib/redis-topology.ts';
import {isRedisCandidate} from '../lib/redis-candidate.ts';
test('Redis orchestration requires validation and rolls back restart failure using private fixture only',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','linux-redis-apply-')),base=path.join(root,'config'),backupRoot=path.join(root,'backups');
 try{
  await mkdir(base,{mode:0o700});await mkdir(backupRoot,{mode:0o700});const file=path.join(base,'redis.conf'),original='port 6379\nrequirepass private-secret\n';await writeFile(file,original,{mode:0o600});
  const graph=await redisTopology(undefined,base),input={confirm:true,version:graph.version,changes:{port:6380}};
  await assert.rejects(applyRedisConfig(input,{base,backupRoot}),/후보 설정 검수와 실행 서비스 조회 기능이 필요/);assert.equal(await readFile(file,'utf8'),original);
  let validated=0,recovered=0,inspected=0;
  const result=await applyRedisConfig(input,{base,backupRoot,inspectService:async()=>{inspected++;},validatePrepared:async candidate=>{assert(isRedisCandidate(candidate));assert((await readFile(candidate.main,'utf8')).includes('port 6380'));validated++;},activate:async()=>{throw Error('fixture restart failure');},recover:async()=>{recovered++;}});
  assert.equal(result.restored,true);assert.equal(result.recovered,true);assert.equal(validated,1);assert.equal(recovered,1);assert(inspected>=3);assert.equal(await readFile(file,'utf8'),original);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('Redis full restoration gates newly referenced include changes before commit',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','linux-redis-restoration-')),base=path.join(root,'config'),backupRoot=path.join(root,'backups');
 try{
  await mkdir(base,{mode:0o700});await mkdir(backupRoot,{mode:0o700});const main=path.join(base,'redis.conf'),extra=path.join(base,'extra.conf'),original='port 6379\n';
  await writeFile(main,original,{mode:0o600});await writeFile(extra,'maxclients 150\n',{mode:0o600});const graph=await redisTopology(undefined,base),restoreText='port 6380\ninclude /etc/redis/extra.conf\n';let activated=0;
  await assert.rejects(applyRedisConfig({confirm:true,version:graph.version,changes:{}},{base,backupRoot,restoreText,inspectService:async()=>{},validatePrepared:async()=>{await writeFile(extra,'maxclients 200\n');},activate:async()=>{activated++;},recover:async()=>{activated++;}}),error=>error.status===409);
  assert.equal(await readFile(main,'utf8'),original);assert.equal(activated,0);
  // A failed precommit retains the original backup for review but never swaps main.
  assert.equal((await readdir(backupRoot)).filter(name=>/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}\.json$/.test(name)).length,1);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('Redis include edit during candidate validation prevents backup and activation',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','linux-redis-conflict-')),base=path.join(root,'config'),backupRoot=path.join(root,'backups');
 try{
  await mkdir(base,{mode:0o700});await mkdir(backupRoot,{mode:0o700});const main=path.join(base,'redis.conf'),extra=path.join(base,'extra.conf'),original='port 6379\ninclude /etc/redis/extra.conf\n';
  await writeFile(main,original,{mode:0o600});await writeFile(extra,'maxclients 100\n',{mode:0o600});const graph=await redisTopology(undefined,base);let activated=0;
  await assert.rejects(applyRedisConfig({confirm:true,version:graph.version,changes:{port:6380}},{base,backupRoot,inspectService:async()=>{},validatePrepared:async()=>{await writeFile(extra,'maxclients 150\n');},activate:async()=>{activated++;},recover:async()=>{activated++;}}),error=>error.status===409);
  assert.equal(await readFile(main,'utf8'),original);assert.equal(activated,0);assert.deepEqual(await readdir(backupRoot),[]);assert(!(await readdir(base)).some(name=>name.includes('tastedev')));
 }finally{await rm(root,{recursive:true,force:true});}
});
test('Redis restart failure preserves a concurrent main edit and requires manual recovery',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','linux-redis-external-')),base=path.join(root,'config'),backupRoot=path.join(root,'backups');
 try{
  await mkdir(base,{mode:0o700});await mkdir(backupRoot,{mode:0o700});const main=path.join(base,'redis.conf');await writeFile(main,'port 6379\n',{mode:0o600});const graph=await redisTopology(undefined,base);let recovered=0;
  const result=await applyRedisConfig({confirm:true,version:graph.version,changes:{port:6380}},{base,backupRoot,inspectService:async()=>{},validatePrepared:async()=>{},activate:async()=>{await writeFile(main,'port 6382\n');throw Error('fixture restart failure');},recover:async()=>{recovered++;}});
  assert.equal(result.failed,true);assert.equal(result.restored,false);assert.equal(recovered,0);assert.equal(await readFile(main,'utf8'),'port 6382\n');assert.equal((await readdir(backupRoot)).filter(name=>/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}\.json$/.test(name)).length,1);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('Redis validator candidate mutation blocks original replacement and service activation',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','linux-redis-candidate-change-')),base=path.join(root,'config'),backupRoot=path.join(root,'backups');
 try{
  await mkdir(base,{mode:0o700});await mkdir(backupRoot,{mode:0o700});const main=path.join(base,'redis.conf'),original='port 6379\n';await writeFile(main,original,{mode:0o600});const graph=await redisTopology(undefined,base);let activated=0;
  await assert.rejects(applyRedisConfig({confirm:true,version:graph.version,changes:{port:6380}},{base,backupRoot,inspectService:async()=>{},validatePrepared:async candidate=>{await writeFile(candidate.main,'port 6390\n');},activate:async()=>{activated++;},recover:async()=>{activated++;}}),error=>error.status===409);
  assert.equal(await readFile(main,'utf8'),original);assert.equal(activated,0);assert.deepEqual(await readdir(backupRoot),[]);
 }finally{await rm(root,{recursive:true,force:true});}
});
