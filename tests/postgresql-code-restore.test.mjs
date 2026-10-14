import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {postgresqlConfigGraph} from '../lib/postgresql-config-graph.ts';
import {postgresqlCodeOperationPlan,applyPostgresqlCodeOperation} from '../lib/postgresql-code-operation.ts';
import {preparePostgresqlCodeRestore,postgresqlCodeRestorePlan,restorePostgresqlCode} from '../lib/postgresql-code-restore.ts';
const hash=text=>createHash('sha256').update(text).digest('hex'),target='/etc/postgresql/16/main/postgresql.conf';
const original="port=5432\ninclude='extra.conf'\npassword='private-original'\n",draft="port=5433\ninclude='extra.conf'\npassword='private-draft'\n";
const values=port=>({port,max_connections:'100',shared_buffers:'16384',work_mem:'4096',logging_collector:'off'});
async function fixture(run){const base=await mkdtemp('/mnt/data/build/tastedev-linux/pg-code-restore-');try{const directory=base+'/postgresql/16/main',backupRoot=base+'/backup';await mkdir(directory,{recursive:true,mode:0o700});await mkdir(backupRoot,{mode:0o700});const file=directory+'/postgresql.conf';await writeFile(file,original,{mode:0o600});await writeFile(directory+'/extra.conf','max_connections=100\n',{mode:0o600});let runtime=values('5432'),pid=100;const events=[];
const dependencies={base,backupRoot,ownerUid:process.getuid(),inspectService:async()=>({identityVerified:true,settingsSource:'running-server',config:target,hba:'/etc/postgresql/16/main/pg_hba.conf',data:'/var/lib/postgresql/16/main',unit:'postgresql@16-main.service',major:16,pid,start:'456',values:runtime,autoConfiguration:{present:false,version:hash('missing')},configurationErrors:0}),validate:async(path,text)=>{events.push('validate');const graph=await postgresqlConfigGraph(path,{base,overrides:new Map([[path,text]])});return {valid:true,scope:'private-config-options',namespaceCommandsCompleted:true,operatingConfigurationChanged:false,operatingServiceChanged:false,postmasterStarted:false,graphVersion:graph.version,values:values(text.includes('5433')?'5433':'5432')};},validateArchive:async archive=>{events.push('validate');return {valid:true,scope:'private-config-options',namespaceCommandsCompleted:true,operatingConfigurationChanged:false,operatingServiceChanged:false,postmasterStarted:false,graphVersion:archive.graph.version,values:values(archive.sources.find(source=>source.path===target).text.includes('5433')?'5433':'5432')};},control:async()=>{events.push('restart');runtime=values((await readFile(file,'utf8')).includes('5433')?'5433':'5432');pid++;}};
const input={path:target,version:hash(original),text:draft},plan=await postgresqlCodeOperationPlan(input,dependencies);const result=await applyPostgresqlCodeOperation({...input,graphVersion:plan.graphVersion,candidateGraphVersion:plan.candidateGraphVersion,serviceVersion:plan.serviceVersion,reviewVersion:plan.reviewVersion,confirm:true},dependencies);events.length=0;
await run({base,directory,file,backupRoot,dependencies,events,id:result.backupId});}finally{await rm(base,{recursive:true,force:true});}}
const commit=plan=>Object.fromEntries(['path','id','version','graphVersion','candidateGraphVersion','serviceVersion','backupVersion','backupIdentity','reviewVersion'].map(key=>[key,plan[key]]).concat([['confirm',true]]));
test('PostgreSQL backup restore validates full include graph and runtime before applying private backup',async()=>fixture(async ctx=>{
const plan=await postgresqlCodeRestorePlan({path:target,id:ctx.id},ctx.dependencies);assert.equal(await readFile(ctx.file,'utf8'),draft);assert.equal(plan.changed,true);assert(!JSON.stringify(plan).includes('private-original'));assert(!JSON.stringify(plan).includes('private-draft'));
const result=await restorePostgresqlCode(commit(plan),ctx.dependencies);assert.equal(result.changed,true);assert.equal(result.journalCleanupVerified,true);assert.equal(await readFile(ctx.file,'utf8'),original);assert(ctx.events.filter(value=>value==='validate').length>=2);assert.equal(ctx.events.filter(value=>value==='restart').length,1);assert.match(result.historyId,/^[a-f0-9-]{36}$/);assert.match(result.backupId,/^[a-f0-9-]{36}$/);assert.equal(result.undoBackupAvailable,true);
}));
test('PostgreSQL backup restore includes changed referenced files in the review',async()=>fixture(async ctx=>{
await writeFile(ctx.directory+'/extra.conf','max_connections=200\n');const plan=await postgresqlCodeRestorePlan({path:target,id:ctx.id},ctx.dependencies);assert.equal(plan.files.find(file=>file.path.endsWith('/extra.conf')).action,'update');await restorePostgresqlCode(commit(plan),ctx.dependencies);assert.equal(await readFile(ctx.directory+'/extra.conf','utf8'),'max_connections=100\n');assert.equal(await readFile(ctx.file,'utf8'),original);assert(ctx.events.includes('restart'));
}));
test('PostgreSQL backup restore binds backup metadata and exact review without accepting client source/options',async()=>fixture(async ctx=>{
const plan=await postgresqlCodeRestorePlan({path:target,id:ctx.id},ctx.dependencies),input=commit(plan);
for(const edit of [{confirm:false},{text:original},{base:'/tmp'},{backupIdentity:hash('changed')},{reviewVersion:hash('changed')}])await assert.rejects(restorePostgresqlCode({...input,...edit},ctx.dependencies));
const name=ctx.backupRoot+'/'+ctx.id+'.json',record=JSON.parse(await readFile(name,'utf8'));record.createdAt='2026-10-01T00:00:00Z';await writeFile(name,JSON.stringify(record));await assert.rejects(restorePostgresqlCode(input,ctx.dependencies));assert.equal(await readFile(ctx.file,'utf8'),draft);assert(!ctx.events.includes('restart'));
}));
test('PostgreSQL backup restore catches backup replacement during validation before changing config',async()=>fixture(async ctx=>{
const plan=await postgresqlCodeRestorePlan({path:target,id:ctx.id},ctx.dependencies),validate=ctx.dependencies.validateArchive;ctx.dependencies.validateArchive=async(...args)=>{const name=ctx.backupRoot+'/'+ctx.id+'.json',record=JSON.parse(await readFile(name,'utf8'));record.createdAt='2026-10-02T00:00:00Z';await writeFile(name,JSON.stringify(record));return validate(...args);};await assert.rejects(restorePostgresqlCode(commit(plan),ctx.dependencies));assert.equal(await readFile(ctx.file,'utf8'),draft);assert(!ctx.events.includes('restart'));
}));
test('PostgreSQL backup restore rejects malformed proof types and non-main target',()=>{for(const input of [{path:target,id:'wrong'},{path:target.replace('postgresql.conf','extra.conf'),id:'00000000-0000-0000-0000-000000000000'},{path:target,id:'00000000-0000-0000-0000-000000000000',version:[]},{path:target,id:'00000000-0000-0000-0000-000000000000',ownerUid:0}])assert.throws(()=>preparePostgresqlCodeRestore(input));});

