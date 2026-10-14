import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {execFile} from './admin-native-exec.ts';
import {redisValidationBinary} from './redis-validation-binary.ts';
import {inspectPostgresqlHbaService,inspectPostgresqlHbaIdentity} from './postgresql-hba-service.ts';
import {preparePostgresqlBackupLookup} from './postgresql-backup-request.ts';
import type {PostgresqlDataContext} from './postgresql-data-backup.ts';
type DatabaseEntry={name:string;oid:string};
type DataService=Record<string,unknown>&{identityVerified:true;settingsSource:'running-server';config:string;major:number;pid:number;start:string;socket:string;port:number};
export type DataContextDependencies={inspect?:(path:unknown)=>unknown|Promise<unknown>;identity?:(service:unknown)=>unknown|Promise<unknown>;run?:(binary:string,args:string[])=>unknown|Promise<unknown>};
export type DataRequest=Record<string,unknown>&{path:string};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const execute=promisify(execFile),fail:(message?:string)=>never=(message='PostgreSQL 데이터베이스와 서비스를 다시 검토하세요.')=>{throw Object.assign(Error(message),{status:409});};
const query="SELECT pg_catalog.json_build_object('systemIdentifier',(SELECT system_identifier::text FROM pg_catalog.pg_control_system()),'databases',(SELECT coalesce(json_agg(json_build_object('name',datname,'oid',oid::text) ORDER BY datname),'[]'::json) FROM pg_catalog.pg_database WHERE datallowconn AND NOT datistemplate));";
async function native(binary:string,args:string[]){redisValidationBinary({binary});try{return await execute(binary,args,{cwd:'/',encoding:'utf8',timeout:10000,maxBuffer:262144,env:{NODE_ENV:process.env.NODE_ENV,PATH:'/usr/bin:/usr/sbin:/bin',HOME:'/',LANG:'C.UTF-8',LC_ALL:'C.UTF-8',PGPASSFILE:'/dev/null',PGSERVICEFILE:'/dev/null',PGCONNECT_TIMEOUT:'3',PGOPTIONS:'-c default_transaction_read_only=on -c statement_timeout=5000 -c lock_timeout=1000 -c search_path=pg_catalog'}});}catch{fail();}}
function output(value:unknown){if(!object(value)||typeof value.stdout!=='string')fail();return value.stdout.trim();}
function database(value:unknown):value is DatabaseEntry{return object(value)&&typeof value.name==='string'&&!!value.name&&Buffer.byteLength(value.name)<=63&&!/[\x00-\x1f\x7f]/.test(value.name)&&typeof value.oid==='string'&&/^\d+$/.test(value.oid);}
function catalog(text:string){let data:unknown;try{data=JSON.parse(text);}catch{fail();}if(!object(data)||typeof data.systemIdentifier!=='string'||!/^\d+$/.test(data.systemIdentifier)||!Array.isArray(data.databases)||data.databases.length>1000||!data.databases.every(database)||new Set(data.databases.map(item=>item.name)).size!==data.databases.length)fail();return {systemIdentifier:data.systemIdentifier,databases:data.databases.map(item=>({name:item.name,oid:item.oid}))};}
const actionKeys={context:['path'],backup:['path','database','reviewVersion','confirm'],backups:['path'],plan:['path','database','id','reviewVersion'],restore:['path','database','id','reviewVersion','sha256','bytes','confirmation','confirm']};
export type DataAction=keyof typeof actionKeys;
export function isPostgresqlDataAction(action:unknown):action is DataAction{return typeof action==='string'&&Object.hasOwn(actionKeys,action);}
export function preparePostgresqlDataRequest(action:unknown,input:unknown):DataRequest{
 if(!isPostgresqlDataAction(action)||!object(input)||Object.keys(input).some(key=>!actionKeys[action].includes(key)))throw Object.assign(Error('PostgreSQL 데이터 요청을 확인하세요.'),{status:400});
 const path=preparePostgresqlBackupLookup(input.path).path;if(!path)throw Object.assign(Error('PostgreSQL 클러스터를 선택하세요.'),{status:400});
 if(['backup','plan','restore'].includes(action)&&(typeof input.database!=='string'||!input.database||Buffer.byteLength(input.database)>63||/[\x00-\x1f\x7f]/.test(input.database)||typeof input.reviewVersion!=='string'||! /^[a-f0-9]{64}$/.test(input.reviewVersion)))throw Object.assign(Error('데이터베이스를 다시 검토하세요.'),{status:400});
 if(['backup','restore'].includes(action)&&input.confirm!==true)throw Object.assign(Error('데이터 작업을 확인하세요.'),{status:400});
 if(['plan','restore'].includes(action)&&(typeof input.id!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(input.id)))throw Object.assign(Error('데이터 백업 ID를 확인하세요.'),{status:400});
 if(action==='restore'&&(typeof input.sha256!=='string'||! /^[a-f0-9]{64}$/.test(input.sha256)||typeof input.bytes!=='number'||!Number.isSafeInteger(input.bytes)||input.bytes<5||input.confirmation!==input.database))throw Object.assign(Error('복원할 데이터베이스 이름을 입력하고 다시 검토하세요.'),{status:400});
 return {...input,path};
}
function verifiedService(value:unknown):value is DataService{return object(value)&&value.identityVerified===true&&value.settingsSource==='running-server'&&typeof value.config==='string'&&typeof value.major==='number'&&Number.isInteger(value.major)&&value.major>=15&&value.major<=99&&typeof value.pid==='number'&&Number.isSafeInteger(value.pid)&&value.pid>0&&typeof value.start==='string'&&typeof value.socket==='string'&&typeof value.port==='number'&&Number.isInteger(value.port)&&value.port>=1&&value.port<=65535;}
// Injectable dependencies are helper-owned. JSON requests never supply them.
export async function inspectPostgresqlDataContext(path:unknown,{inspect=inspectPostgresqlHbaService,identity=inspectPostgresqlHbaIdentity,run=native}:DataContextDependencies={}){
 const main=preparePostgresqlBackupLookup(path).path;if(!main)fail();const service=await inspect(main.replace(/postgresql\.conf$/,'pg_hba.conf'));if(!verifiedService(service)||service.config!==main)fail();await identity(service);
 const args=['-u','postgres','--','/usr/lib/postgresql/'+service.major+'/bin/psql','--no-psqlrc','--no-password','--host='+service.socket,'--port='+service.port,'--username=postgres','--dbname=postgres','--tuples-only','--no-align','--set=ON_ERROR_STOP=1','--command='+query];
 const data=catalog(output(await run('/usr/sbin/runuser',args)));await identity(service);const account={uid:0,gid:0};for(const [flag,key] of [['-u','uid'],['-g','gid']] as const){const value=output(await run('/usr/bin/id',[flag,'postgres']));if(!/^[1-9][0-9]*$/.test(value)||!Number.isSafeInteger(Number(value)))fail();account[key]=Number(value);}
 const reviewVersion=createHash('sha256').update(JSON.stringify({path:main,pid:service.pid,start:service.start,socket:service.socket,port:service.port,major:service.major,...data,...account})).digest('hex');
 return {path:main,service,databases:data.databases,reviewVersion,systemIdentifier:data.systemIdentifier,...account};
}
export async function postgresqlDataExecutorContext(input:DataRequest,dependencies:DataContextDependencies={}){const review=await inspectPostgresqlDataContext(input.path,dependencies);if(review.reviewVersion!==input.reviewVersion)fail();const database=review.databases.find(item=>item.name===input.database);if(!database)fail();const context:PostgresqlDataContext={version:String(review.service.major),socket:review.service.socket,port:review.service.port,uid:review.uid,gid:review.gid,database:database.name,databaseOid:database.oid,systemIdentifier:review.systemIdentifier};const assertCurrent=async()=>{const current=await inspectPostgresqlDataContext(input.path,dependencies);if(current.reviewVersion!==review.reviewVersion)fail();};return {context,assertCurrent,review};}
