import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,lstat,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createPostgresqlConfigBackup} from '../lib/postgresql-config-backup.ts';
import {preparePostgresqlConfigBackup} from '../lib/postgresql-backup-request.ts';
import {readPostgresqlGraphArchive} from '../lib/postgresql-graph-archive.ts';
const hash=text=>createHash('sha256').update(text).digest('hex'),target='/etc/postgresql/16/main/postgresql.conf';
const original="port = 5432\ninclude_dir = 'conf.d'\ninclude_if_exists = 'missing.conf'\n",included='work_mem = 4096\n';
async function fixture(run){const base=await mkdtemp('/mnt/data/build/tastedev-linux/pg-manual-backup-');try{
 const directory=base+'/postgresql/16/main',backupRoot=base+'/backups';await mkdir(directory+'/conf.d',{recursive:true,mode:0o700});await mkdir(backupRoot,{mode:0o700});
 const file=directory+'/postgresql.conf';await writeFile(file,original,{mode:0o600});await writeFile(directory+'/conf.d/10-memory.conf',included,{mode:0o600});
 const service={identityVerified:true,settingsSource:'running-server',config:target,hba:'/etc/postgresql/16/main/pg_hba.conf',data:'/var/lib/postgresql/16/main',unit:'postgresql@16-main.service',major:16,pid:100,start:'fixed',values:{port:'5432',max_connections:'100',shared_buffers:'16384',work_mem:'4096',logging_collector:'off'},autoConfiguration:{present:true,version:hash('auto')},configurationErrors:0};
 const dependencies={base,backupRoot,ownerUid:process.getuid(),inspectService:async()=>service,validate:()=>assert.fail('backup cannot validate a candidate'),control:()=>assert.fail('backup cannot control a service')};
 await run({base,directory,file,backupRoot,service,dependencies,input:{path:target,version:hash(original),confirm:true}});
 }finally{await rm(base,{recursive:true,force:true});}}
test('manual PostgreSQL backup rejects ambiguous requests and caller privilege options',()=>{
 const input={path:target,version:hash(original),confirm:true};assert.deepEqual(preparePostgresqlConfigBackup(input),input);
 for(const change of [{confirm:false},{version:'stale'},{path:null},{path:'/etc/postgresql/16/main/pg_hba.conf'},{base:'/tmp'},{ownerUid:0},{text:'draft'}])assert.throws(()=>preparePostgresqlConfigBackup({...input,...change}),error=>error.status===400);
});
test('manual PostgreSQL backup captures operational include graph with private restore metadata and no activation',async()=>fixture(async ctx=>{
 const result=await createPostgresqlConfigBackup(ctx.input,ctx.dependencies);assert.equal(result.created,true);assert.equal(result.fileCount,2);assert.equal(result.operatingConfigurationChanged,false);assert.equal(result.operatingServiceChanged,false);
 assert.equal(await readFile(ctx.file,'utf8'),original);assert.equal(await readFile(ctx.directory+'/conf.d/10-memory.conf','utf8'),included);
 const metadata=ctx.backupRoot+'/'+result.backup.id+'.json',record=JSON.parse(await readFile(metadata,'utf8'));
 assert.equal(record.target,target);assert.equal(record.text,original);assert.equal(record.context.scope.unit,'postgresql@16-main.service');assert.equal((await lstat(metadata)).mode&0o777,0o600);assert.equal((await lstat(ctx.backupRoot)).mode&0o777,0o700);
 const archive=await readPostgresqlGraphArchive(record.context.graphArchive,ctx.backupRoot,target);assert.equal(archive.sources.find(source=>source.path.endsWith('/10-memory.conf')).text,included);assert.equal(archive.sources.find(source=>source.path===target).text,original);assert(!JSON.stringify(result).includes('work_mem'));
}));
test('stale PostgreSQL source refuses backup before publishing metadata',async()=>fixture(async ctx=>{
 await assert.rejects(createPostgresqlConfigBackup({...ctx.input,version:hash('stale')},ctx.dependencies),error=>error.status===409);assert.deepEqual(await readdir(ctx.backupRoot),[]);
}));
test('changed running PostgreSQL identity refuses backup before publishing metadata',async()=>fixture(async ctx=>{
 let reads=0;ctx.dependencies.inspectService=async()=>({...ctx.service,pid:++reads===1?100:101});await assert.rejects(createPostgresqlConfigBackup(ctx.input,ctx.dependencies),error=>error.status===409);assert.deepEqual(await readdir(ctx.backupRoot),[]);assert.equal(await readFile(ctx.file,'utf8'),original);
}));
test('included source change during publication refuses restore metadata',async()=>fixture(async ctx=>{
 let reads=0;ctx.dependencies.inspectService=async()=>{if(++reads===3)await writeFile(ctx.directory+'/conf.d/10-memory.conf','work_mem = 8192\n');return ctx.service;};await assert.rejects(createPostgresqlConfigBackup(ctx.input,ctx.dependencies));assert(!(await readdir(ctx.backupRoot)).some(name=>name.endsWith('.json')));assert.equal(await readFile(ctx.file,'utf8'),original);
}));
