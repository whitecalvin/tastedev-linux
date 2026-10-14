import {preparePostgresqlGraphRestoreStages,cancelPostgresqlGraphRestoreStages} from '../lib/postgresql-graph-restore-stages.ts';
import {postgresqlCompletedHistory,importPostgresqlCompletedBackup} from '../lib/postgresql-completed-history.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,rename,readdir,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {postgresqlConfigGraph} from '../lib/postgresql-config-graph.ts';
import {createPostgresqlGraphArchive,readPostgresqlGraphArchive} from '../lib/postgresql-graph-archive.ts';
import {reviewPostgresqlGraphRestore,assertPostgresqlGraphRestoreReview,createReviewedPostgresqlGraphRestoreJournal} from '../lib/postgresql-graph-restore-review.ts';
import {readPostgresqlGraphRestoreJournal,postgresqlGraphRestoreJournalServiceContext,retainPostgresqlGraphRestoreJournal} from '../lib/postgresql-graph-restore-journal.ts';
import {readPostgresqlGraphSwapProgress} from '../lib/postgresql-graph-swap-progress.ts';
import {applyReviewedPostgresqlGraphRestore} from '../lib/postgresql-reviewed-graph-restore.ts';
import {recoverReviewedPostgresqlGraph} from '../lib/postgresql-reviewed-graph-recovery.ts';

