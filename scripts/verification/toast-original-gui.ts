import {verificationWorkDirectory} from './work-directory.ts';
import {mkdir,cp,copyFile,readFile,writeFile,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import assert from 'node:assert/strict';

const project=process.cwd(),root=await verificationWorkDirectory('toast-ui-fixture-');
for(const name of ['components','lib','types','public'])await cp(join(project,name),join(root,name),{recursive:true});
for(const name of ['package.json','next.config.mjs','tsconfig.json','next-env.d.ts'])await copyFile(join(project,name),join(root,name));
await symlink(join(project,'node_modules'),join(root,'node_modules'),'dir');await mkdir(join(root,'app'));
for(const name of ['globals.css','console-design.css'])await copyFile(join(project,'app',name),join(root,'app',name));
const layout=`import type {ReactNode} from 'react';
import './globals.css';import './console-design.css';
import {LanguageProvider} from '../components/language-provider';
import {ToastProvider} from '../components/ui/toast-provider';
export default function Layout({children}:{children:ReactNode}){return <html lang="ko" data-theme="light"><body><LanguageProvider><ToastProvider>{children}</ToastProvider></LanguageProvider></body></html>}
`;
await writeFile(join(root,'app/layout.tsx'),layout);
await writeFile(join(root,'app/page.tsx'),(await readFile(join(project,'scripts/fixtures/toast-page.tsx'),'utf8')).replaceAll("'../../components/","'../components/"));
const env={...process.env,NEXT_TELEMETRY_DISABLED:'1',LINUX_ENABLE_ADMIN:'false',LINUX_ENABLE_TERMINAL:'false',LINUX_ENABLE_INSTALL:'false',LINUX_ENABLE_AI:'false'};
const build=spawn(process.execPath,[join(project,'node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:root,env,stdio:['ignore','pipe','pipe']});let log='';build.stdout.on('data',bytes=>log+=bytes);build.stderr.on('data',bytes=>log+=bytes);
const code=await new Promise<number|null>((resolve,reject)=>{build.once('error',reject);build.once('close',resolve);});await writeFile(join(root,'build.log'),log);if(code!==0)throw Error(log.slice(-5000));
const listener=createServer();await new Promise<void>(resolve=>listener.listen(0,'127.0.0.1',resolve));const address=listener.address();assert(address&&typeof address==='object');const port=address.port;await new Promise<void>(resolve=>listener.close(()=>resolve()));
const server=spawn(process.execPath,[join(project,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:root,env,detached:true,stdio:['ignore','pipe','pipe']});let serverLog='';server.stdout.on('data',bytes=>serverLog+=bytes);server.stderr.on('data',bytes=>serverLog+=bytes);
const origin='http://127.0.0.1:'+port;for(let attempt=0;attempt<100;attempt++){try{if((await fetch(origin)).ok)break;}catch{}if(attempt===99)throw Error('Fixture server did not start');await new Promise(resolve=>setTimeout(resolve,100));}
await writeFile(join(root,'ready.json'),JSON.stringify({origin,root,fixtureOnly:true,operatingActions:false},null,2)+'\n');console.log(JSON.stringify({origin,root,status:'READY_UI_FIXTURE'}));
await new Promise<void>(resolve=>{const timer=setTimeout(resolve,300000);process.once('SIGTERM',()=>{clearTimeout(timer);resolve();});process.once('SIGINT',()=>{clearTimeout(timer);resolve();});});
if(server.pid){try{process.kill(-server.pid,'SIGTERM');}catch(error){if(!(error instanceof Error&&'code' in error&&error.code==='ESRCH'))throw error;}}
await writeFile(join(root,'server.log'),serverLog);await writeFile(join(root,'cleanup.json'),JSON.stringify({ownedServerStopRequested:true,operatingActions:false})+'\n');console.log('UI_FIXTURE_STOPPED');
