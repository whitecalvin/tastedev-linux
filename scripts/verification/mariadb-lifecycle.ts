import type {ChildProcess} from 'node:child_process';
import type {MariaDBApplyOptions} from '../../lib/mariadb-apply.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {jsonRecord} from './http-json.ts';
import {diagnostic} from './nginx-native-report.ts';
// Developer fixture only: runs an owned server on a private Unix socket.
// systemctl requests from the coordinator control this child, never the host service.
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm,lstat,realpath} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {applyMariaDBConfig} from '../../lib/mariadb-apply.ts';
import {mariadbTopology} from '../../lib/mariadb-topology.ts';

const assets=resolve(process.argv[2]||''),evidence=resolve(process.argv[3]||'');
if(!assets.startsWith(verificationWorkRoot+'/')||!evidence.startsWith(verificationWorkRoot+'/')||!process.argv[3])throw Error('지정 빌드 경로의 MariaDB 실행 파일과 증거 폴더를 입력하세요.');
const stat=await lstat(assets);assert(stat.isDirectory()&&!stat.isSymbolicLink()&&stat.uid===process.getuid?.()&&await realpath(assets)===assets);
const binaries={server:join(assets,'root/usr/sbin/mariadbd'),client:join(assets,'root/usr/bin/mariadb'),defaults:join(assets,'root/usr/bin/my_print_defaults'),initialize:join(assets,'root/usr/bin/mariadb-install-db')};
type LifecycleReport={status:string;scope:string;hostServiceControlled:boolean;networkListenerEnabled:boolean;privilegedHelperVerified:boolean;checks:{name:string;status:'PASS'}[];binaries:Record<string,{sha256:string}>;version?:string;restarts?:number;error?:string;serverStopped?:boolean;cleanupError?:string;fixtureRemoved?:boolean};
const report:LifecycleReport={scope:'owned-native-mariadb-lifecycle',status:'RUNNING',hostServiceControlled:false,networkListenerEnabled:false,privilegedHelperVerified:false,checks:[],binaries:{}};
for(const [name,file] of Object.entries(binaries)){const stat=await lstat(file);assert(stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1&&await realpath(file)===file,'검수 실행 파일을 확인하세요.');report.binaries[name]={sha256:createHash('sha256').update(await readFile(file)).digest('hex')};}
await mkdir(evidence,{recursive:true,mode:0o700});const evidenceStat=await lstat(evidence);assert(evidenceStat.isDirectory()&&!evidenceStat.isSymbolicLink()&&evidenceStat.uid===process.getuid?.()&&await realpath(evidence)===evidence,'증거 경로를 확인하세요.');
const fixture=await verificationWorkDirectory('tastedev-mariadb-lifecycle-'),base=join(fixture,'config'),backupRoot=join(fixture,'backups'),data=join(fixture,'data'),socket=join(fixture,'server.sock'),runtime=join(fixture,'runtime.cnf');
let child:ChildProcess|null=null,exited:Promise<unknown>|null=null,failNextRestart=false,restarts=0;
function command(file:string,args:string[]){return new Promise<string>((resolveCommand,reject)=>{
 const proc=spawn(file,args,{stdio:['ignore','pipe','pipe'],env:{...process.env,LC_ALL:'C.UTF-8'}});let out='',err='';
 const timer=setTimeout(()=>{proc.kill('SIGKILL');reject(Error('Native command timed out'));},30000);
 proc.stdout.on('data',chunk=>{out+=chunk;if(out.length>4194304)proc.kill('SIGKILL');});proc.stderr.on('data',chunk=>{err+=chunk;if(err.length>4194304)proc.kill('SIGKILL');});
 proc.on('error',error=>{clearTimeout(timer);reject(error);});proc.on('close',code=>{clearTimeout(timer);code===0?resolveCommand(out):reject(Error('Native command failed ('+code+'): '+err.slice(-2000)));});
 });}
