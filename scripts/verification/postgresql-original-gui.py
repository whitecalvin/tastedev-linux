"""Original GUI acceptance controller. Prepare/cleanup require explicit approval.
No action is dispatched without --execute; --plan is entirely local.
"""
import argparse, base64, hashlib, json, pathlib, subprocess, sys
p=argparse.ArgumentParser()
p.add_argument('--plan',action='store_true');p.add_argument('--execute',choices=['prepare','status','cleanup'])
p.add_argument('--plan-file',default='.runtime/verification/postgresql-gui-transfer-plan-20261008/plan.json');p.add_argument('--origin-host',choices=['127.0.0.1','localhost'],default='localhost');p.add_argument('--port',type=int,default=48971);p.add_argument('--root');p.add_argument('--identity')
p.add_argument('--restart-failure',action='store_true',help='Only the disposable cluster refuses work_mem=8MB, allowing the original setting to restart normally')
p.add_argument('--restart-pause',action='store_true',help='Pause only the disposable 8MB restart until its own release marker, for targeted helper interruption')
p.add_argument('--service-controls',action='store_true',help='Enable service controls only in the private fixture policy for dedicated daemon GUI acceptance')
a=p.parse_args();project=pathlib.Path.cwd()
plan_path=(project/a.plan_file).resolve();assert plan_path.is_relative_to(project/'.runtime/verification');plan=json.loads(plan_path.read_text())
if a.plan:
 print(json.dumps({k:v for k,v in plan.items() if k!='files'},ensure_ascii=False));sys.exit(0)
assert a.execute and 1024<=a.port<=65535
payload=None
if a.execute=='prepare':
 bundle=pathlib.Path(plan['bundle']).read_bytes();assert hashlib.sha256(bundle).hexdigest()==plan['bundleSha256']
 for name,digest in plan['files'].items():assert hashlib.sha256((project/name).read_bytes()).hexdigest()==digest,'Source changed: '+name
 import re
 names=re.findall(r"'([^']+\.mjs)'",(project/'scripts/admin/runtime-files.mjs').read_text())
 assert len(names)==len(set(names))
 payload={'archive':base64.b64encode(bundle).decode(),'manifest':plan['files'],'runtimeNames':names,'launcher':(project/'scripts/verification/postgresql-gui-namespace.py').read_text()}
 if a.service_controls:
  original='readOnly:false,databaseChanges:true,sudoWithoutPrompt:true'
  assert payload['launcher'].count(original)==1
  payload['launcher']=payload['launcher'].replace(original,'readOnly:false,databaseChanges:true,serviceChanges:true,sudoWithoutPrompt:true')
