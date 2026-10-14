import {constants} from 'node:fs';
import {mkdir,open,lstat} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {hasErrorCode} from './error-code.ts';
const conflict=()=>Object.assign(Error('cron 변경 작업이 진행 중입니다.'),{status:409});
export async function withCronLock<T>(folder: string,operation: ()=>T|Promise<T>): Promise<T>{
 await mkdir(folder,{recursive:true,mode:0o700});
 // Preserve the old lock: another version may still be changing the crontab.
 try{await lstat(path.join(folder,'cron.lock'));throw conflict();}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}
 const handle=await open(path.join(folder,'cron.flock'),constants.O_CREAT|constants.O_RDWR|constants.O_NOFOLLOW,0o600);
 try{
  const stat=await handle.stat();
  if(!stat.isFile()||stat.nlink!==1||stat.uid!==process.geteuid?.()||(stat.mode&0o077))throw Object.assign(Error('cron 잠금 파일 권한을 확인하세요.'),{status:403});
  await new Promise<void>((resolve,reject)=>{
   // fd 3 shares the parent's open file description; the parent keeps the lock
   // after flock exits, and closing its descriptor releases the kernel lock.
   const child=spawn('/usr/bin/flock',['--nonblock','3'],{stdio:['ignore','ignore','ignore',handle.fd]});
   const timer=setTimeout(()=>{child.kill('SIGKILL');reject(Error('cron 잠금을 확인할 수 없습니다.'));},5000);
   child.once('error',error=>{clearTimeout(timer);reject(Error('cron 잠금을 확인할 수 없습니다.',{cause:error}));});
   child.once('close',code=>{clearTimeout(timer);if(code===0)resolve();else reject(code===1?conflict():Error('cron 잠금을 확인할 수 없습니다.'));});
  });
  return await operation();
 }finally{await handle.close();}
}