async function fixture(run){
 const base=await mkdtemp('/mnt/data/build/tastedev-linux/pg-restore-review-');
 try{
  const target='/etc/postgresql/18/fixture/postgresql.conf',cluster=base+'/postgresql/18/fixture',backupRoot=base+'/backups';
  await mkdir(cluster+'/conf.d',{recursive:true,mode:0o700});await mkdir(backupRoot,{mode:0o700});
  await writeFile(cluster+'/postgresql.conf',"port=5433\ninclude_dir 'conf.d'\n",{mode:0o600});await writeFile(cluster+'/conf.d/10-app.conf',"work_mem='8MB'\n",{mode:0o600});
  const reference=await createPostgresqlGraphArchive(await postgresqlConfigGraph(target,{base}),backupRoot);
  const archive=await readPostgresqlGraphArchive(reference,backupRoot,target);
  await writeFile(cluster+'/postgresql.conf','port=5444\n',{mode:0o600});await writeFile(cluster+'/conf.d/10-app.conf',"work_mem='4MB'\n",{mode:0o600});
  const service={identityVerified:true,settingsSource:'running-server',config:target,hba:cluster.replace(base,'/etc')+'/pg_hba.conf',data:'/var/lib/postgresql/18/fixture',unit:'postgresql@18-fixture.service',major:18,autoConfiguration:{present:false,version:'a'.repeat(64)},configurationErrors:0,pid:123,start:'456',values:{port:'5444',max_connections:'20',shared_buffers:'2048',work_mem:'4096',logging_collector:'off'}};
  const validation={valid:true,scope:'private-config-options',namespaceCommandsCompleted:true,operatingConfigurationChanged:false,operatingServiceChanged:false,postmasterStarted:false,graphVersion:archive.graph.version,values:{...service.values,port:'5433',work_mem:'8192'}};
  const options={base,ownerUid:process.getuid(),archiveScope:structuredClone(service),inspectService:async()=>structuredClone(service),validateArchive:async()=>structuredClone(validation)};
  await run({reference,archive,options,service,validation,cluster,backupRoot});
 }finally{await rm(base,{recursive:true,force:true});}
}
test('multi-file restore review binds included changes, native values and original service scope without writing configuration',()=>fixture(async({archive,options,cluster})=>{
 const plan=await reviewPostgresqlGraphRestore(archive,options);
 assert.equal(plan.files.filter(file=>file.action==='update').length,2);
 assert.deepEqual(plan.fields.find(field=>field.key==='work_mem'),{key:'work_mem',before:'4096',after:'8192'});
 assert.equal(plan.operatingConfigurationChanged,false);
 assert.equal(await readFile(cluster+'/postgresql.conf','utf8'),'port=5444\n');
 await assertPostgresqlGraphRestoreReview(plan);
 plan.files[0].action='unchanged';await assert.rejects(assertPostgresqlGraphRestoreReview(plan));
}));
test('reviewed journal persists the reviewed snapshot and refuses duplicate or stale intents before file changes',()=>fixture(async({archive,options,service,cluster,backupRoot})=>{
 const plan=await reviewPostgresqlGraphRestore(archive,options);
 const journal=await createReviewedPostgresqlGraphRestoreJournal(plan,backupRoot);
 assert.equal(journal.record.body.snapshotVersion,plan.snapshotVersion);
 assert.equal(journal.record.body.archiveGraphVersion,plan.archiveGraphVersion);
 assert.equal(journal.record.body.archiveId,plan.archiveId);
 assert.equal(journal.record.format,'postgresql-graph-restore-intent-v3');
 assert.deepEqual(journal.record.body.serviceContext.originalValues,service.values);
 assert.equal(journal.record.body.serviceContext.reviewVersion,plan.reviewVersion);
 assert.equal(journal.record.body.serviceContext.scope.data,service.data);
 assert.equal(await readFile(cluster+'/postgresql.conf','utf8'),'port=5444\n');
 await assert.rejects(createReviewedPostgresqlGraphRestoreJournal(plan,backupRoot));
 service.pid++;
 await assert.rejects(createReviewedPostgresqlGraphRestoreJournal(plan,backupRoot));
 const saved=await readPostgresqlGraphRestoreJournal(archive.target,backupRoot,options);
 assert.equal(saved.record.id,journal.record.id);
}));
test('persisted service intent is readable without the original review and rejects mismatched scope even with a recomputed digest',()=>fixture(async({archive,options,backupRoot})=>{
 const plan=await reviewPostgresqlGraphRestore(archive,options);
 const journal=await createReviewedPostgresqlGraphRestoreJournal(plan,backupRoot);
 const saved=await readPostgresqlGraphRestoreJournal(archive.target,backupRoot,options);
 assert.equal(saved.record.body.serviceContext.reviewVersion,plan.reviewVersion);
 const context=postgresqlGraphRestoreJournalServiceContext(saved);context.scope.data='/local-copy';
 assert.notEqual(postgresqlGraphRestoreJournalServiceContext(saved).scope.data,'/local-copy');
 const file=backupRoot+'/graph-transactions/'+createHash('sha256').update(archive.target).digest('hex')+'.json';
 const modified=structuredClone(journal.record);modified.body.serviceContext.scope.unit='postgresql@18-other.service';
 modified.digest=createHash('sha256').update(JSON.stringify(modified.body)).digest('hex');
 await writeFile(file,JSON.stringify(modified),{mode:0o600});
 await assert.rejects(readPostgresqlGraphRestoreJournal(archive.target,backupRoot,options));
}));
test('a service conflict after intent publication preserves the record and reports its identity',()=>fixture(async({archive,options,service,cluster,backupRoot})=>{
 let calls=0;
 const plan=await reviewPostgresqlGraphRestore(archive,{...options,inspectService:async()=>{calls++;if(calls===4)service.pid++;return structuredClone(service);}});
 let id;
 await assert.rejects(createReviewedPostgresqlGraphRestoreJournal(plan,backupRoot),error=>{id=error.journalId;return error.status===409&&error.intentPreserved===true&&typeof id==='string';});
 const saved=await readPostgresqlGraphRestoreJournal(archive.target,backupRoot,options);
 assert.equal(saved.record.id,id);
 assert.equal(await readFile(cluster+'/postgresql.conf','utf8'),'port=5444\n');
}));
test('review refuses changed original service resources, native failures and service changes during validation',()=>fixture(async({archive,options,service,validation})=>{
 for(const change of [{data:'/other/db'},{hba:'/other/hba'},{autoConfiguration:{present:true,version:'b'.repeat(64)}}])await assert.rejects(reviewPostgresqlGraphRestore(archive,{...options,archiveScope:{...service,...change}}));
 await assert.rejects(reviewPostgresqlGraphRestore(archive,{...options,validateArchive:async()=>({...validation,valid:false})}));
 await assert.rejects(reviewPostgresqlGraphRestore(archive,{...options,validateArchive:async()=>{service.pid++;return validation;}}));
}));
test('review rejects edits during native validation and stale configuration or service after review',()=>fixture(async({archive,options,service,validation,cluster})=>{
 const plan=await reviewPostgresqlGraphRestore(archive,options);
 service.pid++;await assert.rejects(assertPostgresqlGraphRestoreReview(plan));service.pid--;
 await writeFile(cluster+'/conf.d/10-app.conf',"work_mem='2MB'\n");await assert.rejects(assertPostgresqlGraphRestoreReview(plan));
 await assert.rejects(reviewPostgresqlGraphRestore(archive,{...options,validateArchive:async()=>{await writeFile(cluster+'/postgresql.conf','port=5555\n');return validation;}}));
}));
test('reviewed graph coordinator activates the fixed service only after all included files are restored',()=>fixture(async({archive,options,service,validation,cluster,backupRoot})=>{
 const plan=await reviewPostgresqlGraphRestore(archive,options);let calls=0;
 const result=await applyReviewedPostgresqlGraphRestore(plan,backupRoot,{control:async(unit,action)=>{
  assert.equal(unit,service.unit);assert.equal(action,'restart');calls++;
  assert.equal(await readFile(cluster+'/conf.d/10-app.conf','utf8'),"work_mem='8MB'\n");
  service.values=structuredClone(validation.values);service.pid++;
 }});
 assert.equal(result.phase,'committed');assert.equal(calls,1);
 assert.equal(result.retention.activeIntentCleared,true);
 assert.equal(await readPostgresqlGraphRestoreJournal(archive.target,backupRoot,options),null);
}));
test('activation failure restores every original file and verifies original running values',()=>fixture(async({archive,options,service,validation,cluster,backupRoot})=>{
 const plan=await reviewPostgresqlGraphRestore(archive,options),before=structuredClone(service.values);let calls=0;
 await assert.rejects(applyReviewedPostgresqlGraphRestore(plan,backupRoot,{
  control:async()=>{calls++;service.pid++;if(calls===1){service.values=structuredClone(validation.values);throw Error('fixture activation failed');}assert.equal(await readFile(cluster+'/conf.d/10-app.conf','utf8'),"work_mem='4MB'\n");service.values=before;},
  inspectRecovery:async()=>({unit:service.unit,activeState:'active',controlPid:0,service:structuredClone(service)})
 }),error=>error.rollbackComplete===true);
 assert.equal(calls,2);assert.equal(await readFile(cluster+'/postgresql.conf','utf8'),'port=5444\n');
 assert.equal(await readPostgresqlGraphRestoreJournal(archive.target,backupRoot,options),null);
}));
test('changed service scope after failed activation prevents blind recovery restart',()=>fixture(async({archive,options,service,backupRoot})=>{
 const plan=await reviewPostgresqlGraphRestore(archive,options);let calls=0;
 await assert.rejects(applyReviewedPostgresqlGraphRestore(plan,backupRoot,{
  control:async()=>{calls++;service.data='/unreviewed/data';throw Error('fixture');},
  inspectRecovery:async()=>({unit:service.unit,activeState:'active',controlPid:0,service:structuredClone(service)})
 }),error=>error.rollbackComplete===false);
 assert.equal(calls,1);
}));
test('unchanged graph restore does not restart the service or create an execution intent',()=>fixture(async({archive,options,cluster,backupRoot})=>{
 for(const source of archive.sources)await writeFile(cluster+'/'+source.path.split('/fixture/')[1],source.text);
 const plan=await reviewPostgresqlGraphRestore(archive,options);
 const result=await applyReviewedPostgresqlGraphRestore(plan,backupRoot,{control:async()=>assert.fail('no restart for unchanged files')});
 assert.equal(result.phase,'unchanged');assert.equal(result.operatingConfigurationChanged,false);
 assert.equal(await readPostgresqlGraphRestoreJournal(archive.target,backupRoot,options),null);
}));
const originalValidation=async()=>({valid:true,scope:'private-config-options',source:'private-journal-original-config',namespaceCommandsCompleted:true,operatingConfigurationChanged:false,operatingServiceChanged:false,postmasterStarted:false});
async function interrupted(ctx){
 const plan=await reviewPostgresqlGraphRestore(ctx.archive,ctx.options);
 const result=await applyReviewedPostgresqlGraphRestore(plan,ctx.backupRoot,{retainCompleted:false,control:async()=>{ctx.service.values=structuredClone(ctx.validation.values);ctx.service.pid++;}});
 const file=ctx.backupRoot+'/graph-stages/'+result.journalId+'.swap/progress.json',record=JSON.parse(await readFile(file,'utf8'));
 record.data.phase='activating';record.digest=createHash('sha256').update(JSON.stringify(record.data)).digest('hex');await writeFile(file,JSON.stringify(record),{mode:0o600});
 return readPostgresqlGraphRestoreJournal(ctx.archive.target,ctx.backupRoot,ctx.options);
}
test('independent recovery uses reread durable service values and verifies original files after restart',()=>fixture(async ctx=>{
 const journal=await interrupted(ctx);let calls=0;
 const result=await recoverReviewedPostgresqlGraph(journal,ctx.backupRoot,{
  validateOriginal:originalValidation,inspectService:ctx.options.inspectService,
  inspectRecovery:async()=>({unit:ctx.service.unit,activeState:'active',controlPid:0,service:structuredClone(ctx.service)}),
  control:async(unit,action)=>{assert.equal(unit,ctx.service.unit);assert.equal(action,'restart');calls++;ctx.service.values=structuredClone(journal.record.body.serviceContext.originalValues);ctx.service.pid++;}
 });
 assert.equal(result.phase,'rolled-back');assert.equal(calls,1);
 assert.equal(result.retention.activeIntentCleared,true);
 assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=5444\n');
 assert.equal(await readFile(ctx.cluster+'/conf.d/10-app.conf','utf8'),"work_mem='4MB'\n");
}));
test('automatic completed-intent retention permits two changed restorations while preserving both histories',()=>fixture(async ctx=>{
 const restart=async()=>{ctx.service.values=structuredClone(ctx.validation.values);ctx.service.pid++;};
 const first=await applyReviewedPostgresqlGraphRestore(await reviewPostgresqlGraphRestore(ctx.archive,ctx.options),ctx.backupRoot,{control:restart});
 await writeFile(ctx.cluster+'/postgresql.conf','port=5555\n');ctx.service.values={...ctx.service.values,port:'5555'};
 const second=await applyReviewedPostgresqlGraphRestore(await reviewPostgresqlGraphRestore(ctx.archive,ctx.options),ctx.backupRoot,{control:restart});
 assert.notEqual(first.journalId,second.journalId);
 assert.equal(await readPostgresqlGraphRestoreJournal(ctx.archive.target,ctx.backupRoot,ctx.options),null);
 for(const id of [first.journalId,second.journalId])assert.equal(JSON.parse(await readFile(ctx.backupRoot+'/graph-transactions/completed/'+id+'/intent.json','utf8')).id,id);
}));
test('retention obstruction reports verified activation separately and preserves the active intent without restarting again',()=>fixture(async ctx=>{
 const plan=await reviewPostgresqlGraphRestore(ctx.archive,ctx.options);let calls=0,id;
 await assert.rejects(applyReviewedPostgresqlGraphRestore(plan,ctx.backupRoot,{control:async()=>{
  calls++;ctx.service.values=structuredClone(ctx.validation.values);ctx.service.pid++;
  const journal=await readPostgresqlGraphRestoreJournal(ctx.archive.target,ctx.backupRoot,ctx.options);id=journal.record.id;
  await mkdir(ctx.backupRoot+'/graph-transactions/completed/'+id,{recursive:true,mode:0o700});
  await writeFile(ctx.backupRoot+'/graph-transactions/completed/'+id+'/unknown','preserve',{mode:0o600});
 }}),error=>error.activationComplete===true&&error.retentionComplete===false&&error.journalId===id);
 assert.equal(calls,1);
 assert.equal((await readPostgresqlGraphRestoreJournal(ctx.archive.target,ctx.backupRoot,ctx.options)).record.id,id);
 assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),ctx.archive.sources.find(source=>source.path===ctx.archive.target).text);
}));
test('independent recovery refuses changed service data scope before replacing any file',()=>fixture(async ctx=>{
 const journal=await interrupted(ctx);ctx.service.data='/unreviewed/data';
 const before=await readFile(ctx.cluster+'/postgresql.conf','utf8');
 await assert.rejects(recoverReviewedPostgresqlGraph(journal,ctx.backupRoot,{
  validateOriginal:originalValidation,inspectService:ctx.options.inspectService,
  inspectRecovery:async()=>({unit:ctx.service.unit,activeState:'active',controlPid:0,service:structuredClone(ctx.service)}),control:async()=>assert.fail()
 }));
 assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),before);
}));
test('completed restore intent is retained byte-for-byte and frees the active slot for a new review',()=>fixture(async ctx=>{
 const plan=await reviewPostgresqlGraphRestore(ctx.archive,ctx.options);
 await applyReviewedPostgresqlGraphRestore(plan,ctx.backupRoot,{retainCompleted:false,control:async()=>{ctx.service.values=structuredClone(ctx.validation.values);ctx.service.pid++;}});
 const journal=await readPostgresqlGraphRestoreJournal(ctx.archive.target,ctx.backupRoot,ctx.options),progress=await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot);
 const result=await retainPostgresqlGraphRestoreJournal(journal,ctx.backupRoot,progress);
 assert.equal(result.activeIntentCleared,true);
 const retained=await readFile(ctx.backupRoot+'/graph-transactions/completed/'+journal.record.id+'/intent.json');
 assert.equal(createHash('sha256').update(retained).digest('hex'),journal.version);
 assert.equal(await readPostgresqlGraphRestoreJournal(ctx.archive.target,ctx.backupRoot,ctx.options),null);
 assert.equal((await reviewPostgresqlGraphRestore(ctx.archive,ctx.options)).files.every(file=>file.action==='unchanged'),true);
}));
test('retention refuses a nonterminal interrupted restore and preserves the active record',()=>fixture(async ctx=>{
 const journal=await interrupted(ctx),progress=await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot);
 await assert.rejects(retainPostgresqlGraphRestoreJournal(journal,ctx.backupRoot,progress));
 assert.equal((await readPostgresqlGraphRestoreJournal(ctx.archive.target,ctx.backupRoot,ctx.options)).record.id,journal.record.id);
}));

