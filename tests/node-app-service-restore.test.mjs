import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {nodeAppUnit} from '../lib/node-app-unit.ts';
import {nodeServiceRestorePlan,restoreNodeAppService} from '../lib/node-app-service-restore.ts';
const profile={id:'fixture',label:'Fixture',directory:'/srv/fixture',entry:'server.js',environmentFile:'.env'},digest=text=>createHash('sha256').update(text).digest('hex');
async function fixture(fn){
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','tastedev-service-restore-'));
 try{const directory=path.join(root,'units'),backupRoot=path.join(root,'backups');await mkdir(directory,{mode:0o700});await mkdir(backupRoot,{mode:0o700});
 const original='# Managed by Tastedev Linux\n'+nodeAppUnit(profile,1000,{restart:'always',restartSeconds:30}),saved='# Managed by Tastedev Linux\n'+nodeAppUnit(profile,1000),file=path.join(directory,'tastedev-node-fixture.service'),backupId=randomUUID(),record={id:backupId,target:'/etc/systemd/system/tastedev-node-fixture.service',text:saved,version:digest(saved),createdAt:new Date().toISOString()},backupFile=path.join(backupRoot,backupId+'.json');
 await writeFile(file,original,{mode:0o644});await writeFile(backupFile,JSON.stringify(record),{mode:0o600});
 await fn({file,backupFile,record,original,saved,input:{uid:1000,profile,confirm:true,unitVersion:digest(original),backupId,backupVersion:record.version},hooks:{callerUid:1000,directory,backupRoot,ownerUid:process.getuid(),verifyContext:async()=>{},validateUnit:async()=>{},reloadManager:async()=>{}}});
 }finally{await rm(root,{recursive:true,force:true});}
}
test('Node service restoration uses selected options and creates undo backup',async()=>fixture(async({file,original,saved,input,hooks})=>{
 const result=await restoreNodeAppService(input,hooks);assert.equal(result.changed,true);assert.equal(result.restarted,false);assert.equal(result.restoredBackupId,input.backupId);assert.equal(await readFile(file,'utf8'),saved);
 const undo=JSON.parse(await readFile(path.join(hooks.backupRoot,result.backupId+'.json'),'utf8'));assert.equal(undo.text,original);
}));
test('Node restoration rejects missing confirmation, stale unit and changed selected backup',async()=>fixture(async({file,backupFile,record,original,input,hooks})=>{
 await assert.rejects(restoreNodeAppService({...input,confirm:false},hooks),{status:400});await assert.rejects(restoreNodeAppService({...input,unitVersion:'a'.repeat(64)},hooks),{status:409});await assert.rejects(restoreNodeAppService({...input,backupVersion:'a'.repeat(64)},hooks),{status:409});
 await assert.rejects(restoreNodeAppService(input,{...hooks,validateUnit:async()=>{await writeFile(backupFile,JSON.stringify({...record,createdAt:'2020-01-01T00:00:00Z'}));}}),{status:409});assert.equal(await readFile(file,'utf8'),original);
}));
test('Node restoration rolls back failed reload without discarding concurrent edits',async()=>fixture(async({file,original,input,hooks})=>{
 let reloads=0;const reverted=await restoreNodeAppService(input,{...hooks,reloadManager:async()=>{if(++reloads===1)throw Error('fixture');}});assert.equal(reverted.restored,true);assert.equal(reverted.recovered,true);assert.equal(await readFile(file,'utf8'),original);
 const changed=await restoreNodeAppService(input,{...hooks,reloadManager:async()=>{await writeFile(file,'administrator edit');throw Error('fixture');}});assert.equal(changed.restored,false);assert.equal(await readFile(file,'utf8'),'administrator edit');
}));

test('Node restore review returns only bounded comparison metadata and detects live changes',async()=>fixture(async({input,hooks,original,backupFile,record})=>{
 const options={...hooks,readUnit:async()=>original};const plan=await nodeServiceRestorePlan(input,options);assert.equal(plan.unitVersion,input.unitVersion);assert.equal(plan.backupVersion,input.backupVersion);assert.equal(plan.currentOptions.restart,'always');assert.equal(plan.serviceOptions.restart,'on-failure');assert(!Object.hasOwn(plan,'text'));assert(!JSON.stringify(plan).includes('/srv/fixture'));
 let reads=0;await assert.rejects(nodeServiceRestorePlan(input,{...hooks,readUnit:async()=>++reads<3?original:original+'# changed\n'}),{status:409});
 await assert.rejects(nodeServiceRestorePlan(input,{...hooks,readUnit:async()=>{await writeFile(backupFile,JSON.stringify({...record,createdAt:'2020-01-01T00:00:00Z'}));return original;}}),{status:409});
}));
