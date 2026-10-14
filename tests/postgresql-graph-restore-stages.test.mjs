import {recoverPostgresqlGraphSwap} from '../lib/postgresql-graph-swap-recovery.ts';
import {readPostgresqlGraphSwapProgress,postgresqlGraphSwapProgressSummary,postgresqlGraphSwapProgressContext,assertPostgresqlGraphSwapProgress} from '../lib/postgresql-graph-swap-progress.ts';
import {swapPostgresqlGraphRestore} from '../lib/postgresql-graph-swap.ts';
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {pinPostgresqlStageDirectory} from '../lib/postgresql-stage-directory.ts';
import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm,lstat,rename,symlink,chmod,link,rmdir,unlink} from 'node:fs/promises';
import {postgresqlConfigGraph} from '../lib/postgresql-config-graph.ts';
import {createPostgresqlGraphArchive,readPostgresqlGraphArchive} from '../lib/postgresql-graph-archive.ts';
import {postgresqlGraphRestoreSnapshot} from '../lib/postgresql-graph-restore-snapshot.ts';
import {createPostgresqlGraphRestoreJournal,clearPostgresqlGraphRestoreJournal,postgresqlGraphRestoreJournalBody} from '../lib/postgresql-graph-restore-journal.ts';
import {preparePostgresqlGraphRestoreStages,inspectPostgresqlGraphRestoreStages,resumePostgresqlGraphRestoreStages,cancelPostgresqlGraphRestoreStages} from '../lib/postgresql-graph-restore-stages.ts';
async function fixture(run){const base=await mkdtemp('/mnt/data/build/tastedev-linux/pg-graph-stages-');try{const target='/etc/postgresql/16/main/postgresql.conf',cluster=base+'/postgresql/16/main',backupRoot=base+'/backups';await mkdir(cluster+'/conf.d',{recursive:true,mode:0o700});await mkdir(backupRoot,{mode:0o700});await writeFile(cluster+'/postgresql.conf',"port=5432\ninclude_dir 'conf.d'\n",{mode:0o600});await writeFile(cluster+'/conf.d/01.conf',"password='private-backup'\n",{mode:0o600});const graph=await postgresqlConfigGraph(target,{base}),ref=await createPostgresqlGraphArchive(graph,backupRoot),archive=await readPostgresqlGraphArchive(ref,backupRoot,target);await writeFile(cluster+'/postgresql.conf','port=6000\n');await writeFile(cluster+'/conf.d/01.conf',"password='private-current'\n");const journal=async()=>createPostgresqlGraphRestoreJournal(await postgresqlGraphRestoreSnapshot(archive,{base}),backupRoot);await run({base,target,cluster,backupRoot,journal,options:{base,ownerUid:process.getuid()}});}finally{await rm(base,{recursive:true,force:true});}}
test('PostgreSQL multi-file staging persists exact adjacent file identities and leaves operating files unchanged',async()=>fixture(async ctx=>{
const journal=await ctx.journal(),result=await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);assert.equal(result.phase,'ready');assert.equal(result.stagedFiles,2);assert.equal(result.operatingConfigurationChanged,false);const ledger=JSON.parse(await readFile(ctx.backupRoot+'/graph-stages/'+journal.record.id+'.json','utf8')).data;for(const row of ledger.files){const file=ctx.base+'/'+row.path.slice(5),temp=file.slice(0,file.lastIndexOf('/')+1)+row.name,stat=await lstat(temp);assert.equal(stat.ino,row.identity.ino);assert.equal(stat.dev,row.identity.dev);assert.equal(stat.mode&0o777,row.attributes.mode);assert.equal(stat.uid,row.attributes.uid);assert.equal(await readFile(temp,'utf8'),journal.record.body.files.find(entry=>entry.path===row.path).after.text);}assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=6000\n');assert.equal(await readFile(ctx.cluster+'/conf.d/01.conf','utf8'),"password='private-current'\n");assert.deepEqual(await inspectPostgresqlGraphRestoreStages(journal,ctx.backupRoot),result);await assert.rejects(preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot));await assert.rejects(clearPostgresqlGraphRestoreJournal(ctx.target,journal,ctx.backupRoot,ctx.options));
}));
test('PostgreSQL staging creates missing parent directories with trusted private ownership while target files stay absent',async()=>fixture(async ctx=>{
await rm(ctx.cluster+'/conf.d',{recursive:true});const journal=await ctx.journal(),result=await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);assert.equal(result.createdDirectories,1);assert.equal((await lstat(ctx.cluster+'/conf.d')).mode&0o777,0o700);await assert.rejects(lstat(ctx.cluster+'/conf.d/01.conf'),{code:'ENOENT'});assert((await readdir(ctx.cluster+'/conf.d')).every(name=>name.startsWith('.tastedev-pg-stage-')));assert.equal((await inspectPostgresqlGraphRestoreStages(journal,ctx.backupRoot)).phase,'ready');
}));
test('PostgreSQL staging refuses external file edits before preparing temporary candidates',async()=>fixture(async ctx=>{
const journal=await ctx.journal();await writeFile(ctx.cluster+'/conf.d/01.conf','external\n');await assert.rejects(preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot));assert.equal(await readFile(ctx.cluster+'/conf.d/01.conf','utf8'),'external\n');assert(!(await readdir(ctx.cluster)).some(name=>name.startsWith('.tastedev-pg-stage-')));assert.equal(await inspectPostgresqlGraphRestoreStages(journal,ctx.backupRoot),null);
}));
test('PostgreSQL ready-stage inspection refuses altered temporary files and preserves them for review',async()=>fixture(async ctx=>{
const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);const ledger=JSON.parse(await readFile(ctx.backupRoot+'/graph-stages/'+journal.record.id+'.json','utf8')).data,row=ledger.files[0],file=ctx.base+'/'+row.path.slice(5),temp=file.slice(0,file.lastIndexOf('/')+1)+row.name;await writeFile(temp,'external-temporary\n');await assert.rejects(inspectPostgresqlGraphRestoreStages(journal,ctx.backupRoot));assert.equal(await readFile(temp,'utf8'),'external-temporary\n');assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=6000\n');
}));
test('PostgreSQL staging refuses copied journal proofs and corrupt stage records without clearing intent',async()=>fixture(async ctx=>{
const journal=await ctx.journal();await assert.rejects(preparePostgresqlGraphRestoreStages({...journal},ctx.backupRoot));await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);const file=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.json',record=JSON.parse(await readFile(file,'utf8'));record.data.files[0].name='../../outside';await writeFile(file,JSON.stringify(record));await assert.rejects(inspectPostgresqlGraphRestoreStages(journal,ctx.backupRoot));await assert.rejects(clearPostgresqlGraphRestoreJournal(ctx.target,journal,ctx.backupRoot,ctx.options));assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=6000\n');
}));

