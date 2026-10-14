import type {FixtureNginx} from './nginx-http-report.ts';
import {jsonRecord,recordField,listField} from './http-json.ts';
import {hasErrorCode} from '../../lib/error-code.ts';
import {diagnostic} from './nginx-native-report.ts';
import {buildWorkspace} from '../build-workspace.ts';
import {mkdtemp,mkdir,cp,symlink,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {createServer as createProxy,request as upstreamRequest} from 'node:http';
import {existsSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {createHash,randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
const project=process.cwd(),source=process.argv[2];
assert(source&&path.isAbsolute(source),'Pass a production source snapshot');
const snapshot=jsonRecord(JSON.parse(await readFile(path.join(source,'source-snapshot.json'),'utf8')));const sourceFiles=recordField(snapshot,'files');
assert.equal(snapshot.project,project);
for(const [file,hash] of Object.entries(sourceFiles))assert.equal(createHash('sha256').update(await readFile(path.join(project,file))).digest('hex'),hash,'Stale build: '+file);
const fixture=await mkdtemp(path.join(buildWorkspace,'navigation-gui-'));
const build=path.join(fixture,'app');
type Timing={path:string;method:string|undefined;document:boolean;rsc:boolean;prefetch:boolean;navigationPhase:boolean;status?:number;responseHeadersMs?:number;responseCompleteMs?:number};
let child:FixtureNginx|undefined,closed:Promise<unknown[]>|undefined,proxy:ReturnType<typeof createProxy>|undefined,log='',status='FAIL';const requests:Timing[]=[];
const evidence=path.join(buildWorkspace,'navigation-gui-'+new Date().toISOString().replaceAll(':','-'));
await mkdir(evidence,{recursive:true});
try{
 await mkdir(build,{mode:0o700});
 for(const name of ['app','components','lib','public','.next'])await cp(path.join(source,name),path.join(build,name),{recursive:true,filter:file=>!file.includes('/.next/cache')});
 for(const name of ['package.json','next.config.mjs'])await cp(path.join(source,name),path.join(build,name));
 await symlink(path.join(project,'node_modules'),path.join(build,'node_modules'),'dir');
 process.env.LINUX_AUTH_ROOT=path.join(fixture,'auth');process.env.LINUX_STATE_ROOT=path.join(fixture,'state');
 const {passwordHash}=await import('../../lib/auth-password.ts'),{storeCredentials}=await import('../../lib/auth-store.ts');
 const username='navigation-fixture',password=randomBytes(24).toString('base64url');
 storeCredentials(username,await passwordHash(password));
 await writeFile(path.join(fixture,'gui-login.json'),JSON.stringify({username,password}),{mode:0o600});
 const listener=createServer();await new Promise<void>(resolve=>listener.listen(0,'127.0.0.1',resolve));const address=listener.address();assert(address&&typeof address==='object');const port=address.port;await new Promise<void>((resolve,reject)=>listener.close(error=>error?reject(error):resolve()));
 proxy=createProxy((req,res)=>{const started=performance.now(),entry:Timing={path:new URL(req.url||'/','http://fixture').pathname,method:req.method,document:Boolean(req.headers.accept?.includes('text/html')),rsc:req.headers.rsc==='1',prefetch:req.headers['next-router-prefetch']==='1',navigationPhase:existsSync(path.join(fixture,'gui-navigation-start'))};
 const upstream=upstreamRequest({hostname:'127.0.0.1',port,path:req.url,method:req.method,headers:req.headers},response=>{entry.status=response.statusCode;entry.responseHeadersMs=performance.now()-started;res.writeHead(response.statusCode||502,response.headers);response.pipe(res);response.on('end',()=>{entry.responseCompleteMs=performance.now()-started;requests.push(entry);});});upstream.on('error',()=>{if(!res.headersSent)res.writeHead(502);res.end();});req.pipe(upstream);});
 const ownProxy=proxy;await new Promise<void>(resolve=>ownProxy.listen(0,'127.0.0.1',resolve));const proxyAddress=ownProxy.address();assert(proxyAddress&&typeof proxyAddress==='object');const base='http://127.0.0.1:'+proxyAddress.port;
 const env:NodeJS.ProcessEnv={...process.env,BETTER_AUTH_URL:base,NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1',LINUX_PACKAGED:'false',LINUX_WORKSPACE_ROOT:path.join(fixture,'workspace'),LINUX_ENABLE_TERMINAL:'false',LINUX_ENABLE_ADMIN:'false',LINUX_ENABLE_CRON:'false',LINUX_ENABLE_INSTALL:'false',LINUX_ENABLE_AI:'false'};
 delete env.OPENAI_API_KEY;delete env.LINUX_LOGIN_USERNAME;delete env.LINUX_LOGIN_PASSWORD_HASH;
 child=spawn(process.execPath,[path.join(project,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:build,env,detached:true,stdio:['ignore','pipe','pipe']});closed=once(child,'close');child.stdout.on('data',data=>log+=data);child.stderr.on('data',data=>log+=data);
 let ready=false;for(let i=0;i<150;i++){assert.equal(child.exitCode,null);try{if((await fetch(base+'/login')).status===200){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,100));}assert(ready);
 console.log(JSON.stringify({status:'GUI_READY',fixture,url:base+'/login?next=%2Foverview',evidence}));
 const deadline=Date.now()+480000;let assertion:Record<string,unknown>|undefined;
 while(Date.now()<deadline){assert.equal(child.exitCode,null);try{assertion=jsonRecord(JSON.parse(await readFile(path.join(fixture,'gui-result.json'),'utf8')));break;}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}await new Promise(resolve=>setTimeout(resolve,200));}
 assert(assertion,'GUI assertions were not supplied');assert.equal(assertion.status,'PASS');const routes=listField(assertion,'routes');assert.equal(routes.length,9);assert(routes.every(row=>row.shellVisible===true));assert(!requests.some(row=>row.navigationPhase&&row.document),'Whole document navigation occurred');
 await writeFile(path.join(evidence,'http-timings.json'),JSON.stringify(requests,null,2)+'\n');
 await writeFile(path.join(evidence,'gui-assertions.json'),JSON.stringify(assertion,null,2)+'\n');status='PASS';
}catch(error){log+='\n'+diagnostic(error);process.exitCode=1;}finally{
 if(proxy){proxy.closeAllConnections();await new Promise<void>((resolve,reject)=>proxy?.close(error=>error?reject(error):resolve()));}
 if(child?.exitCode===null){const ownedChild=child;if(child.pid)process.kill(-child.pid,'SIGTERM');const timer=setTimeout(()=>{try{if(ownedChild.pid)process.kill(-ownedChild.pid,'SIGKILL');}catch{}},10000);await closed;clearTimeout(timer);}
 await writeFile(path.join(evidence,'server.log'),log);await rm(fixture,{recursive:true,force:true});
 await writeFile(path.join(evidence,'result.json'),JSON.stringify({status,sourceBuild:source,newWorkRoot:buildWorkspace,fixtureRemoved:true,serverStopped:true,scope:'production original GUI navigation, shared shell and server response timings of actual browser requests; no before/after improvement percentage claimed',realPackageInstall:false,hostSettingsChanged:false},null,2)+'\n');
 console.log(JSON.stringify({status,evidence}));
}
