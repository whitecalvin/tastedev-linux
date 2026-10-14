import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readAdminRuntimeModule} from '../scripts/admin/runtime-source.mts';
import {adminRuntimeFiles} from '../scripts/admin/runtime-files.mts';

test('fixed helper private database backup runs Node22 without changing source or exposing text in metadata',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','dbbackup-'));
 try{
  for(const file of adminRuntimeFiles)await writeFile(join(root,file),await readAdminRuntimeModule(file),{mode:0o600});
  const worker=join(root,'worker.mjs');await writeFile(worker,`import assert from 'node:assert/strict';import {mkdir,writeFile,readFile,lstat} from 'node:fs/promises';import {createHash} from 'node:crypto';import {createDatabaseConfigBackup} from './database-config-backup.mjs';import {mariadbRecoveryBackup} from './mariadb-recovery-backup.mjs';const root=new URL('.',import.meta.url).pathname.slice(0,-1),hash=text=>createHash('sha256').update(text).digest('hex');for(const kind of ['redis','mariadb']){const base=root+'/'+kind,backupRoot=root+'/'+kind+'-backups',name=kind==='redis'?'redis.conf':'mariadb.cnf',target=kind==='redis'?'/etc/redis/redis.conf':'/etc/mysql/mariadb.cnf',text=kind==='redis'?'port 6379\\nrequirepass synthetic-secret\\n':'[mariadbd]\\nport=3306\\npassword=synthetic-secret\\n';await mkdir(base,{mode:448});await writeFile(base+'/'+name,text,{mode:384});const saved=await createDatabaseConfigBackup(kind,{path:target,version:hash(text),confirm:true},{base,backupRoot,ownerUid:process.getuid()});assert.equal(saved.created,true);assert.equal(saved.operatingConfigurationChanged,false);assert(!JSON.stringify(saved).includes('synthetic-secret'));const file=backupRoot+'/'+saved.backup.id+'.json',record=JSON.parse(await readFile(file,'utf8'));assert.equal(record.text,text);assert.equal((await lstat(file)).mode&511,384);assert.equal(await readFile(base+'/'+name,'utf8'),text);await assert.rejects(createDatabaseConfigBackup(kind,{path:target,version:'0'.repeat(64),confirm:true},{base,backupRoot,ownerUid:process.getuid()}));if(kind==='mariadb'){assert.equal((await mariadbRecoveryBackup(saved.backup.id,backupRoot,process.getuid(),target)).text,text);delete record.target;await writeFile(file,JSON.stringify(record));await assert.rejects(mariadbRecoveryBackup(saved.backup.id,backupRoot,process.getuid(),undefined));}}console.log('PASS');`,{mode:0o600});
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{encoding:'utf8',env:process.env,timeout:15000});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'PASS');
 }finally{await rm(root,{recursive:true,force:true});}
});