for(const replacement of ['symlink','directory'])test(`PostgreSQL pinned stage parent prevents writes through a replaced ${replacement}`,async()=>fixture(async ctx=>{
 const journal=await ctx.journal(),body=postgresqlGraphRestoreJournalBody(journal),parent=await pinPostgresqlStageDirectory(body,[], '/etc/postgresql/16/main/conf.d');
 try{await rename(ctx.cluster+'/conf.d',ctx.cluster+'/original-conf.d');const outside=ctx.base+'/outside';await mkdir(outside,{mode:0o700});
  if(replacement==='symlink')await symlink(outside,ctx.cluster+'/conf.d');else await mkdir(ctx.cluster+'/conf.d',{mode:0o700});
  await writeFile(parent.child('.pinned-proof'),'anchored',{mode:0o600});
  assert.equal(await readFile(ctx.cluster+'/original-conf.d/.pinned-proof','utf8'),'anchored');assert.deepEqual(await readdir(outside),[]);
  if(replacement==='directory')assert.deepEqual(await readdir(ctx.cluster+'/conf.d'),[]);
  await assert.rejects(parent.verify());await assert.rejects(pinPostgresqlStageDirectory(body,[], '/etc/postgresql/16/main/conf.d'));
  assert.throws(()=>parent.child('../escape'));assert.throws(()=>parent.child('/escape'));
 }finally{await parent.close();}
}));

async function checkpoint(ctx,journal,change){const file=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.json',record=JSON.parse(await readFile(file,'utf8'));record.data.phase='preparing';const row=record.data.files[0],temp=ctx.base+'/'+row.path.slice(5).split('/').slice(0,-1).join('/')+'/'+row.name;row.ready=false;row.identity={dev:row.identity.dev,ino:row.identity.ino};await change(row,temp,record.data);record.digest=createHash('sha256').update(JSON.stringify(record.data)).digest('hex');await writeFile(file,JSON.stringify(record));return temp;}
test('PostgreSQL interrupted staging resumes a recorded partial candidate without changing operating configuration',async()=>fixture(async ctx=>{
 const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);const temp=await checkpoint(ctx,journal,async(row,file)=>{const text=journal.record.body.files.find(value=>value.path===row.path).after.text;await writeFile(file,text.slice(0,4));});
 const result=await resumePostgresqlGraphRestoreStages(journal,ctx.backupRoot);assert.equal(result.phase,'ready');assert.equal(result.stagedFiles,2);assert.deepEqual(await inspectPostgresqlGraphRestoreStages(journal,ctx.backupRoot),result);assert.equal(await readFile(temp,'utf8'),journal.record.body.files[0].after.text);assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=6000\n');
}));
for(const alteration of ['content','inode','unknown'])test(`PostgreSQL interrupted staging preserves an ${alteration} mismatch`,async()=>fixture(async ctx=>{
 const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);const temp=await checkpoint(ctx,journal,async(row,file)=>{if(alteration==='inode'){await rename(file,file+'.preserved');await writeFile(file,'external',{mode:0o600});}else if(alteration==='unknown'){row.identity=null;}else await writeFile(file,'external');});
 const original=await readFile(temp);await assert.rejects(resumePostgresqlGraphRestoreStages(journal,ctx.backupRoot));assert.deepEqual(await readFile(temp),original);await assert.rejects(clearPostgresqlGraphRestoreJournal(ctx.target,journal,ctx.backupRoot,ctx.options));assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=6000\n');
}));
test('PostgreSQL staging resume requires an interrupted record and rejects ready records',async()=>fixture(async ctx=>{
 const journal=await ctx.journal();await assert.rejects(resumePostgresqlGraphRestoreStages(journal,ctx.backupRoot));await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);await assert.rejects(resumePostgresqlGraphRestoreStages(journal,ctx.backupRoot));assert.equal((await inspectPostgresqlGraphRestoreStages(journal,ctx.backupRoot)).phase,'ready');
}));

test('PostgreSQL interrupted stage preparation resumes after a fresh process reads the private journal',async()=>fixture(async ctx=>{
 const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);await checkpoint(ctx,journal,async(row,file)=>{const text=journal.record.body.files.find(value=>value.path===row.path).after.text;await writeFile(file,text.slice(0,2));});
 const source=`import {readPostgresqlGraphRestoreJournal} from './lib/postgresql-graph-restore-journal.ts';import {resumePostgresqlGraphRestoreStages,cancelPostgresqlGraphRestoreStages} from './lib/postgresql-graph-restore-stages.ts';const input=JSON.parse(process.argv[1]);const journal=await readPostgresqlGraphRestoreJournal(input.target,input.backupRoot,input.options);console.log(JSON.stringify(await resumePostgresqlGraphRestoreStages(journal,input.backupRoot)));`;
 const {stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',source,JSON.stringify({target:ctx.target,backupRoot:ctx.backupRoot,options:ctx.options})],{cwd:process.cwd(),timeout:10000});const result=JSON.parse(stdout);assert.equal(result.phase,'ready');assert.equal(result.stagedFiles,2);assert.equal((await inspectPostgresqlGraphRestoreStages(journal,ctx.backupRoot)).phase,'ready');assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=6000\n');
}));

