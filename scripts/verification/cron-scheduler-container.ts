import {readRuntimeModule} from '../runtime-source.ts';
// Transfers synthetic fixture commands only; never transfers project/runtime source.
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {jsonRecord} from './http-json.ts';
import {diagnostic} from './nginx-native-report.ts';
import assert from 'node:assert/strict';
import {cronEntry,updateCron} from '../../lib/server-tools.ts';
import {createHash,randomUUID} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
const host=process.env.CRON_VERIFY_HOST,image=process.env.CRON_VERIFY_IMAGE,identity=process.env.CRON_VERIFY_IDENTITY;
if(!host||!image||!identity||!/^[a-zA-Z0-9_][-\w.@]*$/.test(host)||!/^[a-zA-Z0-9][-\w.:]*$/.test(image)||!path.isAbsolute(identity))throw Error('Set explicit CRON_VERIFY_HOST, CRON_VERIFY_IMAGE and absolute CRON_VERIFY_IDENTITY.');
const targetHost=host,identityFile=identity;
const runId=randomUUID(),name='tastedev-cron-check-'+runId,root='/mnt/data/build/tastedev-linux/cron-fixture';let attempted=false;
const job=(name:string,file:string,enabled=true)=>({name,schedule:'* * * * *',command:'/bin/echo "$MODE" > '+root+'/'+file,enabled});
const first=job('first','first.out'),second=job('second','second.out'),disabled=job('disabled','disabled.out',false);
const initial='SHELL=/bin/sh\nPATH=/usr/bin:/bin\nMAILTO=""\nMODE=first-scope\n'+cronEntry(first)+'MODE=second-scope\n'+cronEntry(second)+cronEntry(disabled);
const updated=updateCron(updateCron(initial,{...first,enabled:false}),{...second,command:'/bin/echo "updated:$MODE" > '+root+'/second.out'});
const worker='scripts/fixtures/cron-scheduler-worker.mjs';
const payload=(await readRuntimeModule(worker,[worker])).toString('utf8')+'\nawait verifyCronSchedule('+JSON.stringify({initial,updated})+');\n';
const quote=(value:string)=>"'"+value.replaceAll("'","'\\''")+"'";
function remote(args:string[],input?:string){return new Promise<string>((resolve,reject)=>{const child=spawn('/usr/bin/ssh',['-i',identityFile,'-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=5',targetHost,...args.map(quote)],{stdio:['pipe','pipe','pipe']});let stdout='',stderr='';const timer=setTimeout(()=>{child.kill('SIGTERM');reject(Error('remote verification timeout'));},170000);child.stdout.on('data',chunk=>stdout+=chunk);child.stderr.on('data',chunk=>stderr=(stderr+chunk).slice(-10000));child.once('error',error=>{clearTimeout(timer);reject(error);});child.once('close',code=>{clearTimeout(timer);code===0?resolve(stdout):reject(Error(stderr||stdout||'remote command failed'));});child.stdin.end(input);});}
const evidence=await verificationWorkDirectory('cron-scheduler-container-');
async function cleanup(){let label:string;try{label=(await remote(['docker','container','inspect','--format','{{index .Config.Labels "tastedev.verification"}}',name])).trim();}catch(error){if(error instanceof Error&&error.message.includes('No such container'))return;throw error;}assert.equal(label,runId,'Container ownership changed; refusing removal');await remote(['docker','rm','-f',name]);}
try{
 const imageId=(await remote(['docker','image','inspect','--format','{{.Id}}',image])).trim();
 assert.match(imageId,/^sha256:[a-f0-9]{64}$/);attempted=true;
 const stdout=await remote(['docker','run','--pull','never','--rm','-i','--name',name,'--label','tastedev.verification='+runId,'--tmpfs',verificationWorkRoot+':rw,noexec,nosuid,nodev,size=64m,mode=1777','--env','TMPDIR='+verificationWorkRoot,'--env','TMP='+verificationWorkRoot,'--env','TEMP='+verificationWorkRoot,'--env','TASTEDEV_CRON_FIXTURE=1','--network','none','--cap-drop','ALL','--cap-add','SETUID','--cap-add','SETGID','--cap-add','CHOWN','--cap-add','DAC_OVERRIDE','--cap-add','AUDIT_WRITE','--security-opt','no-new-privileges','--pids-limit','64','--memory','256m','--entrypoint','node',imageId,'--input-type=module','-'],payload);
 const result=jsonRecord(JSON.parse(stdout.trim()));assert.equal(result.status,'PASS');assert(Array.isArray(result.checks)&&result.checks.length===6&&result.checks.every(item=>typeof item==='string'));assert.equal(result.hostCrontabChanged,false);assert.equal(result.networkDisabled,true);await cleanup();attempted=false;Object.assign(result,{imageId,image,host,sourceSha256:createHash('sha256').update(await readFile('lib/server-tools.ts')).digest('hex'),syntheticInitialScheduleSha256:createHash('sha256').update(initial).digest('hex'),syntheticUpdatedScheduleSha256:createHash('sha256').update(updated).digest('hex')});await writeFile(path.join(evidence,'result.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({status:result.status,checks:result.checks,evidence:path.join(evidence,'result.json')}));
}catch(error){await writeFile(path.join(evidence,'result.json'),JSON.stringify({status:'FAIL',diagnostic:diagnostic(error),hostCrontabChanged:false,projectSourceTransferred:false},null,2)+'\n',{mode:0o600});throw error;}
finally{if(attempted)try{await cleanup();}catch(error){await writeFile(path.join(evidence,'cleanup-failure.json'),JSON.stringify({status:'FAIL',diagnostic:diagnostic(error),container:name,ownershipVerified:false},null,2)+'\n',{mode:0o600});console.error('Fixture cleanup: '+diagnostic(error));process.exitCode=1;}}
