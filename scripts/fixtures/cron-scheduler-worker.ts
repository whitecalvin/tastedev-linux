
import fs from 'node:fs';import {spawn,execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
export async function verifyCronSchedule(value:unknown){
assert.equal(process.getuid?.(),0);assert.equal(process.env.TASTEDEV_CRON_FIXTURE,'1');
assert(fs.readFileSync('/proc/self/mountinfo','utf8').split('\n').some(line=>line.split(' ')[4]==='/mnt/data/build/tastedev-linux'&&line.includes(' - tmpfs ')),'전용 검수 tmpfs가 필요합니다.');
assert(value!==null&&typeof value==='object'&&'initial' in value&&typeof value.initial==='string'&&'updated' in value&&typeof value.updated==='string');
const {initial,updated}=value;for(const text of [initial,updated])assert(Buffer.byteLength(text)<=65536&&!text.includes('\0'));
const root='/mnt/data/build/tastedev-linux/cron-fixture';fs.mkdirSync(root,{recursive:true,mode:0o700});
function install(text:string){fs.writeFileSync(root+'/input',text,{mode:0o600});execFileSync('/usr/bin/crontab',[root+'/input']);assert.equal(execFileSync('/usr/bin/crontab',['-l'],{encoding:'utf8'}),text);}
install(initial);let exit:{code:number|null;signal:NodeJS.Signals|null}|undefined,stderr='';const daemon=spawn('/usr/sbin/cron',['-f','-L','15'],{stdio:['ignore','ignore','pipe']});daemon.stderr.on('data',chunk=>stderr=(stderr+chunk).slice(-8000));daemon.once('exit',(code,signal)=>exit={code,signal});
const started=Date.now(),firstFile=root+'/first.out',secondFile=root+'/second.out',disabledFile=root+'/disabled.out';
async function wait(condition:()=>boolean){const deadline=Date.now()+75000;while(!condition()){if(exit)throw Error('cron exited: '+JSON.stringify(exit)+' '+stderr);if(Date.now()>deadline)throw Error('scheduler output timeout: '+stderr);await new Promise(resolve=>setTimeout(resolve,250));}}
try{
 await wait(()=>fs.existsSync(firstFile)&&fs.existsSync(secondFile));assert.equal(fs.readFileSync(firstFile,'utf8'),'first-scope\n');assert.equal(fs.readFileSync(secondFile,'utf8'),'second-scope\n');assert(!fs.existsSync(disabledFile));
 const original=fs.statSync(firstFile).mtimeMs,secondTime=fs.statSync(secondFile).mtimeMs;
 install(updated);await wait(()=>fs.readFileSync(secondFile,'utf8')==='updated:second-scope\n');assert.equal(fs.statSync(firstFile).mtimeMs,original);assert.equal(fs.readFileSync(firstFile,'utf8'),'first-scope\n');assert(fs.statSync(secondFile).mtimeMs>secondTime);assert(!fs.existsSync(disabledFile));
 process.stdout.write(JSON.stringify({status:'PASS',checks:['native crontab accepts app-generated schedules','actual cron executes both jobs with their preceding environment','initially disabled job does not execute','actual cron reloads edited crontab and runs updated command','disabling an existing job prevents its next execution','edited job preserves its preceding environment'],elapsedMs:Date.now()-started,cronSha256:createHash('sha256').update(fs.readFileSync('/usr/sbin/cron')).digest('hex'),crontabSha256:createHash('sha256').update(fs.readFileSync('/usr/bin/crontab')).digest('hex'),cronPackageVersion:execFileSync('/usr/bin/dpkg-query',['-W','-f='+String.fromCharCode(36)+'{Version}','cron'],{encoding:'utf8'}),account:'container root fixture',hostCrontabChanged:false,hostServicesChanged:false,networkDisabled:true,projectSourceTransferred:false,guiVerified:false,appMutationApiVerified:false})+'\n');
}finally{daemon.kill('SIGTERM');if(!exit)await new Promise<void>(resolve=>daemon.once('exit',()=>resolve()));execFileSync('/usr/bin/crontab',['-r']);}

}
