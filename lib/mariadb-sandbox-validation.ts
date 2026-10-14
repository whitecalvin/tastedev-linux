import type {ExecFileSyncOptions} from 'node:child_process';
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
type SandboxOptions={execute?:(binary:string,args:string[],options:ExecFileSyncOptions)=>unknown|Promise<unknown>;inspect?:(input:{binary:string})=>unknown};
import {execFileSync} from './admin-native-exec.ts';
import {assertMariaDBCandidate,isMariaDBCandidate} from './mariadb-candidate.ts';
import {validationIdentityBinary} from './validation-identity-binary.ts';
import {parseLiveConfig} from './config-value-parser.ts';
const binaries=['/usr/bin/bwrap','/usr/bin/prlimit','/usr/bin/true','/usr/sbin/mariadbd','/usr/bin/my_print_defaults'];
const scratch='/mnt/data/build/tastedev-linux/mariadb-validation';
const fail:(message?:string,status?:number)=>never=(message='MariaDB 격리 설정 검수가 실패했습니다.',status=400)=>{throw Object.assign(Error(message),{status});};
export function mariadbNamespacePlan(candidate:unknown,binary:unknown,args:unknown){
 if(!isMariaDBCandidate(candidate)||!/^\/[a-zA-Z0-9_./-]+\/tastedev-mariadb-candidate-[a-zA-Z0-9_-]+$/.test(candidate.directory)||!Array.isArray(args)||!args.every((value:unknown):value is string=>typeof value==='string'))fail();
 const valid=binary==='/usr/bin/true'&&args.length===0||binary==='/usr/sbin/mariadbd'&&JSON.stringify(args)===JSON.stringify(['--no-defaults','--verbose','--help'])||binary==='/usr/sbin/mariadbd'&&[JSON.stringify(['--defaults-file='+candidate.main,'--validate-config']),JSON.stringify(['--defaults-file='+candidate.main,'--verbose','--help'])].includes(JSON.stringify(args))||binary==='/usr/bin/my_print_defaults'&&JSON.stringify(args)===JSON.stringify(['--defaults-file='+candidate.main,'--mariadbd']);
 if(!valid)fail();
 return {binary:'/usr/bin/bwrap',args:[
  '--unshare-all','--unshare-user','--disable-userns','--assert-userns-disabled','--die-with-parent','--new-session','--cap-drop','ALL','--clearenv',
  '--setenv','PATH','/usr/sbin:/usr/bin:/bin','--setenv','LANG','C','--setenv','LC_ALL','C',
  '--ro-bind','/usr','/usr','--symlink','usr/bin','/bin','--symlink','usr/sbin','/sbin','--symlink','usr/lib','/lib','--symlink','usr/lib64','/lib64',
  '--proc','/proc','--dev','/dev','--size','16777216','--tmpfs',scratch,'--setenv','TMPDIR',scratch,'--setenv','TMP',scratch,'--setenv','TEMP',scratch,'--dir','/etc','--dir','/run',
  '--ro-bind',candidate.directory,candidate.directory,'--chdir',scratch,'--','/usr/bin/prlimit',
  '--as=536870912:536870912','--cpu=15:15','--fsize=1048576:1048576','--nofile=128:128','--nproc=32:32','--core=0:0','--',binary,...args,...(binary==='/usr/sbin/mariadbd'?['--datadir='+scratch,'--tmpdir='+scratch,'--log-error='+scratch+'/mariadb-validation.log']:[])
 ],scope:'private-options-validation',operatingConfigurationChanged:false,operatingServiceChanged:false};
}
// Fixed namespace argv only. Dependencies are trusted helper or fixture functions,
// never request-supplied executables, paths, shell text or runners.
export async function inspectMariaDBSandboxCandidate(candidate:unknown,{execute=execFileSync,inspect=validationIdentityBinary}:SandboxOptions={}){
 if(typeof execute!=='function'||typeof inspect!=='function')fail();
 if(!isMariaDBCandidate(candidate))fail();await assertMariaDBCandidate(candidate);
 const fingerprints=()=>binaries.map(binary=>{const value=inspect({binary});if(!object(value)||value.path!==binary||typeof value.sha256!=='string'||!/^[a-f0-9]{64}$/.test(value.sha256)||typeof value.ino!=='number'||!Number.isSafeInteger(value.ino)||typeof value.dev!=='number'||!Number.isSafeInteger(value.dev)||typeof value.bytes!=='number'||!Number.isSafeInteger(value.bytes)||value.bytes<1)fail('MariaDB 검수 실행 파일을 확인하세요.',409);return value;});
 let before:ReturnType<typeof fingerprints>;try{before=fingerprints();}catch{fail('MariaDB 검수 실행 파일을 확인하세요.',409);}
 const run=async(binary:string,args:string[])=>{await assertMariaDBCandidate(candidate);if(JSON.stringify(fingerprints())!==JSON.stringify(before))fail('MariaDB 검수 실행 파일이 변경되었습니다.',409);const plan=mariadbNamespacePlan(candidate,binary,args);let output;try{output=await execute(plan.binary,plan.args,{encoding:'utf8',timeout:30000,maxBuffer:2097152,shell:false,cwd:'/',env:{NODE_ENV:process.env.NODE_ENV,PATH:'/usr/sbin:/usr/bin:/bin',LANG:'C',LC_ALL:'C'}});}catch{fail();}if(typeof output!=='string'||Buffer.byteLength(output)>2097152)fail();await assertMariaDBCandidate(candidate);if(JSON.stringify(fingerprints())!==JSON.stringify(before))fail('MariaDB 검수 실행 파일이 변경되었습니다.',409);return output;}
 await run('/usr/bin/true',[]);
 const help=await run('/usr/sbin/mariadbd',['--no-defaults','--verbose','--help']);
 const validationMode=/(?:^|\s)--validate-config(?:\s|[=,]|$)/m.test(help)?'configuration':'options-help';
 await run('/usr/sbin/mariadbd',['--defaults-file='+candidate.main,...(validationMode==='configuration'?['--validate-config']:['--verbose','--help'])]);
 const output=await run('/usr/bin/my_print_defaults',['--defaults-file='+candidate.main,'--mariadbd']),lines=[];
 for(const line of output.split(/\r?\n/)){const match=/^--([a-zA-Z_-]+)(?:=(.*))?$/.exec(line);if(!match)continue;let name=match[1].replaceAll('-','_'),value=match[2]??'1';if(name==='skip_slow_query_log'){name='slow_query_log';value='0';}if(['port','max_connections','innodb_buffer_pool_size','character_set_server','slow_query_log','long_query_time'].includes(name))lines.push(name+'='+value);}
 const values=parseLiveConfig('mariadb','[mariadbd]\n'+lines.join('\n')).values;
 return {valid:true,validationMode,values,scope:'private-options-validation',namespaceCommandsCompleted:true,operatingConfigurationChanged:false,operatingServiceChanged:false,operationalResourcesVerified:false};
}
