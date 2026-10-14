import type {ChildProcess} from 'node:child_process';
import type {FileHandle} from 'node:fs/promises';
import type {PostgresqlGraphArchive} from '../lib/postgresql-graph-archive.ts';
import type {RestoreJournal} from '../lib/postgresql-graph-restore-journal.ts';
import {jsonRecord,recordField,listField,textField} from './verification/http-json.ts';
import {hasErrorCode} from '../lib/error-code.ts';
import {postgresqlCodeRecoveryPlan,recoverPostgresqlCode} from '../lib/postgresql-code-recovery.ts';
// Private namespace fixture only. Never used by the application or root helper.
import assert from 'node:assert/strict';
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {open,writeFile,readFile,readdir,lstat,mkdir,rm,readlink} from 'node:fs/promises';
import {createConnection} from 'node:net';
import {randomUUID} from 'node:crypto';
import {postgresqlConfigGraph,assertPostgresqlConfigGraph} from '../lib/postgresql-config-graph.ts';
import {postgresqlCodeOperationPlan,applyPostgresqlCodeOperation} from '../lib/postgresql-code-operation.ts';
import {postgresqlCodeRestorePlan,restorePostgresqlCode} from '../lib/postgresql-code-restore.ts';
import {reviewPostgresqlGraphRestore,createReviewedPostgresqlGraphRestoreJournal} from '../lib/postgresql-graph-restore-review.ts';
import {applyReviewedPostgresqlGraphRestore} from '../lib/postgresql-reviewed-graph-restore.ts';
import {preparePostgresqlGraphRestoreStages,cancelPostgresqlGraphRestoreStages,inspectPostgresqlGraphRestoreStages} from '../lib/postgresql-graph-restore-stages.ts';
import {readPostgresqlGraphSwapProgress} from '../lib/postgresql-graph-swap-progress.ts';
import {recoverPostgresqlGraphSwap} from '../lib/postgresql-graph-swap-recovery.ts';
import {completePostgresqlGraphRestore} from '../lib/postgresql-completed-restore.ts';
import {createPostgresqlRestoreUndoBackup} from '../lib/postgresql-restore-undo-backup.ts';
import {createPostgresqlGraphArchive,readPostgresqlGraphArchive} from '../lib/postgresql-graph-archive.ts';
import {publishPostgresqlRestoreBackup} from '../lib/postgresql-restore-undo-backup.ts';
import {readPostgresqlGraphRestoreJournal,clearPostgresqlGraphRestoreJournal} from '../lib/postgresql-graph-restore-journal.ts';
import {postgresqlServiceScope} from '../lib/postgresql-code-operation.ts';
import {readConfigJournal} from '../lib/config-journal.ts';
import {createHash} from 'node:crypto';
import {userInfo} from 'node:os';
import {inspectPostgresqlHbaService,inspectPostgresqlHbaIdentity} from '../lib/postgresql-hba-service.ts';
import {inspectPostgresqlConfigService,postgresqlAutoConfigVersion} from '../lib/postgresql-config-service.ts';
const exec=promisify(execFile),major=Number(process.argv[2]),uid=process.getuid?.(),gid=process.getgid?.();assert(typeof uid==='number'&&typeof gid==='number');
assert(Number.isInteger(major)&&major>=15&&major<=99);assert.notEqual(uid,0);
const binary='/usr/lib/postgresql/'+major+'/bin/postgres',psql='/usr/lib/postgresql/'+major+'/bin/psql';
const data='/var/lib/postgresql/'+major+'/fixture',config='/etc/postgresql/'+major+'/fixture/postgresql.conf',hba='/etc/postgresql/'+major+'/fixture/pg_hba.conf',socket='/run/postgresql/fixture';
const env={NODE_ENV:'test' as const,PATH:'/usr/bin:/bin',HOME:'/mnt/data/build/tastedev-linux',TMPDIR:'/mnt/data/build/tastedev-linux',TMP:'/mnt/data/build/tastedev-linux',TEMP:'/mnt/data/build/tastedev-linux',LANG:'C',LC_ALL:'C',PGPASSFILE:'/dev/null',PGSERVICEFILE:'/dev/null',PGCONNECT_TIMEOUT:'2'};
const namespace=jsonRecord(JSON.parse(await readFile('/mnt/data/build/tastedev-linux/app/namespace.json','utf8')));assert.equal(namespace.major,major);assert.equal(namespace.uid,uid);assert.equal(namespace.gid,gid);for(const [field,name] of [['pidNamespace','pid'],['networkNamespace','net']] as const){const original=textField(namespace,field);assert.match(original,/^(pid|net):\[[0-9]+\]$/);assert.notEqual(await readlink('/proc/self/ns/'+name),original,'Private namespaces required before fixture writes');}
const binaryHashes=jsonRecord(JSON.parse(await readFile('/mnt/data/build/tastedev-linux/app/binaries.json','utf8')));
const verified=new Set<string>();
async function attest(){for(const [file,digest] of Object.entries(binaryHashes))assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),digest);}
await attest();for(const file of Object.keys(binaryHashes))verified.add(file);
let child:ChildProcess|null=null,exited:Promise<{code:number|null;signal:NodeJS.Signals|null}>|undefined,log:FileHandle|undefined;const checks:string[]=[];
function processChild(){assert(child);return child;}
const hbaText='local all postgres peer map=fixture\nlocal all all reject\n';
const main="data_directory='"+data+"'\nhba_file='"+hba+"'\nident_file='/etc/postgresql/"+major+"/fixture/pg_ident.conf'\nlisten_addresses=''\nunix_socket_directories='"+socket+"'\nport=55432\nmax_connections=20\nshared_buffers='16MB'\nwork_mem='4MB'\nlogging_collector=off\ninclude_dir 'conf.d'\n";
async function sql(command:string,{username='postgres',extra={}}:{username?:string;extra?:Record<string,string>}={}){return exec(psql,['--no-psqlrc','--no-password','--host='+socket,'--port=55432','--username='+username,'--dbname=postgres','--tuples-only','--no-align','--set=ON_ERROR_STOP=1','--command='+command],{encoding:'utf8',timeout:10000,maxBuffer:16384,env:{...env,...extra}});}
async function ready(){const until=Date.now()+10000;while(Date.now()<until){if(processChild().exitCode!==null)throw Error('Private PostgreSQL exited');try{await sql('SELECT 1');return;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}throw Error('Private PostgreSQL readiness timeout');}
async function start(){assert(log);child=spawn(binary,['-D',data,'-c','config_file='+config],{env,stdio:['ignore',log.fd,log.fd],detached:true});exited=new Promise((resolve,reject)=>{assert(child);child.once('exit',(code,signal)=>resolve({code,signal}));child.once('error',reject);});await ready();}
async function stop(){if(child&&processChild().exitCode===null){processChild().kill('SIGTERM');await exited;}child=null;}
const manager=()=>({stdout:'LoadState=loaded\nActiveState=active\nMainPID='+processChild().pid+'\n'});
async function runCommand(file:string,args:string[],extra:Record<string,string>={}){
 if(file==='/usr/bin/systemctl'){assert.deepEqual(args,['--no-ask-password','show','postgresql@'+major+'-fixture.service','--property=LoadState,ActiveState,MainPID','--no-pager']);return manager();}
 assert.equal(file,'/usr/sbin/runuser');assert.deepEqual(args.slice(0,4),['-u','postgres','--',psql]);assert(extra.PGOPTIONS.includes('default_transaction_read_only=on'));assert.equal(extra.PGPASSFILE,'/dev/null');
 return exec(psql,args.slice(4),{encoding:'utf8',timeout:10000,maxBuffer:16384,env:{...env,...extra}});
}
const hooks={runCommand,lookup:async()=>({uid,gid}),verifyExecutable:(file:string)=>assert(verified.has(file))};
const inspect=(path:string)=>inspectPostgresqlHbaService(path,hooks),identity=(service:Record<string,unknown>)=>inspectPostgresqlHbaIdentity(service,hooks);
const inspectConfig=()=>inspectPostgresqlConfigService(config,{ownerUid:uid,inspect,identity,runCommand});
let validationRuns=0,restarts=0;
const rpc=createConnection('/mnt/data/build/tastedev-linux/bridge/validation.sock'),pending=new Map<string,{resolve:(value:Record<string,unknown>)=>void;reject:(error:Error)=>void}>();
await new Promise<void>((resolve,reject)=>{rpc.once('connect',resolve);rpc.once('error',reject);});let incoming='';
rpc.on('data',bytes=>{incoming+=bytes.toString('utf8');assert(incoming.length<1000000);let at;while((at=incoming.indexOf('\n'))>=0){const message=jsonRecord(JSON.parse(incoming.slice(0,at))),id=textField(message,'id');incoming=incoming.slice(at+1);const request=pending.get(id);assert(request);pending.delete(id);message.error?request.reject(Object.assign(Error(textField(message,'error')),{status:400})):request.resolve(recordField(message,'result'));}});
function requestHost(request:Record<string,unknown>){return new Promise<Record<string,unknown>>((resolve,reject)=>{const id=randomUUID();pending.set(id,{resolve,reject});rpc.write(JSON.stringify({id,...request})+'\n');});}
const operation={ownerUid:uid,backupRoot:'/mnt/data/build/tastedev-linux/backups',inspectService:inspectConfig,
 inspectRecovery:async()=>{assert(child&&processChild().exitCode!==null,'Recovery requires actual failed postmaster exit');return {unit:'postgresql@'+major+'-fixture.service',activeState:'failed',controlPid:0};},
 validateArchive:async(archive:PostgresqlGraphArchive)=>{validationRuns++;const reference={id:archive.id,version:createHash('sha256').update(JSON.stringify(archive)).digest('hex'),bytes:Buffer.byteLength(JSON.stringify(archive)),graphVersion:archive.graph.version};const report=await requestHost({type:'validateArchive',target:config,reference});assert.deepEqual(report.files,archive.graph.files);assert.deepEqual(report.directories,archive.graph.directories);assert.deepEqual(report.missing,archive.graph.missing);assert.equal(report.graphVersion,archive.graph.version);return report;},
 validate:async(target:string,text:string)=>{validationRuns++;const graph=await postgresqlConfigGraph(target,{ownerUid:uid,overrides:new Map([[target,text]])}),report=await requestHost({type:'validate',target,text});assert.deepEqual(listField(report,'files').map(row=>[row.path,row.version]),graph.files.map(row=>[row.path,row.version]));assert.deepEqual(report.missing,graph.missing);await assertPostgresqlConfigGraph(graph);return {...report,graphVersion:graph.version};},
 control:async(unit:string,action:'restart')=>{assert.equal(unit,'postgresql@'+major+'-fixture.service');assert.equal(action,'restart');restarts++;await stop();await start();}
};
async function plan(text:string){const original=await readFile(config,'utf8'),input={path:config,version:createHash('sha256').update(original).digest('hex'),text},review=await postgresqlCodeOperationPlan(input,operation);return {...input,graphVersion:review.graphVersion,candidateGraphVersion:review.candidateGraphVersion,serviceVersion:review.serviceVersion,reviewVersion:review.reviewVersion,confirm:true};}

try{
 log=await open('/mnt/data/build/tastedev-linux/evidence/postgres.log','wx',0o600);
 await exec('/usr/lib/postgresql/'+major+'/bin/initdb',['-D',data,'--no-locale','--encoding=UTF8','--auth-local=reject','--auth-host=reject','--username=postgres'],{env,encoding:'utf8',timeout:20000,maxBuffer:65536});
 await mkdir('/etc/postgresql/'+major+'/fixture/conf.d',{mode:0o700});await writeFile('/etc/postgresql/'+major+'/fixture/conf.d/resources.conf','max_locks_per_transaction=32\n',{mode:0o600});
 await writeFile(config,main,{mode:0o600});await writeFile(hba,hbaText,{mode:0o600});await writeFile('/etc/postgresql/'+major+'/fixture/pg_ident.conf','fixture '+userInfo().username+' postgres\n',{mode:0o600});
 await start();
 const service=await inspect(hba);assert.equal(service.identityVerified,true);assert.equal(service.readOnlyQuery,true);assert.equal(service.data,data);assert.equal(service.config,config);assert.equal(service.hba,hba);assert.equal(service.pid,processChild().pid);
 await identity(service);checks.push('real postmaster process, PID file, executable, socket and SQL resource identity; fixture systemd manager');
 const initial=await inspectConfig();assert.equal(initial.configurationErrors,0);assert.deepEqual(initial.values,{port:'55432',max_connections:'20',shared_buffers:'2048',work_mem:'4096',logging_collector:'off'});assert(initial.autoConfiguration.present);checks.push('real readonly SQL reports five runtime values and zero file errors');
 const ro=await sql("SELECT current_setting('transaction_read_only')",{extra:{PGOPTIONS:'-c default_transaction_read_only=on'}});assert.equal(ro.stdout.trim(),'on');
 await assert.rejects(sql("CREATE TABLE forbidden_probe(id int)",{extra:{PGOPTIONS:'-c default_transaction_read_only=on'}}));checks.push('database enforces readonly inspection sessions');
 await assert.rejects(sql('SELECT 1',{username:'fixture_denied'}));checks.push('real Unix socket peer mapping succeeds and rejected role cannot authenticate');
 await sql("ALTER SYSTEM SET work_mem='6MB'");await sql('SELECT pg_reload_conf()');
 let updated;for(let attempt=0;attempt<30;attempt++){updated=await inspectConfig();if(updated.values.work_mem==='6144')break;await new Promise(resolve=>setTimeout(resolve,100));}
 assert(updated);assert.equal(updated.values.work_mem,'6144');assert.notEqual(updated.autoConfiguration.version,initial.autoConfiguration.version);assert.deepEqual(updated.autoConfiguration,await postgresqlAutoConfigVersion(data,uid));checks.push('actual ALTER SYSTEM/reload changes runtime value and auto.conf fingerprint');
 let autoChanged=false;await assert.rejects(inspectPostgresqlConfigService(config,{ownerUid:uid,inspect,identity,runCommand:async(file,args,extra)=>{const output=await runCommand(file,args,extra);if(!autoChanged){autoChanged=true;await sql("ALTER SYSTEM SET work_mem='7MB'");}return output;}}),error=>error!==null&&typeof error==='object'&&'status' in error&&error.status===409);checks.push('auto.conf change during real SQL inspection invalidates the snapshot');
 await writeFile(config,main+"fixture_invalid_setting='probe'\n",{mode:0o600});processChild().kill('SIGHUP');
 let errors;for(let attempt=0;attempt<30;attempt++){errors=await inspectConfig();if(errors.configurationErrors>0)break;await new Promise(resolve=>setTimeout(resolve,100));}assert(errors);assert(errors.configurationErrors>0);checks.push('actual invalid file settings are reported without private native diagnostics');
 await writeFile(config,main,{mode:0o600});processChild().kill('SIGHUP');
 await stop();await start();await assert.rejects(identity(service),error=>error!==null&&typeof error==='object'&&'status' in error&&error.status===409);assert.equal((await inspectConfig()).configurationErrors,0);checks.push('old process identity is rejected after a real private cluster restart');

 // Remove the earlier fixture override before exercising code-driven changes.
 await sql('ALTER SYSTEM RESET work_mem');await sql('SELECT pg_reload_conf()');await stop();await start();
 const original=await readFile(config,'utf8'),changed=original.replace("work_mem='4MB'","work_mem='8MB'");
 const oldPid=processChild().pid,success=await applyPostgresqlCodeOperation(await plan(changed),operation);
 assert.equal(success.changed,true);assert.equal(success.failed,undefined);assert.equal(success.journalCleanupVerified,true);assert.notEqual(processChild().pid,oldPid);
 assert.equal(await readFile(config,'utf8'),changed);assert.equal((await inspectConfig()).values.work_mem,'8192');
 const backup=jsonRecord(JSON.parse(await readFile('/mnt/data/build/tastedev-linux/backups/'+success.backupId+'.json','utf8')));const backupContext=recordField(backup,'context');assert.equal(backup.text,original);assert(backupContext.graphArchive);assert.equal((await lstat('/mnt/data/build/tastedev-linux/backups/'+success.backupId+'.json')).mode&0o777,0o600);
 checks.push('existing code apply performs real native candidate validation, writes private backup and restarts real postmaster with matching values');
 const included='/etc/postgresql/'+major+'/fixture/conf.d/resources.conf';
 await writeFile(included,'max_locks_per_transaction=64\n',{mode:0o600});await stop();await start();
 assert.equal((await sql("SELECT current_setting('max_locks_per_transaction')")).stdout.trim(),'64');
 async function restore(id:unknown){const review=await postgresqlCodeRestorePlan({path:config,id},operation),input={path:review.path,id:review.id,version:review.version,graphVersion:review.graphVersion,candidateGraphVersion:review.candidateGraphVersion,serviceVersion:review.serviceVersion,backupVersion:review.backupVersion,backupIdentity:review.backupIdentity,reviewVersion:review.reviewVersion};return restorePostgresqlCode({...input,confirm:true},operation);}
 const restored=await restore(success.backupId);assert.equal(restored.journalCleanupVerified,true);assert('undoBackupAvailable' in restored);assert.equal(restored.undoBackupAvailable,true);assert.equal(await readFile(config,'utf8'),original);assert.equal(await readFile(included,'utf8'),'max_locks_per_transaction=32\n');assert.equal((await inspectConfig()).values.work_mem,'4096');assert.equal((await sql("SELECT current_setting('max_locks_per_transaction')")).stdout.trim(),'32');
 checks.push('real original graph restore replaces main and included files, restarts actual postmaster and verifies original runtime values');
 const undone=await restore(restored.backupId);assert.equal(undone.journalCleanupVerified,true);assert.equal(await readFile(config,'utf8'),changed);assert.equal(await readFile(included,'utf8'),'max_locks_per_transaction=64\n');assert.equal((await inspectConfig()).values.work_mem,'8192');assert.equal((await sql("SELECT current_setting('max_locks_per_transaction')")).stdout.trim(),'64');
 checks.push('restore-created undo backup restores both included and main configuration and matching actual SQL values');
 await writeFile(included,'max_locks_per_transaction=32\n',{mode:0o600});await stop();await start();

 const invalidMain=changed.replace(socket,'/run/postgresql/fixture-missing').replace("work_mem='8MB'","work_mem='12MB'"),invalidGraph=await postgresqlConfigGraph(config,{ownerUid:uid,overrides:new Map([[config,invalidMain],[included,'max_locks_per_transaction=72\n']])});
 const invalidArchive=await createPostgresqlGraphArchive(invalidGraph,'/mnt/data/build/tastedev-linux/backups'),serviceBeforeFailure=await inspectConfig(),invalidBackup={id:randomUUID(),kind:'postgresql',target:config,text:invalidMain,version:createHash('sha256').update(invalidMain).digest('hex'),createdAt:new Date().toISOString(),context:{version:1,graphVersion:invalidGraph.version,graphArchive:invalidArchive,scope:postgresqlServiceScope(serviceBeforeFailure),values:{...serviceBeforeFailure.values,work_mem:'12288'}}};
 await publishPostgresqlRestoreBackup(invalidBackup,'/mnt/data/build/tastedev-linux/backups',()=>assertPostgresqlConfigGraph(invalidGraph));
 const graphFailureRestarts=restarts;
 await assert.rejects(restore(invalidBackup.id),error=>error!==null&&typeof error==='object'&&'rollbackComplete' in error&&error.rollbackComplete===true&&'retention' in error&&jsonRecord(error.retention).activeIntentCleared===true);
 assert.equal(restarts-graphFailureRestarts,2);assert.equal(await readFile(config,'utf8'),changed);assert.equal(await readFile(included,'utf8'),'max_locks_per_transaction=32\n');assert.equal((await inspectConfig()).values.work_mem,'8192');assert.equal((await sql("SELECT current_setting('max_locks_per_transaction')")).stdout.trim(),'32');assert.equal(await readPostgresqlGraphRestoreJournal(config,'/mnt/data/build/tastedev-linux/backups',{ownerUid:uid}),null);
 checks.push('real multi-file restore startup failure rolls back both sources, restarts original postmaster and retains completed rollback evidence');
 const legacyArchive=await readPostgresqlGraphArchive(backupContext.graphArchive,'/mnt/data/build/tastedev-linux/backups',config),legacyReview=await reviewPostgresqlGraphRestore(legacyArchive,{ownerUid:uid,archiveScope:backupContext.scope,inspectService:inspectConfig,validateArchive:operation.validateArchive}),legacyUndo=await createPostgresqlRestoreUndoBackup(legacyReview,'/mnt/data/build/tastedev-linux/backups');
 const legacy:{journal:RestoreJournal|null}={journal:null};
 await assert.rejects(applyReviewedPostgresqlGraphRestore(legacyReview,'/mnt/data/build/tastedev-linux/backups',{control:async()=>{
  legacy.journal=await readPostgresqlGraphRestoreJournal(config,'/mnt/data/build/tastedev-linux/backups',{ownerUid:uid});assert(legacy.journal);const progressFile='/mnt/data/build/tastedev-linux/backups/graph-stages/'+legacy.journal.record.id+'.swap/progress.json',ledger=jsonRecord(JSON.parse(await readFile(progressFile,'utf8'))),ledgerData=recordField(ledger,'data');
  // Private fixture checkpoint emitted by the previous writer format. Changing
  // the ledger makes the current in-process writer refuse its stale identity.
  ledgerData.format='postgresql-graph-swap-v2';ledger.data=ledgerData;ledger.digest=createHash('sha256').update(JSON.stringify(ledgerData)).digest('hex');await writeFile(progressFile,JSON.stringify(ledger));throw Error('Fixture legacy writer checkpoint');
 },inspectRecovery:operation.inspectRecovery}),error=>error!==null&&typeof error==='object'&&'rollbackComplete' in error&&error.rollbackComplete===false);
 assert(legacy.journal&&legacyUndo);assert.equal((await inspectConfig()).values.work_mem,'8192');
 const legacyMetadata=jsonRecord(JSON.parse(await readFile('/mnt/data/build/tastedev-linux/backups/'+legacyUndo.id+'.json','utf8'))),legacyContext=recordField(legacyMetadata,'context'),legacyOriginal=await readPostgresqlGraphArchive(legacyContext.graphArchive,'/mnt/data/build/tastedev-linux/backups',config),legacyProgress=await readPostgresqlGraphSwapProgress(legacy.journal,'/mnt/data/build/tastedev-linux/backups');assert(legacyProgress);assert.equal(legacyProgress.data.format,'postgresql-graph-swap-v2');
 const legacyRecovered=await recoverPostgresqlGraphSwap(legacyProgress,{validate:async()=>{const validation=await operation.validateArchive(legacyOriginal);assert.deepEqual(validation.values,legacyContext.values);return true;},reactivate:()=>operation.control('postgresql@'+major+'-fixture.service','restart'),verify:async()=>{assert.deepEqual((await inspectConfig()).values,legacyContext.values);return true;}});
 assert.equal(legacyRecovered.filesystemRecoveryVerified,true);assert.equal(await readFile(config,'utf8'),changed);assert.equal(await readFile(included,'utf8'),'max_locks_per_transaction=32\n');const recoveredProgress=await readPostgresqlGraphSwapProgress(legacy.journal,'/mnt/data/build/tastedev-linux/backups');assert(recoveredProgress);assert.equal(recoveredProgress.data.format,'postgresql-graph-swap-v3');assert.equal((await sql("SELECT current_setting('max_locks_per_transaction')")).stdout.trim(),'32');assert((await completePostgresqlGraphRestore(legacy.journal,'/mnt/data/build/tastedev-linux/backups')).activeIntentCleared);
 checks.push('legacy v2 interrupted multi-file checkpoint upgrades across separate mounts, preserves original sources and restarts actual postmaster with original SQL values');
 async function cancelArchive(archive:PostgresqlGraphArchive,scope:unknown,staged=true){
  const review=await reviewPostgresqlGraphRestore(archive,{ownerUid:uid,archiveScope:scope,inspectService:inspectConfig,validateArchive:operation.validateArchive}),journal=await createReviewedPostgresqlGraphRestoreJournal(review,'/mnt/data/build/tastedev-linux/backups');if(staged)await preparePostgresqlGraphRestoreStages(journal,'/mnt/data/build/tastedev-linux/backups');
  const beforePid=processChild().pid,beforeValues=(await inspectConfig()).values,opts={...operation,autoVersion:postgresqlAutoConfigVersion,inspectRecovery:async()=>{const current=jsonRecord(await inspectConfig());return {unit:current.unit,activeState:'active',controlPid:0,mainPid:current.pid,service:current};},validateOriginal:async()=>requestHost({type:'validateOriginal',target:config}),control:async()=>assert.fail('Public cancellation must not restart')},plan=await postgresqlCodeRecoveryPlan({path:config},opts);assert('kind' in plan&&'phase' in plan);assert.equal(plan.kind,'postgresql-stage-cancellation');assert.equal(plan.phase,staged?'ready':'intent-only');const result=jsonRecord(await recoverPostgresqlCode({path:config,reviewVersion:plan.reviewVersion,confirm:true},opts));assert.equal(result.preparationCancelled,true);assert.equal(result.restored,false);assert.equal(result.serviceRestarted,false);assert.equal(processChild().pid,beforePid);assert.deepEqual((await inspectConfig()).values,beforeValues);await assert.rejects(lstat('/mnt/data/build/tastedev-linux/backups/graph-stages/'+journal.record.id+'.json'),error=>hasErrorCode(error,'ENOENT'));assert.equal(await readPostgresqlGraphRestoreJournal(config,'/mnt/data/build/tastedev-linux/backups',{ownerUid:uid}),null);return result;
 }
 await cancelArchive(legacyArchive,backupContext.scope);assert.equal(await readFile(config,'utf8'),changed);assert.equal(await readFile(included,'utf8'),'max_locks_per_transaction=32\n');
 checks.push('public recovery API core cancels ready main and include candidates across separate mounts with actual isolated original validation and no live file, postmaster PID or SQL changes');
 await cancelArchive(legacyArchive,backupContext.scope,false);checks.push('public recovery API core cancels intent-only preparation with actual isolated original validation and no postmaster restart');
 const createdDirectory='/etc/postgresql/'+major+'/fixture/new.d';await mkdir(createdDirectory,{mode:0o700});await writeFile(createdDirectory+'/settings.conf',"work_mem='12MB'\n",{mode:0o600});await writeFile(config,changed+"include_dir 'new.d'\n",{mode:0o600});
 const newArchiveReference=await createPostgresqlGraphArchive(await postgresqlConfigGraph(config,{ownerUid:uid}),'/mnt/data/build/tastedev-linux/backups');await writeFile(config,changed,{mode:0o600});await rm(createdDirectory,{recursive:true});
 const newArchive=await readPostgresqlGraphArchive(newArchiveReference,'/mnt/data/build/tastedev-linux/backups',config),newCancellation=await cancelArchive(newArchive,postgresqlServiceScope(await inspectConfig()));assert.equal(newCancellation.removedDirectories,1);await assert.rejects(lstat(createdDirectory),error=>hasErrorCode(error,'ENOENT'));assert.equal(await readFile(config,'utf8'),changed);
 checks.push('prepared newly created include directory cancels with candidates across separate mounts while actual original server remains running');



 const failedDraft=changed.replace(socket,'/run/postgresql/fixture-missing'),beforeFailure=restarts;
 const rollback=await applyPostgresqlCodeOperation(await plan(failedDraft),operation);
 assert.equal(rollback.failed,true);assert.equal(rollback.restored,true);assert.equal(rollback.recovered,true);assert.equal(rollback.journalCleanupVerified,true);assert.equal(restarts-beforeFailure,2);
 assert.equal(await readFile(config,'utf8'),changed);assert.equal((await inspectConfig()).values.work_mem,'8192');assert.equal(await readConfigJournal(config,'/mnt/data/build/tastedev-linux/backups'),null);
 checks.push('real startup failure from a missing socket directory restores original bytes and restarts the real original cluster');
 const stale=await plan(changed.replace("work_mem='8MB'","work_mem='9MB'")),beforeStale=restarts,backupCount=(await readdir('/mnt/data/build/tastedev-linux/backups')).length;
 await stop();await start();await assert.rejects(applyPostgresqlCodeOperation(stale,operation),error=>error!==null&&typeof error==='object'&&'status' in error&&error.status===409);
 assert.equal(restarts,beforeStale);assert.equal((await readdir('/mnt/data/build/tastedev-linux/backups')).length,backupCount);assert.equal(await readFile(config,'utf8'),changed);
 checks.push('actual postmaster restart invalidates an old apply review before backup or file changes');
 const external=changed.replace("work_mem='8MB'","work_mem='11MB'")+"# concurrent fixture edit\n";
 const concurrent=await applyPostgresqlCodeOperation(await plan(changed.replace("work_mem='8MB'","work_mem='10MB'")),{...operation,control:async(unit:string,action:'restart')=>{await operation.control(unit,action);await writeFile(config,external,{mode:0o600});throw Error('Fixture concurrent writer');}});
 assert.equal(concurrent.failed,true);assert.equal(concurrent.restored,false);assert.equal(await readFile(config,'utf8'),external);assert(await readConfigJournal(config,'/mnt/data/build/tastedev-linux/backups'));
 assert.equal((await inspectConfig()).values.work_mem,'10240');
 checks.push('real running candidate and concurrent file edit retain interrupted evidence without overwriting external bytes');
 assert(validationRuns>=7);await attest();
 await stop();
 const record={separatePidNamespaceVerified:true,separateNetworkNamespaceVerified:true,status:'PASS',scope:'private-postmaster-runtime-and-resource-inspection',checks,namespaceUid:uid,namespaceGid:gid,realPostmasterStarted:true,realSQLExecuted:true,realDataDirectoryVerified:true,realHbaAuthenticationVerified:true,realAutoConfigurationVerified:true,realNativeCandidateValidation:true,realCodeApplyVerified:true,realIncludeGraphRestoreVerified:true,realRestoreUndoVerified:true,realGraphStartupFailureRollbackVerified:true,realLegacyCrossMountRecoveryVerified:true,realCrossMountStageCancellationVerified:true,realPublicStageCancellationVerified:true,realPublicIntentCancellationVerified:true,realCreatedDirectoryCancellationVerified:true,realStartupFailureRollbackVerified:true,realStaleApplyReviewRejected:true,realConcurrentEditPreserved:true,systemdManager:'fixture-only',rootHelperInvoked:false,operatingConfigurationChanged:false,operatingServiceChanged:false};
 await writeFile('/mnt/data/build/tastedev-linux/evidence/runtime.json',JSON.stringify(record,null,2)+'\n',{mode:0o600});process.stdout.write(JSON.stringify(record)+'\n');
}finally{await stop();rpc.end();await log?.close();}
