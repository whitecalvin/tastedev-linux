"""Approved test host: current helper in an ephemeral outer mount namespace.
No host configuration, package, database, service, or existing helper is changed.
"""
import pathlib, subprocess, json, hashlib, re, tarfile, io, base64, datetime, sys
root=pathlib.Path.cwd()
prepared=json.loads(subprocess.run(['node',str(root/'scripts/verification/postgresql-systemd-source.ts')],check=True,capture_output=True,text=True,timeout=120).stdout)
assert prepared['format']=='tastedev-postgresql-systemd-source-v1' and isinstance(prepared['files'],dict)
names=list(prepared['files']);assert len(names)==len(set(names))
files={'linux-admin':(root/'scripts/admin/linux-admin').read_bytes()}
package=(root/'scripts/admin/package.json').read_bytes()
assert json.loads(package)=={'private':True,'type':'commonjs'}
files['package.json']=package
manifest={}
for name in names:
    assert re.fullmatch(r'[a-z0-9-]+\.mjs',name)
    data=base64.b64decode(prepared['files'][name],validate=True);files['runtime/'+name]=data;manifest[name]=hashlib.sha256(data).hexdigest()
files['runtime/manifest.json']=json.dumps(manifest).encode()
stream=io.BytesIO()
with tarfile.open(fileobj=stream,mode='w') as archive:
    for name,data in files.items():
        info=tarfile.TarInfo(name);info.size=len(data);info.mode=0o755 if name=='linux-admin' else 0o644;archive.addfile(info,io.BytesIO(data))
helper_source=json.loads(subprocess.run(['node',str(root/'scripts/verification/postgresql-helper-container-source.ts')],check=True,capture_output=True,text=True,timeout=120).stdout)
assert helper_source['format']=='tastedev-postgresql-helper-container-source-v1' and isinstance(helper_source['fixture'],str)
fixture=helper_source['fixture']
host_systemd='--host-systemd-fixture' in sys.argv[1:]
interruption_only='--interruption-only' in sys.argv[1:]
assert not interruption_only or host_systemd
daemon_only='--daemon-only' in sys.argv[1:]
assert not daemon_only or host_systemd and not interruption_only
code_only='--code-only' in sys.argv[1:]
assert not (daemon_only and code_only)
assert not code_only or host_systemd and not interruption_only
redis_state_preflight='--redis-state-preflight' in sys.argv[1:]
redis_helper='--redis-helper' in sys.argv[1:]
redis_parser='--redis-parser' in sys.argv[1:] or redis_helper
lifecycle='--hba-lifecycle' in sys.argv[1:]
if lifecycle:
 lifecycle_source=json.loads(subprocess.run(['node',str(root/'scripts/verification/postgresql-hba-lifecycle-source.ts')],check=True,capture_output=True,text=True,timeout=120).stdout)
 assert lifecycle_source['format']=='tastedev-postgresql-hba-lifecycle-source-v1' and isinstance(lifecycle_source['fixture'],str)
 fixture=lifecycle_source['fixture']