test('full graph restore creates an independent original backup that can restore included edits after a completed restore',async()=>fixture(async ctx=>{
 await writeFile(ctx.directory+'/extra.conf','max_connections=200\n');
 const originalBefore=await readFile(ctx.file,'utf8'),includedBefore=await readFile(ctx.directory+'/extra.conf','utf8');
 const plan=await postgresqlCodeRestorePlan({path:target,id:ctx.id},ctx.dependencies);
 const result=await restorePostgresqlCode(commit(plan),ctx.dependencies);
 const metadata=JSON.parse(await readFile(ctx.backupRoot+'/'+result.backupId+'.json','utf8'));
 assert.equal(metadata.text,originalBefore);assert.equal(metadata.context.restorationOfArchiveId,plan.archiveId);assert(metadata.context.graphArchive);
 const undo=await postgresqlCodeRestorePlan({path:target,id:result.backupId},ctx.dependencies);
 assert.equal(undo.changed,true);assert.equal(undo.files.find(file=>file.path.endsWith('/extra.conf')).action,'update');
 const restored=await restorePostgresqlCode(commit(undo),ctx.dependencies);
 assert.equal(restored.journalCleanupVerified,true);assert.notEqual(restored.backupId,result.backupId);
 assert.equal(await readFile(ctx.file,'utf8'),originalBefore);assert.equal(await readFile(ctx.directory+'/extra.conf','utf8'),includedBefore);
}));
test('unchanged graph restore does not create a backup or restart',async()=>fixture(async ctx=>{
 const first=await restorePostgresqlCode(commit(await postgresqlCodeRestorePlan({path:target,id:ctx.id},ctx.dependencies)),ctx.dependencies);
 const {readdir}=await import('node:fs/promises');const before=await readdir(ctx.backupRoot);ctx.events.length=0;
 const again=await restorePostgresqlCode(commit(await postgresqlCodeRestorePlan({path:target,id:ctx.id},ctx.dependencies)),ctx.dependencies);
 assert.equal(again.undoBackupAvailable,false);assert.equal(again.backupId,undefined);assert.equal(again.phase,'unchanged');
 assert.deepEqual(await readdir(ctx.backupRoot),before);assert(!ctx.events.includes('restart'));assert(first.backupId);
}));
test('incomplete original include graph does not manufacture an undo backup or prevent a valid reviewed restore',async()=>fixture(async ctx=>{
 await writeFile(ctx.file,"port=5433\ninclude='missing.conf'\n");
 const plan=await postgresqlCodeRestorePlan({path:target,id:ctx.id},ctx.dependencies);
 assert.equal(plan.beforeGraphComplete,false);
 const result=await restorePostgresqlCode(commit(plan),ctx.dependencies);
 assert.equal(result.journalCleanupVerified,true);assert.equal(result.undoBackupAvailable,false);assert.equal(result.backupId,undefined);
 assert.equal(await readFile(ctx.file,'utf8'),original);assert(result.historyId);
}));
