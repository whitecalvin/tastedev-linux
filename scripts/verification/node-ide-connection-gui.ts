import type {ChildProcess} from 'node:child_process';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {jsonRecord} from './http-json.ts';
import {hasErrorCode} from '../../lib/error-code.ts';
import {diagnostic} from './nginx-native-report.ts';
import {mkdtemp,mkdir,cp,copyFile,symlink,writeFile,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const project=process.cwd();
const evidence=path.join(verificationWorkRoot,'node-ide-connection-gui-'+new Date().toISOString().replaceAll(':','-'));
let child:ChildProcess|undefined,log='',status='FAIL',gui:Record<string,unknown>|undefined;
const hash=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex');
const sourceFile=path.join(project,'components/node-config-ide.tsx'),sourceHash=hash(await readFile(sourceFile));
const fixture=await verificationWorkDirectory('tastedev-node-connection-gui-');
try{
 for(const name of ['app','components','lib','public'])await cp(path.join(project,name),path.join(fixture,name),{recursive:true});
 for(const name of ['package.json','next.config.mjs','tsconfig.json','next-env.d.ts'])await copyFile(path.join(project,name),path.join(fixture,name));
 await symlink(path.join(project,'node_modules'),path.join(fixture,'node_modules'),'dir');
 await mkdir(path.join(fixture,'app/verification-node'),{recursive:true});
 await writeFile(path.join(fixture,'app/verification-node/page.tsx'),`'use client';
import {useState,useMemo,useRef} from 'react';
import NodeConfigIde from '../../components/node-config-ide';
import type {NodeAppRegistry,NodeIdeApi} from '../../components/node-types';
const registry=(target:string):NodeAppRegistry=>({apps:[{id:target==='a'?'alpha':'beta',label:target==='a'?'첫 번째 서버 앱':'두 번째 서버 앱',directory:'/fixture/'+target,entry:'server.mjs',environmentFile:'app.env',unit:'tastedev-node-'+(target==='a'?'alpha':'beta')+'.service'}],version:target,workspace:{root:'/fixture/'+target,files:[target+'.env']}});
export default function Page(){
 const [target,setTarget]=useState('a'),[connected,setConnected]=useState(true),[pending,setPending]=useState(false),wait=useRef<(()=>void)|null>(null);
 const api=useMemo<NodeIdeApi>(()=>{
 function request(action:'node-apps',body?:unknown):Promise<NodeAppRegistry>;
 function request(action:'files',body?:unknown):Promise<{root:string;files:string[]}>;
 function request(action:string,body?:unknown):Promise<never>;
 async function request(action:string,body?:unknown):Promise<NodeAppRegistry|{root:string;files:string[]}>{if(body)throw Error('격리 화면에서는 변경 요청을 실행하지 않습니다.');if(action==='node-apps'){setPending(true);return new Promise<NodeAppRegistry>(resolve=>{wait.current=()=>{resolve(registry(target));setPending(false);};});}if(action==='files')return {root:'/fixture/'+target,files:[target+'.env']};throw Error('격리 화면에서 지원하지 않는 조회입니다.');}
 return request;
 },[target]);
 return <main style={{height:'100dvh',display:'flex',flexDirection:'column',overflow:'hidden'}}><div style={{display:'flex',gap:8,padding:8}}><strong>격리 연결 검사</strong><button onClick={()=>setTarget(t=>t==='a'?'b':'a')}>서버 교체</button><button onClick={()=>setConnected(c=>!c)}>연결 전환</button><button disabled={!pending} onClick={()=>{const deliver=wait.current;wait.current=null;deliver?.();}}>새 목록 수신</button><span>{target==='a'?'서버 A':'서버 B'} · {connected?'연결됨':'연결 해제'}</span></div><div className="ide-page" style={{display:'flex',flexDirection:'column',flex:1,minHeight:0}}><NodeConfigIde api={api} connected={connected} security={null} requestedProfile={{kind:'nodejs'}} initialData={registry('a')}/></div></main>;
}`,{mode:0o600});
 const env:NodeJS.ProcessEnv={...process.env,NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1',LINUX_AUTH_ROOT:path.join(fixture,'auth'),LINUX_STATE_ROOT:path.join(fixture,'state'),LINUX_WORKSPACE_ROOT:path.join(fixture,'workspace'),LINUX_ENABLE_ADMIN:'false',LINUX_ENABLE_TERMINAL:'false',LINUX_ENABLE_INSTALL:'false',LINUX_ENABLE_CRON:'false',LINUX_ENABLE_AI:'false'};
 delete env.OPENAI_API_KEY;
 child=spawn(process.execPath,[path.join(project,'node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:fixture,env,stdio:['ignore','pipe','pipe']});assert(child.stdout&&child.stderr);child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
 console.log(JSON.stringify({status:'BUILDING',fixture}));
 assert.equal(await new Promise<number|null>((resolve,reject)=>{assert(child);child.once('error',reject);child.once('close',resolve);}),0,'Fixture build failed');
 assert.equal(hash(await readFile(path.join(fixture,'components/node-config-ide.tsx'))),sourceHash);
 const socket=createServer();await new Promise<void>((resolve,reject)=>{socket.once('error',reject);socket.listen(0,'127.0.0.2',resolve);});const address=socket.address();assert(address&&typeof address==='object');const port=address.port;await new Promise<void>(resolve=>socket.close(()=>resolve()));
 child=spawn(process.execPath,[path.join(project,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.2','--port',String(port)],{cwd:fixture,env,stdio:['ignore','pipe','pipe']});assert(child.stdout&&child.stderr);child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
 const url='http://127.0.0.2:'+port+'/verification-node';
 for(let attempt=0;;attempt++){assert(attempt<100&&child.exitCode===null,'Fixture readiness failed');try{if((await fetch(url)).status===200)break;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}
 console.log(JSON.stringify({status:'GUI_READY',fixture,url}));const deadline=Date.now()+300000;
 for(;;){assert(child.exitCode===null&&Date.now()<deadline,'GUI fixture stopped or timed out');try{gui=jsonRecord(JSON.parse(await readFile(path.join(fixture,'gui-result.json'),'utf8')));break;}catch(e){if(!hasErrorCode(e,'ENOENT'))throw e;}await new Promise(resolve=>setTimeout(resolve,100));}
 assert.equal(gui.status,'PASS');for(const key of ['initialRegistry','oldSelectionHidden','oldInventoryHidden','newRegistrySelected','disconnectHidden','reconnectSelected'])assert.equal(gui[key],true,key);
 assert.equal(hash(await readFile(sourceFile)),sourceHash,'Product source changed during GUI verification');status='PASS';
}catch(error){log+='\n'+diagnostic(error);console.error(diagnostic(error));process.exitCode=1;}
finally{
 if(child?.exitCode===null){const owned=child;owned.kill('SIGTERM');await new Promise<void>(resolve=>{const timer=setTimeout(()=>{owned.kill('SIGKILL');resolve();},10000);owned.once('close',()=>{clearTimeout(timer);resolve();});});}
 await mkdir(evidence,{recursive:true});await writeFile(path.join(evidence,'result.json'),JSON.stringify({status,gui,sourceFile,sourceHash,fixtureApiAdapter:true,hostOperationalChanges:false},null,2));await writeFile(path.join(evidence,'server.log'),log);await rm(fixture,{recursive:true,force:true});console.log(JSON.stringify({status,evidence:path.join(evidence,'result.json')}));
}
