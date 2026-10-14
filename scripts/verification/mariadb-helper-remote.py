"""Current canonical helper/native MariaDB candidate validation on approved QA-103.
Default: native candidate review only. --lifecycle starts one dedicated transient
systemd unit on a private Unix socket, applies/restores through the current
helper, tests actual startup failure rollback, then stops/removes its own fixture.
The fixed systemctl adapter maps only mariadb.service to this dedicated unit.
"""
import base64, hashlib, io, json, pathlib, re, subprocess, tarfile, datetime, sys

interrupted_gui='--interrupted-gui' in sys.argv
failure_gui='--gui-failure' in sys.argv
selection_gui='--gui-selection' in sys.argv
gui='--gui' in sys.argv or interrupted_gui or failure_gui or selection_gui
status_only='--status' in sys.argv
lifecycle='--lifecycle' in sys.argv or gui or status_only
assert not (status_only and gui)
assert sum([interrupted_gui,failure_gui,selection_gui])<=1
assert all(arg in ['--lifecycle','--gui','--status','--interrupted-gui','--gui-failure','--gui-selection'] for arg in sys.argv[1:])
project = pathlib.Path.cwd()
gui_evidence=project/'.runtime/verification'/('mariadb-original-gui-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')) if gui else None
if gui:gui_evidence.mkdir(parents=True)
names = re.findall(r"'([^']+\.mjs)'", (project/'scripts/admin/runtime-files.mjs').read_text())
assert len(names) == len(set(names))
files = {'admin/linux-admin': (project/'scripts/admin/linux-admin').read_bytes(),
         'admin/package.json': (project/'scripts/admin/package.json').read_bytes()}
for name in names:
    assert re.fullmatch(r'[a-zA-Z0-9_.-]+\.mjs', name)
    files['admin/runtime/'+name] = (project/'lib'/name).read_bytes()
manifest = {name: hashlib.sha256(files['admin/runtime/'+name]).hexdigest() for name in names}
files['admin/runtime/manifest.json'] = json.dumps(manifest).encode()
if gui:
    for directory in ['app','components','lib','public']:
        for file in sorted((project/directory).rglob('*')):
            assert not file.is_symlink()
            if file.is_file():files['source/'+str(file.relative_to(project))]=file.read_bytes()
    for name in ['package.json','next.config.mjs','scripts/admin/linux-admin']:
        files['source/'+name]=(project/name).read_bytes()
payload = io.BytesIO()
with tarfile.open(fileobj=payload, mode='w') as archive:
    for name, raw in files.items():
        item=tarfile.TarInfo(name); item.size=len(raw); item.mode=0o644
        archive.addfile(item, io.BytesIO(raw))

