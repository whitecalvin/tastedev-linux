"""Approved QA-103 current-source GUI and dedicated Node service fixture.
No package build, sudo policy change or existing service replacement.
"""
import argparse,base64,hashlib,io,json,pathlib,re,subprocess,tarfile
p=argparse.ArgumentParser();p.add_argument('action',choices=['prepare','status','cleanup']);p.add_argument('--connection',required=True);p.add_argument('--port',type=int,default=48931);p.add_argument('--faults',action='store_true');p.add_argument('--inventory-faults',action='store_true');a=p.parse_args()
project=pathlib.Path.cwd();target=pathlib.Path(a.connection).resolve();assert target.is_relative_to(project/'.runtime/verification');assert 1024<=a.port<=65535
parameters={'action':a.action,'port':a.port,'faults':a.faults,'inventoryFaults':a.inventory_faults}
if a.action=='prepare':
 files={}
 for directory in ['app','components','lib','public']:
  for file in sorted((project/directory).rglob('*')):
   assert not file.is_symlink()
   if file.is_file():files[str(file.relative_to(project))]=file.read_bytes()
 for name in ['package.json','next.config.mjs','AGENTS.md','scripts/admin/linux-admin','scripts/admin/package.json']:files[name]=(project/name).read_bytes()
 buffer=io.BytesIO()
 with tarfile.open(fileobj=buffer,mode='w') as archive:
  for name,data in files.items():
   entry=tarfile.TarInfo(name);entry.size=len(data);entry.mode=0o644;archive.addfile(entry,io.BytesIO(data))
 parameters.update(archive=base64.b64encode(buffer.getvalue()).decode(),manifest={n:hashlib.sha256(v).hexdigest() for n,v in files.items()},runtimeNames=re.findall(r"'([^']+\.mjs)'",(project/'scripts/admin/runtime-files.mjs').read_text()))