test('PostgreSQL cancellation removes recorded staged files and preserves operating configuration and intent',async()=>fixture(async ctx=>{
 const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);const result=await cancelPostgresqlGraphRestoreStages(journal,ctx.backupRoot);assert.equal(result.phase,'cancelled');assert.equal(result.removedFiles,2);assert.equal(result.intentPreserved,true);assert.equal(await inspectPostgresqlGraphRestoreStages(journal,ctx.backupRoot),null);assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=6000\n');assert.equal(await readFile(ctx.cluster+'/conf.d/01.conf','utf8'),"password='private-current'\n");assert(!(await readdir(ctx.cluster)).some(name=>name.startsWith('.tastedev-pg-stage-')));await clearPostgresqlGraphRestoreJournal(ctx.target,journal,ctx.backupRoot,ctx.options);
}));
test('PostgreSQL cancellation removes only empty directories created by the staged restore',async()=>fixture(async ctx=>{
 await rm(ctx.cluster+'/conf.d',{recursive:true});const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);const result=await cancelPostgresqlGraphRestoreStages(journal,ctx.backupRoot);assert.equal(result.removedDirectories,1);await assert.rejects(lstat(ctx.cluster+'/conf.d'),{code:'ENOENT'});assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=6000\n');
}));
test('PostgreSQL cancellation rejects altered candidates before removing any staged file',async()=>fixture(async ctx=>{
 const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);const ledger=JSON.parse(await readFile(ctx.backupRoot+'/graph-stages/'+journal.record.id+'.json','utf8')).data,row=ledger.files[1],temp=ctx.base+'/'+row.path.slice(5).split('/').slice(0,-1).join('/')+'/'+row.name;await writeFile(temp,'external');await assert.rejects(cancelPostgresqlGraphRestoreStages(journal,ctx.backupRoot));assert.equal(await readFile(temp,'utf8'),'external');assert.equal((JSON.parse(await readFile(ctx.backupRoot+'/graph-stages/'+journal.record.id+'.json','utf8'))).data.phase,'ready');await assert.rejects(clearPostgresqlGraphRestoreJournal(ctx.target,journal,ctx.backupRoot,ctx.options));
}));
test('PostgreSQL cancellation preserves new unrelated files and can resume after an empty-directory obstruction is resolved',async()=>fixture(async ctx=>{
 await rm(ctx.cluster+'/conf.d',{recursive:true});const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);await writeFile(ctx.cluster+'/conf.d/.external','keep');await assert.rejects(cancelPostgresqlGraphRestoreStages(journal,ctx.backupRoot));assert.equal(await readFile(ctx.cluster+'/conf.d/.external','utf8'),'keep');assert.equal(JSON.parse(await readFile(ctx.backupRoot+'/graph-stages/'+journal.record.id+'.json','utf8')).data.phase,'cleaning');await assert.rejects(clearPostgresqlGraphRestoreJournal(ctx.target,journal,ctx.backupRoot,ctx.options));await rm(ctx.cluster+'/conf.d/.external');assert.equal((await cancelPostgresqlGraphRestoreStages(journal,ctx.backupRoot)).phase,'cancelled');await assert.rejects(lstat(ctx.cluster+'/conf.d'),{code:'ENOENT'});
}));
async function custodyCheckpoint(ctx,journal,alter=false){const ledger=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.json',record=JSON.parse(await readFile(ledger,'utf8')),data=record.data,name=journal.record.id+'.custody',custody=ctx.backupRoot+'/graph-stages/'+name;await mkdir(custody,{mode:0o700});const stat=await lstat(custody);data.format='postgresql-graph-stages-v1';data.phase='cleaning';data.cleanup={name,identity:{dev:stat.dev,ino:stat.ino},files:data.files.map(()=>'source'),directories:data.directories.map(()=>'source')};const row=data.files[0],temp=ctx.base+'/'+row.path.slice(5).split('/').slice(0,-1).join('/')+'/'+row.name;await rename(temp,custody+'/file-0');if(alter)await writeFile(custody+'/file-0','external-in-custody');record.digest=createHash('sha256').update(JSON.stringify(data)).digest('hex');await writeFile(ledger,JSON.stringify(record));return custody;}
test('PostgreSQL cancellation reconciles a move before its progress checkpoint',async()=>fixture(async ctx=>{
 const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);const custody=await custodyCheckpoint(ctx,journal);assert.equal((await cancelPostgresqlGraphRestoreStages(journal,ctx.backupRoot)).phase,'cancelled');await assert.rejects(lstat(custody),{code:'ENOENT'});assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=6000\n');
}));
test('PostgreSQL cancellation preserves a substituted candidate in private custody',async()=>fixture(async ctx=>{
 const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);const custody=await custodyCheckpoint(ctx,journal,true);await assert.rejects(cancelPostgresqlGraphRestoreStages(journal,ctx.backupRoot));assert.equal(await readFile(custody+'/file-0','utf8'),'external-in-custody');await assert.rejects(clearPostgresqlGraphRestoreJournal(ctx.target,journal,ctx.backupRoot,ctx.options));assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=6000\n');
}));

test('PostgreSQL graph swap replaces all candidates and removes added conf files before activation',async()=>fixture(async ctx=>{
 await writeFile(ctx.cluster+'/conf.d/02-extra.conf','extra=1\n',{mode:0o600});const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);let activated=0;
 const result=await swapPostgresqlGraphRestore(journal,ctx.backupRoot,{validate:async()=>true,activate:async()=>{activated++;assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=5432\ninclude_dir \'conf.d\'\n');assert.equal(await readFile(ctx.cluster+'/conf.d/01.conf','utf8'),"password='private-backup'\n");await assert.rejects(lstat(ctx.cluster+'/conf.d/02-extra.conf'),{code:'ENOENT'});},verify:async()=>true,reactivate:async()=>assert.fail('unexpected rollback')});
 assert.equal(result.phase,'committed');assert.equal(result.changedFiles,3);assert.equal(activated,1);await assert.rejects(clearPostgresqlGraphRestoreJournal(ctx.target,journal,ctx.backupRoot,ctx.options));const progress=JSON.parse(await readFile(ctx.backupRoot+'/graph-stages/'+journal.record.id+'.swap/progress.json','utf8'));assert.equal(progress.data.phase,'committed');assert(!JSON.stringify(result).includes('private-backup'));
}));
test('PostgreSQL graph swap creates archived missing files using their original attributes',async()=>fixture(async ctx=>{
 await rm(ctx.cluster+'/conf.d',{recursive:true});const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);const result=await swapPostgresqlGraphRestore(journal,ctx.backupRoot,{validate:async()=>true,activate:async()=>{},verify:async()=>true,reactivate:async()=>{}});assert.equal(result.phase,'committed');assert.equal(await readFile(ctx.cluster+'/conf.d/01.conf','utf8'),"password='private-backup'\n");assert.equal((await lstat(ctx.cluster+'/conf.d/01.conf')).mode&0o777,0o600);
}));
for(const failure of ['activate','verify'])test(`PostgreSQL graph swap rolls back all replacements and removals when ${failure} fails`,async()=>fixture(async ctx=>{
 await writeFile(ctx.cluster+'/conf.d/02-extra.conf','extra=1\n',{mode:0o600});const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);let restored=0;
 await assert.rejects(swapPostgresqlGraphRestore(journal,ctx.backupRoot,{validate:async()=>true,activate:async()=>{if(failure==='activate')throw Error('fixture activation failed');},verify:async({rollback})=>rollback,reactivate:async()=>{restored++;}}),error=>error.rollbackComplete===true);
 assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=6000\n');assert.equal(await readFile(ctx.cluster+'/conf.d/01.conf','utf8'),"password='private-current'\n");assert.equal(await readFile(ctx.cluster+'/conf.d/02-extra.conf','utf8'),'extra=1\n');assert.equal(restored,1);assert.equal(JSON.parse(await readFile(ctx.backupRoot+'/graph-stages/'+journal.record.id+'.swap/progress.json','utf8')).data.phase,'rolled-back');
}));
test('PostgreSQL graph swap preserves a configuration edited during activation and its original undo file',async()=>fixture(async ctx=>{
 const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);await assert.rejects(swapPostgresqlGraphRestore(journal,ctx.backupRoot,{validate:async()=>true,activate:async()=>{await writeFile(ctx.cluster+'/postgresql.conf','external-after-activation\n');throw Error('fixture');},verify:async()=>true,reactivate:async()=>{}}),error=>error.rollbackComplete===false);assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'external-after-activation\n');const progress=JSON.parse(await readFile(ctx.backupRoot+'/graph-stages/'+journal.record.id+'.swap/progress.json','utf8')).data,row=progress.rows.find(row=>row.path===ctx.target);assert.equal(await readFile(ctx.cluster+'/'+row.undoName,'utf8'),'port=6000\n');await assert.rejects(clearPostgresqlGraphRestoreJournal(ctx.target,journal,ctx.backupRoot,ctx.options));
}));
test('PostgreSQL graph swap refuses failed validation without changing targets or creating a swap journal',async()=>fixture(async ctx=>{
 const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);await assert.rejects(swapPostgresqlGraphRestore(journal,ctx.backupRoot,{validate:async()=>false,activate:async()=>assert.fail(),verify:async()=>assert.fail(),reactivate:async()=>assert.fail()}));assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=6000\n');await assert.rejects(lstat(ctx.backupRoot+'/graph-stages/'+journal.record.id+'.swap'),{code:'ENOENT'});
}));