runner = r'''
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mariadbTopology} from '/usr/lib/tastedev-linux/scripts/admin/runtime/mariadb-topology.mjs';
const file='/etc/mysql/conf.d/fixture.cnf', original=fs.readFileSync(file,'utf8');
const helper='/usr/lib/tastedev-linux/scripts/admin/linux-admin',checks=[];
const knownErrors=['MariaDB service process is unavailable','MariaDB process metadata changed','MariaDB process metadata exceeds limit','MariaDB service executable differs from the validation binary','MariaDB service process changed','MariaDB command failed','MariaDB service startup configuration requires review before applying this main','MariaDB service must be running before configuration changes','Configuration validation failed','관리 작업을 완료하지 못했습니다.'];
const append=checks.push.bind(checks);checks.push=(text)=>{console.log('FIXTURE_STEP '+text);return append(text);};
const digest=v=>createHash('sha256').update(v).digest('hex');
async function input(text){const graph=await mariadbTopology();assert(graph.complete);return {root:graph.root,path:file,version:graph.files.find(x=>x.path===file).version,graphVersion:graph.version,text};}
function invoke(value,action='mariadb-code-plan'){try{return {ok:true,output:JSON.parse(execFileSync('/usr/bin/node',[helper,action],{input:JSON.stringify(value),encoding:'utf8',timeout:90000,maxBuffer:2097152}))};}catch(e){let error;try{error=JSON.parse(String(e.stderr));}catch{}console.log('FIXTURE_ERROR '+JSON.stringify({action,status:error?.status,message:knownErrors.includes(error?.message)?error.message:'unclassified-fixed-helper-error'}));return {ok:false,error,exit:e.status};}}
const good=await input(original.replace('max_connections=100','max_connections=123'));
const planned=invoke(good);assert(planned.ok,'Canonical helper valid candidate rejected');
assert.equal(planned.output.validation.valid,true);assert.equal(planned.output.validation.scope,'private-options-validation');assert.equal(planned.output.operatingConfigurationChanged,false);assert.equal(planned.output.operatingServiceChanged,false);assert.equal(fs.readFileSync(file,'utf8'),original);checks.push('current canonical helper native candidate validation');
const bad=invoke(await input(original+'tastedev_invalid_fixture_option=1\n'));assert.equal(bad.ok,false);assert.equal(fs.readFileSync(file,'utf8'),original);checks.push('native unknown option rejected without replacing configuration');
const stale=await input(original);fs.writeFileSync(file,original+'long_query_time=2\n');const conflict=invoke(stale);assert.equal(conflict.ok,false);fs.writeFileSync(file,original);checks.push('stale source denied before candidate validation');
const link='/etc/mysql/conf.d/link.cnf';fs.symlinkSync(file,link);const unsafe=invoke(good);assert.equal(unsafe.ok,false);fs.unlinkSync(link);checks.push('symlink include rejected');
assert.equal(fs.readFileSync(file,'utf8'),original);assert(!fs.readdirSync(process.env.TMPDIR).some(name=>name.startsWith('tastedev-mariadb-candidate-')));checks.push('original fixture and candidate cleanup preserved');
fs.writeFileSync(process.env.RESULT_FILE,JSON.stringify({status:'PASS',checks,helperSha256:digest(fs.readFileSync(helper)),serverSha256:digest(fs.readFileSync('/usr/sbin/mariadbd')),serverVersion:execFileSync('/usr/sbin/mariadbd',['--no-defaults','--version'],{encoding:'utf8'}).trim(),validation:planned.output.validation,systemdCommandsExecuted:false,databaseStarted:false,databaseConnected:false,operatingConfigurationChanged:false},null,2));
'''