function recoveryOptions(ctx,journal){
 const recorded=structuredClone(journal.record.body.serviceContext.originalValues);
 return {...ctx.options,backupRoot:ctx.backupRoot,
  autoVersion:async()=>structuredClone(ctx.service.autoConfiguration),
  inspectRecovery:async()=>({unit:ctx.service.unit,activeState:'active',controlPid:0,mainPid:ctx.service.pid,service:structuredClone(ctx.service)}),
  validateOriginal:async()=>({...await originalValidation(),graphVersion:journal.record.body.beforeGraph.version,originalGraphVersion:journal.record.body.beforeGraph.version,values:recorded}),
  control:async()=>{ctx.service.values=recorded;ctx.service.pid++;}
 };
}
const codeRecovery=await import('../lib/postgresql-code-recovery.ts');
test('existing recovery request discovers a durable include-graph intent and restores all files without leaking configuration',()=>fixture(async ctx=>{
 const journal=await interrupted(ctx),opts=recoveryOptions(ctx,journal);
 const plan=await codeRecovery.postgresqlCodeRecoveryPlan({path:ctx.archive.target},opts);
 assert.equal(plan.kind,'postgresql-include-graph');assert.equal(plan.recoveryRequired,true);
 assert.equal(plan.historyId,journal.record.id);assert.equal(plan.files.length,2);
 assert.equal(plan.filesystemRecoveryVerified,false);
 assert(!JSON.stringify(plan).includes('port=5444'));
 const result=await codeRecovery.recoverPostgresqlCode({path:ctx.archive.target,reviewVersion:plan.reviewVersion,confirm:true},opts);
 assert.equal(result.recovered,true);assert.equal(result.journalCleanupVerified,true);
 assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'port=5444\n');
 assert.equal(await readFile(ctx.cluster+'/conf.d/10-app.conf','utf8'),"work_mem='4MB'\n");
 assert.equal((await codeRecovery.postgresqlCodeRecoveryPlan({path:ctx.archive.target},opts)).recoveryRequired,false);
}));
test('include-graph recovery rejects a stale runtime review, changed auto configuration and unrecorded service scope before writes',()=>fixture(async ctx=>{
 const journal=await interrupted(ctx),opts=recoveryOptions(ctx,journal);
 const plan=await codeRecovery.postgresqlCodeRecoveryPlan({path:ctx.archive.target},opts),before=await readFile(ctx.cluster+'/postgresql.conf','utf8');
 ctx.service.pid++;
 await assert.rejects(codeRecovery.recoverPostgresqlCode({path:ctx.archive.target,reviewVersion:plan.reviewVersion,confirm:true},opts));
 ctx.service.pid--;
 opts.autoVersion=async()=>({present:true,version:'c'.repeat(64)});
 await assert.rejects(codeRecovery.postgresqlCodeRecoveryPlan({path:ctx.archive.target},opts));
 opts.autoVersion=async()=>ctx.service.autoConfiguration;ctx.service.data='/unreviewed';
 await assert.rejects(codeRecovery.postgresqlCodeRecoveryPlan({path:ctx.archive.target},opts));
 assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),before);
 assert(await readPostgresqlGraphRestoreJournal(ctx.archive.target,ctx.backupRoot,ctx.options));
}));
test('include-graph recovery refuses unverified original settings and progress changes during native validation',()=>fixture(async ctx=>{
 const journal=await interrupted(ctx),opts=recoveryOptions(ctx,journal),validate=opts.validateOriginal;
 opts.validateOriginal=async()=>({...await validate(),values:{...journal.record.body.serviceContext.originalValues,port:'9999'}});
 await assert.rejects(codeRecovery.postgresqlCodeRecoveryPlan({path:ctx.archive.target},opts));
 opts.validateOriginal=async()=>{ctx.service.pid++;return validate();};
 await assert.rejects(codeRecovery.postgresqlCodeRecoveryPlan({path:ctx.archive.target},opts));
 assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),ctx.archive.sources.find(row=>row.path===ctx.archive.target).text);
}));
test('include-graph recovery preserves an external file edit and refuses restart even after a valid review',()=>fixture(async ctx=>{
 const journal=await interrupted(ctx),opts=recoveryOptions(ctx,journal);
 const plan=await codeRecovery.postgresqlCodeRecoveryPlan({path:ctx.archive.target},opts);
 await writeFile(ctx.cluster+'/conf.d/10-app.conf','external-edit\n');opts.control=async()=>assert.fail('must not restart');
 await assert.rejects(codeRecovery.recoverPostgresqlCode({path:ctx.archive.target,reviewVersion:plan.reviewVersion,confirm:true},opts));
 assert.equal(await readFile(ctx.cluster+'/conf.d/10-app.conf','utf8'),'external-edit\n');
 assert(await readPostgresqlGraphRestoreJournal(ctx.archive.target,ctx.backupRoot,ctx.options));
}));

