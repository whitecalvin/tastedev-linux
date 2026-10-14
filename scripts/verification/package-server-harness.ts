import assert from 'node:assert/strict';
import {mkdir,writeFile,lstat,realpath} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {verificationWorkRoot} from './work-directory.ts';
import {hasErrorCode} from '../../lib/error-code.ts';

export async function createPackageServerHarness(app:string,root:string,{terminal=false}:{terminal?:boolean}={}){
 assert(path.isAbsolute(app)&&path.isAbsolute(root)&&root.startsWith(verificationWorkRoot+'/'));
 const stat=await lstat(root);assert(stat.isDirectory()&&!stat.isSymbolicLink()&&stat.uid===process.getuid?.()&&!(stat.mode&0o077)&&await realpath(root)===root,'Unsafe package verification directory');
 const reservation=createServer();
 await new Promise<void>((resolve,reject)=>{reservation.once('error',reject);reservation.listen(0,'127.0.0.1',resolve);});
 const address=reservation.address();assert(address&&typeof address==='object');const port=address.port;
 await new Promise<void>(resolve=>reservation.close(()=>resolve()));
 const env:NodeJS.ProcessEnv={...Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('LINUX_')&&!/(TOKEN|SECRET|PASSWORD|PRIVATE_KEY|API_KEY)/i.test(key)&&!['NODE_OPTIONS','NODE_PATH','PORT','HOSTNAME'].includes(key))),NODE_ENV:process.env.NODE_ENV??'production'};
 const cliDirectory=path.join(root,'isolated-cli-bin'),cliFile=path.join(cliDirectory,'codex');
 await mkdir(cliDirectory,{recursive:true});await writeFile(cliFile,'CLI inspection fixture: not an executable program',{mode:0o700});
 env.PATH=cliDirectory+path.delimiter+(env.PATH||'/usr/bin:/bin');
 const fixtureHome=path.join(root,'isolated-home'),profileBin=path.join(fixtureHome,'profile-bin');await mkdir(profileBin,{recursive:true});
 const escaped=profileBin.replaceAll('\\','\\\\').replaceAll('"','\\"').replaceAll('$','\\$').replaceAll('`','\\`');
 await writeFile(path.join(fixtureHome,'.bashrc'),'export PATH="'+escaped+':$PATH"\n');
 await writeFile(path.join(profileBin,'tastedev-cli-fixture'),"#!/bin/sh\nprintf 'HTTP_CLI_PROFILE_READY\\n'\n",{mode:0o700});
 env.HOME=fixtureHome;env.USER='synthetic-other-account';env.LOGNAME='synthetic-other-login';
 const child=spawn('npm',['run','start','--','--port',String(port)],{cwd:app,detached:true,stdio:['ignore','pipe','pipe'],env:{...env,PORT:String(port),LINUX_HOST:'127.0.0.1',LINUX_STATE_ROOT:path.join(root,'isolated-state'),LINUX_AUTH_ROOT:path.join(root,'isolated-auth'),LINUX_WORKSPACE_ROOT:path.join(root,'isolated-workspace'),LINUX_ENABLE_ADMIN:'false',LINUX_ENABLE_INSTALL:'false',LINUX_ENABLE_CRON:'false',LINUX_ENABLE_TERMINAL:String(terminal),LINUX_ENABLE_AI:'false'}});
 assert(child.stdout&&child.stderr);let ready=false,failed=false,serverErrors='',lastRequestPath='',closed=false;
 child.once('error',()=>{failed=true;});child.stdout.on('data',(chunk:Buffer)=>{if(chunk.toString().includes('Ready'))ready=true;});child.stderr.on('data',(chunk:Buffer)=>{serverErrors=(serverErrors+chunk.toString()).slice(-4000);});
 const exited=new Promise<void>(resolve=>child.once('close',()=>resolve()));
 async function waitReady(){const deadline=Date.now()+20000;while(!ready&&!failed&&child.exitCode===null&&child.signalCode===null&&Date.now()<deadline)await delay(100);assert(ready&&!failed&&child.exitCode===null&&child.signalCode===null,'Packaged server failed to become ready');}
 async function packageFetch(input:string|URL,options?:RequestInit):Promise<Response>{
  const url=new URL(input);assert(url.protocol==='http:'&&url.hostname==='127.0.0.1'&&url.port===String(port)&&!url.username&&!url.password,'Unexpected package verification target');lastRequestPath=url.pathname;
  try{return await fetch(url,options);}catch(error){throw new Error('Packaged HTTP request failed: '+lastRequestPath,{cause:error});}
 }
 async function recordFailure(error:unknown){
  const evidence=path.join(verificationWorkRoot,'package-http-failure-'+new Date().toISOString().replaceAll(':','-')+'.json');
  const message=error instanceof Error?error.message:'Package verification failed';const cause=error instanceof Error&&error.cause instanceof Error?error.cause.name:undefined;
  await writeFile(evidence,JSON.stringify({status:'FAIL',lastRequestPath,message,cause,serverErrors},null,2)+'\n',{mode:0o600});console.error(JSON.stringify({status:'FAIL',lastRequestPath,evidence}));return evidence;
 }
 async function close(){
  if(closed)return;closed=true;
  const pid=child.pid;
  const signal=(value:NodeJS.Signals)=>{if(pid)try{process.kill(-pid,value);}catch(error){if(!hasErrorCode(error,'ESRCH'))throw error;}};
  const timer=new AbortController();
  try{signal('SIGTERM');const stopped=await Promise.race([exited.then(()=>true),delay(3000,false,{signal:timer.signal})]);if(!stopped&&pid){signal('SIGKILL');await exited;}}finally{timer.abort();}
 }
 return {port,env,cliFile,fixtureHome,profileBin,waitReady,packageFetch,recordFailure,close};
}
