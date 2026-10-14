import type {Stats} from 'node:fs';
import type {FileHandle} from 'node:fs/promises';
import {hasErrorCode} from './error-code.ts';
export type AutoConfiguration={present:boolean;version:string};
export type PostgresqlConfigServiceOptions={ownerUid?:number;inspect?:(target:string)=>unknown|Promise<unknown>;identity?:(service:Record<string,unknown>)=>unknown|Promise<unknown>;autoVersion?:(data:string,ownerUid:number)=>Promise<AutoConfiguration>;runCommand?:(binary:string,args:string[],env:Record<string,string>)=>Promise<{stdout:unknown}>};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {open,lstat} from 'node:fs/promises';import {constants} from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {promisify} from 'node:util';
import {execFile} from './admin-native-exec.ts';import {redisValidationBinary} from './redis-validation-binary.ts';import {inspectPostgresqlHbaService,inspectPostgresqlHbaIdentity} from './postgresql-hba-service.ts';import {postgresqlConfigRoot} from './postgresql-config-graph.ts';
const exec=promisify(execFile),fail:()=>never=()=>{throw Object.assign(Error('실행 중인 PostgreSQL 설정과 시작 상태를 확인하세요.'),{status:409});};
const sql="SELECT pg_catalog.json_build_object('port',pg_catalog.current_setting('port'),'max_connections',pg_catalog.current_setting('max_connections'),'shared_buffers',(SELECT setting FROM pg_catalog.pg_settings WHERE name='shared_buffers'),'work_mem',(SELECT setting FROM pg_catalog.pg_settings WHERE name='work_mem'),'logging_collector',pg_catalog.current_setting('logging_collector'),'errors',(SELECT count(*)::int FROM pg_catalog.pg_file_settings WHERE error IS NOT NULL));";
// Walk from a pinned root descriptor. O_NOFOLLOW on the leaf alone would still
// allow a symlink or replacement in the data directory's parents.
export async function postgresqlAutoConfigVersion(data:unknown,ownerUid:unknown){
 if(typeof data!=='string'||!path.isAbsolute(data)||path.normalize(data)!==data||/[\x00-\x1f\x7f]/.test(data)||typeof ownerUid!=='number'||!Number.isSafeInteger(ownerUid)||ownerUid<0)fail();
 const directories:{name:string;handle:FileHandle;stat:Stats}[]=[],keys=['dev','ino','uid','gid','mode'] as const,same=(a:Stats,b:Stats)=>keys.every(key=>a[key]===b[key]);
 const trusted=(stat:Stats)=>stat.isDirectory()&&[0,ownerUid].includes(stat.uid)&&(!(stat.mode&0o022)||(stat.uid===0&&(stat.mode&0o1000)!==0));
 async function checkDirectories(){for(const entry of directories){const current=await entry.handle.stat(),named=await lstat(entry.name);if(!trusted(current)||!named.isDirectory()||named.isSymbolicLink()||!same(entry.stat,current)||!same(entry.stat,named))fail();}}
 try{
  for(const part of ['/',...data.split('/').filter(Boolean)]){
   const parent=directories.at(-1),name=parent?path.join(parent.name,part):'/',anchored=parent?'/proc/self/fd/'+parent.handle.fd+'/'+part:'/';
   const handle=await open(anchored,constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW);const stat=await handle.stat();directories.push({name,handle,stat});if(!trusted(stat))fail();
  }
  const leaf=directories.at(-1);if(!leaf)fail();const file='/proc/self/fd/'+leaf.handle.fd+'/postgresql.auto.conf';let before;
  try{before=await lstat(file);}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;await checkDirectories();return {present:false,version:createHash('sha256').update('missing').digest('hex')};}
  const safe=(stat:Stats)=>stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1&&[0,ownerUid].includes(stat.uid)&&!(stat.mode&0o022)&&stat.size<=262144;if(!safe(before))fail();
  const fd=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
  try{const stat=await fd.stat(),buffer=Buffer.alloc(262145);let size=0;while(size<buffer.length){const part=await fd.read(buffer,size,buffer.length-size,null);if(!part.bytesRead)break;size+=part.bytesRead;}
   const after=await fd.stat(),named=await lstat(file);if(size>262144||!safe(after)||!safe(named)||(['dev','ino','uid','gid','mode','nlink','size','mtimeMs','ctimeMs'] as const).some(key=>stat[key]!==before[key]||stat[key]!==after[key]||stat[key]!==named[key]))fail();await checkDirectories();return {present:true,version:createHash('sha256').update(buffer.subarray(0,size)).digest('hex')};
  }finally{await fd.close();}
 }finally{for(const entry of directories.reverse())await entry.handle.close();}
}
function runtimeSettings(text:unknown,allowErrors=false){if(typeof text!=='string')fail();let result:unknown;try{result=JSON.parse(text);}catch{fail();}if(!object(result)||typeof result.errors!=='number'||!Number.isSafeInteger(result.errors)||result.errors<0||!allowErrors&&result.errors!==0)fail();const values:Record<string,string>={};for(const key of ['port','max_connections','shared_buffers','work_mem','logging_collector']){const value=result[key];if(typeof value!=='string'||(key==='logging_collector'?!/^(on|off)$/.test(value):!/^\d{1,15}$/.test(value)))fail();values[key]=value;}return {values,errors:result.errors};}
export function postgresqlConfigRuntimeValues(text:unknown,{allowErrors=false}={}){return runtimeSettings(text,allowErrors).values;}
export async function inspectPostgresqlConfigService(target:unknown,{ownerUid,inspect=inspectPostgresqlHbaService,identity=inspectPostgresqlHbaIdentity,autoVersion=postgresqlAutoConfigVersion,runCommand=async(binary,args,env)=>{redisValidationBinary({binary});try{return await exec(binary,args,{encoding:'utf8',cwd:'/',timeout:10000,maxBuffer:16384,env:{NODE_ENV:process.env.NODE_ENV,PATH:'/usr/bin:/usr/sbin:/bin',HOME:'/',LANG:'C',LC_ALL:'C',...env}});}catch{fail();}}}:PostgresqlConfigServiceOptions={}){
 const root=postgresqlConfigRoot(target),service=await inspect(root+'/pg_hba.conf');if(!object(service)||typeof service.data!=='string'||typeof service.major!=='number'||typeof service.socket!=='string'||typeof service.port!=='number'||service.identityVerified!==true||service.config!==target||service.settingsSource!=='running-server'||typeof ownerUid!=='number'||!Number.isSafeInteger(ownerUid)||ownerUid<0)fail();const before=await autoVersion(service.data,ownerUid);await identity(service);
 const result=await runCommand('/usr/sbin/runuser',['-u','postgres','--','/usr/lib/postgresql/'+service.major+'/bin/psql','--no-psqlrc','--no-password','--host='+service.socket,'--port='+service.port,'--username=postgres','--dbname=postgres','--tuples-only','--no-align','--set=ON_ERROR_STOP=1','--command='+sql],{PGPASSFILE:'/dev/null',PGSERVICEFILE:'/dev/null',PGCONNECT_TIMEOUT:'3',PGOPTIONS:'-c default_transaction_read_only=on -c statement_timeout=5000 -c lock_timeout=1000 -c search_path=pg_catalog'});if(typeof result.stdout!=='string')fail();const settings=runtimeSettings(result.stdout.trim(),true),values=settings.values;await identity(service);const after=await autoVersion(service.data,ownerUid);if(JSON.stringify(before)!==JSON.stringify(after))fail();return {...service,values,autoConfiguration:before,configurationErrors:settings.errors,readOnlyQuery:true};
}
