import type {AuditLogPage} from '../../lib/audit-log-page.ts';
import {hasErrorCode} from '../../lib/error-code.ts';
import assert from 'node:assert/strict';
import {dirname} from 'node:path';
import {readFile,writeFile,appendFile,unlink,mkdir} from 'node:fs/promises';

// The caller supplies only its private package-verification state directory.
type AuditRequests={file:string;authGet:(route:string)=>Promise<Response>;get:(route:string)=>Promise<Response>};
function isPage(value:unknown):value is AuditLogPage{if(!value||typeof value!=='object'||!('events' in value)||!Array.isArray(value.events))return false;return value.events.every((row:unknown)=>row!==null&&typeof row==='object'&&'at' in row&&typeof row.at==='string'&&'action' in row&&typeof row.action==='string'&&'result' in row&&typeof row.result==='string')&&'cursor' in value&&(value.cursor===null||typeof value.cursor==='string')&&'nextCursor' in value&&(value.nextCursor===null||typeof value.nextCursor==='string')&&'skipped' in value&&typeof value.skipped==='boolean';}
export async function verifyAuditPagination({file,authGet,get}:AuditRequests){
 let original:Buffer|undefined;
 try{original=await readFile(file);}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}
 const line=(index:number)=>JSON.stringify({at:'2026-10-05T00:00:00Z',action:'검증-'+index,result:'completed',secret:'fixture-private-extra'})+'\n';
 try{
  await mkdir(dirname(file),{recursive:true,mode:0o700});
  await writeFile(file,Array.from({length:235},(_,index)=>line(index)).join(''),{mode:0o600});
  assert.equal((await get('/api/audit')).status,401);
  const fetchPage=async(cursor?:string|null)=>{const response=await authGet('/api/audit'+(cursor?'?cursor='+encodeURIComponent(cursor):''));assert.equal(response.status,200);const control=response.headers.get('cache-control');assert(control);assert.match(control,/no-store/);const page:unknown=await response.json();assert(isPage(page),'Invalid audit page');return page;};
  const first=await fetchPage();assert.equal(first.events.length,100);assert.equal(first.events[0].action,'검증-135');assert.equal(first.skipped,false);assert(first.cursor&&first.nextCursor);
  for(const event of first.events)assert.deepEqual(Object.keys(event).sort(),['action','at','result']);
  await appendFile(file,line(235));
  assert.deepEqual((await fetchPage(first.cursor)).events,first.events,'Returning to the head must preserve the original snapshot');
  const all=[...first.events];let page=first,pages=1;
  while(page.nextCursor){page=await fetchPage(page.nextCursor);assert(page.events.length<=100);all.unshift(...page.events);assert(++pages<=3,'Pagination must reach the oldest record');}
  assert.equal(pages,3);assert.deepEqual(all.map(event=>event.action),Array.from({length:235},(_,index)=>'검증-'+index));
  assert.equal((await fetchPage()).events.at(-1)?.action,'검증-235','Refreshing must show appended records');
  for(const token of ['!','',Buffer.from('{}').toString('base64url')])assert.equal((await authGet('/api/audit?cursor='+encodeURIComponent(token))).status,400);
  await writeFile(file,line(0));assert.equal((await authGet('/api/audit?cursor='+encodeURIComponent(first.nextCursor))).status,409);
  return 'authenticated audit HTTP pagination: bounded 100-record pages, exact UTF-8 coverage, stable append snapshot, current-page cursor, refresh, private-field exclusion, no-store and 401/400/409 responses';
 }finally{
  if(original===undefined)await unlink(file).catch(error=>{if(!hasErrorCode(error,'ENOENT'))throw error;});
  else await writeFile(file,original);
 }
}
