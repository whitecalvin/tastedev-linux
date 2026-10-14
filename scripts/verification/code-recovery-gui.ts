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

const project=process.cwd(),fixture=await verificationWorkDirectory('tastedev-code-recovery-gui-');
const evidence=path.join(verificationWorkRoot,'code-recovery-gui-'+new Date().toISOString().replaceAll(':','-'));
const sources=['components/mariadb-code-operation.tsx','components/redis-code-operation.tsx','components/mariadb-recovery.tsx','components/redis-recovery.tsx'];
const hash=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex'),sourceHashes:Record<string,string>={};
let child:ChildProcess|undefined,log='',gui:Record<string,unknown>|undefined,status='FAIL';
try{
 for(const file of sources)sourceHashes[file]=hash(await readFile(path.join(project,file)));
 for(const name of ['components','lib','public'])await cp(path.join(project,name),path.join(fixture,name),{recursive:true});
 await mkdir(path.join(fixture,'app/verify-operation'),{recursive:true});
 for(const name of ['app/layout.tsx','app/globals.css','app/console-design.css','package.json','next.config.mjs','tsconfig.json','next-env.d.ts'])await copyFile(path.join(project,name),path.join(fixture,name));
 await symlink(path.join(project,'node_modules'),path.join(fixture,'node_modules'),'dir');
 await writeFile(path.join(fixture,'app/verify-operation/page.tsx'),`'use client';
import {useState,useMemo} from 'react';
import Maria from '../../components/mariadb-code-operation';
import Redis from '../../components/redis-code-operation';
import type {SecurityPolicy,RedisApi,MariaDBApi,RedisCodeInput,MariaDBCodeInput,DatabaseCodePlan,DatabaseOperationResult,RedisRecoveryReview,MariaDBRecoveryReview} from '../../components/console-types';
type FixtureInput={kind:'redis';value:RedisCodeInput}|{kind:'mariadb';value:MariaDBCodeInput};
export default function Page(){
 const [mode,setMode]=useState<'redis'|'mariadb'>('redis'),[calls,setCalls]=useState<{action:string;data?:unknown}[]>([]);
 const security=useMemo<SecurityPolicy>(()=>({version:'a'.repeat(64),settings:{readOnly:false,sudoWithoutPrompt:true,nginxChanges:false,databaseChanges:true,certificateChanges:false,serviceChanges:false,sudoPolicyChanges:false,cronChanges:false,packageInstall:false,fileEditing:false,terminal:false,audit:true},available:{databaseChanges:true},requirements:{},privilege:{ready:true,path:'/fixture/helper',reason:'검수 전용 응답'}}),[]);
 const input=useMemo<FixtureInput>(()=>mode==='redis'?{kind:'redis',value:{path:'/etc/redis/redis.conf',version:'a'.repeat(64),text:'maxclients 123\\n'}}:{kind:'mariadb',value:{path:'/etc/mysql/conf.d/app.cnf',root:'/etc/mysql/mariadb.cnf',version:'a'.repeat(64),text:'[mysqld]\\nmax_connections=123\\n'}},[mode]);
 const api=useMemo<RedisApi&MariaDBApi>(()=>{
 function request(action:'redis-code-plan'|'mariadb-code-plan',data?:unknown):Promise<DatabaseCodePlan>;
 function request(action:'redis-recovery-plan',data?:unknown):Promise<RedisRecoveryReview>;
 function request(action:\`mariadb-recovery-plan?\${string}\`,data?:unknown):Promise<MariaDBRecoveryReview>;
 function request(action:'redis-code-apply'|'mariadb-code-apply'|'redis-recover'|'mariadb-recover',data?:unknown):Promise<DatabaseOperationResult>;
 function request(action:string,data?:unknown):Promise<never>;
 async function request(action:string,data?:unknown):Promise<DatabaseCodePlan|RedisRecoveryReview|MariaDBRecoveryReview|DatabaseOperationResult>{setCalls(items=>[...items,{action,data}]);
 if(action==='redis-code-plan'||action==='mariadb-code-plan')return {changed:true,graphVersion:'b'.repeat(64),candidateGraphVersion:'c'.repeat(64),reviewVersion:'d'.repeat(64)};
 if(action==='redis-code-apply'||action==='mariadb-code-apply')throw Error('관리 작업 실행이 중단되어 적용 결과를 확인할 수 없습니다.');
 if(action==='redis-recovery-plan'){if(input.kind!=='redis')throw Error('Redis 검수 문맥을 확인하세요.');const result:RedisRecoveryReview={recoveryRequired:true,reviewVersion:'e'.repeat(64),path:input.value.path,backupId:'fixture-backup',currentFiles:[],originalFiles:[],service:{pid:123,service:'redis-server.service'}};return result;}
 if(action.startsWith('mariadb-recovery-plan?')){if(input.kind!=='mariadb')throw Error('MariaDB 검수 문맥을 확인하세요.');const result:MariaDBRecoveryReview={recoveryRequired:true,reviewVersion:'e'.repeat(64),root:input.value.root,target:input.value.path,backupId:'fixture-backup',currentFiles:[],originalFiles:[],service:{pid:123,main:input.value.root}};return result;}
 if(action==='redis-recover'||action==='mariadb-recover')return {recovered:true,backupId:'fixture-backup',journalCleanupVerified:true};
 throw Error('미지원 검수 요청');}
 return request;
 },[input]);
 return <main style={{padding:24,maxWidth:1000,margin:'auto'}}><h1>코드 적용 중단 복구 검사</h1><p>격리된 GUI 응답만 사용합니다. 실제 서비스는 변경하지 않습니다.</p><button onClick={()=>{setMode('redis');setCalls([]);}}>Redis 화면</button><button onClick={()=>{setMode('mariadb');setCalls([]);}}>MariaDB 화면</button>{input.kind==='redis'?<Redis key={mode} input={input.value} api={api} connected security={security}/>:<Maria key={mode} input={input.value} api={api} connected security={security}/>}<ol aria-label="검증 요청 기록">{calls.map((call,index)=><li key={index}>{call.action}</li>)}</ol></main>;

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
 assert.equal(gui.status,'PASS');for(const name of ['mariadb','redis'])assert.equal(gui[name],true,name);
 for(const [file,expected] of Object.entries(sourceHashes)){assert.equal(hash(await readFile(path.join(project,file))),expected);assert.equal(hash(await readFile(path.join(fixture,file))),expected);}
 status='PASS';
}catch(error){log+='\n'+diagnostic(error);console.error(diagnostic(error));process.exitCode=1;}
finally{
 if(child?.exitCode===null){const owned=child;owned.kill('SIGTERM');await new Promise<void>(resolve=>{const timer=setTimeout(()=>{owned.kill('SIGKILL');resolve();},10000);owned.once('close',()=>{clearTimeout(timer);resolve();});});}
 await mkdir(evidence,{recursive:true});await writeFile(path.join(evidence,'result.json'),JSON.stringify({status,gui,sourceHashes,fixtureApiAdapter:true,nativeHelperExercised:false,operatingConfigurationChanged:false},null,2));await writeFile(path.join(evidence,'server.log'),log);
 await rm(fixture,{recursive:true,force:true});console.log(JSON.stringify({status,evidence:path.join(evidence,'result.json')}));
}
