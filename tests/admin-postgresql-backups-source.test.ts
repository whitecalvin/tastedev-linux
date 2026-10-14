import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {adminPostgresqlBackupsSource,assertAdminPostgresqlBackupsCurrent} from '../scripts/admin/error-output-source.mts';

async function fixture(){
 const base='/fixture',dir=base+'/postgresql',target='/etc/postgresql/16/main/postgresql.conf';
 const files=new Map<string,string>(),metadata=new Map<string,Record<string,unknown>>();let recovered=0;
 const hash=(text:string)=>createHash('sha256').update(text).digest('hex');
 const context=vm.createContext({Buffer,path,BASE:base,hash,fail(message:string){throw Error(message);},rootDir(){},fs:{
  lstatSync(file:string){return {isFile:()=>true,isSymbolicLink:()=>false,nlink:1,uid:0,mode:0o600,size:100,...(file===dir?{mode:0o700}:metadata.get(file))};},
  readFileSync(file:string){const content=files.get(file);assert(content!==undefined);return content;},
  readdirSync(){return [...files.keys()].map(file=>path.basename(file));}
 },pgRead(){return {text:"port = 5433\npassword = 'fixture-private'\n",version:'b'.repeat(64)};},
  async mariaRuntime(){return {async postgresqlRecoveryBackup(id:string){recovered++;return JSON.parse(files.get(dir+'/'+id+'.json')??'null');}};}
 });
 vm.runInContext(await adminPostgresqlBackupsSource(),context);
 function add(index:number,extra:Record<string,unknown>={}){
  const id='11111111-1111-4111-8111-'+index.toString().padStart(12,'0'),text="port = 5432\npassword = 'fixture-private'\n";
  const record={id,kind:'postgresql',target,text,version:hash(text),createdAt:new Date(1700000000000+index*1000).toISOString(),...extra};
  files.set(dir+'/'+id+'.json',JSON.stringify(record));return {id,record,file:dir+'/'+id+'.json'};
 }
 function invoke(name:string,...args:unknown[]):unknown{return vm.runInContext(name+'('+args.map(arg=>JSON.stringify(arg)).join(',')+')',context);}
 return {add,invoke,files,metadata,target,recovered:()=>recovered};
}

test('PostgreSQL backup helper exactly matches standalone TypeScript output',async()=>{
 await assertAdminPostgresqlBackupsCurrent();assert(!/\b(?:export|import)\s/.test(await adminPostgresqlBackupsSource()));
});

test('typed PostgreSQL backup rejects malformed, altered and unsafe records',async()=>{
 const f=await fixture(),item=f.add(1);assert.deepEqual(JSON.parse(JSON.stringify(f.invoke('pgBackupRecord',item.id))),item.record);
 for(const value of [null,[],{...item.record,id:'other'},{...item.record,text:1},{...item.record,text:'secret\0'},{...item.record,version:'altered'},{...item.record,target:'/etc/shadow'},{...item.record,createdAt:'invalid'}]){
  f.files.set(item.file,JSON.stringify(value));assert.throws(()=>f.invoke('pgBackupRecord',item.id),/Invalid PostgreSQL backup/);
 }
 f.files.set(item.file,JSON.stringify(item.record));
 for(const patch of [{nlink:2},{uid:1000},{mode:0o644},{size:2097153},{isSymbolicLink:()=>true},{isFile:()=>false}]){
  f.metadata.set(item.file,patch);assert.throws(()=>f.invoke('pgBackupRecord',item.id),/Unsafe PostgreSQL backup/);
 }
 assert.throws(()=>f.invoke('pgBackupRecord','../outside'),/backup ID/);
});

test('typed PostgreSQL restore plan exposes only supported fields and checks the immutable backup version',async()=>{
 const f=await fixture(),item=f.add(1,{context:{version:1}});
 const plan:unknown=f.invoke('pgRestorePlan',{id:item.id});
 assert(plan!==null&&typeof plan==='object'&&'codeRestoreAvailable' in plan);assert.equal(plan.codeRestoreAvailable,true);
 assert(!JSON.stringify(plan).includes('fixture-private'));
 assert.throws(()=>f.invoke('pgRestore',{id:item.id,confirm:false,backupVersion:item.record.version}),/confirmation/);
 assert.throws(()=>f.invoke('pgRestore',{id:item.id,confirm:true,backupVersion:'altered'}),/backup changed/);
 assert.deepEqual(JSON.parse(JSON.stringify(f.invoke('pgPublicValues',"password = 'secret'\nport = 5432\nport = nonsense\nlogging_collector = ON\nwork_mem = '8MB'\n"))),{logging_collector:'on',work_mem:'8MB'});
});

test('typed catalog sorts and bounds results, counts invalid records and validates linked recovery records',async()=>{
 const f=await fixture();for(let index=1;index<=1001;index++)f.add(index);
 const invalid=f.add(2,{version:'altered'}),linked=f.add(3);f.metadata.set(linked.file,{nlink:2});
 const output:unknown=await f.invoke('pgBackups',{});
 assert(output!==null&&typeof output==='object'&&'backups' in output&&Array.isArray(output.backups)&&'warnings' in output&&'truncated' in output);
 assert.equal(output.backups.length,100);assert.equal(output.warnings,1);assert.equal(output.truncated,true);assert.equal(f.recovered(),1);
 assert(!JSON.stringify(output).includes('fixture-private'));
 assert(!JSON.stringify(output).includes(invalid.id));
 assert.deepEqual(JSON.parse(JSON.stringify(output.backups[0])),{id:'11111111-1111-4111-8111-000000001000',kind:'postgresql',target:f.target,createdAt:new Date(1700001000000).toISOString(),bytes:Buffer.byteLength("port = 5432\npassword = 'fixture-private'\n"),version:createHash('sha256').update("port = 5432\npassword = 'fixture-private'\n").digest('hex')});
 const filtered:unknown=await f.invoke('pgBackups',{path:'/etc/postgresql/16/other/postgresql.conf'});
 assert(filtered!==null&&typeof filtered==='object'&&'backups' in filtered&&Array.isArray(filtered.backups));assert.equal(filtered.backups.length,0);
});
