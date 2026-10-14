import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import path from 'node:path';
import {constants} from 'node:fs';
import {createHash} from 'node:crypto';
import {adminDatabaseBackupsSource,assertAdminDatabaseBackupsCurrent} from '../scripts/admin/error-output-source.mts';

async function fixture(){
 const id='11111111-1111-4111-8111-111111111111',base='/fixture',text='[mysqld]\nmax_connections=100\n# fixture-private\n';
 const data={id,target:'/etc/mysql/mariadb.conf.d/server.cnf',text,version:createHash('sha256').update(text).digest('hex'),createdAt:'2026-10-01T00:00:00Z'};
 let raw=JSON.stringify(data),patch:Record<string,unknown>={},mode=0o700,mkdirError:string|undefined,rootError:string|undefined;const opened:{file:string;flags:number}[]=[],closed:number[]=[],created:{file:string;options:unknown}[]=[];
 const context=vm.createContext({Buffer,path,BASE:base,hash:(value:string)=>createHash('sha256').update(value).digest('hex'),fail(message:string){throw Error(message);},rootDir(){if(rootError)throw Object.assign(Error(rootError),{code:rootError});},fs:{constants,
  lstatSync(){return {mode};},mkdirSync(file:string,options:unknown){created.push({file,options});if(mkdirError)throw Object.assign(Error(mkdirError),{code:mkdirError});},
  openSync(file:string,flags:number){opened.push({file,flags});return 7;},
  fstatSync(){return {isFile:()=>true,uid:0,nlink:1,mode:0o600,size:100,...patch};},readFileSync(){return raw;},closeSync(fd:number){closed.push(fd);},
  readdirSync(){return [id+'.json','unrelated.txt','../outside.json'];}
 }});
 vm.runInContext(await adminDatabaseBackupsSource(),context);
 function invoke(name:string,...args:unknown[]):unknown{return vm.runInContext(name+'('+args.map(arg=>JSON.stringify(arg)).join(',')+')',context);}
 return {id,data,opened,closed,created,invoke,setRaw(value:string){raw=value;},setPatch(value:Record<string,unknown>){patch=value;},setMode(value:number){mode=value;},setMkdirError(value:string|undefined){mkdirError=value;},setRootError(value:string|undefined){rootError=value;}};
}

test('database backup helper exactly matches compiled TypeScript',async()=>{
 await assertAdminDatabaseBackupsCurrent();assert(!/\b(?:export|import)\s/.test(await adminDatabaseBackupsSource()));
});
test('MariaDB and Redis backup roots require private permissions and preserve non-existence errors',async()=>{
 const f=await fixture();assert.equal(f.invoke('mariaBackupRoot'),'/fixture/mariadb');assert.equal(f.invoke('redisBackupRoot'),'/fixture/redis');
 assert.deepEqual(JSON.parse(JSON.stringify(f.created)),[{file:'/fixture/mariadb',options:{mode:0o700}},{file:'/fixture/redis',options:{mode:0o700}}]);
 f.setMkdirError('EEXIST');assert.equal(f.invoke('mariaBackupRoot'),'/fixture/mariadb');
 f.setMkdirError('EACCES');assert.throws(()=>f.invoke('redisBackupRoot'),/EACCES/);
 f.setMkdirError(undefined);f.setMode(0o755);assert.throws(()=>f.invoke('mariaBackupRoot'),/private/);assert.throws(()=>f.invoke('redisBackupRoot'),/private/);
});
test('MariaDB backup descriptor refuses unsafe metadata and always closes after JSON validation failure',async()=>{
 const f=await fixture();assert.deepEqual(JSON.parse(JSON.stringify(f.invoke('mariaBackupRecord',f.id))),f.data);
 assert.equal(f.opened[0].flags,constants.O_RDONLY|constants.O_NOFOLLOW);assert.deepEqual(f.closed,[7]);
 for(const patch of [{uid:1000},{nlink:2},{mode:0o644},{size:2097153},{isFile:()=>false}]){f.setPatch(patch);assert.throws(()=>f.invoke('mariaBackupRecord',f.id),/Unsafe MariaDB backup/);}
 f.setPatch({});
 for(const value of [null,[],{...f.data,id:'other'},{...f.data,text:1},{...f.data,text:'private\0'},{...f.data,version:'altered'},{...f.data,target:'/etc/shadow'},{...f.data,createdAt:'invalid'}]){f.setRaw(JSON.stringify(value));assert.throws(()=>f.invoke('mariaBackupRecord',f.id),/Invalid MariaDB backup/);}
 f.setRaw('{broken');const before=f.closed.length;assert.throws(()=>f.invoke('mariaBackupRecord',f.id));assert.equal(f.closed.length,before+1);
 const opens=f.opened.length;assert.throws(()=>f.invoke('mariaBackupRecord','../outside'),/backup ID/);assert.equal(f.opened.length,opens);
});
test('MariaDB catalog omits content and counts invalid entries while missing roots return an empty catalog',async()=>{
 const f=await fixture(),result:unknown=f.invoke('mariaBackups');assert(result!==null&&typeof result==='object'&&'backups' in result&&Array.isArray(result.backups));assert.equal(result.backups.length,1);assert(!JSON.stringify(result).includes('fixture-private'));
 f.setRaw('null');assert.deepEqual(JSON.parse(JSON.stringify(f.invoke('mariaBackups'))),{backups:[],warnings:1,truncated:false});
 f.setRootError('ENOENT');assert.deepEqual(JSON.parse(JSON.stringify(f.invoke('mariaBackups'))),{backups:[],warnings:0,truncated:false});
 f.setRootError('EACCES');assert.throws(()=>f.invoke('mariaBackups'),/EACCES/);
});
