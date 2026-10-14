import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {configTransaction} from '../lib/config-transaction.ts';
const require=createRequire(import.meta.url);
async function fixture(run){
 const root=fs.mkdtempSync('/mnt/data/build/tastedev-linux/tastedev-redis-first-'),base='/var/lib/linux/admin';
 fs.mkdirSync(root+base,{recursive:true,mode:0o700});
 const source=fs.readFileSync(new URL('../scripts/admin/linux-admin',import.meta.url),'utf8').replace(/^#!.*\n/,'').split('main().catch')[0];
 // Root-owned filesystem metadata is an explicit fixture dependency.
 let uid=0;const fake=new Proxy(fs,{get(object,key){
  if(key==='lstatSync')return name=>{const st=object.lstatSync(root+name);st.uid=uid;return st;};
  if(key==='mkdirSync')return (name,...args)=>object.mkdirSync(root+name,...args);
  return object[key];
 }});
 const context=vm.createContext({require:name=>name==='node:fs'?fake:require(name),process,Buffer});vm.runInContext(source,context);
 try{return await run({root,base,context,setUid:value=>uid=value});}finally{fs.rmSync(root,{recursive:true,force:true});}
}
test('first Redis mutation prepares a private backup directory and preserves existing contents',()=>fixture(({root,base,context})=>{
 assert.equal(fs.existsSync(root+base+'/redis'),false);
 assert.equal(vm.runInContext('redisBackupRoot()',context),base+'/redis');
 assert.equal(fs.statSync(root+base+'/redis').mode&0o777,0o700);
 fs.writeFileSync(root+base+'/redis/marker','preserved');
 vm.runInContext('redisBackupRoot()',context);assert.equal(fs.readFileSync(root+base+'/redis/marker','utf8'),'preserved');
}));
test('both real helper apply dispatch branches prepare backup storage before invoking the coordinator',()=>fixture(async({root,base,context})=>{
 const calls=[];
 context.runtimeFixture={
  applyRedisCodeOperation:async(input,options)=>{calls.push(['code',options.backupRoot]);assert.equal(fs.statSync(root+options.backupRoot).mode&0o777,0o700);return {changed:true};},
  applyReviewedRedis:async(input,options)=>{calls.push(['settings',options.backupRoot]);assert.equal(fs.statSync(root+options.backupRoot).mode&0o777,0o700);return {changed:true};},
  redisConfigHooks:()=>({}),
 };
 vm.runInContext('mariaRuntime=async()=>runtimeFixture',context);
 await vm.runInContext("dispatch('redis-code-apply',{})",context);
 fs.rmdirSync(root+base+'/redis');
 await vm.runInContext("dispatch('redis-config-apply',{changes:{}})",context);
 assert.deepEqual(calls,[['code',base+'/redis'],['settings',base+'/redis']]);
 fs.chmodSync(root+base+'/redis',0o755);
 await assert.rejects(vm.runInContext("dispatch('redis-code-apply',{})",context),/private/);
 assert.equal(calls.length,2);
}));
test('Redis backup preparation rejects public, symlink and wrong-owner paths without repairing them',()=>fixture(({root,base,context,setUid})=>{
 const dir=root+base+'/redis';fs.mkdirSync(dir,{mode:0o755});
 assert.throws(()=>vm.runInContext('redisBackupRoot()',context),/private/);assert.equal(fs.statSync(dir).mode&0o777,0o755);fs.rmdirSync(dir);
 fs.mkdirSync(root+'/other',{mode:0o700});fs.symlinkSync(root+'/other',dir);
 assert.throws(()=>vm.runInContext('redisBackupRoot()',context),/root-owned/);assert(fs.lstatSync(dir).isSymbolicLink());fs.unlinkSync(dir);
 setUid(1000);assert.throws(()=>vm.runInContext('redisBackupRoot()',context),/root-owned/);assert.equal(fs.existsSync(dir),false);
}));
test('unprepared first configuration transaction fails before activation; prepared directory preserves original backup',async()=>{
 const root=fs.mkdtempSync('/mnt/data/build/tastedev-linux/tastedev-redis-first-transaction-'),file=root+'/redis.conf',backupRoot=root+'/backups',original='maxclients 100\n';
 fs.writeFileSync(file,original,{mode:0o600});let activations=0;
 const request={file,backupRoot,version:createHash('sha256').update(original).digest('hex'),transform:async()=> 'maxclients 123\n',validate:async()=>{},activate:async()=>{activations++;},recover:async()=>{}};
 try{
  await assert.rejects(configTransaction(request),error=>error.code==='ENOENT');
  assert.equal(activations,0);assert.equal(fs.readFileSync(file,'utf8'),original);
  // Production backup preparation creates this exact private directory shape.
  fs.mkdirSync(backupRoot,{mode:0o700});
  const result=await configTransaction(request);assert.equal(result.changed,true);assert.equal(activations,1);
  const backup=JSON.parse(fs.readFileSync(backupRoot+'/'+result.backupId+'.json','utf8'));assert.equal(backup.text,original);assert.equal(fs.statSync(backupRoot+'/'+result.backupId+'.json').mode&0o777,0o600);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