service_readonly='--service-readonly' in sys.argv[1:]
direct='--direct-parser' in sys.argv[1:]
host_proc='--host-proc-outer' in sys.argv[1:]
private_proc='--private-proc-outer' in sys.argv[1:]
assert not (host_proc and private_proc)
assert not host_systemd or not (redis_state_preflight or redis_parser or lifecycle or service_readonly or direct or host_proc or private_proc)
assert not redis_state_preflight or (private_proc and not (redis_parser or direct or host_proc or lifecycle or service_readonly))
assert not lifecycle or private_proc
assert not redis_parser or (private_proc and not (direct or host_proc or lifecycle or service_readonly))
assert not service_readonly or not (direct or host_proc or private_proc or lifecycle)
if direct:
 fixture=r'''
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const {validatePostgresqlHba}=await import(pathToFileURL(process.argv[2]+'/runtime/postgresql-hba-validate.mjs'));
assert.equal(process.getuid(),0);
await mkdir('/mnt/data/build/tastedev-linux',{recursive:true,mode:0o700});
const base=await mkdtemp('/mnt/data/build/tastedev-linux/linux-hba-direct-');
const target='/etc/postgresql/18/fixture/pg_hba.conf';
const folder=base+'/postgresql/18/fixture';
const original='# 한국어 검수 전용\nlocal all all peer\nhost all all 127.0.0.1/32 scram-sha-256\n';
const checks=[];
let result;
try {
 await mkdir(folder,{recursive:true,mode:0o700});
 await writeFile(folder+'/pg_hba.conf',original,{mode:0o600});
 const version=createHash('sha256').update(original).digest('hex');
 for(const [name,text,valid,category] of [
  ['정상 규칙',original,true],
  ['잘못된 인증 방식','local all all nonexistent_method\n',false,'invalid-method'],
  ['잘못된 주소','host all all 127.0.0.1/999 scram-sha-256\n',false,'invalid-address'],
  ['잘못된 인증 옵션','host all all 127.0.0.1/32 scram-sha-256 invalid_option=1\n',false,'invalid-option'],
 ]) {
  const report=await validatePostgresqlHba({path:target,version,text},{base,ownerUid:0});
  assert.equal(report.valid,valid);assert.equal(report.engine,'postgresql-hba-file-rules');
  assert.equal(report.namespaceUid,65534);assert.equal(report.postmasterStarted,false);
  if(category)assert(report.diagnostics.some(item=>item.category===category));
  assert.equal(await readFile(folder+'/pg_hba.conf','utf8'),original);
  checks.push({name,valid,engine:report.engine,diagnostics:report.diagnostics});
 }
 const included='# 포함 파일 한국어\nhost all all 127.0.0.1/32 scram-sha-256\n';
 await writeFile(folder+'/extra.conf',included,{mode:0o600});
 const includeReport=await validatePostgresqlHba({path:target,version,text:'include extra.conf\n'},{base,ownerUid:0});
 assert.equal(includeReport.valid,true);assert.equal(includeReport.engine,'postgresql-hba-file-rules');
 assert(includeReport.rules.some(rule=>rule.path==='/etc/postgresql/18/fixture/extra.conf'&&rule.line===2));
 checks.push({name:'포함 파일 정상 규칙과 원래 경로 매핑',valid:true,engine:includeReport.engine});
 await writeFile(folder+'/extra.conf','# 포함 파일 오류\nlocal all all nonexistent_method\n',{mode:0o600});
 const includeError=await validatePostgresqlHba({path:target,version,text:'include extra.conf\n'},{base,ownerUid:0});
 assert.equal(includeError.valid,false);assert.equal(includeError.engine,'postgresql-hba-file-rules');
 assert(includeError.diagnostics.some(item=>item.path==='/etc/postgresql/18/fixture/extra.conf'&&item.line===2&&item.category==='invalid-method'));
 checks.push({name:'포함 파일 오류의 원래 경로와 줄 번호',valid:false,diagnostics:includeError.diagnostics});
 await writeFile(folder+'/extra.conf',included,{mode:0o600});
 await mkdir(folder+'/rules',{mode:0o700});
 await writeFile(folder+'/rules/10-local.conf','local all all peer\n',{mode:0o600});
 await writeFile(folder+'/rules/20-host.conf','host all all 127.0.0.1/32 scram-sha-256\n',{mode:0o600});
 const directoryReport=await validatePostgresqlHba({path:target,version,text:'include_dir rules\n'},{base,ownerUid:0});
 assert.equal(directoryReport.valid,true);assert.equal(directoryReport.engine,'postgresql-hba-file-rules');
 assert.deepEqual(directoryReport.rules.map(rule=>rule.path),['/etc/postgresql/18/fixture/rules/10-local.conf','/etc/postgresql/18/fixture/rules/20-host.conf']);
 checks.push({name:'포함 디렉터리 파일 순서와 경로',valid:true,engine:directoryReport.engine});
 await writeFile(folder+'/databases.conf','tastedev_fixture\n',{mode:0o600});
 const listReport=await validatePostgresqlHba({path:target,version,text:'local @databases.conf all peer\n'},{base,ownerUid:0});
 assert.equal(listReport.valid,true);assert.equal(listReport.engine,'postgresql-hba-file-rules');
 checks.push({name:'데이터베이스 목록 참조 파일',valid:true,engine:listReport.engine});
 const missing=await validatePostgresqlHba({path:target,version,text:'include missing.conf\n'},{base,ownerUid:0});
 assert.equal(missing.valid,false);assert.equal(missing.engine,'postgresql-hba-snapshot');
 assert(missing.diagnostics.some(item=>item.category==='missing-file'));
 checks.push({name:'필수 포함 파일 누락은 파서 실행 전 거부',valid:false,diagnostics:missing.diagnostics});
 await writeFile(folder+'/cycle.conf','include cycle.conf\n',{mode:0o600});
 const cycle=await validatePostgresqlHba({path:target,version,text:'include cycle.conf\n'},{base,ownerUid:0});
 assert.equal(cycle.valid,false);assert.equal(cycle.engine,'postgresql-hba-snapshot');
 assert(cycle.diagnostics.some(item=>item.category==='cycle-or-limit'));
 checks.push({name:'포함 파일 순환은 파서 실행 전 거부',valid:false,diagnostics:cycle.diagnostics});
 assert.equal(await readFile(folder+'/pg_hba.conf','utf8'),original);
 assert.equal(await readFile(folder+'/extra.conf','utf8'),included);
 assert.equal(await readFile(folder+'/databases.conf','utf8'),'tastedev_fixture\n');
 await assert.rejects(validatePostgresqlHba({path:target,version:'f'.repeat(64),text:original},{base,ownerUid:0}),e=>e.status===409);
 checks.push({name:'오래된 버전 거부',status:409});
 result={status:'PASS',checks,fixtureUnchanged:true,configurationApplied:false,operatingDatabaseStarted:false,hostConfigurationChanged:false};
}catch(error){result={status:'FAIL',checks,message:error.message};}
finally {await rm(base,{recursive:true,force:true});}
console.log(JSON.stringify(result));process.exitCode=result.status==='FAIL'?1:0;
'''
if redis_parser:
 source_args=['node',str(root/'scripts/verification/redis-startup-source.ts')]+(['--helper'] if redis_helper else [])
 redis_source=json.loads(subprocess.run(source_args,check=True,capture_output=True,text=True,timeout=120).stdout)
 assert redis_source['format']=='tastedev-redis-startup-source-v1' and isinstance(redis_source['fixture'],str) and redis_source['helper']==redis_helper
 fixture=redis_source['fixture']
