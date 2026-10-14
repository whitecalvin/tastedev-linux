import {hasErrorCode} from '../../lib/error-code.ts';
import assert from 'node:assert/strict';
import {jsonRecord,recordField} from './http-json.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {randomBytes,createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';

const build=process.argv[2];
if(!build?.startsWith('/mnt/data/build/tastedev-linux/tastedev-current-build-'))throw Error('검수된 빌드 경로를 지정하세요.');
const snapshot=jsonRecord(JSON.parse(await readFile(join(build,'source-snapshot.json'),'utf8')));const sourceFiles=recordField(snapshot,'files');
for(const [file,digest] of Object.entries(sourceFiles)){
 const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
 if(sha(await readFile(file))!==digest||sha(await readFile(join(build,file)))!==digest)throw Error('현재 소스와 빌드가 다릅니다: '+file);
}
const root=await verificationWorkDirectory('common-pages-gui-');
process.env.LINUX_AUTH_ROOT=join(root,'auth');process.env.LINUX_STATE_ROOT=join(root,'state');
await mkdir(process.env.LINUX_STATE_ROOT,{mode:0o700});
const {passwordHash}=await import('../../lib/auth-password.ts');
const {storeCredentials}=await import('../../lib/auth-store.ts');
const username='common-gui-fixture',password=randomBytes(32).toString('base64url');
storeCredentials(username,await passwordHash(password));
await writeFile(join(root,'login.json'),JSON.stringify({username,password}),{mode:0o600});
// These are clearly named fixture records, never operating audit history.
await writeFile(join(root,'state/audit.jsonl'),Array.from({length:150},(_,i)=>JSON.stringify({at:'2026-10-11T00:00:00.000Z',action:'공통 GUI 검수 '+i,result:i%2?'completed':'recovered',privateFixtureField:'not displayed'})+'\n').join(''),{mode:0o600});
const listener=createServer();await new Promise<void>(resolve=>listener.listen(0,'127.0.0.1',resolve));const address=listener.address();assert(address&&typeof address==='object');const port=address.port;await new Promise<void>((resolve,reject)=>listener.close(error=>error?reject(error):resolve()));
const evidence=join(verificationWorkRoot,'common-pages-original-gui-'+new Date().toISOString().replaceAll(':','-'));await mkdir(evidence,{recursive:true,mode:0o700});
const env={...process.env,LINUX_WORKSPACE_ROOT:join(root,'workspace'),LINUX_ENABLE_ADMIN:'false',LINUX_ENABLE_INSTALL:'false',LINUX_ENABLE_CRON:'false',LINUX_ENABLE_TERMINAL:'false',LINUX_ENABLE_AI:'false',BETTER_AUTH_URL:'http://localhost:'+port,NEXT_TELEMETRY_DISABLED:'1'};
const child=spawn(process.execPath,[join(build,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:build,env,detached:true,stdio:['ignore','pipe','pipe']});
let logs='',readyResolve:()=>void=()=>{};const ready=new Promise<void>(resolve=>{readyResolve=resolve;});child.stdout.on('data',chunk=>{logs+=chunk; if(String(chunk).includes('Ready'))readyResolve();});child.stderr.on('data',chunk=>{logs+=chunk;});
const closed=new Promise<number|null>((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});
let stopResolve:()=>void=()=>{};const stop=new Promise<void>(resolve=>{stopResolve=resolve;});process.stdin.on('data',chunk=>{if(String(chunk).trim()==='cleanup')stopResolve();});process.on('SIGTERM',()=>stopResolve());process.on('SIGINT',()=>stopResolve());
const timer=setTimeout(()=>stopResolve(),12*60*1000);
try{
 await Promise.race([ready,closed.then(()=>{throw Error('검수 서버가 종료됐습니다.');}),new Promise((_,reject)=>setTimeout(()=>reject(Error('검수 서버 시작 시간 초과')),20000).unref())]);
 const connection={root,port,origin:'http://localhost:'+port,credentials:join(root,'login.json'),evidence,build,sourceFiles:Object.keys(sourceFiles).length,operatingWritesEnabled:false};
 await writeFile(join(evidence,'connection.json'),JSON.stringify(connection,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({status:'GUI_READY',...connection}));await stop;
}finally{
 clearTimeout(timer);process.stdin.pause();
 try{if(child.pid)process.kill(-child.pid,'SIGTERM');}catch(e){if(!hasErrorCode(e,'ESRCH'))throw e;}
 const ended=await Promise.race([closed.then(()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),3000))]);if(!ended){try{if(child.pid)process.kill(-child.pid,'SIGKILL');}catch(e){if(!hasErrorCode(e,'ESRCH'))throw e;}await closed;}
 await writeFile(join(evidence,'server.log'),logs,{mode:0o600});await rm(root,{recursive:true,force:true});await writeFile(join(evidence,'cleanup.json'),JSON.stringify({serverStopped:true,privateStageRemoved:true,credentialsRemoved:true,operatingWritesEnabled:false})+'\n');console.log(JSON.stringify({status:'CLEANED',evidence}));
}
