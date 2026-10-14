import type {PostgresqlConfigCandidate} from '../lib/postgresql-config-candidate.ts';
import type {PostgresqlGraphArchive} from '../lib/postgresql-graph-archive.ts';
import type {RestoreJournal} from '../lib/postgresql-graph-restore-journal.ts';
import {existsSync} from 'node:fs';
import {verificationWorkRoot} from './verification/work-directory.ts';
import {jsonRecord,recordField} from './verification/http-json.ts';
import {hasErrorCode} from '../lib/error-code.ts';
import {verificationWorkDirectory} from './verification/work-directory.ts';
import {postgresqlCompletedHistory,importPostgresqlCompletedBackup} from '../lib/postgresql-completed-history.ts';
import {postgresqlCodeRecoveryPlan,recoverPostgresqlCode} from '../lib/postgresql-code-recovery.ts';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,lstat,readdir,rmdir,link,rename} from 'node:fs/promises';
import {execFileSync,execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {postgresqlConfigGraph} from '../lib/postgresql-config-graph.ts';
import {createPostgresqlGraphArchive,readPostgresqlGraphArchive} from '../lib/postgresql-graph-archive.ts';
import {inspectPostgresqlGraphArchive} from '../lib/postgresql-archive-candidate.ts';
import {inspectPostgresqlConfiguration} from '../lib/postgresql-config-inspect.ts';
import {inspectPostgresqlConfigCandidate} from '../lib/postgresql-config-validation.ts';
import {reviewPostgresqlGraphRestore} from '../lib/postgresql-graph-restore-review.ts';
import {applyReviewedPostgresqlGraphRestore} from '../lib/postgresql-reviewed-graph-restore.ts';
import {recoverReviewedPostgresqlGraph} from '../lib/postgresql-reviewed-graph-recovery.ts';
import {inspectPostgresqlOriginalConfiguration} from '../lib/postgresql-original-config-validation.ts';
import {readPostgresqlGraphRestoreJournal,retainPostgresqlGraphRestoreJournal} from '../lib/postgresql-graph-restore-journal.ts';
import {readPostgresqlGraphSwapProgress} from '../lib/postgresql-graph-swap-progress.ts';
import {validationIdentityBinary} from '../lib/validation-identity-binary.ts';
import {postgresqlCodeRestorePlan,restorePostgresqlCode} from '../lib/postgresql-code-restore.ts';

const args=process.argv.slice(2),major=args[0]||'18';
if(args.length>1||!/^[1-9][0-9]$/.test(major)||Number(major)<15)throw Error('Usage: node scripts/verify-postgresql-graph-restore-host.ts [major]');
assert(process.getuid&&process.getgid);const uid=process.getuid(),gid=process.getgid();assert.notEqual(uid,0);
const binary='/usr/lib/postgresql/'+major+'/bin/postgres';
const binaries=['/usr/bin/bwrap','/usr/bin/prlimit','/usr/bin/id',binary].map(binary=>validationIdentityBinary({binary}));
const version=execFileSync(binary,['--version'],{encoding:'utf8',timeout:10000}).trim();
assert.match(version,new RegExp('PostgreSQL\\) '+major+'\\.'));
const workspace=await verificationWorkDirectory('tastedev-pg-restore-host-');
const target='/etc/postgresql/'+major+'/fixture/postgresql.conf';
const validate=(candidate:PostgresqlConfigCandidate)=>inspectPostgresqlConfigCandidate(candidate,{validationUid:uid,validationGid:gid});
const checks:string[]=[];
async function scenario(name:string,failActivation:boolean){
 const base=path.join(workspace,name),cluster=path.join(base,'postgresql',major,'fixture'),backupRoot=path.join(base,'backups');
 await mkdir(path.join(cluster,'conf.d'),{recursive:true,mode:0o700});await mkdir(backupRoot,{mode:0o700});
 const saved={
  'postgresql.conf':"port=5433\nmax_connections=20\nshared_buffers='16MB'\nlogging_collector=off\ninclude_dir 'conf.d'\n",
  'conf.d/10-app.conf':"work_mem='8MB'\n",
  'conf.d/20-extra.conf':'max_connections=25\n'
 };
 for(const [file,text] of Object.entries(saved))await writeFile(path.join(cluster,file),text,{mode:0o600});
 const graph=await postgresqlConfigGraph(target,{base,ownerUid:uid});
 const reference=await createPostgresqlGraphArchive(graph,backupRoot),archive=await readPostgresqlGraphArchive(reference,backupRoot,target);
 const desired=await inspectPostgresqlGraphArchive(archive,{validationUid:uid,validationGid:gid,validate});
 assert.equal(desired.values.work_mem,'8192');assert.equal(desired.values.max_connections,'25');
 const original={
  'postgresql.conf':"port=5444\nmax_connections=30\nshared_buffers='16MB'\nwork_mem='4MB'\nlogging_collector=off\ninclude_dir 'conf.d'\n",
  'conf.d/10-app.conf':"work_mem='2MB'\n",
  'conf.d/30-new.conf':'max_connections=35\n'
 };
 await rm(path.join(cluster,'conf.d/20-extra.conf'));
 for(const [file,text] of Object.entries(original))await writeFile(path.join(cluster,file),text,{mode:0o600});
 const inspectLive=()=>inspectPostgresqlConfiguration(target,{base,ownerUid:uid,validationUid:uid,validationGid:gid,validate});
 const before=await inspectLive();
 const service={identityVerified:true,settingsSource:'running-server',config:target,hba:path.posix.dirname(target)+'/pg_hba.conf',data:'/var/lib/postgresql/'+major+'/fixture',unit:'postgresql@'+major+'-fixture.service',major:Number(major),autoConfiguration:{present:false,version:'a'.repeat(64)},configurationErrors:0,pid:123,start:'456',values:before.values};
 const review=await reviewPostgresqlGraphRestore(archive,{base,ownerUid:uid,archiveScope:service,inspectService:async()=>structuredClone(service),validateArchive:(record:PostgresqlGraphArchive)=>inspectPostgresqlGraphArchive(record,{validationUid:uid,validationGid:gid,validate})});
 let calls=0,journalId:unknown;
 const historyCase=name==='existing-history-import';
 const run=()=>applyReviewedPostgresqlGraphRestore(review,backupRoot,{retainCompleted:['automatic-retention','empty-retention-custody'].includes(name)||historyCase,
  control:async(unit:string,action:'restart')=>{assert.equal(unit,service.unit);assert.equal(action,'restart');calls++;service.pid++;service.values=structuredClone(calls===1?desired.values:before.values);if(name==='empty-retention-custody'){const active=await readPostgresqlGraphRestoreJournal(target,backupRoot,{base,ownerUid:uid});assert(active);await mkdir(path.join(backupRoot,'graph-transactions','completed',active.record.id),{recursive:true,mode:0o700});}if(failActivation&&calls===1)throw Error('fixture activation failure');},
  inspectRecovery:async()=>({unit:service.unit,activeState:'active',controlPid:0,service:structuredClone(service)})
 });
 const undoRequest=name==='existing-restore-undo-request',killed=name==='process-interruption',request=name==='existing-restore-request'||undoRequest;
 if(request){
  const scope={config:service.config,data:service.data,hba:service.hba,unit:service.unit,major:service.major,autoConfiguration:service.autoConfiguration};
  const text=saved['postgresql.conf'],record={id:reference.id,kind:'postgresql',target:path.join(cluster,'postgresql.conf'),text,version:createHash('sha256').update(text).digest('hex'),createdAt:new Date().toISOString(),context:{version:1,graphVersion:archive.graph.version,graphArchive:reference,scope,values:desired.values}};
  await writeFile(path.join(backupRoot,reference.id+'.json'),JSON.stringify(record),{mode:0o600,flag:'wx'});
  const options={base,backupRoot,ownerUid:uid,inspectService:async()=>structuredClone(service),validateArchive:(record:PostgresqlGraphArchive)=>inspectPostgresqlGraphArchive(record,{validationUid:uid,validationGid:gid,validate}),control:async(unit:string,action:'restart')=>{assert.equal(unit,service.unit);assert.equal(action,'restart');calls++;service.pid++;service.values=structuredClone((await inspectLive()).values);}};
  const plan=await postgresqlCodeRestorePlan({path:target,id:reference.id},options);assert('files' in plan);assert(plan.files.some(file=>file.action==='remove'));assert(plan.files.some(file=>file.action==='create'));
  const input={path:plan.path,id:plan.id,version:plan.version,graphVersion:plan.graphVersion,candidateGraphVersion:plan.candidateGraphVersion,serviceVersion:plan.serviceVersion,backupVersion:plan.backupVersion,backupIdentity:plan.backupIdentity,reviewVersion:plan.reviewVersion};
  const output=await restorePostgresqlCode({...input,confirm:true},options);assert.equal(output.journalCleanupVerified,true);assert('undoBackupAvailable' in output&&'historyId' in output);assert.equal(output.undoBackupAvailable,true);assert('historyId' in output);journalId=output.historyId;
  if(undoRequest){const undo=await postgresqlCodeRestorePlan({path:target,id:output.backupId},options);assert('files' in undo);assert(undo.files.some(file=>file.action==='create'));assert(undo.files.some(file=>file.action==='remove'));const request={path:undo.path,id:undo.id,version:undo.version,graphVersion:undo.graphVersion,candidateGraphVersion:undo.candidateGraphVersion,serviceVersion:undo.serviceVersion,backupVersion:undo.backupVersion,backupIdentity:undo.backupIdentity,reviewVersion:undo.reviewVersion};const result=await restorePostgresqlCode({...request,confirm:true},options);assert.equal(result.journalCleanupVerified,true);assert.notEqual(result.backupId,output.backupId);assert('historyId' in result);journalId=result.historyId;}
 }else if(killed){
  const input=JSON.stringify({base,backupRoot,target,reference,service}),worker=path.resolve(existsSync('scripts/postgresql-restore-fixture-worker.mjs')?'scripts/postgresql-restore-fixture-worker.mjs':'scripts/postgresql-restore-fixture-worker.ts');
  const child=spawn(process.execPath,[worker,'writer',input],{stdio:['ignore','pipe','pipe']});
  const done=new Promise<{code:number|null;signal:NodeJS.Signals|null}>(resolve=>child.once('close',(code,signal)=>resolve({code,signal})));let timer:ReturnType<typeof setTimeout>|undefined,output='';
  try{
   await new Promise<void>((resolve,reject)=>{timer=setTimeout(()=>reject(Error('fixture writer checkpoint timed out')),30000);child.once('error',reject);child.once('exit',()=>reject(Error('fixture writer exited before checkpoint')));child.stdout.on('data',bytes=>{output+=bytes.toString();if(output.includes('READY\n')){clearTimeout(timer);resolve();}});});
   const journal=await readPostgresqlGraphRestoreJournal(target,backupRoot,{base,ownerUid:uid});assert(journal);journalId=journal.record.id;
   const lock=path.join(backupRoot,'graph-stages',journalId+'.lock'),beforeLock=await lstat(lock);
   assert(child.kill('SIGKILL'));assert.equal((await done).signal,'SIGKILL');
   // Direct fixtures use directory leases. Remove only the captured empty lease
   // after this exact writer exits. Installed helpers use inherited kernel locks.
   const afterLock=await lstat(lock);assert.equal(afterLock.dev,beforeLock.dev);assert.equal(afterLock.ino,beforeLock.ino);assert.equal(afterLock.uid,uid);assert.equal(afterLock.mode&0o777,0o700);assert.deepEqual(await readdir(lock),[]);await rmdir(lock);
   const recovered=await promisify(execFile)(process.execPath,[worker,'recovery',input],{timeout:30000,maxBuffer:65536});assert.equal(JSON.parse(recovered.stdout).phase,'rolled-back');calls=2;
  }finally{clearTimeout(timer);child.kill('SIGKILL');await done;}
 }else if(failActivation)await assert.rejects(run,error=>{const record=jsonRecord(error);journalId=record.journalId;return record.rollbackComplete===true;});
 else{const result=await run();assert.equal(result.phase,'committed');assert('journalId' in result);journalId=result.journalId;}
 if(historyCase){const opts={base,ownerUid:uid,backupRoot,validateArchive:(record:PostgresqlGraphArchive)=>inspectPostgresqlGraphArchive(record,{validationUid:uid,validationGid:gid,validate}),inspectService:async()=>structuredClone(service),control:async(unit:string,action:'restart')=>{assert.equal(unit,service.unit);assert.equal(action,'restart');calls++;service.pid++;service.values=structuredClone((await inspectLive()).values);}};const catalog=await postgresqlCompletedHistory({path:target},opts);assert.equal(catalog.records.length,1);assert.equal(catalog.records[0].id,journalId);const imported=await importPostgresqlCompletedBackup({path:target,id:journalId,version:catalog.records[0].version,confirm:true},opts);assert.equal(imported.created,true);const metadata=path.join(backupRoot,imported.id+'.json'),alias=path.join(backupRoot,'.pg-undo-init-'+imported.id);const pendingBefore=await lstat(metadata),pendingBytes=await readFile(metadata);await rename(metadata,alias);assert.equal((await importPostgresqlCompletedBackup({path:target,id:journalId,version:catalog.records[0].version,confirm:true},opts)).created,true);assert.equal((await lstat(metadata)).ino,pendingBefore.ino);assert.deepEqual(await readFile(metadata),pendingBytes);await assert.rejects(lstat(alias),error=>hasErrorCode(error,'ENOENT'));await link(metadata,alias);assert.equal((await lstat(metadata)).nlink,2);const plan=await postgresqlCodeRestorePlan({path:target,id:imported.id},opts);assert.equal((await lstat(metadata)).nlink,1);await assert.rejects(lstat(alias),error=>hasErrorCode(error,'ENOENT'));const input={path:plan.path,id:plan.id,version:plan.version,graphVersion:plan.graphVersion,candidateGraphVersion:plan.candidateGraphVersion,serviceVersion:plan.serviceVersion,backupVersion:plan.backupVersion,backupIdentity:plan.backupIdentity,reviewVersion:plan.reviewVersion};const output=await restorePostgresqlCode({...input,confirm:true},opts);assert.equal(output.journalCleanupVerified,true);assert('historyId' in output);journalId=output.historyId;}
 const recoveryRequest=name==='existing-recovery-request',independent=name==='independent-recovery'||recoveryRequest,rolledBack=failActivation||independent||killed;
 if(independent){
  // Simulate an activation checkpoint without claiming a killed process.
  const file=path.join(backupRoot,'graph-stages',journalId+'.swap/progress.json'),record=JSON.parse(await readFile(file,'utf8'));
  record.data.phase='activating';record.digest=createHash('sha256').update(JSON.stringify(record.data)).digest('hex');await writeFile(file,JSON.stringify(record),{mode:0o600});
  const journal=await readPostgresqlGraphRestoreJournal(target,backupRoot,{base,ownerUid:uid});
  const options={base,backupRoot,ownerUid:uid,autoVersion:async()=>structuredClone(service.autoConfiguration),
   validateOriginal:(journal:RestoreJournal,root:string)=>inspectPostgresqlOriginalConfiguration(journal,root,{validationUid:uid,validationGid:gid,validate}),
   inspectService:async()=>structuredClone(service),inspectRecovery:async()=>({unit:service.unit,activeState:'active',controlPid:0,mainPid:service.pid,service:structuredClone(service)}),
   control:async(unit:string,action:'restart')=>{assert.equal(unit,service.unit);assert.equal(action,'restart');calls++;service.pid++;service.values=structuredClone(before.values);}
  };
  let result;
  if(recoveryRequest){const plan=await postgresqlCodeRecoveryPlan({path:target},options);assert('kind' in plan&&'files' in plan);assert.equal(plan.kind,'postgresql-include-graph');assert.equal(plan.files.length,4);result=jsonRecord(await recoverPostgresqlCode({path:target,reviewVersion:plan.reviewVersion,confirm:true},options));assert.equal(result.recovered,true);assert.equal(result.journalCleanupVerified,true);}
  else result=jsonRecord(await recoverReviewedPostgresqlGraph(journal,backupRoot,{retainCompleted:false,
   validateOriginal:(journal:RestoreJournal,root:string)=>inspectPostgresqlOriginalConfiguration(journal,root,{validationUid:uid,validationGid:gid,validate}),
   inspectService:async()=>structuredClone(service),inspectRecovery:async()=>({unit:service.unit,activeState:'active',controlPid:0,service:structuredClone(service)}),
   control:async(unit:string,action:'restart')=>{assert.equal(unit,service.unit);assert.equal(action,'restart');calls++;service.pid++;service.values=structuredClone(before.values);}
  }));assert.equal(result.phase,'rolled-back');
 }
 assert.equal(calls,rolledBack||undoRequest||historyCase?2:1);
 const actual=await inspectLive(),expected=rolledBack||undoRequest||historyCase?before:desired;assert.equal(actual.graphVersion,expected.graphVersion);assert.deepEqual(actual.values,expected.values);
 for(const [file,text] of Object.entries(rolledBack||undoRequest||historyCase?original:saved))assert.equal(await readFile(path.join(cluster,file),'utf8'),text);
 await assert.rejects(readFile(path.join(cluster,rolledBack||undoRequest||historyCase?'conf.d/20-extra.conf':'conf.d/30-new.conf')),error=>hasErrorCode(error,'ENOENT'));
 const progress=JSON.parse(await readFile(path.join(backupRoot,'graph-stages',journalId+'.swap/progress.json'),'utf8')).data;
 assert.equal(progress.phase,rolledBack?'rolled-back':'committed');
 const retainedJournal=await readPostgresqlGraphRestoreJournal(target,backupRoot,{base,ownerUid:uid});
 if(['automatic-retention','empty-retention-custody'].includes(name)||request||recoveryRequest||historyCase)assert.equal(retainedJournal,null);
 else await retainPostgresqlGraphRestoreJournal(retainedJournal,backupRoot,await readPostgresqlGraphSwapProgress(retainedJournal,backupRoot));
 assert.equal(await readPostgresqlGraphRestoreJournal(target,backupRoot,{base,ownerUid:uid}),null);
 assert(typeof journalId==='string');const retainedBytes=await readFile(path.join(backupRoot,'graph-transactions','completed',journalId,'intent.json'));if(retainedJournal)assert.equal(createHash('sha256').update(retainedBytes).digest('hex'),retainedJournal.version);else assert.equal(JSON.parse(retainedBytes.toString('utf8')).id,journalId);
 checks.push(name+': completed intent retained unchanged and active slot released');
 checks.push(name+': reviewed snapshot to journal, native archive validation, update/create/remove, final native graph/options and durable phase');
}
try{
 await scenario('commit',false);await scenario('activation-failure-rollback',true);await scenario('independent-recovery',false);await scenario('process-interruption',false);await scenario('automatic-retention',false);await scenario('empty-retention-custody',false);await scenario('existing-restore-request',false);await scenario('existing-recovery-request',false);await scenario('existing-restore-undo-request',false);await scenario('existing-history-import',false);
 assert.deepEqual(binaries,binaries.map(({path:binary})=>validationIdentityBinary({binary})));
 const sourceFiles=['postgresql-recovery-backup.mjs','postgresql-completed-history.mjs','postgresql-restore-undo-backup.mjs','postgresql-code-recovery.mjs','postgresql-graph-code-recovery.mjs','postgresql-code-restore.mjs','postgresql-completed-restore.mjs','postgresql-original-config-validation.mjs','postgresql-reviewed-graph-recovery.mjs','postgresql-restore-service-context.mjs','postgresql-graph-restore-journal.mjs','postgresql-reviewed-graph-restore.mjs','postgresql-graph-restore-review.mjs','postgresql-graph-swap.mjs','postgresql-graph-restore-stages.mjs','postgresql-graph-restore-snapshot.mjs','postgresql-archive-candidate.mjs','postgresql-config-validation.mjs'];
 const sourceSha256:Record<string,string>={};for(const name of sourceFiles){const file=path.join('lib',name.replace(/\.mjs$/,'.ts'));sourceSha256[file]=createHash('sha256').update(await readFile(file)).digest('hex');}
 const record={status:'PASS',scope:'private-fixture-multifile-native-restore',version,binaries,sourceSha256,checks,namespaceUid:uid,namespaceGid:gid,nativeConfigurationValidation:true,realServiceActivation:false,serviceCallbacks:'fixture-only',rootHelperInvoked:false,operatingConfigurationChanged:false,operatingServiceChanged:false,operationalResourcesVerified:false};
 const evidence=path.join(verificationWorkRoot,'postgresql-graph-restore-host-'+new Date().toISOString().replaceAll(':','-')+'.json');
 await mkdir(path.dirname(evidence),{recursive:true,mode:0o700});await writeFile(evidence,JSON.stringify(record,null,2)+'\n',{mode:0o600,flag:'wx'});console.log(JSON.stringify({...record,evidence}));
}finally{await rm(workspace,{recursive:true,force:true});}
