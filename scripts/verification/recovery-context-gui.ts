import type {ChildProcess} from 'node:child_process';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {jsonRecord} from './http-json.ts';
import {hasErrorCode} from '../../lib/error-code.ts';
import {diagnostic} from './nginx-native-report.ts';
// Browser acceptance of the actual operation components, using explicit fixture
// responses. This server has no privileged transport and cannot mutate a DB.
import {mkdtemp,mkdir,cp,copyFile,symlink,writeFile,readFile,rm} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {createHash} from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';

const project=process.cwd(),fixture=await verificationWorkDirectory('tastedev-recovery-context-gui-');
const evidence=path.join(verificationWorkRoot,'recovery-context-gui-'+new Date().toISOString().replaceAll(':','-'));
const sources=['components/nginx-recovery-panel.tsx','components/mariadb-recovery.tsx','components/redis-recovery.tsx','components/node-service-recovery.tsx'];
const hash=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex'),sourceHashes:Record<string,string>={};
let child:ChildProcess|undefined,log='',gui:Record<string,unknown>|undefined,status='FAIL';
try{
 for(const file of sources)sourceHashes[file]=hash(await readFile(path.join(project,file)));
 for(const name of ['components','lib','public'])await cp(path.join(project,name),path.join(fixture,name),{recursive:true});
 await mkdir(path.join(fixture,'app/verify-operation'),{recursive:true});
 for(const name of ['app/layout.tsx','app/globals.css','app/console-design.css','package.json','next.config.mjs','tsconfig.json','next-env.d.ts'])await copyFile(path.join(project,name),path.join(fixture,name));
 await symlink(path.join(project,'node_modules'),path.join(fixture,'node_modules'),'dir');
 await writeFile(path.join(fixture,'app/verify-operation/page.tsx'),` 'use client';
import {useState,useMemo} from 'react';
import Nginx from '../../components/nginx-recovery-panel';
import Maria from '../../components/mariadb-recovery';
import Redis from '../../components/redis-recovery';
import Node from '../../components/node-service-recovery';
import type {SecurityPolicy,NginxApi,NginxFile,NginxRecoveryReview,NginxOperationResult,MariaDBApi,MariaDBRecoveryReview,RedisApi,RedisRecoveryReview,DatabaseOperationResult} from '../../components/console-types';
import type {NodeServiceManagementApi,NodeBasicServicePlan,NodeServiceRecoveryReview,NodeServiceMutationResult} from '../../components/node-types';
type Mode='nginx'|'mariadb'|'redis'|'node';const modes:Mode[]=['nginx','mariadb','redis','node'];
export default function Page(){
 const [mode,setMode]=useState<Mode>('nginx'),[connection,setConnection]=useState(1),[calls,setCalls]=useState<{connection:number;action:string}[]>([]),[busy,setBusy]=useState(false);
 const security=useMemo<SecurityPolicy>(()=>({version:'a'.repeat(64),settings:{readOnly:false,sudoWithoutPrompt:true,nginxChanges:true,databaseChanges:true,certificateChanges:false,serviceChanges:true,sudoPolicyChanges:false,cronChanges:false,packageInstall:false,fileEditing:false,terminal:false,audit:true},available:{nginxChanges:true,databaseChanges:true,serviceChanges:true},requirements:{},privilege:{ready:true,path:'/fixture/helper',reason:'검수 전용 응답'}}),[]);
 const plan=useMemo<NodeBasicServicePlan>(()=>({id:'fixture',registryVersion:'a'.repeat(64),unit:'tastedev-node-fixture.service'}),[]);
 const files=useMemo<NginxFile[]>(()=>[{path:'/etc/nginx/nginx.conf',name:'nginx.conf',source:'fixture'}],[]);
 const api=useMemo<NginxApi&MariaDBApi&RedisApi&NodeServiceManagementApi>(()=>{
 function request(action:\`nginx-recovery-plan?\${string}\`,data?:unknown):Promise<NginxRecoveryReview>;
 function request(action:\`mariadb-recovery-plan?\${string}\`,data?:unknown):Promise<MariaDBRecoveryReview>;
 function request(action:'redis-recovery-plan',data?:unknown):Promise<RedisRecoveryReview>;
 function request(action:\`node-app-service-recovery-plan?id=\${string}\`,data?:unknown):Promise<NodeServiceRecoveryReview>;
 function request(action:'nginx-recover',data?:unknown):Promise<NginxOperationResult>;
 function request(action:'mariadb-recover'|'redis-recover',data?:unknown):Promise<DatabaseOperationResult>;
 function request(action:'node-app-service-recover',data?:unknown):Promise<NodeServiceMutationResult>;
 function request(action:string,data?:unknown):Promise<never>;
 async function request(action:string,data?:unknown):Promise<NginxRecoveryReview|MariaDBRecoveryReview|RedisRecoveryReview|NodeServiceRecoveryReview|DatabaseOperationResult>{
 setCalls(items=>[...items,{connection,action}]);
 if(action.startsWith('nginx-recovery-plan?')){const response:NginxRecoveryReview={path:'/etc/nginx/nginx.conf',recoveryRequired:true,reviewVersion:'b'.repeat(64),backupId:'fixture',currentFiles:[],originalFiles:[],service:{pid:123,start:'fixture',main:'/etc/nginx/nginx.conf',locale:{LC_ALL:'C'}}};return response;}
 if(action.startsWith('mariadb-recovery-plan?')){const response:MariaDBRecoveryReview={root:'/etc/mysql/my.cnf',target:'/etc/mysql/mariadb.conf.d/50-server.cnf',recoveryRequired:true,reviewVersion:'b'.repeat(64),backupId:'fixture',currentFiles:[],originalFiles:[],service:{pid:123,main:'/etc/mysql/my.cnf'}};return response;}
 if(action==='redis-recovery-plan'){const response:RedisRecoveryReview={path:'/etc/redis/redis.conf',recoveryRequired:true,reviewVersion:'b'.repeat(64),backupId:'fixture',currentFiles:[],originalFiles:[],service:{pid:123,service:'redis-server.service'}};return response;}
 if(action.startsWith('node-app-service-recovery-plan?id=')){const options={restart:'no' as const,restartSeconds:5,stopSeconds:null};const response:NodeServiceRecoveryReview={...plan,recoveryRequired:true,reviewVersion:'b'.repeat(64),unitVersion:'c'.repeat(64),backupVersion:'d'.repeat(64),backupId:'fixture',files:[],options,currentOptions:options,serviceOptions:options,restarted:false};return response;}
 if(['nginx-recover','mariadb-recover','redis-recover','node-app-service-recover'].includes(action))return {recovered:true,journalCleanupVerified:true};
 throw Error('미지원 검수 요청');}
 return request;
 },[connection,mode,plan]);
 return <main style={{padding:24,maxWidth:1000,margin:'auto'}}><h1>중단 복구 연결 전환 검사</h1><p>검수용 응답만 사용합니다. 운영 서비스는 변경하지 않습니다.</p><div>{modes.map(value=><button key={value} onClick={()=>setMode(value)}>{value}</button>)}<button onClick={()=>setConnection(value=>value+1)}>연결 변경</button></div><p>연결: {connection}</p>{mode==='nginx'?<Nginx files={files} api={api} connected security={security}/>:mode==='mariadb'?<Maria api={api} connected security={security}/>:mode==='redis'?<Redis api={api} connected security={security}/>:<Node plan={plan} api={api} connected security={security} disabled={busy} onBusy={setBusy}/>}<ol aria-label="검증 요청 기록">{calls.map((call,index)=><li key={index}>{call.connection} · {call.action}</li>)}</ol></main>;

}`,{mode:0o600});
 const env:NodeJS.ProcessEnv={...process.env,NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1',LINUX_STATE_ROOT:path.join(fixture,'state'),LINUX_AUTH_ROOT:path.join(fixture,'auth'),LINUX_WORKSPACE_ROOT:path.join(fixture,'workspace'),LINUX_ENABLE_ADMIN:'false',LINUX_ENABLE_INSTALL:'false',LINUX_ENABLE_TERMINAL:'false',LINUX_ENABLE_AI:'false',LINUX_ENABLE_CRON:'false'};
 delete env.OPENAI_API_KEY;
 child=spawn(process.execPath,[path.join(project,'node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:fixture,env,detached:true,stdio:['ignore','pipe','pipe']});assert(child.stdout&&child.stderr);child.stdout.on('data',bytes=>log+=bytes);child.stderr.on('data',bytes=>log+=bytes);console.log(JSON.stringify({status:'BUILDING',fixture}));assert.equal(await new Promise<number|null>((resolve,reject)=>{assert(child);child.once('error',reject);child.once('close',resolve);}),0,'Typed fixture build failed');
 const socket=createServer();await new Promise<void>((resolve,reject)=>{socket.once('error',reject);socket.listen(0,'127.0.0.2',resolve);});const address=socket.address();assert(address&&typeof address==='object');const port=address.port;await new Promise<void>(resolve=>socket.close(()=>resolve()));
 child=spawn(process.execPath,[path.join(project,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.2','--port',String(port)],{cwd:fixture,env,detached:true,stdio:['ignore','pipe','pipe']});
 assert(child.stdout&&child.stderr);child.stdout.on('data',bytes=>log+=bytes);child.stderr.on('data',bytes=>log+=bytes);
 const url='http://127.0.0.2:'+port+'/verify-operation';
 for(let count=0;;count++){assert(count<100&&child.exitCode===null,'Fixture startup failed');try{if((await fetch(url)).status===200)break;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}
 console.log(JSON.stringify({status:'GUI_READY',fixture,url}));const deadline=Date.now()+600000;
 for(;;){assert(child.exitCode===null&&Date.now()<deadline,'GUI fixture stopped or timed out');try{gui=jsonRecord(JSON.parse(await readFile(path.join(fixture,'gui-result.json'),'utf8')));break;}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}await new Promise(resolve=>setTimeout(resolve,200));}
 assert.equal(gui.status,'PASS');for(const name of ['nginx','mariadb','redis','node'])assert.equal(gui[name],true,name);
 for(const [file,expected] of Object.entries(sourceHashes)){assert.equal(hash(await readFile(path.join(project,file))),expected);assert.equal(hash(await readFile(path.join(fixture,file))),expected);}
 status='PASS';
}catch(error){log+='\n'+diagnostic(error);console.error(diagnostic(error));process.exitCode=1;}
finally{
 if(child?.exitCode===null){const owned=child;owned.kill('SIGTERM');await new Promise<void>(resolve=>{const timer=setTimeout(()=>{owned.kill('SIGKILL');resolve();},10000);owned.once('close',()=>{clearTimeout(timer);resolve();});});}
 await mkdir(evidence,{recursive:true});await writeFile(path.join(evidence,'result.json'),JSON.stringify({status,gui,sourceHashes,fixtureApiAdapter:true,nativeHelperExercised:false,operatingConfigurationChanged:false},null,2));await writeFile(path.join(evidence,'server.log'),log);
 await rm(fixture,{recursive:true,force:true});console.log(JSON.stringify({status,evidence:path.join(evidence,'result.json')}));
}
