import type {ChildProcess} from 'node:child_process';
import type {Server} from 'node:http';
import {jsonRecord,recordField} from '../verification/http-json.ts';

import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync,spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {userInfo} from 'node:os';
import {cronStatus,applyCron,deleteCron,cronEntry} from '../../lib/server-tools.ts';
import {backups,backupPreview,restorePlan,restoreBackup} from '../../lib/operations.ts';
const nextMode=process.argv.includes('--next'),guiMode=process.argv.includes('--gui');
const hash=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex');
assert.notEqual(process.getuid?.(),0);assert.match(fs.readFileSync('/proc/self/uid_map','utf8').trim(),/^\d+\s+\d+\s+1$/);assert(fs.readFileSync('/proc/self/mountinfo','utf8').split('\n').some(line=>line.split(' ')[4]==='/var/spool'&&line.includes(' - tmpfs '))); assert.equal(process.getuid?.(),userInfo().uid);
assert.equal(hash(fs.readFileSync('/usr/bin/crontab')),hash(fs.readFileSync('/mnt/data/build/tastedev-linux/cron-evidence/crontab')));
fs.mkdirSync('/var/spool/cron/crontabs',{recursive:true,mode:0o1730});
const native=(args:string[])=>execFileSync('/usr/bin/crontab',args,{encoding:'utf8',env:{...process.env,LC_ALL:'C'},timeout:5000});
const install=(text:string)=>{fs.writeFileSync('/mnt/data/build/tastedev-linux/cron-evidence/input',text,{mode:0o600});native(['/mnt/data/build/tastedev-linux/cron-evidence/input']);};
const read=()=>native(['-l']),checks:string[]=[];
const original='PATH=/usr/bin\n15 2 * * * /bin/true # unmanaged\n';install(original);
if(!nextMode){
let status=await cronStatus();assert.equal(status.text,original);assert.equal(status.canApply,true);assert.equal(status.account.username,userInfo().username);checks.push('ordinary OS account status through native crontab');
const job={name:'daily',schedule:'0 3 * * *',command:'/bin/true',enabled:true};
await assert.rejects(applyCron({...job,version:status.version,confirm:false}));assert.equal(read(),original);checks.push('unconfirmed apply leaves native crontab unchanged');
status=await applyCron({...job,version:status.version,confirm:true});assert.equal(read(),status.text);assert.deepEqual(status.jobs,[job]);assert.equal(status.account.username,userInfo().username);assert(status.clock);checks.push('app apply installs native current-user crontab and keeps metadata');
const snapshot=(await backups()).find(item=>item.sha256===hash(original));assert(snapshot);assert.equal((await backupPreview(snapshot.id)).text,original);checks.push('pre-change backup records original bytes');
const beforeEdit=read();await assert.rejects(applyCron({...job,version:hash(original),confirm:true}),(e:unknown)=>e!==null&&typeof e==='object'&&'status' in e&&e.status===409);assert.equal(read(),beforeEdit);checks.push('stale app apply rejected');
status=await applyCron({...job,enabled:false,version:status.version,confirm:true});assert.equal(read(),status.text);assert.equal(status.jobs[0].enabled,false);checks.push('app disable installs commented managed entry');
status=await deleteCron({name:job.name,version:status.version,confirm:true});assert.equal(read(),original);assert.deepEqual(status.jobs,[]);checks.push('app delete preserves unmanaged job');
status=await applyCron({...job,version:status.version,confirm:true});const restore=await restorePlan(snapshot.id);
await assert.rejects(restoreBackup({id:snapshot.id,backupVersion:snapshot.sha256,version:hash(original),confirm:true}),(e:unknown)=>e!==null&&typeof e==='object'&&'status' in e&&e.status===409);assert.equal(read(),status.text);checks.push('stale restore rejected');
const backupFile='/mnt/data/build/tastedev-linux/cron-evidence/state/server-tools/'+snapshot.id+'.backup.json';const backupBytes=fs.readFileSync(backupFile,'utf8');
const altered=jsonRecord(JSON.parse(backupBytes)),alteredText=original+'0 4 * * * /bin/true\n';altered.text=alteredText;altered.sha256=hash(alteredText);fs.writeFileSync(backupFile,JSON.stringify(altered));
await assert.rejects(restoreBackup({id:snapshot.id,backupVersion:snapshot.sha256,version:restore.version,confirm:true}),(e:unknown)=>e!==null&&typeof e==='object'&&'status' in e&&e.status===409);assert.equal(read(),status.text);checks.push('changed backup bytes rejected after review even with valid internal hash');fs.writeFileSync(backupFile,backupBytes);
await assert.rejects(restoreBackup({id:snapshot.id,version:restore.version,confirm:true}),(e:unknown)=>e!==null&&typeof e==='object'&&'status' in e&&e.status===409);assert.equal(read(),status.text);checks.push('unbound backup review rejected');
await restoreBackup({id:snapshot.id,backupVersion:snapshot.sha256,version:restore.version,confirm:true});assert.equal(read(),original);checks.push('app restore reinstalls original native snapshot');
status=await cronStatus();
const competing=await Promise.allSettled([applyCron({...job,name:'first',version:status.version,confirm:true}),applyCron({...job,name:'second',version:status.version,confirm:true})]);
assert.equal(competing.filter(result=>result.status==='fulfilled').length,1);assert.equal(competing.filter(result=>result.status==='rejected'&&hasConflict(result.reason)).length,1);assert.equal((await cronStatus()).jobs.length,1);checks.push('concurrent app writes allow one versioned mutation');
const finalRestore=await restorePlan(snapshot.id);await restoreBackup({id:snapshot.id,backupVersion:snapshot.sha256,version:finalRestore.version,confirm:true});assert.equal(read(),original);
const files=fs.readdirSync('/mnt/data/build/tastedev-linux/cron-evidence/state/server-tools');assert(!files.includes('cron.lock'));assert(!files.some(name=>/\.(crontab|restore)$/.test(name)));assert(files.includes('cron.flock'));assert.equal(fs.statSync('/mnt/data/build/tastedev-linux/cron-evidence/state/server-tools/cron.flock').mode&0o077,0);checks.push('mutation and restore release kernel lock and clean temporary input files');
}
// The HTTP bridge invokes the application's real API handler; it is not a Next.js server.
const {createServer}=await import('node:http');
const {handle}=await import('../../lib/api.ts');
const {defaultSecurity}=await import('../../lib/security.ts');
const {storeCredentials}=await import('../../lib/auth-store.ts');
const {login,passwordHash}=await import('../../lib/auth.ts');
const password=(await import('node:crypto')).randomBytes(24).toString('hex');
storeCredentials('cron-fixture',await passwordHash(password));if(guiMode)fs.writeFileSync('/mnt/data/build/tastedev-linux/cron-evidence/gui-login.json',JSON.stringify({username:'cron-fixture',password}),{mode:0o600});
let cookie='';
const policy={...defaultSecurity,readOnly:false,cronChanges:true};
fs.mkdirSync('/mnt/data/build/tastedev-linux/cron-evidence/state',{recursive:true,mode:0o700});
fs.writeFileSync('/mnt/data/build/tastedev-linux/cron-evidence/state/security.json',JSON.stringify(policy),{mode:0o600});
let base='',server:Server|undefined,nextProcess:ChildProcess|undefined,nextLog='';
if(nextMode){
 const {createServer:reservePort}=await import('node:net');const reservation=reservePort();await new Promise<void>(resolve=>reservation.listen(0,'127.0.0.1',resolve));const address=reservation.address();assert(address&&typeof address==='object');const port=address.port;await new Promise<void>(resolve=>reservation.close(()=>resolve()));base='http://127.0.0.1:'+port;
 process.env.BETTER_AUTH_URL=base;nextProcess=spawn(process.execPath,['/mnt/data/build/tastedev-linux/cron-source/node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{cwd:'/mnt/data/build/tastedev-linux/cron-build',env:{...process.env,NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});assert(nextProcess.stdout&&nextProcess.stderr);nextProcess.stdout.on('data',chunk=>nextLog=(nextLog+chunk).slice(-8000));nextProcess.stderr.on('data',chunk=>nextLog=(nextLog+chunk).slice(-8000));
 let ready=false;for(let i=0;i<100;i++){if(nextProcess?.exitCode!==null)throw Error('Next.js fixture exited: '+nextLog);try{if((await fetch(base+'/login',{signal:AbortSignal.timeout(1000)})).status===200){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,100));}assert(ready,'Next.js fixture readiness timeout: '+nextLog);
 const response=await fetch(base+'/api/auth/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({username:'cron-fixture',password})});assert.equal(response.status,200);const setCookie=response.headers.get('set-cookie');assert(setCookie);cookie=setCookie.split(';')[0];assert(cookie.startsWith('linux_session='));checks.push('compiled Next.js login creates real Better Auth session');
}else{
 cookie='linux_session='+await login('cron-fixture',password);
server=createServer(async(req,res)=>{try{
 const chunks:Buffer[]=[];for await(const chunk of req)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk));const headers=new Headers();for(const [name,value]of Object.entries(req.headers)){for(const item of Array.isArray(value)?value:[value])if(typeof item==='string')headers.append(name,item);}
 const url=base+req.url,request=new Request(url,{method:req.method,headers,...(req.method==='GET'?{}:{body:Uint8Array.from(Buffer.concat(chunks))})});
 const action=new URL(url).pathname.split('/').at(-1);assert(action);const response=await handle(request,action);
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
}catch(error){res.writeHead(500);res.end('fixture bridge failure');}});
const owned=server;await new Promise<void>((resolve,reject)=>{owned.once('error',reject);owned.listen(0,'127.0.0.1',resolve);});const address=owned.address();assert(address&&typeof address==='object');
base='http://127.0.0.1:'+address.port;
}
const api=async(action:string,body?:unknown,headers:Record<string,string>={})=>{const response=await fetch(base+'/api/'+action,{method:body===undefined?'GET':'POST',headers:{Cookie:cookie,...(body===undefined?{}:{'Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:response.status,data:jsonRecord(await response.json())};};
try{
 if(guiMode){
  fs.writeFileSync('/mnt/data/build/tastedev-linux/cron-evidence/gui-ready.json',JSON.stringify({url:base+'/ide/packages/nginx',recovery:base+'/recovery'}));const deadline=Date.now()+300000;while(!fs.existsSync('/mnt/data/build/tastedev-linux/cron-evidence/gui-stop')){if(Date.now()>deadline)throw Error('Cron GUI fixture timeout');if(nextProcess?.exitCode!==null)throw Error('Cron GUI fixture process stopped');await new Promise(resolve=>setTimeout(resolve,250));}assert.equal(read(),original);checks.push('GUI fixture native crontab restored to original bytes');
 }else{
 assert.equal((await api('cron',undefined,{Cookie:''})).status,401);assert.equal(read(),original);checks.push('HTTP unauthenticated native cron request rejected');
 const httpStatus=await api('cron');assert.equal(httpStatus.status,200);assert.equal(httpStatus.data.text,original);assert.equal(recordField(httpStatus.data,'account').uid,process.getuid?.());checks.push('HTTP authenticated cron status reads native spool');
 const httpJob={name:'http-job',schedule:'15 5 * * *',command:'/bin/true',enabled:true,version:httpStatus.data.version,confirm:true};
 assert.equal((await api('cron-apply',httpJob,{Origin:'https://foreign.example.invalid'})).status,403);assert.equal(read(),original);checks.push('HTTP foreign origin rejected before native write');
 fs.writeFileSync('/mnt/data/build/tastedev-linux/cron-evidence/state/security.json',JSON.stringify({...policy,readOnly:true}));
 assert.equal((await api('cron-apply',httpJob)).status,403);assert.equal((await api('backup',{kind:'cron'})).status,403);assert.equal(read(),original);checks.push('HTTP read-only blocks native cron apply and manual backup');
 fs.writeFileSync('/mnt/data/build/tastedev-linux/cron-evidence/state/security.json',JSON.stringify(policy));
 const unconfirmed=await api('cron-apply',{...httpJob,confirm:false});assert.equal(unconfirmed.status,400);assert.equal(read(),original);checks.push('HTTP unconfirmed mutation rejected before native write');
 let applied=await api('cron-apply',httpJob);assert.equal(applied.status,200);assert.equal(read(),applied.data.text);assert.equal(firstJob(applied.data).name,'http-job');checks.push('HTTP confirmed apply installs native current-user cron');
 const changed=read();assert.equal((await api('cron-apply',httpJob)).status,409);assert.equal(read(),changed);checks.push('HTTP stale version rejected without changing native cron');
 const disabled=await api('cron-apply',{...httpJob,enabled:false,version:applied.data.version});assert.equal(disabled.status,200);assert.equal(firstJob(disabled.data).enabled,false);assert.equal(read(),disabled.data.text);assert(read().includes('PATH=/usr/bin\n'));assert(read().includes('/bin/true # unmanaged'));checks.push('HTTP disable preserves native unmanaged job and environment');
 applied=await api('cron-apply',{...httpJob,version:disabled.data.version});assert.equal(applied.status,200);assert.equal(firstJob(applied.data).enabled,true);assert.equal(read(),changed);checks.push('HTTP re-enable restores the native managed entry');
 const backed=await api('backup',{kind:'cron'});assert.equal(backed.status,200);assert.equal(recordField(backed.data,'backup').sha256,hash(read()));checks.push('HTTP manual backup records native cron bytes');
 const deleted=await api('cron-delete',{name:'http-job',version:applied.data.version,confirm:true});assert.equal(deleted.status,200);assert.equal(read(),original);
 const review=await api('restore?id='+recordField(backed.data,'backup').id);assert.equal(review.status,200);assert.equal(review.data.current,original);
 const restored=await api('restore',{id:recordField(backed.data,'backup').id,version:review.data.version,backupVersion:recordField(review.data,'record').sha256,confirm:true});assert.equal(restored.status,200);assert.equal(hash(read()),recordField(backed.data,'backup').sha256);checks.push('HTTP delete review and restore preserve native snapshot');
 const cleaned=await api('cron-delete',{name:'http-job',version:hash(read()),confirm:true});assert.equal(cleaned.status,200);assert.equal(read(),original);
 const audit=fs.readFileSync('/mnt/data/build/tastedev-linux/cron-evidence/state/audit.jsonl','utf8').trim().split('\n').map(line=>jsonRecord(JSON.parse(line)));assert(audit.some(row=>row.action==='backup'&&row.result==='completed'));checks.push('HTTP backup completion has an audit record');
 if(nextMode){assert.deepEqual(audit.filter(row=>row.action==='cron-apply').map(row=>row.result),['blocked','requested','failed','requested','completed','requested','failed','requested','completed','requested','completed']);assert.deepEqual(audit.filter(row=>row.action==='cron-delete').map(row=>row.result),['requested','completed','requested','completed']);assert.deepEqual(audit.filter(row=>row.action==='restore').map(row=>row.result),['requested','completed']);assert(audit.every(row=>Object.keys(row).sort().join(',')==='action,at,result'));assert(!JSON.stringify(audit).includes('/bin/true'));checks.push('compiled routes record each actual mutation outcome once without cron command content');}
}
}finally{if(server){server.closeAllConnections();const owned=server;await new Promise<void>(resolve=>owned.close(()=>resolve()));}if(nextProcess&&nextProcess.exitCode===null){const owned=nextProcess;const stopped=new Promise<void>(resolve=>owned.once('close',()=>resolve()));owned.kill('SIGTERM');await stopped;}}
fs.writeFileSync('/mnt/data/build/tastedev-linux/cron-evidence/result.json',JSON.stringify({status:'PASS',checks,account:userInfo().username,uid:process.getuid?.(),uidMap:fs.readFileSync('/proc/self/uid_map','utf8').trim(),hostCrontabChanged:false,networkIsolated:!guiMode,loopbackOnly:guiMode,schedulerExecutionVerified:false,httpApiVerified:true,nextServerVerified:nextMode,guiVerified:false,nativeBinaryBytesUnchanged:true,fixtureSpoolOwnership:true,binarySha256:hash(fs.readFileSync('/usr/bin/crontab')),sourceSha256:hash(fs.readFileSync('/mnt/data/build/tastedev-linux/cron-source/lib/server-tools.ts')),restoreSourceSha256:hash(fs.readFileSync('/mnt/data/build/tastedev-linux/cron-source/lib/operations.ts'))},null,2)+'\n');
function hasConflict(value:unknown){return value!==null&&typeof value==='object'&&'status' in value&&value.status===409;}
function firstJob(data:Record<string,unknown>){assert(Array.isArray(data.jobs));return jsonRecord(data.jobs[0]);}
