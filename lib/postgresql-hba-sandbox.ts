import type {Stats} from 'node:fs';
import type {ChildProcessWithoutNullStreams} from 'node:child_process';
import {hasErrorCode} from './error-code.ts';
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {postgresqlWorkDirectory,isPostgresqlWorkPath,postgresqlSandboxScratch} from './postgresql-work-directory.ts';
import {spawn} from 'node:child_process';
import {writeFile,lstat,open,rm} from 'node:fs/promises';
import {constants} from 'node:fs';
import {validationIdentityBinary} from './validation-identity-binary.ts';
import {preparePostgresqlHbaCandidate,writePostgresqlHbaCandidate} from './postgresql-hba-candidate.ts';
import {postgresqlHbaValidationPlan,postgresqlHbaValidationReport} from './postgresql-hba-validation.ts';
const fail:(message?:string,status?:number)=>never=(message='PostgreSQL 격리 검수를 실행하지 못했습니다.',status=409)=>{throw Object.assign(Error(message),{status});};
// Internal plan only: no HTTP-supplied paths, binaries, environment or arguments.
export function postgresqlHbaNamespacePlan(root:unknown,binary:unknown,args:unknown){
 if(typeof root!=='string'||typeof binary!=='string'||!isPostgresqlWorkPath(root,'linux-pg-hba-')||!/^\/usr\/(?:bin\/id|lib\/postgresql\/\d+\/bin\/(?:initdb|postgres))$/.test(binary)||!Array.isArray(args)||!args.every((value:unknown):value is string=>typeof value==='string'&&!value.includes('\0')))fail();
 return {binary:'/usr/bin/bwrap',args:[
  '--unshare-all','--unshare-user','--disable-userns','--assert-userns-disabled',
  '--uid','65534','--gid','65534','--die-with-parent','--new-session','--cap-drop','ALL','--clearenv',
  '--setenv','PATH','/usr/bin:/bin','--setenv','LANG','C','--setenv','LC_ALL','C','--setenv','HOME',root,...['TMPDIR','TMP','TEMP'].flatMap(name=>['--setenv',name,postgresqlSandboxScratch]),
  '--ro-bind','/usr','/usr','--symlink','usr/bin','/bin','--symlink','usr/lib','/lib','--symlink','usr/lib64','/lib64',
  '--proc','/proc','--dev','/dev','--size','16777216','--tmpfs',postgresqlSandboxScratch,'--dir','/etc',
  '--ro-bind',root+'/passwd','/etc/passwd','--ro-bind',root+'/group','/etc/group',
  '--bind',root,root,'--chdir',root,'--','/usr/bin/prlimit',
  '--as=536870912:536870912','--cpu=15:15','--fsize=67108864:67108864','--nofile=128:128','--nproc=64:64','--core=0:0',
  '--',binary,...args],scope:'private-cluster-single-user'};
}
export function postgresqlHbaExecutionMessage({stderr='',timedOut=false,spawnFailed=false}:{stderr?:unknown;timedOut?:boolean;spawnFailed?:boolean}={}){
 if(timedOut)return 'PostgreSQL 격리 검수 시간이 초과됐습니다. 서버 부하와 검수 범위를 확인하세요.';
 if(spawnFailed)return 'PostgreSQL 격리 검수 실행 파일을 시작하지 못했습니다. 설치와 실행 권한을 확인하세요.';
 if(typeof stderr==='string'&&/bwrap: (?:No permissions to create a new namespace|.*(?:Operation not permitted|setting up uid map|unshare user ns))/i.test(stderr))return '이 환경에서 PostgreSQL 격리 검수를 실행할 권한이 없습니다. user namespace와 컨테이너 보안 정책을 확인하세요.';
 return 'PostgreSQL 격리 검수가 실패했습니다. 검수 환경과 설정 구문을 확인하세요.';
}
async function execute(plan:ReturnType<typeof postgresqlHbaNamespacePlan>,stdin='',timeout=20000){
 const mask=process.umask(0o077);let child:ChildProcessWithoutNullStreams;try{child=spawn(plan.binary,plan.args,{env:{NODE_ENV:process.env.NODE_ENV,PATH:'/usr/bin:/bin',LANG:'C',LC_ALL:'C'},cwd:'/',detached:true,stdio:['pipe','pipe','pipe']});}finally{process.umask(mask);}
 let output='',stderr='',bytes=0,failed=false,spawnFailed=false,timedOut=false;
 const kill=()=>{failed=true;try{typeof child.pid==='number'&&process.kill(-child.pid,'SIGKILL');}catch{}child.kill('SIGKILL');};
 const timer=setTimeout(()=>{timedOut=true;kill();},timeout);child.stdin.on('error',()=>{});child.stdin.end(stdin);
 child.stdout.on('data',chunk=>{bytes+=chunk.length;if(bytes>65536)kill();else output+=chunk.toString();});child.stderr.on('data',chunk=>{bytes+=chunk.length;if(bytes>65536)kill();else stderr+=chunk.toString();});
 child.once('error',()=>{spawnFailed=true;});
 const code=await new Promise<number|null>(resolve=>child.once('close',resolve));clearTimeout(timer);
 if(failed||spawnFailed||code!==0)fail(postgresqlHbaExecutionMessage({stderr,timedOut,spawnFailed}));
 return output;
}
function fingerprint(binary:string){try{return validationIdentityBinary({binary});}catch{fail('PostgreSQL 검수 실행 파일의 설치와 root 소유권을 확인하세요.');}}
export async function readPostgresqlHbaReport(file:unknown,{ownerUid=0}:{ownerUid?:number}={}){
 if(typeof file!=='string'||!file.endsWith('/result.json')||!isPostgresqlWorkPath(file.slice(0,-12),'linux-pg-hba-'))fail();
 const root=file.slice(0,file.lastIndexOf('/')),parent=await lstat(root);if(!parent.isDirectory()||parent.isSymbolicLink()||parent.uid!==ownerUid||(parent.mode&0o077))fail();
 const safe=(stat:Stats)=>stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1&&stat.uid===ownerUid&&!(stat.mode&0o022)&&stat.size<=262144;
 const before=await lstat(file);if(!safe(before))fail('검수 결과 파일의 권한을 확인하세요. uid='+before.uid+' mode='+(before.mode&0o777).toString(8));const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{let stat=await handle.stat();if(!safe(stat)||stat.ino!==before.ino||stat.dev!==before.dev)fail();
 // COPY TO creates a 0644 report even in a private 0700 cluster. Restrict the
 // verified descriptor before reading; the private parent protects it throughout.
 await handle.chmod(0o600);stat=await handle.stat();if(stat.mode&0o077)fail();const buffer=Buffer.alloc(262145);let size=0;while(size<buffer.length){const result=await handle.read(buffer,size,buffer.length-size,null);if(!result.bytesRead)break;size+=result.bytesRead;}if(size>262144)fail();const after=await lstat(file);const currentParent=await lstat(root);if(!safe(after)||(after.mode&0o077)||(['ino','dev','size','mtimeMs','ctimeMs'] as const).some(key=>stat[key]!==after[key])||currentParent.isSymbolicLink()||currentParent.ino!==parent.ino||currentParent.dev!==parent.dev||currentParent.uid!==ownerUid||(currentParent.mode&0o077))fail();return new TextDecoder('utf-8',{fatal:true}).decode(buffer.subarray(0,size));}finally{await handle.close();}
}
// Run a generated cluster only. Host config/data is never mounted in this jail.
export async function runPostgresqlHbaCandidate(graph:unknown,sources:Map<string,string>,major:unknown){
 if(process.getuid?.()!==0)fail('격리 검수는 설치된 관리자 helper에서 실행하세요.',403);
 const root=await postgresqlWorkDirectory('linux-pg-hba-'),identity=await lstat(root);let phase='파일 준비';
 try{
  const candidate=preparePostgresqlHbaCandidate(graph,sources,root),plan=postgresqlHbaValidationPlan(root,major);
  const binaries=['/usr/bin/bwrap','/usr/bin/prlimit','/usr/bin/id',plan.init.binary,plan.inspect.binary].map(fingerprint);
  await writePostgresqlHbaCandidate(candidate);
  await writeFile(root+'/passwd','tastedev_validation:x:65534:65534::'+root+':/usr/sbin/nologin\n',{mode:0o600,flag:'wx'});
  await writeFile(root+'/group','tastedev_validation:x:65534:\n',{mode:0o600,flag:'wx'});
  phase='격리 실행 환경';
  for(const [flag,expected] of [['-u','65534'],['-g','65534']])if((await execute(postgresqlHbaNamespacePlan(root,'/usr/bin/id',[flag]),'',5000)).trim()!==expected)fail('격리 검수 계정을 확인하세요.');
  phase='임시 데이터베이스 초기화';
  await execute(postgresqlHbaNamespacePlan(root,plan.init.binary,plan.init.args));
  phase='접속 규칙 구문 검사';
  await execute(postgresqlHbaNamespacePlan(root,plan.inspect.binary,plan.inspect.args),plan.inspect.stdin);
  for(const previous of binaries)if(JSON.stringify(fingerprint(previous.path))!==JSON.stringify(previous))fail('검수 중 실행 파일이 변경되었습니다.');
  phase='검수 결과 확인';
  const result=postgresqlHbaValidationReport(await readPostgresqlHbaReport(plan.report),{major,files:candidate.files});
  return {...result,namespaceUid:65534,namespaceGid:65534,networkListeners:false,operationalFilesChanged:false,postmasterStarted:false,resourceLimitsConfigured:true,resourceLimitsVerified:false};
 }catch(error){const message=error instanceof Error?error.message:'PostgreSQL 격리 검수를 실행하지 못했습니다.',status=object(error)&&typeof error.status==='number'?error.status:409;throw Object.assign(Error(phase+' · '+message),{status});}finally{
  const current=await lstat(root);if(current.isSymbolicLink()||current.uid!==0||current.ino!==identity.ino||current.dev!==identity.dev)fail('검수 임시 경로가 변경되었습니다.',500);
  await rm(root,{recursive:true,force:true});
 }
}
