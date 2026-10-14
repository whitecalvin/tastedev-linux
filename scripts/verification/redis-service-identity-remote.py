"""QA-103 real Redis title/systemd identity in private mount namespaces."""
import pathlib,json,base64,subprocess,datetime,hashlib,sys,re
project=pathlib.Path.cwd()
interrupted_gui='--interrupted-gui' in sys.argv
failure_gui='--gui-failure' in sys.argv
gui_mode='--gui' in sys.argv or interrupted_gui or failure_gui
apply_mode='--apply' in sys.argv or gui_mode
assert all(arg in ['--apply','--gui','--interrupted-gui','--gui-failure'] for arg in sys.argv[1:])
gui_folder=project/'.runtime/verification'/('redis-original-gui-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')) if gui_mode else None
if gui_folder:gui_folder.mkdir(parents=True)
files={name:(project/'lib'/name).read_text() for name in ['redis-service-inspect.mjs','redis-service-scope.mjs','admin-native-exec.mjs']}
if apply_mode:
 names=re.findall(r"'([^']+\.mjs)'",(project/'scripts/admin/runtime-files.mjs').read_text())
 for name in names:files['admin/runtime/'+name]=(project/'lib'/name).read_text()
 files['admin/runtime/manifest.json']=json.dumps({name:hashlib.sha256(files['admin/runtime/'+name].encode()).hexdigest() for name in names})
 for name in ['linux-admin','package.json']:files['admin/'+name]=(project/'scripts/admin'/name).read_text()
if gui_mode:
 for directory in ['app','components','lib','public']:
  for file in sorted((project/directory).rglob('*')):
   assert not file.is_symlink()
   if file.is_file():files['source/'+str(file.relative_to(project))]=file.read_text()
 for name in ['package.json','next.config.mjs','scripts/admin/linux-admin']:files['source/'+name]=(project/name).read_text()
