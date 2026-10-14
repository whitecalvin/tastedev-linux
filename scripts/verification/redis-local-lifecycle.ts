import type {ChildProcess} from 'node:child_process';
import type {RedisCandidate} from '../../lib/redis-candidate.ts';
import type {RedisApplyOptions} from '../../lib/redis-apply.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {jsonRecord} from './http-json.ts';
import {diagnostic} from './nginx-native-report.ts';
// Native developer fixture; never controls host systemd or proves helper isolation.
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm,lstat,realpath} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {applyRedisConfig} from '../../lib/redis-apply.ts';
import {redisTopology} from '../../lib/redis-topology.ts';
import {assertRedisCandidate} from '../../lib/redis-candidate.ts';

const assets=resolve(process.argv[2]||''),evidence=resolve(process.argv[3]||'');
if(!assets.startsWith(verificationWorkRoot+'/')||!evidence.startsWith(verificationWorkRoot+'/')||!process.argv[3])throw Error('지정 빌드 경로의 Redis 실행 파일과 증거 폴더를 입력하세요.');
const assetStat=await lstat(assets);assert(assetStat.isDirectory()&&!assetStat.isSymbolicLink()&&assetStat.uid===process.getuid?.()&&await realpath(assets)===assets);
const server=join(assets,'root/usr/bin/redis-server'),client=join(assets,'root/usr/bin/redis-cli');
type LifecycleReport={status:string;scope:string;hostServiceControlled:boolean;networkListenerEnabled:boolean;privilegedHelperVerified:boolean;namespaceIsolationVerified:boolean;checks:{name:string;status:'PASS'}[];binaries:Record<string,{sha256:string}>;version?:string;restarts?:number;error?:string;serverStopped?:boolean;cleanupError?:string;fixtureRemoved?:boolean};
const report:LifecycleReport={status:'RUNNING',scope:'owned-native-redis-lifecycle',hostServiceControlled:false,networkListenerEnabled:false,privilegedHelperVerified:false,namespaceIsolationVerified:false,checks:[],binaries:{}};
for(const [name,file] of Object.entries({server,client})){const stat=await lstat(file);assert(stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1&&await realpath(file)===file,'검수 실행 파일을 확인하세요.');report.binaries[name]={sha256:createHash('sha256').update(await readFile(file)).digest('hex')};}
await mkdir(evidence,{recursive:true,mode:0o700});const evidenceStat=await lstat(evidence);assert(evidenceStat.isDirectory()&&!evidenceStat.isSymbolicLink()&&evidenceStat.uid===process.getuid?.()&&await realpath(evidence)===evidence,'증거 경로를 확인하세요.');
const fixture=await verificationWorkDirectory('tastedev-redis-lifecycle-'),base=join(fixture,'config'),backupRoot=join(fixture,'backups'),data=join(fixture,'data'),socket=join(fixture,'server.sock');
type RedisHandle={p:ChildProcess;ended:Promise<unknown>};
let service:RedisHandle|null=null,failNext=false,restarts=0;
function command(binary:string,args:string[]){return new Promise<string>((done,reject)=>{const p=spawn(binary,args,{stdio:['ignore','pipe','pipe']});let output='';const timer=setTimeout(()=>{p.kill('SIGKILL');reject(Error('Native Redis command timed out'));},10000);p.stdout.on('data',chunk=>output+=chunk);p.on('error',error=>{clearTimeout(timer);reject(error);});p.on('close',code=>{clearTimeout(timer);code===0?done(output):reject(Error('Native Redis command failed'));});});}
const cli=(sock:string,...args:string[])=>command(client,['-s',sock,'--raw',...args]);
async function start(config:string,sock:string,overrides:string[]=[]){
 const p=spawn(server,[config,...overrides],{stdio:['ignore','ignore','ignore']});const handle={p,ended:new Promise<unknown>(done=>{p.once('exit',done);p.once('error',done);})};
 try{for(let attempt=0;attempt<100;attempt++){if(p.exitCode!==null||p.signalCode!==null)throw Error('Native Redis startup rejected');try{if((await cli(sock,'PING')).trim()==='PONG')return handle;}catch{}await delay(50);}throw Error('Native Redis startup timed out');}catch(error){await stop(handle);throw error;}
}
async function stop(handle:RedisHandle|null|undefined){if(!handle)return;handle.p.kill('SIGTERM');let timer:NodeJS.Timeout|undefined;try{await Promise.race([handle.ended,new Promise((_,reject)=>{timer=setTimeout(()=>{handle.p.kill('SIGKILL');reject(Error('Private Redis shutdown timed out'));},10000);})]);}finally{clearTimeout(timer);}}
async function inspectService(){assert(service&&service.p.exitCode===null&&service.p.signalCode===null);assert.equal((await cli(socket,'PING')).trim(),'PONG');}
async function restart(){restarts++;await stop(service);service=null;const invalid=failNext;failNext=false;service=await start(join(base,'redis.conf'),socket,invalid?['--tastedev-invalid-fixture-option','1']:[]);}
async function validatePrepared(candidate:RedisCandidate){
 await assertRedisCandidate(candidate);const validation=await mkdtemp(join(fixture,'validation-')),sock=join(validation,'server.sock');let handle:RedisHandle|undefined;
 try{handle=await start(candidate.main,sock,['--port','0','--unixsocket',sock,'--dir',validation,'--save','','--appendonly','no','--daemonize','no','--logfile','']);
  if(candidate.changes.connections!==undefined){const values=(await cli(sock,'CONFIG','GET','maxclients')).trim().split('\n');assert.equal(Number(values[1]),Number(candidate.changes.connections));}
  await assertRedisCandidate(candidate);
 }finally{await stop(handle);await rm(validation,{recursive:true,force:true});}
}
async function apply(changes:Record<string,unknown>,extra:RedisApplyOptions={}){const graph=await redisTopology(undefined,base);assert(graph.complete);return applyRedisConfig({version:graph.version,changes,confirm:true},{base,backupRoot,validatePrepared,inspectService,activate:restart,recover:restart,...extra});}
function passed(name:string){report.checks.push({name,status:'PASS'});process.stdout.write(name+' PASS\n');}
try{
 for(const dir of [base,backupRoot,data])await mkdir(dir,{mode:0o700});
 report.version=(await command(server,['--version'])).trim();
 const original='port 0\nunixsocket '+socket+'\nunixsocketperm 700\ndir '+data+'\nsave ""\nappendonly yes\nappendfsync always\ndaemonize no\nlogfile ""\nmaxclients 100\n';
 await writeFile(join(base,'redis.conf'),original,{mode:0o600});service=await start(join(base,'redis.conf'),socket);await cli(socket,'SET','tastedev:fixture','한국어 Redis 복구');assert.equal((await cli(socket,'GET','tastedev:fixture')).trim(),'한국어 Redis 복구');passed('private_socket_and_korean_value');
 const result=await apply({connections:123});assert(result.changed&&!result.failed);assert.equal((await cli(socket,'CONFIG','GET','maxclients')).trim(),'maxclients\n123');assert.equal((await cli(socket,'GET','tastedev:fixture')).trim(),'한국어 Redis 복구');passed('native_candidate_apply_restart_and_aof_data');
 const backup=jsonRecord(JSON.parse(await readFile(join(backupRoot,result.backupId+'.json'),'utf8')));assert(typeof backup.text==='string');assert.equal(backup.text,original);const restored=await apply({},{restoreText:backup.text});assert(restored.changed&&!restored.failed);assert.equal((await cli(socket,'CONFIG','GET','maxclients')).trim(),'maxclients\n100');passed('configuration_backup_full_file_restore');
 const beforeInvalid=restarts;await assert.rejects(apply({},{restoreText:original+'tastedev-invalid-fixture-option 1\n'}),/Configuration validation failed/);assert.equal(restarts,beforeInvalid);assert.equal(await readFile(join(base,'redis.conf'),'utf8'),original);passed('native_invalid_candidate_rejected_before_replacement');
 failNext=true;const rollback=await apply({connections:150});assert(rollback.failed&&rollback.restored&&rollback.recovered);assert.equal(await readFile(join(base,'redis.conf'),'utf8'),original);assert.equal((await cli(socket,'CONFIG','GET','maxclients')).trim(),'maxclients\n100');assert.equal((await cli(socket,'GET','tastedev:fixture')).trim(),'한국어 Redis 복구');passed('actual_start_failure_rolls_back_and_preserves_aof_value');
 report.restarts=restarts;report.status='PASS';
}catch(error){report.status='FAIL';report.error=diagnostic(error);process.exitCode=1;}
finally{try{await stop(service);report.serverStopped=true;}catch(error){report.status='FAIL';report.cleanupError=diagnostic(error);process.exitCode=1;}await rm(fixture,{recursive:true,force:true});report.fixtureRemoved=true;const resultPath=join(evidence,'redis-lifecycle-'+new Date().toISOString().replaceAll(':','-')+'.json');await writeFile(resultPath,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({status:report.status,evidence:resultPath}));}
