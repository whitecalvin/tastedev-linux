import {mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {postgresqlClusterUnit,postgresqlClusterStatuses,discoverPostgresqlClusters} from '../lib/postgresql-cluster-status.ts';
test('cluster identity binds main config and HBA to the same exact service without shell inputs',()=>{
 assert.equal(postgresqlClusterUnit('/etc/postgresql/18/main/postgresql.conf'),'postgresql@18-main.service');
 assert.equal(postgresqlClusterUnit('/etc/postgresql/18/main/pg_hba.conf'),'postgresql@18-main.service');
 assert.equal(postgresqlClusterUnit('/etc/postgresql/17/team-one/pg_hba.conf'),'postgresql@17-team-one.service');
 for(const value of ['/mnt/data/build/tastedev-linux/postgresql/18/main/postgresql.conf','/etc/postgresql/18/main/../postgresql.conf','/etc/postgresql/18/main;id/postgresql.conf','/etc/postgresql/18/main/postgresql.auto.conf',null])assert.throws(()=>postgresqlClusterUnit(value));
});
test('one read-only command deduplicates clusters and preserves their individual state',async()=>{
 const files=[{path:'/etc/postgresql/18/main/postgresql.conf'},{path:'/etc/postgresql/18/main/pg_hba.conf'},{path:'/etc/postgresql/17/test/postgresql.conf'}];let calls=0;
 const rows=await postgresqlClusterStatuses(files,async(binary,args,options)=>{calls++;assert.equal(binary,'/usr/bin/systemctl');assert.deepEqual(args.slice(0,3),['show','postgresql@18-main.service','postgresql@17-test.service']);assert.equal(options.timeout,5000);return {stdout:'Id=postgresql@17-test.service\nActiveState=inactive\nSubState=dead\nLoadState=loaded\nUnitFileState=disabled\n\nId=postgresql@18-main.service\nActiveState=active\nSubState=running\nLoadState=loaded\nUnitFileState=enabled\n'};});
 assert.equal(calls,1);assert.equal(rows.length,2);assert.equal(rows[0].SubState,'running');assert.equal(rows[1].ActiveState,'inactive');
});
test('partial systemctl errors retain observed clusters and never infer missing states',async()=>{
 const rows=await postgresqlClusterStatuses([{path:'/etc/postgresql/18/main/postgresql.conf'},{path:'/etc/postgresql/18/absent/postgresql.conf'}],async()=>{throw {code:1,stdout:'Id=postgresql@18-main.service\nActiveState=active\nSubState=running\nLoadState=loaded\n'};});
 assert.equal(rows[0].ActiveState,'active');assert.equal(rows[1].ActiveState,'unknown');assert(rows[1].error);
 let called=false;await assert.rejects(postgresqlClusterStatuses([{path:'/etc/passwd'}],async()=>{called=true;}));assert.equal(called,false);assert.deepEqual(await postgresqlClusterStatuses([],async()=>{called=true;}),[]);assert.equal(called,false);
});

test('cluster discovery lists real config directories without following file or directory links',async()=>{
 const root=await verificationWorkDirectory('pg-cluster-discovery-');
 try{
  for(const cluster of ['main','team-one','no-config'])await mkdir(path.join(root,'18',cluster),{recursive:true});
  await writeFile(path.join(root,'18/main/postgresql.conf'),'port=5432');await writeFile(path.join(root,'18/team-one/postgresql.conf'),'port=5433');
  await symlink(path.join(root,'18/main'),path.join(root,'18/alias'));
  await symlink(path.join(root,'18'),path.join(root,'17'));
  await mkdir(path.join(root,'18/file-link'));await symlink(path.join(root,'18/main/postgresql.conf'),path.join(root,'18/file-link/postgresql.conf'));
  assert.deepEqual(await discoverPostgresqlClusters(root),[{path:'/etc/postgresql/18/main/postgresql.conf'},{path:'/etc/postgresql/18/team-one/postgresql.conf'}]);
  await symlink(root,path.join(root,'root-link'));await assert.rejects(discoverPostgresqlClusters(path.join(root,'root-link')));
  assert.deepEqual(await discoverPostgresqlClusters(path.join(root,'missing')),[]);
 }finally{await rm(root,{recursive:true,force:true});}
});

 test('interrupted and denied cluster queries discard incomplete active observations',async()=>{
 const files=[{path:'/etc/postgresql/18/main/postgresql.conf'}];
 const stdout='Id=postgresql@18-main.service\nActiveState=active\nSubState=running\nLoadState=loaded\n';
 for(const [failure,message] of [
 [{code:1,killed:true},'서비스 상태 조회 시간이 초과되었습니다. 잠시 후 다시 갱신하세요.'],
 [{code:'ETIMEDOUT'},'서비스 상태 조회 시간이 초과되었습니다. 잠시 후 다시 갱신하세요.'],
 [{signal:'SIGTERM'},'서비스 상태 조회가 중단되었습니다. 잠시 후 다시 갱신하세요.'],
 [{code:'EACCES'},'서비스 상태를 조회할 권한이 없습니다. 서버 실행 계정의 권한을 확인하세요.'],
 [{code:'EPERM'},'서비스 상태를 조회할 권한이 없습니다. 서버 실행 계정의 권한을 확인하세요.'],
 [{code:'ENOENT'},'서비스 상태를 확인할 수 없습니다.'],
 ]){const [row]=await postgresqlClusterStatuses(files,async()=>{throw {...failure,stdout};});assert.equal(row.ActiveState,'unknown');assert.equal(row.LoadState,'unknown');assert.equal(row.error,message);}
 const [recovered]=await postgresqlClusterStatuses(files,async()=>({stdout}));assert.equal(recovered.ActiveState,'active');assert.equal(recovered.error,undefined);
});
