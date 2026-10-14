export type RedisProcessSnapshot={uid:number;start:string;argv:string[];executableVerified:boolean};
export type RedisServiceDependencies={runCommand?:(binary:string,args:string[])=>Promise<{stdout?:unknown}>;snapshot?:(pid:number)=>Promise<RedisProcessSnapshot>};
import {open,lstat,realpath} from 'node:fs/promises';
import {constants} from 'node:fs';
import {execFile} from './admin-native-exec.ts';
import {promisify} from 'node:util';
import {redisServiceScope,redisSystemdStartup} from './redis-service-scope.ts';
const execute=promisify(execFile),fail:()=>never=()=>{throw Object.assign(Error('Redis running service context requires review'),{status:409});};
async function read(file:string){const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);try{const bytes=Buffer.alloc(16385),{bytesRead}=await handle.read(bytes,0,bytes.length,0);if(bytesRead>16384)fail();return new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,bytesRead));}finally{await handle.close();}}
async function native(binary:string,args:string[]){const stat=await lstat(binary);if(!stat.isFile()||stat.isSymbolicLink()||stat.uid!==0||(stat.mode&0o022)||!(stat.mode&0o111))fail();return execute(binary,args,{cwd:'/',timeout:10000,maxBuffer:16384,encoding:'utf8',env:{NODE_ENV:process.env.NODE_ENV,PATH:'/usr/bin:/bin',LANG:'C',LC_ALL:'C'}});}
export function redisManagerState(text:unknown){if(typeof text!=='string'||text.length>16384||text.includes('\0'))fail();const values:Record<string,string>={};for(const line of text.split('\n')){if(!line)continue;const match=/^(LoadState|ActiveState|MainPID)=(.*)$/.exec(line);if(!match||Object.hasOwn(values,match[1]))fail();values[match[1]]=match[2];}if(values.LoadState!=='loaded'||values.ActiveState!=='active'||! /^[1-9][0-9]{0,9}$/.test(values.MainPID))fail();return {pid:Number(values.MainPID)};}
async function nativeSnapshot(pid:number){const root='/proc/'+pid,owner=await lstat(root);if(!owner.isDirectory())fail();const executable=await realpath(root+'/exe');if(executable!=='/usr/bin/redis-server')fail();const binary=await lstat(executable);if(!binary.isFile()||binary.uid!==0||(binary.mode&0o022)||!(binary.mode&0o111))fail();const status=await read(root+'/status'),ids=/^Uid:\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*$/m.exec(status);if(!ids||ids.slice(1).some(id=>Number(id)!==owner.uid))fail();const stat=await read(root+'/stat'),close=stat.lastIndexOf(')'),start=stat.slice(close+2).trim().split(/\s+/)[19];if(close<0||!/^\d+$/.test(start??''))fail();const argv=(await read(root+'/cmdline')).split('\0').filter(Boolean);return {uid:owner.uid,start,argv,executableVerified:true};}
async function nativeStartup(pid:number,runCommand:NonNullable<RedisServiceDependencies['runCommand']>){
 const args=['--json=short','get-property','org.freedesktop.systemd1','/org/freedesktop/systemd1/unit/redis_2dserver_2eservice','org.freedesktop.systemd1.Service','ExecStart'];
 const {stdout}=await runCommand('/usr/bin/busctl',args);redisSystemdStartup(stdout,pid);return stdout;
}
// Redis overwrites its title by default. Only a stable, live systemd execution
// record for this exact PID can replace the lost original process arguments.
export async function inspectRedisIdentity({runCommand=native,snapshot=nativeSnapshot}:RedisServiceDependencies={}){
 const args=['--no-ask-password','show','redis-server.service','--property=LoadState,ActiveState,MainPID','--no-pager'];
 const initial=redisManagerState((await runCommand('/usr/bin/systemctl',args)).stdout),before=await snapshot(initial.pid);
 let scope:ReturnType<typeof redisServiceScope>|undefined;try{scope=redisServiceScope('/etc/redis/redis.conf',before.argv);}catch{}
 if(!scope&&Array.isArray(before.argv)&&before.argv.length===1){
  try{const first=await nativeStartup(initial.pid,runCommand),second=await nativeStartup(initial.pid,runCommand);if(first!==second)fail();scope=redisSystemdStartup(first,initial.pid);}catch{}
 }
 const after=await snapshot(initial.pid),latest=redisManagerState((await runCommand('/usr/bin/systemctl',args)).stdout);
 if(before.executableVerified!==true||after.executableVerified!==true||!Number.isInteger(before.uid)||before.uid<0||typeof before.start!=='string'||!/^\d+$/.test(before.start)||latest.pid!==initial.pid||after.start!==before.start||after.uid!==before.uid||JSON.stringify(after.argv)!==JSON.stringify(before.argv))fail();
 return {...(scope||{}),pid:initial.pid,start:before.start,uid:before.uid,service:'redis-server.service',identityVerified:true,startupMainVerified:Boolean(scope)};
}

export async function inspectRedisService(options:RedisServiceDependencies={}){const scope=await inspectRedisIdentity(options);if(!scope.startupMainVerified)fail();return scope;}