if lifecycle:
    lifecycle_runner = r"""
function sql(text){return execFileSync('/usr/bin/mariadb',['--no-defaults','--socket='+process.env.FIXTURE_SOCKET,'--protocol=socket','--user=root','--batch','--skip-column-names','--execute='+text],{encoding:'utf8',timeout:10000}).trim();}
assert.equal(sql('SELECT @@skip_networking,@@max_connections'),'1\t100');
sql("CREATE DATABASE tastedev_fixture CHARACTER SET utf8mb4; CREATE TABLE tastedev_fixture.messages(value VARCHAR(100)); INSERT INTO tastedev_fixture.messages VALUES ('한글 서비스 적용 복구');");
checks.push('actual dedicated systemd server with Unix socket only and Korean data');
const beforePid=execFileSync('/usr/bin/systemctl',['show','--property=MainPID','--value','mariadb.service'],{encoding:'utf8'}).trim();
const applied=invoke({...good,...Object.fromEntries(['graphVersion','candidateGraphVersion','reviewVersion'].map(key=>[key,planned.output[key]])),confirm:true},'mariadb-code-apply');
if(!applied.ok){
 const canonical=fs.readFileSync(helper,'utf8');
 try{
  fs.writeFileSync(helper,canonical.replace('main().catch((e) => {',`main().catch((e) => {process.stderr.write('FIXTURE_DIAGNOSTIC '+JSON.stringify({code:e.code||null,syscall:e.syscall||null,path:typeof e.path==='string'&&/^\\/(proc|etc\\/mysql|var\\/lib\\/linux)\\//.test(e.path)?e.path:null,frames:String(e.stack||'').split('\\n').slice(1,6).map(x=>x.trim().split(' ')[1])})+'\\n');`));
  try{execFileSync('/usr/bin/node',[helper,'mariadb-code-apply'],{input:JSON.stringify({...good,...Object.fromEntries(['graphVersion','candidateGraphVersion','reviewVersion'].map(key=>[key,planned.output[key]])),confirm:true}),encoding:'utf8',timeout:90000});}catch(error){for(const line of String(error.stderr).split('\n'))if(line.startsWith('FIXTURE_DIAGNOSTIC '))console.log(line);}
 }finally{fs.writeFileSync(helper,canonical);}
}
assert(applied.ok,'Canonical helper apply failed');assert.equal(applied.output.failed,undefined);assert.equal(applied.output.changed,true);assert.equal(sql('SELECT @@max_connections'),'123');
assert.notEqual(execFileSync('/usr/bin/systemctl',['show','--property=MainPID','--value','mariadb.service'],{encoding:'utf8'}).trim(),beforePid);
assert.equal(sql('SELECT value FROM tastedev_fixture.messages'),'한글 서비스 적용 복구');checks.push('canonical helper apply restarts dedicated actual systemd service and changes runtime');
const restoreInput={root:'/etc/mysql/my.cnf',id:applied.output.backupId};const rp=invoke(restoreInput,'mariadb-restore-plan');assert(rp.ok,'Backup restore plan failed');
const restored=invoke({...restoreInput,...Object.fromEntries(['version','graphVersion','backupVersion'].map(key=>[key,rp.output[key]])),confirm:true},'mariadb-restore');
assert(restored.ok,'Canonical helper restore failed');assert.equal(restored.output.failed,undefined);assert.equal(restored.output.changed,true);assert.equal(sql('SELECT @@max_connections'),'100');assert.equal(fs.readFileSync(file,'utf8'),original);assert.equal(sql('SELECT value FROM tastedev_fixture.messages'),'한글 서비스 적용 복구');checks.push('canonical helper backup restore returns original file and live setting with Korean data');
const failureText=original+'socket=/run/mysqld/missing/server.sock\n';const failureInput=await input(failureText);const fp=invoke(failureInput);assert(fp.ok,'Native failure candidate review failed');
const failed=invoke({...failureInput,...Object.fromEntries(['graphVersion','candidateGraphVersion','reviewVersion'].map(key=>[key,fp.output[key]])),confirm:true},'mariadb-code-apply');
assert(failed.ok,'Failure rollback returned unexpected protocol error');assert.equal(failed.output.failed,true);assert.equal(failed.output.restored,true);assert.equal(failed.output.recovered,true);assert.equal(sql('SELECT @@max_connections'),'100');assert.equal(fs.readFileSync(file,'utf8'),original);assert.equal(sql('SELECT value FROM tastedev_fixture.messages'),'한글 서비스 적용 복구');checks.push('actual native service start failure restores original and recovers dedicated systemd service');
"""
    if gui:
        lifecycle_runner = r'''

function sql(text){return execFileSync('/usr/bin/mariadb',['--no-defaults','--socket='+process.env.FIXTURE_SOCKET,'--protocol=socket','--user=root','--batch','--skip-column-names','--execute='+text],{encoding:'utf8',timeout:10000}).trim();}
sql("CREATE DATABASE tastedev_fixture CHARACTER SET utf8mb4; CREATE TABLE tastedev_fixture.messages(value VARCHAR(100)); INSERT INTO tastedev_fixture.messages VALUES ('한글 GUI 적용 복구');");
const {spawn}=await import('node:child_process'),{randomBytes}=await import('node:crypto'),root=process.env.FIXTURE_ROOT,source=root+'/source',port=49003;
const env={...process.env,NODE_ENV:'development',NEXT_TELEMETRY_DISABLED:'1',LINUX_STATE_ROOT:root+'/state',LINUX_AUTH_ROOT:root+'/auth',LINUX_WORKSPACE_ROOT:root+'/workspace',LINUX_PACKAGED:'true',LINUX_ENABLE_ADMIN:'true',LINUX_ENABLE_INSTALL:'false',LINUX_ENABLE_CRON:'false',LINUX_ENABLE_TERMINAL:'false',LINUX_ENABLE_AI:'false',BETTER_AUTH_URL:'http://127.0.0.1:'+port};delete env.OPENAI_API_KEY;
Object.assign(process.env,env);
const {storeCredentials}=await import(source+'/lib/auth-store.mjs'),{passwordHash}=await import(source+'/lib/auth-password.mjs'),{defaultSecurity}=await import(source+'/lib/security.mjs');
const username='maria-gui-fixture',password=randomBytes(32).toString('base64url');storeCredentials(username,await passwordHash(password));fs.writeFileSync(root+'/gui-login.json',JSON.stringify({username,password}),{mode:0o600});fs.writeFileSync(root+'/state/security.json',JSON.stringify({...defaultSecurity,readOnly:false,databaseChanges:true,sudoWithoutPrompt:true}),{mode:0o600});
const log=fs.openSync(root+'/web.log','w',0o600),web=spawn('/usr/bin/node',[source+'/node_modules/next/dist/bin/next','dev','--webpack','--hostname','127.0.0.1','--port',String(port)],{cwd:source,env,stdio:['ignore',log,log]});
const initialPid=execFileSync('/usr/bin/systemctl',['show','--property=MainPID','--value','mariadb.service'],{encoding:'utf8'}).trim();let applied=false,workflow;
try{
 const deadline=Date.now()+600000;
 for(let i=0;;i++){assert(Date.now()<deadline&&web.exitCode===null,'GUI startup failed');try{if((await fetch('http://127.0.0.1:'+port+'/login')).status===200)break;}catch{}await new Promise(resolve=>setTimeout(resolve,200));}
 fs.writeFileSync(root+'/gui-connection.json',JSON.stringify({root,port,usernameFile:root+'/gui-login.json',source:source,unit:process.env.FIXTURE_UNIT}));
 for(;;){
  assert(Date.now()<deadline&&web.exitCode===null,'GUI timed out or stopped');
  if(fs.readFileSync(file,'utf8').includes('max_connections=123')){try{if(sql('SELECT @@max_connections')==='123')applied=true;}catch{}}
  if(fs.existsSync(root+'/gui-result.json')){workflow=JSON.parse(fs.readFileSync(root+'/gui-result.json'));break;}
  await new Promise(resolve=>setTimeout(resolve,200));
 }
 assert.equal(workflow.status,'PASS');assert(applied,'GUI native apply not observed');assert.equal(fs.readFileSync(file,'utf8'),original);assert.equal(sql('SELECT @@max_connections'),'100');assert.equal(sql('SELECT value FROM tastedev_fixture.messages'),'한글 GUI 적용 복구');assert.notEqual(execFileSync('/usr/bin/systemctl',['show','--property=MainPID','--value','mariadb.service'],{encoding:'utf8'}).trim(),initialPid);
 checks.push('original GUI authenticated API current helper applies and restores actual dedicated systemd service');
 fs.writeFileSync(root+'/gui-native-proof.json',JSON.stringify({gui:workflow,appliedRuntime123Observed:applied,restoredRuntime:100,originalFileRestored:true,koreanDataPreserved:true}));
}finally{web.kill('SIGTERM');await new Promise(resolve=>{const timer=setTimeout(()=>{web.kill('SIGKILL');resolve();},10000);web.once('close',()=>{clearTimeout(timer);resolve();});});fs.closeSync(log);}

'''
    if status_only:
        lifecycle_runner = r"""
const statusText=execFileSync('/usr/bin/systemctl',['show','mariadb.service','--property=ActiveState,SubState,LoadState,UnitFileState,Description','--no-pager'],{encoding:'utf8',timeout:5000});
const serviceValues=Object.fromEntries(statusText.trim().split('\n').map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1)];}));
assert.equal(serviceValues.ActiveState,'active');assert.equal(serviceValues.SubState,'running');assert.equal(serviceValues.LoadState,'loaded');
const servicePid=execFileSync('/usr/bin/systemctl',['show','--property=MainPID','--value','mariadb.service'],{encoding:'utf8'}).trim();assert(Number(servicePid)>0);assert.equal(fs.realpathSync('/proc/'+servicePid+'/exe'),'/usr/sbin/mariadbd');
checks.push('actual IDE systemctl status argument order reports active dedicated MariaDB service');
"""
    runner=runner.replace("fs.writeFileSync(process.env.RESULT_FILE",lifecycle_runner+"\nfs.writeFileSync(process.env.RESULT_FILE")
    runner=runner.replace('systemdCommandsExecuted:false,databaseStarted:false,databaseConnected:false','systemdCommandsExecuted:true,databaseStarted:true,databaseConnected:true,dedicatedServiceOnly:true,systemctlUnitAdapter:true')

