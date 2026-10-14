import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {readRuntimeModule} from '../runtime-source.ts';
import {adminRuntimeFiles} from '../admin/runtime-files.mts';
import {readAdminRuntimeModule} from '../admin/runtime-source.mts';
import {jsonRecord} from './http-json.ts';
import {diagnostic} from './nginx-native-report.ts';
import {mkdir,writeFile,readFile,copyFile,chmod,rm,lstat} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
const exec=promisify(execFile),fixture=await verificationWorkDirectory('linux-nginx-reviewed-');
const project=process.cwd(),evidence=path.join(verificationWorkRoot,'nginx-reviewed-isolated-'+new Date().toISOString().replaceAll(':','-'));
const runnerFile='scripts/fixtures/nginx-reviewed-worker.mjs',allowed=[runnerFile,...adminRuntimeFiles.map(name=>'lib/'+name)],runner=await readRuntimeModule(runnerFile,allowed);
try{
 const nginx=path.join(fixture,'nginx');
 await mkdir(path.join(nginx,'conf.d'),{recursive:true});await chmod(nginx,0o755);await chmod(path.join(nginx,'conf.d'),0o755);
 await writeFile(path.join(nginx,'nginx.conf'),'user root;\nworker_processes 1;\nerror_log stderr;\npid /mnt/data/build/tastedev-linux/nginx-fixture.pid;\nevents { worker_connections 64; }\nhttp { client_body_temp_path /mnt/data/build/tastedev-linux/body; proxy_temp_path /mnt/data/build/tastedev-linux/proxy; fastcgi_temp_path /mnt/data/build/tastedev-linux/fastcgi; uwsgi_temp_path /mnt/data/build/tastedev-linux/uwsgi; scgi_temp_path /mnt/data/build/tastedev-linux/scgi; access_log off; include /etc/nginx/conf.d/*.conf; }\n',{mode:0o600});
 // Private namespace binaries and configuration; host files remain read-only.
 await mkdir(path.join(fixture,'usr-bin'),{mode:0o755});
 for(const [name,source] of [['node',process.execPath]]){await copyFile(source,path.join(fixture,'usr-bin',name));await chmod(path.join(fixture,'usr-bin',name),0o755);}
 await copyFile(process.execPath,path.join(fixture,'node'));await chmod(path.join(fixture,'node'),0o755);
 const runtime=path.join(fixture,'runtime');await mkdir(path.join(runtime,'scripts/fixtures'),{recursive:true});await mkdir(path.join(runtime,'lib'));await writeFile(path.join(runtime,runnerFile),runner);for(const name of adminRuntimeFiles)await writeFile(path.join(runtime,'lib',name),await readAdminRuntimeModule(name));
 await mkdir(path.join(fixture,'source/lib'),{recursive:true});for(const name of ['nginx-reviewed-apply','nginx-apply','nginx-config-restore','nginx-topology','nginx-operation-hooks','nginx-service-inspect','config-transaction'])await copyFile(path.join(project,'lib',name+'.ts'),path.join(fixture,'source/lib',name+'.ts'));
 const args=['--unshare-user','--uid','0','--gid','0','--unshare-pid','--unshare-net','--die-with-parent','--new-session','--ro-bind','/','/','--tmpfs','/usr','--ro-bind','/usr/lib','/usr/lib','--ro-bind','/usr/lib64','/usr/lib64','--ro-bind','/usr/sbin','/usr/sbin','--ro-bind',path.join(fixture,'usr-bin'),'/usr/bin','--tmpfs','/var','--tmpfs','/var/lib','--tmpfs','/var/log','--bind',nginx,'/etc/nginx','--bind',fixture,'/mnt','--perms','0700','--tmpfs','/mnt/data/build/tastedev-linux','--ro-bind',path.join(fixture,'source'),'/mnt/source','--ro-bind',runtime,'/mnt/runtime','--proc','/proc','--dev','/dev','--','/mnt/node','/mnt/runtime/scripts/fixtures/nginx-reviewed-worker.mjs'];
 try{await lstat('/usr/share/nodejs');args.splice(args.indexOf('--'),0,'--ro-bind','/usr/share/nodejs','/usr/share/nodejs');}catch(error){if(error===null||typeof error!=='object'||!('code' in error)||error.code!=='ENOENT')throw error;}
 await exec('/usr/bin/bwrap',args,{timeout:60000,maxBuffer:2*1048576,env:{NODE_ENV:'test',TMPDIR:verificationWorkRoot,TMP:verificationWorkRoot,TEMP:verificationWorkRoot,PATH:'/usr/sbin:/usr/bin:/sbin:/bin',LANG:'C.UTF-8'}});
 const result=jsonRecord(JSON.parse(await readFile(path.join(fixture,'result.json'),'utf8')));await mkdir(evidence,{recursive:true,mode:0o700});await writeFile(path.join(evidence,'result.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({status:result.status,checks:result.checks,evidence:path.join(evidence,'result.json')}));
}catch(error){await mkdir(evidence,{recursive:true,mode:0o700});await writeFile(path.join(evidence,'result.json'),JSON.stringify({status:'FAIL',error:diagnostic(error),hostOperationalChanges:false},null,2)+'\n');console.error('Isolated nginx verification failed: '+diagnostic(error));process.exitCode=1;}finally{await rm(fixture,{recursive:true,force:true});}
