
const verificationWorkRoot='/mnt/data/build/tastedev-linux';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {cronEntry,updateCron} from '../../lib/server-tools.ts';
assert.equal(process.getuid?.(),0);assert.match(fs.readFileSync('/proc/self/uid_map','utf8').trim(),/^0\s+\d+\s+1$/);assert(fs.readFileSync('/proc/self/mountinfo','utf8').split('\n').some(line=>line.split(' ')[4]==='/var/spool'&&line.includes(' - tmpfs ')));
fs.mkdirSync('/var/spool/cron/crontabs',{recursive:true,mode:0o1730});
const job=(name:string,file:string,enabled=true)=>({name,schedule:'* * * * *',command:'/bin/echo "$MODE" > /mnt/data/build/tastedev-linux/cron-evidence/'+file,enabled});
const first=job('first','first.out'),second=job('second','second.out'),disabled=job('disabled','disabled.out',false);
const initial='SHELL=/bin/sh\nPATH=/usr/bin:/bin\nMAILTO=""\nMODE=first-scope\n'+cronEntry(first)+'MODE=second-scope\n'+cronEntry(second)+cronEntry(disabled);
const text=updateCron(initial,{...first,command:first.command});assert.equal(text,initial);
fs.writeFileSync('/mnt/data/build/tastedev-linux/cron-evidence/input',text,{mode:0o600});
execFileSync('/usr/bin/crontab',['/mnt/data/build/tastedev-linux/cron-evidence/input'],{env:{NODE_ENV:'test',PATH:'/usr/bin:/bin',LC_ALL:'C',TMPDIR:verificationWorkRoot,TMP:verificationWorkRoot,TEMP:verificationWorkRoot}});
assert.equal(execFileSync('/usr/bin/crontab',['-l'],{encoding:'utf8'}),text);
const logger=spawn('/usr/bin/python3',['-u','-c',"import socket\ns=socket.socket(socket.AF_UNIX,socket.SOCK_DGRAM)\ns.bind('/dev/log')\nwhile True:\n print(s.recv(65536).decode('utf-8','replace'),flush=True)"],{stdio:['ignore','pipe','pipe']});
let syslog='';logger.stdout.on('data',chunk=>{syslog+=chunk;});logger.stderr.on('data',chunk=>{syslog+=chunk;});
await new Promise(resolve=>setTimeout(resolve,150));
let stderr='',exit:{code:number|null;signal:NodeJS.Signals|null}|undefined;
const daemon=spawn('/usr/sbin/cron',['-f','-L','15'],{env:{NODE_ENV:'test',PATH:'/usr/bin:/bin',LANG:'C.UTF-8',TMPDIR:verificationWorkRoot,TMP:verificationWorkRoot,TEMP:verificationWorkRoot},stdio:['ignore','ignore','pipe']});
daemon.stderr.on('data',chunk=>{stderr+=chunk;});daemon.on('exit',(code,signal)=>{exit={code,signal};});
const started=Date.now(),deadline=started+75000;
try{
 while(!fs.existsSync('/mnt/data/build/tastedev-linux/cron-evidence/first.out')||!fs.existsSync('/mnt/data/build/tastedev-linux/cron-evidence/second.out')){
  if(syslog.includes('initgroups(0) failed'))throw Error('user namespace blocks cron account groups: '+syslog);
  if(exit)throw Error('isolated cron exited: '+JSON.stringify(exit)+' '+stderr);
  if(Date.now()>deadline)throw Error('scheduled fixture output missing: '+stderr+' '+syslog);
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 assert.equal(fs.readFileSync('/mnt/data/build/tastedev-linux/cron-evidence/first.out','utf8'),'first-scope\n');
 assert.equal(fs.readFileSync('/mnt/data/build/tastedev-linux/cron-evidence/second.out','utf8'),'second-scope\n');
 assert.equal(fs.existsSync('/mnt/data/build/tastedev-linux/cron-evidence/disabled.out'),false);
 const firstIdentity=fs.statSync('/mnt/data/build/tastedev-linux/cron-evidence/first.out').mtimeMs,secondIdentity=fs.statSync('/mnt/data/build/tastedev-linux/cron-evidence/second.out').mtimeMs;
 // A second actual scheduler tick verifies editing and disabling, not merely cron syntax.
 const updated=updateCron(updateCron(text,{...first,enabled:false}),{...second,command:'/bin/echo "updated:$MODE" > /mnt/data/build/tastedev-linux/cron-evidence/second.out'});
 fs.writeFileSync('/mnt/data/build/tastedev-linux/cron-evidence/updated-input',updated,{mode:0o600});execFileSync('/usr/bin/crontab',['/mnt/data/build/tastedev-linux/cron-evidence/updated-input'],{env:{NODE_ENV:'test',PATH:'/usr/bin:/bin',LC_ALL:'C',TMPDIR:verificationWorkRoot,TMP:verificationWorkRoot,TEMP:verificationWorkRoot}});assert.equal(execFileSync('/usr/bin/crontab',['-l'],{encoding:'utf8'}),updated);
 const nextDeadline=Date.now()+75000;
 while(fs.readFileSync('/mnt/data/build/tastedev-linux/cron-evidence/second.out','utf8')!=='updated:second-scope\n'){
  if(exit)throw Error('isolated cron exited during schedule update: '+JSON.stringify(exit)+' '+stderr);
  if(Date.now()>nextDeadline)throw Error('updated scheduled fixture output missing: '+stderr+' '+syslog);
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 assert(fs.statSync('/mnt/data/build/tastedev-linux/cron-evidence/second.out').mtimeMs>secondIdentity);assert.equal(fs.statSync('/mnt/data/build/tastedev-linux/cron-evidence/first.out').mtimeMs,firstIdentity);assert.equal(fs.readFileSync('/mnt/data/build/tastedev-linux/cron-evidence/first.out','utf8'),'first-scope\n');assert.equal(fs.existsSync('/mnt/data/build/tastedev-linux/cron-evidence/disabled.out'),false);
 fs.writeFileSync('/mnt/data/build/tastedev-linux/cron-evidence/result.json',JSON.stringify({status:'PASS',checks:['native crontab accepts app-generated schedule','native foreground cron executes minute schedule','first job retains preceding environment','second job has its own environment scope','disabled managed job does not execute','native scheduler reloads edited crontab on the next minute','disabling an existing job prevents its next execution while the edited job executes','edited job preserves its own environment scope'],elapsedMs:Date.now()-started,hostCrontabChanged:false,networkIsolated:true,schedulerExecutionVerified:true,account:'namespace root fixture',namespaceCapabilities:['CAP_SETGID'],pam:'fixture permit policy; installed PAM not verified',guiVerified:false,appMutationApiVerified:false,cronSha256:createHash('sha256').update(fs.readFileSync('/usr/sbin/cron')).digest('hex'),crontabSha256:createHash('sha256').update(fs.readFileSync('/usr/bin/crontab')).digest('hex')},null,2)+'\n');
}finally{
 logger.kill('SIGTERM');daemon.kill('SIGTERM');await new Promise<void>(resolve=>{if(exit)resolve();else daemon.once('exit',()=>resolve());});
}
