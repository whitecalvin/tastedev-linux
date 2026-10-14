// Authenticated application API -> real coordinator/parser/private cluster.
// Privileged helper and systemd are replaced by explicit trusted fixture hooks.
import type {PostgresqlHbaGraph} from '../../lib/postgresql-hba-graph.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {recordField,listField,textField} from './http-json.ts';
import {diagnostic} from './nginx-native-report.ts';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {postgresqlLocalApi} from './postgresql-local-api.ts';
import {postgresqlHbaOperationPlan,applyPostgresqlHbaOperation,recoverPostgresqlHbaOperation,postgresqlHbaRecoveryStatus} from '../../lib/postgresql-hba-operation.ts';
import {postgresqlHbaBackupRecord} from '../../lib/postgresql-hba-backups.ts';
import {validatePostgresqlHba} from '../../lib/postgresql-hba-validate.ts';
import {preparePostgresqlHbaCandidate,writePostgresqlHbaCandidate} from '../../lib/postgresql-hba-candidate.ts';
import {postgresqlHbaValidationPlan,postgresqlHbaValidationReport} from '../../lib/postgresql-hba-validation.ts';
assert(process.getuid,'Linux identity support required');const uid=process.getuid();assert.notEqual(uid,0);assert.equal(process.argv.length,2);
const exec=promisify(execFile),hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
const root=await verificationWorkDirectory('tastedev-hba-api-'),base=path.join(root,'etc'),cluster=path.join(base,'postgresql/18/fixture'),file=path.join(cluster,'pg_hba.conf'),data=path.join(root,'data'),socket=path.join(root,'socket');
const target='/etc/postgresql/18/fixture/pg_hba.conf',original='# 한국어 원본\nlocal all all trust\n',draft=original+'host all all 127.0.0.1/32 scram-sha-256\n',bin='/usr/lib/postgresql/18/bin';
const checks:string[]=[];let started=false,bridge:Awaited<ReturnType<typeof postgresqlLocalApi>>|undefined,result:Record<string,unknown>={status:'FAIL',checks},phase='initialize',failReloadOnce=false;
async function run(program:string,args:readonly string[],stdin?:string){const pending=exec(path.join(bin,program),args,{timeout:20000,maxBuffer:1048576,env:{NODE_ENV:'test',PATH:'/usr/bin:/bin',LANG:'C.UTF-8',TMPDIR:verificationWorkRoot,TMP:verificationWorkRoot,TEMP:verificationWorkRoot},cwd:'/'});assert(pending.child.stdin);pending.child.stdin.end(stdin??'');return (await pending).stdout.trim();}
const sql=(statement:string)=>run('psql',['--no-psqlrc','--no-password','--host='+socket,'--username=fixture','--dbname=postgres','--tuples-only','--no-align','--set=ON_ERROR_STOP=1','--command='+statement]);
async function candidate(graph:PostgresqlHbaGraph,sources:Map<string,string>,major:number){
 const privateRoot=await verificationWorkDirectory('linux-pg-hba-');
 try{const copy=await writePostgresqlHbaCandidate(preparePostgresqlHbaCandidate(graph,sources,privateRoot)),plan=postgresqlHbaValidationPlan(privateRoot,major);await run('initdb',plan.init.args);await run('postgres',plan.inspect.args,plan.inspect.stdin);return postgresqlHbaValidationReport(await readFile(plan.report,'utf8'),{major,files:copy.files});}
 finally{await rm(privateRoot,{recursive:true,force:true});}
}
async function inspectService(requested:unknown){
 assert.equal(requested,target);assert.equal(await sql('SHOW hba_file'),file);
 const record=(await readFile(path.join(data,'postmaster.pid'),'utf8')).split('\n'),pid=Number(record[0]);process.kill(pid,0);
 const proc=await readFile('/proc/'+pid+'/stat','utf8'),start=proc.slice(proc.lastIndexOf(')')+2).split(/\s+/)[19];
 return {hba:target,pid,start,data,started:Number(record[2]),port:Number(record[3]),socket,unit:'private-pg-ctl-fixture',identityVerified:true,settingsSource:'running-server'};
}
const options={base,ownerUid:uid,backupUid:uid,root:path.join(root,'backups'),runCandidate:candidate,inspectService,
 inspectIdentity:async(service:unknown)=>assert.deepEqual(await inspectService(target),service),
 reload:async(service:unknown)=>{
  assert.deepEqual(await inspectService(target),service);if(failReloadOnce){failReloadOnce=false;throw Error('injected reload failure');}
  const before=await sql('SELECT pg_conf_load_time()::text');await run('pg_ctl',['-D',data,'reload']);
  for(let count=0;;count++){if(await sql('SELECT pg_conf_load_time()::text')!==before)break;assert(count<100,'Reload acceptance timeout');await new Promise(resolve=>setTimeout(resolve,20));}
  assert.equal(await sql('SELECT value FROM tastedev_fixture'),'한글 데이터 보존');return {reloadRequested:true,reloadAcceptanceVerified:true};
 }};
