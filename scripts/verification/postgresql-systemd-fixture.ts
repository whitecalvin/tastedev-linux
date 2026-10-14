import type {Stats} from 'node:fs';
// Host execution requires approval for this exact disposable cluster. --plan
// only prints the scope; it neither contacts systemd nor creates files.
import assert from 'node:assert/strict';
import {readFile,writeFile,lstat,realpath,readdir,unlink,rmdir,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
// This verifier is also streamed to Node over stdin, so its small boundary
// helpers stay self-contained rather than importing source-relative modules.
const verificationWorkRoot='/mnt/data/build/tastedev-linux';
function jsonRecord(value:unknown):Record<string,unknown>{assert(value!==null&&typeof value==='object'&&!Array.isArray(value));return Object.fromEntries(Object.entries(value));}
function recordField(value:Record<string,unknown>,key:string){return jsonRecord(value[key]);}
function hasErrorCode(value:unknown,code:string){return value!==null&&typeof value==='object'&&'code' in value&&value.code===code;}
function diagnostic(value:unknown){return value instanceof Error?(value.stack||value.message):String(value);}
const cluster='linuxverify20261008',major=18,port=55432;
const folder='/etc/postgresql/'+major+'/'+cluster,data='/var/lib/postgresql/'+major+'/'+cluster;
const unit='postgresql@'+major+'-'+cluster+'.service',file=folder+'/pg_hba.conf',config=folder+'/postgresql.conf';
const plan={host:'192.168.0.103',cluster,unit,configDirectory:folder,dataDirectory:data,port,tcpListener:false,automaticStartup:false,operations:['create disposable cluster','start only its systemd unit','inspect actual process/runtime identity','native HBA review/apply/backup/restore','reload only this unit','stop and drop only this newly created cluster'],existingClusterChanged:false,installedHelperReplaced:false};
if(process.argv.includes('--daemon-only'))plan.operations=['create disposable cluster','start only its systemd unit','canonical helper rejects unconfirmed control','canonical helper stop/start/restart/reload','verify PID and original Korean data','stop and drop only this newly created cluster'];
if(process.argv[2]==='--plan'){console.log(JSON.stringify(plan,null,2));process.exit(0);}
assert.equal(process.argv[2],'--execute','Use --plan to review scope first');
assert.equal(process.getuid?.(),0);assert.equal(process.env.TASTEDEV_SYSTEMD_VERIFY_CONFIRM,cluster);
const runtime=process.argv[3];assert(typeof runtime==='string');assert(/^\/mnt\/data\/build\/tastedev-linux\/postgresql-host-jail\/tastedev-linux-host-jail-[a-zA-Z0-9_-]+\/admin\/runtime$/.test(runtime));
assert.equal(await realpath(runtime),runtime);
for(let cursor=runtime;cursor!=='/mnt/data/build';cursor=path.dirname(cursor)){const stat=await lstat(cursor);assert(stat.isDirectory()&&!stat.isSymbolicLink()&&stat.uid===0&&!(stat.mode&0o022));}
const hash=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex');
const manifest=jsonRecord(JSON.parse(await readFile(runtime+'/manifest.json','utf8')));
for(const [name,digest] of Object.entries(manifest)){assert(/^[a-z0-9-]+\.mjs$/.test(name));const stat=await lstat(runtime+'/'+name);assert(stat.isFile()&&!stat.isSymbolicLink()&&stat.uid===0&&!(stat.mode&0o022));assert.equal(hash(await readFile(runtime+'/'+name)),digest);}
type RuntimeModules={'redis-validation-binary.mjs':typeof import('../../lib/redis-validation-binary.ts');'postgresql-hba-operation.mjs':typeof import('../../lib/postgresql-hba-operation.ts');'postgresql-hba-backups.mjs':typeof import('../../lib/postgresql-hba-backups.ts');'postgresql-hba-service.mjs':typeof import('../../lib/postgresql-hba-service.ts');'postgresql-config-inspect.mjs':typeof import('../../lib/postgresql-config-inspect.ts');'postgresql-config-validation.mjs':typeof import('../../lib/postgresql-config-validation.ts');};
async function load<K extends keyof RuntimeModules>(name:K):Promise<RuntimeModules[K]>{assert(Object.hasOwn(manifest,name));const selected:RuntimeModules[K]=await import(pathToFileURL(runtime+'/'+name).href);return selected;}
const {redisValidationBinary}=await load('redis-validation-binary.mjs');
const {postgresqlHbaOperationPlan,applyPostgresqlHbaOperation,recoverPostgresqlHbaOperation,postgresqlHbaRecoveryStatus}=await load('postgresql-hba-operation.mjs');
const {postgresqlHbaBackupRecord}=await load('postgresql-hba-backups.mjs');
const {inspectPostgresqlHbaService,postgresqlHbaServiceHooks}=await load('postgresql-hba-service.mjs');
function command(binary:string,args:readonly string[]){redisValidationBinary({binary});const result=spawnSync(binary,args,{encoding:'utf8',timeout:60000,maxBuffer:65536,env:{NODE_ENV:'test',PATH:'/usr/bin:/usr/sbin:/bin',LANG:'C.UTF-8',LC_ALL:'C.UTF-8',HOME:'/',TMPDIR:verificationWorkRoot,TMP:verificationWorkRoot,TEMP:verificationWorkRoot}});assert.equal(result.status,0,result.stderr);return result.stdout.trim();}
function sql(query:string){return command('/usr/sbin/runuser',['-u','postgres','--','/usr/lib/postgresql/18/bin/psql','--no-psqlrc','--no-password','--host=/run/postgresql','--port='+port,'--username=postgres','--dbname=postgres','--tuples-only','--no-align','--set=ON_ERROR_STOP=1','--command='+query]);}
const helperState=path.dirname(runtime)+'/helper-state';
function helper(action:string,input:unknown,expected=0){
 const wrapper=`import os,subprocess,sys
stage,state,action=sys.argv[1:]
subprocess.run(['/usr/bin/mount','--make-rprivate','/'],check=True)
subprocess.run(['/usr/bin/mount','--bind',stage,'/usr/lib/tastedev-linux/scripts/admin'],check=True)
saved=stage+'/host-postgresql'
os.makedirs(saved,exist_ok=True)
subprocess.run(['/usr/bin/mount','--bind','/var/lib/postgresql',saved],check=True)
subprocess.run(['/usr/bin/mount','-t','tmpfs','-o','mode=755','tmpfs','/var/lib'],check=True)
os.mkdir('/var/lib/linux',0o700)
os.mkdir('/var/lib/postgresql',0o755)
subprocess.run(['/usr/bin/mount','--bind',saved,'/var/lib/postgresql'],check=True)
subprocess.run(['/usr/bin/mount','--bind',state,'/var/lib/linux'],check=True)
os.execv('/usr/bin/node',['/usr/bin/node','/usr/lib/tastedev-linux/scripts/admin/linux-admin',action])
`;
 const value=spawnSync('/usr/bin/unshare',['--mount','--','/usr/bin/python3','-c',wrapper,path.dirname(runtime),helperState,action],{input:JSON.stringify(input),encoding:'utf8',timeout:90000,maxBuffer:65536,env:{NODE_ENV:'test',PATH:'/usr/bin:/usr/sbin:/bin',LANG:'C.UTF-8',LC_ALL:'C.UTF-8',HOME:'/',TMPDIR:verificationWorkRoot,TMP:verificationWorkRoot,TEMP:verificationWorkRoot}});
 assert.equal(value.status,expected,value.stderr);return jsonRecord(JSON.parse(expected===0?value.stdout:value.stderr));
}
async function absent(target:string){await assert.rejects(lstat(target),error=>hasErrorCode(error,'ENOENT'));}
const marker=folder+'/.tastedev-verification',markerText='owned disposable systemd fixture '+cluster+'\n';
let createAttempted=false,created=false,started=false,folderIdentity:Stats|undefined,dataIdentity:Stats|undefined,configHash:string|undefined,result:Record<string,unknown>={status:'FAIL'},codeEvidence:Record<string,unknown>|undefined;const fixtureUndoFiles:{target:string;dev:number;ino:number;sha256:string}[]=[];
const checks:string[]=[];
try{
 await absent(folder);await absent(data);await absent('/var/log/postgresql/postgresql-18-'+cluster+'.log');await absent('/run/postgresql/.s.PGSQL.'+port);
 createAttempted=true;command('/usr/bin/pg_createcluster',['--port',String(port),'--start-conf','manual','--pgoption','ssl=off',String(major),cluster,'--','--auth-local=peer','--auth-host=scram-sha-256']);
 created=true;folderIdentity=await lstat(folder);dataIdentity=await lstat(data);const initialConfig=await readFile(config,'utf8');await writeFile(config,initialConfig+"\n# disposable fixture: Unix socket only\nlisten_addresses = ''\n");configHash=hash(await readFile(config));
 await writeFile(marker,markerText,{flag:'wx',mode:0o600});
 command('/usr/bin/systemctl',['--no-ask-password','start',unit]);started=true;
 const identity=await inspectPostgresqlHbaService(file);assert.equal(identity.unit,unit);assert.equal(identity.data,data);assert.equal(identity.port,port);assert.equal(identity.readOnlyQuery,true);
 assert.equal(sql('SHOW listen_addresses'),'');checks.push('actual systemd/process/configuration identity and no TCP listener');
 sql("CREATE TABLE tastedev_fixture(value text); INSERT INTO tastedev_fixture VALUES ('한글 데이터 보존');");
 const original=await readFile(file,'utf8'),draft=original+'\n# 한국어 systemd 연동 검수\n';
 const hooks=postgresqlHbaServiceHooks();const options={...hooks,root:path.dirname(runtime)+'/verification-backups'};
 const request={path:file,version:hash(original),text:draft};
 if(process.argv.includes('--daemon-only')){
  await mkdir(helperState,{mode:0o700});
  const control=(action:string)=>helper('service',{unit,path:config,action,confirm:true});
  const pid=()=>Number(command('/usr/bin/systemctl',['show',unit,'--property=MainPID','--value']));
  const beforePid=pid();assert(beforePid>0);
  const rejected=helper('service',{unit,path:config,action:'stop',confirm:false},1);assert.equal(rejected.status,400);assert.equal(pid(),beforePid);
  checks.push('canonical daemon helper rejects unconfirmed control before changing the dedicated process');
  assert.equal(control('stop').changed,true);assert.equal(pid(),0);
  assert.equal(control('start').changed,true);const startPid=pid();assert(startPid>0);assert.equal(sql('SELECT value FROM tastedev_fixture'),'한글 데이터 보존');
  assert.equal(control('restart').changed,true);const restartPid=pid();assert(restartPid>0&&restartPid!==startPid);
  assert.equal(control('reload').changed,true);assert.equal(pid(),restartPid);assert.equal(sql('SELECT value FROM tastedev_fixture'),'한글 데이터 보존');
  assert.equal(hash(await readFile(config)),configHash);assert.equal(await readFile(file,'utf8'),original);
  checks.push('canonical daemon stop/start/restart/reload changes actual systemd state with restart PID change and reload PID preservation');
  checks.push('daemon controls preserve original settings, HBA bytes and Korean database content');
 }else if(process.argv.includes('--code-only')){
  await mkdir(helperState,{mode:0o700});
  const originalCode=await readFile(config,'utf8'),oldWorkMem=sql('SHOW work_mem'),oldPid=sql('SELECT pg_postmaster_start_time()::text');
  const candidateCode=originalCode+"\n# Korean full configuration acceptance\nwork_mem = '8MB'\n";
  const codeRequest={path:config,version:hash(originalCode),text:candidateCode};
  let codePlan:Record<string,unknown>;try{codePlan=helper('postgresql-code-plan',codeRequest);}catch(error){
   const {inspectPostgresqlConfiguration}=await load('postgresql-config-inspect.mjs'),{inspectPostgresqlConfigCandidate}=await load('postgresql-config-validation.mjs');
   const uid=Number(command('/usr/bin/id',['-u','postgres']));let nativeDiagnostic:Record<string,unknown>|undefined;
   try{await inspectPostgresqlConfiguration(config,{ownerUid:uid,overrides:new Map([[config,candidateCode]]),validate:candidate=>inspectPostgresqlConfigCandidate(candidate,{execute:(binary,args,opts)=>{const value=spawnSync(binary,args,opts);if(value.status!==0){nativeDiagnostic={exitCode:value.status,signal:value.signal,stage:args.at(-1),namespaceErrors:String(value.stderr??'').split('\n').filter(line=>line.startsWith('bwrap:')).map(line=>line.slice(0,400))};throw Error('execution failure');}return value.stdout;}})});}catch{}
   throw Error(JSON.stringify({helperPlanFailed:true,diagnostic:nativeDiagnostic}));
  }assert.equal(recordField(codePlan,'validation').valid,true);assert.equal(await readFile(config,'utf8'),originalCode);
  const appliedCode=helper('postgresql-code-apply',{...codeRequest,...Object.fromEntries(['graphVersion','candidateGraphVersion','serviceVersion','reviewVersion'].map(key=>[key,codePlan[key]])),confirm:true});
  assert.equal(appliedCode.failed,undefined);assert.equal(appliedCode.changed,true);assert.equal(await readFile(config,'utf8'),candidateCode);assert.equal(sql('SHOW work_mem'),'8MB');assert.notEqual(sql('SELECT pg_postmaster_start_time()::text'),oldPid);
  checks.push('canonical root helper full configuration plan/apply restarts actual systemd cluster and changes running work_mem');
  const restoreInput={path:config,id:appliedCode.backupId};const codeRestorePlan=helper('postgresql-code-restore-plan',restoreInput);
  const restoredCode=helper('postgresql-code-restore',{...restoreInput,...Object.fromEntries(['version','graphVersion','candidateGraphVersion','serviceVersion','backupVersion','backupIdentity','reviewVersion'].map(key=>[key,codeRestorePlan[key]])),confirm:true});
  assert.equal(restoredCode.failed,undefined);assert.equal(restoredCode.changed,true);assert.equal(await readFile(config,'utf8'),originalCode);assert.equal(sql('SHOW work_mem'),oldWorkMem);assert.equal(sql('SELECT value FROM tastedev_fixture'),'한글 데이터 보존');
  checks.push('canonical helper graph backup restore returns original configuration and running values while preserving Korean data');
  assert.equal(restoredCode.journalCleanupVerified,true);codeEvidence={originalConfigurationHash:hash(originalCode),restoredConfigurationHash:hash(await readFile(config)),runningWorkMemBefore:oldWorkMem,runningWorkMemApplied:'8MB',runningWorkMemRestored:sql('SHOW work_mem'),applyBackupId:appliedCode.backupId,restoreHistoryId:restoredCode.historyId};
  for(const name of await readdir(folder)){if(!/^\.tastedev-pg-undo-[a-f0-9-]{36}$/.test(name))continue;const target=folder+'/'+name,stat=await lstat(target);assert(stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1);assert.equal(await readFile(target,'utf8'),candidateCode);fixtureUndoFiles.push({target,dev:stat.dev,ino:stat.ino,sha256:hash(candidateCode)});}
 }else{
 if(!process.argv.includes('--interruption-only')){
 const reviewed=await postgresqlHbaOperationPlan(request,options);assert.equal(await readFile(file,'utf8'),original);checks.push('native HBA review preserves original');
 const before=sql('SELECT pg_conf_load_time()::text');
 const applied=await applyPostgresqlHbaOperation({...request,confirm:true,reviewVersion:reviewed.reviewVersion},options);
 assert.equal(applied.changed,true);assert.equal(await readFile(file,'utf8'),draft);assert.equal((await postgresqlHbaBackupRecord(applied.backupId,options)).text,original);
 for(let count=0;sql('SELECT pg_conf_load_time()::text')===before;count++){assert(count<50,'reload acceptance timeout');await new Promise(resolve=>setTimeout(resolve,100));}
 checks.push('real systemd reload accepted, configuration replacement and original backup');
 const restore={path:file,version:applied.version,backupId:applied.backupId},restorePlan=await postgresqlHbaOperationPlan(restore,options);
 const restored=await applyPostgresqlHbaOperation({...restore,confirm:true,reviewVersion:restorePlan.reviewVersion},options);assert.equal(restored.changed,true);assert.equal(await readFile(file,'utf8'),original);checks.push('backup restoration through actual systemd reload');
 await assert.rejects(postgresqlHbaOperationPlan({...request,text:'local all all nonexistent_method\n'},options));assert.equal(await readFile(file,'utf8'),original);checks.push('invalid native candidate rejected without replacement');
 assert.equal(sql('SELECT value FROM tastedev_fixture'),'한글 데이터 보존');assert.equal(hash(await readFile(config)),configHash);checks.push('private Korean fixture data and non-HBA configuration preserved');
 await mkdir(helperState,{mode:0o700});
 const helperDraft=original+'\n# canonical helper systemd 검수\n';
 const helperRequest={path:file,version:hash(original),text:helperDraft};
 const firstHelperPlan=helper('postgresql-hba-operation-plan',helperRequest);assert.equal(await readFile(file,'utf8'),original);
 command('/usr/bin/systemctl',['--no-ask-password','stop',unit]);started=false;
 const stoppedError=helper('postgresql-hba-operation',{...helperRequest,confirm:true,reviewVersion:firstHelperPlan.reviewVersion},1);assert.equal(stoppedError.status,409);assert.equal(await readFile(file,'utf8'),original);checks.push('actual stopped systemd service rejects earlier helper confirmation before configuration replacement');
 command('/usr/bin/systemctl',['--no-ask-password','start',unit]);started=true;
 const replacedProcessError=helper('postgresql-hba-operation',{...helperRequest,confirm:true,reviewVersion:firstHelperPlan.reviewVersion},1);assert.equal(replacedProcessError.status,409);assert.equal(await readFile(file,'utf8'),original);checks.push('new actual postmaster identity rejects earlier helper review after service start');
 const helperPlan=helper('postgresql-hba-operation-plan',helperRequest);assert.equal(await readFile(file,'utf8'),original);
 const helperApplied=helper('postgresql-hba-operation',{...helperRequest,confirm:true,reviewVersion:helperPlan.reviewVersion});assert.equal(helperApplied.changed,true);assert.equal(await readFile(file,'utf8'),helperDraft);checks.push('canonical current root helper applies reviewed HBA through actual systemd');
 const helperRestore={path:file,version:helperApplied.version,backupId:helperApplied.backupId};
 const helperRestorePlan=helper('postgresql-hba-operation-plan',helperRestore);
 const helperRestored=helper('postgresql-hba-operation',{...helperRestore,confirm:true,reviewVersion:helperRestorePlan.reviewVersion});assert.equal(helperRestored.changed,true);assert.equal(await readFile(file,'utf8'),original);checks.push('canonical root helper restores its private backup through actual systemd');
 assert.equal(sql('SELECT value FROM tastedev_fixture'),'한글 데이터 보존');assert.equal(sql('SHOW listen_addresses'),'');checks.push('canonical helper workflow preserves Korean data and Unix socket only configuration');
 // Deliberately fail the first reload hook; rollback still uses the actual
 // systemd reload hook and the original postmaster identity.
 let rejectReloadOnce=true;
 const failureOptions={...options,reload:async(service:unknown)=>{if(rejectReloadOnce){rejectReloadOnce=false;throw Error('injected before systemd reload');}return hooks.reload(service);}};
 const failurePlan=await postgresqlHbaOperationPlan(request,failureOptions),rollbackBefore=sql('SELECT pg_conf_load_time()::text');
 const rollback=await applyPostgresqlHbaOperation({...request,confirm:true,reviewVersion:failurePlan.reviewVersion},failureOptions);
 assert.equal(rollback.failed,true);assert.equal(rollback.restored,true);assert.equal(rollback.recovered,true);assert.equal(rollback.journalCleanupVerified,true);assert.equal(await readFile(file,'utf8'),original);
 for(let count=0;sql('SELECT pg_conf_load_time()::text')===rollbackBefore;count++){assert(count<50,'rollback reload acceptance timeout');await new Promise(resolve=>setTimeout(resolve,100));}
 checks.push('injected first reload failure rolls original bytes back through real systemd reload and clears journal');
 }
 // The child exits precisely after replacement/journal persistence, before
 // reload. Only that child is killed; the postmaster remains running.
 const childSource=[
  "import {pathToFileURL} from 'node:url';",
  "const {postgresqlHbaOperationPlan,applyPostgresqlHbaOperation}=await import(pathToFileURL("+JSON.stringify(runtime+'/postgresql-hba-operation.mjs')+"));",
  "const {postgresqlHbaServiceHooks}=await import(pathToFileURL("+JSON.stringify(runtime+'/postgresql-hba-service.mjs')+"));",
  "const request="+JSON.stringify(request)+";",
  "const options={...postgresqlHbaServiceHooks(),root:"+JSON.stringify(options.root)+",reload:async()=>{process.kill(process.pid,'SIGKILL');}};",
  "const review=await postgresqlHbaOperationPlan(request,options);await applyPostgresqlHbaOperation({...request,reviewVersion:review.reviewVersion,confirm:true},options);"
 ].join('\n');
 const interrupted=spawnSync('/usr/bin/node',['--input-type=module'],{input:childSource,encoding:'utf8',timeout:60000,maxBuffer:65536});assert.equal(interrupted.signal,'SIGKILL',interrupted.stderr);
 assert.equal(await readFile(file,'utf8'),draft);assert.equal((await postgresqlHbaRecoveryStatus({path:file},options)).recoveryRequired,true);
 await assert.rejects(postgresqlHbaOperationPlan({path:file,version:hash(draft),text:original},options),error=>error!==null&&typeof error==='object'&&'status' in error&&error.status===409);
 const recoveryBefore=sql('SELECT pg_conf_load_time()::text');
 const recovered=await recoverPostgresqlHbaOperation({path:file,confirm:true},options);
 assert.equal(recovered.recovered,true);assert.equal(recovered.recoveryRequired,false);assert.equal(recovered.journalCleanupVerified,true);assert.equal(await readFile(file,'utf8'),original);
 for(let count=0;sql('SELECT pg_conf_load_time()::text')===recoveryBefore;count++){assert(count<50,'interrupted recovery reload acceptance timeout');await new Promise(resolve=>setTimeout(resolve,100));}
 assert.equal((await postgresqlHbaRecoveryStatus({path:file},options)).recoveryRequired,false);assert.equal(sql('SELECT value FROM tastedev_fixture'),'한글 데이터 보존');
 checks.push('SIGKILL after replacement blocks new review; explicit recovery restores original through real systemd reload and removes journal');
 }
 result={status:'PASS',checks,plan,...(codeEvidence?{codeEvidence}:{}),fixtureMode:process.argv.includes('--daemon-only')?'daemon-only':process.argv.includes('--code-only')?'code-only':process.argv.includes('--interruption-only')?'interruption-only':'full',systemdTested:true,canonicalHelperTested:!process.argv.includes('--interruption-only'),reloadFailureInjected:!process.argv.includes('--daemon-only')&&!process.argv.includes('--interruption-only')&&!process.argv.includes('--code-only'),interruptionSignal:process.argv.includes('--daemon-only')||process.argv.includes('--code-only')?null:'SIGKILL',recoverySystemdTested:!process.argv.includes('--daemon-only')&&!process.argv.includes('--code-only'),helperStateIsolated:true,operatingClusterChanged:false,disposableClusterOnly:true,installedHelperReplaced:false};
}catch(error){result={status:'FAIL',checks,plan,message:diagnostic(error)};}
finally{
 try{
  if(createAttempted&&!created){for(const target of [folder,data])try{await lstat(target);result.cleanupRequired=true;}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}}
  if(created){assert(folderIdentity&&dataIdentity,'Missing owned cluster identities');
   assert.equal(await readFile(marker,'utf8'),markerText);assert.equal(hash(await readFile(config)),configHash);
   for(const [target,expected] of [[folder,folderIdentity],[data,dataIdentity]] as const){const stat=await lstat(target);assert(!stat.isSymbolicLink()&&stat.dev===expected.dev&&stat.ino===expected.ino);}
   if(started){await inspectPostgresqlHbaService(file);command('/usr/bin/systemctl',['--no-ask-password','stop',unit]);result.disposableServiceStopped=true;}
   // Completed graph restores intentionally retain undo evidence. This
   // disposable verifier knows the exact candidate bytes and identity; retain
   // its digest before removing only those fixture-owned files.
   for(const undo of fixtureUndoFiles){const stat=await lstat(undo.target);assert(stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1&&stat.dev===undo.dev&&stat.ino===undo.ino);assert.equal(hash(await readFile(undo.target)),undo.sha256);await unlink(undo.target);}
   if(fixtureUndoFiles.length)result.disposableUndoEvidence=fixtureUndoFiles.map(({sha256})=>({sha256}));
   command('/usr/bin/pg_dropcluster',['--stop',String(major),cluster]);await absent(data);const remaining=await lstat(folder);assert(!remaining.isSymbolicLink()&&remaining.dev===folderIdentity.dev&&remaining.ino===folderIdentity.ino);assert.deepEqual(await readdir(folder),['.tastedev-verification']);assert.equal(await readFile(marker,'utf8'),markerText);await unlink(marker);await rmdir(folder);await absent(folder);result.disposableClusterRemoved=true;
  }
 }catch(error){result.status='FAIL';result.cleanupRequired=true;result.cleanupError=diagnostic(error);}
}
result.disposableClusterCreated=created;console.log(JSON.stringify(result));process.exitCode=result.status==='PASS'?0:1;