remote=r"""
import os,pathlib,tempfile,subprocess,shutil,json,hashlib,re,time,signal
files=__FILES__;apply_mode=__APPLY__;gui_mode=__GUI__;interrupted_gui=__INTERRUPTED__;assert os.getuid()==0
base=pathlib.Path('/mnt/data/build/redis');base.mkdir(mode=0o700,exist_ok=True)
assert base.is_dir() and not base.is_symlink() and base.stat().st_uid==0 and not base.stat().st_mode&0o077
root=pathlib.Path(tempfile.mkdtemp(prefix='tastedev-redis-identity-',dir=base));root.chmod(0o700)
(root/'temporary').mkdir(mode=0o700)
os.environ.update(TMPDIR=str(root/'temporary'),TMP=str(root/'temporary'),TEMP=str(root/'temporary'))
unit='tastedev-redis-identity-'+root.name.split('-')[-1]+'.service';created=False;phase='prepare';result={'status':'FAIL'}
process=None
originalBinary=pathlib.Path('/usr/bin/redis-server').exists()
originalHelpers={name:hashlib.sha256(p.read_bytes()).hexdigest() if p.is_file() else None for name in ['linux-admin','linex-admin'] for p in [pathlib.Path('/usr/lib/tastedev-linux/scripts/admin')/name]}
def metadata(package):
 text=subprocess.check_output(['apt-cache','show',package],text=True).split('\n\n')[0]
 return dict(line.split(': ',1) for line in text.splitlines() if ': ' in line and not line.startswith(' '))
try:
 extracted=root/'packages';packages=[]
 phase='download'
 for package in ['redis-tools','liblzf1','libjemalloc2']:
  info=metadata(package);previous=set(root.glob('*.deb'))
  subprocess.run(['apt-get','download',package+'='+info['Version']],cwd=root,check=True,capture_output=True,timeout=90)
  downloaded=list(set(root.glob('*.deb'))-previous);assert len(downloaded)==1
  digest=hashlib.sha256(downloaded[0].read_bytes()).hexdigest();assert digest==info['SHA256']
  subprocess.run(['dpkg-deb','-x',str(downloaded[0]),str(extracted)],check=True,capture_output=True)
  packages.append({'name':package,'version':info['Version'],'sha256':digest})
 phase='libraries'
 usr=root/'usr';(usr/'bin').mkdir(parents=True);(usr/'lib64').mkdir();(usr/'package.json').write_text('{"type":"commonjs"}')
 environment=dict(os.environ,LD_LIBRARY_PATH=str(extracted/'usr/lib/x86_64-linux-gnu'))
 for name,source in [('redis-server',extracted/'usr/bin/redis-check-rdb'),('redis-cli',extracted/'usr/bin/redis-cli')]+[(name,pathlib.Path('/usr/bin/'+name).resolve()) for name in ['node','systemctl','busctl']+(['bwrap','prlimit','true','sh','flock','mount'] if apply_mode else [])]:
  target=usr/'bin'/name;shutil.copyfile(source,target);target.chmod(0o755)
  libraries=subprocess.check_output(['ldd',str(source)],env=environment,text=True);assert 'not found' not in libraries
  for library in re.findall(r'(/[^\s()]+)',libraries):
   source=pathlib.Path(library);assert source.is_file()
   target=usr/('lib64' if source.name.startswith('ld-linux') else 'lib/x86_64-linux-gnu')/source.name
   target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source.resolve(),target);target.chmod(0o755)
 for directory in [usr,*[p for p in usr.rglob('*') if p.is_dir()]]:directory.chmod(0o755)
 config=root/'config';config.mkdir(mode=0o755);data=root/'data';data.mkdir(mode=0o700)
 (config/'redis.conf').write_text('port 0\nunixsocket /var/lib/redis/server.sock\nunixsocketperm 700\ndir /var/lib/redis\nsave ""\nappendonly no\ndaemonize no\nlogfile ""\nset-proc-title yes\nmaxclients 100\n')
 if apply_mode:(config/'redis.conf').write_text((config/'redis.conf').read_text().replace('appendonly no','appendonly yes'))
 for name,value in files.items():
  target=root/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(value)
 if apply_mode:
  helperHome=usr/'lib/tastedev-linux/scripts/admin';shutil.copytree(root/'admin',helperHome);(helperHome/'linux-admin').chmod(0o755)
  for directory in [usr,*[p for p in usr.rglob('*') if p.is_dir()]]:directory.chmod(0o755)
 (root/'package.json').write_text('{"type":"module"}')
 properties=['--property=ExecSearchPath=/usr/bin','--property=Type=notify','--property=NotifyAccess=main','--property=TimeoutStartSec=20','--property=Restart=no','--property=TimeoutStopSec=10','--property=TemporaryFileSystem=/etc /var/lib','--property=BindReadOnlyPaths='+str(usr)+':/usr '+str(config)+':/etc/redis','--property=BindPaths='+str(data)+':/var/lib/redis']
 phase='start-service'
 created=True;subprocess.run(['/usr/bin/systemd-run','--quiet','--unit='+unit,*properties,'/usr/bin/redis-server','/etc/redis/redis.conf','--supervised','systemd','--daemonize','no'],check=True,capture_output=True,timeout=20)
 phase='socket-ready'
 cli=usr/'bin/redis-cli';env=dict(os.environ,LD_LIBRARY_PATH=str(usr/'lib/x86_64-linux-gnu'))
 for attempt in range(100):
  ping=subprocess.run([str(cli),'-s',str(data/'server.sock'),'PING'],env=env,capture_output=True,text=True)
  if ping.returncode==0 and ping.stdout.strip()=='PONG':break
  time.sleep(.1)
 else:raise RuntimeError('private redis not ready')
 # Fixed read-only adapters map only the logical Redis unit/object. All data
 # comes from the real systemd manager; execution history is never rewritten.
 phase='identity'
 native=root/'native';native.mkdir()
 for name in ['systemctl','busctl']:shutil.copyfile(usr/'bin'/name,native/name);(native/name).chmod(0o755)
 objectPath='/org/freedesktop/systemd1/unit/'+unit.replace('-','_2d').replace('.','_2e')
 for name in ['systemctl','busctl']:
  adapter="#!/usr/bin/node\nconst {execFileSync}=require('node:child_process');let a=process.argv.slice(2);"
  if name=='systemctl':adapter+="if(a.filter(x=>x==='redis-server.service').length!==1||!a.some(x=>['show','restart'].includes(x)))process.exit(90);a=a.map(x=>x==='redis-server.service'?"+json.dumps(unit)+":x);"
  else:adapter+="if(a.join('|')!=='--json=short|get-property|org.freedesktop.systemd1|/org/freedesktop/systemd1/unit/redis_2dserver_2eservice|org.freedesktop.systemd1.Service|ExecStart')process.exit(90);a[3]="+json.dumps(objectPath)+";"
  adapter+="try{process.stdout.write(execFileSync("+json.dumps(str(native/name))+",a,{encoding:'utf8'}));}catch{process.exit(91);}\n"
  if interrupted_gui and name=='systemctl':
   barrier="if(a.includes('restart')&&require('node:fs').readFileSync('/etc/redis/redis.conf','utf8').includes('maxclients 123')){require('node:fs').writeFileSync("+json.dumps(str(root/'restart-paused'))+",'paused');const wait=new Int32Array(new SharedArrayBuffer(4));while(!require('node:fs').existsSync("+json.dumps(str(root/'restart-release'))+"))Atomics.wait(wait,0,0,100);process.exit(91);}"
   adapter=adapter.replace("try{process.stdout.write",barrier+"try{process.stdout.write")
  (usr/'bin'/name).write_text(adapter);(usr/'bin'/name).chmod(0o755)
 runner="import {inspectRedisService} from './redis-service-inspect.mjs';import fs from 'node:fs';const result=await inspectRedisService();if(result.mode!=='systemd-started-main'||result.startupMainVerified!==true)throw Error('startup proof unavailable');fs.writeFileSync("+json.dumps(str(root/'proof.json'))+",JSON.stringify(result));"
 if apply_mode:
  runner=r'''import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {inspectRedisService} from './redis-service-inspect.mjs';import {redisTopology} from '/usr/lib/tastedev-linux/scripts/admin/runtime/redis-topology.mjs';
const proof={status:'FAIL',checks:[]},file='/etc/redis/redis.conf',original=fs.readFileSync(file,'utf8'),helper='/usr/lib/tastedev-linux/scripts/admin/linux-admin';
function invoke(action,input){try{return JSON.parse(execFileSync('/usr/bin/node',[helper,action],{input:JSON.stringify(input),encoding:'utf8',timeout:90000,maxBuffer:2097152}));}catch(error){let envelope;try{envelope=JSON.parse(String(error.stderr));}catch{}proof.helperError={action,status:envelope?.status,message:envelope?.message||'unclassified-helper-failure'};throw Error('helper failed');}}
const cli=(...args)=>execFileSync('/usr/bin/redis-cli',['-s',process.env.FIXTURE_SOCKET,'--raw',...args],{encoding:'utf8',timeout:10000}).trim();
try{
const identity=await inspectRedisService();assert.equal(identity.mode,'systemd-started-main');proof.checks.push('actual stable Redis systemd startup identity');
assert.equal(cli('CONFIG','GET','maxclients'),'maxclients\n100');cli('SET','tastedev:fixture','한글 Redis 적용 복구');
const graph=await redisTopology(),input={path:file,version:graph.files.find(x=>x.path===file).version,graphVersion:graph.version,text:original.replace('maxclients 100','maxclients 123')};
const plan=invoke('redis-code-plan',input);assert.equal(plan.validation.valid,true);proof.checks.push('current canonical helper isolated native candidate review');
const applied=invoke('redis-code-apply',{...input,graphVersion:plan.graphVersion,candidateGraphVersion:plan.candidateGraphVersion,reviewVersion:plan.reviewVersion,confirm:true});assert.equal(applied.changed,true);assert.equal(applied.failed,undefined);assert.equal(cli('CONFIG','GET','maxclients'),'maxclients\n123');assert.equal(cli('GET','tastedev:fixture'),'한글 Redis 적용 복구');proof.checks.push('actual helper systemd restart applies maxclients 123 and preserves AOF Korean data');
proof.backupId=applied.backupId;const restore=invoke('redis-restore-plan',{id:applied.backupId});
const restored=invoke('redis-config-restore',{id:applied.backupId,...Object.fromEntries(['version','graphVersion','restoreGraphVersion','backupVersion'].map(key=>[key,restore[key]])),confirm:true});assert.equal(restored.changed,true);assert.equal(restored.failed,undefined);assert.equal(cli('CONFIG','GET','maxclients'),'maxclients\n100');assert.equal(fs.readFileSync(file,'utf8'),original);assert.equal(cli('GET','tastedev:fixture'),'한글 Redis 적용 복구');proof.checks.push('actual helper backup restoration returns original file and runtime 100');
const failureGraph=await redisTopology(),failureInput={path:file,version:failureGraph.files.find(x=>x.path===file).version,graphVersion:failureGraph.version,text:original.replace('unixsocket /var/lib/redis/server.sock','unixsocket /var/lib/redis/missing/server.sock')};
const failurePlan=invoke('redis-code-plan',failureInput);assert.equal(failurePlan.validation.valid,true);
const rolledBack=invoke('redis-code-apply',{...failureInput,graphVersion:failurePlan.graphVersion,candidateGraphVersion:failurePlan.candidateGraphVersion,reviewVersion:failurePlan.reviewVersion,confirm:true});
assert.equal(rolledBack.failed,true);assert.equal(rolledBack.restored,true);assert.equal(rolledBack.recovered,true);assert.equal(rolledBack.journalCleanupVerified,true);assert.equal(invoke('redis-recovery-plan',{}).recoveryRequired,false);assert.equal(fs.readFileSync(file,'utf8'),original);assert.equal(cli('CONFIG','GET','maxclients'),'maxclients\n100');assert.equal(cli('GET','tastedev:fixture'),'한글 Redis 적용 복구');await inspectRedisService();
proof.failureRecovery={failed:true,restored:true,recovered:true,recoveryRequired:false};proof.checks.push('actual Redis startup failure restores original and recovers systemd service with AOF data');proof.status='PASS';
}catch(error){proof.errorClass=error.name;proof.errorMessage=error.message;
if(!proof.checks.length){try{proof.managerDiagnostic=execFileSync('/usr/bin/systemctl',['show','redis-server.service','--property=LoadState,ActiveState,MainPID','--no-pager'],{encoding:'utf8'});const bus=JSON.parse(execFileSync('/usr/bin/busctl',['--json=short','get-property','org.freedesktop.systemd1','/org/freedesktop/systemd1/unit/redis_2dserver_2eservice','org.freedesktop.systemd1.Service','ExecStart'],{encoding:'utf8'}));proof.execDiagnostic=bus.data.map(row=>({started:row[3]>0&&row[4]>0,notExited:row[5]===0&&row[6]===0,pid:row[7],code:row[8],status:row[9],binaryExpected:row[0]==='/usr/bin/redis-server',mainExpected:row[1][1]==='/etc/redis/redis.conf'}));}catch{}}
if(proof.helperError?.action==='redis-code-plan'){
 const {redisCandidate}=await import('/usr/lib/tastedev-linux/scripts/admin/runtime/redis-candidate.mjs'),{validateRedisSandboxCandidate}=await import('/usr/lib/tastedev-linux/scripts/admin/runtime/redis-sandbox-validation.mjs'),{spawn}=await import('node:child_process');let candidate;
 try{const graph=await redisTopology();candidate=await redisCandidate({version:graph.version,changes:{},restoreText:original.replace('maxclients 100','maxclients 123')});
 await validateRedisSandboxCandidate(candidate,{launch:(binary,args,options)=>{const child=spawn(binary,args,{...options,stdio:['ignore','ignore','pipe']});let diagnostic='';child.stderr.on('data',chunk=>{diagnostic=(diagnostic+chunk).slice(0,1500);});child.once('exit',()=>{proof.fixtureNativeDiagnostic=diagnostic;const location=args[args.indexOf('--chdir')+1]+'/redis.log';try{proof.fixtureRedisDiagnostic=fs.readFileSync(location,'utf8').slice(-1500);}catch{}});return child;}});
 proof.diagnosticValidationPassed=true;
 }catch(diagnostic){proof.diagnosticError={status:diagnostic.status,code:diagnostic.code,message:diagnostic.message};}finally{await candidate?.cleanup();}
}
}finally{fs.writeFileSync(process.env.FIXTURE_PROOF,JSON.stringify(proof));}if(proof.status!=='PASS')process.exitCode=1;
'''
  # Preserve the JS newline escapes inside the Python transport literal.
 if gui_mode:
  (root/'source/node_modules').symlink_to('/usr/lib/tastedev-linux/node_modules',target_is_directory=True)
  (usr/'lib/tastedev-linux/admin-helper.sha256').write_text(hashlib.sha256((usr/'lib/tastedev-linux/scripts/admin/linux-admin').read_bytes()).hexdigest()+'\n')
  for name in ['auth','workspace','dpkg','etc-upper','etc-work','etc-merged','usr-merged']:(root/name).mkdir(mode=0o700)
  status=pathlib.Path('/var/lib/dpkg/status').read_text();status+='\nPackage: redis-server\nStatus: install ok installed\nArchitecture: amd64\nVersion: 5:7.0.15-1ubuntu0.24.04.5\nDescription: dedicated Redis GUI verification fixture\n\n';(root/'dpkg/status').write_text(status)
  runner=r'''import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync,spawn} from 'node:child_process';import {randomBytes} from 'node:crypto';
const root=process.env.FIXTURE_ROOT,source=root+'/source',port=49004,file='/etc/redis/redis.conf',original=fs.readFileSync(file,'utf8'),proof={status:'FAIL',checks:[]};
const cli=(...args)=>execFileSync('/usr/bin/redis-cli',['-s',process.env.FIXTURE_SOCKET,'--raw',...args],{encoding:'utf8',timeout:10000}).trim();cli('SET','tastedev:fixture','한글 GUI Redis 복원');
const env={...process.env,NODE_ENV:'development',NEXT_TELEMETRY_DISABLED:'1',LINUX_STATE_ROOT:root+'/state',LINUX_AUTH_ROOT:root+'/auth',LINUX_WORKSPACE_ROOT:root+'/workspace',LINUX_PACKAGED:'true',LINUX_ENABLE_ADMIN:'true',LINUX_ENABLE_INSTALL:'false',LINUX_ENABLE_CRON:'false',LINUX_ENABLE_TERMINAL:'false',LINUX_ENABLE_AI:'false',BETTER_AUTH_URL:'http://127.0.0.1:'+port};delete env.OPENAI_API_KEY;Object.assign(process.env,env);
const {storeCredentials}=await import(source+'/lib/auth-store.mjs'),{passwordHash}=await import(source+'/lib/auth-password.mjs'),{defaultSecurity}=await import(source+'/lib/security.mjs');
const username='redis-gui-fixture',password=randomBytes(32).toString('base64url');storeCredentials(username,await passwordHash(password));fs.writeFileSync(root+'/gui-login.json',JSON.stringify({username,password}),{mode:0o600});fs.writeFileSync(root+'/state/security.json',JSON.stringify({...defaultSecurity,readOnly:false,databaseChanges:true,sudoWithoutPrompt:true}),{mode:0o600});
const log=fs.openSync(root+'/web.log','w',0o600),web=spawn('/usr/bin/node',[source+'/node_modules/next/dist/bin/next','dev','--webpack','--hostname','127.0.0.1','--port',String(port)],{cwd:source,env,stdio:['ignore',log,log]});let applied=false;
try{const deadline=Date.now()+600000;for(;;){assert(Date.now()<deadline&&web.exitCode===null,'GUI startup unavailable');try{if((await fetch('http://127.0.0.1:'+port+'/login')).status===200)break;}catch{}await new Promise(resolve=>setTimeout(resolve,200));}
fs.writeFileSync(root+'/gui-connection.json',JSON.stringify({root,port,usernameFile:root+'/gui-login.json',unit:process.env.FIXTURE_UNIT}));
for(;;){assert(Date.now()<deadline&&web.exitCode===null,'GUI deadline exceeded');if(fs.readFileSync(file,'utf8').includes('maxclients 123'))try{if(cli('CONFIG','GET','maxclients')==='maxclients\n123')applied=true;}catch{}if(fs.existsSync(root+'/gui-result.json')){proof.gui=JSON.parse(fs.readFileSync(root+'/gui-result.json'));break;}await new Promise(resolve=>setTimeout(resolve,200));}
assert.equal(proof.gui.status,'PASS');assert(applied,'native GUI apply not observed');assert.equal(cli('CONFIG','GET','maxclients'),'maxclients\n100');assert.equal(fs.readFileSync(file,'utf8'),original);assert.equal(cli('GET','tastedev:fixture'),'한글 GUI Redis 복원');proof.status='PASS';proof.appliedRuntime123Observed=true;proof.restoredRuntime100=true;proof.originalBytesRestored=true;proof.koreanAofDataPreserved=true;
}catch(error){proof.errorClass=error.name;proof.errorMessage=error.message;}finally{web.kill('SIGTERM');await new Promise(resolve=>{const timer=setTimeout(()=>{web.kill('SIGKILL');resolve();},10000);web.once('close',()=>{clearTimeout(timer);resolve();});});fs.closeSync(log);fs.writeFileSync(root+'/proof.json',JSON.stringify(proof));}if(proof.status!=='PASS')process.exitCode=1;
'''
 if interrupted_gui:
  runner=runner.replace('port=49004','port=49005').replace("unit:process.env.FIXTURE_UNIT}","unit:process.env.FIXTURE_UNIT,namespacePid:process.pid,interrupted:true}")
  runner=runner.replace("assert(applied,'native GUI apply not observed');","assert(proof.gui.interruptedHelperKilled===true,'interruption not verified');assert(proof.gui.configReplacementObserved===true,'replacement not verified');")
  runner=runner.replace("proof.appliedRuntime123Observed=true;","proof.interruptedGuiRecovered=true;proof.appliedRuntime123Observed=false;")
 if __FAILURE_GUI__:
  runner=runner.replace("assert(applied,'native GUI apply not observed');","assert(proof.gui.nativeStartupFailureObserved===true,'startup failure not observed');assert(proof.gui.portZeroDisplayed===true,'port-zero GUI correction not observed');")
  runner=runner.replace("proof.appliedRuntime123Observed=true;","proof.guiStartupFailureRecovered=true;proof.portZeroGuiVerified=true;proof.appliedRuntime123Observed=false;")
 (root/'runner.mjs').write_text(runner)
 launch="import subprocess,os\nsubprocess.run(['/usr/bin/mount','--make-rprivate','/'],check=True)\nsubprocess.run(['/usr/bin/mount','--bind',"+repr(str(usr))+",'/usr'],check=True)\nos.execv('/usr/bin/node',['/usr/bin/node',"+repr(str(root/'runner.mjs'))+"])\n"
 if apply_mode:
  state=root/'state';state.mkdir(mode=0o700)
  prefix="subprocess.run(['/usr/bin/mount','-t','tmpfs','-o','mode=755','tmpfs','/var/lib'],check=True)\nos.mkdir('/var/lib/linux',0o700)\nsubprocess.run(['/usr/bin/mount','--bind',%r,'/var/lib/linux'],check=True)\nsubprocess.run(['/usr/bin/mount','-t','tmpfs','-o','mode=755','tmpfs','/etc'],check=True)\nos.mkdir('/etc/redis',0o755)\nsubprocess.run(['/usr/bin/mount','--bind',%r,'/etc/redis'],check=True)\nos.environ['FIXTURE_SOCKET']=%r\nos.environ['FIXTURE_PROOF']=%r\n"%(str(state),str(config),str(data/'server.sock'),str(root/'proof.json'))
  launch=launch.replace("os.execv('/usr/bin/node'",prefix+"os.execv('/usr/bin/node'")
 if gui_mode:
  # Overlay lower dirs are read-only. Policy/identity files stay on the host
  # lower /etc; all namespace edits go to our own upper directory.
  setup="subprocess.run(['/usr/bin/mount','-t','overlay','overlay','-o',%r,%r],check=True)\nsubprocess.run(['/usr/bin/mount','-t','overlay','overlay','-o',%r,%r],check=True)\n"%('ro,lowerdir='+str(usr)+':/usr',str(root/'usr-merged'),'lowerdir=/etc,upperdir='+str(root/'etc-upper')+',workdir='+str(root/'etc-work'),str(root/'etc-merged'))
  launch=launch.replace("subprocess.run(['/usr/bin/mount','--bind',"+repr(str(usr))+",'/usr'],check=True)",setup+"subprocess.run(['/usr/bin/mount','--bind',%r,'/usr'],check=True)"%str(root/'usr-merged'))
  launch=launch.replace("subprocess.run(['/usr/bin/mount','-t','tmpfs','-o','mode=755','tmpfs','/etc'],check=True)\nos.mkdir('/etc/redis',0o755)","subprocess.run(['/usr/bin/mount','--bind',%r,'/etc'],check=True)\nos.makedirs('/etc/redis',mode=0o755,exist_ok=True)"%str(root/'etc-merged'))
  launch=launch.replace("os.execv('/usr/bin/node'","os.mkdir('/var/lib/dpkg',0o755)\nsubprocess.run(['/usr/bin/mount','--bind',%r,'/var/lib/dpkg'],check=True)\nsubprocess.run(['/usr/bin/mount','-o','remount,bind,ro','/var/lib/dpkg'],check=True)\nos.environ['FIXTURE_ROOT']=%r\nos.environ['FIXTURE_UNIT']=%r\nos.execv('/usr/bin/node'"%(str(root/'dpkg'),str(root),unit))
 (root/'launch.py').write_text(launch)
 process=subprocess.Popen(['/usr/bin/unshare','--mount','--','python3',str(root/'launch.py')],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,start_new_session=True)
 if gui_mode:
  deadline=time.time()+750;announced=False
  while process.poll() is None:
   assert time.time()<deadline,'GUI control deadline'
   if (root/'gui-connection.json').exists() and not announced:
    print(json.dumps({'status':'GUI_READY',**json.loads((root/'gui-connection.json').read_text())}),flush=True);announced=True
   time.sleep(.2)
  out,err=process.communicate(timeout=10)
 else:out,err=process.communicate(timeout=180)
 run=subprocess.CompletedProcess([],process.returncode,out,err)
 if run.returncode and not (root/'proof.json').exists():result['fixedFixtureLaunchError']=run.stderr.replace(str(root),'[private-fixture]')[-1400:]
 if run.returncode:result.update(reason='actual-redis-helper-rejected' if apply_mode else 'actual-redis-identity-rejected',diagnosticSha256=hashlib.sha256(run.stderr.encode()).hexdigest(),proof=json.loads((root/'proof.json').read_text()) if (root/'proof.json').exists() else None)
 else:result.update(status='PASS',**({'helperProof':json.loads((root/'proof.json').read_text())} if apply_mode else {'identity':json.loads((root/'proof.json').read_text())}))
 result.update(packages=packages,serverSha256=hashlib.sha256((usr/'bin/redis-server').read_bytes()).hexdigest(),sourceSha256={k:hashlib.sha256(v.encode()).hexdigest() for k,v in files.items()},privateSocketReady=True,hostBinaryUnchanged=pathlib.Path('/usr/bin/redis-server').exists()==originalBinary)
except Exception as error:
 result.update(reason='remote-control-error',phase=phase,errorClass=type(error).__name__,exitCode=getattr(error,'returncode',None))
 if phase=='start-service' and isinstance(error,subprocess.CalledProcessError):
  message=(error.stderr or b'').decode('utf8','replace') if isinstance(error.stderr,bytes) else (error.stderr or '')
  result['fixedFixtureSetupError']=message.replace(str(root),'[private-fixture]').replace(unit,'[dedicated-unit]')[:600]
finally:
 if process is not None and process.poll() is None:
  os.killpg(process.pid,signal.SIGTERM)
  try:process.communicate(timeout=15)
  except subprocess.TimeoutExpired:os.killpg(process.pid,signal.SIGKILL);process.communicate(timeout=10)
 if created:
  subprocess.run(['/usr/bin/systemctl','stop',unit],capture_output=True,timeout=15)
  inactive=subprocess.run(['/usr/bin/systemctl','is-active',unit],capture_output=True,text=True);result['dedicatedUnitStopped']=inactive.stdout.strip() in ['inactive','failed','unknown']
 result['installedHelpersPreserved']=originalHelpers=={name:hashlib.sha256(p.read_bytes()).hexdigest() if p.is_file() else None for name in ['linux-admin','linex-admin'] for p in [pathlib.Path('/usr/lib/tastedev-linux/scripts/admin')/name]}
 shutil.rmtree(root);result['privateStageRemoved']=not root.exists()
print(json.dumps(result))
""".replace('__FILES__',repr(files)).replace('__APPLY__',repr(apply_mode)).replace('__GUI__',repr(gui_mode)).replace('__INTERRUPTED__',repr(interrupted_gui)).replace('__FAILURE_GUI__',repr(failure_gui))
command=['ssh','-F','/dev/null','-i','/home/whitecalvin/.ssh/id_ed25519','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','whitecalvin@192.168.0.103','sudo -n python3 -']
if gui_mode:
 transport=subprocess.Popen(command,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True);transport.stdin.write(remote);transport.stdin.close();lines=[]
 for line in transport.stdout:
  value=json.loads(line)
  if value.get('status')=='GUI_READY':
   (gui_folder/'connection.json').write_text(json.dumps(value));print(line,flush=True)
  else:lines.append(line)
 transport.wait(timeout=30);run=subprocess.CompletedProcess(command,transport.returncode,''.join(lines),transport.stderr.read())
else:run=subprocess.run(command,input=remote,text=True,capture_output=True,timeout=360)
folder=gui_folder if gui_folder else project/'.runtime/verification'/('redis-service-identity-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
if not gui_folder:folder.mkdir(parents=True)
if run.returncode:
 result={'status':'FAIL','reason':'remote-control-error','diagnosticSha256':hashlib.sha256(run.stderr.encode()).hexdigest()}
else:result=json.loads(run.stdout)
(folder/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'evidence':str(folder/'result.json'),**{k:v for k,v in result.items() if k!='sourceSha256'},'sourceFiles':len(result.get('sourceSha256',{}))},ensure_ascii=False))
raise SystemExit(0 if result['status']=='PASS' else 1)
