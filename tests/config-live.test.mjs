import test from 'node:test';
import assert from 'node:assert/strict';
import {parseLiveConfig,liveConfig,readLiveConfig} from '../lib/config-live.ts';
import {mkdtemp,mkdir,writeFile,symlink,rm,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('MariaDB alternatives alias inventories its regular canonical main once without permitting arbitrary linked sources',async()=>{
 const root=await mkdtemp('/mnt/data/build/tastedev-linux/maria-alias-');
 try{
  await mkdir(join(root,'mysql'));await mkdir(join(root,'alternatives'));
  await writeFile(join(root,'mysql/mariadb.cnf'),'[mysqld]\nport=3307\npassword=private-fixture\n');
  await symlink('../mysql/mariadb.cnf',join(root,'alternatives/my.cnf'));
  await symlink('../alternatives/my.cnf',join(root,'mysql/my.cnf'));
  const result=await liveConfig('mariadb',root);
  assert.deepEqual(result.warnings,[]);assert.equal(result.configs.length,1);
  assert.equal(result.configs[0].path,'/etc/mysql/mariadb.cnf');assert.equal(result.configs[0].values.port,3307);
  assert(!JSON.stringify(result).includes('private-fixture'));
  await assert.rejects(readLiveConfig('mariadb','/etc/mysql/my.cnf',root),/심볼릭 링크/);
  await rm(join(root,'mysql/my.cnf'));await writeFile(join(root,'other.cnf'),'[mysqld]\nport=6666\n');await symlink('../other.cnf',join(root,'mysql/my.cnf'));
  const rejected=await liveConfig('mariadb',root);assert.equal(rejected.warnings.length,1);assert.equal(rejected.configs.length,1);
  await rm(join(root,'mysql/my.cnf'));await symlink('mariadb.cnf',join(root,'mysql/my.cnf'));await rm(join(root,'mysql/mariadb.cnf'));await symlink('../other.cnf',join(root,'mysql/mariadb.cnf'));
  assert.equal((await liveConfig('mariadb',root)).configs.length,0);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('live configuration imports supported fields without returning secrets or guessing unsupported values',()=>{
 const pg=parseLiveConfig('postgresql',"port = 5433\nshared_buffers = '1GB'\nwork_mem = 4096\nlogging_collector = on\npassword = 'secret'\n");assert.deepEqual(pg.values,{port:5433,sharedBuffers:1024,workMem:4,logging:true});assert(!JSON.stringify(pg).includes('secret'));
 const maria=parseLiveConfig('mariadb','[client]\nport=5555\npassword=secret\n[mariadbd]\nport=3307\ninnodb_buffer_pool_size=256M\nslow_query_log=ON\n');assert.deepEqual(maria.values,{port:3307,bufferPool:256,slowLog:true});
 const redis=parseLiveConfig('redis','maxmemory 256mb\nappendonly yes\nport 6380\nrequirepass secret\nport invalid\n');assert.deepEqual(redis.values,{maxMemory:256,appendOnly:true});assert.equal(redis.warnings.length,1);assert.deepEqual(parseLiveConfig('redis','maxmemory 256m').values,{});assert.throws(()=>parseLiveConfig('../passwd',''));
});
test('live configuration discovers multiple clusters and rejects symlinked files',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','linux-config-live-'));
 try{for(const cluster of ['main','test']){await mkdir(join(root,'postgresql/16',cluster),{recursive:true});await writeFile(join(root,'postgresql/16',cluster,'postgresql.conf'),'port=5433\n');}assert.equal((await liveConfig('postgresql',root)).configs.length,2);
 await mkdir(join(root,'redis'));await writeFile(join(root,'secret'),'requirepass private');await symlink(join(root,'secret'),join(root,'redis/redis.conf'));const result=await liveConfig('redis',root);assert.equal(result.configs.length,0);assert.equal(result.warnings.length,1);assert(!JSON.stringify(result).includes('private'));
 }finally{await rm(root,{recursive:true,force:true});}
});

test('PostgreSQL HBA discovery exposes metadata only and bounded source reads reject symlinks and other paths',async()=>{const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','linux-hba-live-'));try{const directory=join(root,'postgresql/18/main');await mkdir(directory,{recursive:true});await writeFile(join(directory,'postgresql.conf'),'port=5432\n');const source='local all all peer # fixture-private\n';await writeFile(join(directory,'pg_hba.conf'),source);const result=await liveConfig('postgresql',root);assert.equal(result.configs.length,2);assert.equal(result.configs.find(file=>file.format==='hba').path,'/etc/postgresql/18/main/pg_hba.conf');assert(!JSON.stringify(result).includes('fixture-private'));assert.equal((await readLiveConfig('postgresql','/etc/postgresql/18/main/pg_hba.conf',root)).text,source);await assert.rejects(readLiveConfig('postgresql','/etc/postgresql/18/main/../pg_hba.conf',root));await rm(join(directory,'pg_hba.conf'));await symlink(join(directory,'postgresql.conf'),join(directory,'pg_hba.conf'));await assert.rejects(readLiveConfig('postgresql','/etc/postgresql/18/main/pg_hba.conf',root));assert(!(await liveConfig('postgresql',root)).configs.some(file=>file.format==='hba'));}finally{await rm(root,{recursive:true,force:true});}});

test('protected HBA stays in the explorer without a premature global failure; source selection still denies access',{skip:process.getuid?.()===0},async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','linux-hba-permission-'));
 const directory=join(root,'postgresql/18/main'),file=join(directory,'pg_hba.conf');
 try{
  await mkdir(directory,{recursive:true});await writeFile(join(directory,'postgresql.conf'),'port=5432\n');
  await writeFile(file,'local all all peer # private-fixture\n');await chmod(file,0);
  const result=await liveConfig('postgresql',root),hba=result.configs.find(item=>item.format==='hba');
  assert.equal(hba.path,'/etc/postgresql/18/main/pg_hba.conf');assert.equal(hba.error,'EACCES');assert.equal(hba.version,null);
  assert.deepEqual(hba.warnings,['설정 파일을 읽을 권한이 없습니다.']);assert.deepEqual(result.warnings,[]);
  assert(!JSON.stringify(result).includes('private-fixture'));
  await assert.rejects(readLiveConfig('postgresql',hba.path,root),error=>error.status===403);
 }finally{await chmod(file,0o600).catch(()=>{});await rm(root,{recursive:true,force:true});}
});

test('operational config source rejects invalid UTF-8, NUL, and linked ancestors',async()=>{const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','linux-hba-encoding-'));try{const directory=join(root,'postgresql/18/main');await mkdir(directory,{recursive:true});const file=join(directory,'pg_hba.conf');for(const bytes of [Buffer.from([0xff]),Buffer.from('local all all peer\0')]){await writeFile(file,bytes);await assert.rejects(readLiveConfig('postgresql','/etc/postgresql/18/main/pg_hba.conf',root));}await rm(join(root,'postgresql/18/main'),{recursive:true});await mkdir(join(root,'outside'));await writeFile(join(root,'outside','pg_hba.conf'),'local all all peer');await symlink(join(root,'outside'),directory);await assert.rejects(readLiveConfig('postgresql','/etc/postgresql/18/main/pg_hba.conf',root));}finally{await rm(root,{recursive:true,force:true});}});

test('Redis supported-field import does not reinterpret trailing hash or semicolon arguments as comments',()=>{
 const parsed=parseLiveConfig('redis','port 6379 # literal\nappendonly yes ; literal\nmaxmemory "256mb" # literal\n');assert.deepEqual(parsed.values,{});assert.equal(parsed.warnings.length,3);
 assert.deepEqual(parseLiveConfig('redis','port "6380"\nappendonly "yes"\n# explanatory comment\n').values,{port:6380,appendOnly:true});
});

test('MariaDB import recognizes option aliases and keeps semicolons as value characters',()=>{
 const result=parseLiveConfig('mariadb','[client]\nmax-connections=999\n[mysqld]\ncharacter_set_server=utf8mb4\nmax-connections=200 # comment\nport=3307; literal\nslow-query-log="ON" # comment\n');
 assert.deepEqual(result.values,{charset:'utf8mb4',connections:200,slowLog:true});assert.equal(result.warnings.length,1);
});

test('MariaDB discovered files provide actual group metadata for SSR without leaking option secrets',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','linux-maria-groups-'));try{await mkdir(join(root,'mysql/conf.d'),{recursive:true});await writeFile(join(root,'mysql/conf.d/fixture.cnf'),'[client]\npassword=fixture-private\n[mysqld]\nport=3307\n[empty]\n');const result=await liveConfig('mariadb',root);assert.deepEqual(result.configs[0].groups,['client','mysqld','empty']);assert(!JSON.stringify(result).includes('fixture-private'));assert.equal(result.configs[0].values.port,3307);}finally{await rm(root,{recursive:true,force:true});}
});
