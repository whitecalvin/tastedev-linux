import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,chmod,symlink,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import {verifyNodeServiceContext,nodeServiceCaller} from '../lib/node-app-service-context.ts';
const digest=value=>createHash('sha256').update(value).digest('hex');
test('Node service caller metadata strictly rejects root and coercion',()=>{assert.equal(nodeServiceCaller('1000'),1000);for(const value of ['0','01','1e3','-1','2147483648',1000,undefined])assert.throws(()=>nodeServiceCaller(value),{status:403});});
test('Node helper context binds account and reviewed file hashes without exposing environment',async()=>{
 const directory=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','node-context-')),uid=process.getuid();
 try{
  const entry='export {};\n',env='PORT=3000\nAPI_KEY=private-fixture-secret\n';await writeFile(path.join(directory,'server.mjs'),entry,{mode:0o600});await writeFile(path.join(directory,'.env'),env,{mode:0o600});
  const input={uid,profile:{id:'fixture',label:'Fixture',directory,entry:'server.mjs',environmentFile:'.env'},files:[{name:'server.mjs',version:digest(entry)},{name:'.env',version:digest(env)}]};
  const result=await verifyNodeServiceContext(input,uid);assert.equal(result.uid,uid);assert.equal(result.unit,'tastedev-node-fixture.service');assert(!JSON.stringify(result).includes('private-fixture-secret'));
  await assert.rejects(verifyNodeServiceContext({...input,uid:uid+1},uid),{status:403});
  await writeFile(path.join(directory,'.env'),'PORT=4000\n');await assert.rejects(verifyNodeServiceContext(input,uid),{status:409});
  await writeFile(path.join(directory,'.env'),env);await chmod(path.join(directory,'.env'),0o644);await assert.rejects(verifyNodeServiceContext(input,uid),{status:403});
  await rm(path.join(directory,'.env'));await symlink('server.mjs',path.join(directory,'.env'));await assert.rejects(verifyNodeServiceContext(input,uid),{status:403});
 }finally{await rm(directory,{recursive:true,force:true});}
});
