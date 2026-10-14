import {lstat,readdir,rm} from 'node:fs/promises';
import {redisWorkDirectory} from './redis-work-directory.ts';
import path from 'node:path';
const runtimes=new Map<string,{ino:number;dev:number;uid:number}>,allowed=new Set(['redis.sock','redis.log','redis.pid','validation.rdb']);
const fail:()=>never=()=>{throw Object.assign(Error('Redis validation runtime requires review'),{status:409});};
export async function createRedisValidationRuntime(){
 const root=await redisWorkDirectory('tastedev-redis-validation-');
 try{const stat=await lstat(root);if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==process.getuid?.()||(stat.mode&0o077))fail();runtimes.set(root,{ino:stat.ino,dev:stat.dev,uid:stat.uid});return root;}catch(error){await rm(root,{recursive:true,force:true});throw error;}
}
export async function verifyRedisValidationRuntime(root:string){
 const expected=runtimes.get(root);if(!expected)fail();const stat=await lstat(root);
 if(!stat.isDirectory()||stat.isSymbolicLink()||stat.ino!==expected.ino||stat.dev!==expected.dev||stat.uid!==expected.uid||(stat.mode&0o077))fail();
 const names=await readdir(root);if(names.length>allowed.size)fail();
 for(const name of names){if(!allowed.has(name))fail();const entry=await lstat(path.join(root,name));if(entry.isSymbolicLink()||entry.uid!==expected.uid||(entry.mode&0o077)||(!entry.isFile()&&!entry.isSocket())||entry.isFile()&&(entry.nlink!==1||entry.size>1048576))fail();}
 return {verified:true,scope:'private-runtime-directory'};
}
export async function cleanupRedisValidationRuntime(root:string){
 await verifyRedisValidationRuntime(root);await rm(root,{recursive:true,force:false});runtimes.delete(root);
}
export const redisValidationRuntimeHooks=()=>({createRuntime:createRedisValidationRuntime,verifyRuntime:verifyRedisValidationRuntime,cleanupRuntime:cleanupRedisValidationRuntime});
