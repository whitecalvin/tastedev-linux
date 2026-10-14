import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {adminNginxConfigSource,adminNginxFilesSource,assertAdminNginxFilesCurrent} from '../scripts/admin/error-output-source.mts';

// File metadata and native calls are explicit adapters, not privileged filesystem evidence.
async function fixture(){
 const id='11111111-1111-4111-8111-111111111111',base='/fixture/backups';
 const writes:{file:string;text:string;options:unknown}[]=[],renames:string[][]=[],removed:string[]=[];
 const files=new Map<string,string>();let patch:Record<string,unknown>={},missing=false,renameError=false;
 const hash=(text:string)=>createHash('sha256').update(text).digest('hex');
 const context=vm.createContext({path,Buffer,createHash,randomUUID:()=>id,BASE:base,MARK:'# Managed by LINUX\n',fail(message:string){throw Error(message);},fs:{
  lstatSync(file:string){if(missing)throw Object.assign(Error('missing'),{code:'ENOENT'});return {isFile:()=>true,isDirectory:()=>file==='/etc/nginx'||file==='/etc/nginx/conf.d',isSymbolicLink:()=>false,uid:0,nlink:1,mode:0o600,size:100,...patch};},
  readFileSync(file:string){const value=files.get(file);if(value===undefined)throw Object.assign(Error('missing'),{code:'ENOENT'});return value;},
  writeFileSync(file:string,text:string,options:unknown){writes.push({file,text,options});files.set(file,text);},
  renameSync(from:string,to:string){if(renameError)throw Error('rename fixture failed');renames.push([from,to]);},
  unlinkSync(file:string){removed.push(file);}
 }});
 vm.runInContext(await adminNginxConfigSource()+await adminNginxFilesSource(),context);
 function invoke(name:string,...args:unknown[]):unknown{return vm.runInContext(name+'('+args.map(arg=>JSON.stringify(arg)).join(',')+')',context);}
 return {invoke,files,writes,renames,removed,id,base,hash,setPatch(value:Record<string,unknown>){patch=value;},setMissing(value:boolean){missing=value;},setRenameError(value:boolean){renameError=value;}};
}

test('helper embeds the exact standalone TypeScript file and backup implementation',async()=>{
 await assertAdminNginxFilesCurrent();
 const source=await adminNginxFilesSource();assert(!/\b(?:export|import)\s/.test(source));
 for(const fn of ['rootDir','target','current','writeConfig','backup','record'])assert(source.includes('function '+fn+'('));
});

test('typed helper rejects unsafe files and directories before reading content',async()=>{
 const f=await fixture(),file='/fixture/site.conf';f.files.set(file,'# Managed by LINUX\nserver {}\n');
 assert.equal(f.invoke('target','APP.EXAMPLE.COM'),'/etc/nginx/conf.d/linux-app.example.com.conf');
 assert.equal(f.invoke('current',file),f.files.get(file));
 for(const patch of [{uid:1000},{mode:0o622},{nlink:2},{size:262145},{isFile:()=>false},{isSymbolicLink:()=>true}]){
  f.setPatch(patch);assert.throws(()=>f.invoke('current',file),/Unsafe config file/);
 }
 for(const patch of [{uid:1000},{mode:0o777},{isDirectory:()=>false},{isSymbolicLink:()=>true}]){
  f.setPatch(patch);assert.throws(()=>f.invoke('rootDir','/etc/nginx'),/root-owned/);
 }
 f.setPatch({});f.setMissing(true);assert.equal(f.invoke('current',file),null);
 f.setMissing(false);f.files.set(file,'unmanaged');assert.throws(()=>f.invoke('current',file),/Not LINUX managed/);
});

test('typed helper keeps exclusive atomic writes and cleans staging after rename failure',async()=>{
 const f=await fixture();f.invoke('writeConfig','/fixture/site.conf','server {}');
 assert.deepEqual(JSON.parse(JSON.stringify(f.writes)),[{file:'/fixture/.linux-'+f.id,text:'server {}',options:{mode:0o644,flag:'wx'}}]);
 assert.deepEqual(f.renames,[['/fixture/.linux-'+f.id,'/fixture/site.conf']]);
 f.setRenameError(true);assert.throws(()=>f.invoke('writeConfig','/fixture/site.conf','new'),/rename fixture failed/);
 assert.deepEqual(f.removed,['/fixture/.linux-'+f.id]);
});

test('typed backup verifies JSON shape, digest, managed target and private regular-file metadata',async()=>{
 const f=await fixture(),target='/etc/nginx/conf.d/linux-app.example.com.conf',text='# Managed by LINUX\nserver {}\n';
 const data:unknown=f.invoke('backup',target,text);
 assert(data!==null&&typeof data==='object'&&'sha256' in data);assert.equal(data.sha256,f.hash(text));
 assert.deepEqual(JSON.parse(JSON.stringify(f.writes[0].options)),{mode:0o600,flag:'wx'});
 const backupFile=f.base+'/'+f.id+'.json',valid=f.files.get(backupFile);assert(valid);
 assert.deepEqual(JSON.parse(JSON.stringify(f.invoke('record',f.id))),JSON.parse(valid));
 for(const value of [null,[],{text:1,target,sha256:f.hash(text)},{text,target:'/etc/shadow',sha256:f.hash(text)},{text,target,sha256:'stale'}]){
  f.files.set(backupFile,JSON.stringify(value));assert.throws(()=>f.invoke('record',f.id),/Invalid backup/);
 }
 f.files.set(backupFile,valid);
 for(const patch of [{uid:1000},{mode:0o622},{nlink:2},{size:2*1024*1024+1},{isFile:()=>false},{isSymbolicLink:()=>true}]){
  f.setPatch(patch);assert.throws(()=>f.invoke('record',f.id),/Unsafe backup/);
 }
 assert.throws(()=>f.invoke('record','../outside'),/Invalid backup ID/);
});
