import {hasErrorCode} from './error-code.ts';
export type SystemSettings = {logLines: number; logRefreshSeconds: number};
export type SystemSettingsSnapshot = SystemSettings & {version: string};
import {readFileSync,openSync,closeSync,fstatSync,constants} from 'node:fs';
import {mkdir,open,writeFile,rename,unlink,lstat} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {stateRoot} from './runtime-paths.ts';
export const defaultSystemSettings=Object.freeze({logLines:150,logRefreshSeconds:3});
const fail=(message: string,status=400)=>Object.assign(Error(message),{status});
const digest=(value: SystemSettings)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function validateSystemSettings(input: unknown): SystemSettings {
 const value=input&&typeof input==='object'?input as Record<string,unknown>:{};
 const {logLines,logRefreshSeconds}=value;
 if(typeof logLines!=='number'||![50,150,300,500,1000].includes(logLines)||typeof logRefreshSeconds!=='number'||![3,5,10,30,60].includes(logRefreshSeconds))throw fail('로그 조회 줄 수와 갱신 간격을 확인하세요.');
 return {logLines,logRefreshSeconds};
}
export function systemSettings(): SystemSettingsSnapshot{
 let settings: SystemSettings={...defaultSystemSettings};let fd: number | undefined;
 try{fd=openSync(join(stateRoot(),'system-settings.json'),constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);const stat=fstatSync(fd);if(!stat.isFile()||stat.nlink!==1||stat.size>2048)throw fail('시스템 설정 파일을 확인하세요.',503);settings=validateSystemSettings(JSON.parse(readFileSync(fd,'utf8')));}
 catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}finally{if(fd!==undefined)closeSync(fd);}
 return {...settings,version:digest(settings)};
}
export async function withSystemSettingsLock<T>(root: string,operation: () => T | Promise<T>): Promise<T>{
 await mkdir(root,{recursive:true,mode:0o700});
 const legacy=join(root,'system-settings.lock'),file=join(root,'system-settings.flock');
 const conflict=()=>fail('다른 설정 저장이 진행 중입니다.',409);
 const checkLegacy=async()=>{try{await lstat(legacy);throw conflict();}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}};
 // Preserve locks from an older running version; never infer a legacy owner.
 await checkLegacy();
 const handle=await open(file,constants.O_CREAT|constants.O_RDWR|constants.O_NOFOLLOW,0o600);
 try{
  const held=await handle.stat();
  if(!held.isFile()||held.nlink!==1||held.uid!==process.geteuid?.()||(held.mode&0o077))throw fail('시스템 설정 파일을 확인하세요.',503);
  await new Promise<void>((resolve,reject)=>{
   // The child and parent share this open-file-description lease. Closing the
   // descriptor, including a killed server, releases it without deleting files.
   const child=spawn('/usr/bin/flock',['--nonblock','3'],{stdio:['ignore','ignore','ignore',handle.fd]});
   const timer=setTimeout(()=>{child.kill('SIGKILL');reject(conflict());},5000);
   child.once('error',error=>{clearTimeout(timer);reject(error);});
   child.once('close',code=>{clearTimeout(timer);if(code===0)resolve();else reject(conflict());});
  });
  const current=await lstat(file);
  if(!current.isFile()||current.nlink!==1||current.dev!==held.dev||current.ino!==held.ino)throw fail('시스템 설정 파일을 확인하세요.',503);
  await checkLegacy();
  return await operation();
 }finally{await handle.close();}
}
export async function saveSystemSettings(input: unknown): Promise<SystemSettingsSnapshot>{
 const settings=validateSystemSettings(input),request=input&&typeof input==='object'?input as Record<string,unknown>:{},root=stateRoot();
 return withSystemSettingsLock(root,async()=>{
  let temp: string | null | undefined;
  try{if(request.version!==systemSettings().version)throw fail('시스템 설정이 변경됐습니다. 다시 조회하세요.',409);temp=join(root,'.system-settings-'+randomUUID());await writeFile(temp,JSON.stringify(settings)+'\n',{flag:'wx',mode:0o600});await rename(temp,join(root,'system-settings.json'));temp=null;return systemSettings();}
  finally{if(temp)await unlink(temp).catch(()=>{});}
 });
}