test('PostgreSQL swap evidence prevents intent clearing even when the stage ledger was externally removed',async()=>fixture(async ctx=>{
 const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);await swapPostgresqlGraphRestore(journal,ctx.backupRoot,{validate:async()=>true,activate:async()=>{},verify:async()=>true,reactivate:async()=>{}});await rm(ctx.backupRoot+'/graph-stages/'+journal.record.id+'.json');await assert.rejects(clearPostgresqlGraphRestoreJournal(ctx.target,journal,ctx.backupRoot,ctx.options));assert.equal(JSON.parse(await readFile(ctx.backupRoot+'/graph-stages/'+journal.record.id+'.swap/progress.json','utf8')).data.phase,'committed');
}));

test('PostgreSQL rollback completion requires configuration to remain unchanged through runtime verification',async()=>fixture(async ctx=>{
 const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);await assert.rejects(swapPostgresqlGraphRestore(journal,ctx.backupRoot,{validate:async()=>true,activate:async()=>{throw Error('fixture');},reactivate:async()=>{},verify:async({rollback})=>{if(rollback)await writeFile(ctx.cluster+'/postgresql.conf','external-during-rollback-verify\n');return true;}}),error=>error.rollbackComplete===false);assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'external-during-rollback-verify\n');assert.equal(JSON.parse(await readFile(ctx.backupRoot+'/graph-stages/'+journal.record.id+'.swap/progress.json','utf8')).data.phase,'rolling-back');
}));

async function committedFixture(ctx){const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);await swapPostgresqlGraphRestore(journal,ctx.backupRoot,{validate:async()=>true,activate:async()=>{},verify:async()=>true,reactivate:async()=>{}});return journal;}
test('PostgreSQL swap progress reader registers private metadata and exposes a secret-free record summary',async()=>fixture(async ctx=>{
 const journal=await committedFixture(ctx),progress=await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot),summary=postgresqlGraphSwapProgressSummary(progress);assert.equal(summary.phase,'committed');assert.equal(summary.fileCount,2);assert.equal(summary.filesystemRecoveryVerified,false);assert(!JSON.stringify(summary).includes('private-backup'));assert(!JSON.stringify(summary).includes('undoName'));assert.throws(()=>postgresqlGraphSwapProgressSummary({...progress}));const internal=postgresqlGraphSwapProgressContext(progress);internal.data.rows[0].undoName='changed';assert.notEqual(progress.data.rows[0].undoName,'changed');await assertPostgresqlGraphSwapProgress(progress);
}));
test('PostgreSQL swap progress is read by a fresh process without exposing private source text',async()=>fixture(async ctx=>{
 const journal=await committedFixture(ctx);const source=`import {readPostgresqlGraphRestoreJournal} from './lib/postgresql-graph-restore-journal.ts';import {readPostgresqlGraphSwapProgress,postgresqlGraphSwapProgressSummary} from './lib/postgresql-graph-swap-progress.ts';const input=JSON.parse(process.argv[1]);const journal=await readPostgresqlGraphRestoreJournal(input.target,input.backupRoot,input.options);console.log(JSON.stringify(postgresqlGraphSwapProgressSummary(await readPostgresqlGraphSwapProgress(journal,input.backupRoot))));`;
 const {stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',source,JSON.stringify({target:ctx.target,backupRoot:ctx.backupRoot,options:ctx.options})],{cwd:process.cwd(),timeout:10000});const summary=JSON.parse(stdout);assert.equal(summary.id,journal.record.id);assert.equal(summary.phase,'committed');assert(!stdout.includes('private-'));assert.equal(summary.filesystemRecoveryVerified,false);
}));
for(const alteration of ['path','flags','extra','digest'])test(`PostgreSQL swap progress reader refuses ${alteration} metadata corruption`,async()=>fixture(async ctx=>{
 const journal=await committedFixture(ctx),file=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.swap/progress.json',record=JSON.parse(await readFile(file,'utf8'));
 if(alteration==='path')record.data.rows[0].path='/etc/postgresql/16/foreign/postgresql.conf';else if(alteration==='flags')record.data.rows[0].candidatePlaced=false;else if(alteration==='extra')record.data.rootOverride='/';else record.digest='0'.repeat(64);
 if(alteration!=='digest')record.digest=createHash('sha256').update(JSON.stringify(record.data)).digest('hex');await writeFile(file,JSON.stringify(record));await assert.rejects(readPostgresqlGraphSwapProgress(journal,ctx.backupRoot));assert.equal(await readFile(file,'utf8'),JSON.stringify(record));assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),"port=5432\ninclude_dir 'conf.d'\n");
}));
test('PostgreSQL swap progress registration is invalidated by a later file change',async()=>fixture(async ctx=>{
 const journal=await committedFixture(ctx),progress=await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot),file=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.swap/progress.json';await writeFile(file,'invalid');await assert.rejects(assertPostgresqlGraphSwapProgress(progress));assert.equal(await readFile(file,'utf8'),'invalid');
}));
test('PostgreSQL swap progress reader validates a completed in-process rollback record',async()=>fixture(async ctx=>{
 const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);await assert.rejects(swapPostgresqlGraphRestore(journal,ctx.backupRoot,{validate:async()=>true,activate:async()=>{throw Error('fixture');},verify:async()=>true,reactivate:async()=>{}}),error=>error.rollbackComplete===true);const progress=await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot);assert.equal(postgresqlGraphSwapProgressSummary(progress).phase,'rolled-back');await assertPostgresqlGraphSwapProgress(progress);assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=6000\n');
}));

