import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
function fixture(run){
 const root=fs.mkdtempSync('/mnt/data/build/tastedev-linux/tastedev-maria-first-'),base='/var/lib/linux/admin';
 fs.mkdirSync(root+base,{recursive:true,mode:0o700});
 const source=fs.readFileSync(new URL('../scripts/admin/linux-admin',import.meta.url),'utf8').replace(/^#!.*\n/,'').split('main().catch')[0];
 // Root-owned filesystem metadata is an explicit fixture dependency.
 let uid=0;const fake=new Proxy(fs,{get(object,key){
  if(key==='lstatSync')return name=>{const st=object.lstatSync(root+name);st.uid=uid;return st;};
  if(key==='mkdirSync')return (name,...args)=>object.mkdirSync(root+name,...args);
  return object[key];
 }});
 const context=vm.createContext({require:name=>name==='node:fs'?fake:require(name),process,Buffer});vm.runInContext(source,context);
 try{return run({root,base,context,setUid:value=>uid=value});}finally{fs.rmSync(root,{recursive:true,force:true});}
}
test('first MariaDB mutation prepares a private backup directory and preserves existing contents',()=>fixture(({root,base,context})=>{
 assert.equal(fs.existsSync(root+base+'/mariadb'),false);
 assert.equal(vm.runInContext('mariaBackupRoot()',context),base+'/mariadb');
 assert.equal(fs.statSync(root+base+'/mariadb').mode&0o777,0o700);
 fs.writeFileSync(root+base+'/mariadb/marker','preserved');
 vm.runInContext('mariaBackupRoot()',context);assert.equal(fs.readFileSync(root+base+'/mariadb/marker','utf8'),'preserved');
}));
test('MariaDB backup preparation rejects public, symlink and wrong-owner paths without repairing them',()=>fixture(({root,base,context,setUid})=>{
 const dir=root+base+'/mariadb';fs.mkdirSync(dir,{mode:0o755});
 assert.throws(()=>vm.runInContext('mariaBackupRoot()',context),/private/);assert.equal(fs.statSync(dir).mode&0o777,0o755);fs.rmdirSync(dir);
 fs.mkdirSync(root+'/other',{mode:0o700});fs.symlinkSync(root+'/other',dir);
 assert.throws(()=>vm.runInContext('mariaBackupRoot()',context),/root-owned/);assert(fs.lstatSync(dir).isSymbolicLink());fs.unlinkSync(dir);
 setUid(1000);assert.throws(()=>vm.runInContext('mariaBackupRoot()',context),/root-owned/);assert.equal(fs.existsSync(dir),false);
}));
