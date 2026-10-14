import {hasErrorCode} from '../../lib/error-code.ts';
import assert from 'node:assert/strict';
// Run only against an installed package, with a separate disposable account/state.
import {mkdir,writeFile,rm,realpath,lstat} from 'node:fs/promises';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
const root=process.argv[2],port=Number(process.argv[3]);
if(typeof root!=='string'||!/^\/mnt\/data\/build\/tastedev-linux\/mariadb-route-gui-[A-Za-z0-9T_-]+$/.test(root)||!Number.isInteger(port)||port<1024||port>65535)throw Error('전용 검수 경로와 포트를 확인하세요.');
const stat=await lstat(root);if(!stat.isDirectory()||stat.isSymbolicLink()||await realpath(root)!==root||stat.uid!==process.getuid?.()||(stat.mode&0o077))throw Error('검수 폴더 소유권을 확인하세요.');
for(const name of ['TMPDIR','TMP','TEMP'])process.env[name]=root;
process.env.LINUX_AUTH_ROOT=join(root,'auth');process.env.LINUX_STATE_ROOT=join(root,'state');
await mkdir(process.env.LINUX_STATE_ROOT,{mode:0o700});
const passwordModule:typeof import('../../lib/auth-password.ts')=await import('/usr/lib/tastedev-linux/lib/auth-password.mjs');const {passwordHash}=passwordModule;
const credentialsModule:typeof import('../../lib/auth-store.ts')=await import('/usr/lib/tastedev-linux/lib/auth-store.mjs');const {storeCredentials}=credentialsModule;
const username='recovery-route-fixture',password=randomBytes(32).toString('base64url');
storeCredentials(username,await passwordHash(password));
await writeFile(join(root,'login.json'),JSON.stringify({username,password}),{mode:0o600});
const env={...process.env,LINUX_WORKSPACE_ROOT:join(root,'workspace'),LINUX_ENABLE_ADMIN:'false',LINUX_ENABLE_INSTALL:'false',LINUX_ENABLE_CRON:'false',LINUX_ENABLE_TERMINAL:'false',LINUX_ENABLE_AI:'false',BETTER_AUTH_URL:'http://localhost:'+port,NEXT_TELEMETRY_DISABLED:'1'};
const child=spawn(process.execPath,['/usr/lib/tastedev-linux/node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{cwd:'/usr/lib/tastedev-linux',env,detached:true,stdio:['ignore','pipe','pipe']});
let logs='',readyResolve:()=>void=()=>{},stopResolve:()=>void=()=>{};const ready=new Promise<void>(resolve=>readyResolve=resolve),stop=new Promise<void>(resolve=>stopResolve=resolve),closed=new Promise<number|null>((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});
child.stdout.on('data',chunk=>{logs+=chunk;if(String(chunk).includes('Ready'))readyResolve();});child.stderr.on('data',chunk=>logs+=chunk);
process.stdin.on('data',chunk=>{if(String(chunk).trim()==='cleanup')stopResolve();});process.on('SIGTERM',()=>stopResolve());process.on('SIGINT',()=>stopResolve());
const timer=setTimeout(()=>stopResolve(),10*60*1000);
try{
 await Promise.race([ready,closed.then(()=>{throw Error('검수 서버가 종료됐습니다.');}),new Promise((_,reject)=>setTimeout(()=>reject(Error('검수 서버 시작 시간 초과')),20000).unref())]);
 console.log(JSON.stringify({status:'GUI_READY',root,port,operatingWritesEnabled:false}));await stop;
}finally{
 clearTimeout(timer);process.stdin.pause();try{if(child.pid)process.kill(-child.pid,'SIGTERM');}catch(error){if(!hasErrorCode(error,'ESRCH'))throw error;}
 const ended=await Promise.race([closed.then(()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),3000))]);if(!ended){try{if(child.pid)process.kill(-child.pid,'SIGKILL');}catch(error){if(!hasErrorCode(error,'ESRCH'))throw error;}await closed;}
 await rm(join(root,'auth'),{recursive:true,force:true});await rm(join(root,'state'),{recursive:true,force:true});await rm(join(root,'login.json'),{force:true});
 await writeFile(join(root,'server.log'),logs,{mode:0o600});await writeFile(join(root,'cleanup.json'),JSON.stringify({serverStopped:true,credentialsRemoved:true,stateRemoved:true,operatingWritesEnabled:false})+'\n',{mode:0o600});console.log('CLEANED');
}
