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
const hbaOnly=process.argv.includes('--hba'),outcomes=process.argv.includes('--outcomes'),descriptionsOnly=process.argv.includes('--descriptions');assert([hbaOnly,outcomes,descriptionsOnly].filter(Boolean).length<=1);
const project=process.cwd(),fixture=await verificationWorkDirectory('tastedev-pg-operation-gui-');
const evidence=path.join(verificationWorkRoot,'postgresql-operation-gui-'+new Date().toISOString().replaceAll(':','-'));
const sources=descriptionsOnly?['components/file-settings.tsx','components/postgresql-hba-settings.tsx','components/language-provider.tsx','lib/postgresql-setting-description.ts','lib/postgresql-hba-description.ts','lib/locales/postgresql-descriptions.json','lib/locales/postgresql-description-overrides.json','lib/locales/postgresql-hba-descriptions.json']:['components/postgresql-code-operation.tsx','components/postgresql-restore.tsx','components/postgresql-code-recovery.tsx',...(hbaOnly?['components/postgresql-hba-operation.tsx']:[]),...(outcomes?['components/mariadb-code-operation.tsx','components/redis-code-operation.tsx']:[])];
const hash=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex'),sourceHashes:Record<string,string>={};
const template=descriptionsOnly?'scripts/fixtures/postgresql-description-page.tsx':'scripts/fixtures/postgresql-operation-page.tsx';let templateHash:string|undefined,fixtureBuildPassed=false;
let child:ChildProcess|undefined,log='',gui:Record<string,unknown>|undefined,status='FAIL';
let interrupted:NodeJS.Signals|undefined;
const running=(process:ChildProcess)=>process.exitCode===null&&process.signalCode===null;
const interrupt=(signal:NodeJS.Signals)=>{interrupted??=signal;if(child&&running(child))child.kill('SIGTERM');};
const onTerm=()=>interrupt('SIGTERM'),onInt=()=>interrupt('SIGINT');
process.once('SIGTERM',onTerm);process.once('SIGINT',onInt);
try{
 templateHash=hash(await readFile(path.join(project,template)));
 for(const file of sources)sourceHashes[file]=hash(await readFile(path.join(project,file)));
 for(const name of ['components','lib','public','types'])await cp(path.join(project,name),path.join(fixture,name),{recursive:true});
 await mkdir(path.join(fixture,'app/verify-operation'),{recursive:true});
 for(const name of ['app/layout.tsx','app/globals.css','app/console-design.css','package.json','next.config.mjs','tsconfig.json','next-env.d.ts'])await copyFile(path.join(project,name),path.join(fixture,name));
 await symlink(path.join(project,'node_modules'),path.join(fixture,'node_modules'),'dir');
 await copyFile(path.join(project,template),path.join(fixture,'app/verify-operation/client.tsx'));
 await writeFile(path.join(fixture,'app/verify-operation/page.tsx'),`import Page from './client';export default function Fixture(){return ${descriptionsOnly?'<Page/>':`<Page hbaOnly={${JSON.stringify(hbaOnly)}} outcomes={${JSON.stringify(outcomes)}}/>`};}`,{mode:0o600});

 const env:NodeJS.ProcessEnv={...process.env,NODE_ENV:'development',NEXT_TELEMETRY_DISABLED:'1',LINUX_STATE_ROOT:path.join(fixture,'state'),LINUX_AUTH_ROOT:path.join(fixture,'auth'),LINUX_WORKSPACE_ROOT:path.join(fixture,'workspace'),LINUX_ENABLE_ADMIN:'false',LINUX_ENABLE_INSTALL:'false',LINUX_ENABLE_TERMINAL:'false',LINUX_ENABLE_AI:'false',LINUX_ENABLE_CRON:'false'};
 delete env.OPENAI_API_KEY;
 const socket=createServer();await new Promise<void>((resolve,reject)=>{socket.once('error',reject);socket.listen(0,'127.0.0.2',resolve);});const address=socket.address();assert(address&&typeof address==='object');const port=address.port;await new Promise<void>(resolve=>socket.close(()=>resolve()));
 assert(!interrupted,'GUI fixture interrupted: '+interrupted);
 child=spawn(process.execPath,[path.join(project,'node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:fixture,env:{...env,NODE_ENV:'production'},detached:true,stdio:['ignore','pipe','pipe']});
 assert(child.stdout&&child.stderr);child.stdout.on('data',bytes=>log+=bytes);child.stderr.on('data',bytes=>log+=bytes);
 console.log(JSON.stringify({status:'BUILDING',fixture}));assert.equal(await new Promise<number|null>((resolve,reject)=>{assert(child);child.once('error',reject);child.once('close',resolve);}),0,'Typed fixture build failed');fixtureBuildPassed=true;
 assert(!interrupted,'GUI fixture interrupted: '+interrupted);
 child=spawn(process.execPath,[path.join(project,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.2','--port',String(port)],{cwd:fixture,env:{...env,NODE_ENV:'production'},detached:true,stdio:['ignore','pipe','pipe']});assert(child.stdout&&child.stderr);child.stdout.on('data',bytes=>log+=bytes);child.stderr.on('data',bytes=>log+=bytes);
 const url='http://127.0.0.2:'+port+'/verify-operation';
 for(let count=0;;count++){assert(!interrupted,'GUI fixture interrupted: '+interrupted);assert(count<100&&running(child),'Fixture startup failed');try{if((await fetch(url)).status===200)break;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}
 console.log(JSON.stringify({status:'GUI_READY',fixture,url}));const deadline=Date.now()+600000;
 for(;;){assert(!interrupted,'GUI fixture interrupted: '+interrupted);assert(running(child)&&Date.now()<deadline,'GUI fixture stopped or timed out');try{gui=jsonRecord(JSON.parse(await readFile(path.join(fixture,'gui-result.json'),'utf8')));break;}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}await new Promise(resolve=>setTimeout(resolve,200));}
 assert.equal(gui.status,'PASS');for(const key of (descriptionsOnly?['settingsTranslated','descriptionSearchMatched','hbaTranslated','languageSwitchPreservedSource','noConsoleErrors']:outcomes?['postgresqlRollbackShown','mariadbRollbackShown','redisRollbackShown','restoreRollbackShown']:hbaOnly?['diagnosticVisible','retryReviewed','applyConfirmed','applyTargetCleared','readOnlyBlocked']:['applyConfirmed','applyTargetCleared','restoreTargetCleared','restoreConfirmed','recoveryTargetCleared','recoveryConfirmed','readOnlyBlocked']))assert.equal(gui[key],true,key);
 for(const [file,expected] of Object.entries(sourceHashes)){assert.equal(hash(await readFile(path.join(project,file))),expected);assert.equal(hash(await readFile(path.join(fixture,file))),expected);}
 assert.equal(hash(await readFile(path.join(project,template))),templateHash);assert.equal(hash(await readFile(path.join(fixture,'app/verify-operation/client.tsx'))),templateHash);status='PASS';
}catch(error){log+='\n'+diagnostic(error);console.error(diagnostic(error));process.exitCode=1;}
finally{
 if(child&&running(child)){const owned=child;await new Promise<void>(resolve=>{const timer=setTimeout(()=>{owned.kill('SIGKILL');resolve();},10000);owned.once('close',()=>{clearTimeout(timer);resolve();});owned.kill('SIGTERM');});}
 if(interrupted){status='FAIL';process.exitCode=1;}
 await mkdir(evidence,{recursive:true});await writeFile(path.join(evidence,'result.json'),JSON.stringify({status,gui,interrupted,sourceHashes,templateHash,typedProductionFixtureBuild:fixtureBuildPassed,fixtureApiAdapter:!descriptionsOnly,descriptionFixture:descriptionsOnly,nativeHelperExercised:false,operatingConfigurationChanged:false},null,2));await writeFile(path.join(evidence,'server.log'),log);
 await rm(fixture,{recursive:true,force:true});console.log(JSON.stringify({status,evidence:path.join(evidence,'result.json')}));
 process.removeListener('SIGTERM',onTerm);process.removeListener('SIGINT',onInt);
}
