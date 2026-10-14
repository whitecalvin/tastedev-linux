import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {nginxSiteRecoveryPlan} from '../lib/nginx-site-operation.ts';

test('site pending record validates unknown JSON and exposes only recovery metadata',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','nginx-site-record-')),file=join(root,'pending.json');
 try{
  const record={kind:'nginx-site-v1',id:randomUUID(),path:'/etc/nginx/sites-available/example',link:'/etc/nginx/sites-enabled/example',enabled:true,sourceVersion:'a'.repeat(64),graphVersion:'b'.repeat(64),beforeTarget:'private-original-link',phase:'changed'};
  await writeFile(file,JSON.stringify(record),{mode:0o600});
  const result=await nginxSiteRecoveryPlan({backupRoot:root});assert.equal(result.recoveryRequired,true);assert(!JSON.stringify(result).includes(record.beforeTarget));assert(!Object.hasOwn(result,'sourceVersion'));
  for(const invalid of [null,[],{...record,enabled:'true'},{...record,path:'/etc/passwd'},{...record,phase:'done'},{...record,sourceVersion:0},{...record,id:null},{...record,beforeTarget:{}},{...record,link:123}]){
   await writeFile(file,JSON.stringify(invalid));await assert.rejects(nginxSiteRecoveryPlan({backupRoot:root}),{status:409});
  }
 }finally{await rm(root,{recursive:true,force:true});}
});
