import {readRuntimeModule} from '../runtime-source.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {jsonRecord,recordField} from './http-json.ts';
import {diagnostic} from './nginx-native-report.ts';
import {mkdir,writeFile,readFile,rm,readdir,symlink} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
import {createHash} from 'node:crypto';
const exec=promisify(execFile),project=process.cwd();
const fixture=await verificationWorkDirectory('tastedev-cron-isolated-');

try{
 const runtime=path.join(fixture,'runtime'),worker='scripts/fixtures/cron-isolated-worker.mjs',allowed=[worker];
 async function collect(dir:string):Promise<void>{for(const item of await readdir(path.join(project,dir),{withFileTypes:true})){const name=dir+'/'+item.name;if(item.isDirectory())await collect(name);else if(/\.(ts|mts)$/.test(name))allowed.push(name.replace(/\.(ts|mts)$/,'.mjs'));}}
 await collect('lib');
 for(const name of allowed){await mkdir(path.dirname(path.join(runtime,name)),{recursive:true});await writeFile(path.join(runtime,name),await readRuntimeModule(name,allowed,project));}
 await symlink(path.join(project,'node_modules'),path.join(runtime,'node_modules'),'dir');
 await exec('/usr/bin/bwrap',['--unshare-user','--uid','0','--gid','0','--unshare-pid','--unshare-net','--die-with-parent','--new-session','--ro-bind','/','/','--tmpfs','/var/spool','--tmpfs',verificationWorkRoot,'--ro-bind',project,'/mnt/data/build/tastedev-linux/cron-source','--bind',fixture,'/mnt/data/build/tastedev-linux/cron-evidence','--proc','/proc','--dev','/dev','--',process.execPath,'/mnt/data/build/tastedev-linux/cron-evidence/runtime/scripts/fixtures/cron-isolated-worker.mjs'],{timeout:30000,maxBuffer:1048576,env:{NODE_ENV:'test',PATH:'/usr/bin:/bin',LANG:'C.UTF-8',TMPDIR:verificationWorkRoot,TMP:verificationWorkRoot,TEMP:verificationWorkRoot}});
 const result=jsonRecord(JSON.parse(await readFile(path.join(fixture,'result.json'),'utf8')));
 const evidence=path.join(verificationWorkRoot,'cron-isolated-'+new Date().toISOString().replaceAll(':','-'));
 await mkdir(evidence,{recursive:true,mode:0o700});await writeFile(path.join(evidence,'result.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify({status:result.status,checks:result.checks,evidence:path.join(evidence,'result.json')}));
}catch(error){console.error(diagnostic(error));process.exitCode=1;}
finally{await rm(fixture,{recursive:true,force:true});}
