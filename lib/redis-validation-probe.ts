type ReadyReply={ready:true;authenticationRequired:boolean};
export type RedisProbeChild={exitCode?:number|null;signalCode?:string|null};
type ProbeOptions={connect?:typeof createConnection;verifyRuntime?:(root:string)=>unknown|Promise<unknown>;verifySocket?:(file:string)=>unknown|Promise<unknown>};
import {createConnection} from 'node:net';
import {lstat} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {verifyRedisValidationRuntime} from './redis-validation-runtime.ts';
const fail:()=>never=()=>{throw Object.assign(Error('Redis isolated socket readiness failed'),{status:400});};
export function redisReadinessReply(text:unknown):ReadyReply{
 if(typeof text!=='string'||Buffer.byteLength(text)>1024)fail();
 if(text==='+PONG\r\n')return {ready:true,authenticationRequired:false};
 if(/^-NOAUTH [^\r\n]+\r\n$/.test(text))return {ready:true,authenticationRequired:true};
 fail();
}
async function socketOwnership(file:string){const stat=await lstat(file);if(!stat.isSocket()||stat.uid!==process.getuid?.()||(stat.mode&0o077))fail();}
async function ping(file:string,timeoutMs:number,connect:typeof createConnection):Promise<ReadyReply>{
 return new Promise<ReadyReply>((resolve,reject)=>{const socket=connect({path:file});let response='',settled=false;
 const finish=(error:boolean,result?:ReadyReply)=>{if(settled)return;settled=true;clearTimeout(timer);socket.destroy();error||!result?reject(Error('Redis isolated socket readiness failed')):resolve(result);};
 const timer=setTimeout(()=>finish(true),timeoutMs);
 socket.once('connect',()=>socket.write('*1\r\n$4\r\nPING\r\n'));
 socket.on('data',chunk=>{response+=chunk.toString('utf8');if(Buffer.byteLength(response)>1024){finish(true);return;}if(response.includes('\r\n')){try{finish(false,redisReadinessReply(response));}catch{finish(true);}}});
 socket.once('error',()=>finish(true));socket.once('end',()=>finish(true));socket.once('close',()=>finish(true));
 });
}
export function redisValidationProbe({connect=createConnection,verifyRuntime=verifyRedisValidationRuntime,verifySocket=socketOwnership}:ProbeOptions={}){
 return async(child:RedisProbeChild,runtime:string,{timeoutMs=10000}:{timeoutMs?:number}={})=>{
 if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>10000)fail();const deadline=Date.now()+timeoutMs,file=runtime+'/redis.sock';
 while(Date.now()<deadline){if(child.exitCode!==null&&child.exitCode!==undefined||child.signalCode)fail();await verifyRuntime(runtime);let result:ReadyReply|undefined;
 try{await verifySocket(file);result=await ping(file,Math.max(1,Math.min(500,deadline-Date.now())),connect);}catch{}
 if(result){await verifyRuntime(runtime);await verifySocket(file);return {...result,scope:'isolated-unix-socket',operationalAuthenticationVerified:false};}
 const remaining=deadline-Date.now();if(remaining>0)await delay(Math.min(50,remaining));
 }fail();
 };
}
