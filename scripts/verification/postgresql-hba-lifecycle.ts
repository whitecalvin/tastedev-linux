// Only the disposable outer namespace: no host DB/config/socket is mounted.
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,chown,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const runtime='/usr/lib/tastedev-linux/scripts/admin/runtime/';
function record(value:unknown):Record<string,unknown>{assert(value!==null&&typeof value==='object'&&!Array.isArray(value));return Object.fromEntries(Object.entries(value));}
assert.equal(process.getuid?.(),0);
const mounts=(await readFile('/proc/self/mountinfo','utf8')).split('\n');for(const target of ['/etc','/var/lib/linux']){const row=mounts.find(line=>line.split(' - ')[0].split(' ')[4]===target);assert(row&&row.split(' - ')[1].startsWith('tmpfs '),'전용 격리 마운트가 필요합니다: '+target);}
const operationModule:unknown=await import(runtime+'postgresql-hba-operation.mjs'),backupModule:unknown=await import(runtime+'postgresql-hba-backups.mjs');
async function invoke(module:unknown,name:string,input:unknown,options:unknown):Promise<Record<string,unknown>>{const fn=record(module)[name];assert(typeof fn==='function','설치 runtime 함수가 없습니다: '+name);const output:unknown=await Reflect.apply(fn,undefined,[input,options]);return record(output);}
const postgresqlHbaOperationPlan=(input:unknown,options:unknown)=>invoke(operationModule,'postgresqlHbaOperationPlan',input,options);
const applyPostgresqlHbaOperation=(input:unknown,options:unknown)=>invoke(operationModule,'applyPostgresqlHbaOperation',input,options);
const recoverPostgresqlHbaOperation=(input:unknown,options:unknown)=>invoke(operationModule,'recoverPostgresqlHbaOperation',input,options);
const postgresqlHbaRecoveryStatus=(input:unknown,options:unknown)=>invoke(operationModule,'postgresqlHbaRecoveryStatus',input,options);
const postgresqlHbaBackupRecord=(input:unknown,options:unknown)=>invoke(backupModule,'postgresqlHbaBackupRecord',input,options);
const bin='/usr/lib/postgresql/18/bin/',file='/etc/postgresql/18/fixture/pg_hba.conf';
const original='# 한국어 접속 규칙\nlocal all all trust\n';
const next='# 변경된 한국어 규칙\nlocal all all trust\nhost all all 127.0.0.1/32 scram-sha-256\n';
const hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
await mkdir('/mnt/data/build/tastedev-linux',{recursive:true,mode:0o700});
const workspace=await mkdtemp('/mnt/data/build/tastedev-linux/tastedev-hba-lifecycle-');
let started=false,result:Record<string,unknown>|undefined,pgUid:number|undefined,pgGid:number|undefined;const checks:string[]=[];
for(const name of ['TMPDIR','TMP','TEMP'])process.env[name]='/mnt/data/build/tastedev-linux';
function run(binary:string,args:string[]){const value=spawnSync(binary,args,{encoding:'utf8',timeout:15000,maxBuffer:65536});assert.equal(value.status,0,value.stderr);return value.stdout.trim();}
function pg(program:string,args:string[]){const value=spawnSync(bin+program,args,{uid:pgUid,gid:pgGid,cwd:'/',env:{PATH:'/usr/bin:/bin',LANG:'C.UTF-8',LC_ALL:'C.UTF-8',NODE_ENV:'test',TMPDIR:workspace,TMP:workspace,TEMP:workspace},encoding:'utf8',timeout:15000,maxBuffer:65536});assert.equal(value.status,0,value.stderr);return value.stdout.trim();}
function sql(query:string){return pg('psql',['--no-psqlrc','--no-password','--host='+workspace+'/socket','--username=postgres','--dbname=postgres','--tuples-only','--no-align','--set=ON_ERROR_STOP=1','--command='+query]);}
try {
 const uid=Number(run('/usr/bin/id',['-u','postgres'])),gid=Number(run('/usr/bin/id',['-g','postgres']));
 assert(Number.isSafeInteger(uid)&&uid>0&&Number.isSafeInteger(gid)&&gid>=0);pgUid=uid;pgGid=gid;
 await chown(workspace,uid,gid);await mkdir(workspace+'/socket',{mode:0o700});await chown(workspace+'/socket',uid,gid);
 await mkdir('/etc/postgresql/18/fixture',{recursive:true,mode:0o755});
 await writeFile(file,original,{mode:0o644});
 pg('initdb',['-D',workspace+'/data','--no-locale','--encoding=UTF8','--auth=trust','--no-sync']);
 pg('pg_ctl',['-D',workspace+'/data','-l',workspace+'/postgres.log','-w','start','-o','-c hba_file='+file+' -c listen_addresses= -c unix_socket_directories='+workspace+'/socket'+' -c shared_buffers=16MB']);started=true;
 sql("CREATE TABLE tastedev_fixture(value text); INSERT INTO tastedev_fixture VALUES ('한글 데이터 보존');");
 async function inspectService(target:unknown){
  assert.equal(target,file);assert.equal(sql('SHOW hba_file'),file);
  const lines=(await readFile(workspace+'/data/postmaster.pid','utf8')).split('\n');const pid=Number(lines[0]);process.kill(pid,0);
  const stat=await readFile('/proc/'+pid+'/stat','utf8');const start=stat.slice(stat.lastIndexOf(')')+2).split(/\s+/)[19];
  return {hba:file,pid,start,data:workspace+'/data',started:Number(lines[2]),port:Number(lines[3]),socket:workspace+'/socket',unit:'private-pg-ctl-fixture',identityVerified:true,settingsSource:'running-server'};
 }
 let failOnce=false;
 const options={ownerUid:uid,backupUid:0,root:'/var/lib/linux/admin/postgresql-hba',inspectService,
  inspectIdentity:async (service:unknown)=>assert.deepEqual(await inspectService(file),service),
  reload:async (service:unknown)=>{assert.deepEqual(await inspectService(file),service);if(failOnce){failOnce=false;throw Error('injected reload failure');}pg('pg_ctl',['-D',workspace+'/data','reload']);assert.equal(sql('SELECT value FROM tastedev_fixture'),'한글 데이터 보존');return {reloadRequested:true};}};
 const request={path:file,version:hash(original),text:next};
 const plan=await postgresqlHbaOperationPlan(request,options);assert.equal(await readFile(file,'utf8'),original);checks.push('native parser review leaves original configuration intact');
 const applied=await applyPostgresqlHbaOperation({...request,confirm:true,reviewVersion:plan.reviewVersion},options);
 assert.equal(applied.changed,true);assert.equal(applied.journalCleanupVerified,true);assert.equal(await readFile(file,'utf8'),next);
 assert.equal((await postgresqlHbaBackupRecord(applied.backupId,options)).text,original);checks.push('actual configuration replacement, native reload and private backup');
 const restore={path:file,version:applied.version,backupId:applied.backupId};
 const restorePlan=await postgresqlHbaOperationPlan(restore,options);
 const restored=await applyPostgresqlHbaOperation({...restore,confirm:true,reviewVersion:restorePlan.reviewVersion},options);
 assert.equal(restored.changed,true);assert.equal(await readFile(file,'utf8'),original);assert.equal((await postgresqlHbaBackupRecord(restored.backupId,options)).text,next);checks.push('backup restore replaces configuration and creates undo backup');
 await assert.rejects(postgresqlHbaOperationPlan({...request,text:'local all all nonexistent_method\n'},options));assert.equal(await readFile(file,'utf8'),original);checks.push('native parser rejects invalid draft before replacement');
 const failurePlan=await postgresqlHbaOperationPlan(request,options);failOnce=true;
 const recovered=await applyPostgresqlHbaOperation({...request,confirm:true,reviewVersion:failurePlan.reviewVersion},options);
 assert.equal(recovered.failed,true);assert.equal(recovered.restored,true);assert.equal(recovered.recovered,true);assert.equal(recovered.journalCleanupVerified,true);assert.equal(await readFile(file,'utf8'),original);checks.push('injected reload failure restores original bytes and performs native recovery reload');
 const interruptedPlan=await postgresqlHbaOperationPlan(request,options);
 const childSource=[
  "import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {spawnSync} from 'node:child_process';",
  'const {applyPostgresqlHbaOperation}=await import('+JSON.stringify(runtime+'postgresql-hba-operation.mjs')+');',
  'const workspace='+JSON.stringify(workspace)+',bin='+JSON.stringify(bin)+',file='+JSON.stringify(file)+',pgUid='+uid+',pgGid='+gid+';',
  pg.toString(),sql.toString(),inspectService.toString(),
  'const options={ownerUid:pgUid,backupUid:0,root:'+JSON.stringify(options.root)+',inspectService,reload:async()=>{process.kill(process.pid,"SIGKILL");}};',
  'await applyPostgresqlHbaOperation('+JSON.stringify({...request,confirm:true,reviewVersion:interruptedPlan.reviewVersion})+',options);',
 ].join('\n');
 const killed=spawnSync('/usr/bin/node',['--input-type=module'],{input:childSource,encoding:'utf8',timeout:40000,maxBuffer:65536});
 assert.equal(killed.signal,'SIGKILL',killed.stderr);
 assert.equal(await readFile(file,'utf8'),next);
 assert.equal((await postgresqlHbaRecoveryStatus({path:file},options)).recoveryRequired,true);
 checks.push('actual SIGKILL after file replacement preserves interrupted transaction journal');
 const afterKill=await recoverPostgresqlHbaOperation({path:file,confirm:true},options);
 assert.equal(afterKill.recovered,true);assert.equal(afterKill.restored,true);assert.equal(afterKill.journalCleanupVerified,true);
 assert.equal(await readFile(file,'utf8'),original);assert.equal((await postgresqlHbaRecoveryStatus({path:file},options)).recoveryRequired,false);
 checks.push('explicit recovery restores original file, native reload and clears interrupted journal');
 assert.equal(sql('SELECT value FROM tastedev_fixture'),'한글 데이터 보존');
 result={status:'PASS',checks,koreanDataPreserved:true,postmasterScope:'private-unix-socket-cluster',serviceHook:'native pg_ctl and read-only runtime SQL; systemd not exercised',reloadFailureInjected:true,hostConfigurationChanged:false,configurationApplied:true,configurationScope:'private-namespace-fixture'};
}catch(error){result={status:'FAIL',checks,message:error instanceof Error?error.message:'HBA 검수 실패'};}
finally{if(started)pg('pg_ctl',['-D',workspace+'/data','-m','immediate','-w','stop']);await rm(workspace,{recursive:true,force:true});}
assert(result);result.privateClusterStarted=started;result.privateClusterStopped=started;result.privateWorkspaceRemoved=true;
console.log(JSON.stringify(result));process.exitCode=result.status==='FAIL'?1:0;
