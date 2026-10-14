import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,readdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {installNodeAppService} from '../lib/node-app-service-install.ts';
const profile={id:'fixture',label:'Fixture',directory:'/srv/fixture',entry:'server.js',environmentFile:'.env'};
const input={confirm:true,profile,uid:1000,options:{restart:'always',restartSeconds:30,stopSeconds:60}};
async function fixture(fn){const directory=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','tastedev-unit-'));try{await fn(directory);}finally{await rm(directory,{recursive:true,force:true});}}
function hooks(directory,overrides={}){return {directory,ownerUid:process.getuid(),verifyContext:async()=>{},validateUnit:async()=>{},reloadManager:async()=>{},...overrides};}
test('Node service installation creates a new unit without starting or enabling a service',async()=>fixture(async directory=>{
 let validations=0,reloads=0;const result=await installNodeAppService(input,hooks(directory,{validateUnit:async candidate=>{validations++;assert((await readFile(candidate,'utf8')).includes('TimeoutStopSec=60'));},reloadManager:async()=>{reloads++;}}));
 assert.equal(result.installed,true);assert.equal(result.started,false);assert.equal(result.enabled,false);assert.equal(validations,1);assert.equal(reloads,1);assert.deepEqual(await readdir(directory),[profile.unit??'tastedev-node-fixture.service']);
 await assert.rejects(installNodeAppService(input,hooks(directory)),{status:409});
}));
test('Node candidate mutation or existing unit prevents installation and manager reload',async()=>fixture(async directory=>{
 let reloads=0;await assert.rejects(installNodeAppService(input,hooks(directory,{validateUnit:async candidate=>writeFile(candidate,'tampered'),reloadManager:async()=>{reloads++;}})),{status:409});assert.equal(reloads,0);assert.deepEqual(await readdir(directory),[]);
 await writeFile(path.join(directory,'tastedev-node-fixture.service'),'existing');await assert.rejects(installNodeAppService(input,hooks(directory)),{status:409});assert.equal(await readFile(path.join(directory,'tastedev-node-fixture.service'),'utf8'),'existing');
}));
test('Node manager reload failure removes own new unit but preserves concurrent replacement',async()=>fixture(async directory=>{
 let reloads=0;const failed=await installNodeAppService(input,hooks(directory,{reloadManager:async()=>{if(++reloads===1)throw Error('Fixture failure');}}));assert.equal(failed.removed,true);assert.equal(failed.reloaded,true);assert.equal(failed.manualRecovery,false);assert.deepEqual(await readdir(directory),[]);
 const file=path.join(directory,'tastedev-node-fixture.service');const changed=await installNodeAppService(input,hooks(directory,{reloadManager:async()=>{await writeFile(file,'administrator edit');throw Error('Fixture failure');}}));assert.equal(changed.removed,false);assert.equal(changed.manualRecovery,true);assert.equal(await readFile(file,'utf8'),'administrator edit');
}));
test('Node install rejects missing native hooks and root application account',async()=>{
 await assert.rejects(installNodeAppService(input),{status:400});await assert.rejects(installNodeAppService({...input,uid:0},hooks('/unused')),{status:400});
});