test('completed history exposes bounded metadata and imports exact original includes without changing operating files',()=>fixture(async ctx=>{
 await writeFile(ctx.cluster+'/postgresql.conf',"port=5444\ninclude_dir 'conf.d'\n");
 const originalMain=await readFile(ctx.cluster+'/postgresql.conf','utf8');
 const result=await applyReviewedPostgresqlGraphRestore(await reviewPostgresqlGraphRestore(ctx.archive,ctx.options),ctx.backupRoot,{control:async()=>{ctx.service.values=structuredClone(ctx.validation.values);ctx.service.pid++;}});
 const opts={...ctx.options,backupRoot:ctx.backupRoot,validateArchive:async archive=>({...ctx.validation,graphVersion:archive.graph.version,values:{...ctx.validation.values,port:archive.sources.find(row=>row.path===ctx.archive.target).text.includes('5444')?'5444':'5433',work_mem:'4096'}})};
 const catalog=await postgresqlCompletedHistory({path:ctx.archive.target},opts);assert.equal(catalog.records.length,1);assert.equal(catalog.records[0].id,result.journalId);assert.equal(catalog.records[0].backupAvailable,true);assert(!JSON.stringify(catalog).includes('port='));
 const input={path:ctx.archive.target,id:result.journalId,version:catalog.records[0].version,confirm:true};
 await assert.rejects(importPostgresqlCompletedBackup({...input,version:'f'.repeat(64)},opts));
 const before=await readFile(ctx.cluster+'/postgresql.conf','utf8'),backup=await importPostgresqlCompletedBackup(input,opts);assert.equal(backup.created,true);assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),before);
 const metadata=JSON.parse(await readFile(ctx.backupRoot+'/'+backup.id+'.json','utf8'));assert.equal(metadata.text,originalMain);assert.equal(metadata.context.completedHistoryVersion,input.version);
 const archive=await readPostgresqlGraphArchive(metadata.context.graphArchive,ctx.backupRoot,ctx.archive.target);assert.equal(archive.sources.find(row=>row.path.endsWith('/10-app.conf')).text,"work_mem='4MB'\n");
 assert.equal((await importPostgresqlCompletedBackup(input,opts)).created,false);
 assert.equal((await postgresqlCompletedHistory({path:ctx.archive.target},opts)).records.length,1);
}));
test('completed history refuses linked or altered private intent and does not manufacture a backup',()=>fixture(async ctx=>{
 const result=await applyReviewedPostgresqlGraphRestore(await reviewPostgresqlGraphRestore(ctx.archive,ctx.options),ctx.backupRoot,{control:async()=>{ctx.service.values=structuredClone(ctx.validation.values);ctx.service.pid++;}});
 const opts={...ctx.options,backupRoot:ctx.backupRoot},list=await postgresqlCompletedHistory({path:ctx.archive.target},opts);
 const name=ctx.backupRoot+'/graph-transactions/completed/'+result.journalId+'/intent.json';
 const {link,unlink}=await import('node:fs/promises');await link(name,name+'.alias');
 const unsafe=await postgresqlCompletedHistory({path:ctx.archive.target},opts);assert.equal(unsafe.records.length,0);assert.equal(unsafe.warnings,1);
 await assert.rejects(importPostgresqlCompletedBackup({path:ctx.archive.target,id:result.journalId,version:list.records[0].version,confirm:true},opts));
 await unlink(name+'.alias');await writeFile(name,'altered\n');assert.equal((await postgresqlCompletedHistory({path:ctx.archive.target},opts)).records.length,0);
 await assert.rejects(readFile(ctx.backupRoot+'/'+result.journalId+'.json'),error=>error.code==='ENOENT');
}));


