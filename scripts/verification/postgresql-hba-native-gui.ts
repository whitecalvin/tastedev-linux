import type {ChildProcess} from 'node:child_process';
import type {Server} from 'node:http';
import type {PostgresqlHbaGraph} from '../../lib/postgresql-hba-graph.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {jsonRecord} from './http-json.ts';
import {hasErrorCode} from '../../lib/error-code.ts';
import {diagnostic} from './nginx-native-report.ts';
// Actual GUI -> fixture proxy -> current authenticated API -> native private PG.
// The privileged transport and pg_ctl service hook remain explicit adapters.
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm,cp,copyFile,symlink} from 'node:fs/promises';
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {createServer} from 'node:http';
import {randomBytes} from 'node:crypto';
import {postgresqlLocalApi} from './postgresql-local-api.ts';
import {postgresqlHbaOperationPlan,applyPostgresqlHbaOperation,recoverPostgresqlHbaOperation,postgresqlHbaRecoveryStatus} from '../../lib/postgresql-hba-operation.ts';
import {postgresqlHbaBackupRecord} from '../../lib/postgresql-hba-backups.ts';
import {validatePostgresqlHba} from '../../lib/postgresql-hba-validate.ts';
import {preparePostgresqlHbaCandidate,writePostgresqlHbaCandidate} from '../../lib/postgresql-hba-candidate.ts';
import {postgresqlHbaValidationPlan,postgresqlHbaValidationReport} from '../../lib/postgresql-hba-validation.ts';
const rollback=process.argv[2]==='--reload-failure',interrupted=process.argv[2]==='--interrupted';assert.notEqual(process.getuid?.(),0);assert(process.argv.length===2||(rollback||interrupted)&&process.argv.length===3);
const exec=promisify(execFile),hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
const root=await verificationWorkDirectory('tastedev-hba-native-gui-'),base=path.join(root,'etc'),cluster=path.join(base,'postgresql/18/fixture'),file=path.join(cluster,'pg_hba.conf'),data=path.join(root,'data'),socket=path.join(root,'socket');
const target='/etc/postgresql/18/fixture/pg_hba.conf',original='# 한국어 원본\nlocal all all trust\n',draft=original+'host all all 127.0.0.1/32 scram-sha-256\n',bin='/usr/lib/postgresql/18/bin';
const checks:string[]=[];let started=false,bridge:Awaited<ReturnType<typeof postgresqlLocalApi>>|undefined,result:Record<string,unknown>={status:'FAIL'},phase='initialize',failReloadOnce=rollback,web:ChildProcess|undefined,proxy:Server|undefined,webLog='',gui:Record<string,unknown>|undefined,nativeProof:Record<string,unknown>|undefined;
const project=process.cwd(),ui=path.join(root,'ui'),sourceHashes:Record<string,string>={};
const sources=['components/postgresql-hba-operation.tsx','lib/api.ts','lib/postgresql-hba-operation.ts'];
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
const options={base,ownerUid:process.getuid?.(),backupUid:process.getuid?.(),root:path.join(root,'backups'),runCandidate:candidate,inspectService,
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
 if(interrupted){
  const request={path:target,version:hash(original),text:draft};
  const childFile=path.join(root,'interrupt.mjs');
  const childSource=[
   "import assert from 'node:assert/strict';import {mkdtemp,readFile,rm} from 'node:fs/promises';import {execFile} from 'node:child_process';import {promisify} from 'node:util';import path from 'node:path';",
   "const {postgresqlHbaOperationPlan,applyPostgresqlHbaOperation}=await import("+JSON.stringify(new URL('../../lib/postgresql-hba-operation.ts',import.meta.url).href)+");",
   "const {preparePostgresqlHbaCandidate,writePostgresqlHbaCandidate}=await import("+JSON.stringify(new URL('../../lib/postgresql-hba-candidate.ts',import.meta.url).href)+");",
   "const {postgresqlHbaValidationPlan,postgresqlHbaValidationReport}=await import("+JSON.stringify(new URL('../../lib/postgresql-hba-validation.ts',import.meta.url).href)+");",
   'const exec=promisify(execFile),bin='+JSON.stringify(bin)+',socket='+JSON.stringify(socket)+',file='+JSON.stringify(file)+',data='+JSON.stringify(data)+',target='+JSON.stringify(target)+';',
   'const verificationWorkRoot='+JSON.stringify(verificationWorkRoot)+';const verificationWorkDirectory=prefix=>mkdtemp(path.join(verificationWorkRoot,prefix));',run.toString(),'const sql='+sql.toString()+';',candidate.toString(),inspectService.toString(),
   'const options={base:'+JSON.stringify(base)+',root:'+JSON.stringify(options.root)+',ownerUid:process.getuid?.(),backupUid:process.getuid?.(),runCandidate:candidate,inspectService,reload:async()=>{process.kill(process.pid,"SIGKILL");}};',
   'const request='+JSON.stringify(request)+';const plan=await postgresqlHbaOperationPlan(request,options);await applyPostgresqlHbaOperation({...request,confirm:true,reviewVersion:plan.reviewVersion},options);'
  ].join('\n');
  await writeFile(childFile,childSource,{mode:0o600});
  let killed=false;try{await exec(process.execPath,[childFile],{timeout:30000,maxBuffer:65536});}catch(error){assert(error!==null&&typeof error==='object'&&'signal' in error&&error.signal==='SIGKILL',diagnostic(error));killed=true;}assert(killed);
  assert.equal(await readFile(file,'utf8'),draft);assert.equal((await postgresqlHbaRecoveryStatus({path:target},options)).recoveryRequired,true);
  checks.push('actual apply child SIGKILL after replacement leaves draft and durable journal before GUI recovery');
 }
 bridge=await postgresqlLocalApi(root,dispatch);
 const token=randomBytes(32).toString('hex');
 proxy=createServer(async(req,res)=>{try{
  if(req.headers['x-fixture-token']!==token){res.writeHead(403);res.end();return;}
  const url=new URL(req.url||'/','http://fixture'),action=url.searchParams.get('action');
  const allowed=['postgresql-hba-recovery-status','postgresql-hba-operation-plan','postgresql-hba-operation','postgresql-hba-recover'];
  if(!action||!allowed.includes(action)){res.writeHead(404);res.end();return;}
  const chunks:Buffer[]=[];for await(const chunk of req){chunks.push(chunk);if(chunks.reduce((sum,value)=>sum+value.length,0)>1048576)throw Error('body too large');}
  const body=req.method==='POST'?jsonRecord(JSON.parse(Buffer.concat(chunks).toString('utf8'))):null;
  if(body&&body.path!==target)throw Error('unexpected fixture target');
  assert(bridge);const response=req.method==='GET'?await bridge.get(action+'?path='+encodeURIComponent(target)):await bridge.post(action,body);
  res.writeHead(response.status,{'Content-Type':'application/json'});res.end(JSON.stringify(response.data));
 }catch{res.writeHead(500);res.end(JSON.stringify({error:'임시 검수 연결 오류'}));}});
 const ownedProxy=proxy;await new Promise<void>((resolve,reject)=>{ownedProxy.once('error',reject);ownedProxy.listen(0,'127.0.0.2',resolve);});const proxyAddress=ownedProxy.address();assert(proxyAddress&&typeof proxyAddress==='object');
 const backend='http://127.0.0.2:'+proxyAddress.port;
 for(const name of sources)sourceHashes[name]=hash(await readFile(path.join(project,name)));
 for(const name of ['components','lib','public'])await cp(path.join(project,name),path.join(ui,name),{recursive:true});
 await mkdir(path.join(ui,'app/verify-hba'),{recursive:true});await mkdir(path.join(ui,'app/api/fixture'),{recursive:true});
 for(const name of ['app/layout.tsx','app/globals.css','app/console-design.css','package.json','next.config.mjs','tsconfig.json','next-env.d.ts'])await copyFile(path.join(project,name),path.join(ui,name));
 await symlink(path.join(project,'node_modules'),path.join(ui,'node_modules'),'dir');
 await copyFile(path.join(project,'scripts/fixtures/postgresql-hba-native-proxy.ts'),path.join(ui,'app/api/fixture/route.ts'));
 await copyFile(path.join(project,'scripts/fixtures/postgresql-hba-native-page.tsx'),path.join(ui,'app/verify-hba/client.tsx'));
 await writeFile(path.join(ui,'app/verify-hba/page.tsx'),`import Page from './client';export default function Fixture(){return <Page config={${JSON.stringify({input:{path:target,version:hash(original),text:draft},interrupted})}}/>;}`);
 const portServer=createServer();await new Promise<void>((resolve,reject)=>{portServer.once('error',reject);portServer.listen(0,'127.0.0.2',resolve);});const webAddress=portServer.address();assert(webAddress&&typeof webAddress==='object');const port=webAddress.port;await new Promise<void>(resolve=>portServer.close(()=>resolve()));
 const env:NodeJS.ProcessEnv={...process.env,NODE_ENV:'development',NEXT_TELEMETRY_DISABLED:'1',FIXTURE_BACKEND:backend,FIXTURE_TOKEN:token,FIXTURE_WEB_ORIGIN:'http://127.0.0.2:'+port,LINUX_STATE_ROOT:path.join(root,'ui-state'),LINUX_AUTH_ROOT:path.join(root,'ui-auth'),LINUX_ENABLE_ADMIN:'false',LINUX_ENABLE_TERMINAL:'false',LINUX_ENABLE_INSTALL:'false',LINUX_ENABLE_AI:'false',LINUX_ENABLE_CRON:'false'};delete env.OPENAI_API_KEY;
 web=spawn(process.execPath,[path.join(project,'node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:ui,env:{...env,NODE_ENV:'production'},stdio:['ignore','pipe','pipe']});assert(web.stdout&&web.stderr);web.stdout.on('data',bytes=>webLog+=bytes);web.stderr.on('data',bytes=>webLog+=bytes);console.log(JSON.stringify({status:'BUILDING',root}));assert.equal(await new Promise<number|null>((resolve,reject)=>{assert(web);web.once('error',reject);web.once('close',resolve);}),0,'Typed native GUI build failed');
 web=spawn(process.execPath,[path.join(project,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.2','--port',String(port)],{cwd:ui,env:{...env,NODE_ENV:'production'},detached:true,stdio:['ignore','pipe','pipe']});assert(web.stdout&&web.stderr);web.stdout.on('data',bytes=>webLog+=bytes);web.stderr.on('data',bytes=>webLog+=bytes);
 const url='http://127.0.0.2:'+port+'/verify-hba';
 for(let count=0;;count++){assert(count<120&&web.exitCode===null,'GUI startup failed');try{if((await fetch(url)).status===200)break;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}
 console.log(JSON.stringify({status:'GUI_READY',root,url}));phase='browser';
 const deadline=Date.now()+600000;
 for(;;){assert(web.exitCode===null&&Date.now()<deadline,'GUI timeout');try{gui=jsonRecord(JSON.parse(await readFile(path.join(root,'gui-result.json'),'utf8')));break;}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}await new Promise(resolve=>setTimeout(resolve,250));}
 assert.equal(gui.status,'PASS');for(const name of (interrupted?['recoveryShown','recoveryConfirmed','applyBlocked','staleWarningCleared']:rollback?['nativePlanShown','applyConfirmed','rollbackShown']:['nativePlanShown','applyConfirmed','restoreConfirmed']))assert.equal(gui[name],true,name);
 assert.equal(await readFile(file,'utf8'),original);assert.equal(await sql('SELECT value FROM tastedev_fixture'),'한글 데이터 보존');
 assert.equal(bridge.helperCalls.filter(action=>action==='postgresql-hba-operation').length,interrupted?0:rollback?1:2);if(interrupted){assert.equal(bridge.helperCalls.filter(action=>action==='postgresql-hba-recover').length,1);assert(!bridge.helperCalls.includes('postgresql-hba-operation-plan'));}
 const audits=await bridge.audits();nativeProof={originalFileRestored:true,koreanDataPreserved:true,helperActions:[...bridge.helperCalls],audits};assert.equal(audits.filter(value=>value.action===(interrupted?'postgresql-hba-recover':'postgresql-hba-operation')&&value.result===(interrupted?'recovered':rollback?'rolled-back':'completed')).length,interrupted||rollback?1:2);assert.equal((await postgresqlHbaRecoveryStatus({path:target},options)).recoveryRequired,false);
 for(const [name,sha] of Object.entries(sourceHashes)){assert.equal(hash(await readFile(path.join(project,name))),sha);assert.equal(hash(await readFile(path.join(ui,name))),sha);}
 checks.push(interrupted?'actual HBA GUI blocks new review and explicitly recovers the interrupted native operation':rollback?'actual HBA GUI confirmed apply reports injected reload failure and automatic rollback':'actual HBA GUI native plan, confirmed apply and backup restore through authenticated API','accepted pg_ctl reloads and original private file restored','commit count and audit outcome match, Korean data preserved, journal cleared and current source hashes match');
 result={status:'PASS',reloadFailureInjected:rollback,actualApplySigkill:interrupted,version,binarySha256,checks,gui,nativeProof,sourceHashes,nativeHbaParserTested:true,nativeReloadAcceptanceVerified:true,guiTested:true,httpApiTested:true,privateClusterOnly:true,privilegedHelperTested:false,systemdTested:false,fixturePrivilegedTransport:true,fixtureGuiProxyAuthentication:true,hostConfigurationChanged:false};
}catch(error){result={status:'FAIL',phase,checks,message:diagnostic(error),gui,nativeProof,sourceHashes};process.exitCode=1;}
finally{
 try{if(web?.exitCode===null){const owned=web;owned.kill('SIGTERM');await new Promise<void>(resolve=>{const timer=setTimeout(()=>{owned.kill('SIGKILL');resolve();},10000);owned.once('close',()=>{clearTimeout(timer);resolve();});});}if(proxy){proxy.closeAllConnections();await new Promise<void>(resolve=>{assert(proxy);proxy.close(()=>resolve());});}await bridge?.close();if(started){await run('pg_ctl',['-D',data,'-m','immediate','-w','stop']);result.privateClusterStopped=true;}await rm(root,{recursive:true,force:true});result.privateFixtureRemoved=true;}
 catch(error){result.status='FAIL';result.cleanupError=diagnostic(error);process.exitCode=1;}
 const evidence=path.join(verificationWorkRoot,'postgresql-hba-native-gui-'+new Date().toISOString().replaceAll(':','-'));await mkdir(evidence,{recursive:true});await writeFile(path.join(evidence,'result.json'),JSON.stringify(result,null,2)+'\n');await writeFile(path.join(evidence,'server.log'),webLog);console.log(JSON.stringify({...result,evidence}));
}
