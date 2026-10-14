import type {Stats} from 'node:fs';
type Owner={uid:number;gid:number};
type ServiceTarget=ReturnType<typeof postgresqlHbaServiceTarget>;
type PidRecord={pid:number;data:string;started:number;port:number;socket:string};
type ProcessSnapshot=PidRecord&{start:string;socketIdentity?:string;argvHash?:string};
type NativeRun=(binary:string,args:string[],env?:Record<string,string>)=>Promise<{stdout:unknown}>;
export type HbaServiceDependencies={runCommand?:NativeRun;lookup?:()=>Promise<Owner>;processSnapshot?:(pid:number,owner:Owner,target:ServiceTarget)=>Promise<ProcessSnapshot>;verifyExecutable?:(binary:string)=>unknown};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {lstat,open,realpath} from 'node:fs/promises';
import {constants} from 'node:fs';import {execFile} from './admin-native-exec.ts';import {promisify} from 'node:util';import path from 'node:path';import {createHash} from 'node:crypto';
import {postgresqlHbaRoot} from './postgresql-hba-graph.ts';
import {redisValidationBinary} from './redis-validation-binary.ts';
const exec=promisify(execFile),fail:()=>never=()=>{throw Object.assign(Error('실행 중인 PostgreSQL 클러스터와 접속 규칙 경로를 확인하세요.'),{status:409});};
const absolute=(value:unknown):value is string=>typeof value==='string'&&value.startsWith('/')&&!/[\x00-\x1f\x7f]/.test(value)&&path.resolve(value)===value;
const sql="SELECT pg_catalog.json_build_object('data',pg_catalog.current_setting('data_directory'),'config',pg_catalog.current_setting('config_file'),'hba',pg_catalog.current_setting('hba_file'),'port',pg_catalog.current_setting('port')::int,'version',pg_catalog.current_setting('server_version_num')::int,'pidFile',pg_catalog.pg_read_file('postmaster.pid',0,16384),'readOnly',pg_catalog.current_setting('transaction_read_only'));";
async function run(binary:string,args:string[],extra:Record<string,string>={}){
 redisValidationBinary({binary});try{return await exec(binary,args,{cwd:'/',timeout:10000,maxBuffer:16384,encoding:'utf8',env:{NODE_ENV:process.env.NODE_ENV,PATH:'/usr/bin:/usr/sbin:/bin',LANG:'C',LC_ALL:'C',HOME:'/',...extra}});}catch{fail();}
}
async function bounded(file:string,uid:number|null=null){
 const before=await lstat(file);if(before.isSymbolicLink()||uid!==null&&(!before.isFile()||before.nlink!==1||before.uid!==uid||(before.mode&0o022)||before.size>16384))fail();
 const fd=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{const stat=await fd.stat();if(stat.ino!==before.ino||stat.dev!==before.dev)fail();const bytes=Buffer.alloc(16385);let length=0;while(length<bytes.length){const value=await fd.read(bytes,length,bytes.length-length,null);if(!value.bytesRead)break;length+=value.bytesRead;}if(length>16384)fail();const after=await lstat(file);if((['ino','dev','uid','gid','mode','size','mtimeMs','ctimeMs'] as const).some(key=>stat[key]!==after[key]))fail();return new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,length));}finally{await fd.close();}
}
export function postgresqlHbaServiceTarget(target:unknown){const folder=postgresqlHbaRoot(target),[major,cluster]=folder.split('/').slice(-2);if(Number(major)<15||Number(major)>99)fail();return {major:Number(major),cluster,config:folder+'/postgresql.conf',unit:'postgresql@'+major+'-'+cluster+'.service',binary:'/usr/lib/postgresql/'+major+'/bin/postgres'};}
export function postgresqlPidFile(text:unknown,pid:number){
 if(typeof text!=='string'||text.length>16384||text.includes('\0'))fail();const lines=text.split('\n');if(lines.length<8||lines[0]!==String(pid)||!absolute(lines[1])||(! /^[1-9][0-9]*$/.test(lines[2])||!Number.isSafeInteger(Number(lines[2])))||! /^[0-9]+$/.test(lines[3])||Number(lines[3])<1||Number(lines[3])>65535||(!absolute(lines[4])||lines[4].includes(','))||lines[7].trim()!=='ready')fail();
 return {pid,data:lines[1],started:Number(lines[2]),port:Number(lines[3]),socket:lines[4]};
}
function manager(text:unknown){if(typeof text!=='string')fail();const pairs:Record<string,string>={};for(const line of text.trim().split('\n')){const match=/^(LoadState|ActiveState|MainPID)=(.*)$/.exec(line);if(!match||Object.hasOwn(pairs,match[1]))fail();pairs[match[1]]=match[2];}if(pairs.LoadState!=='loaded'||pairs.ActiveState!=='active'||! /^[1-9][0-9]{0,9}$/.test(pairs.MainPID))fail();return Number(pairs.MainPID);}
async function account(){const result:Owner={uid:0,gid:0};for(const [flag,key] of ([['-u','uid'],['-g','gid']] as const)){const raw=(await run('/usr/bin/id',[flag,'postgres'])).stdout;if(typeof raw!=='string')fail();const output=raw.trim();if(! /^[1-9][0-9]*$/.test(output))fail();result[key]=Number(output);}return result;}
export async function postgresqlServiceDirectory(location:unknown,owner:Owner,{statPath=lstat}:{statPath?:(path:string)=>Promise<Pick<Stats,'uid'|'gid'|'mode'|'isDirectory'|'isSymbolicLink'>>}={}){
 if(!absolute(location))fail();
 let current='/';for(const part of location.slice(1).split('/')){
  current=path.join(current,part);const stat=await statPath(current);
  let reason;
  if(!stat.isDirectory()||stat.isSymbolicLink())reason='심볼릭 링크 없이 실제 디렉터리여야 합니다.';
  else if(![0,owner.uid].includes(stat.uid))reason='root 또는 PostgreSQL 실행 계정 소유여야 합니다.';
  else if((stat.mode&0o002)||stat.mode&0o020&&!(stat.uid===owner.uid&&stat.gid===owner.gid))reason='다른 계정이 경로를 교체할 수 있는 쓰기 권한이 있습니다.';
  if(reason)throw Object.assign(Error('PostgreSQL 서비스 경로를 안전하게 확인할 수 없습니다: '+current+' — '+reason+' 저장 경로와 상위 폴더의 소유권·권한을 확인하세요.'),{status:409,code:'POSTGRESQL_UNTRUSTED_DIRECTORY',directory:current});
 }
}
const directory=postgresqlServiceDirectory;
async function snapshot(pid:number,owner:Owner,target:ServiceTarget){
 const root='/proc/'+pid,proc=await lstat(root);if(!proc.isDirectory()||proc.uid!==owner.uid||await realpath(root+'/exe')!==target.binary)fail();
 const stat=await bounded(root+'/stat'),end=stat.lastIndexOf(')'),start=stat.slice(end+2).trim().split(/\s+/)[19];if(end<0||! /^\d+$/.test(start))fail();
 const status=await bounded(root+'/status');if(!new RegExp('^Uid:\\s+'+owner.uid+'\\s+'+owner.uid+'\\s+'+owner.uid+'\\s+'+owner.uid+'\\s*$','m').test(status))fail();
 const argv=(await bounded(root+'/cmdline')).split('\0').filter(Boolean);if(argv.length>100||argv[0]!==target.binary||argv.some(value=>value.length>4096))fail();let data;
 for(let index=1;index<argv.length;index++){if(argv[index]==='-D'){if(data!==undefined)fail();data=argv[++index];}else if(argv[index].startsWith('-D')){if(data!==undefined)fail();data=argv[index].slice(2);}}
 if(!absolute(data))fail();await directory(data,owner);const pidText=await bounded(path.join(data,'postmaster.pid'),owner.uid),record=postgresqlPidFile(pidText,pid);if(record.data!==data)fail();
 const socket=await realpath(record.socket);if(socket.includes(','))fail();await directory(socket,owner);const socketPath=path.join(socket,'.s.PGSQL.'+record.port),socketStat=await lstat(socketPath);if(!socketStat.isSocket()||socketStat.uid!==owner.uid||socketStat.isSymbolicLink())fail();
 return {...record,start,socket,socketIdentity:socketStat.dev+':'+socketStat.ino,argvHash:createHash('sha256').update(JSON.stringify(argv)).digest('hex')};
}
export function postgresqlRuntimeSettings(text:unknown,record:PidRecord,target:ServiceTarget,path:unknown){
 if(typeof text!=='string')fail();let data:unknown;try{data=JSON.parse(text);}catch{fail();}if(!object(data)||typeof data.version!=='number'||data.data!==record.data||data.config!==target.config||data.hba!==path||data.port!==record.port||!Number.isInteger(data.version)||Math.floor(data.version/10000)!==target.major||data.readOnly!=='on')fail();
 // PgStartTime is sampled later than MyStartTime in postmaster startup.
 // Compare the server's own PID metadata, not those independent timestamps.
 const serverRecord=postgresqlPidFile(data.pidFile,record.pid);
 if((['pid','data','started','port'] as const).some(key=>serverRecord[key]!==record[key]))fail();
 return data;
}
// Performs a fixed read-only query only after the operator requests operational
// review through the gated helper. Native draft validation does not use this.
export async function inspectPostgresqlHbaService(value:unknown,{runCommand=run,lookup=account,processSnapshot=snapshot,verifyExecutable=binary=>redisValidationBinary({binary})}:HbaServiceDependencies={}){
 const path=typeof value==='string'?value:fail(),target=postgresqlHbaServiceTarget(path),owner=await lookup(),args=['--no-ask-password','show',target.unit,'--property=LoadState,ActiveState,MainPID','--no-pager'];
 verifyExecutable(target.binary);verifyExecutable('/usr/lib/postgresql/'+target.major+'/bin/psql');
 const pid=manager((await runCommand('/usr/bin/systemctl',args)).stdout),before=await processSnapshot(pid,owner,target);
 const result=await runCommand('/usr/sbin/runuser',['-u','postgres','--','/usr/lib/postgresql/'+target.major+'/bin/psql','--no-psqlrc','--no-password','--host='+before.socket,'--port='+before.port,'--username=postgres','--dbname=postgres','--tuples-only','--no-align','--set=ON_ERROR_STOP=1','--command='+sql],{PGPASSFILE:'/dev/null',PGSERVICEFILE:'/dev/null',PGCONNECT_TIMEOUT:'3',PGOPTIONS:'-c default_transaction_read_only=on -c statement_timeout=5000 -c lock_timeout=1000 -c search_path=pg_catalog'});
 if(typeof result.stdout!=='string')fail();const settings=postgresqlRuntimeSettings(result.stdout.trim(),before,target,path),after=await processSnapshot(pid,owner,target),latest=manager((await runCommand('/usr/bin/systemctl',args)).stdout);
 if(latest!==pid||JSON.stringify(before)!==JSON.stringify(after))fail();
 return {...target,pid,start:before.start,data:before.data,started:before.started,port:before.port,socket:before.socket,hba:path,version:settings.version,identityVerified:true,settingsSource:'running-server',readOnlyQuery:true};
}
export async function inspectPostgresqlHbaIdentity(service:unknown,{runCommand=run,lookup=account,processSnapshot=snapshot}:HbaServiceDependencies={}){
 if(!object(service))fail();const target=postgresqlHbaServiceTarget(service.hba),owner=await lookup(),args=['--no-ask-password','show',target.unit,'--property=LoadState,ActiveState,MainPID','--no-pager'];
 const pid=manager((await runCommand('/usr/bin/systemctl',args)).stdout),current=await processSnapshot(pid,owner,target),latest=manager((await runCommand('/usr/bin/systemctl',args)).stdout);
 if(latest!==pid||pid!==service.pid||current.start!==service.start||current.data!==service.data||current.started!==service.started||current.port!==service.port||current.socket!==service.socket)fail();return true;
}
export function postgresqlHbaServiceHooks({inspect=inspectPostgresqlHbaService,identity=inspectPostgresqlHbaIdentity,runCommand=run}:{inspect?:(path:unknown)=>unknown|Promise<unknown>;identity?:(service:unknown)=>unknown|Promise<unknown>;runCommand?:NativeRun}={}){
 return {inspectService:inspect,inspectIdentity:identity,reload:async (service:unknown)=>{if(!object(service)||typeof service.unit!=='string')fail();await identity(service);await runCommand('/usr/bin/systemctl',['--no-ask-password','reload',service.unit]);await identity(service);return {reloadRequested:true,reloadAcceptanceVerified:false};}};
}
