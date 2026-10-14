import {readRuntimeModule} from '../runtime-source.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {jsonRecord} from './http-json.ts';
import {diagnostic as errorDiagnostic} from './nginx-native-report.ts';
import {mkdir,writeFile,readFile,rm,readdir,symlink} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
const exec=promisify(execFile),project=process.cwd();
const fixture=await verificationWorkDirectory('tastedev-cron-scheduler-');

try{
 await mkdir(path.join(fixture,'empty'),{mode:0o700});
 const runtime=path.join(fixture,'runtime'),worker='scripts/fixtures/cron-isolated-scheduler-worker.mjs',allowed=[worker];
 async function collect(dir:string):Promise<void>{for(const item of await readdir(path.join(project,dir),{withFileTypes:true})){const name=dir+'/'+item.name;if(item.isDirectory())await collect(name);else if(/\.(ts|mts)$/.test(name))allowed.push(name.replace(/\.(ts|mts)$/,'.mjs'));}}
 await collect('lib');
 for(const name of allowed){await mkdir(path.dirname(path.join(runtime,name)),{recursive:true});await writeFile(path.join(runtime,name),await readRuntimeModule(name,allowed,project));}
 await symlink(path.join(project,'node_modules'),path.join(runtime,'node_modules'),'dir');
 await writeFile(path.join(fixture,'crontab'),'',{mode:0o600});
 await writeFile(path.join(fixture,'passwd'),'root:x:0:0:fixture:/mnt/data/build/tastedev-linux:/bin/sh\n');
 await writeFile(path.join(fixture,'group'),'root:x:0:\n');
 await writeFile(path.join(fixture,'pam-cron'),'account required pam_permit.so\nsession required pam_permit.so\n');
 await exec('/usr/bin/bwrap',['--cap-add','CAP_SETGID','--unshare-user','--uid','0','--gid','0','--unshare-pid','--unshare-net','--die-with-parent','--new-session','--ro-bind','/','/','--tmpfs','/var/spool','--tmpfs','/run','--tmpfs','/var/log','--tmpfs',verificationWorkRoot,'--ro-bind',project,'/mnt/data/build/tastedev-linux/cron-source','--bind',fixture,'/mnt/data/build/tastedev-linux/cron-evidence','--ro-bind',path.join(fixture,'empty'),'/etc/cron.d','--ro-bind',path.join(fixture,'crontab'),'/etc/crontab','--ro-bind',path.join(fixture,'passwd'),'/etc/passwd','--ro-bind',path.join(fixture,'group'),'/etc/group','--ro-bind',path.join(fixture,'pam-cron'),'/etc/pam.d/cron','--proc','/proc','--dev','/dev','--',process.execPath,'/mnt/data/build/tastedev-linux/cron-evidence/runtime/scripts/fixtures/cron-isolated-scheduler-worker.mjs'],{timeout:160000,maxBuffer:1048576,env:{NODE_ENV:'test',PATH:'/usr/bin:/bin',LANG:'C.UTF-8',TMPDIR:verificationWorkRoot,TMP:verificationWorkRoot,TEMP:verificationWorkRoot}});
 const result=jsonRecord(JSON.parse(await readFile(path.join(fixture,'result.json'),'utf8')));
 const evidence=path.join(verificationWorkRoot,'cron-scheduler-isolated-'+new Date().toISOString().replaceAll(':','-'));
 await mkdir(evidence,{recursive:true,mode:0o700});await writeFile(path.join(evidence,'result.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify({status:result.status,checks:result.checks,elapsedMs:result.elapsedMs,evidence:path.join(evidence,'result.json')}));
}catch(error){const diagnostic=error!==null&&typeof error==='object'&&'stderr' in error&&typeof error.stderr==='string'?error.stderr:errorDiagnostic(error);console.error(diagnostic);const evidence=path.join(verificationWorkRoot,'cron-scheduler-isolated-'+new Date().toISOString().replaceAll(':','-'));await mkdir(evidence,{recursive:true,mode:0o700});await writeFile(path.join(evidence,'result.json'),JSON.stringify({status:diagnostic.includes('initgroups(0) failed')?'BLOCKED':'FAIL',reason:diagnostic.includes('initgroups(0) failed')?'user-namespace-initgroups-denied':'scheduler-output-unavailable',diagnostic,hostCrontabChanged:false,schedulerExecutionVerified:false},null,2)+'\n',{mode:0o600});console.log(JSON.stringify({evidence:path.join(evidence,'result.json')}));process.exitCode=1;}
finally{await rm(fixture,{recursive:true,force:true});}
