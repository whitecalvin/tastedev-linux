import type {ChildProcess} from 'node:child_process';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {jsonRecord} from './http-json.ts';
import {hasErrorCode} from '../../lib/error-code.ts';
import {diagnostic} from './nginx-native-report.ts';
// Browser acceptance of the actual operation components, using explicit fixture
// responses. This server has no privileged transport and cannot mutate a DB.
import {mkdir,cp,copyFile,symlink,writeFile,readFile,rm} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {createHash} from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';

const project=process.cwd(),fixture=await verificationWorkDirectory('tastedev-service-mutation-gui-');
const evidence=path.join(verificationWorkRoot,'service-mutation-gui-'+new Date().toISOString().replaceAll(':','-'));
const sources=['components/node-service-update.tsx','components/node-service-backups.tsx'];
const hash=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex'),sourceHashes:Record<string,string>={};
let templateSHA256='',child:ChildProcess|undefined,log='',gui:Record<string,unknown>|undefined,status='FAIL';
try{
 for(const file of sources)sourceHashes[file]=hash(await readFile(path.join(project,file)));
 for(const name of ['components','lib','public'])await cp(path.join(project,name),path.join(fixture,name),{recursive:true});
 await mkdir(path.join(fixture,'app/verify-operation'),{recursive:true});
 for(const name of ['app/layout.tsx','app/globals.css','app/console-design.css','package.json','next.config.mjs','tsconfig.json','next-env.d.ts'])await copyFile(path.join(project,name),path.join(fixture,name));
 await symlink(path.join(project,'node_modules'),path.join(fixture,'node_modules'),'dir');
 templateSHA256=hash(await readFile(path.join(project,'scripts/fixtures/service-mutation-page.tsx')));
 await copyFile(path.join(project,'scripts/fixtures/service-mutation-page.tsx'),path.join(fixture,'app/verify-operation/page.tsx'));
 const env:NodeJS.ProcessEnv={...process.env,NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1',LINUX_STATE_ROOT:path.join(fixture,'state'),LINUX_AUTH_ROOT:path.join(fixture,'auth'),LINUX_WORKSPACE_ROOT:path.join(fixture,'workspace'),LINUX_ENABLE_ADMIN:'false',LINUX_ENABLE_INSTALL:'false',LINUX_ENABLE_TERMINAL:'false',LINUX_ENABLE_AI:'false',LINUX_ENABLE_CRON:'false'};
 delete env.OPENAI_API_KEY;
 child=spawn(process.execPath,[path.join(project,'node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:fixture,env,stdio:['ignore','pipe','pipe']});assert(child.stdout&&child.stderr);child.stdout.on('data',bytes=>log+=bytes);child.stderr.on('data',bytes=>log+=bytes);console.log(JSON.stringify({status:'BUILDING',fixture}));assert.equal(await new Promise<number|null>((resolve,reject)=>{assert(child);child.once('error',reject);child.once('close',resolve);}),0,'Typed fixture build failed');
 const socket=createServer();await new Promise<void>((resolve,reject)=>{socket.once('error',reject);socket.listen(0,'127.0.0.2',resolve);});const address=socket.address();assert(address&&typeof address==='object');const port=address.port;await new Promise<void>(resolve=>socket.close(()=>resolve()));
 child=spawn(process.execPath,[path.join(project,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.2','--port',String(port)],{cwd:fixture,env,detached:true,stdio:['ignore','pipe','pipe']});
 assert(child.stdout&&child.stderr);child.stdout.on('data',bytes=>log+=bytes);child.stderr.on('data',bytes=>log+=bytes);
 const url='http://127.0.0.2:'+port+'/verify-operation';
 for(let count=0;;count++){assert(count<100&&child.exitCode===null,'Fixture startup failed');try{if((await fetch(url)).status===200)break;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}
 console.log(JSON.stringify({status:'GUI_READY',fixture,url}));const deadline=Date.now()+600000;
 for(;;){assert(child.exitCode===null&&Date.now()<deadline,'GUI fixture stopped or timed out');try{gui=jsonRecord(JSON.parse(await readFile(path.join(fixture,'gui-result.json'),'utf8')));break;}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}await new Promise(resolve=>setTimeout(resolve,200));}
 assert.equal(gui.status,'PASS');for(const name of ['update','backups'])assert.equal(gui[name],true,name);
 for(const [file,expected] of Object.entries(sourceHashes)){assert.equal(hash(await readFile(path.join(project,file))),expected);assert.equal(hash(await readFile(path.join(fixture,file))),expected);}
 assert.equal(hash(await readFile(path.join(project,'scripts/fixtures/service-mutation-page.tsx'))),templateSHA256);assert.equal(hash(await readFile(path.join(fixture,'app/verify-operation/page.tsx'))),templateSHA256);
 status='PASS';
}catch(error){log+='\n'+diagnostic(error);console.error(diagnostic(error));process.exitCode=1;}
finally{
 if(child?.exitCode===null){const owned=child;owned.kill('SIGTERM');await new Promise<void>(resolve=>{const timer=setTimeout(()=>{owned.kill('SIGKILL');resolve();},10000);owned.once('close',()=>{clearTimeout(timer);resolve();});});}
 await mkdir(evidence,{recursive:true});await writeFile(path.join(evidence,'result.json'),JSON.stringify({status,gui,sourceHashes,templateSHA256,fixtureApiAdapter:true,nativeHelperExercised:false,operatingConfigurationChanged:false},null,2));await writeFile(path.join(evidence,'server.log'),log);
 await rm(fixture,{recursive:true,force:true});console.log(JSON.stringify({status,evidence:path.join(evidence,'result.json')}));
}