else:parameters.update(json.loads(target.read_text()))
remote=r'''
import base64,hashlib,io,json,os,pathlib,pwd,re,shutil,signal,socket,subprocess,tarfile,tempfile,time
p=__PARAMETERS__;assert os.getuid()==0
account=pwd.getpwnam('whitecalvin');assert account.pw_uid>0

def run(args,**kwargs):return subprocess.run(args,check=True,capture_output=True,text=True,timeout=60,**kwargs)
def process_identity(pid):
 text=pathlib.Path('/proc',str(pid),'stat').read_text();fields=text[text.rfind(')')+2:].split();return None if fields[0]=='Z' else fields[19]
def userdir(path):path.mkdir(mode=0o700);os.chown(path,account.pw_uid,account.pw_gid)
if p['action']=='prepare':
 sock=socket.socket();sock.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);sock.bind(('127.0.0.1',p['port']));sock.close()
 base=pathlib.Path('/mnt/data/build/tastedev-linux-node');base.mkdir(mode=0o755,exist_ok=True)
 assert base.is_dir() and not base.is_symlink() and base.stat().st_uid==0 and not base.stat().st_mode&0o022
 root=pathlib.Path(tempfile.mkdtemp(prefix='tastedev-node-gui-',dir=base));root.chmod(0o755);source=root/'source';source.mkdir(mode=0o755)
 identity=os.urandom(24).hex();(root/'identity').write_text(identity);(root/'identity').chmod(0o600)
 archive=tarfile.open(fileobj=io.BytesIO(base64.b64decode(p['archive'])));members=archive.getmembers();assert {m.name for m in members}==set(p['manifest'])
 for member in members:
  assert member.isfile() and not pathlib.PurePosixPath(member.name).is_absolute() and '..' not in pathlib.PurePosixPath(member.name).parts
  data=archive.extractfile(member).read();assert hashlib.sha256(data).hexdigest()==p['manifest'][member.name]
  file=source/member.name;file.parent.mkdir(parents=True,exist_ok=True,mode=0o755);file.write_bytes(data);file.chmod(0o644)
 stage=root/'admin';runtime=stage/'runtime';runtime.mkdir(parents=True,mode=0o755);manifest={}
 for name in ['linux-admin','package.json']:shutil.copyfile(source/'scripts/admin'/name,stage/name)
 (stage/'linux-admin').chmod(0o755)
 for name in p['runtimeNames']:
  assert re.fullmatch(r'[a-z0-9-]+\.mjs',name);raw=(source/'lib'/name).read_bytes();(runtime/name).write_bytes(raw);manifest[name]=hashlib.sha256(raw).hexdigest()
 (runtime/'manifest.json').write_text(json.dumps(manifest));(root/'admin-helper.sha256').write_text(hashlib.sha256((stage/'linux-admin').read_bytes()).hexdigest()+'\n')
 for file in [source,*source.rglob('*')]:os.chown(file,account.pw_uid,account.pw_gid)
 (source/'node_modules').symlink_to('/usr/lib/tastedev-linux/node_modules',target_is_directory=True)
 for name in ['auth','state','workspace','app']:userdir(root/name)
 helperstate=root/'helper-state';helperstate.mkdir(mode=0o700);(helperstate/'admin').mkdir(mode=0o700)
 identifier='gui-'+os.urandom(6).hex();unit='tastedev-node-'+identifier+'.service';unitfile=pathlib.Path('/etc/systemd/system',unit);assert not unitfile.exists() and not unitfile.is_symlink()
 for name,text in [('server.mjs',"import http from 'node:http';import fs from 'node:fs';const sock=process.cwd()+'/probe.sock';try{fs.unlinkSync(sock)}catch{};http.createServer((req,res)=>res.end(process.env.VALUE)).listen(sock);console.log('한글 GUI 서비스');"),('.env','VALUE="한글 GUI 서비스"\n')]:
  file=root/'app'/name;file.write_text(text);file.chmod(0o600);os.chown(file,account.pw_uid,account.pw_gid)
 env={'PATH':'/usr/bin:/usr/sbin:/bin','HOME':str(root/'auth'),'TMPDIR':str(root/'workspace'),'TMP':str(root/'workspace'),'TEMP':str(root/'workspace'),'LANG':'C.UTF-8','LC_ALL':'C.UTF-8','NEXT_TELEMETRY_DISABLED':'1','LINUX_PACKAGED':'true','LINUX_AUTH_ROOT':str(root/'auth'),'LINUX_STATE_ROOT':str(root/'state'),'LINUX_WORKSPACE_ROOT':str(root/'workspace'),'LINUX_ENABLE_ADMIN':'true','LINUX_ENABLE_INSTALL':'false','LINUX_ENABLE_CRON':'false','LINUX_ENABLE_TERMINAL':'false','LINUX_ENABLE_AI':'false','LINUX_ENABLE_SUDO_POLICY':'false','BETTER_AUTH_URL':'http://127.0.0.1:'+str(p['port']),'FIXTURE_APP':str(root/'app'),'FIXTURE_ID':identifier}
 setup="""import {randomBytes,createHash} from 'node:crypto';import {writeFileSync} from 'node:fs';import {storeCredentials} from './lib/auth-store.mjs';import {passwordHash} from './lib/auth-password.mjs';import {defaultSecurity} from './lib/security.mjs';import {nodeApps,saveNodeApp} from './lib/node-apps.mjs';import {nodeAppUnit} from './lib/node-app-unit.mjs';
const username='node-gui-fixture',password=randomBytes(32).toString('base64url');storeCredentials(username,await passwordHash(password));writeFileSync(process.env.HOME+'/gui-login.json',JSON.stringify({username,password}),{flag:'wx',mode:0o600});
writeFileSync(process.env.LINUX_STATE_ROOT+'/security.json',JSON.stringify({...defaultSecurity,readOnly:false,fileEditing:true,serviceChanges:true,sudoWithoutPrompt:true}),{mode:0o600});const profile={id:process.env.FIXTURE_ID,label:'전용 Node GUI 검수',directory:process.env.FIXTURE_APP,entry:'server.mjs',environmentFile:'.env'};await saveNodeApp({version:(await nodeApps()).version,profile});
const hashes=[{restart:'no',restartSeconds:5,stopSeconds:15},{restart:'on-failure',restartSeconds:7,stopSeconds:15}].map(options=>createHash('sha256').update('# Managed by Tastedev Linux\\n'+nodeAppUnit(profile,process.getuid(),options)).digest('hex'));writeFileSync(process.env.HOME+'/owned-unit-hashes.json',JSON.stringify(hashes),{mode:0o600});"""
 try:
  run(['/usr/sbin/runuser','--user','whitecalvin','--preserve-environment','--','/usr/bin/node','--input-type=module','-'],input=setup,cwd=source,env=env)
  launcher="""import os,sys,pathlib,subprocess;root=sys.argv[1];subprocess.run(['/usr/bin/mount','--make-rprivate','/'],check=True);subprocess.run(['/usr/bin/mount','--bind',root+'/admin','/usr/lib/tastedev-linux/scripts/admin'],check=True);subprocess.run(['/usr/bin/mount','--bind',root+'/admin-helper.sha256','/usr/lib/tastedev-linux/admin-helper.sha256'],check=True);os.makedirs(root+'/host-dpkg',mode=0o700,exist_ok=True);subprocess.run(['/usr/bin/mount','--bind','/var/lib/dpkg',root+'/host-dpkg'],check=True);subprocess.run(['/usr/bin/mount','-t','tmpfs','-o','mode=755','tmpfs','/var/lib'],check=True);os.mkdir('/var/lib/dpkg',0o755);subprocess.run(['/usr/bin/mount','--bind',root+'/host-dpkg','/var/lib/dpkg'],check=True);subprocess.run(['/usr/bin/mount','-o','remount,bind,ro','/var/lib/dpkg'],check=True);os.mkdir('/var/lib/linux',0o700);subprocess.run(['/usr/bin/mount','--bind',root+'/helper-state','/var/lib/linux'],check=True);os.chdir(root+'/source');os.execv('/usr/sbin/runuser',['/usr/sbin/runuser','--user','whitecalvin','--preserve-environment','--','/usr/bin/node',root+'/source/node_modules/next/dist/bin/next','dev','--webpack','--hostname','127.0.0.1','--port',sys.argv[2]])"""
  if p.get('inventoryFaults'):
   shutil.copyfile('/usr/bin/dpkg-query',root/'dpkg-query-native');(root/'dpkg-query-native').chmod(0o755)
   adapter="#!/usr/bin/python3\nimport sys,os,pathlib\nroot=pathlib.Path(%r)\nif (root/'inventory-failure').exists():\n sys.stderr.write('dedicated private inventory diagnostic\\n');sys.exit(2)\nos.execv(%r,[%r]+sys.argv[1:])\n"%(str(root),str(root/'dpkg-query-native'),str(root/'dpkg-query-native'))
   (root/'dpkg-query-adapter').write_text(adapter);(root/'dpkg-query-adapter').chmod(0o755)
   launcher=launcher.replace("os.chdir(root+'/source')","subprocess.run(['/usr/bin/mount','--bind',root+'/dpkg-query-adapter','/usr/bin/dpkg-query'],check=True);os.chdir(root+'/source')")
  if p['faults']:
   shutil.copyfile('/usr/bin/systemctl',root/'systemctl-native');(root/'systemctl-native').chmod(0o755)
   adapter="#!/usr/bin/python3\nimport sys,os,time,pathlib\na=sys.argv[1:];root=pathlib.Path(%r);unit=%r\nassert all(not v.endswith(('.service','.socket','.timer','.target')) or v==unit for v in a)\nassert any(v in a for v in ['daemon-reload','show','start','stop','restart','enable','disable','is-active'])\nif 'daemon-reload' in a and (root/'fault-mode').exists() and pathlib.Path('/etc/systemd/system',unit).exists() and 'Restart=on-failure' in pathlib.Path('/etc/systemd/system',unit).read_text():\n mode=(root/'fault-mode').read_text().strip()\n if mode=='failure':\n  (root/'fault-mode').unlink();(root/'reload-failed').write_text('own one-shot failure');sys.exit(91)\n if mode=='interrupt':\n  (root/'reload-paused').write_text('own update paused')\n  while not (root/'reload-release').exists():time.sleep(.1)\n  sys.exit(91)\nos.execv(%r,[%r]+a)\n"%(str(root),unit,str(root/'systemctl-native'),str(root/'systemctl-native'))
   (root/'systemctl-adapter').write_text(adapter);(root/'systemctl-adapter').chmod(0o755)
   launcher=launcher.replace("os.chdir(root+'/source')","subprocess.run(['/usr/bin/mount','--bind',root+'/systemctl-adapter','/usr/bin/systemctl'],check=True);os.chdir(root+'/source')")
  (root/'launcher.py').write_text(launcher);(root/'launcher.py').chmod(0o600)
  with (root/'web.log').open('w') as log:child=subprocess.Popen(['/usr/bin/unshare','--mount','--','/usr/bin/python3',str(root/'launcher.py'),str(root),str(p['port'])],env=env,stdin=subprocess.DEVNULL,stdout=log,stderr=log,start_new_session=True)
  connection={'root':str(root),'identity':identity,'pid':child.pid,'start':process_identity(child.pid),'port':p['port'],'identifier':identifier,'unit':unit,'callerUid':account.pw_uid}
  (root/'connection.json').write_text(json.dumps(connection));(root/'connection.json').chmod(0o600);print(json.dumps(connection))
 except Exception:
  shutil.rmtree(root);raise
else:
 root=pathlib.Path(p['root']);assert re.fullmatch(r'/mnt/data/build/tastedev-linux-node/tastedev-node-gui-[a-zA-Z0-9_-]+',str(root));assert root.is_dir() and not root.is_symlink() and root.stat().st_uid==0 and (root/'identity').read_text()==p['identity'];connection=json.loads((root/'connection.json').read_text());assert connection['identity']==p['identity'] and connection['pid']==p['pid']
 unit=connection['unit'];assert unit=='tastedev-node-'+connection['identifier']+'.service';unitfile=pathlib.Path('/etc/systemd/system',unit)
 try:alive=process_identity(connection['pid'])==connection['start']
 except FileNotFoundError:alive=False
 if p['action']=='status':
  output={'alive':alive,'unitExists':unitfile.exists(),'callerUid':account.pw_uid,'nodeVersion':run(['/usr/bin/node','--version']).stdout.strip()}
  if unitfile.exists():output.update(unitSha256=hashlib.sha256(unitfile.read_bytes()).hexdigest(),manager=run(['/usr/bin/systemctl','show',unit,'--property=ActiveState,MainPID,UnitFileState','--no-pager']).stdout)
  try:output['http']=run(['/usr/bin/curl','--silent','--show-error','--max-time','2','--unix-socket',str(root/'app/probe.sock'),'http://localhost/']).stdout
  except subprocess.CalledProcessError:output['http']=None
  print(json.dumps(output,ensure_ascii=False))
 else:
  if alive:
   assert os.getpgid(connection['pid'])==connection['pid'];os.killpg(connection['pid'],signal.SIGTERM)
   for _ in range(100):
    try:
     if process_identity(connection['pid'])!=connection['start']:break
    except FileNotFoundError:break
    time.sleep(.1)
   else:os.killpg(connection['pid'],signal.SIGKILL)
  # Next dev can spawn a child server that finishes after its launcher exits.
  # Preserve the stage unless the listener has actually closed.
  deadline=time.monotonic()+15
  while True:
   listener=socket.socket()
   try:
    listener.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);listener.bind(('127.0.0.1',connection['port']));listener.close();break
   except OSError:
    listener.close();assert time.monotonic()<deadline,'Temporary GUI listener still active; stage preserved';time.sleep(.1)
  if unitfile.exists():
   expected=json.loads((root/'auth/owned-unit-hashes.json').read_text());assert not unitfile.is_symlink() and hashlib.sha256(unitfile.read_bytes()).hexdigest() in expected
   run(['/usr/bin/systemctl','--no-ask-password','stop',unit]);run(['/usr/bin/systemctl','--no-ask-password','disable',unit]);assert hashlib.sha256(unitfile.read_bytes()).hexdigest() in expected;unitfile.unlink();run(['/usr/bin/systemctl','--no-ask-password','daemon-reload'])
  shutil.rmtree(root);print(json.dumps({'dedicatedUnitRemoved':not unitfile.exists(),'privateStageRemoved':not root.exists(),'guiListenerClosed':True}))
'''.replace('__PARAMETERS__',repr(parameters))
r=subprocess.run(['ssh','-F','/dev/null','-o','BatchMode=yes','-o','ConnectTimeout=8','-o','StrictHostKeyChecking=yes','-i','/home/whitecalvin/.ssh/id_ed25519','whitecalvin@192.168.0.103','sudo -n python3 -'],input=remote,text=True,capture_output=True,timeout=120)
if r.returncode:print(r.stderr[-2000:]);raise SystemExit(r.returncode)
result=json.loads(r.stdout)
if a.action=='prepare':target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(result));(target.parent/'source-manifest.json').write_text(json.dumps(parameters['manifest'],indent=2))
else:(target.parent/(a.action+'.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in result.items() if k not in ['identity','start']}))
