import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,chmod,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {nodeAppUnit} from '../lib/node-app-unit.ts';
import {nodeServiceBackups,nodeServiceBackupRecord} from '../lib/node-app-service-backups.ts';
const profile={id:'fixture',label:'Fixture',directory:'/srv/fixture',entry:'server.js',environmentFile:'.env'},input={uid:1000,profile};
async function fixture(fn){const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','tastedev-service-backups-'));try{await fn({root,ownerUid:process.getuid(),callerUid:1000});}finally{await rm(root,{recursive:true,force:true});}}
function record(patch={}){const text='# Managed by Tastedev Linux\n'+nodeAppUnit(profile,1000);return {id:randomUUID(),target:'/etc/systemd/system/tastedev-node-fixture.service',text,version:createHash('sha256').update(text).digest('hex'),createdAt:new Date().toISOString(),...patch};}
async function save(root,data){await writeFile(path.join(root,data.id+'.json'),JSON.stringify(data),{mode:0o600});}
test('Node service backups expose bounded options without unit source or app paths',async()=>fixture(async options=>{
 const data=record();await save(options.root,data);const list=await nodeServiceBackups(input,options);assert.equal(list.backups.length,1);assert.equal(list.warnings,0);assert.equal(list.backups[0].serviceOptions.restart,'on-failure');assert(!JSON.stringify(list).includes('/srv/fixture'));assert(!Object.hasOwn(list.backups[0],'text'));assert.equal((await nodeServiceBackupRecord(data.id,input,options)).text,data.text);
}));
test('Node service backup reader rejects foreign targets, accounts, corruption and public files',async()=>fixture(async options=>{
 for(const patch of [{target:'/etc/systemd/system/other.service'},{version:'a'.repeat(64)},{text:'extra command'},{createdAt:'invalid'}]){const data=record(patch);await save(options.root,data);await assert.rejects(nodeServiceBackupRecord(data.id,input,options));}
 const data=record();await save(options.root,data);await assert.rejects(nodeServiceBackupRecord(data.id,{...input,uid:0},options));await assert.rejects(nodeServiceBackupRecord(data.id,input,{...options,callerUid:1001}));await chmod(path.join(options.root,data.id+'.json'),0o644);await assert.rejects(nodeServiceBackupRecord(data.id,input,options));
 const id=randomUUID();await symlink(path.join(options.root,data.id+'.json'),path.join(options.root,id+'.json'));await assert.rejects(nodeServiceBackupRecord(id,input,options));const list=await nodeServiceBackups(input,options);assert.equal(list.backups.length,0);assert.equal(list.warnings,6);
}));
