import type {ExecFileOptionsWithStringEncoding} from 'node:child_process';
import {verificationWorkDirectory,verificationWorkRoot} from './verification/work-directory.ts';
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {mkdtemp,writeFile,readFile,lstat,rm,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {nodeAppUnit} from '../lib/node-app-unit.ts';
const execute=promisify(execFile),binary='/usr/bin/systemd-analyze';
const stat=await lstat(binary);if(!stat.isFile()||stat.isSymbolicLink()||stat.uid!==0||(stat.mode&0o022)||!(stat.mode&0o111))throw Error('Trusted systemd-analyze is required');
const uid=process.getuid?.();if(uid===undefined||uid===0)throw Error('Run isolated unit validation as a normal user');
const fixture=await verificationWorkDirectory('tastedev-node-unit-');
try{
 const profile={id:'native-fixture',label:'Native fixture',directory:fixture,entry:'server.mjs',environmentFile:'.env'};
 await writeFile(path.join(fixture,'server.mjs'),"throw Error('App must never run during unit validation');\n",{mode:0o600});await writeFile(path.join(fixture,'.env'),'PORT=3145\n',{mode:0o600});
 const unit=path.join(fixture,'tastedev-node-native-fixture.service'),checks:string[]=[];let status='PASS',diagnostic:string|null=null;
 const options:ExecFileOptionsWithStringEncoding={cwd:'/',timeout:30000,maxBuffer:1048576,encoding:'utf8',env:{NODE_ENV:process.env.NODE_ENV,PATH:'/usr/sbin:/usr/bin:/sbin:/bin',LANG:'C',LC_ALL:'C'}};
 for(const restart of ['no','on-failure','always'] as const){await writeFile(unit,nodeAppUnit(profile,uid,{restart,restartSeconds:30,stopSeconds:60}),{mode:0o600});try{await execute(binary,['--man=no','verify',unit],options);}catch(error){status='BLOCKED';diagnostic=String(object(error)?error.stderr||error.message:error).slice(0,2048);break;}checks.push(restart+' unit accepted by native systemd parser');}
 if(status==='PASS'){await writeFile(unit,nodeAppUnit(profile,uid).replace('/usr/bin/node','/tastedev-nonexistent-fixture/node'),{mode:0o600});let rejected=false;try{await execute(binary,['--man=no','verify',unit],options);}catch{rejected=true;}if(!rejected)throw Error('Native validator did not reject missing executable');checks.push('missing executable rejected by native validator');}
 const {stdout}=await execute(binary,['--version'],options),record={status,diagnostic,checks,tool:binary,toolVersion:stdout.split('\n')[0],toolSha256:createHash('sha256').update(await readFile(binary)).digest('hex'),nativeUnitValidation:status==='PASS',registered:false,started:false,enabled:false,systemManagerChanged:false};
 const root=path.join(verificationWorkRoot,'evidence');await mkdir(root,{recursive:true,mode:0o700});const evidence=path.join(root,'node-unit-native-'+new Date().toISOString().replaceAll(':','-')+'.json');await writeFile(evidence,JSON.stringify(record,null,2)+'\n',{mode:0o600,flag:'wx'});process.stdout.write(JSON.stringify({...record,evidence})+'\n');if(status!=='PASS')process.exitCode=1;
}finally{await rm(fixture,{recursive:true,force:true});}
