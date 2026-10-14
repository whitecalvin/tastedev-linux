import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,writeFile,appendFile,rename,symlink,rm} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';import {readAuditLogPage} from '../lib/audit-log-page.ts';
const line=index=>JSON.stringify({at:'2026-10-05T00:00:00Z',action:'작업-'+index,result:'completed',secret:'omit'})+'\n';
test('audit cursor covers all older records exactly once, retains UTF-8 and excludes appends from the snapshot',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','audit-page-')),file=join(root,'audit.jsonl');try{
  await writeFile(file,Array.from({length:375},(_,i)=>line(i)).join(''));let page=await readAuditLogPage(file);assert.equal(page.events.length,100);assert.equal(page.events[0].action,'작업-275');assert.equal(page.events[0].secret,undefined);
  const headCursor=page.cursor;await appendFile(file,line(375));assert.deepEqual((await readAuditLogPage(file,headCursor)).events,page.events,'back navigation must retain the original head snapshot after append');const events=[...page.events];let count=1;while(page.nextCursor){page=await readAuditLogPage(file,page.nextCursor);assert(page.events.length<=100);events.unshift(...page.events);assert(++count<10);}
  assert.deepEqual(events.map(event=>event.action),Array.from({length:375},(_,i)=>'작업-'+i));assert.equal((await readAuditLogPage(file)).events.at(-1).action,'작업-375');
 }finally{await rm(root,{recursive:true,force:true});}
});
test('audit paging bounds oversized records and strips malformed or private data',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','audit-page-')),file=join(root,'audit.jsonl');try{
  await writeFile(file,line(0)+'x'.repeat(700000)+'\n'+line(1));let page=await readAuditLogPage(file),seen=[...page.events],skipped=page.skipped,count=1;while(page.nextCursor){page=await readAuditLogPage(file,page.nextCursor);seen.unshift(...page.events);skipped||=page.skipped;assert(++count<10);}
  assert.deepEqual(seen.map(event=>event.action),['작업-0','작업-1']);assert(skipped);
  await writeFile(file,'broken\n'+line(2)+'{"partial":');page=await readAuditLogPage(file);assert.equal(page.events.length,1);assert(page.skipped);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('audit cursor rejects replacement, truncation, boundary mutation, malformed tokens and file links',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','audit-page-')),file=join(root,'audit.jsonl'),text=Array.from({length:120},(_,i)=>line(i)).join('');try{
  assert.deepEqual(await readAuditLogPage(file),{events:[],nextCursor:null,cursor:null,skipped:false});await writeFile(file,text);const first=await readAuditLogPage(file);
  for(const token of ['', '!',Buffer.from('{}').toString('base64url')])await assert.rejects(()=>readAuditLogPage(file,token),error=>error.status===400);
  await writeFile(file,text.replace('작업-19','변경-19'));await assert.rejects(()=>readAuditLogPage(file,first.nextCursor),error=>error.status===409);
  await writeFile(file,line(0));await assert.rejects(()=>readAuditLogPage(file,first.nextCursor),error=>error.status===409);
  await rename(file,join(root,'old'));await writeFile(file,text);await assert.rejects(()=>readAuditLogPage(file,first.nextCursor),error=>error.status===409);
  await rm(file);await symlink(join(root,'old'),file);await assert.rejects(()=>readAuditLogPage(file));
 }finally{await rm(root,{recursive:true,force:true});}
});
