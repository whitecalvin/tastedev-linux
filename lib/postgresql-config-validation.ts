import type {ExecFileSyncOptions} from 'node:child_process';
type ValidationOptions={execute?:(binary:string,args:string[],options:ExecFileSyncOptions)=>unknown|Promise<unknown>;inspect?:(input:{binary:string})=>unknown;validationUid?:number;validationGid?:number};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {isPostgresqlWorkPath,postgresqlSandboxScratch} from './postgresql-work-directory.ts';
import {execFileSync} from './admin-native-exec.ts';
import {validationIdentityBinary} from './validation-identity-binary.ts';
import {assertPostgresqlConfigCandidate} from './postgresql-config-candidate.ts';
const fail:(message?:string,status?:number)=>never=(message='PostgreSQL 격리 설정 검수가 실패했습니다.',status=400)=>{throw Object.assign(Error(message),{status});};
const keys=['port','max_connections','shared_buffers','work_mem','logging_collector'];
export async function postgresqlConfigNamespacePlan(value:unknown,binary:unknown,args:unknown){
 const candidate=await assertPostgresqlConfigCandidate(value);const match=/^\/etc\/postgresql\/([1-9][0-9]?)\/[a-zA-Z0-9][a-zA-Z0-9_-]*\/postgresql\.conf$/.exec(candidate.sourceRoot);
 if(!match||candidate.namespaceUid===0||!Array.isArray(args)||!args.every((value:unknown):value is string=>typeof value==='string')||candidate.payload!==candidate.directory+'/namespace'||!isPostgresqlWorkPath(candidate.directory,'tastedev-pg-config-'))fail();
 const native='/usr/lib/postgresql/'+match[1]+'/bin/postgres',expected=(key:string)=>['-D',postgresqlSandboxScratch,'-c','config_file='+candidate.main,'-c','data_directory='+postgresqlSandboxScratch,'-C',key];
 if(!(binary==='/usr/bin/id'&&['-u','-g'].includes(args[0])&&args.length===1)&&!(binary===native&&keys.some(key=>JSON.stringify(args)===JSON.stringify(expected(key)))))fail();
 return {binary:'/usr/bin/bwrap',args:[
  '--unshare-all','--unshare-user','--disable-userns','--assert-userns-disabled','--uid',String(candidate.namespaceUid),'--gid',String(candidate.namespaceGid),'--die-with-parent','--new-session','--cap-drop','ALL','--clearenv',
  '--setenv','PATH','/usr/bin:/bin','--setenv','HOME',postgresqlSandboxScratch,'--setenv','LANG','C','--setenv','LC_ALL','C',...['TMPDIR','TMP','TEMP'].flatMap(name=>['--setenv',name,postgresqlSandboxScratch]),
  '--ro-bind','/usr','/usr','--symlink','usr/bin','/bin','--symlink','usr/lib','/lib','--symlink','usr/lib64','/lib64',
  '--proc','/proc','--dev','/dev','--size','16777216','--tmpfs',postgresqlSandboxScratch,'--dir','/etc','--dir','/run',
  '--ro-bind',candidate.payload+'/passwd','/etc/passwd','--ro-bind',candidate.payload+'/group','/etc/group',
  '--perms','0755','--dir',candidate.directory,'--ro-bind',candidate.payload,candidate.payload,'--chdir',postgresqlSandboxScratch,'--','/usr/bin/prlimit',
  '--as=536870912:536870912','--cpu=15:15','--fsize=1048576:1048576','--nofile=128:128','--nproc=32:32','--core=0:0','--',binary,...args
 ],scope:'private-config-options'};
}
// Trusted helper/fixture dependencies only. Namespace failure never falls back to host parsing.
export async function inspectPostgresqlConfigCandidate(value:unknown,{execute=execFileSync,inspect=validationIdentityBinary,validationUid=65534,validationGid=65534}:ValidationOptions={}){
 const candidate=await assertPostgresqlConfigCandidate(value);if(candidate.namespaceUid!==validationUid||candidate.namespaceGid!==validationGid||validationUid===0||typeof execute!=='function'||typeof inspect!=='function')fail();
 const major=/^\/etc\/postgresql\/([1-9][0-9]?)\//.exec(candidate.sourceRoot)?.[1];if(!major)fail();const binary='/usr/lib/postgresql/'+major+'/bin/postgres',binaries=['/usr/bin/bwrap','/usr/bin/prlimit','/usr/bin/id',binary];
 function fingerprints(){return binaries.map(binary=>{const value=inspect({binary});if(!object(value)||value.path!==binary||typeof value.sha256!=='string'||!/^[a-f0-9]{64}$/.test(value.sha256)||typeof value.ino!=='number'||!Number.isSafeInteger(value.ino)||typeof value.dev!=='number'||!Number.isSafeInteger(value.dev)||typeof value.bytes!=='number'||!Number.isSafeInteger(value.bytes)||value.bytes<1)fail();return value;});}
 let before:ReturnType<typeof fingerprints>;try{before=fingerprints();}catch{fail('PostgreSQL 검수 실행 파일의 설치와 root 소유권을 확인하세요.',409);}
 const run=async(binary:string,args:string[])=>{await assertPostgresqlConfigCandidate(candidate);if(JSON.stringify(fingerprints())!==JSON.stringify(before))fail('PostgreSQL 검수 실행 파일이 변경되었습니다.',409);const plan=await postgresqlConfigNamespacePlan(candidate,binary,args);let output;try{output=await execute(plan.binary,plan.args,{shell:false,stdio:['ignore','pipe','pipe'],encoding:'utf8',cwd:'/',env:{NODE_ENV:process.env.NODE_ENV,PATH:'/usr/bin:/bin',LANG:'C',LC_ALL:'C'},timeout:30000,maxBuffer:4096});}catch{fail();}if(typeof output!=='string'||Buffer.byteLength(output)>4096)fail();await assertPostgresqlConfigCandidate(candidate);if(JSON.stringify(fingerprints())!==JSON.stringify(before))fail('PostgreSQL 검수 실행 파일이 변경되었습니다.',409);return output.trim();}
 if(await run('/usr/bin/id',['-u'])!==String(validationUid)||await run('/usr/bin/id',['-g'])!==String(validationGid))fail();
 const values:Record<string,string>={};for(const key of keys){const value=await run(binary,['-D',postgresqlSandboxScratch,'-c','config_file='+candidate.main,'-c','data_directory='+postgresqlSandboxScratch,'-C',key]);if(key==='logging_collector'?!/^(on|off)$/.test(value):!/^\d{1,15}$/.test(value))fail();values[key]=value;}
 return {valid:true,engine:'postgres-config-read',scope:'private-config-options',values,namespaceUid:validationUid,namespaceGid:validationGid,namespaceCommandsCompleted:true,operatingConfigurationChanged:false,operatingServiceChanged:false,postmasterStarted:false,operationalResourcesVerified:false,autoConfigurationVerified:false};
}
