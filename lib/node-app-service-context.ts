const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {lstat,open} from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {nodeAppProfile} from './node-app-profile.ts';
import {nodeAppServiceOptions} from './node-app-unit.ts';
const fail:(message:string,status?:number)=>never=(message,status=409)=>{throw Object.assign(Error(message),{status});};
export function nodeServiceCaller(value:unknown){
 if(typeof value!=='string'||!(/^[1-9][0-9]{0,9}$/).test(value)||Number(value)>2147483647)fail('Node service requires a verified non-root caller',403);
 return Number(value);
}
async function directories(directory:string,base:string,uid:number){
 let current=path.parse(directory).root;
 for(const part of directory.slice(current.length).split(path.sep).filter(Boolean)){
  current=path.join(current,part);const stat=await lstat(current);
  if(!stat.isDirectory()||stat.isSymbolicLink()||!(stat.mode&(stat.uid===uid?0o100:0o001)))fail('Unsafe Node app directory',403);
  if(current===base||current.startsWith(base+'/')){
   if(![0,uid].includes(stat.uid)||(stat.mode&0o022)||!(stat.mode&(stat.uid===uid?0o100:0o001)))fail('Unsafe Node app directory permissions',403);
  }
 }
}
async function inspect(file:string,base:string,uid:number,environment:boolean,expected:string){
 await directories(path.dirname(file),base,uid);const before=await lstat(file);
 if(!before.isFile()||before.isSymbolicLink())fail('Unsafe Node app file',403);
 const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{
  const stat=await handle.stat(),limit=environment?262144:4194304;
  if(!stat.isFile()||stat.nlink!==1||![0,uid].includes(stat.uid)||(stat.mode&0o022)||!(stat.mode&(stat.uid===uid?0o400:0o004))||stat.size>limit||stat.ino!==before.ino||stat.dev!==before.dev||environment&&(stat.uid!==uid||(stat.mode&0o077)))fail('Unsafe Node app file permissions',403);
  const bytes=Buffer.alloc(limit+1),{bytesRead}=await handle.read(bytes,0,bytes.length,0);if(bytesRead>limit)fail('Oversized Node app file',403);
  const version=createHash('sha256').update(bytes.subarray(0,bytesRead)).digest('hex'),after=await lstat(file);
  if(after.isSymbolicLink()||after.ino!==stat.ino||after.dev!==stat.dev||after.size!==stat.size||after.mtimeMs!==stat.mtimeMs||after.mode!==stat.mode||version!==expected)fail('Node app file changed after review');
 }finally{await handle.close();}
}
// Root helper boundary: caller UID is trusted sudo metadata, never an HTTP UID.
// Returns only sanitized metadata; file contents and environment secrets stay private.
export async function verifyNodeServiceContext(input:unknown,callerUid:unknown){
 if(typeof callerUid!=='number'||!Number.isInteger(callerUid)||callerUid<=0||callerUid>2147483647||!object(input)||input.uid!==callerUid)fail('Node service account does not match caller',403);
 const profile=nodeAppProfile(input.profile),options=nodeAppServiceOptions(input.options);
 if(!Array.isArray(input.files)||input.files.length!==2)fail('Reload Node service file inspection',400);
 const expected=new Map<string,string>();for(const file of input.files){if(!object(file)||typeof file.name!=='string'||typeof file.version!=='string'||!(/^[a-f0-9]{64}$/).test(file.version)||expected.has(file.name))fail('Invalid Node service file inspection',400);expected.set(file.name,file.version);}
 if(profile.entry===profile.environmentFile||!expected.has(profile.entry)||!expected.has(profile.environmentFile))fail('Invalid Node service targets',400);
 await directories(profile.directory,profile.directory,callerUid);
 const entryVersion=expected.get(profile.entry),environmentVersion=expected.get(profile.environmentFile);if(typeof entryVersion!=='string'||typeof environmentVersion!=='string')fail('Invalid Node service targets',400);
 await inspect(path.join(profile.directory,profile.entry),profile.directory,callerUid,false,entryVersion);
 await inspect(path.join(profile.directory,profile.environmentFile),profile.directory,callerUid,true,environmentVersion);
 return {profile,options,uid:callerUid,unit:profile.unit};
}
