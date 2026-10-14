"""Approved QA-103 current-source GUI and dedicated app restart fixture.
No package build, sudo policy change or existing service replacement.
"""
import argparse,base64,hashlib,io,json,pathlib,re,subprocess,tarfile
p=argparse.ArgumentParser();p.add_argument('action',choices=['prepare','status','cleanup']);p.add_argument('--connection',required=True);p.add_argument('--port',type=int,default=49013);p.add_argument('--production-build');p.add_argument('--network-start',action='store_true');p.add_argument('--next-port',type=int);a=p.parse_args()
project=pathlib.Path.cwd();target=pathlib.Path(a.connection).resolve();assert target.is_relative_to(project/'.runtime/verification');assert 1024<=a.port<=65535
parameters={'action':a.action,'port':a.port}
if a.network_start:
 assert a.production_build and a.next_port is not None and 1024<=a.next_port<=65535 and a.next_port!=a.port
 parameters.update(networkStart=True,nextPort=a.next_port)
if a.action=='prepare':
 files={}
 for directory in ['app','components','lib','public']:
  for file in sorted((project/directory).rglob('*')):
   assert not file.is_symlink()
   if file.is_file():files[str(file.relative_to(project))]=file.read_bytes()
 for name in ['package.json','next.config.mjs','AGENTS.md','scripts/admin/linux-admin','scripts/admin/package.json','scripts/start-server.mjs']:files[name]=(project/name).read_bytes()
 if a.production_build:
  build=pathlib.Path(a.production_build).resolve();assert build.is_relative_to(pathlib.Path('/mnt/data/build/tastedev-linux'))
  snapshot=json.loads((build/'source-snapshot.json').read_text());assert snapshot['project']==str(project)
  for name,digest in snapshot['files'].items():assert hashlib.sha256((project/name).read_bytes()).hexdigest()==digest and hashlib.sha256((build/name).read_bytes()).hexdigest()==digest
  for file in sorted((build/'.next').rglob('*')):
   relative=file.relative_to(build);assert not file.is_symlink()
   if file.is_file() and 'cache' not in relative.parts:files[str(relative)]=file.read_bytes()
  assert '.next/BUILD_ID' in files;parameters['production']=True
 buffer=io.BytesIO()
 with tarfile.open(fileobj=buffer,mode='w:gz') as archive:
  for name,data in files.items():
   entry=tarfile.TarInfo(name);entry.size=len(data);entry.mode=0o644;archive.addfile(entry,io.BytesIO(data))
 parameters.update(archive=base64.b64encode(buffer.getvalue()).decode(),manifest={n:hashlib.sha256(v).hexdigest() for n,v in files.items()},runtimeNames=re.findall(r"'([^']+\.mjs)'",(project/'scripts/admin/runtime-files.mjs').read_text()))