else:assert a.root and a.identity
assert not (a.restart_failure and a.restart_pause)
assert not (a.restart_failure or a.restart_pause) or a.execute=='prepare'
assert not a.service_controls or a.execute=='prepare'
parameters={'action':a.execute,'originHost':a.origin_host,'port':a.port,'root':a.root,'identity':a.identity,'payload':payload,'restartFailure':a.restart_failure,'restartPause':a.restart_pause}
remote=r'''
import base64,hashlib,io,json,os,pathlib,re,shutil,signal,socket,subprocess,tarfile,tempfile,time
parameters=__PARAMETERS__
action=parameters['action'];unit='postgresql@18-linuxverify20261008.service';folder=pathlib.Path('/etc/postgresql/18/linuxverify20261008');data=pathlib.Path('/var/lib/postgresql/18/linuxverify20261008');marker='owned disposable systemd fixture linuxverify20261008\n'
assert os.getuid()==0
if action=='prepare':
 payload=parameters['payload'];base=pathlib.Path('/mnt/data/build/tastedev-linux');base.mkdir(parents=True,exist_ok=True,mode=0o700)
 assert base.is_dir() and not base.is_symlink() and base.stat().st_uid==0 and not base.stat().st_mode&0o077
 root=pathlib.Path(tempfile.mkdtemp(prefix='tastedev-postgresql-gui-',dir=base));root.chmod(0o700)
 identity=os.urandom(24).hex();(root/'identity').write_text(identity);(root/'identity').chmod(0o600)
 source=root/'source';source.mkdir(mode=0o755)
 archive=tarfile.open(fileobj=io.BytesIO(base64.b64decode(payload['archive'])),mode='r:')
 members=archive.getmembers();assert len(members)==len(payload['manifest']);assert {m.name for m in members}==set(payload['manifest'])
 for member in members:
  assert member.isfile() and not pathlib.PurePosixPath(member.name).is_absolute() and '..' not in pathlib.PurePosixPath(member.name).parts
  raw=archive.extractfile(member).read();assert hashlib.sha256(raw).hexdigest()==payload['manifest'][member.name]
  file=source/member.name;file.parent.mkdir(parents=True,exist_ok=True,mode=0o755);file.write_bytes(raw);file.chmod(0o644)
 stage=root/'admin';(stage/'runtime').mkdir(parents=True,mode=0o755)
 for name in ['linux-admin','package.json']:shutil.copyfile(source/'scripts/admin'/name,stage/name)
 (stage/'linux-admin').chmod(0o755)
 runtime={}
 for name in payload['runtimeNames']:
  assert re.fullmatch(r'[a-z0-9-]+\.mjs',name)
  raw=(source/'lib'/name).read_bytes();(stage/'runtime'/name).write_bytes(raw);runtime[name]=hashlib.sha256(raw).hexdigest()
 (stage/'runtime/manifest.json').write_text(json.dumps(runtime))
 (root/'source-manifest.json').write_text(json.dumps(payload['manifest']))
 (root/'admin-helper.sha256').write_text(hashlib.sha256((stage/'linux-admin').read_bytes()).hexdigest()+'\n')
 (root/'launcher.py').write_text(payload['launcher']);(root/'launcher.py').chmod(0o600)
 (source/'node_modules').symlink_to('/usr/lib/tastedev-linux/node_modules',target_is_directory=True)
 connection={'root':str(root),'identity':identity,'port':parameters['port'],'clusterCreated':False}
 (root/'connection.json').write_text(json.dumps(connection))
 def run(args):return subprocess.run(args,check=True,capture_output=True,text=True,timeout=60)
 try:
  assert not folder.exists() and not data.exists() and not pathlib.Path('/run/postgresql/.s.PGSQL.55432').exists()
  listener=socket.socket();listener.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);listener.bind(('127.0.0.1',parameters['port']));listener.close()
  run(['/usr/bin/pg_createcluster','--port','55432','--datadir',str(data),'--start-conf','manual','--pgoption','ssl=off','18','linuxverify20261008','--','--auth-local=peer','--auth-host=scram-sha-256'])
  connection['clusterCreated']=True
  (folder/'.tastedev-verification').write_text(marker)
  config=folder/'postgresql.conf';config.write_text(config.read_text()+"\n# disposable original GUI fixture\nlisten_addresses = ''\n")
  connection['configHash']=hashlib.sha256(config.read_bytes()).hexdigest()
  run(['/usr/bin/systemctl','--no-ask-password','start',unit])
  if parameters['restartFailure'] or parameters['restartPause']:
   guard=root/'restart-guard.py'
   guard.write_text("import pathlib,re,sys\np=pathlib.Path("+repr(str(config))+")\nfailed=bool(re.search(r\"(?m)^\\s*work_mem\\s*=\\s*'8MB'\\s*(?:#.*)?$\",p.read_text()))\nwith pathlib.Path("+repr(str(root/'restart-guard-events.log'))+").open('a') as log:log.write(('REJECT_8MB' if failed else 'ALLOW_ORIGINAL')+'\\n')\nsys.exit(23 if failed else 0)\n")
   guard.chmod(0o755)
   if parameters['restartPause']:
    guard.write_text("import pathlib,re,sys,time,os,json\nroot=pathlib.Path("+repr(str(root))+")\np=pathlib.Path("+repr(str(config))+")\ncandidate=bool(re.search(r\"(?m)^\\s*work_mem\\s*=\\s*'8MB'\\s*(?:#.*)?$\",p.read_text()))\nif candidate:\n (root/'guard-ready.json').write_text(json.dumps({'pid':os.getpid(),'configHash':__import__('hashlib').sha256(p.read_bytes()).hexdigest()}))\n deadline=time.monotonic()+120\n while not (root/'guard-release').exists():\n  if time.monotonic()>deadline:sys.exit(24)\n  time.sleep(.1)\nwith (root/'restart-guard-events.log').open('a') as log:log.write(('ALLOW_CANDIDATE' if candidate else 'ALLOW_ORIGINAL')+'\\n')\n")
   dropdir=pathlib.Path('/run/systemd/system')/(unit+'.d');assert not dropdir.exists();dropdir.mkdir(mode=0o755)
   drop=dropdir/'tastedev-verification.conf';drop.write_text('[Service]\nExecStartPre=/usr/bin/python3 '+str(guard)+'\n')
   connection['guardPath']=str(drop);connection['guardHash']=hashlib.sha256(drop.read_bytes()).hexdigest()
   (root/'connection.json').write_text(json.dumps(connection))
   run(['/usr/bin/systemctl','daemon-reload'])
  with (root/'web.log').open('w') as log:
   child=subprocess.Popen(['/usr/bin/unshare','--mount','--','/usr/bin/python3',str(root/'launcher.py'),'--execute','--root',str(root),'--port',str(parameters['port']),'--origin-host',parameters['originHost']],stdin=subprocess.DEVNULL,stdout=log,stderr=log,start_new_session=True)
  connection['pid']=child.pid
  stat=pathlib.Path('/proc/'+str(child.pid)+'/stat').read_text();connection['start']=stat[stat.rfind(')')+2:].split()[19]
  (root/'connection.json').write_text(json.dumps(connection))
  print(json.dumps({'status':'STARTING','root':str(root),'identity':identity,'port':parameters['port'],'pid':child.pid,'credentialPrinted':False}))
 except Exception as error:
  (root/'connection.json').write_text(json.dumps(connection))
  print(json.dumps({'status':'FAIL','root':str(root),'identity':identity,'message':str(error),'cleanupRequired':True}));raise SystemExit(1)
else:
 assert re.fullmatch(r'/mnt/data/build/tastedev-linux/tastedev-postgresql-gui-[a-zA-Z0-9_-]+',parameters['root'])
 root=pathlib.Path(parameters['root']);assert not root.is_symlink() and root.stat().st_uid==0 and not root.stat().st_mode&0o077
 assert (root/'identity').read_text()==parameters['identity']
 connection=json.loads((root/'connection.json').read_text());assert connection['identity']==parameters['identity']
 pid=connection.get('pid');alive=False
 if pid and pathlib.Path('/proc/'+str(pid)+'/stat').exists():
  stat=pathlib.Path('/proc/'+str(pid)+'/stat').read_text();alive=stat[stat.rfind(')')+2:].split()[19]==connection['start']
 if action=='status':
  print(json.dumps({'status':'RUNNING' if alive else 'STOPPED','root':str(root),'port':connection['port'],'credentialPrinted':False}))
 else:
  if alive:
   assert os.getpgid(pid)==pid;os.killpg(pid,signal.SIGTERM)
   for attempt in range(100):
    if not pathlib.Path('/proc/'+str(pid)).exists():break
    current=pathlib.Path('/proc/'+str(pid)+'/stat').read_text();fields=current[current.rfind(')')+2:].split()
    if fields[0]=='Z':break
    time.sleep(.1)
   else:raise RuntimeError('Temporary server did not stop; stage preserved')
  if connection['clusterCreated']:
   assert (folder/'.tastedev-verification').read_text()==marker
   assert hashlib.sha256((folder/'postgresql.conf').read_bytes()).hexdigest()==connection['configHash']
   # Completed graph restore keeps exact prior bytes as undo evidence.
   # This disposable fixture may remove only an inode matching its own backup.
   backup_texts={json.loads(p.read_text()).get('text') for p in (root/'state/admin/postgresql').glob('*.json') if json.loads(p.read_text()).get('target')==str(folder/'postgresql.conf')} if (root/'state/admin/postgresql').exists() else set()
   for undo in folder.glob('.tastedev-pg-undo-*'):
    assert re.fullmatch(r'\.tastedev-pg-undo-[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}',undo.name)
    st=undo.lstat();assert undo.is_file() and not undo.is_symlink() and st.st_nlink==1 and not st.st_mode&0o022
    assert undo.read_text() in backup_texts;assert undo.lstat().st_ino==st.st_ino;undo.unlink()
   if connection.get('guardPath'):
    drop=pathlib.Path(connection['guardPath']);assert drop==pathlib.Path('/run/systemd/system')/(unit+'.d')/'tastedev-verification.conf'
    assert drop.is_file() and not drop.is_symlink() and hashlib.sha256(drop.read_bytes()).hexdigest()==connection['guardHash']
    drop.unlink();drop.parent.rmdir();subprocess.run(['/usr/bin/systemctl','daemon-reload'],check=True,capture_output=True)
   subprocess.run(['/usr/bin/pg_dropcluster','--stop','18','linuxverify20261008'],check=True,capture_output=True,text=True,timeout=60)
   assert not data.exists();assert sorted(x.name for x in folder.iterdir())==['.tastedev-verification']
   (folder/'.tastedev-verification').unlink();folder.rmdir()
  shutil.rmtree(root)
  print(json.dumps({'status':'CLEANED','temporaryServerStopped':True,'privateStageRemoved':True,'disposableClusterRemoved':True,'installedHelperReplaced':False}))
'''.replace('__PARAMETERS__',repr(parameters))
ssh=['ssh','-F','/dev/null','-o','BatchMode=yes','-o','ConnectTimeout=8','-o','StrictHostKeyChecking=yes','-i','/home/whitecalvin/.ssh/id_ed25519','whitecalvin@192.168.0.103','sudo -n python3 -']
completed=subprocess.run(ssh,input=remote,text=True,capture_output=True,timeout=120)
print(completed.stdout,end='')
if completed.returncode:print(completed.stderr[:1000],file=sys.stderr)
sys.exit(completed.returncode)