const sql=(text:string)=>command(binaries.client,['--no-defaults','--protocol=socket','--socket='+socket,'--user=root','--batch','--skip-column-names','--execute='+text]);
async function stop(){if(!child)return;const current=child;child=null;current.kill('SIGTERM');let timer:NodeJS.Timeout|undefined;try{await Promise.race([exited,new Promise((_,reject)=>{timer=setTimeout(()=>{current.kill('SIGKILL');reject(Error('Private server shutdown timed out'));},10000);})]);}finally{clearTimeout(timer);}}
async function start(invalid=false){
 const main=await readFile(join(base,'my.cnf'),'utf8');await writeFile(runtime,main.replaceAll('/etc/mysql/',base+'/'),{mode:0o600});
 child=spawn(binaries.server,['--defaults-file='+runtime,...(invalid?['--tastedev-invalid-fixture-option']:[])],{stdio:['ignore','ignore','pipe']});
 const current=child;assert(current.stderr);let diagnostic='';current.stderr.on('data',chunk=>{diagnostic=(diagnostic+chunk).slice(-4000);});exited=new Promise<unknown>(resolveExit=>{current.once('exit',resolveExit);current.once('error',resolveExit);});
 for(let count=0;count<100;count++){if(current.exitCode!==null||current.signalCode!==null)throw Error('Private server failed to start: '+diagnostic);try{if((await sql('SELECT 1')).trim()==='1')return;}catch{}await delay(100);}
 throw Error('Private server readiness timed out');
}
async function run(binary:string,args:string[]){
 if(binary==='/usr/sbin/mariadbd')return command(binaries.server,args);
 if(binary==='/usr/bin/my_print_defaults')return command(binaries.defaults,args);
 assert.equal(binary,'/usr/bin/systemctl');
 if(args.includes('is-active')){assert(child&&child.exitCode===null&&child.signalCode===null);assert.equal((await sql('SELECT 1')).trim(),'1');return '';}
 assert(args.includes('restart'));restarts++;await stop();const invalid=failNextRestart;failNextRestart=false;await start(invalid);return '';
}
async function apply(changes:Record<string,unknown>,extra:MariaDBApplyOptions={}){const graph=await mariadbTopology('/etc/mysql/my.cnf',base);assert(graph.complete);return applyMariaDBConfig({root:graph.root,target:'/etc/mysql/conf.d/server.cnf',version:graph.version,changes,confirm:true},{run,base,backupRoot,...extra});}
function passed(name:string){report.checks.push({name,status:'PASS'});process.stdout.write(name+' PASS\n');}
try{
 for(const dir of [base,join(base,'conf.d'),backupRoot,data])await mkdir(dir,{mode:0o700});
 report.version=(await command(binaries.server,['--no-defaults','--version'])).trim();
 await command(binaries.initialize,['--no-defaults','--basedir='+join(assets,'root/usr'),'--datadir='+data,'--auth-root-authentication-method=normal','--skip-test-db']);
 const shared='[mariadbd]\nbasedir='+join(assets,'root/usr')+'\ndatadir='+data+'\nsocket='+socket+'\npid-file='+join(fixture,'server.pid')+'\nlog-error='+join(fixture,'server.log')+'\nskip-networking\ninnodb_buffer_pool_size=32M\n';
 await writeFile(join(base,'my.cnf'),shared+'!includedir /etc/mysql/conf.d\n',{mode:0o600});
 const original='[mariadbd]\nmax_connections=100\n';await writeFile(join(base,'conf.d/server.cnf'),original,{mode:0o600});
 await start();await sql("CREATE DATABASE tastedev_fixture CHARACTER SET utf8mb4; CREATE TABLE tastedev_fixture.messages (value VARCHAR(100)); INSERT INTO tastedev_fixture.messages VALUES ('한국어 설정 복구');");
 assert.equal((await sql('SELECT @@skip_networking, @@max_connections')).trim(),'1\t100');passed('private_socket_and_initial_settings');
 const applied=await apply({connections:123});assert(applied.changed&&!applied.failed);assert.equal((await sql('SELECT @@max_connections')).trim(),'123');assert.equal((await sql('SELECT value FROM tastedev_fixture.messages')).trim(),'한국어 설정 복구');passed('native_validation_apply_restart_and_korean_data');
 const backup=jsonRecord(JSON.parse(await readFile(join(backupRoot,applied.backupId+'.json'),'utf8')));assert(typeof backup.text==='string');assert.equal(backup.text,original);
 const restored=await apply({},{restoreText:backup.text});assert(restored.changed&&!restored.failed);assert.equal((await sql('SELECT @@max_connections')).trim(),'100');passed('private_backup_full_file_restore');
 const beforeInvalid=restarts;await assert.rejects(apply({},{restoreText:'[mariadbd]\ntastedev_invalid_fixture_option=1\n'}),/Configuration validation failed/);assert.equal(restarts,beforeInvalid);assert.equal(await readFile(join(base,'conf.d/server.cnf'),'utf8'),original);assert.equal((await sql('SELECT @@max_connections')).trim(),'100');passed('native_invalid_candidate_rejected_before_replacement');
 failNextRestart=true;const rolledBack=await apply({connections:150});assert(rolledBack.failed&&rolledBack.restored&&rolledBack.recovered);assert.equal((await sql('SELECT @@max_connections')).trim(),'100');assert.equal(await readFile(join(base,'conf.d/server.cnf'),'utf8'),original);assert.equal((await sql('SELECT value FROM tastedev_fixture.messages')).trim(),'한국어 설정 복구');passed('actual_server_start_failure_rolls_back_and_recovers');
 report.restarts=restarts;report.status='PASS';
}catch(error){report.status='FAIL';report.error=diagnostic(error);process.exitCode=1;}
finally{try{await stop();report.serverStopped=true;}catch(error){report.status='FAIL';report.cleanupError=diagnostic(error);process.exitCode=1;}await rm(fixture,{recursive:true,force:true});report.fixtureRemoved=true;const resultPath=join(evidence,'mariadb-lifecycle-'+new Date().toISOString().replaceAll(':','-')+'.json');await writeFile(resultPath,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({status:report.status,evidence:resultPath}));}
