import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {nodeAppUnit} from '../lib/node-app-unit.ts';
import {updateNodeAppService} from '../lib/node-app-service-update.ts';
const profile={id:'fixture',label:'Fixture',directory:'/srv/fixture',entry:'server.js',environmentFile:'.env'};
const original='# Managed by Tastedev Linux\n'+nodeAppUnit(profile,1000);
const version=createHash('sha256').update(original).digest('hex');
async function fixture(fn){
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','tastedev-unit-update-')),directory=path.join(root,'units'),backupRoot=path.join(root,'backups');
 try{await mkdir(directory,{mode:0o700});await mkdir(backupRoot,{mode:0o700});const file=path.join(directory,'tastedev-node-fixture.service');await writeFile(file,original,{mode:0o644});
  await fn({file,backupRoot,input:{confirm:true,profile,uid:1000,unitVersion:version,options:{restart:'always',restartSeconds:30,stopSeconds:60}},hooks:{directory,backupRoot,callerUid:1000,verifyContext:async()=>{},validateUnit:async()=>{},reloadManager:async()=>{}}});
 }finally{await rm(root,{recursive:true,force:true});}
}
test('Node service update backs up reviewed unit and changes settings without restart',async()=>fixture(async({file,backupRoot,input,hooks})=>{
 let reloads=0;const result=await updateNodeAppService(input,{...hooks,validateUnit:async candidate=>{assert.equal(path.extname(candidate),'.service');},reloadManager:async()=>{reloads++;}});
 assert.equal(result.changed,true);assert.equal(result.restarted,false);assert.equal(reloads,1);assert.match(await readFile(file,'utf8'),/Restart=always\nRestartSec=30\nTimeoutStopSec=60/);
 const backup=path.join(backupRoot,result.backupId+'.json');assert.equal(JSON.parse(await readFile(backup,'utf8')).text,original);assert.equal((await stat(backup)).mode&0o777,0o600);
}));
test('Node service update refuses stale versions, unreviewed units, and mutated candidates',async()=>fixture(async({file,backupRoot,input,hooks})=>{
 await assert.rejects(updateNodeAppService({...input,unitVersion:'0'.repeat(64)},hooks),{status:409});
 await assert.rejects(updateNodeAppService(input,{...hooks,validateUnit:async candidate=>writeFile(candidate,'tampered')}),{status:409});
 assert.equal(await readFile(file,'utf8'),original);assert.deepEqual(await readdir(backupRoot),[]);
 const changed=original+'ExecStop=/usr/bin/false\n';await writeFile(file,changed);
 await assert.rejects(updateNodeAppService({...input,unitVersion:createHash('sha256').update(changed).digest('hex')},hooks),{status:409});
}));
test('Node service update restores original on reload failure and preserves concurrent edits',async()=>fixture(async({file,input,hooks})=>{
 let calls=0;const restored=await updateNodeAppService(input,{...hooks,reloadManager:async()=>{if(++calls===1)throw Error('fixture');}});
 assert.equal(restored.restored,true);assert.equal(restored.recovered,true);assert.equal(await readFile(file,'utf8'),original);
 const concurrent=await updateNodeAppService(input,{...hooks,reloadManager:async()=>{await writeFile(file,'administrator edit');throw Error('fixture');}});
 assert.equal(concurrent.restored,false);assert.equal(await readFile(file,'utf8'),'administrator edit');
}));
test('Node service update requires confirmation, native hooks and matching caller',async()=>fixture(async({input,hooks})=>{
 await assert.rejects(updateNodeAppService({...input,confirm:false},hooks),{status:400});
 await assert.rejects(updateNodeAppService(input,{...hooks,validateUnit:null}),{status:400});
 await assert.rejects(updateNodeAppService({...input,uid:0},hooks),{status:403});
}));