if gui:
    start=runner.index('const good=await input')
    end=runner.index('function sql(text)',start)
    runner=runner[:start]+runner[end:]
    runner=runner.replace('validation:planned.output.validation',"validation:{valid:true,scope:'gui-native-candidate-review'}")
if failure_gui:
    runner=runner.replace("assert(applied,'GUI native apply not observed');","assert.equal(workflow.nativeStartupFailureObserved,true);assert.equal(workflow.guiRollbackMessageObserved,true);")
    runner=runner.replace('appliedRuntime123Observed:applied','appliedRuntime123Observed:false,guiStartupFailureRecovered:true')
    runner=runner.replace('original GUI authenticated API current helper applies and restores actual dedicated systemd service','original GUI native startup failure restores original configuration and recovers dedicated systemd service')
if selection_gui:
    runner=runner.replace("assert(applied,'GUI native apply not observed');","assert.equal(workflow.selectedTargetAutomatic,true);assert.equal(workflow.fileSwitchContextVerified,true);")
    runner=runner.replace('assert.notEqual(execFileSync', 'assert.equal(execFileSync')
    runner=runner.replace('appliedRuntime123Observed:applied','appliedRuntime123Observed:false,guiSelectionContextVerified:true')
    runner=runner.replace('original GUI authenticated API current helper applies and restores actual dedicated systemd service','original GUI selected-file recovery context follows file changes without modifying database configuration or service PID')
