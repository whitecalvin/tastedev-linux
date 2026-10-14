import assert from 'node:assert/strict';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {readRuntimeModule} from '../runtime-source.ts';
import {adminRuntimeFiles} from '../admin/runtime-files.mts';
import {readAdminRuntimeModule} from '../admin/runtime-source.mts';
import {jsonRecord} from './http-json.ts';
import {diagnostic as describeError} from './nginx-native-report.ts';
import {mkdir,writeFile,readFile,copyFile,chmod,rm,lstat} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {promisify} from 'node:util';
import path from 'node:path';
const exec=promisify(execFile),project=process.cwd(),binary=process.argv[2];
if(!binary||!path.isAbsolute(binary))throw Error('Pass an absolute Redis server binary path from a trusted package.');
const binaryStat=await lstat(binary);assert(binaryStat.isFile()&&!binaryStat.isSymbolicLink(),'신뢰할 수 있는 Redis 실행 파일을 확인하세요.');
const fixture=await verificationWorkDirectory('tastedev-redis-startup-isolated-');
const runnerFile='scripts/fixtures/redis-startup-worker.mjs',modules=[runnerFile,...adminRuntimeFiles.map(name=>'lib/'+name)];
const runner=await readRuntimeModule(runnerFile,modules);
try{
 const bins=path.join(fixture,'bin');await mkdir(bins,{mode:0o755});
 for(const [name,source] of [['node',process.execPath],['redis-server',binary],['true','/usr/bin/true'],['bwrap','/usr/bin/bwrap'],['prlimit','/usr/bin/prlimit']]){await copyFile(source,path.join(bins,name));await chmod(path.join(bins,name),0o755);}
 await mkdir(path.join(fixture,'redis'),{mode:0o700});await writeFile(path.join(fixture,'redis/redis.conf'),'port 6379\nbind 127.0.0.1\nprotected-mode yes\nmaxmemory 64mb\nmaxmemory-policy noeviction\nsave ""\nappendonly no\n',{mode:0o600});
 const runtime=path.join(fixture,'runtime');await mkdir(path.join(runtime,'scripts/fixtures'),{recursive:true});await mkdir(path.join(runtime,'lib'));await writeFile(path.join(runtime,runnerFile),runner);for(const name of adminRuntimeFiles)await writeFile(path.join(runtime,'lib',name),await readAdminRuntimeModule(name));
 const args=['--unshare-user','--uid','0','--gid','0','--unshare-pid','--unshare-net','--die-with-parent','--new-session','--tmpfs','/','--dir','/usr','--ro-bind','/usr/lib','/usr/lib','--ro-bind','/usr/lib64','/usr/lib64','--ro-bind',bins,'/usr/bin','--symlink','usr/lib','/lib','--symlink','usr/lib64','/lib64','--symlink','usr/bin','/bin','--dir','/mnt','--dir','/mnt/data','--dir','/mnt/data/build','--perms','0700','--tmpfs','/mnt/data/build/tastedev-linux','--dir','/mnt/source/lib','--ro-bind',path.join(project,'lib/redis-code-operation.ts'),'/mnt/source/lib/redis-code-operation.ts','--ro-bind',path.join(fixture,'runtime'),'/mnt/runtime','--bind',fixture,'/mnt/evidence','--dir','/etc','--bind',path.join(fixture,'redis'),'/etc/redis','--proc','/proc','--dev','/dev','--','/usr/bin/node','/mnt/runtime/scripts/fixtures/redis-startup-worker.mjs'];
 try{await lstat('/usr/share/nodejs');args.splice(args.indexOf('--'),0,'--ro-bind','/usr/share/nodejs','/usr/share/nodejs');}catch(error){if(error===null||typeof error!=='object'||!('code' in error)||error.code!=='ENOENT')throw error;}
 await exec('/usr/bin/bwrap',args,{timeout:45000,maxBuffer:1048576,env:{PATH:'/usr/bin:/bin',LANG:'C.UTF-8',NODE_ENV:'test',TMPDIR:verificationWorkRoot,TMP:verificationWorkRoot,TEMP:verificationWorkRoot}});
 const result=jsonRecord(JSON.parse(await readFile(path.join(fixture,'result.json'),'utf8')));
 const evidence=path.join(verificationWorkRoot,'redis-startup-isolated-'+new Date().toISOString().replaceAll(':','-'));
 await mkdir(evidence,{recursive:true,mode:0o700});await writeFile(path.join(evidence,'result.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({status:result.status,checks:result.checks,evidence:path.join(evidence,'result.json')}));
}catch(error){
 const diagnostic=describeError(error);
 const blocked=/No permissions to create a new namespace/.test(diagnostic);
 const evidence=path.join(verificationWorkRoot,'redis-startup-isolated-'+new Date().toISOString().replaceAll(':','-'));
 await mkdir(evidence,{recursive:true,mode:0o700});
 const record={status:blocked?'BLOCKED':'FAIL',scope:'native-startup-validation',reason:blocked?'nested-user-namespace-unavailable':'verification-failed',diagnostic,hostPackageOrServiceChanges:false,operatingApplyVerified:false,redisValidationPassed:false,binarySha256:createHash('sha256').update(await readFile(binary)).digest('hex')};
 await writeFile(path.join(evidence,'result.json'),JSON.stringify(record,null,2)+'\n',{mode:0o600});console.error(JSON.stringify({status:record.status,reason:record.reason,evidence:path.join(evidence,'result.json')}));process.exitCode=1;
}
finally{await rm(fixture,{recursive:true,force:true});}
