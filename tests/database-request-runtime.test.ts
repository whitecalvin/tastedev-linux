import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readAdminRuntimeModule} from '../scripts/admin/runtime-source.mts';
import {adminRuntimeFiles} from '../scripts/admin/runtime-files.mts';

test('fixed helper database request validators run Node22 with exact review hashes and no database operations',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','dbreq-'));
 try{
  for(const file of adminRuntimeFiles)await writeFile(join(root,file),await readAdminRuntimeModule(file),{mode:0o600});
  const worker=join(root,'worker.mjs');await writeFile(worker,`import assert from 'node:assert/strict';import {prepareRedisApply} from './redis-apply-request.mjs';import {prepareRedisCode,redisCodeReviewVersion} from './redis-code-request.mjs';import {prepareRedisRestore} from './redis-restore-request.mjs';import {preparePostgresqlCode,postgresqlCodeReviewVersion} from './postgresql-code-request.mjs';import {preparePostgresqlBackupLookup,preparePostgresqlConfigBackup} from './postgresql-backup-request.mjs';const version='a'.repeat(64),graphVersion='b'.repeat(64),candidateGraphVersion='c'.repeat(64),serviceVersion='d'.repeat(64),redis={path:'/etc/redis/redis.conf',version,graphVersion,candidateGraphVersion,text:'port 6380\\n'};assert.equal(prepareRedisApply({path:redis.path,version,graphVersion,changes:{port:6380},confirm:true}).changes.port,6380);const reviewed=prepareRedisCode(redis);assert.deepEqual(prepareRedisCode({...reviewed,reviewVersion:redisCodeReviewVersion(reviewed),confirm:true},true),{...reviewed,reviewVersion:redisCodeReviewVersion(reviewed),confirm:true});assert.throws(()=>prepareRedisCode({...reviewed,text:'port 6390\\n',reviewVersion:redisCodeReviewVersion(reviewed),confirm:true},true));const restored=prepareRedisRestore({id:'12345678-1234-1234-1234-123456789abc',version,graphVersion,restoreGraphVersion:candidateGraphVersion,backupVersion:serviceVersion,confirm:true});assert(Object.isFrozen(restored));assert.throws(()=>prepareRedisRestore({...restored,command:'not-allowed'}));const pg=preparePostgresqlCode({path:'/etc/postgresql/18/main/postgresql.conf',version,graphVersion,candidateGraphVersion,serviceVersion,text:'port = 5432\\n'}),committed=preparePostgresqlCode({...pg,confirm:true,reviewVersion:postgresqlCodeReviewVersion(pg)},true);assert.equal(committed.path,pg.path);assert.throws(()=>preparePostgresqlCode({...pg,confirm:true,serviceVersion:version,reviewVersion:postgresqlCodeReviewVersion(pg)},true));assert.deepEqual(preparePostgresqlBackupLookup(null),{});assert.equal(preparePostgresqlConfigBackup({path:pg.path,version,confirm:true}).path,pg.path);assert.throws(()=>preparePostgresqlConfigBackup({path:'/etc/passwd',version,confirm:true}));console.log('PASS');`,{mode:0o600});
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{encoding:'utf8',env:process.env,timeout:15000});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'PASS');
 }finally{await rm(root,{recursive:true,force:true});}
});