async function dispatch(action:string,input:unknown){
 if(action==='postgresql-hba-operation-plan')return postgresqlHbaOperationPlan(input,options);
 if(action==='postgresql-hba-operation')return applyPostgresqlHbaOperation(input,options);
 if(action==='postgresql-hba-recovery-status')return postgresqlHbaRecoveryStatus(input,options);
 if(action==='postgresql-hba-recover')return recoverPostgresqlHbaOperation(input,options);
 if(action==='postgresql-hba-validate')return validatePostgresqlHba(input,options);
 throw Error('Unexpected fixture action');
}
try{
 await mkdir(cluster,{recursive:true,mode:0o700});await mkdir(socket,{mode:0o700});await mkdir(options.root,{mode:0o700});await writeFile(file,original,{mode:0o600});
 const version=await run('postgres',['--version']),binarySha256=hash(await readFile(path.join(bin,'postgres')));
 await run('initdb',['-D',data,'--username=fixture','--no-locale','--encoding=UTF8','--auth-local=trust','--auth-host=reject','--no-sync']);
 await run('pg_ctl',['-D',data,'-l',path.join(root,'postgres.log'),'-w','start','-o','-c hba_file='+file+' -c listen_addresses= -c unix_socket_directories='+socket+' -c shared_buffers=16MB']);started=true;
 await sql("CREATE TABLE tastedev_fixture(value text); INSERT INTO tastedev_fixture VALUES ('한글 데이터 보존');");
 bridge=await postgresqlLocalApi(root,dispatch);
 const request={path:target,version:hash(original),text:draft};
 phase='access checks';
 assert.equal((await bridge.post('postgresql-hba-operation-plan',request,{Cookie:''})).status,401);
 assert.equal((await bridge.post('postgresql-hba-operation-plan',request,{Origin:'https://untrusted.example'})).status,403);
 bridge.policy.readOnly=true;await bridge.savePolicy();assert.equal((await bridge.post('postgresql-hba-operation-plan',request)).status,403);
 bridge.policy.readOnly=false;bridge.policy.databaseChanges=false;await bridge.savePolicy();assert.equal((await bridge.post('postgresql-hba-operation-plan',request)).status,403);
 bridge.policy.databaseChanges=true;bridge.policy.sudoWithoutPrompt=false;await bridge.savePolicy();assert.equal((await bridge.post('postgresql-hba-operation-plan',request)).status,403);
 bridge.policy.sudoWithoutPrompt=true;await bridge.savePolicy();assert.equal(bridge.helperCalls.length,0);assert.equal(await readFile(file,'utf8'),original);
 checks.push('Better Auth, origin and three security gates reject before privileged dispatch or source changes');
 phase='review';const status=await bridge.get('postgresql-hba-recovery-status?path='+encodeURIComponent(target));assert.equal(status.status,200);assert.equal(status.data.recoveryRequired,false);
 const plan=await bridge.execute('postgresql-hba-operation-plan',request);assert.equal(recordField(plan,'validation').engine,'postgresql-hba-file-rules');assert.equal(await readFile(file,'utf8'),original);
 checks.push('authenticated GET recovery status and POST plan use real native HBA parser without source replacement');
 phase='rejected commits';const commit={...request,confirm:true,reviewVersion:plan.reviewVersion};
 assert.equal((await bridge.post('postgresql-hba-operation',{...commit,confirm:false})).status,400);
 assert.equal((await bridge.post('postgresql-hba-operation',{...commit,text:draft+'# 검토 후 변경\n'})).status,409);assert.equal(await readFile(file,'utf8'),original);
 checks.push('unconfirmed or edited-after-review HTTP commit preserves original');
 phase='apply';const applied=await bridge.execute('postgresql-hba-operation',commit);assert.equal(applied.changed,true);assert.equal(applied.journalCleanupVerified,true);assert.equal(await readFile(file,'utf8'),draft);assert.equal((await postgresqlHbaBackupRecord(applied.backupId,options)).text,original);
 checks.push('HTTP apply replaces private file, performs accepted native reload and stores original backup');
 phase='restore';const restore={path:target,version:applied.version,backupId:applied.backupId},restorePlan=await bridge.execute('postgresql-hba-operation-plan',restore);
 const restored=await bridge.execute('postgresql-hba-operation',{...restore,confirm:true,reviewVersion:restorePlan.reviewVersion});assert.equal(restored.changed,true);assert.equal(await readFile(file,'utf8'),original);assert.equal((await postgresqlHbaBackupRecord(restored.backupId,options)).text,draft);
 checks.push('HTTP backup restore replaces private file, reloads cluster and retains undo backup');
 phase='invalid draft';const invalid=await bridge.post('postgresql-hba-validate',{...request,text:'local all all nonexistent_method\n'});assert.equal(invalid.status,200);assert.equal(invalid.data.valid,false);assert.equal(listField(invalid.data,'diagnostics')[0].category,'invalid-method');assert.equal(await readFile(file,'utf8'),original);
 checks.push('HTTP native invalid-method diagnostic leaves original intact');
 phase='rollback';const failurePlan=await bridge.execute('postgresql-hba-operation-plan',request);failReloadOnce=true;
 const rolledBack=await bridge.execute('postgresql-hba-operation',{...request,confirm:true,reviewVersion:failurePlan.reviewVersion});assert.equal(rolledBack.failed,true);assert.equal(rolledBack.restored,true);assert.equal(rolledBack.recovered,true);assert.equal(await readFile(file,'utf8'),original);
 assert.equal((await bridge.get('postgresql-hba-recovery-status?path='+encodeURIComponent(target))).data.recoveryRequired,false);
 checks.push('HTTP injected reload failure rolls back source, performs accepted recovery reload and clears journal');
 phase='audit';const audits=await bridge.audits();assert(audits.some(item=>item.action==='postgresql-hba-operation'&&item.result==='rolled-back'));assert(audits.every(item=>Object.keys(item).sort().join(',')==='action,at,result'));assert.equal(await sql('SELECT value FROM tastedev_fixture'),'한글 데이터 보존');
 checks.push('HTTP audit records rollback without configuration bodies and Korean fixture data is preserved');
 result={status:'PASS',version,binarySha256,checks,httpApiTested:true,betterAuthTested:true,nativeHbaParserTested:true,nativeReloadAcceptanceVerified:true,privateClusterOnly:true,helperFixtureAdapter:true,privilegedHelperTested:false,systemdTested:false,guiTested:false,hostConfigurationChanged:false,reloadFailureInjected:true};
}catch(error){result={status:'FAIL',phase,checks,message:diagnostic(error)};process.exitCode=1;}
finally{
 try{await bridge?.close();if(started){await run('pg_ctl',['-D',data,'-m','immediate','-w','stop']);result.privateClusterStopped=true;}await rm(root,{recursive:true,force:true});result.privateFixtureRemoved=true;}
 catch(error){result.status='FAIL';result.cleanupError=diagnostic(error);process.exitCode=1;}
 const evidence=path.join(verificationWorkRoot,'postgresql-hba-api-local-'+new Date().toISOString().replaceAll(':','-')+'.json');await mkdir(path.dirname(evidence),{recursive:true});await writeFile(evidence,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,evidence}));
}
