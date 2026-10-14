import type {FixtureNginx} from './nginx-http-report.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {jsonRecord,recordField} from './http-json.ts';
import {hasErrorCode} from '../../lib/error-code.ts';
import {diagnostic} from './nginx-native-report.ts';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join,isAbsolute} from 'node:path';
import {randomBytes,createHash} from 'node:crypto';
import {createServer} from 'node:net';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import Database from 'better-sqlite3';
import assert from 'node:assert/strict';
const build=process.argv[2],project=process.cwd();assert(build&&isAbsolute(build));
const snapshot=jsonRecord(JSON.parse(await readFile(join(build,'source-snapshot.json'),'utf8')));
for(const [file,hash] of Object.entries(recordField(snapshot,'files')))assert.equal(createHash('sha256').update(await readFile(join(project,file))).digest('hex'),hash,'Stale source: '+file);
const fixture=await verificationWorkDirectory('tastedev-session-maintenance-gui-');
const listener=createServer();await new Promise<void>(resolve=>listener.listen(0,'127.0.0.2',resolve));const address=listener.address();assert(address&&typeof address==='object');const port=address.port;await new Promise<void>((resolve,reject)=>listener.close(error=>error?reject(error):resolve()));
const base='http://127.0.0.2:'+port;
process.env.LINUX_AUTH_ROOT=join(fixture,'auth');process.env.LINUX_STATE_ROOT=join(fixture,'state');
const {passwordHash}=await import('../../lib/auth-password.ts'),{storeCredentials}=await import('../../lib/auth-store.ts');
const username='maintenance-fixture',password=randomBytes(24).toString('base64url');storeCredentials(username,await passwordHash(password));
const exists=async(name:string)=>{try{await readFile(join(fixture,name));return true;}catch(error){if(hasErrorCode(error,'ENOENT'))return false;throw error;}};
type Report={status:string;build:string;hostAccountsChanged:boolean;operatingMutationsEnabled:boolean;agedAt?:number;renewedAt?:number;elapsedBeforeRenewal?:number;error?:string;temporaryServerStopped?:boolean;fixtureRemoved?:boolean};
let child:FixtureNginx|undefined,closed:Promise<unknown[]>|undefined,log='',aged=false,renewed=false,report:Report={status:'FAIL',build,hostAccountsChanged:false,operatingMutationsEnabled:false};
try{
 const env:NodeJS.ProcessEnv={...process.env,NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1',BETTER_AUTH_URL:base,LINUX_WORKSPACE_ROOT:join(fixture,'workspace'),LINUX_ENABLE_ADMIN:'false',LINUX_ENABLE_INSTALL:'false',LINUX_ENABLE_TERMINAL:'false',LINUX_ENABLE_CRON:'false',LINUX_ENABLE_AI:'false'};
 delete env.OPENAI_API_KEY;delete env.LINUX_LOGIN_USERNAME;delete env.LINUX_LOGIN_PASSWORD_HASH;
 child=spawn(process.execPath,[join(project,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.2','--port',String(port)],{cwd:build,env,stdio:['ignore','pipe','pipe']});closed=once(child,'close');
 child.stdout.on('data',bytes=>log+=bytes);child.stderr.on('data',bytes=>log+=bytes);
 for(let attempt=0;;attempt++){assert(attempt<100&&child.exitCode===null,'Fixture server failed');try{if((await fetch(base+'/login')).status===200)break;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}
 await writeFile(join(fixture,'gui-login.json'),JSON.stringify({username,password}),{mode:0o600});
 console.log(JSON.stringify({status:'GUI_READY',fixture,url:base+'/overview?fixture=session-maintenance'}));
 const deadline=Date.now()+12*60000;
 while(!(await exists('gui-stop'))){
  assert(child.exitCode===null&&Date.now()<deadline,'Fixture stopped or GUI timed out');
  if(!aged&&await exists('gui-age')){
   const db=new Database(join(fixture,'auth/better-auth/auth.sqlite'));
   try{const before=Date.now()-25*3600000;assert(db.prepare('UPDATE session SET createdAt=?,updatedAt=?,expiresAt=? WHERE userId=?').run(before,before,before+7*86400000,'tastedev-administrator').changes>0);report.agedAt=Date.now();}finally{db.close();}
   aged=true;await writeFile(join(fixture,'aged.json'),JSON.stringify({agedAt:report.agedAt}));console.log(JSON.stringify({status:'SESSION_AGED',agedAt:report.agedAt}));
  }
  if(aged&&!renewed){
   const db=new Database(join(fixture,'auth/better-auth/auth.sqlite'),{readonly:true});let expiresAt;
   try{const row=jsonRecord(db.prepare('SELECT expiresAt FROM session WHERE userId=?').get('tastedev-administrator'));assert(typeof row.expiresAt==='string'||typeof row.expiresAt==='number');expiresAt=new Date(row.expiresAt).getTime();}finally{db.close();}
   if(expiresAt>Date.now()+6*86400000){renewed=true;report.renewedAt=Date.now();assert(typeof report.agedAt==='number');report.elapsedBeforeRenewal=report.renewedAt-report.agedAt;await writeFile(join(fixture,'renewed.json'),JSON.stringify({renewedAt:report.renewedAt,elapsedBeforeRenewal:report.elapsedBeforeRenewal}));console.log(JSON.stringify({status:'SESSION_RENEWED',elapsedBeforeRenewal:report.elapsedBeforeRenewal}));}
  }
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 assert(aged&&renewed,'Browser session renewal not observed');
 assert(typeof report.elapsedBeforeRenewal==='number'&&report.elapsedBeforeRenewal>240000,'Renewal happened before the browser maintenance window; evidence is inconclusive');
 const db=new Database(join(fixture,'auth/better-auth/auth.sqlite'),{readonly:true});try{assert.equal(jsonRecord(db.prepare('SELECT COUNT(*) AS count FROM session').get()).count,0,'Fixture browser must log out before completion');}finally{db.close();}
 report.status='PASS';
}catch(error){report.error=diagnostic(error);process.exitCode=1;console.error(diagnostic(error));}
finally{
 if(child?.exitCode===null){child.kill('SIGTERM');const ownedChild=child;const timer=setTimeout(()=>ownedChild.kill('SIGKILL'),10000);await closed;clearTimeout(timer);}
 report.temporaryServerStopped=true;await rm(fixture,{recursive:true,force:true});report.fixtureRemoved=true;
 const evidence=join(verificationWorkRoot,'session-maintenance-gui-'+new Date().toISOString().replaceAll(':','-'));await mkdir(evidence,{recursive:true});await writeFile(join(evidence,'result.json'),JSON.stringify(report,null,2)+'\n');await writeFile(join(evidence,'server.log'),log);console.log(JSON.stringify({status:report.status,evidence}));
}