test('PostgreSQL swap progress binds the exact stage ledger version and refuses replacement metadata',async()=>fixture(async ctx=>{
 const journal=await committedFixture(ctx),progress=await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot),file=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.json',record=JSON.parse(await readFile(file,'utf8'));record.data.files[0].identity.ino++;record.digest=createHash('sha256').update(JSON.stringify(record.data)).digest('hex');await writeFile(file,JSON.stringify(record));await assert.rejects(readPostgresqlGraphSwapProgress(journal,ctx.backupRoot));await assert.rejects(assertPostgresqlGraphSwapProgress(progress));assert.equal(await readFile(file,'utf8'),JSON.stringify(record));
}));

for(const alteration of ['permissions','hardlink'])test(`PostgreSQL swap progress reader preserves an unsafe ${alteration} file`,async()=>fixture(async ctx=>{
 const journal=await committedFixture(ctx),file=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.swap/progress.json',before=await readFile(file);if(alteration==='permissions')await chmod(file,0o644);else await link(file,file+'.unknown-alias');await assert.rejects(readPostgresqlGraphSwapProgress(journal,ctx.backupRoot));assert.deepEqual(await readFile(file),before);if(alteration==='hardlink')assert.deepEqual(await readFile(file+'.unknown-alias'),before);
}));

async function interruptedCommitted(ctx){const journal=await committedFixture(ctx),file=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.swap/progress.json',record=JSON.parse(await readFile(file,'utf8'));record.data.phase='activating';record.digest=createHash('sha256').update(JSON.stringify(record.data)).digest('hex');await writeFile(file,JSON.stringify(record));return journal;}
test('PostgreSQL interrupted graph recovery restores all originals and verifies service callbacks',async()=>fixture(async ctx=>{
 await writeFile(ctx.cluster+'/conf.d/02-extra.conf','extra=1\n',{mode:0o600});const journal=await interruptedCommitted(ctx),progress=await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot);let activated=0;const result=await recoverPostgresqlGraphSwap(progress,{validate:async()=>true,reactivate:async()=>{activated++;},verify:async()=>true});assert.equal(result.phase,'rolled-back');assert.equal(result.filesystemRecoveryVerified,true);assert.equal(activated,1);assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=6000\n');assert.equal(await readFile(ctx.cluster+'/conf.d/01.conf','utf8'),"password='private-current'\n");assert.equal(await readFile(ctx.cluster+'/conf.d/02-extra.conf','utf8'),'extra=1\n');assert.equal(postgresqlGraphSwapProgressSummary(await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot)).phase,'rolled-back');await assert.rejects(clearPostgresqlGraphRestoreJournal(ctx.target,journal,ctx.backupRoot,ctx.options));
}));
test('PostgreSQL interrupted graph recovery rejects an altered target before restoring any other file',async()=>fixture(async ctx=>{
 const journal=await interruptedCommitted(ctx);await writeFile(ctx.cluster+'/postgresql.conf','external-target\n');const progress=await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot);await assert.rejects(recoverPostgresqlGraphSwap(progress,{validate:async()=>true,reactivate:async()=>assert.fail(),verify:async()=>assert.fail()}));assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'external-target\n');assert.equal(await readFile(ctx.cluster+'/conf.d/01.conf','utf8'),"password='private-backup'\n");assert.equal(postgresqlGraphSwapProgressSummary(await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot)).phase,'activating');
}));
test('PostgreSQL graph recovery rejects failed validation and copied records',async()=>fixture(async ctx=>{
 const journal=await interruptedCommitted(ctx),progress=await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot),hooks={validate:async()=>false,reactivate:async()=>assert.fail(),verify:async()=>assert.fail()};await assert.rejects(recoverPostgresqlGraphSwap(progress,hooks));await assert.rejects(recoverPostgresqlGraphSwap({...progress},hooks));assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),"port=5432\ninclude_dir 'conf.d'\n");
}));
test('PostgreSQL graph recovery verifies an already rolled-back record without restarting the service',async()=>fixture(async ctx=>{
 const journal=await interruptedCommitted(ctx);await recoverPostgresqlGraphSwap(await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot),{validate:async()=>true,reactivate:async()=>{},verify:async()=>true});const result=await recoverPostgresqlGraphSwap(await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot),{validate:async()=>true,reactivate:async()=>assert.fail(),verify:async()=>true});assert.equal(result.serviceCoordinatorInvoked,false);assert.equal(result.filesystemRecoveryVerified,true);
}));
test('PostgreSQL graph recovery leaves an unfinished record when runtime verification fails',async()=>fixture(async ctx=>{
 const journal=await interruptedCommitted(ctx);await assert.rejects(recoverPostgresqlGraphSwap(await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot),{validate:async()=>true,reactivate:async()=>{},verify:async()=>false}));assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=6000\n');assert.equal(postgresqlGraphSwapProgressSummary(await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot)).phase,'rolling-back');const result=await recoverPostgresqlGraphSwap(await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot),{validate:async()=>true,reactivate:async()=>{},verify:async()=>true});assert.equal(result.phase,'rolled-back');
}));

