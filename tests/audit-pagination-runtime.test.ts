import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';

test('Node22 audit pagination verifier covers actual private log pages and restores bytes on failure',async()=>{
 const root=await verificationWorkDirectory('audit-pagination-runtime-');
 try{
  const files=['scripts/verification/audit-pagination.mjs','lib/audit-log-page.mjs','lib/error-code.mjs'];
  for(const file of files){await mkdir(join(root,file,'..'),{recursive:true,mode:0o700});await writeFile(join(root,file),await readRuntimeModule(file,files),{mode:0o600});}
  await writeFile(join(root,'worker.mjs'),`import assert from 'node:assert/strict';import {writeFile,readFile,stat} from 'node:fs/promises';import {join} from 'node:path';import {verifyAuditPagination} from './scripts/verification/audit-pagination.mjs';import {readAuditLogPage} from './lib/audit-log-page.mjs';const file=join(process.cwd(),'audit.jsonl'),original='original-private-bytes\\n';await writeFile(file,original,{mode:0o600});const authGet=async route=>{const url=new URL(route,'http://fixture.local');try{return Response.json(await readAuditLogPage(file,url.searchParams.has('cursor')?url.searchParams.get('cursor'):null),{headers:{'cache-control':'no-store'}});}catch(error){return Response.json({error:'fixture'},{status:error.status});}};const get=async()=>Response.json({error:'unauthorized'},{status:401});assert((await verifyAuditPagination({file,authGet,get})).includes('bounded 100-record pages'));assert.equal(await readFile(file,'utf8'),original);await assert.rejects(verifyAuditPagination({file,authGet:async()=>Response.json({events:'invalid'},{headers:{'cache-control':'no-store'}}),get}),/Invalid audit page/);assert.equal(await readFile(file,'utf8'),original);const missing=join(process.cwd(),'missing.jsonl');await assert.rejects(verifyAuditPagination({file:missing,authGet,get:async()=>Response.json({},{status:200})}));await assert.rejects(stat(missing),{code:'ENOENT'});console.log('AUDIT_RUNTIME_PASS');`,{mode:0o600});
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types','worker.mjs'],{cwd:root,env:process.env,encoding:'utf8',timeout:30000});assert.equal(result.status,0,result.stderr);assert(result.stdout.includes('AUDIT_RUNTIME_PASS'));
 }finally{await rm(root,{recursive:true,force:true});}
});