test('retention resumes an empty custody directory left by a killed publisher and preserves original bytes',()=>fixture(async ctx=>{
 const {spawn}=await import('node:child_process');
 const plan=await reviewPostgresqlGraphRestore(ctx.archive,ctx.options);
 await applyReviewedPostgresqlGraphRestore(plan,ctx.backupRoot,{retainCompleted:false,control:async()=>{ctx.service.values=structuredClone(ctx.validation.values);ctx.service.pid++;}});
 const journal=await readPostgresqlGraphRestoreJournal(ctx.archive.target,ctx.backupRoot,ctx.options);
 const destination=ctx.backupRoot+'/graph-transactions/completed/'+journal.record.id;
 const writer=spawn(process.execPath,['--input-type=module','-e',"import{mkdir}from'node:fs/promises';await mkdir(process.argv[1],{recursive:true,mode:0o700});process.stdout.write('ready\\n');setInterval(()=>{},1000)",destination],{stdio:['ignore','pipe','pipe']});
 const exit=new Promise(resolve=>writer.once('exit',resolve));
 try{
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Custody writer timed out')),5000);writer.once('error',error=>{clearTimeout(timeout);reject(error);});writer.stdout.once('data',bytes=>{clearTimeout(timeout);assert.equal(bytes.toString(),'ready\n');resolve();});});
 }finally{writer.kill('SIGKILL');await exit;}
 const progress=await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot);
 const result=await retainPostgresqlGraphRestoreJournal(journal,ctx.backupRoot,progress);
 assert(result.activeIntentCleared);
 assert.equal(createHash('sha256').update(await readFile(destination+'/intent.json')).digest('hex'),journal.version);
 assert.equal(await readPostgresqlGraphRestoreJournal(ctx.archive.target,ctx.backupRoot,ctx.options),null);
}));