if host_systemd:fixture=prepared['fixture']
if redis_state_preflight:
 fixture=r'''
import assert from 'node:assert/strict';
import {readFile,lstat} from 'node:fs/promises';
const lines=(await readFile('/proc/self/mountinfo','utf8')).trim().split('\n');
const state=lines.map(line=>{const [left,right]=line.split(' - ');return {left:left.split(' '),right:right.split(' ')};}).find(item=>item.left[4]==='/var/lib/linux');
assert(state);assert.equal(state.right[0],'tmpfs');assert(state.left[5].split(',').includes('rw'));
const stat=await lstat('/var/lib/linux');assert(stat.isDirectory()&&!stat.isSymbolicLink());assert.equal(stat.uid,0);assert.equal(stat.mode&0o777,0o700);
await assert.rejects(lstat('/var/lib/linux/admin'),error=>error.code==='ENOENT');
console.log(JSON.stringify({status:'PASS',scope:'read-only namespace state mount preflight',stateMount:{path:'/var/lib/linux',filesystem:state.right[0],mountId:state.left[0],options:state.left[5],uid:stat.uid,mode:'0700'},adminStateAbsent:true,helperExecuted:false,stateCreated:false,hostConfigurationChanged:false}));
'''
if service_readonly:
 fixture=r'''
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const {inspectPostgresqlHbaService,inspectPostgresqlHbaIdentity}=await import(pathToFileURL(process.argv[2]+'/runtime/postgresql-hba-service.mjs'));
const {redisValidationBinary}=await import(pathToFileURL(process.argv[2]+'/runtime/redis-validation-binary.mjs'));
const {execFile}=await import('node:child_process');const {promisify}=await import('node:util');const exec=promisify(execFile);
let step='initialize';
const dependencies={verifyExecutable:binary=>{step='verify '+binary;return redisValidationBinary({binary});},runCommand:async(binary,args,extra={})=>{
 step='run '+binary;redisValidationBinary({binary});
 const output=await exec(binary,args,{cwd:'/',timeout:10000,maxBuffer:16384,encoding:'utf8',env:{PATH:'/usr/bin:/usr/sbin:/bin',LANG:'C',LC_ALL:'C',HOME:'/',...extra}});
 step='after '+binary;return output;
}};
assert.equal(process.getuid(),0);
const target='/etc/postgresql/18/main/pg_hba.conf',config='/etc/postgresql/18/main/postgresql.conf',hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const before={hba:hash(await readFile(target)),config:hash(await readFile(config))};
const checks=[];
let result;
try{
 const service=await inspectPostgresqlHbaService(target,dependencies);
 assert.equal(service.unit,'postgresql@18-main.service');assert.equal(service.hba,target);assert.equal(service.major,18);
 assert.equal(service.identityVerified,true);assert.equal(service.readOnlyQuery,true);assert(service.pid>1);
 checks.push('actual systemd MainPID, PostgreSQL executable/account and private Unix socket identity match');
 checks.push('fixed SQL transaction_read_only=on verifies running configuration/HBA/major/start time');
 assert.equal(await inspectPostgresqlHbaIdentity(service,dependencies),true);checks.push('second actual systemd/process identity inspection stays stable');
 assert.deepEqual({hba:hash(await readFile(target)),config:hash(await readFile(config))},before);checks.push('operating HBA and configuration file hashes unchanged');
 result={status:'PASS',checks,service,sourceFileHashes:before,systemdInspectionTested:true,readOnlyRuntimeQueryTested:true,serviceReloaded:false,serviceRestarted:false,configurationApplied:false,hostConfigurationChanged:false,privilegedHelperExercised:false};
}catch(error){result={status:'FAIL',step,checks,message:error.message,statusCode:error.status,serviceReloaded:false,serviceRestarted:false,configurationApplied:false};}
console.log(JSON.stringify(result));process.exitCode=result.status==='FAIL'?1:0;
'''
remote=r'''
import tempfile,pathlib,tarfile,io,base64,subprocess,json,shutil,hashlib,re,os
payload=__PAYLOAD__
fixture=__FIXTURE__
direct=__DIRECT__
host_proc=__HOST_PROC__
private_proc=__PRIVATE_PROC__
lifecycle=__LIFECYCLE__
service_readonly=__SERVICE_READONLY__
redis_parser=__REDIS_PARSER__
host_systemd=__HOST_SYSTEMD__
base=pathlib.Path('/mnt/data/build/tastedev-linux/postgresql-host-jail');base.mkdir(parents=True,mode=0o700,exist_ok=True)
assert base.is_dir() and not base.is_symlink() and base.stat().st_uid==os.getuid() and not base.stat().st_mode&0o077
root=pathlib.Path(tempfile.mkdtemp(prefix='tastedev-linux-host-jail-',dir=base))
(root/'temporary').mkdir(mode=0o700)
os.environ.update(TMPDIR=str(root/'temporary'),TMP=str(root/'temporary'),TEMP=str(root/'temporary'))
stage=root/'admin';stage.mkdir(mode=0o755)
if private_proc:(root/'private-proc').mkdir(mode=0o700)
changedOwner=False
try:
 with tarfile.open(fileobj=io.BytesIO(base64.b64decode(payload)),mode='r') as archive:
  for member in archive:
   assert member.isfile() and not member.name.startswith('/') and '..' not in pathlib.PurePosixPath(member.name).parts
   target=stage/member.name;target.parent.mkdir(parents=True,exist_ok=True,mode=0o755);target.write_bytes(archive.extractfile(member).read());target.chmod(member.mode)
 if redis_parser:
  # Only download/extract into our own temporary directory; no apt install.
  metadata=subprocess.check_output(['apt-cache','show','redis-tools'],text=True).split('\n\n')[0]
  fields=dict(line.split(': ',1) for line in metadata.splitlines() if ': ' in line and not line.startswith(' '))
  version=fields['Version'];expected=fields['SHA256']
  subprocess.run(['apt-get','download','redis-tools='+version],cwd=root,check=True,capture_output=True,timeout=90)
  packages=list(root.glob('*.deb'));assert len(packages)==1
  assert hashlib.sha256(packages[0].read_bytes()).hexdigest()==expected
  extracted=root/'redis-package'
  subprocess.run(['dpkg-deb','-x',str(packages[0]),str(extracted)],check=True,capture_output=True)
  bins=stage/'redis-bin';bins.mkdir(mode=0o755)
  for name in ['node','bwrap','prlimit','true','sh','flock']:
   shutil.copyfile(pathlib.Path('/usr/bin/'+name).resolve(),bins/name);(bins/name).chmod(0o755)
  shutil.copyfile(extracted/'usr/bin/redis-check-rdb',bins/'redis-server');(bins/'redis-server').chmod(0o755)
  for package in ['liblzf1','libjemalloc2']:
   stanza=subprocess.check_output(['apt-cache','show',package],text=True).split('\n\n')[0]
   values=dict(line.split(': ',1) for line in stanza.splitlines() if ': ' in line and not line.startswith(' '))
   previous=set(root.glob('*.deb'))
   subprocess.run(['apt-get','download',package+'='+values['Version']],cwd=root,check=True,capture_output=True,timeout=90)
   downloaded=list(set(root.glob('*.deb'))-previous);assert len(downloaded)==1
   assert hashlib.sha256(downloaded[0].read_bytes()).hexdigest()==values['SHA256']
   subprocess.run(['dpkg-deb','-x',str(downloaded[0]),str(extracted)],check=True,capture_output=True)
  private_usr=stage/'redis-usr';(private_usr/'bin').mkdir(parents=True,mode=0o755)
  (private_usr/'lib/tastedev-linux/scripts/admin').mkdir(parents=True,mode=0o755)
  (private_usr/'lib64').mkdir(mode=0o755)
  for binary in bins.iterdir():
   shutil.copyfile(binary,private_usr/'bin'/binary.name);(private_usr/'bin'/binary.name).chmod(0o755)
   environment=dict(os.environ,LD_LIBRARY_PATH=str(extracted/'usr/lib/x86_64-linux-gnu'))
   libraries=subprocess.check_output(['ldd',str(binary)],env=environment,text=True)
   assert 'not found' not in libraries,libraries
   for library in re.findall(r'(/[^\s()]+)',libraries):
    source=pathlib.Path(library);assert source.is_file()
    if source.name.startswith('ld-linux'):destination=private_usr/'lib64'/source.name
    else:destination=private_usr/'lib/x86_64-linux-gnu'/source.name
    destination.parent.mkdir(parents=True,exist_ok=True,mode=0o755);shutil.copyfile(source.resolve(),destination);destination.chmod(0o755)
  private_usr.chmod(0o755)
  for directory in private_usr.rglob('*'):
   if directory.is_dir():directory.chmod(0o755)
  config=stage/'redis';config.mkdir(mode=0o700)
  (config/'redis.conf').write_text('port 6379\nbind 127.0.0.1\nprotected-mode yes\nmaxmemory 64mb\nmaxmemory-policy noeviction\nsave ""\nappendonly no\n');(config/'redis.conf').chmod(0o600)
 subprocess.run(['sudo','-n','chown','-R','0:0',str(root)],check=True,capture_output=True);changedOwner=True
 # Target exists on this designated host; all bind mounts exist only in the jail.
 assert pathlib.Path('/usr/lib/tastedev-linux/scripts/admin').is_dir()
 args=['sudo','-n','/usr/bin/bwrap','--unshare-all','--die-with-parent','--new-session','--clearenv','--setenv','PATH','/usr/bin:/bin','--setenv','LANG','C.UTF-8','--setenv','LC_ALL','C.UTF-8','--ro-bind','/usr','/usr','--ro-bind',str(stage),'/usr/lib/tastedev-linux/scripts/admin','--symlink','usr/bin','/bin','--symlink','usr/lib','/lib','--symlink','usr/lib64','/lib64','--proc','/proc','--dev','/dev','--dir','/mnt','--dir','/mnt/data','--dir','/mnt/data/build','--perms','0700','--tmpfs','/mnt/data/build/tastedev-linux','--setenv','TMPDIR','/mnt/data/build/tastedev-linux','--setenv','TMP','/mnt/data/build/tastedev-linux','--setenv','TEMP','/mnt/data/build/tastedev-linux','--dir','/etc','--ro-bind','/etc/passwd','/etc/passwd','--ro-bind','/etc/group','/etc/group','--dir','/var','--dir','/var/lib','--perms','0700','--tmpfs','/var/lib/linux','--','/usr/bin/node','--input-type=module']
 if redis_parser:
  # This private /usr/bin overlay never mounts over the host's /usr/bin.
  index=args.index('--ro-bind');args[index+1]=str(stage/'redis-usr');index=len(args)-3;args[index:index]=['--bind',str(stage/'redis'),'/etc/redis']
 if host_proc:
  # A host procfs reports host PIDs. Keep the outer PID namespace consistent;
  # the actual candidate still unshares PID/network/user namespaces itself.
  index=args.index('--unshare-all');args[index:index+1]=['--unshare-user','--unshare-net','--unshare-ipc','--unshare-uts','--unshare-cgroup-try']
  index=args.index('--proc');args[index:index+2]=['--ro-bind','/proc','/proc']
 if private_proc:
  proc=root/'private-proc'
  # unshare creates a procfs for its own PID namespace, without host procfs
  # visibility or bwrap's proc child mounts that prohibit nested proc creation.
  index=args.index('--unshare-all');args[index:index+1]=[] if lifecycle else ['--unshare-user']
  index=args.index('--proc');args[index:index+2]=['--bind',str(proc),'/proc']
  if lifecycle:
   args[3:3]=['--cap-add','CAP_CHOWN','--cap-add','CAP_SETUID','--cap-add','CAP_SETGID']
  args=args[:2]+['/usr/bin/unshare','--mount','--pid','--fork','--net','--ipc','--uts','--mount-proc='+str(proc)]+args[2:]
  if lifecycle:
   mapper=r"""
import os,sys,json,pwd,ctypes,pathlib
command=json.loads(sys.argv[1]);account=pwd.getpwnam('postgres')
ready_r,ready_w=os.pipe();go_r,go_w=os.pipe()
child=os.fork()
if child==0:
 os.close(ready_r);os.close(go_w)
 libc=ctypes.CDLL(None,use_errno=True)
 if libc.unshare(0x10000000)!=0:raise OSError(ctypes.get_errno(),'private user namespace')
 os.write(ready_w,b'R');os.close(ready_w)
 if os.read(go_r,1)!=b'G':os._exit(1)
 os.close(go_r);os.execv(command[0],command)
os.close(ready_w);os.close(go_r)
try:
 if os.read(ready_r,1)!=b'R':raise RuntimeError('namespace preparation failed')
 # The root parent writes only its own child's mapping, never host settings.
 pathlib.Path('/proc/'+str(child)+'/uid_map').write_text('0 0 1\n'+str(account.pw_uid)+' '+str(account.pw_uid)+' 1\n')
 pathlib.Path('/proc/'+str(child)+'/gid_map').write_text('0 0 1\n'+str(account.pw_gid)+' '+str(account.pw_gid)+' 1\n')
 os.write(go_w,b'G')
finally:
 os.close(ready_r);os.close(go_w)
_,status=os.waitpid(child,0);sys.exit(os.waitstatus_to_exitcode(status))
"""
   args=['sudo','-n','/usr/bin/python3','-c',mapper,json.dumps(args[2:])]
 if host_systemd:args=['sudo','-n','/usr/bin/env','TASTEDEV_SYSTEMD_VERIFY_CONFIRM=linuxverify20261008','TMPDIR='+str(root/'temporary'),'TMP='+str(root/'temporary'),'TEMP='+str(root/'temporary'),'/usr/bin/node','--input-type=module','-','--execute',str(stage/'runtime')]+(['--interruption-only'] if __INTERRUPTION_ONLY__ else [])+(['--code-only'] if __CODE_ONLY__ else [])+(['--daemon-only'] if __DAEMON_ONLY__ else [])
 if direct or service_readonly:args=['sudo','-n','/usr/bin/node','--input-type=module','-',str(stage)]
 check=subprocess.run(args,input=fixture,text=True,capture_output=True,timeout=300 if host_systemd else 110)
 try:result=json.loads(check.stdout)
 except ValueError:result={'status':'FAIL','message':'호스트 격리 helper 검사 또는 결과 읽기 실패','diagnostic':check.stderr[:1500]}
 if redis_parser:result.update(testPackageVersion=version,testPackageSha256=expected,systemPackageInstalled=False)
 result.update(exitCode=check.returncode,outerNamespace=not (direct or service_readonly or host_systemd),outerProc='host-process-metadata-read-only' if (service_readonly or host_systemd) else 'dedicated-pid-procfs' if private_proc else 'host-read-only' if host_proc else 'private',network='host namespace; disposable Unix socket cluster only' if host_systemd else 'fixed local Unix socket read-only SQL' if service_readonly else 'candidate namespace unshared' if direct else 'unshared',hostConfigurationChanged=host_systemd,installedHelperReplaced=False)
 if host_systemd:result.update(hostConfigurationTemporarilyCreated=result.get('disposableClusterCreated'),existingClusterChanged=False,hostConfigurationRestored=result.get('disposableClusterRemoved',False))
finally:
 if host_systemd and ('result' not in locals() or result.get('cleanupRequired')):
  if 'result' not in locals():result={'status':'FAIL','cleanupRequired':True,'message':'검수 중단 상태를 확인하세요.'}
  result['preservedRecoveryStage']=str(root)
 elif changedOwner:subprocess.run(['sudo','-n','rm','-rf','--',str(root)],check=True,capture_output=True)
 else:shutil.rmtree(root)
result['privateStageRemoved']=not root.exists()
print(json.dumps(result))
'''.replace('__PAYLOAD__',repr(base64.b64encode(stream.getvalue()).decode())).replace('__FIXTURE__',repr(fixture)).replace('__DIRECT__',str(direct)).replace('__HOST_PROC__',str(host_proc)).replace('__PRIVATE_PROC__',str(private_proc)).replace('__LIFECYCLE__',str(lifecycle)).replace('__SERVICE_READONLY__',str(service_readonly)).replace('__REDIS_PARSER__',str(redis_parser)).replace('__HOST_SYSTEMD__',str(host_systemd)).replace('__INTERRUPTION_ONLY__',str(interruption_only)).replace('__CODE_ONLY__',str(code_only)).replace('__DAEMON_ONLY__',str(daemon_only))
ssh=['ssh','-o','BatchMode=yes','-o','ConnectTimeout=8','-o','StrictHostKeyChecking=yes','-i','/home/whitecalvin/.ssh/id_ed25519','whitecalvin@192.168.0.103','sudo -n python3 -']
check=subprocess.run(ssh,input=remote,text=True,capture_output=True,timeout=360 if host_systemd else 150)
try:result=json.loads(check.stdout)
except ValueError:result={'status':'FAIL','remoteExitCode':check.returncode,'diagnostic':check.stderr[:1500]}
result.update(remoteHost='192.168.0.103',runtimeModules=len(names),sourceHelperSha256=hashlib.sha256(files['linux-admin']).hexdigest(),runtimeManifest=manifest)
evidence=root/'.runtime/verification'/('remote-postgresql-host-jail-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ'));evidence.mkdir(parents=True)
(evidence/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
(evidence/'process.log').write_text(check.stdout+check.stderr)
print(json.dumps({k:v for k,v in dict(result,evidence=str(evidence/'result.json')).items() if k!='runtimeManifest'},ensure_ascii=False))
if result['status']=='FAIL':raise SystemExit(1)
