import {hasErrorCode} from './error-code.ts';
export type NetworkConfiguration = {externalEnabled: boolean; host: string; port: number};
type NetworkAddress = {family: string; address: string; internal: boolean};
export type NetworkSettingsSnapshot = NetworkConfiguration & {version: string; active: NetworkConfiguration & {urls: string[]}; restartRequired: boolean; development: boolean};
import {readFileSync,openSync,closeSync,fstatSync,constants} from 'node:fs';
import {mkdir,open,writeFile,rename,unlink,lstat} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {isIP} from 'node:net';
import {networkInterfaces} from 'node:os';
import {stateRoot} from './runtime-paths.ts';
const fail=(message: string,status=400)=>Object.assign(Error(message),{status});
const digest=(settings: NetworkConfiguration)=>createHash('sha256').update(JSON.stringify(settings)).digest('hex');
export function validateNetworkSettings(input: unknown): NetworkConfiguration{
 const value=input&&typeof input==='object'?input as Record<string,unknown>:{};
 if(typeof value.externalEnabled!=='boolean'||typeof value.host!=='string'||isIP(value.host)!==4||typeof value.port!=='number'||!Number.isInteger(value.port)||value.port<1024||value.port>65535)throw fail('IPv4 접속 주소와 1024~65535 포트를 확인하세요.');
 if(value.externalEnabled&&value.host.startsWith('127.'))throw fail('외부 접속을 허용할 서버의 IPv4 주소를 입력하세요. 전체 주소는 0.0.0.0입니다.');
 return {externalEnabled:value.externalEnabled,host:value.externalEnabled?value.host:'127.0.0.1',port:value.port};
}
export function networkConfiguration(): NetworkConfiguration{
 const host=process.env.LINUX_HOST||'127.0.0.1',port=Number(process.env.PORT||(process.env.LINUX_PACKAGED==='true'?8791:8787));
 let settings: NetworkConfiguration={externalEnabled:!host.startsWith('127.'),host,port};let fd: number | undefined;
 try{fd=openSync(join(stateRoot(),'network-settings.json'),constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);const stat=fstatSync(fd);if(!stat.isFile()||stat.nlink!==1||stat.size>2048)throw fail('외부 접속 설정 파일을 확인하세요.',503);settings=validateNetworkSettings(JSON.parse(readFileSync(fd,'utf8')));}
 catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}finally{if(fd!==undefined)closeSync(fd);}
 return settings;
}
export function networkOrigins(host: string,port: number,interfaces?: Record<string,readonly NetworkAddress[] | undefined>): string[]{
 if(host==='0.0.0.0'&&!interfaces){try{interfaces=networkInterfaces();}catch{interfaces={};}}
 const addresses=host==='0.0.0.0'?Object.values(interfaces||{}).flat().filter((item): item is NetworkAddress=>Boolean(item&&item.family==='IPv4'&&!item.internal)).map(item=>item.address):host.startsWith('127.')?[]:[host];
 return [...new Set(['http://127.0.0.1:'+port,'http://localhost:'+port,...addresses.map(ip=>'http://'+ip+':'+port)])];
}
export function networkSettings(runtimePort?: string | number): NetworkSettingsSnapshot{
 const settings=networkConfiguration(),host=process.env.LINUX_ACTIVE_HOST||process.env.LINUX_HOST||'127.0.0.1',port=Number(process.env.PORT||runtimePort||8791);
 const active={host,port,externalEnabled:!host.startsWith('127.'),urls:networkOrigins(host,port)};
 return {...settings,version:digest(settings),active,restartRequired:host!==settings.host||port!==settings.port,development:process.env.NODE_ENV==='development'};
}
const networkSaveConflict=()=>fail('다른 접속 설정 저장이 진행 중입니다.',409);
export async function withNetworkSettingsLock<T>(root: string,operation: () => T | Promise<T>): Promise<T>{
 await mkdir(root,{recursive:true,mode:0o700});
 const legacy=join(root,'network-settings.lock'),file=join(root,'network-settings.flock');
 const checkLegacy=async()=>{try{await lstat(legacy);throw networkSaveConflict();}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}};
 // An older app may still own its exclusive-create lock. Never remove it.
 await checkLegacy();
 const handle=await open(file,constants.O_CREAT|constants.O_RDWR|constants.O_NOFOLLOW,0o600);
 try{
  const held=await handle.stat();
  if(!held.isFile()||held.nlink!==1||held.uid!==process.geteuid?.())throw fail('외부 접속 설정 파일을 확인하세요.',503);
  await new Promise<void>((resolve,reject)=>{
   // The inherited descriptor shares the parent's open file description.
   // Closing it (including process death) releases the kernel lock.
   const child=spawn('/usr/bin/flock',['--nonblock','3'],{stdio:['ignore','ignore','ignore',handle.fd]});
   const timer=setTimeout(()=>{child.kill('SIGKILL');reject(networkSaveConflict());},5000);
   child.once('error',error=>{clearTimeout(timer);reject(error);});
   child.once('close',code=>{clearTimeout(timer);if(code===0)resolve();else reject(networkSaveConflict());});
  });
  const current=await lstat(file);
  if(!current.isFile()||current.nlink!==1||current.dev!==held.dev||current.ino!==held.ino)throw fail('외부 접속 설정 파일을 확인하세요.',503);
  await checkLegacy();
  return await operation();
 }finally{await handle.close();}
}
export async function saveNetworkSettings(input: unknown): Promise<NetworkSettingsSnapshot>{
 const settings=validateNetworkSettings(input),request=input&&typeof input==='object'?input as Record<string,unknown>:{},root=stateRoot();
 return withNetworkSettingsLock(root,async()=>{
  let temp: string | null | undefined;
  try{if(request.version!==digest(networkConfiguration()))throw fail('접속 설정이 변경됐습니다. 다시 조회하세요.',409);temp=join(root,'.network-settings-'+randomUUID());await writeFile(temp,JSON.stringify(settings)+'\n',{flag:'wx',mode:0o600});await rename(temp,join(root,'network-settings.json'));temp=null;return networkSettings();}
  finally{if(temp)await unlink(temp).catch(()=>{});}
 });
}
export function runtimeAuthOrigins(): string[]{
 const encoded=process.env.LINUX_RUNTIME_NETWORK_ORIGINS;if(!encoded)return [];
 const entries: unknown=JSON.parse(encoded);if(!Array.isArray(entries)||entries.length>128)throw fail('실행 중인 접속 주소를 확인하세요.',503);
 return entries.filter((value): value is string=>{if(typeof value!=='string')return false;try{const url=new URL(value);return url.origin===value&&url.protocol==='http:'&&(url.hostname==='localhost'||isIP(url.hostname)===4);}catch{return false;}});
}
