
import fs from 'node:fs';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {nginxTopology} from '../../lib/nginx-topology.ts';
import {applyReviewedNginx} from '../../lib/nginx-reviewed-apply.ts';
import {restoreNginxConfiguration} from '../../lib/nginx-config-restore.ts';
import {inspectNginxService} from '../../lib/nginx-service-inspect.ts';
const execute=promisify(execFile),hash=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex');
const file='/etc/nginx/conf.d/reviewed.conf',backupRoot='/var/lib/reviewed-backups',checks:string[]=[];
const source=(value:string)=>'server { listen 18081; location / { return 200 "'+value+'"; } }';
assert.equal(process.getuid?.(),0);assert.match(fs.readFileSync('/proc/self/uid_map','utf8').trim(),/^0\s+\d+\s+1$/);
fs.mkdirSync(backupRoot,{mode:0o700});fs.writeFileSync(file,source('before'),{mode:0o600});
const master=spawn('/usr/sbin/nginx',['-g','daemon off;'],{stdio:['ignore','ignore','pipe'],env:{NODE_ENV:'test',PATH:'/usr/bin:/usr/sbin',LANG:'C',LC_ALL:'C'}});
let daemonLog='',reloadFailure=false;master.stderr.on('data',data=>daemonLog+=data.toString());
const native=(binary:string,args:string[])=>execute(binary,args,{encoding:'utf8',timeout:10000,maxBuffer:65536,env:{NODE_ENV:'test',PATH:'/usr/bin:/usr/sbin',LANG:'C',LC_ALL:'C'}});
async function adapter(binary:string,args:string[]){
 if(binary==='/usr/bin/systemctl'){
  if(args.includes('show')){assert.equal(master.exitCode,null);return {stdout:'LoadState=loaded\nActiveState=active\nMainPID='+master.pid+'\n',stderr:''};}
  assert.deepEqual(args,['--no-ask-password','reload','nginx.service']);
  if(reloadFailure){reloadFailure=false;throw Error('injected service reload failure');}
  return native('/usr/sbin/nginx',['-s','reload']);
 }
 assert.equal(binary,'/usr/sbin/nginx');return native(binary,args);
}
const inspect=()=>inspectNginxService({runCommand:adapter});
async function wait(predicate:()=>boolean|Promise<boolean>){for(let i=0;i<100;i++){try{if(await predicate())return;}catch{}await new Promise(resolve=>setTimeout(resolve,25));}throw Error('isolated nginx timeout: '+daemonLog);}
const response=async()=>{const res=await fetch('http://127.0.0.1:18081/',{signal:AbortSignal.timeout(1000)});return res.text();};
async function input(text:string){const graph=await nginxTopology(),scope=await inspect();assert.equal(graph.complete,true,JSON.stringify(graph.warnings));const selected=graph.files.find(item=>item.path===file);assert(selected);return {path:file,text,version:selected.version,graphVersion:graph.version,confirm:true,review:{confirm:true,pid:scope.pid,start:scope.start,graphVersion:graph.version,locale:{LC_ALL:'C'}}};}
try{
 assert.equal(process.getuid?.(),0);await wait(()=>fs.existsSync('/mnt/data/build/tastedev-linux/nginx-fixture.pid'));await wait(async()=>await response()==='before');
 const initial=fs.readFileSync(file,'utf8'),request=await input(source('after'));
 await assert.rejects(applyReviewedNginx({...request,review:{...request.review,start:'0'}},{backupRoot,inspect,runCommand:adapter}),(error:unknown)=>error!==null&&typeof error==='object'&&'status' in error&&error.status===409);assert.equal(fs.readFileSync(file,'utf8'),initial);checks.push('stale real process identity rejected');
 const applied=await applyReviewedNginx(request,{backupRoot,inspect,runCommand:adapter});assert.equal(applied.changed,true);assert.equal(applied.journalCleanupVerified,true);await wait(async()=>await response()==='after');checks.push('reviewed include file apply with real native validation and HTTP response');
 await assert.rejects(applyReviewedNginx(request,{backupRoot,inspect,runCommand:adapter}),(error:unknown)=>error!==null&&typeof error==='object'&&'status' in error&&error.status===409);checks.push('stale graph rejected');
 const current=await input(source('before'));const {text,...restoration}=current;
 const restored=await restoreNginxConfiguration({...restoration,backupId:applied.backupId},{backupRoot,inspect,runCommand:adapter});assert.equal(restored.changed,true);await wait(async()=>await response()==='before');assert.equal(fs.readFileSync(file,'utf8'),initial);checks.push('reviewed backup restoration and real HTTP response');
 await assert.rejects(applyReviewedNginx(await input('server { invalid_tastedev_directive on; }'),{backupRoot,inspect,runCommand:adapter}));assert.equal(fs.readFileSync(file,'utf8'),initial);assert.equal(await response(),'before');checks.push('native invalid directive rejected before operational file change');
 reloadFailure=true;const rolledBack=await applyReviewedNginx(await input(source('rollback')),{backupRoot,inspect,runCommand:adapter});assert.equal(rolledBack.restored,true);assert.equal(rolledBack.recovered,true);assert.equal(rolledBack.journalCleanupVerified,true);assert.equal(fs.readFileSync(file,'utf8'),initial);await wait(async()=>await response()==='before');checks.push('injected service reload failure restores file and validates/reloads original');
 const modules=['nginx-reviewed-apply','nginx-apply','nginx-config-restore','nginx-topology','nginx-operation-hooks','nginx-service-inspect','config-transaction'];
 const result={status:'PASS',checks,systemdAdapter:true,realSystemdVerified:false,nativeProcessIdentityVerified:true,nativeHttpVerified:true,hostOperationalChanges:false,networkIsolated:true,nginxSha256:hash(fs.readFileSync('/usr/sbin/nginx')),sourceSha256:Object.fromEntries(modules.map(name=>[name,hash(fs.readFileSync('/mnt/source/lib/'+name+'.ts'))]))};
 fs.writeFileSync('/mnt/result.json',JSON.stringify(result,null,2)+'\n');
}finally{if(master.exitCode===null){master.kill('SIGTERM');await wait(()=>master.exitCode!==null);}}

