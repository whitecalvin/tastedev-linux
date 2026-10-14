import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,lstat,rm,symlink,link,chmod,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createDatabaseConfigBackup,prepareDatabaseConfigBackup} from '../lib/database-config-backup.ts';
import {redisBackupRecord} from '../lib/redis-backups.ts';
const hash=text=>createHash('sha256').update(text).digest('hex');
async function fixture(kind,run){
 const root=await mkdtemp('/mnt/data/build/tastedev-linux/tastedev-manual-db-backup-');
 try{
  const base=root+'/config',backupRoot=root+'/backups';await mkdir(base,{mode:0o700});
  const target=kind==='redis'?'/etc/redis/redis.conf':'/etc/mysql/my.cnf',file=base+'/'+target.split('/').at(-1);
  const text=kind==='redis'?'# 한글\nrequirepass fixture-only-secret\nport 6379\n':'# 한글\n[mysqld]\nmax_connections=100\n';
  await writeFile(file,text,{mode:0o600});
  await run({root,base,backupRoot,target,file,text,input:{path:target,version:hash(text),confirm:true},options:{base,backupRoot,ownerUid:process.getuid()}});
 }finally{await rm(root,{recursive:true,force:true});}
}
test('manual DB backup only accepts fixed package paths, exact versions and explicit confirmation',()=>{
 for(const kind of ['redis','mariadb']){
  const valid={path:kind==='redis'?'/etc/redis/redis.conf':'/etc/mysql/conf.d/custom.cnf',version:'a'.repeat(64),confirm:true};
  assert.deepEqual(prepareDatabaseConfigBackup(kind,valid),valid);
  for(const change of [{confirm:false},{version:'stale'},{path:'/etc/passwd'},{path:'/etc/mysql/conf.d/../my.cnf'},{path:'/etc/redis/other.conf'},{text:'draft'},{base:'/tmp'},{ownerUid:0}])assert.throws(()=>prepareDatabaseConfigBackup(kind,{...valid,...change}),error=>error.status===400);
 }
});
for(const kind of ['redis','mariadb']){
 test(kind+' creates a private restore-compatible operating file backup without touching its contents',async()=>fixture(kind,async ctx=>{
  const result=await createDatabaseConfigBackup(kind,ctx.input,ctx.options);
  assert.equal(result.created,true);assert.equal(result.operatingConfigurationChanged,false);assert.equal(result.operatingServiceChanged,false);assert.equal(result.scope,'selected-operating-file');
  assert(!JSON.stringify(result).includes(ctx.text));assert(!JSON.stringify(result).includes('fixture-only-secret'));
  const record=JSON.parse(await readFile(ctx.backupRoot+'/'+result.backup.id+'.json','utf8'));
  assert.equal(record.target,ctx.target);assert.equal(record.text,ctx.text);assert.equal(record.version,hash(record.text));
  assert.equal((await lstat(ctx.backupRoot)).mode&0o777,0o700);assert.equal((await lstat(ctx.backupRoot+'/'+record.id+'.json')).mode&0o777,0o600);
  assert.equal(await readFile(ctx.file,'utf8'),ctx.text);assert.deepEqual(await readdir(ctx.base),[ctx.target.split('/').at(-1)]);
  assert.deepEqual(await readdir(ctx.backupRoot),[record.id+'.json']);
  if(kind==='redis')assert.equal((await redisBackupRecord(record.id,ctx.backupRoot,process.getuid())).text,ctx.text);
 }));
 test(kind+' rejects stale or concurrently replaced files without publishing a partial backup',async()=>fixture(kind,async ctx=>{
  await assert.rejects(createDatabaseConfigBackup(kind,{...ctx.input,version:hash('old')},ctx.options),error=>error.status===409);
  assert.deepEqual(await readdir(ctx.backupRoot),[]);
  await assert.rejects(createDatabaseConfigBackup(kind,ctx.input,{...ctx.options,beforePublish:async()=>{await writeFile(ctx.file+'.new',ctx.text,{mode:0o600});await rename(ctx.file+'.new',ctx.file);}}),error=>error.status===409);
  assert.deepEqual(await readdir(ctx.backupRoot),[]);assert.equal(await readFile(ctx.file,'utf8'),ctx.text);
 }));
 test(kind+' rejects symlinks, hardlinks and writable source files',async()=>fixture(kind,async ctx=>{
  await rename(ctx.file,ctx.file+'.original');await symlink(ctx.file+'.original',ctx.file);
  await assert.rejects(createDatabaseConfigBackup(kind,ctx.input,ctx.options));await rm(ctx.file);await rename(ctx.file+'.original',ctx.file);
  await link(ctx.file,ctx.file+'.link');await assert.rejects(createDatabaseConfigBackup(kind,ctx.input,ctx.options));await rm(ctx.file+'.link');
  await chmod(ctx.file,0o666);await assert.rejects(createDatabaseConfigBackup(kind,ctx.input,ctx.options));assert.deepEqual(await readdir(ctx.backupRoot),[]);
 }));
 test(kind+' rejects an unsafe backup directory and preserves invalid source bytes',async()=>fixture(kind,async ctx=>{
  await mkdir(ctx.backupRoot,{mode:0o755});await assert.rejects(createDatabaseConfigBackup(kind,ctx.input,ctx.options));assert.equal((await lstat(ctx.backupRoot)).mode&0o777,0o755);
  await chmod(ctx.backupRoot,0o700);const bytes=Buffer.from([0xff,0x00,0x41]);await writeFile(ctx.file,bytes);
  await assert.rejects(createDatabaseConfigBackup(kind,{...ctx.input,version:hash(bytes)},ctx.options));assert.deepEqual(await readFile(ctx.file),bytes);assert.deepEqual(await readdir(ctx.backupRoot),[]);
 }));
}