test('PostgreSQL graph recovery refuses a committed record without reverting deployed candidates',async()=>fixture(async ctx=>{
 const journal=await committedFixture(ctx),progress=await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot);await assert.rejects(recoverPostgresqlGraphSwap(progress,{validate:async()=>assert.fail(),reactivate:async()=>assert.fail(),verify:async()=>assert.fail()}));assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),"port=5432\ninclude_dir 'conf.d'\n");
}));
test('PostgreSQL real writer SIGKILL at activation is recovered by a fresh process after explicit fixture-lock review',async()=>fixture(async ctx=>{
 const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);
 const input=JSON.stringify({target:ctx.target,backupRoot:ctx.backupRoot,options:ctx.options}),source=`import {readPostgresqlGraphRestoreJournal} from './lib/postgresql-graph-restore-journal.ts';import {swapPostgresqlGraphRestore} from './lib/postgresql-graph-swap.ts';const input=JSON.parse(process.argv[1]);const journal=await readPostgresqlGraphRestoreJournal(input.target,input.backupRoot,input.options);await swapPostgresqlGraphRestore(journal,input.backupRoot,{validate:async()=>true,activate:async()=>{process.stdout.write('READY\\n');await new Promise(()=>{setInterval(()=>{},1000);});},verify:async()=>true,reactivate:async()=>{}});`;
 const writer=spawn(process.execPath,['--input-type=module','-e',source,input],{cwd:process.cwd(),stdio:['ignore','pipe','ignore']});const done=new Promise(resolve=>writer.once('close',(code,signal)=>resolve({code,signal})));let timer;
 try{await new Promise((resolve,reject)=>{let output='';timer=setTimeout(()=>{writer.kill('SIGKILL');reject(Error('fixture writer checkpoint timed out'));},10000);writer.once('error',reject);writer.once('exit',(code,signal)=>reject(Error('fixture writer exited before checkpoint')));writer.stdout.on('data',bytes=>{output+=bytes.toString();if(output.includes('READY\n')){clearTimeout(timer);resolve();}});});
  const lock=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.lock',before=await lstat(lock);assert(writer.pid>0);assert(writer.kill('SIGKILL'));assert.equal((await done).signal,'SIGKILL');
  // Only this test's captured empty lock is removed after its exact child exits.
  // Production recovery never removes an unknown legacy lock automatically.
  const after=await lstat(lock);assert.equal(after.dev,before.dev);assert.equal(after.ino,before.ino);assert.equal(after.uid,process.getuid());assert.equal(after.mode&0o777,0o700);assert.deepEqual(await readdir(lock),[]);await rmdir(lock);
  const recovery=`import {readPostgresqlGraphRestoreJournal} from './lib/postgresql-graph-restore-journal.ts';import {readPostgresqlGraphSwapProgress} from './lib/postgresql-graph-swap-progress.ts';import {recoverPostgresqlGraphSwap} from './lib/postgresql-graph-swap-recovery.ts';const input=JSON.parse(process.argv[1]);const journal=await readPostgresqlGraphRestoreJournal(input.target,input.backupRoot,input.options);console.log(JSON.stringify(await recoverPostgresqlGraphSwap(await readPostgresqlGraphSwapProgress(journal,input.backupRoot),{validate:async()=>true,reactivate:async()=>{},verify:async()=>true})));`;
  const {stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',recovery,input],{cwd:process.cwd(),timeout:10000}),result=JSON.parse(stdout);assert.equal(result.phase,'rolled-back');assert.equal(result.filesystemRecoveryVerified,true);assert(!stdout.includes('private-'));assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=6000\n');assert.equal(await readFile(ctx.cluster+'/conf.d/01.conf','utf8'),"password='private-current'\n");
 }finally{clearTimeout(timer);writer.kill('SIGKILL');await done;}
}));

for(const window of ['original-move','candidate-link','candidate-unlink','candidate-retire','original-restore-link','original-restore-unlink'])test(`PostgreSQL graph recovery reconciles the ${window} checkpoint window`,async()=>fixture(async ctx=>{
 const journal=await committedFixture(ctx),directory=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.swap',file=directory+'/progress.json',record=JSON.parse(await readFile(file,'utf8')),index=record.data.rows.findIndex(row=>row.path===ctx.target),state=record.data.rows[index],ledger=JSON.parse(await readFile(ctx.backupRoot+'/graph-stages/'+journal.record.id+'.json','utf8')).data,stage=ledger.files.find(row=>row.path===ctx.target),target=ctx.cluster+'/postgresql.conf',undo=ctx.cluster+'/'+state.undoName;
 record.data.phase=['candidate-retire','original-restore-link','original-restore-unlink'].includes(window)?'rolling-back':'applying';
 if(window==='original-move'){await rename(target,ctx.cluster+'/'+stage.name);state.originalMoved=false;state.candidateLinked=false;state.candidatePlaced=false;}
 else if(window==='candidate-link'){await link(target,ctx.cluster+'/'+stage.name);state.candidateLinked=false;state.candidatePlaced=false;}
 else if(window==='candidate-unlink')state.candidatePlaced=false;
 else{await rename(target,record.data.format==='postgresql-graph-swap-v3'?target.slice(0,target.lastIndexOf('/'))+'/.tastedev-pg-retired-'+record.data.journalId+'-'+index:directory+'/retired-'+index);if(window!=='candidate-retire'){state.candidateRetired=true;await link(undo,target);if(window==='original-restore-unlink')await unlink(undo);}}
 record.digest=createHash('sha256').update(JSON.stringify(record.data)).digest('hex');await writeFile(file,JSON.stringify(record));
 const result=await recoverPostgresqlGraphSwap(await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot),{validate:async()=>true,reactivate:async()=>{},verify:async()=>true});assert.equal(result.phase,'rolled-back');assert.equal(await readFile(target,'utf8'),'port=6000\n');assert.equal((await lstat(target)).nlink,1);assert.equal(await readFile(ctx.cluster+'/conf.d/01.conf','utf8'),"password='private-current'\n");
}));
test('PostgreSQL graph recovery rejects an unknown candidate hardlink before mutating any target',async()=>fixture(async ctx=>{
 const journal=await interruptedCommitted(ctx),target=ctx.cluster+'/postgresql.conf',unknown=ctx.cluster+'/.external-hardlink';await link(target,unknown);const before=await readFile(target);await assert.rejects(recoverPostgresqlGraphSwap(await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot),{validate:async()=>true,reactivate:async()=>assert.fail(),verify:async()=>assert.fail()}));assert.deepEqual(await readFile(target),before);assert.deepEqual(await readFile(unknown),before);assert.equal(await readFile(ctx.cluster+'/conf.d/01.conf','utf8'),"password='private-backup'\n");
}));

test('PostgreSQL graph swap preserves files referenced only by the current configuration',async()=>fixture(async ctx=>{
 await writeFile(ctx.cluster+'/postgresql.conf',"port=6000\ninclude 'live.conf'\n");await writeFile(ctx.cluster+'/live.conf','port=7000\n',{mode:0o600});const journal=await ctx.journal();assert.equal(journal.record.body.beforeGraph.complete,true);await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);await swapPostgresqlGraphRestore(journal,ctx.backupRoot,{validate:async()=>true,activate:async()=>{},verify:async()=>true,reactivate:async()=>{}});assert.equal(await readFile(ctx.cluster+'/live.conf','utf8'),'port=7000\n');assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),"port=5432\ninclude_dir 'conf.d'\n");
}));
test('PostgreSQL graph swap detects a before-only reference edited during candidate validation before modifying targets',async()=>fixture(async ctx=>{
 await writeFile(ctx.cluster+'/postgresql.conf',"port=6000\ninclude 'live.conf'\n");await writeFile(ctx.cluster+'/live.conf','port=7000\n',{mode:0o600});const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);await assert.rejects(swapPostgresqlGraphRestore(journal,ctx.backupRoot,{validate:async()=>{await writeFile(ctx.cluster+'/live.conf','external-live\n');return true;},activate:async()=>assert.fail(),verify:async()=>assert.fail(),reactivate:async()=>assert.fail()}));assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),"port=6000\ninclude 'live.conf'\n");assert.equal(await readFile(ctx.cluster+'/live.conf','utf8'),'external-live\n');await assert.rejects(lstat(ctx.backupRoot+'/graph-stages/'+journal.record.id+'.swap'),{code:'ENOENT'});
}));

