import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,chmod,symlink,rm} from 'node:fs/promises';
import path from 'node:path';
import {postgresqlWorkDirectory,isPostgresqlWorkPath} from '../lib/postgresql-work-directory.ts';

test('PostgreSQL work paths stay designated and reject fallback, traversal and unreviewed prefixes',async()=>{
 const previous=process.env.TMPDIR;let created;
 try{
  delete process.env.TMPDIR;created=await postgresqlWorkDirectory('linux-pg-hba-');
  assert.equal(path.dirname(created),'/mnt/data/build/tastedev-linux');
  assert(isPostgresqlWorkPath(created,'linux-pg-hba-'));
  assert(isPostgresqlWorkPath(created+'/files/f0001.conf','linux-pg-hba-',{file:true}));
  for(const parent of ['/tmp','/var/tmp','/mnt/data/build/x/../escape','/mnt/data/build//alias','/mnt/data/build/x;cmd']){
   process.env.TMPDIR=parent;await assert.rejects(postgresqlWorkDirectory('tastedev-pg-config-'),/작업 경로/);
  }
  for(const value of ['/tmp/linux-pg-hba-x','/mnt/data/build/x/../linux-pg-hba-x','/mnt/data/build/linux-pg-hba-x/result.json'])assert(!isPostgresqlWorkPath(value,'linux-pg-hba-'));
  assert(!isPostgresqlWorkPath(created+'/../result.json','linux-pg-hba-',{file:true}));
  await assert.rejects(postgresqlWorkDirectory('../arbitrary'),/작업 종류/);
 }finally{if(previous===undefined)delete process.env.TMPDIR;else process.env.TMPDIR=previous;if(created)await rm(created,{recursive:true,force:true});}
});
test('PostgreSQL work rejects shared/symlinked parents and allocates all restoration purposes privately',async()=>{
 const previous=process.env.TMPDIR,root=await mkdtemp('/mnt/data/build/tastedev-linux/pg-work-parent-');
 try{
  process.env.TMPDIR=root;await chmod(root,0o755);await assert.rejects(postgresqlWorkDirectory('tastedev-pg-original-'),/권한/);
  await chmod(root,0o700);process.env.TMPDIR=path.join(root,'alias');await symlink(root,process.env.TMPDIR);
  await assert.rejects(postgresqlWorkDirectory('tastedev-pg-original-'),/권한/);
  process.env.TMPDIR=root;
  for(const prefix of ['tastedev-pg-original-','tastedev-pg-restore-','tastedev-pg-history-','tastedev-pg-config-']){
   const allocated=await postgresqlWorkDirectory(prefix);assert.equal(path.dirname(allocated),root);assert(isPostgresqlWorkPath(allocated,prefix));
  }
 }finally{if(previous===undefined)delete process.env.TMPDIR;else process.env.TMPDIR=previous;await rm(root,{recursive:true,force:true});}
});