test('retention refuses occupied, exposed and linked custody directories without touching active evidence',()=>fixture(async ctx=>{
 const {chmod,symlink}=await import('node:fs/promises');
 await applyReviewedPostgresqlGraphRestore(await reviewPostgresqlGraphRestore(ctx.archive,ctx.options),ctx.backupRoot,{retainCompleted:false,control:async()=>{ctx.service.values=structuredClone(ctx.validation.values);ctx.service.pid++;}});
 const journal=await readPostgresqlGraphRestoreJournal(ctx.archive.target,ctx.backupRoot,ctx.options),progress=await readPostgresqlGraphSwapProgress(journal,ctx.backupRoot);
 const destination=ctx.backupRoot+'/graph-transactions/completed/'+journal.record.id;
 await mkdir(destination,{recursive:true,mode:0o700});await writeFile(destination+'/intent.json','unrecognized',{mode:0o600});
 await assert.rejects(retainPostgresqlGraphRestoreJournal(journal,ctx.backupRoot,progress));assert.equal(await readFile(destination+'/intent.json','utf8'),'unrecognized');
 await rm(destination,{recursive:true});await mkdir(destination,{mode:0o700});await chmod(destination,0o755);
 await assert.rejects(retainPostgresqlGraphRestoreJournal(journal,ctx.backupRoot,progress));await rm(destination,{recursive:true});
 const other=ctx.backupRoot+'/unrelated';await mkdir(other,{mode:0o700});await symlink(other,destination);
 await assert.rejects(retainPostgresqlGraphRestoreJournal(journal,ctx.backupRoot,progress));
 assert.equal((await readPostgresqlGraphRestoreJournal(ctx.archive.target,ctx.backupRoot,ctx.options)).version,journal.version);
}));

async function originalBackupRecord(ctx){
 const {createPostgresqlRestoreUndoBackup}=await import('../lib/postgresql-restore-undo-backup.ts');
 const backup=await createPostgresqlRestoreUndoBackup(await reviewPostgresqlGraphRestore(ctx.archive,ctx.options),ctx.backupRoot);
 return JSON.parse(await readFile(ctx.backupRoot+'/'+backup.id+'.json','utf8'));
}
test('verified backup reader completes interrupted publication without replacing its final inode or source bytes',()=>fixture(async ctx=>{
 const {postgresqlRecoveryBackup}=await import('../lib/postgresql-recovery-backup.ts');
 const {link,lstat}=await import('node:fs/promises');
 const record=await originalBackupRecord(ctx),file=ctx.backupRoot+'/'+record.id+'.json',alias=ctx.backupRoot+'/.pg-undo-init-'+record.id;
 await link(file,alias);const before=await lstat(file);assert.equal(before.nlink,2);
 assert.deepEqual(await postgresqlRecoveryBackup(record.id,ctx.backupRoot,ctx.archive.target,{file:record.target}),record);
 const after=await lstat(file);assert.equal(after.ino,before.ino);assert.equal(after.nlink,1);await assert.rejects(lstat(alias),error=>error.code==='ENOENT');
 assert.deepEqual(await postgresqlRecoveryBackup(record.id,ctx.backupRoot,ctx.archive.target,{file:record.target}),record);
 assert.equal(await readFile(file,'utf8'),JSON.stringify(record));
}));
test('publication repair preserves unknown aliases, corrupt metadata and invalid original graph archives',()=>fixture(async ctx=>{
 const {postgresqlRecoveryBackup}=await import('../lib/postgresql-recovery-backup.ts');
 const {link,unlink,lstat}=await import('node:fs/promises');const record=await originalBackupRecord(ctx),file=ctx.backupRoot+'/'+record.id+'.json',alias=ctx.backupRoot+'/.pg-undo-init-'+record.id,unknown=ctx.backupRoot+'/unrecognized-link';
 await link(file,unknown);await assert.rejects(postgresqlRecoveryBackup(record.id,ctx.backupRoot,ctx.archive.target,{file:record.target}));assert.equal((await lstat(unknown)).ino,(await lstat(file)).ino);await unlink(unknown);
 await link(file,alias);await writeFile(file,JSON.stringify({...record,version:'a'.repeat(64)}));await assert.rejects(postgresqlRecoveryBackup(record.id,ctx.backupRoot,ctx.archive.target,{file:record.target}));assert.equal((await lstat(alias)).nlink,2);
 await writeFile(file,JSON.stringify({...record,context:{...record.context,graphArchive:{...record.context.graphArchive,graphVersion:'b'.repeat(64)}}}));await assert.rejects(postgresqlRecoveryBackup(record.id,ctx.backupRoot,ctx.archive.target,{file:record.target}));assert.equal((await lstat(alias)).nlink,2);
 await writeFile(file,JSON.stringify(record));await link(file,unknown);await assert.rejects(postgresqlRecoveryBackup(record.id,ctx.backupRoot,ctx.archive.target,{file:record.target}));assert.equal((await lstat(alias)).nlink,3);
}));