for(const obstruction of ['before-only-file','before-only-membership','early-target','original-undo','candidate-alias','retired-collision'])test(`PostgreSQL in-process rollback preflights every source before any restore when ${obstruction} changes`,async()=>fixture(async ctx=>{
 await writeFile(ctx.cluster+'/postgresql.conf',"port=6000\ninclude_dir 'live.d'\n");await mkdir(ctx.cluster+'/live.d',{mode:0o700});await writeFile(ctx.cluster+'/live.d/01.conf','port=7000\n',{mode:0o600});
 const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);const operation=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.swap';let preserved;
 await assert.rejects(swapPostgresqlGraphRestore(journal,ctx.backupRoot,{validate:async()=>true,activate:async()=>{
  const progress=JSON.parse(await readFile(operation+'/progress.json','utf8')).data;
  if(obstruction==='before-only-file'){preserved=ctx.cluster+'/live.d/01.conf';await writeFile(preserved,'external-live\n');}
  else if(obstruction==='before-only-membership'){preserved=ctx.cluster+'/live.d/02.conf';await writeFile(preserved,'external-member\n',{mode:0o600});}
  else if(obstruction==='early-target'){preserved=ctx.cluster+'/conf.d/01.conf';await writeFile(preserved,'external-candidate\n');}
  else if(obstruction==='original-undo'){const state=progress.rows.find(value=>value.path.endsWith('/conf.d/01.conf'));preserved=ctx.cluster+'/conf.d/'+state.undoName;await writeFile(preserved,'external-undo\n');}
  else if(obstruction==='retired-collision'){const index=progress.rows.findIndex(value=>value.path.endsWith('/conf.d/01.conf'));preserved=ctx.cluster+'/conf.d/.tastedev-pg-retired-'+journal.record.id+'-'+index;await writeFile(preserved,'external-retired\n',{mode:0o600});}
  else{preserved=ctx.cluster+'/.unknown-alias';await link(ctx.cluster+'/conf.d/01.conf',preserved);}
  throw Error('activation fixture failure');
 },verify:async()=>assert.fail('obstruction must prevent service verification'),reactivate:async()=>assert.fail('obstruction must prevent service restoration')}),error=>error.rollbackComplete===false);
 const progress=JSON.parse(await readFile(operation+'/progress.json','utf8')).data;
 assert.equal(progress.phase,'activating','failed preflight keeps the last authoritative checkpoint');
 assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),"port=5432\ninclude_dir 'conf.d'\n",'later rows must not be restored before an earlier obstruction is checked');
 const main=progress.rows.find(value=>value.path===ctx.target);assert.equal(await readFile(ctx.cluster+'/'+main.undoName,'utf8'),"port=6000\ninclude_dir 'live.d'\n",'original main remains in custody');
 if(obstruction!=='early-target')assert.equal(await readFile(ctx.cluster+'/conf.d/01.conf','utf8'),"password='private-backup'\n");
 assert.equal(await readFile(preserved,'utf8'),obstruction==='retired-collision'?'external-retired\n':obstruction==='candidate-alias'?"password='private-backup'\n":obstruction==='before-only-file'?'external-live\n':obstruction==='before-only-membership'?'external-member\n':obstruction==='early-target'?'external-candidate\n':'external-undo\n');
 assert(!(await readdir(operation)).some(name=>name.startsWith('retired-')),'preflight refusal retires no candidate');
}));

async function alterStageLedger(ctx,journal,kind){
 const file=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.json',original=await readFile(file);
 if(kind==='same-bytes-inode'){await rename(file,file+'.preserved');await writeFile(file,original,{mode:0o600});}
 else if(kind==='missing')await unlink(file);
 else if(kind==='hardlink')await link(file,file+'.unknown-alias');
 else{const record=JSON.parse(original);record.data.files[0].identity.ino++;record.digest=createHash('sha256').update(JSON.stringify(record.data)).digest('hex');await writeFile(file,JSON.stringify(record));}
 return {file,original};
}
for(const phase of ['validate','activate','verify','reactivate'])for(const kind of ['same-bytes-inode','changed-digest','missing','hardlink'])test(`PostgreSQL graph swap binds its ready stage ledger across ${phase} when ${kind} changes`,async()=>fixture(async ctx=>{
 const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);let altered,checks=0;
 const change=async()=>altered=await alterStageLedger(ctx,journal,kind);
 await assert.rejects(swapPostgresqlGraphRestore(journal,ctx.backupRoot,{
  validate:async()=>{if(phase==='validate')await change();return true;},
  activate:async()=>{if(phase==='activate')await change();if(phase==='reactivate')throw Error('activation failure fixture');},
  verify:async({rollback})=>{checks++;if(phase==='verify')await change();if(phase==='reactivate')assert.fail('changed stage binding must block rollback runtime verification');return true;},
  reactivate:async()=>{if(phase!=='reactivate')assert.fail('changed stage binding must block file rollback and service restoration');await change();}
 }),error=>phase==='validate'||error.rollbackComplete===false);
 const operation=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.swap';
 if(phase==='validate'){await assert.rejects(lstat(operation),{code:'ENOENT'});assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=6000\n');}
 else{
  const data=JSON.parse(await readFile(operation+'/progress.json','utf8')).data;assert.equal(data.phase,phase==='reactivate'?'rolling-back':'activating');
  assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),phase==='reactivate'?'port=6000\n':"port=5432\ninclude_dir 'conf.d'\n");
  if(phase!=='reactivate')assert(!(await readdir(operation)).some(name=>name.startsWith('retired-')),'changed stage binding prevents any candidate retirement');
 }
 assert.equal(checks,phase==='verify'?1:0);
 if(kind==='missing')await assert.rejects(lstat(altered.file),{code:'ENOENT'});
 else if(kind==='changed-digest'){const record=JSON.parse(await readFile(altered.file));assert.notDeepEqual(record,JSON.parse(altered.original));assert.equal(record.digest,createHash('sha256').update(JSON.stringify(record.data)).digest('hex'),'valid external checksum does not authorize the changed stage');}
 else assert.deepEqual(await readFile(altered.file),altered.original);
 if(kind==='same-bytes-inode')assert.deepEqual(await readFile(altered.file+'.preserved'),altered.original);
 if(kind==='hardlink')assert.equal((await lstat(altered.file)).nlink,2);
}));


