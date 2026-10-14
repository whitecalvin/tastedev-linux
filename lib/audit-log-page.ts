import type {FileHandle} from 'node:fs/promises';
import {hasErrorCode} from './error-code.ts';
export type AuditEvent = {at: string; action: string; result: string};
export type AuditLogPage = {events: AuditEvent[]; nextCursor: string | null; cursor: string | null; skipped: boolean};
type AuditCursor = {dev: number; ino: number; size: number; end: number; anchor: string};
import {open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash} from 'node:crypto';
const windowSize=262144,pageSize=100;
const fail=(message: string,status: number)=>Object.assign(Error(message),{status});
const changed=()=>fail('감사 기록이 변경되었습니다. 다시 조회하세요.',409);
function decode(value: unknown): AuditCursor | null{
 if(value==null)return null;
 try{if(typeof value!=='string'||value.length>512||!value||!/^[A-Za-z0-9_-]+$/.test(value))throw Error();const input: unknown=JSON.parse(Buffer.from(value,'base64url').toString('utf8'));if(!input||typeof input!=='object'||Array.isArray(input))throw Error();const record=input as Record<string,unknown>;
  if(!record||Object.keys(record).sort().join(',')!=='anchor,dev,end,ino,size'||!['dev','ino','size','end'].every(key=>typeof record[key]==='number'&&Number.isInteger(record[key])&&record[key]>=0)||!Number.isSafeInteger(record.size)||!Number.isSafeInteger(record.end)||(record.end as number)>(record.size as number)||(typeof record.anchor!=='string'||!/^[0-9a-f]{64}$/.test(record.anchor)))throw Error();// Exact keys, numeric bounds and anchor format were checked above.
  return record as AuditCursor;
 }catch{throw fail('감사 기록 페이지 정보를 확인하세요.',400);}
}
async function read(handle: FileHandle,start: number,length: number): Promise<Buffer>{const bytes=Buffer.alloc(length);let used=0;while(used<length){const result=await handle.read(bytes,used,length-used,start+used);if(!result.bytesRead)throw changed();used+=result.bytesRead;}return bytes;}
async function anchor(handle: FileHandle,end: number): Promise<string>{return createHash('sha256').update(await read(handle,Math.max(0,end-64),Math.min(end,64))).digest('hex');}
export async function readAuditLogPage(file: string,token: unknown=null): Promise<AuditLogPage>{
 const cursor=decode(token);let handle: FileHandle | undefined;
 try{try{handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);}catch(error){if(hasErrorCode(error,'ENOENT')){if(cursor)throw changed();return {events:[],nextCursor:null,cursor:null,skipped:false};}throw error;}
  const stat=await handle.stat();if(!stat.isFile()||stat.nlink!==1)throw changed();
  if(cursor&&(cursor.dev!==stat.dev||cursor.ino!==stat.ino||stat.size<cursor.size||await anchor(handle,cursor.end)!==cursor.anchor))throw changed();
  const size=cursor?.size??stat.size,end=cursor?.end??size,start=Math.max(0,end-windowSize),bytes=await read(handle,start,end-start);const rows: {start: number; event: AuditEvent}[]=[];let offset=0,skipped=false;
  if(start>0&&(await read(handle,start-1,1))[0]!==10){const newline=bytes.indexOf(10);offset=newline<0?bytes.length:newline+1;}
  while(offset<bytes.length){const newline=bytes.indexOf(10,offset),stop=newline<0?bytes.length:newline,line=bytes.subarray(offset,stop).toString('utf8');
   if(line.trim())try{const value: unknown=JSON.parse(line);if(!value||typeof value!=='object')throw Error();const event=value as Record<string,unknown>;if(typeof event?.at!=='string'||typeof event.action!=='string'||typeof event.result!=='string')throw Error();rows.push({start:start+offset,event:{at:event.at,action:event.action,result:event.result}});}catch{skipped=true;}
   offset=stop+1;
  }
  const selected=rows.slice(-pageSize),nextEnd=selected[0]?.start??start;
  const encode=async (boundary: number)=>Buffer.from(JSON.stringify({dev:stat.dev,ino:stat.ino,size,end:boundary,anchor:await anchor(handle!,boundary)})).toString('base64url');
  const nextCursor=nextEnd>0?await encode(nextEnd):null,currentCursor=await encode(end);
  const after=await handle.stat();if(after.dev!==stat.dev||after.ino!==stat.ino||after.size<stat.size||after.size===stat.size&&after.mtimeMs!==stat.mtimeMs)throw changed();
  return {events:selected.map(row=>row.event),nextCursor,cursor:currentCursor,skipped:skipped||!rows.length&&start>0};
 }finally{await handle?.close();}
}