test('published backup survives actual publisher SIGKILL before temporary alias removal',()=>fixture(async ctx=>{
 const {postgresqlRecoveryBackup}=await import('../lib/postgresql-recovery-backup.ts');
 const {rename,lstat}=await import('node:fs/promises'),{spawn}=await import('node:child_process');
 const record=await originalBackupRecord(ctx),file=ctx.backupRoot+'/'+record.id+'.json',alias=ctx.backupRoot+'/.pg-undo-init-'+record.id;
 await rename(file,alias);
 const child=spawn(process.execPath,['--input-type=module','-e',"import{link}from'node:fs/promises';await link(process.argv[1],process.argv[2]);process.stdout.write('ready\\n');setInterval(()=>{},1000)",alias,file],{stdio:['ignore','pipe','pipe']});
 const exit=new Promise(resolve=>child.once('exit',resolve));
 try{await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Publisher timed out')),5000);child.once('error',error=>{clearTimeout(timer);reject(error);});child.stdout.once('data',bytes=>{clearTimeout(timer);assert.equal(bytes.toString(),'ready\n');resolve();});});}finally{child.kill('SIGKILL');await exit;}
 assert.equal((await lstat(file)).nlink,2);
 assert.deepEqual(await postgresqlRecoveryBackup(record.id,ctx.backupRoot,ctx.archive.target,{file:record.target}),record);
 assert.equal((await lstat(file)).nlink,1);await assert.rejects(lstat(alias),error=>error.code==='ENOENT');
}));


test('completed-history retry publishes a fully verified pending backup with the same inode and no operating edits',()=>fixture(async ctx=>{
 const {rename,lstat}=await import('node:fs/promises');
 const result=await applyReviewedPostgresqlGraphRestore(await reviewPostgresqlGraphRestore(ctx.archive,ctx.options),ctx.backupRoot,{control:async()=>{ctx.service.values=structuredClone(ctx.validation.values);ctx.service.pid++;}});
 const opts={...ctx.options,backupRoot:ctx.backupRoot,validateArchive:async archive=>({...ctx.validation,graphVersion:archive.graph.version,values:{...ctx.validation.values,port:'5444',work_mem:'4096'}})};
 const catalog=await postgresqlCompletedHistory({path:ctx.archive.target},opts),input={path:ctx.archive.target,id:result.journalId,version:catalog.records[0].version,confirm:true};
 await importPostgresqlCompletedBackup(input,opts);
 const final=ctx.backupRoot+'/'+input.id+'.json',pending=ctx.backupRoot+'/.pg-undo-init-'+input.id,bytes=await readFile(final),before=await lstat(final),operating=await readFile(ctx.cluster+'/postgresql.conf');
 await rename(final,pending);
 await assert.rejects(importPostgresqlCompletedBackup({...input,version:'e'.repeat(64)},opts));assert.deepEqual(await readFile(pending),bytes);
 assert.equal((await importPostgresqlCompletedBackup(input,opts)).created,true);
 assert.equal((await lstat(final)).ino,before.ino);assert.deepEqual(await readFile(final),bytes);await assert.rejects(lstat(pending),error=>error.code==='ENOENT');
 assert.deepEqual(await readFile(ctx.cluster+'/postgresql.conf'),operating);assert.equal((await importPostgresqlCompletedBackup(input,opts)).created,false);
}));

test('publisher preserves incomplete or replaced pending bytes and refuses an edit during the publication review',()=>fixture(async ctx=>{
 const {publishPostgresqlRestoreBackup}=await import('../lib/postgresql-restore-undo-backup.ts');const {rename,lstat}=await import('node:fs/promises');
 const record=await originalBackupRecord(ctx),final=ctx.backupRoot+'/'+record.id+'.json',pending=ctx.backupRoot+'/.pg-undo-init-'+record.id;
 await rename(final,pending);await writeFile(pending,'incomplete');
 await assert.rejects(publishPostgresqlRestoreBackup(record,ctx.backupRoot,async()=>{}));assert.equal(await readFile(pending,'utf8'),'incomplete');await assert.rejects(lstat(final),error=>error.code==='ENOENT');
 await writeFile(pending,JSON.stringify(record));let reviews=0;
 await assert.rejects(publishPostgresqlRestoreBackup(record,ctx.backupRoot,async()=>{if(++reviews===2)await writeFile(pending,'external edit');}));assert.equal(await readFile(pending,'utf8'),'external edit');await assert.rejects(lstat(final),error=>error.code==='ENOENT');
}));

test('real undo-backup publisher SIGKILL before final link can resume its exact private pending inode',()=>fixture(async ctx=>{
 const {publishPostgresqlRestoreBackup}=await import('../lib/postgresql-restore-undo-backup.ts');const {spawn}=await import('node:child_process');const {unlink,lstat}=await import('node:fs/promises');
 const record=await originalBackupRecord(ctx),final=ctx.backupRoot+'/'+record.id+'.json',pending=ctx.backupRoot+'/.pg-undo-init-'+record.id;await unlink(final);
 const moduleUrl=new URL('../lib/postgresql-restore-undo-backup.ts',import.meta.url).href;
 const code="const {publishPostgresqlRestoreBackup}=await import(process.argv[1]);let count=0;await publishPostgresqlRestoreBackup(JSON.parse(process.argv[2]),process.argv[3],async()=>{if(++count===2){process.stdout.write('ready\\n');await new Promise(()=>{});}});";
 const child=spawn(process.execPath,['--input-type=module','-e',code,moduleUrl,JSON.stringify(record),ctx.backupRoot],{stdio:['ignore','pipe','pipe']}),exit=new Promise(resolve=>child.once('exit',(code,signal)=>resolve({code,signal})));let errors='';child.stderr.on('data',bytes=>errors+=bytes.toString());
 try{await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Pending publisher timeout '+errors)),5000);child.once('error',error=>{clearTimeout(timer);reject(error);});child.stdout.once('data',bytes=>{clearTimeout(timer);assert.equal(bytes.toString(),'ready\n');resolve();});});}finally{child.kill('SIGKILL');assert.equal((await exit).signal,'SIGKILL');}
 const before=await lstat(pending);await assert.rejects(lstat(final),error=>error.code==='ENOENT');
 await publishPostgresqlRestoreBackup(record,ctx.backupRoot,async()=>{});
 assert.equal((await lstat(final)).ino,before.ino);assert.equal((await lstat(final)).nlink,1);assert.deepEqual(JSON.parse(await readFile(final,'utf8')),record);await assert.rejects(lstat(pending),error=>error.code==='ENOENT');
}));

async function prepared(ctx,stage=true){
 const journal=await createReviewedPostgresqlGraphRestoreJournal(await reviewPostgresqlGraphRestore(ctx.archive,ctx.options),ctx.backupRoot);
 if(stage)await preparePostgresqlGraphRestoreStages(journal,ctx.backupRoot,{ownerGid:process.getgid()});
 const opts=recoveryOptions(ctx,journal);opts.control=async()=>assert.fail('Preparation cancellation must not restart the service');
 return {journal,opts};
}
for(const staged of [false,true])test('public PostgreSQL recovery cancels '+(staged?'ready candidates':'intent-only preparation')+' without changing original configuration or restarting',()=>fixture(async ctx=>{
 const {journal,opts}=await prepared(ctx,staged),mainStat=await lstat(ctx.cluster+'/postgresql.conf'),main=await readFile(ctx.cluster+'/postgresql.conf','utf8'),child=await readFile(ctx.cluster+'/conf.d/10-app.conf','utf8');
 const plan=await codeRecovery.postgresqlCodeRecoveryPlan({path:ctx.archive.target},opts);
 assert.equal(plan.kind,'postgresql-stage-cancellation');assert.equal(plan.serviceRestartRequired,false);assert.equal(plan.phase,staged?'ready':'intent-only');
 assert(plan.files.every(file=>file.action==='preserve'));assert(!JSON.stringify(plan).includes('port=5444'));
 const result=await codeRecovery.recoverPostgresqlCode({path:ctx.archive.target,reviewVersion:plan.reviewVersion,confirm:true},opts);
 assert.equal(result.preparationCancelled,true);assert.equal(result.restored,false);assert.equal(result.serviceRestarted,false);assert.equal(result.operatingConfigurationChanged,false);assert.equal(result.journalCleanupVerified,true);
 assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),main);assert.equal(await readFile(ctx.cluster+'/conf.d/10-app.conf','utf8'),child);
 assert.equal(await readPostgresqlGraphRestoreJournal(ctx.archive.target,ctx.backupRoot,ctx.options),null);
 const finalStat=await lstat(ctx.cluster+'/postgresql.conf');for(const key of ['dev','ino','uid','gid','mode','size','mtimeMs','ctimeMs'])assert.equal(finalStat[key],mainStat[key],key);
 assert(!(await readdir(ctx.cluster)).some(name=>name.startsWith('.tastedev-pg-')));
 assert(await readPostgresqlGraphArchive(ctx.reference,ctx.backupRoot,ctx.archive.target));
}));
test('public preparation review resumes intent-only cleanup after stages were cancelled by an interrupted caller',()=>fixture(async ctx=>{
 const {journal,opts}=await prepared(ctx);await cancelPostgresqlGraphRestoreStages(journal,ctx.backupRoot);
 const plan=await codeRecovery.postgresqlCodeRecoveryPlan({path:ctx.archive.target},opts);assert.equal(plan.phase,'intent-only');
 const result=await codeRecovery.recoverPostgresqlCode({path:ctx.archive.target,reviewVersion:plan.reviewVersion,confirm:true},opts);assert(result.preparationCancelled);
}));
for(const change of ['service','auto-config','original-file','stage-ledger'])test('public preparation cancellation preserves evidence after '+change+' changes',()=>fixture(async ctx=>{
 const {journal,opts}=await prepared(ctx),plan=await codeRecovery.postgresqlCodeRecoveryPlan({path:ctx.archive.target},opts);
 if(change==='service')ctx.service.pid++;
 if(change==='auto-config')opts.autoVersion=async()=>({present:true,version:'c'.repeat(64)});
 if(change==='original-file')await writeFile(ctx.cluster+'/postgresql.conf','external-change\n');
 if(change==='stage-ledger'){
  const file=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.json';await writeFile(file+'.replacement',await readFile(file),{mode:0o600});await rename(file+'.replacement',file);
 }
 await assert.rejects(codeRecovery.recoverPostgresqlCode({path:ctx.archive.target,reviewVersion:plan.reviewVersion,confirm:true},opts));
 assert(await readPostgresqlGraphRestoreJournal(ctx.archive.target,ctx.backupRoot,ctx.options));
 assert((await readdir(ctx.cluster)).some(name=>name.startsWith('.tastedev-pg-stage-')));
 if(change==='original-file')assert.equal(await readFile(ctx.cluster+'/postgresql.conf','utf8'),'external-change\n');
}));
test('preparation recovery refuses missing stage ledger when swap evidence remains',()=>fixture(async ctx=>{
 const {journal,opts}=await prepared(ctx);await mkdir(ctx.backupRoot+'/graph-stages/'+journal.record.id+'.swap',{mode:0o700});
 await rm(ctx.backupRoot+'/graph-stages/'+journal.record.id+'.json');
 await assert.rejects(codeRecovery.postgresqlCodeRecoveryPlan({path:ctx.archive.target},opts));
 assert(await readPostgresqlGraphRestoreJournal(ctx.archive.target,ctx.backupRoot,ctx.options));
}));
test('preparation review rejects ledger replacement during isolated native validation',()=>fixture(async ctx=>{
 const {journal,opts}=await prepared(ctx),validate=opts.validateOriginal;
 opts.validateOriginal=async()=>{const file=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.json';await writeFile(file+'.replacement',await readFile(file),{mode:0o600});await rename(file+'.replacement',file);return validate();};
 await assert.rejects(codeRecovery.postgresqlCodeRecoveryPlan({path:ctx.archive.target},opts));
 assert(await readPostgresqlGraphRestoreJournal(ctx.archive.target,ctx.backupRoot,ctx.options));
}));

for(const obstruction of ['preparing','custody'])test('public preparation cleanup preserves ambiguous '+obstruction+' evidence',()=>fixture(async ctx=>{
 const {journal,opts}=await prepared(ctx),file=ctx.backupRoot+'/graph-stages/'+journal.record.id+'.json';
 if(obstruction==='preparing'){
  const record=JSON.parse(await readFile(file,'utf8'));record.data.phase='preparing';record.digest=createHash('sha256').update(JSON.stringify(record.data)).digest('hex');await writeFile(file,JSON.stringify(record),{mode:0o600});
 }else await mkdir(ctx.backupRoot+'/graph-stages/'+journal.record.id+'.custody',{mode:0o700});
 await assert.rejects(codeRecovery.postgresqlCodeRecoveryPlan({path:ctx.archive.target},opts));
 assert(await readPostgresqlGraphRestoreJournal(ctx.archive.target,ctx.backupRoot,ctx.options));assert(await readFile(file));
}));

test('missing preparation ledger with orphaned hidden candidates preserves intent and candidate files',()=>fixture(async ctx=>{
 const {journal,opts}=await prepared(ctx),before=await readdir(ctx.cluster);await rm(ctx.backupRoot+'/graph-stages/'+journal.record.id+'.json');
 await assert.rejects(codeRecovery.postgresqlCodeRecoveryPlan({path:ctx.archive.target},opts));
 assert(await readPostgresqlGraphRestoreJournal(ctx.archive.target,ctx.backupRoot,ctx.options));assert.deepEqual(await readdir(ctx.cluster),before);
}));