test('legacy v2 interrupted progress upgrades before adjacent candidate retirement',async()=>fixture(async ctx=>{
 const journal=await interruptedCommitted(ctx),file=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.swap/progress.json',record=JSON.parse(await readFile(file,'utf8'));
 record.data.format='postgresql-graph-swap-v2';record.digest=createHash('sha256').update(JSON.stringify(record.data)).digest('hex');await writeFile(file,JSON.stringify(record));
 const result=await recoverPostgresqlGraphSwap(await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot),{validate:async()=>true,reactivate:async()=>{},verify:async()=>true});assert.equal(result.phase,'rolled-back');assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=6000\n');
 assert.equal(JSON.parse(await readFile(file,'utf8')).data.format,'postgresql-graph-swap-v3');assert((await readdir(ctx.cluster)).some(name=>name.startsWith('.tastedev-pg-retired-')));
 assert(!(await readdir(ctx.backupRoot+'/graph-stages/'+journal.record.id+'.swap')).some(name=>name.startsWith('retired-')));
}));


test('legacy recovery preserves a candidate already retired in custody while retiring remaining sources adjacent',async()=>fixture(async ctx=>{
 const journal=await interruptedCommitted(ctx),directory=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.swap',file=directory+'/progress.json',record=JSON.parse(await readFile(file,'utf8')),index=record.data.rows.findIndex(row=>row.path===ctx.target),retired=directory+'/retired-'+index;
 record.data.format='postgresql-graph-swap-v2';record.data.phase='rolling-back';await rename(ctx.cluster+'/postgresql.conf',retired);const before=await lstat(retired),bytes=await readFile(retired);
 record.digest=createHash('sha256').update(JSON.stringify(record.data)).digest('hex');await writeFile(file,JSON.stringify(record));
 const result=await recoverPostgresqlGraphSwap(await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot),{validate:async()=>true,reactivate:async()=>{},verify:async()=>true});assert.equal(result.phase,'rolled-back');assert.equal((await lstat(retired)).ino,before.ino);assert.deepEqual(await readFile(retired),bytes);assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=6000\n');assert.equal(JSON.parse(await readFile(file,'utf8')).data.format,'postgresql-graph-swap-v3');
}));

test('legacy upgrade refuses an occupied adjacent retirement name before modifying progress or sources',async()=>fixture(async ctx=>{
 const journal=await interruptedCommitted(ctx),file=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.swap/progress.json',record=JSON.parse(await readFile(file,'utf8')),index=record.data.rows.findIndex(row=>row.path===ctx.target);
 record.data.format='postgresql-graph-swap-v2';record.digest=createHash('sha256').update(JSON.stringify(record.data)).digest('hex');await writeFile(file,JSON.stringify(record));const bytes=await readFile(file),target=await readFile(ctx.cluster+'/postgresql.conf'),obstruction=ctx.cluster+'/.tastedev-pg-retired-'+journal.record.id+'-'+index;await writeFile(obstruction,'external retirement',{mode:0o600});
 await assert.rejects(recoverPostgresqlGraphSwap(await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot),{validate:async()=>assert.fail('must reject before native validation'),reactivate:async()=>assert.fail(),verify:async()=>assert.fail()}));assert.deepEqual(await readFile(file),bytes);assert.deepEqual(await readFile(ctx.cluster+'/postgresql.conf'),target);assert.equal(await readFile(obstruction,'utf8'),'external retirement');
}));


async function adjacentCancelCheckpoint(ctx,journal,mutate=false){
 const ledger=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.json',record=JSON.parse(await readFile(ledger,'utf8')),data=record.data,root=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.custody';await mkdir(root,{mode:0o700});const stat=await lstat(root);data.phase='cleaning';data.cleanup={layout:'adjacent-v1',name:journal.record.id+'.custody',identity:{dev:stat.dev,ino:stat.ino},files:data.files.map(()=>'source'),directories:data.directories.map(()=>'source')};
 const entry=data.files[0],parent=pathParent(ctx.base+'/'+entry.path.slice(5)),destination=parent+'/.tastedev-pg-cancel-'+journal.record.id+'-files-0';await rename(parent+'/'+entry.name,destination);if(mutate)await writeFile(destination,'external adjacent');record.digest=createHash('sha256').update(JSON.stringify(data)).digest('hex');await writeFile(ledger,JSON.stringify(record));return destination;
}
function pathParent(file){return file.slice(0,file.lastIndexOf('/'));}

test('adjacent cancellation reconciles a moved candidate checkpoint and preserves original operating files',async()=>fixture(async ctx=>{
 const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);const destination=await adjacentCancelCheckpoint(ctx,journal);assert.equal((await cancelPostgresqlGraphRestoreStages(journal,ctx.backupRoot)).phase,'cancelled');await assert.rejects(lstat(destination),{code:'ENOENT'});assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=6000\n');
}));
test('adjacent cancellation preserves a changed retired candidate and its private ledger',async()=>fixture(async ctx=>{
 const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);const destination=await adjacentCancelCheckpoint(ctx,journal,true),file=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.json',bytes=await readFile(file);await assert.rejects(cancelPostgresqlGraphRestoreStages(journal,ctx.backupRoot));assert.equal(await readFile(destination,'utf8'),'external adjacent');assert.deepEqual(await readFile(file),bytes);
}));
test('adjacent cancellation rejects a preexisting retirement name before changing the ready ledger',async()=>fixture(async ctx=>{
 const journal=await ctx.journal();await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot);const file=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.json',bytes=await readFile(file),data=JSON.parse(bytes).data,entry=data.files[0],parent=pathParent(ctx.base+'/'+entry.path.slice(5)),destination=parent+'/.tastedev-pg-cancel-'+journal.record.id+'-files-0';await writeFile(destination,'external reservation',{mode:0o600});await assert.rejects(cancelPostgresqlGraphRestoreStages(journal,ctx.backupRoot));assert.deepEqual(await readFile(file),bytes);assert.equal(await readFile(destination,'utf8'),'external reservation');assert.equal((await inspectPostgresqlGraphRestoreStages(journal,ctx.backupRoot)).phase,'ready');
}));