if interrupted_gui:
    runner=runner.replace('port=49003','port=49006').replace('unit:process.env.FIXTURE_UNIT}', 'unit:process.env.FIXTURE_UNIT,namespacePid:process.pid,interrupted:true}')
    runner=runner.replace("assert(applied,'GUI native apply not observed');","assert.equal(workflow.interruptedHelperKilled,true);assert.equal(workflow.configReplacementObserved,true);")
    runner=runner.replace('validation:planned.output.validation',"validation:{valid:true,scope:'gui-native-candidate-review'}")
    runner=runner.replace('appliedRuntime123Observed:applied','appliedRuntime123Observed:false,interruptedGuiRecovered:true')
    runner=runner.replace('original GUI authenticated API current helper applies and restores actual dedicated systemd service','original GUI current helper interruption and same-popup recovery of dedicated systemd service')

parameters={'archive':base64.b64encode(payload.getvalue()).decode(),
            'hashes':{n:hashlib.sha256(v).hexdigest() for n,v in files.items()}, 'runner':runner,'lifecycle':lifecycle,'gui':gui,'interrupted':interrupted_gui}
remote = r'''
import base64,hashlib,io,json,os,pathlib,shutil,signal,subprocess,tarfile,tempfile,pwd,time
p=__PARAMETERS__;assert os.getuid()==0
def snapshot():
 r={}
 for path in pathlib.Path('/etc/mysql').rglob('*.cnf'):
  if path.is_file():r[str(path)]=hashlib.sha256(path.read_bytes()).hexdigest()
 for name in ['linux-admin','linex-admin']:
  path=pathlib.Path('/usr/lib/tastedev-linux/scripts/admin')/name
  r['installed-helper-'+name]=hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None
 return r
before=snapshot()
base=pathlib.Path('/mnt/data/build/tastedev-linux/mariadb')
base.mkdir(parents=True,mode=0o700,exist_ok=True)
assert base.is_dir() and not base.is_symlink() and base.stat().st_uid==0 and not base.stat().st_mode&0o077
root=pathlib.Path(tempfile.mkdtemp(prefix='tastedev-maria-helper-',dir=base));root.chmod(0o700)
(root/'temporary').mkdir(mode=0o700)
os.environ.update(TMPDIR=str(root/'temporary'),TMP=str(root/'temporary'),TEMP=str(root/'temporary'))
record={'status':'FAIL','hostConfigurationChanged':False};process=None;preserved=False;unit=None;unitCreated=False
try:
 with tarfile.open(fileobj=io.BytesIO(base64.b64decode(p['archive']))) as archive:
  for item in archive.getmembers():
   assert item.isfile() and item.name in p['hashes'] and '..' not in pathlib.PurePosixPath(item.name).parts
   raw=archive.extractfile(item).read();assert hashlib.sha256(raw).hexdigest()==p['hashes'][item.name]
   target=root/item.name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(raw);target.chmod(0o644)
 if p['gui']:
  (root/'source/node_modules').symlink_to('/usr/lib/tastedev-linux/node_modules',target_is_directory=True)
  (root/'admin-helper.sha256').write_text(hashlib.sha256((root/'admin/linux-admin').read_bytes()).hexdigest()+'\n');(root/'admin-helper.sha256').chmod(0o644)
  (root/'dpkg').mkdir(mode=0o755);shutil.copyfile('/var/lib/dpkg/status',root/'dpkg/status');(root/'dpkg/status').chmod(0o644)
  for name in ['auth','workspace']:(root/name).mkdir(mode=0o700)
 (root/'admin/linux-admin').chmod(0o755)
 for directory in [root/'admin',root/'admin/runtime']:directory.chmod(0o755)
 (root/'mysql/conf.d').mkdir(parents=True,mode=0o755);(root/'mysql').chmod(0o755)
 (root/'mysql/my.cnf').write_text('!includedir /etc/mysql/conf.d\n')
 (root/'mysql/conf.d/fixture.cnf').write_text('[mariadbd]\nport=3306\nmax_connections=100\ninnodb_buffer_pool_size=32M\n')
 (root/'state').mkdir(mode=0o700);(root/'runner.mjs').write_text(p['runner'])
 if p['lifecycle']:
  mysql=pwd.getpwnam('mysql')
  for name in ['data','run']:
   folder=root/name;folder.mkdir(mode=0o700);os.chown(folder,mysql.pw_uid,mysql.pw_gid)
  (root/'data/temporary').mkdir(mode=0o700);os.chown(root/'data/temporary',mysql.pw_uid,mysql.pw_gid)
  main='[mariadbd]\ndatadir=/var/lib/mysql\ntmpdir=/var/lib/mysql/temporary\nsocket=/run/mysqld/server.sock\npid-file=/run/mysqld/server.pid\nlog-error=/run/mysqld/server.log\nskip-networking\ninnodb_buffer_pool_size=32M\n!includedir /etc/mysql/conf.d\n'
  (root/'mysql/my.cnf').write_text(main)
  unit='tastedev-maria-'+root.name.removeprefix('tastedev-maria-helper-')+'.service'
  status=subprocess.run(['/usr/bin/systemctl','show','--property=LoadState','--value',unit],capture_output=True,text=True,check=True)
  assert status.stdout.strip()=='not-found'
  server="import os,subprocess,sys\nsubprocess.run(['/usr/bin/mount','--make-rprivate','/'],check=True)\n"
  server+="subprocess.run(['/usr/bin/mount','--bind',%r,'/etc/mysql'],check=True)\n"%str(root/'mysql')
  server+="subprocess.run(['/usr/bin/mount','-t','tmpfs','-o','mode=755','tmpfs','/var/lib'],check=True)\nos.mkdir('/var/lib/mysql',0o755)\n"
  server+="subprocess.run(['/usr/bin/mount','--bind',%r,'/var/lib/mysql'],check=True)\n"%str(root/'data')
  (root/'host-systemd-run').mkdir(mode=0o700)
  server+="subprocess.run(['/usr/bin/mount','--bind','/run/systemd',%r],check=True)\n"%str(root/'host-systemd-run')
  server+="subprocess.run(['/usr/bin/mount','-t','tmpfs','-o','mode=755','tmpfs','/run'],check=True)\nos.mkdir('/run/mysqld',0o755)\nos.mkdir('/run/systemd',0o755)\n"
  server+="subprocess.run(['/usr/bin/mount','--bind',%r,'/run/systemd'],check=True)\nsubprocess.run(['/usr/bin/mount','-o','remount,bind,ro','/run/systemd'],check=True)\n"%str(root/'host-systemd-run')
  server+="subprocess.run(['/usr/bin/mount','--bind',%r,'/run/mysqld'],check=True)\n"%str(root/'run')
  server+="os.environ.update(TMPDIR='/var/lib/mysql/temporary',TMP='/var/lib/mysql/temporary',TEMP='/var/lib/mysql/temporary')\nif '--init' in sys.argv:\n subprocess.run(['/usr/bin/mariadb-install-db','--no-defaults','--user=mysql','--datadir=/var/lib/mysql','--tmpdir=/var/lib/mysql/temporary','--skip-test-db'],check=True,capture_output=True)\nelse:\n os.execv('/usr/sbin/mariadbd',['/usr/sbin/mariadbd','--defaults-file=/etc/mysql/my.cnf','--user=mysql'])\n"
  (root/'server.py').write_text(server)
  subprocess.run(['/usr/bin/unshare','--mount','--','/usr/bin/python3',str(root/'server.py'),'--init'],check=True,capture_output=True,timeout=60)
  unitCreated=True
  subprocess.run(['/usr/bin/systemd-run','--quiet','--unit='+unit,'--property=Type=notify','--property=NotifyAccess=main','--property=TimeoutStartSec=30','--property=Restart=no','--property=TimeoutStopSec=15','/usr/bin/unshare','--mount','--','/usr/bin/python3',str(root/'server.py')],check=True,capture_output=True,timeout=30)
  for i in range(100):
   ready=subprocess.run(['/usr/bin/mariadb','--no-defaults','--socket='+str(root/'run/server.sock'),'--protocol=socket','--user=root','--batch','--skip-column-names','--execute=SELECT 1'],capture_output=True,text=True,timeout=3)
   if ready.returncode==0 and ready.stdout.strip()=='1':break
   time.sleep(.1)
  else:raise RuntimeError('Dedicated MariaDB server readiness failed')
  shutil.copyfile('/usr/bin/systemctl',root/'systemctl-native');(root/'systemctl-native').chmod(0o755)
  adapter="#!/usr/bin/python3\nimport os,sys\na=sys.argv[1:]\nassert a.count('mariadb.service')==1\nassert any(x in a for x in ['show','is-active','restart'])\nassert all(not x.endswith(('.service','.timer','.socket','.target')) or x=='mariadb.service' for x in a)\na[a.index('mariadb.service')]=%r\nos.execv(%r,[%r]+a)\n"%(unit,str(root/'systemctl-native'),str(root/'systemctl-native'))
  if p['interrupted']:
   barrier="if 'restart' in a and 'max_connections=123' in open('/etc/mysql/conf.d/fixture.cnf').read():\n open(%r,'w').write('paused')\n while not os.path.exists(%r):time.sleep(.1)\n sys.exit(91)\n"%(str(root/'restart-paused'),str(root/'restart-release'))
   adapter=adapter.replace('import os,sys','import os,sys,time').replace('os.execv(',barrier+'os.execv(')
  (root/'systemctl-adapter').write_text(adapter);(root/'systemctl-adapter').chmod(0o755)

 code="import os,subprocess\nassert os.readlink('/proc/self/ns/mnt')!=os.readlink('/proc/1/ns/mnt')\nsubprocess.run(['/usr/bin/mount','--make-rprivate','/'],check=True)\n"
 for source,target in [(root/'admin','/usr/lib/tastedev-linux/scripts/admin'),(root/'mysql','/etc/mysql')]:
  code+="subprocess.run(['/usr/bin/mount','--bind',%r,%r],check=True)\n"%(str(source),target)
 code+="subprocess.run(['/usr/bin/mount','-t','tmpfs','-o','mode=755','tmpfs','/var/lib'],check=True)\nos.mkdir('/var/lib/linux',0o700)\n"
 code+="subprocess.run(['/usr/bin/mount','--bind',%r,'/var/lib/linux'],check=True)\n"%str(root/'state')
 code+="os.environ['RESULT_FILE']=%r\nos.execv('/usr/bin/node',['/usr/bin/node',%r])\n"%(str(root/'result.json'),str(root/'runner.mjs'))
 if p['lifecycle']:
  code=code.replace("os.execv('/usr/bin/node'","subprocess.run(['/usr/bin/mount','--bind',%r,'/usr/bin/systemctl'],check=True)\nos.environ['FIXTURE_SOCKET']=%r\nos.execv('/usr/bin/node'"%(str(root/'systemctl-adapter'),str(root/'run/server.sock')))
 if p['gui']:
  code=code.replace("os.execv('/usr/bin/node'","os.mkdir('/var/lib/dpkg',0o755)\nsubprocess.run(['/usr/bin/mount','--bind',%r,'/var/lib/dpkg'],check=True)\nsubprocess.run(['/usr/bin/mount','-o','remount,bind,ro','/var/lib/dpkg'],check=True)\nsubprocess.run(['/usr/bin/mount','--bind',%r,'/usr/lib/tastedev-linux/admin-helper.sha256'],check=True)\nos.execv('/usr/bin/node'"%(str(root/'dpkg'),str(root/'admin-helper.sha256')))
  code=code.replace("os.execv('/usr/bin/node'","os.environ['FIXTURE_ROOT']=%r\nos.environ['FIXTURE_UNIT']=%r\nos.execv('/usr/bin/node'"%(str(root),unit))
 (root/'launcher.py').write_text(code)
 process=subprocess.Popen(['/usr/bin/unshare','--mount','--','/usr/bin/python3',str(root/'launcher.py')],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,start_new_session=True)
 if p['gui']:
  deadline=time.time()+750;announced=False
  while process.poll() is None:
   assert time.time()<deadline,'GUI control deadline exceeded'
   connection=root/'gui-connection.json'
   if connection.exists() and not announced:
    print(json.dumps({'status':'GUI_READY',**json.loads(connection.read_text())}),flush=True);announced=True
   time.sleep(.2)
  out,err=process.communicate(timeout=10)
 else:out,err=process.communicate(timeout=180)
 if (root/'result.json').exists():
  record=json.loads((root/'result.json').read_text());assert process.returncode==0
 else:record.update(exitCode=process.returncode,diagnosticSha256=hashlib.sha256(err.encode()).hexdigest(),reason='canonical-native-verification-failed',completedChecks=[x.removeprefix('FIXTURE_STEP ') for x in out.splitlines() if x.startswith('FIXTURE_STEP ')],diagnostics=[json.loads(x.removeprefix('FIXTURE_DIAGNOSTIC ')) for x in out.splitlines() if x.startswith('FIXTURE_DIAGNOSTIC ')],helperErrors=[json.loads(x.removeprefix('FIXTURE_ERROR ')) for x in out.splitlines() if x.startswith('FIXTURE_ERROR ')],assertions=[x[:300] for x in err.splitlines() if x.startswith('AssertionError')])
 assert snapshot()==before,'Host configuration or installed helper changed'
 record['hostSnapshotsPreserved']=True;preserved=True
 if p['gui'] and (root/'gui-native-proof.json').exists():record['guiNativeProof']=json.loads((root/'gui-native-proof.json').read_text())
except Exception as error:
 record.update(reason='verification-control-error',errorClass=type(error).__name__)
 if isinstance(error,subprocess.CalledProcessError):record.update(controlCommand=error.cmd,controlExit=error.returncode,controlDiagnostic=(error.stderr or b'').decode('utf8',errors='replace')[-2000:] if isinstance(error.stderr,bytes) else (error.stderr or '')[-2000:])
 preserved=snapshot()==before;record['hostSnapshotsPreserved']=preserved
finally:
 if process is not None:
  try:os.killpg(process.pid,signal.SIGTERM)
  except ProcessLookupError:pass
  if process.poll() is None:process.wait(timeout=10)
 if unitCreated:
  subprocess.run(['/usr/bin/systemctl','--no-ask-password','stop',unit],check=True,capture_output=True,timeout=30)
  inactive=subprocess.run(['/usr/bin/systemctl','is-active',unit],capture_output=True,text=True)
  assert inactive.stdout.strip() in ['inactive','failed','unknown']
  record.update(dedicatedUnit=unit,dedicatedUnitStopped=True)
 if preserved:
  shutil.rmtree(root);record['privateStageRemoved']=not root.exists()
 else:record.update(privateStageRemoved=False,preservedEvidenceStage=str(root))
print(json.dumps(record))
'''.replace('__PARAMETERS__',repr(parameters))
command=['ssh','-F','/dev/null','-o','BatchMode=yes','-o','ConnectTimeout=8','-o','StrictHostKeyChecking=yes','-i','/home/whitecalvin/.ssh/id_ed25519','whitecalvin@192.168.0.103','sudo -n /usr/bin/python3 -']
if gui:
    transport=subprocess.Popen(command,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    transport.stdin.write(remote);transport.stdin.close();output=[]
    for line in transport.stdout:
        data=json.loads(line)
        if data.get('status')=='GUI_READY':
            connection=gui_evidence/'connection.json';connection.write_text(json.dumps(data));print(line.strip(),flush=True)
        else:output.append(line)
    diagnostic=transport.stderr.read();transport.wait(timeout=20)
    check=subprocess.CompletedProcess(command,transport.returncode,''.join(output),diagnostic)
else:
    check=subprocess.run(command,input=remote,text=True,capture_output=True,timeout=210)
if check.returncode:
    safe=[line for line in check.stderr.splitlines() if line.startswith(('AssertionError:','FileNotFoundError:','PermissionError:','RuntimeError:','SyntaxError:'))]
    print(json.dumps({'status':'FAIL','transportExit':check.returncode,'diagnostic':safe[-1:]},ensure_ascii=False))
    raise SystemExit(1)
record=json.loads(check.stdout);record['sourceManifest']=parameters['hashes']
evidence=gui_evidence or project/'.runtime/verification'/('mariadb-helper-remote-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
evidence.mkdir(parents=True,exist_ok=gui);(evidence/'result.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({key:record.get(key) for key in ['status','checks','reason','completedChecks','helperErrors','diagnostics','assertions','dedicatedUnitStopped','serverVersion','hostSnapshotsPreserved','privateStageRemoved']}|{'evidence':str(evidence/'result.json')}))
if record['status']!='PASS':raise SystemExit(1)
