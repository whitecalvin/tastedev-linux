"""Installed setgid crontab + unchanged PAM, ordinary account, private mount namespace."""
import base64, datetime, hashlib, io, json, pathlib, subprocess, tarfile, sys
project = pathlib.Path.cwd()
editor_mode = '--gui-editor' in sys.argv
gui_mode = '--gui' in sys.argv or editor_mode
evidence = project / '.runtime/verification' / ('cron-installed-account-' + datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
evidence.mkdir(parents=True)
buf = io.BytesIO()
manifest = {}
with tarfile.open(fileobj=buf, mode='w:gz') as archive:
    files = sorted((project / 'lib').glob('*.mjs'))
    if gui_mode:
        files = sorted(file for name in ['app', 'components', 'lib', 'public'] for file in (project / name).rglob('*') if file.is_file())
        files += [project / name for name in ['package.json', 'next.config.mjs']]
    for file in files:
        relative = str(file.relative_to(project))
        assert not file.is_symlink()
        archive.add(file, arcname=relative)
        manifest[relative] = hashlib.sha256(file.read_bytes()).hexdigest()
(evidence / 'source-manifest.json').write_text(json.dumps(manifest, indent=2))
runner = r'''
import fs from 'node:fs';import assert from 'node:assert/strict';
import {cronStatus,applyCron,deleteCron} from './lib/server-tools.mjs';
import {backups,restorePlan,restoreBackup} from './lib/operations.mjs';
assert.equal(process.getuid(),1000);assert.equal(process.geteuid(),1000);
const root=process.cwd(), active={name:'qa-active',schedule:'* * * * *',command:'/usr/bin/id -u > '+root+'/executed-uid; /bin/echo "한국어 예약 실행" > '+root+'/executed-text',enabled:true};
const disabled={name:'qa-disabled',schedule:'* * * * *',command:'/bin/touch '+root+'/disabled-output',enabled:false};
let state=await cronStatus();assert.equal(state.text,'');assert.equal(state.canApply,true);assert.equal(state.account.username,'whitecalvin');
state=await applyCron({...active,version:state.version,confirm:true});const original=(await backups())[0];state=await applyCron({...disabled,version:state.version,confirm:true});
fs.writeFileSync('installed.json',JSON.stringify(state));
const deadline=Date.now()+75000;while(!fs.existsSync('executed-text')){if(Date.now()>deadline)throw Error('Installed account cron execution timeout');await new Promise(r=>setTimeout(r,250));}
assert.equal(fs.readFileSync('executed-text','utf8'),'한국어 예약 실행\n');assert.equal(fs.readFileSync('executed-uid','utf8'),'1000\n');assert(!fs.existsSync('disabled-output'));fs.writeFileSync('execution-proof.json',JSON.stringify({uid:fs.readFileSync('executed-uid','utf8'),text:fs.readFileSync('executed-text','utf8'),disabledOutputAbsent:true}));
state=await deleteCron({name:active.name,version:state.version,confirm:true});state=await deleteCron({name:disabled.name,version:state.version,confirm:true});assert.equal(state.text.trim(),'');const review=await restorePlan(original.id);await restoreBackup({id:original.id,backupVersion:review.record.sha256,version:review.version,confirm:true});assert.equal((await cronStatus()).text,'');
fs.writeFileSync('account-result.json',JSON.stringify({status:'PASS',account:state.account,checks:['original app cron mutation with installed setgid crontab','actual installed daemon and unchanged host PAM execute as UID 1000','Korean scheduled output preserved','disabled job absent','app deletion preserves only the existing blank line','app reviewed backup restores exact empty original bytes through installed crontab'],guiVerified:false}));
'''
namespace = r'''
import os, pathlib, subprocess, json, sys, hashlib, time
root=pathlib.Path(sys.argv[1]);work=root/'work';gui_mode=sys.argv[3]=='gui'
def run(*args):subprocess.run(args,check=True,capture_output=True)
run('mount','--make-rprivate','/')
run('mount','-t','tmpfs','-o','mode=755,nosuid,nodev','tmpfs','/var/spool/cron')
spool=pathlib.Path('/var/spool/cron/crontabs');spool.mkdir(mode=0o1730);os.chmod(spool,0o1730)
import grp
os.chown(spool,0,grp.getgrnam('crontab').gr_gid)
run('mount','-t','tmpfs','-o','mode=755,nosuid,nodev','tmpfs','/run')
for target in ['/etc/cron.d','/etc/cron.hourly','/etc/cron.daily','/etc/cron.weekly','/etc/cron.monthly']:
 if pathlib.Path(target).exists():run('mount','--bind',str(root/'empty'),target)
run('mount','--bind',str(root/'crontab'),'/etc/crontab')
assert os.readlink('/proc/self/ns/mnt')!=sys.argv[2]
stat=pathlib.Path('/usr/bin/crontab').stat();assert stat.st_mode&0o2000 and stat.st_uid==0
pam=hashlib.sha256(pathlib.Path('/etc/pam.d/cron').read_bytes()).hexdigest()
log=open(root/'cron-stderr.log','w');daemon=None;web=None;account=None
try:
 env=dict(os.environ,LINUX_STATE_ROOT=str(work/'state'),LINUX_ENABLE_CRON='true',LANG='C.UTF-8',LC_ALL='C.UTF-8',HOME='/home/whitecalvin',TMPDIR=str(work),TMP=str(work),TEMP=str(work))
 if gui_mode:
  import socket, signal
  with socket.socket() as listener:
   listener.bind(('127.0.0.1',0));port=listener.getsockname()[1]
  env.update(LINUX_AUTH_ROOT=str(work/'auth'),LINUX_WORKSPACE_ROOT=str(work/'workspace'),LINUX_ENABLE_ADMIN='false',LINUX_ENABLE_INSTALL='false',LINUX_ENABLE_AI='false',LINUX_ENABLE_TERMINAL='false',BETTER_AUTH_URL='http://127.0.0.1:'+str(port),NEXT_TELEMETRY_DISABLED='1')
  for key in ['OPENAI_API_KEY','LINUX_LOGIN_USERNAME','LINUX_LOGIN_PASSWORD_HASH']:env.pop(key,None)
  setup="""import {mkdirSync,writeFileSync} from 'node:fs';import {randomBytes} from 'node:crypto';import {passwordHash} from './lib/auth-password.mjs';import {storeCredentials} from './lib/auth-store.mjs';import {defaultSecurity} from './lib/security.mjs';
const username='cron-gui-fixture',password=randomBytes(24).toString('base64url');storeCredentials(username,await passwordHash(password));mkdirSync(process.env.LINUX_STATE_ROOT,{recursive:true,mode:0o700});writeFileSync(process.env.LINUX_STATE_ROOT+'/security.json',JSON.stringify({...defaultSecurity,readOnly:false,cronChanges:true}),{mode:0o600});writeFileSync('gui-login.json',JSON.stringify({username,password}),{mode:0o600});"""
  subprocess.run(['/usr/sbin/runuser','--user','whitecalvin','--preserve-environment','--','/usr/bin/node','--input-type=module','-'],input=setup,cwd=work,env=env,text=True,capture_output=True,check=True)
  web_log=open(root/'web.log','w')
  web=subprocess.Popen(['/usr/sbin/runuser','--user','whitecalvin','--preserve-environment','--','/usr/bin/node',str(work/'node_modules/next/dist/bin/next'),'dev','--webpack','--hostname','127.0.0.1','--port',str(port)],cwd=work,env=env,stdout=web_log,stderr=web_log,start_new_session=True)
  import urllib.request
  deadline=time.monotonic()+90
  while True:
   assert web.poll() is None,'GUI server exited'
   try:
    if urllib.request.urlopen('http://127.0.0.1:'+str(port)+'/login',timeout=8).status==200:break
   except Exception:pass
   assert time.monotonic()<deadline,'GUI readiness timeout'
   time.sleep(.2)
  print(json.dumps({'status':'GUI_READY','root':str(root),'work':str(work),'port':port}),flush=True)
  deadline=time.monotonic()+600
  while not (work/'gui-installed.json').exists():
   assert web.poll() is None and time.monotonic()<deadline,'GUI install deadline exceeded'
   time.sleep(.2)
  gui=json.loads((work/'gui-installed.json').read_text());assert gui['savedThroughGui'] is True
  actual=subprocess.check_output(['/usr/sbin/runuser','--user','whitecalvin','--','/usr/bin/crontab','-l'],text=True)
  assert 'qa-active' in actual and 'executed-text' in actual,'GUI did not install required job'
  daemon=subprocess.Popen(['/usr/sbin/cron','-f','-L','15'],stderr=log,stdout=subprocess.DEVNULL)
  deadline=time.monotonic()+75
  while not (work/'executed-text').exists():
   assert daemon.poll() is None and time.monotonic()<deadline,'GUI cron execution timeout'
   time.sleep(.25)
  assert (work/'executed-text').read_text()=='한국어 예약 실행\n'
  assert (work/'executed-uid').read_text()=='1000\n'
  assert not (work/'disabled-output').exists()
  (work/'execution-proof.json').write_text(json.dumps({'uid':'1000','text':'한국어 예약 실행','disabledOutputAbsent':True}))
  print(json.dumps({'status':'CRON_EXECUTED','root':str(root)}),flush=True)
  deadline=time.monotonic()+300
  while not (work/'gui-result.json').exists():
   assert web.poll() is None and time.monotonic()<deadline,'GUI restore deadline exceeded'
   time.sleep(.2)
  gui=json.loads((work/'gui-result.json').read_text())
  assert gui['status']=='PASS' and gui['restoredThroughGui'] and gui['loggedOut']
  original=subprocess.run(['/usr/sbin/runuser','--user','whitecalvin','--','/usr/bin/crontab','-l'],capture_output=True,text=True)
  assert original.returncode==0 and original.stdout=='','GUI restore did not preserve exact empty original'
  proof={'status':'PASS','guiVerified':True,'account':'whitecalvin','checks':['original GUI saved cron through authenticated API and installed setgid crontab','installed cron daemon executes the GUI-created job as UID 1000 with unchanged PAM','Korean output preserved and disabled job absent','original GUI reviewed backup restore returns exact original bytes','original GUI logout completed']}
  proof.update(pamSha256=pam,mountNamespace=os.readlink('/proc/self/ns/mnt'),crontabMode=oct(stat.st_mode&0o7777),cronPid=daemon.pid)
  (root/'namespace-result.json').write_text(json.dumps(proof))
  sys.exit(0)
 account=subprocess.Popen(['/usr/sbin/runuser','--user','whitecalvin','--preserve-environment','--','/usr/bin/node',str(work/'runner.mjs')],cwd=work,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
 deadline=time.monotonic()+10
 while not (work/'installed.json').exists():
  if account.poll() is not None or time.monotonic()>deadline:break
  time.sleep(0.1)
 if (work/'installed.json').exists():daemon=subprocess.Popen(['/usr/sbin/cron','-f','-L','15'],stderr=log,stdout=subprocess.DEVNULL)
 stdout,stderr=account.communicate(timeout=85)
 (root/'runner-stdout.log').write_text(stdout);(root/'runner-stderr.log').write_text(stderr)
 if account.returncode:raise RuntimeError('Account runner failed; saved stderr')
 assert daemon.poll() is None
 proof=json.loads((work/'account-result.json').read_text());proof.update(pamSha256=pam,mountNamespace=os.readlink('/proc/self/ns/mnt'),crontabMode=oct(stat.st_mode&0o7777),cronPid=daemon.pid)
 (root/'namespace-result.json').write_text(json.dumps(proof))
finally:
 if web is not None:
  import signal
  try:os.killpg(web.pid,signal.SIGTERM)
  except ProcessLookupError:pass
  try:web.wait(timeout=8)
  except subprocess.TimeoutExpired:os.killpg(web.pid,signal.SIGKILL);web.wait(timeout=5)
  web_log.close()
 if account is not None and account.poll() is None:
  account.terminate();account.wait(timeout=5)
 if daemon is not None:
  daemon.terminate()
  try:daemon.wait(timeout=5)
  except subprocess.TimeoutExpired:daemon.kill();daemon.wait(timeout=5)
 log.close()
'''
if editor_mode:
    marker="  print(json.dumps({'status':'GUI_READY','root':str(root),'work':str(work),'port':port}),flush=True)"
    assert namespace.count(marker)==1
    first=namespace.index(marker);last=namespace.index("  sys.exit(0)",first)+len("  sys.exit(0)")
    namespace=namespace[:first]+r"""
  original='PATH=/usr/bin\n15 2 * * * /bin/true # unmanaged\n'
  subprocess.run(['/usr/sbin/runuser','--user','whitecalvin','--','/usr/bin/crontab','-'],input=original,text=True,check=True)
  print(json.dumps({'status':'GUI_READY','root':str(root),'work':str(work),'port':port}),flush=True)
  stages=[]
  for phase,enabled,schedule,command in [('added',True,'0 3 * * *','/bin/true'),('edited',True,'15 4 * * *','/bin/echo "편집 검수"'),('disabled',False,'15 4 * * *','/bin/echo "편집 검수"'),('deleted',None,None,None)]:
   deadline=time.monotonic()+300
   while not (work/('gui-'+phase)).exists():
    assert web.poll() is None and time.monotonic()<deadline,'GUI phase deadline: '+phase
    time.sleep(.2)
   code="import {cronStatus} from './lib/server-tools.mjs';console.log(JSON.stringify(await cronStatus()));"
   current=json.loads(subprocess.check_output(['/usr/sbin/runuser','--user','whitecalvin','--preserve-environment','--','/usr/bin/node','--input-type=module','-e',code],cwd=work,env=env,text=True))
   assert current['text'].startswith(original), 'Unmanaged cron changed'
   assert current['account']['uid']==1000
   if phase=='deleted':assert current['jobs']==[] and current['text']==original
   else:assert current['jobs']==[{'name':'qa-editor','schedule':schedule,'command':command,'enabled':enabled}],phase
   stages.append({'phase':phase,'text':current['text'],'jobs':current['jobs']})
   (work/('native-'+phase+'.json')).write_text(json.dumps(stages[-1]))
   print(json.dumps({'status':'PHASE_VERIFIED','phase':phase}),flush=True)
  deadline=time.monotonic()+300
  while not (work/'gui-result.json').exists():
   assert web.poll() is None and time.monotonic()<deadline,'GUI result deadline'
   time.sleep(.2)
  gui=json.loads((work/'gui-result.json').read_text());assert gui['status']=='PASS' and gui['loggedOut']
  assert subprocess.check_output(['/usr/sbin/runuser','--user','whitecalvin','--','/usr/bin/crontab','-l'],text=True)==original
  proof={'status':'PASS','guiVerified':True,'account':'whitecalvin','stages':stages,'checks':['original GUI adds, edits same job without duplicate, disables and deletes through installed crontab','unmanaged job and PATH remain exact through all GUI changes','original GUI logout completed'],'schedulerExecutionRepeated':False,'pamSha256':pam,'mountNamespace':os.readlink('/proc/self/ns/mnt'),'crontabMode':oct(stat.st_mode&0o7777)}
  (root/'namespace-result.json').write_text(json.dumps(proof));sys.exit(0)
"""+namespace[last:]

remote = r'''
import base64, hashlib, io, json, pathlib, subprocess, tarfile, tempfile, shutil, os
payload=PAYLOAD;runner=RUNNER;namespace=NAMESPACE;manifest=MANIFEST;gui_mode=GUI_MODE
base=pathlib.Path('/mnt/data/build/tastedev-linux-cron');base.mkdir(mode=0o700,exist_ok=True)
assert base.is_dir() and not base.is_symlink() and base.stat().st_uid==os.getuid() and not base.stat().st_mode&0o077
root=pathlib.Path(tempfile.mkdtemp(prefix='tastedev-cron-account-',dir=base));root.chmod(0o755)
work=root/'work';work.mkdir(mode=0o700);empty=root/'empty';empty.mkdir();(root/'crontab').write_text('')
def host_snapshot():
 result=subprocess.run(['sudo','-n','find','/var/spool/cron','-type','f','-exec','sha256sum','{}',';'],capture_output=True,text=True,check=True)
 return result.stdout
before=host_snapshot();result={'status':'FAIL','guiVerified':False}
try:
 with tarfile.open(fileobj=io.BytesIO(base64.b64decode(payload)),mode='r:gz') as archive:archive.extractall(work,filter='data')
 (work/'runner.mjs').write_text(runner);(root/'namespace.py').write_text(namespace)
 for file,digest in manifest.items():assert hashlib.sha256((work/file).read_bytes()).hexdigest()==digest
 (work/'node_modules').symlink_to('/usr/lib/tastedev-linux/node_modules',target_is_directory=True)
 subprocess.run(['sudo','-n','chown','-R','whitecalvin:whitecalvin',str(work)],check=True)
 hostns=os.readlink('/proc/self/ns/mnt')
 args=['sudo','-n','unshare','--mount','--','python3',str(root/'namespace.py'),str(root),hostns,'gui' if gui_mode else 'native']
 if gui_mode:
  proc=subprocess.Popen(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
  output=[]
  for line in proc.stdout:
   output.append(line)
   if line.startswith('{'):print(line.strip(),flush=True)
  stderr=proc.stderr.read();code=proc.wait(timeout=10)
  proc=subprocess.CompletedProcess(args,code,''.join(output),stderr)
 else:proc=subprocess.run(args,capture_output=True,text=True,timeout=100)
 for file in ['runner-stdout.log','runner-stderr.log','cron-stderr.log']:
  path=root/file
  if path.exists():result[file]=subprocess.run(['sudo','-n','cat',str(path)],capture_output=True,text=True,check=True).stdout
 result['transportStdout']=proc.stdout;result['transportStderr']=proc.stderr;result['exitCode']=proc.returncode
 if proc.returncode==0:result.update(json.loads((root/'namespace-result.json').read_text()))
 for name in ['installed.json','execution-proof.json']:
  if (work/name).exists():result[name]=json.loads((work/name).read_text())
 result['sourceFilesMatched']=len(manifest)
 result['cronPackageVersion']=subprocess.check_output(['dpkg-query','-W','-f=${Version}','cron'],text=True)
 result['cronSha256']=hashlib.sha256(pathlib.Path('/usr/sbin/cron').read_bytes()).hexdigest()
 result['crontabSha256']=hashlib.sha256(pathlib.Path('/usr/bin/crontab').read_bytes()).hexdigest()
finally:
 after=host_snapshot();result['hostCrontabsUnchanged']=before==after
 if before!=after:result['status']='FAIL'
 subprocess.run(['sudo','-n','rm','-rf','--',str(root)],check=True)
 result['fixtureRemoved']=not root.exists()
print(json.dumps(result))
'''.replace('PAYLOAD',repr(base64.b64encode(buf.getvalue()).decode())).replace('RUNNER',repr(runner)).replace('NAMESPACE',repr(namespace)).replace('MANIFEST',repr(manifest)).replace('GUI_MODE',repr(gui_mode))
ssh=['ssh','-F','/dev/null','-i','/home/whitecalvin/.ssh/id_ed25519','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=8','whitecalvin@192.168.0.103','python3 -']
if gui_mode:
    child=subprocess.Popen(ssh,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    child.stdin.write(remote);child.stdin.close();lines=[]
    for line in child.stdout:
        lines.append(line)
        if 'GUI_READY' in line or 'CRON_EXECUTED' in line:print(line.strip(),flush=True)
    stderr=child.stderr.read();code=child.wait(timeout=10)
    check=subprocess.CompletedProcess(ssh,code,''.join(lines),stderr)
else:check=subprocess.run(ssh,input=remote,text=True,capture_output=True,timeout=115)
(evidence/'transport-stdout.log').write_text(check.stdout);(evidence/'transport-stderr.log').write_text(check.stderr)
result=json.loads(check.stdout.strip().splitlines()[-1]) if check.returncode==0 else {'status':'FAIL','transportExit':check.returncode}
(evidence/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':result['status'],'evidence':str(evidence/'result.json')},ensure_ascii=False))
raise SystemExit(0 if result['status']=='PASS' else 1)