else:parameters.update(json.loads(target.read_text()))
remote=r'''
import base64,hashlib,io,json,os,pathlib,pwd,re,shutil,socket,subprocess,tarfile,tempfile,time
p=__PARAMETERS__;assert os.getuid()==0
account=pwd.getpwnam('whitecalvin');assert account.pw_uid>0
def run(args,**kw):return subprocess.run(args,check=True,capture_output=True,text=True,timeout=60,**kw)
def host_snapshot():
 paths=[pathlib.Path('/etc/tastedev-linux/config.env'),pathlib.Path('/usr/lib/tastedev-linux/scripts/admin/linux-admin'),pathlib.Path('/etc/systemd/system/tastedev-linux.service')]
 return {str(f):hashlib.sha256(f.read_bytes()).hexdigest() for f in paths if f.is_file()}
def manager(unit):return dict(line.split('=',1) for line in run(['/usr/bin/systemctl','show',unit,'--property=ActiveState,MainPID','--no-pager']).stdout.splitlines())
if p['action']=='prepare':
 for port in [p['port']]+([p['nextPort']] if p.get('networkStart') else []):
  sock=socket.socket();sock.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);sock.bind(('0.0.0.0',port));sock.close()
 base=pathlib.Path('/mnt/data/build/tastedev-linux-restart');base.mkdir(mode=0o755,exist_ok=True);assert base.is_dir() and not base.is_symlink() and base.stat().st_uid==0 and not base.stat().st_mode&0o022
 root=pathlib.Path(tempfile.mkdtemp(prefix='gui-',dir=base));root.chmod(0o755);source=root/'source';source.mkdir(mode=0o755)
 identity=os.urandom(24).hex();(root/'identity').write_text(identity);(root/'identity').chmod(0o600)
 before=host_snapshot();(root/'host-snapshot.json').write_text(json.dumps(before))
 archive=tarfile.open(fileobj=io.BytesIO(base64.b64decode(p['archive'])));members=archive.getmembers();assert {m.name for m in members}==set(p['manifest'])
 for m in members:
  assert m.isfile() and not pathlib.PurePosixPath(m.name).is_absolute() and '..' not in pathlib.PurePosixPath(m.name).parts
  data=archive.extractfile(m).read();assert hashlib.sha256(data).hexdigest()==p['manifest'][m.name]
  f=source/m.name;f.parent.mkdir(parents=True,exist_ok=True,mode=0o755);f.write_bytes(data);f.chmod(0o644)
 stage=root/'admin';runtime=stage/'runtime';runtime.mkdir(parents=True,mode=0o755);manifest={}
 for name in ['linux-admin','package.json']:shutil.copyfile(source/'scripts/admin'/name,stage/name)
 (stage/'linux-admin').chmod(0o755)
 for name in p['runtimeNames']:
  assert re.fullmatch(r'[a-z0-9-]+\.mjs',name);raw=(source/'lib'/name).read_bytes();(runtime/name).write_bytes(raw);manifest[name]=hashlib.sha256(raw).hexdigest()
 (runtime/'manifest.json').write_text(json.dumps(manifest));(root/'admin-helper.sha256').write_text(hashlib.sha256((stage/'linux-admin').read_bytes()).hexdigest()+'\n')
 for f in [source,*source.rglob('*')]:os.chown(f,account.pw_uid,account.pw_gid)
 (source/'node_modules').symlink_to('/usr/lib/tastedev-linux/node_modules',target_is_directory=True)
 for name in ['auth','state','workspace']:
  (root/name).mkdir(mode=0o700);os.chown(root/name,account.pw_uid,account.pw_gid)
 (root/'helper-state').mkdir(mode=0o700)
 identifier=os.urandom(6).hex();unit='tastedev-restart-gui-'+identifier+'.service';timer='tastedev-restart-gui-'+identifier+'-timer'
 unitfile=pathlib.Path('/etc/systemd/system',unit);assert not unitfile.exists() and not unitfile.is_symlink()
 env={'PATH':'/usr/bin:/usr/sbin:/bin','HOME':str(root/'auth'),'TMPDIR':str(root/'workspace'),'TMP':str(root/'workspace'),'TEMP':str(root/'workspace'),'LANG':'C.UTF-8','NEXT_TELEMETRY_DISABLED':'1','LINUX_PACKAGED':'true','LINUX_AUTH_ROOT':str(root/'auth'),'LINUX_STATE_ROOT':str(root/'state'),'LINUX_WORKSPACE_ROOT':str(root/'workspace'),'LINUX_ENABLE_ADMIN':'true','LINUX_ENABLE_INSTALL':'false','LINUX_ENABLE_CRON':'false','LINUX_ENABLE_TERMINAL':'false','LINUX_ENABLE_AI':'false','LINUX_ENABLE_SUDO_POLICY':'false','BETTER_AUTH_URL':'http://127.0.0.1:'+str(p['port']),'PORT':str(p['port']),'LINUX_HOST':'127.0.0.1','LINUX_ACTIVE_HOST':'127.0.0.1'}
 setup="import {randomBytes} from 'node:crypto';import {writeFileSync} from 'node:fs';import {storeCredentials} from './lib/auth-store.mjs';import {passwordHash} from './lib/auth-password.mjs';import {defaultSecurity} from './lib/security.mjs';const username='restart-gui-fixture',password=randomBytes(32).toString('base64url');storeCredentials(username,await passwordHash(password));writeFileSync(process.env.HOME+'/gui-login.json',JSON.stringify({username,password}),{flag:'wx',mode:0o600});writeFileSync(process.env.LINUX_STATE_ROOT+'/security.json',JSON.stringify({...defaultSecurity,readOnly:false,fileEditing:true,serviceChanges:true,sudoWithoutPrompt:true}),{mode:0o600});"
 run(['/usr/sbin/runuser','--user','whitecalvin','--preserve-environment','--','/usr/bin/node','--input-type=module','-'],input=setup,cwd=source,env=env)
 shutil.copyfile('/usr/bin/systemd-run',root/'systemd-run-native');(root/'systemd-run-native').chmod(0o755)
 adapter="#!/usr/bin/python3\nimport os,sys,pathlib,json\na=sys.argv[1:]\nassert a==['--quiet','--collect','--unit=tastedev-linux-app-restart','--on-active=3s','--timer-property=AccuracySec=1s','/usr/bin/systemctl','--no-ask-password','restart','tastedev-linux.service']\npathlib.Path(%r).write_text(json.dumps(a))\na[2]=%r;a[-1]=%r\nos.execv(%r,[%r]+a)\n"%(str(root/'timer-command.json'),'--unit='+timer,unit,str(root/'systemd-run-native'),str(root/'systemd-run-native'))
 (root/'systemd-run-adapter').write_text(adapter);(root/'systemd-run-adapter').chmod(0o755)
 launcher="import os,sys,pathlib,subprocess\nroot=pathlib.Path(sys.argv[1]);os.environ.update(__ENV__)\nassert os.readlink('/proc/self/ns/mnt')!=os.readlink('/proc/1/ns/mnt'),'Host mount namespace forbidden'\nsubprocess.run(['/usr/bin/mount','--make-rprivate','/'],check=True)\n"
 for src,dst in [('admin','/usr/lib/tastedev-linux/scripts/admin'),('admin-helper.sha256','/usr/lib/tastedev-linux/admin-helper.sha256'),('systemd-run-adapter','/usr/bin/systemd-run')]:launcher+="subprocess.run(['/usr/bin/mount','--bind',str(root/%r),%r],check=True)\n"%(src,dst)
 if p.get('networkStart'):
  launcher+="os.chdir(root/'source');os.execv('/usr/sbin/runuser',['/usr/sbin/runuser','--user','whitecalvin','--preserve-environment','--','/usr/bin/node',str(root/'source/scripts/start-server.mjs')])\n"
 else:
  launcher+="os.chdir(root/'source');os.execv('/usr/sbin/runuser',['/usr/sbin/runuser','--user','whitecalvin','--preserve-environment','--','/usr/bin/node',str(root/'source/node_modules/next/dist/bin/next')]+"+repr(['start'] if p.get('production') else ['dev','--webpack'])+"+['--hostname','127.0.0.1','--port',sys.argv[2]])\n"
 (root/'launcher.py').write_text(launcher.replace('__ENV__',repr(env)));(root/'launcher.py').chmod(0o600)
 text='[Unit]\nDescription=Disposable Tastedev GUI app restart verification\n[Service]\nType=exec\nRestart=no\nTimeoutStopSec=20\nExecStart=/usr/bin/unshare --mount -- /usr/bin/python3 '+str(root/'launcher.py')+' '+str(root)+' '+str(p['port'])+'\n'
 unitfile.write_text(text);run(['/usr/bin/systemctl','daemon-reload']);run(['/usr/bin/systemctl','start',unit]);assert host_snapshot()==before
 c={'root':str(root),'identity':identity,'port':p['port'],'unit':unit,'timer':timer,'unitSha256':hashlib.sha256(unitfile.read_bytes()).hexdigest(),'initialManager':manager(unit),'production':p.get('production',False),'networkStart':p.get('networkStart',False),'nextPort':p.get('nextPort')}
 (root/'connection.json').write_text(json.dumps(c));(root/'connection.json').chmod(0o600);print(json.dumps(c))
else:
 root=pathlib.Path(p['root']);assert re.fullmatch(r'/mnt/data/build/tastedev-linux-restart/gui-[a-zA-Z0-9_-]+',str(root));assert root.is_dir() and not root.is_symlink() and root.stat().st_uid==0 and (root/'identity').read_text()==p['identity']
 c=json.loads((root/'connection.json').read_text());unit=c['unit'];assert re.fullmatch(r'tastedev-restart-gui-[a-f0-9]{12}\.service',unit);timer=c['timer'];assert timer==unit.removesuffix('.service')+'-timer'
 unitfile=pathlib.Path('/etc/systemd/system',unit);assert not unitfile.is_symlink() and hashlib.sha256(unitfile.read_bytes()).hexdigest()==c['unitSha256'];assert host_snapshot()==json.loads((root/'host-snapshot.json').read_text())
 if p['action']=='status':
  result={'manager':manager(unit),'initialManager':c['initialManager'],'timerCommand':json.loads((root/'timer-command.json').read_text()) if (root/'timer-command.json').exists() else None,'hostSnapshotsPreserved':True,'networkSettings':json.loads((root/'state/network-settings.json').read_text()) if (root/'state/network-settings.json').exists() else None}
  print(json.dumps(result))
 else:
  for item in [timer+'.timer',timer+'.service',unit]:subprocess.run(['/usr/bin/systemctl','stop',item],capture_output=True,timeout=30)
  assert manager(unit)['ActiveState'] in ['inactive','failed'];unitfile.unlink();run(['/usr/bin/systemctl','daemon-reload'])
  deadline=time.monotonic()+15
  while True:
   s=socket.socket();s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1)
   try:s.bind(('127.0.0.1',c['port']));s.close();break
   except OSError:s.close();assert time.monotonic()<deadline;time.sleep(.1)
  if c.get('networkStart'):
   check=socket.socket();check.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);check.bind(('0.0.0.0',c['nextPort']));check.close()
  assert host_snapshot()==json.loads((root/'host-snapshot.json').read_text());shutil.rmtree(root);print(json.dumps({'hostSnapshotsPreserved':True,'dedicatedUnitRemoved':not unitfile.exists(),'privateStageRemoved':not root.exists(),'guiListenerClosed':True}))
'''.replace('__PARAMETERS__',repr(parameters))
r=subprocess.run(['ssh','-F','/dev/null','-o','BatchMode=yes','-o','ConnectTimeout=8','-o','StrictHostKeyChecking=yes','-i','/home/whitecalvin/.ssh/id_ed25519','whitecalvin@192.168.0.103','sudo -n python3 -'],input=remote,text=True,capture_output=True,timeout=120)
if r.returncode:print(r.stderr[-2000:]);raise SystemExit(r.returncode)
result=json.loads(r.stdout)
if a.action=='prepare':target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(result));(target.parent/'source-manifest.json').write_text(json.dumps(parameters['manifest'],indent=2))
else:(target.parent/(a.action+'.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in result.items() if k not in ['identity','start']}))
