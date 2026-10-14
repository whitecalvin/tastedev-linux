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

const project=process.cwd(),fixture=await verificationWorkDirectory('tastedev-node-recovery-completion-gui-');
const evidence=path.join(verificationWorkRoot,'node-recovery-completion-gui-'+new Date().toISOString().replaceAll(':','-'));
const sources=['components/node-apps.tsx','components/node-service-update.tsx','components/node-service-recovery.tsx'];
const hash=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex'),sourceHashes:Record<string,string>={};
let child:ChildProcess|undefined,log='',gui:Record<string,unknown>|undefined,status='FAIL';
try{
 for(const file of sources)sourceHashes[file]=hash(await readFile(path.join(project,file)));
 for(const name of ['components','lib','public'])await cp(path.join(project,name),path.join(fixture,name),{recursive:true});
 await mkdir(path.join(fixture,'app/verify-operation'),{recursive:true});
 for(const name of ['app/layout.tsx','app/globals.css','app/console-design.css','package.json','next.config.mjs','tsconfig.json','next-env.d.ts'])await copyFile(path.join(project,name),path.join(fixture,name));
 await symlink(path.join(project,'node_modules'),path.join(fixture,'node_modules'),'dir');
 await writeFile(path.join(fixture,'app/verify-operation/page.tsx'),`'use client';
import {useMemo,useState} from 'react';
import NodeApps from '../../components/node-apps';
import type {SecurityPolicy} from '../../components/console-types';
import type {NodeAppsApi,NodeAppRegistry,NodeAppFiles,NodeReviewedServicePlan,NodeServiceSettings,NodeServiceRecoveryReview,NodeServiceMutationResult} from '../../components/node-types';
export default function Page(){
 const [calls,setCalls]=useState<string[]>([]),initialData=useMemo<NodeAppRegistry>(()=>({version:'a'.repeat(64),apps:[{id:'demo',label:'전용 검수 앱',directory:'/fixture/app',entry:'server.mjs',environmentFile:'.env',unit:'tastedev-node-demo.service'}]}),[]);
 const security=useMemo<SecurityPolicy>(()=>({version:'a'.repeat(64),settings:{readOnly:false,sudoWithoutPrompt:true,nginxChanges:false,databaseChanges:false,certificateChanges:false,serviceChanges:true,sudoPolicyChanges:false,cronChanges:false,packageInstall:false,fileEditing:false,terminal:false,audit:true},available:{serviceChanges:true},requirements:{},privilege:{ready:true,path:'/fixture/helper',reason:'검수 전용 응답'}}),[]);
 const api=useMemo<NodeAppsApi>(()=>{
 function request(action:\`node-app-files?id=\${string}\`,body?:unknown):Promise<NodeAppFiles>;
 function request(action:\`node-app-service-plan?id=\${string}\`,body?:unknown):Promise<NodeReviewedServicePlan>;
 function request(action:\`node-app-service-settings?id=\${string}\`,body?:unknown):Promise<NodeServiceSettings>;
 function request(action:\`node-app-service-recovery-plan?id=\${string}\`,body?:unknown):Promise<NodeServiceRecoveryReview>;
 function request(action:'node-app-service-recover',body?:unknown):Promise<NodeServiceMutationResult>;
 function request(action:string,body?:unknown):Promise<never>;
 async function request(action:string,body?:unknown):Promise<NodeAppFiles|NodeReviewedServicePlan|NodeServiceSettings|NodeServiceRecoveryReview|NodeServiceMutationResult>{
 setCalls(values=>[...values,action]);const base={id:'demo',registryVersion:'a'.repeat(64),unit:'tastedev-node-demo.service'};
 if(action.startsWith('node-app-files')){const response:NodeAppFiles={...base,directory:'/fixture/app',directoryStatus:'ready',ready:true,files:[],notice:'검수 전용 파일 상태'};return response;}
 if(action.startsWith('node-app-service-plan')){const response:NodeReviewedServicePlan={...base,text:'검수 전용 서비스 후보',notice:'격리된 GUI 응답',runtime:{status:'ready',executable:'/usr/bin/node',version:'fixture'},files:[],serviceOptions:{restart:'on-failure',restartSeconds:5,stopSeconds:null}};return response;}
 if(action.startsWith('node-app-service-settings')){const response:NodeServiceSettings={...base,registered:true,unitVersion:'b'.repeat(64),serviceOptions:{restart:'no',restartSeconds:5,stopSeconds:null}};return response;}
 if(action==='node-app-service-update')throw Error('관리 작업 실행이 중단되어 적용 결과를 확인할 수 없습니다.');
 if(action.startsWith('node-app-service-recovery-plan')){const response:NodeServiceRecoveryReview={...base,recoveryRequired:true,reviewVersion:'c'.repeat(64),unitVersion:'b'.repeat(64),backupVersion:'d'.repeat(64),backupId:'fixture-backup',currentOptions:{restart:'on-failure',restartSeconds:5,stopSeconds:null},serviceOptions:{restart:'no',restartSeconds:5,stopSeconds:null},files:[],options:{restart:'no',restartSeconds:5,stopSeconds:null},restarted:false};return response;}
 if(action==='node-app-service-recover')return {unit:base.unit,recovered:true,backupId:'fixture-backup',journalCleanupVerified:true};
 throw Error('미지원 검수 요청');}
 return request;
 },[]);
 return <main style={{padding:16,maxWidth:1000,margin:'auto'}}><h1>Node.js 복구 완료 안내 확인</h1><p>실제 서비스 변경 없이 원래 앱 컴포넌트와 격리 응답을 사용합니다.</p><NodeApps api={api} connected security={security} initialData={initialData} selectedId="demo" expanded tabbed/><ol aria-label="검증 요청 기록">{calls.map((call,index)=><li key={index}>{call}</li>)}</ol></main>;
}

`,{mode:0o600});
 const env:NodeJS.ProcessEnv={...process.env,NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1',LINUX_STATE_ROOT:path.join(fixture,'state'),LINUX_AUTH_ROOT:path.join(fixture,'auth'),LINUX_WORKSPACE_ROOT:path.join(fixture,'workspace'),LINUX_ENABLE_ADMIN:'false',LINUX_ENABLE_INSTALL:'false',LINUX_ENABLE_TERMINAL:'false',LINUX_ENABLE_AI:'false',LINUX_ENABLE_CRON:'false'};
 delete env.OPENAI_API_KEY;
 child=spawn(process.execPath,[path.join(project,'node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:fixture,env,stdio:['ignore','pipe','pipe']});assert(child.stdout&&child.stderr);child.stdout.on('data',bytes=>log+=bytes);child.stderr.on('data',bytes=>log+=bytes);console.log(JSON.stringify({status:'BUILDING',fixture}));assert.equal(await new Promise<number|null>((resolve,reject)=>{assert(child);child.once('error',reject);child.once('close',resolve);}),0,'Typed fixture build failed');
 const socket=createServer();await new Promise<void>((resolve,reject)=>{socket.once('error',reject);socket.listen(0,'127.0.0.2',resolve);});const address=socket.address();assert(address&&typeof address==='object');const port=address.port;await new Promise<void>(resolve=>socket.close(()=>resolve()));
 child=spawn(process.execPath,[path.join(project,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.2','--port',String(port)],{cwd:fixture,env,stdio:['ignore','pipe','pipe']});
 assert(child.stdout&&child.stderr);child.stdout.on('data',bytes=>log+=bytes);child.stderr.on('data',bytes=>log+=bytes);
 const url='http://127.0.0.2:'+port+'/verify-operation';
 for(let count=0;;count++){assert(count<100&&child.exitCode===null,'Fixture startup failed');try{if((await fetch(url)).status===200)break;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}
 console.log(JSON.stringify({status:'GUI_READY',fixture,url}));const deadline=Date.now()+600000;
 for(;;){assert(child.exitCode===null&&Date.now()<deadline,'GUI fixture stopped or timed out');try{gui=jsonRecord(JSON.parse(await readFile(path.join(fixture,'gui-result.json'),'utf8')));break;}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}await new Promise(resolve=>setTimeout(resolve,200));}
 assert.equal(gui.status,'PASS');assert.equal(gui.oldWarningCleared,true);assert.equal(gui.completionRetained,true);
 for(const [file,expected] of Object.entries(sourceHashes)){assert.equal(hash(await readFile(path.join(project,file))),expected);assert.equal(hash(await readFile(path.join(fixture,file))),expected);}
 status='PASS';
}catch(error){log+='\n'+diagnostic(error);console.error(diagnostic(error));process.exitCode=1;}
finally{
 if(child?.exitCode===null){const owned=child;owned.kill('SIGTERM');await new Promise<void>(resolve=>{const timer=setTimeout(()=>{owned.kill('SIGKILL');resolve();},10000);owned.once('close',()=>{clearTimeout(timer);resolve();});});}
 await mkdir(evidence,{recursive:true});await writeFile(path.join(evidence,'result.json'),JSON.stringify({status,gui,sourceHashes,fixtureApiAdapter:true,nativeHelperExercised:false,operatingConfigurationChanged:false},null,2));await writeFile(path.join(evidence,'server.log'),log);
 await rm(fixture,{recursive:true,force:true});console.log(JSON.stringify({status,evidence:path.join(evidence,'result.json')}));
}
