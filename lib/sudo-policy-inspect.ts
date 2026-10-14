import type {SudoAccount} from './sudo-policy.ts';
import {hasErrorCode} from './error-code.ts';
type InspectOptions={account?:SudoAccount;directory?:string;verifyAccount?:()=>unknown|Promise<unknown>};
import {open,lstat} from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {parseSudoPolicy,sudoPolicyPlan} from './sudo-policy.ts';
const fail:()=>never=()=>{throw Object.assign(Error('Managed sudo rule inspection requires review'),{status:409});};
// Trusted helper primitive. No effective OS authorization claim or source text.
export async function inspectSudoPolicy({account={},directory='/etc/sudoers.d',verifyAccount}:InspectOptions={}){
 const plan=sudoPolicyPlan({passwordless:false,actions:['service']},account);if(typeof verifyAccount!=='function')fail();await verifyAccount();
 const resolved=path.resolve(directory);let current=path.parse(resolved).root;
 for(const part of resolved.slice(current.length).split(path.sep).filter(Boolean)){current=path.join(current,part);const stat=await lstat(current);if(!stat.isDirectory()||stat.isSymbolicLink())fail();}
 const dir=await lstat(resolved);if(dir.uid!==process.getuid?.()||(dir.mode&0o022))fail();
 const file=path.join(resolved,plan.filename);let handle;
 try{handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);}catch(error){if(hasErrorCode(error,'ENOENT')){await verifyAccount();return {registered:false,username:plan.username,uid:plan.uid,effectiveAuthorizationVerified:false};}throw error;}
 try{
  const before=await handle.stat();if(!before.isFile()||before.nlink!==1||before.uid!==process.getuid?.()||(before.mode&0o022)||before.size>16384)fail();
  const buffer=Buffer.alloc(16385),{bytesRead}=await handle.read(buffer,0,buffer.length,0);if(bytesRead>16384)fail();
  let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(buffer.subarray(0,bytesRead));}catch{fail();}
  const metadata=parseSudoPolicy(text,account);await verifyAccount();const after=await lstat(file);
  if(after.isSymbolicLink()||after.ino!==before.ino||after.dev!==before.dev||after.size!==before.size||after.mtimeMs!==before.mtimeMs||after.mode!==before.mode||after.uid!==before.uid||after.nlink!==1)fail();
  return {...metadata,registered:true,effectiveAuthorizationVerified:false};
 }finally{await handle.close();}
}
