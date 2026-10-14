"""Approved 103 source transfer and original Certbot GUI inspection.
Default is read-only. --native-renew permits the approved GUI dry-run.
--native-issue-failure uses real backups with a child-namespace Certbot failure shim; no ACME request.
--native-webroot-issue uses the existing staging account and public challenge root,
with a private certificate store. No operating certificate or nginx replacement.
Current helper/state are bound only inside a private child mount namespace.
Connection metadata contains no login secret; credentials stay in private files.
"""
import argparse,base64,hashlib,io,json,pathlib,re,subprocess,tarfile
p=argparse.ArgumentParser();p.add_argument('action',choices=['prepare','status','cleanup','interrupt-restart']);p.add_argument('--connection',required=True);p.add_argument('--port',type=int,default=48973);p.add_argument('--native-renew',action='store_true');p.add_argument('--native-issue-failure',action='store_true');p.add_argument('--native-renew-output',action='store_true');p.add_argument('--native-backup-history',action='store_true');p.add_argument('--native-webroot-issue',action='store_true');p.add_argument('--native-interruption',action='store_true');a=p.parse_args();assert sum([a.native_renew,a.native_issue_failure,a.native_renew_output,a.native_backup_history,a.native_webroot_issue,a.native_interruption])<=1
project=pathlib.Path.cwd();target=pathlib.Path(a.connection).resolve();assert target.is_relative_to(project/'.runtime/verification');assert 1024<=a.port<=65535
parameters={'action':a.action,'port':a.port,'nativeRenew':a.native_renew,'nativeIssueFailure':a.native_issue_failure,'nativeRenewOutput':a.native_renew_output,'nativeBackupHistory':a.native_backup_history,'nativeWebrootIssue':a.native_webroot_issue,'nativeInterruption':a.native_interruption}
if a.action=='prepare':
 files={}
 for directory in ['app','components','lib','public']:
  for file in sorted((project/directory).rglob('*')):
   assert not file.is_symlink()
   if file.is_file():files[str(file.relative_to(project))]=file.read_bytes()
 for name in ['package.json','next.config.mjs','scripts/admin/linux-admin','scripts/admin/package.json']:files[name]=(project/name).read_bytes()
 buffer=io.BytesIO()
 with tarfile.open(fileobj=buffer,mode='w') as archive:
  for name,data in files.items():
   entry=tarfile.TarInfo(name);entry.size=len(data);entry.mode=0o644;archive.addfile(entry,io.BytesIO(data))
 parameters['runtimeNames']=re.findall(r"'([^']+\.mjs)'",(project/'scripts/admin/runtime-files.mjs').read_text());parameters['archive']=base64.b64encode(buffer.getvalue()).decode();parameters['manifest']={name:hashlib.sha256(data).hexdigest() for name,data in files.items()}
else:parameters.update(json.loads(target.read_text()))
remote=r'''
import base64,hashlib,io,json,os,pathlib,re,shutil,signal,socket,subprocess,tarfile,tempfile,time
p=__PARAMETERS__;assert os.getuid()==0
native=p.get('nativeRenew',False) or p.get('nativeIssueFailure',False) or p.get('nativeRenewOutput',False) or p.get('nativeBackupHistory',False) or p.get('nativeWebrootIssue',False) or p.get('nativeInterruption',False)
def snapshot(root):
 code="import {nginxTopology} from './lib/nginx-topology.mjs';const graph=await nginxTopology();if(!graph.complete)throw Error('Incomplete nginx graph');console.log(JSON.stringify({graphVersion:graph.version}));"
 result=json.loads(subprocess.check_output(['/usr/bin/node','--input-type=module','-'],input=code,text=True,cwd=root/'source'))
 result['protectedHashes']={name:hashlib.sha256(pathlib.Path(name).read_bytes()).hexdigest() for name in ['/etc/letsencrypt/renewal/eztoy.app.conf','/etc/letsencrypt/live/eztoy.app/fullchain.pem']}
 return result
if p['action']=='prepare':
 sock=socket.socket();sock.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);sock.bind(('127.0.0.1',p['port']));sock.close()
 root=pathlib.Path(tempfile.mkdtemp(prefix='tastedev-cert-gui-'));root.chmod(0o700)
 source=root/'source';source.mkdir(mode=0o700)
 archive=tarfile.open(fileobj=io.BytesIO(base64.b64decode(p['archive'])))
 for member in archive.getmembers():
  assert member.isfile() and member.name in p['manifest'] and '..' not in pathlib.PurePosixPath(member.name).parts
  data=archive.extractfile(member).read();assert hashlib.sha256(data).hexdigest()==p['manifest'][member.name]
  file=source/member.name;file.parent.mkdir(parents=True,exist_ok=True);file.write_bytes(data);file.chmod(0o644)
 (root/'manifest.json').write_text(json.dumps(p['manifest']))
 (source/'node_modules').symlink_to('/usr/lib/tastedev-linux/node_modules',target_is_directory=True)
 for name in ['auth','state','workspace']:(root/name).mkdir(mode=0o700)
 before=snapshot(root) if native else None
 if before:(root/'before.json').write_text(json.dumps(before))
 if native:
  stage=root/'admin';(stage/'runtime').mkdir(parents=True,mode=0o755)
  for name in ['linux-admin','package.json']:shutil.copyfile(source/'scripts/admin'/name,stage/name)
  (stage/'linux-admin').chmod(0o755)
  runtime={}
  for name in p['runtimeNames']:
   assert re.fullmatch(r'[a-z0-9-]+\.mjs',name)
   raw=(source/'lib'/name).read_bytes();(stage/'runtime'/name).write_bytes(raw);runtime[name]=hashlib.sha256(raw).hexdigest()
  (stage/'runtime/manifest.json').write_text(json.dumps(runtime));(root/'admin-helper.sha256').write_text(hashlib.sha256((stage/'linux-admin').read_bytes()).hexdigest()+'\n')
 if p.get('nativeWebrootIssue'):
  accountBase=pathlib.Path('/etc/letsencrypt/accounts/acme-staging-v02.api.letsencrypt.org/directory');accounts=list(accountBase.glob('*/regr.json'));assert len(accounts)==1,'A single existing staging account is required'
  certificateRoot=root/'letsencrypt';certificateRoot.mkdir(mode=0o700)
  copiedAccounts=certificateRoot/'accounts/acme-staging-v02.api.letsencrypt.org/directory';copiedAccounts.parent.mkdir(parents=True,mode=0o700);shutil.copytree(accountBase,copiedAccounts)
  (root/'certificate-logs').mkdir(mode=0o700)
  challenge=pathlib.Path('/var/www/letsencrypt/.well-known/acme-challenge');assert challenge.is_dir() and not challenge.is_symlink()
  challengeBefore={str(file):hashlib.sha256(file.read_bytes()).hexdigest() for file in challenge.iterdir() if file.is_file()}
  (root/'challenge-before.json').write_text(json.dumps(challengeBefore))
 env={'PATH':'/usr/bin:/usr/sbin:/bin','HOME':str(root),'LANG':'C.UTF-8','NEXT_TELEMETRY_DISABLED':'1','LINUX_PACKAGED':'true','LINUX_AUTH_ROOT':str(root/'auth'),'LINUX_STATE_ROOT':str(root/'state'),'LINUX_WORKSPACE_ROOT':str(root/'workspace'),'LINUX_ENABLE_ADMIN':'false','LINUX_ENABLE_INSTALL':'false','LINUX_ENABLE_CRON':'false','LINUX_ENABLE_TERMINAL':'false','LINUX_ENABLE_AI':'false','BETTER_AUTH_URL':'http://localhost:'+str(p['port'])}
 if native:env['LINUX_ENABLE_ADMIN']='true'
 setup="""import {randomBytes,randomUUID} from 'node:crypto';import {writeFileSync} from 'node:fs';import {storeCredentials} from './lib/auth-store.mjs';import {passwordHash} from './lib/auth-password.mjs';import {saveCompletedAdminJob} from './lib/admin-job-record.mjs';
const username='cert-gui-fixture',password=randomBytes(32).toString('base64url');storeCredentials(username,await passwordHash(password));writeFileSync(process.env.HOME+'/gui-login.json',JSON.stringify({username,password}),{mode:0o600});
await saveCompletedAdminJob(process.env.LINUX_AUTH_ROOT+'/certificate-jobs',{id:randomUUID(),command:['/usr/bin/certbot','renew','--dry-run','--cert-name','eztoy.app','--no-directory-hooks'],status:'failed',logs:['GUI 검수용 기록: 앞선 실제 eztoy.app staging 오류를 재현한 표시 자료\\nUnable to update challenge :: authorization must be pending\\n'],startedAt:'2026-10-08T07:27:09Z',finishedAt:'2026-10-08T07:27:30Z',exitCode:1,signal:null});"""
 if native:
  setup=setup[:setup.index('await saveCompletedAdminJob')]+"const {defaultSecurity}=await import('./lib/security.mjs');writeFileSync(process.env.LINUX_STATE_ROOT+'/security.json',JSON.stringify({...defaultSecurity,readOnly:false,certificateChanges:true,sudoWithoutPrompt:true}),{mode:0o600});"
 if p.get('nativeBackupHistory'):
  setup+="""
const {readFileSync}=await import('node:fs'),{createHash}=await import('node:crypto'),{createNginxConfigBackup,nginxConfigBackups}=await import('./lib/nginx-config-backups.mjs');
writeFileSync(process.env.LINUX_STATE_ROOT+'/security.json',JSON.stringify({...defaultSecurity,readOnly:false,certificateChanges:false,nginxChanges:false,sudoWithoutPrompt:true}),{mode:0o600});
const target='/etc/nginx/conf.d/vhost_eztoy.conf',version=createHash('sha256').update(readFileSync(target)).digest('hex'),root=process.env.LINUX_STATE_ROOT+'/admin/nginx-config';let oldest;
for(let i=0;i<105;i++){const result=await createNginxConfigBackup({path:target,version},{root});const id=result.backup.id;if(i===0)oldest=id;const file=root+'/'+id+'.json',record=JSON.parse(readFileSync(file,'utf8'));record.createdAt=new Date(1700000000000+i*1000).toISOString();writeFileSync(file,JSON.stringify(record),{mode:0o600});}
const catalog=await nginxConfigBackups({root}),scoped=await nginxConfigBackups({root,ids:[oldest]});if(catalog.backups.length!==100||catalog.backups.some(row=>row.id===oldest)||scoped.backups[0]?.id!==oldest)throw Error('History fixture invalid');
const jobId=randomUUID();await saveCompletedAdminJob(process.env.LINUX_AUTH_ROOT+'/certificate-jobs',{id:jobId,command:['/usr/bin/certbot','renew','--dry-run','--cert-name','eztoy.app'],status:'failed',logs:['오래된 백업 조회 GUI 검수용 기록 · Certbot 명령은 실행하지 않았습니다.\\nnginx 설정 백업 · '+target+' · '+oldest+'\\n'],startedAt:'2026-10-08T09:10:00Z',finishedAt:'2026-10-08T09:10:01Z',exitCode:1,signal:null});
writeFileSync(process.env.HOME+'/history-fixture.json',JSON.stringify({jobId,oldest,target,version,records:105,generalCatalogCount:catalog.backups.length,generalCatalogContainsOldest:false}),{mode:0o600});
"""
 subprocess.run(['/usr/bin/node','--input-type=module','-'],input=setup,text=True,cwd=source,env=env,check=True,capture_output=True)
 args=['/usr/bin/node',str(source/'node_modules/next/dist/bin/next'),'dev','--webpack','--hostname','127.0.0.1','--port',str(p['port'])]
 if native:
  bindings=[(stage,'/usr/lib/tastedev-linux/scripts/admin'),(root/'admin-helper.sha256','/usr/lib/tastedev-linux/admin-helper.sha256'),(root/'state','/var/lib/linux')]
  if p.get('nativeWebrootIssue'):
   assert pathlib.Path('/var/log/letsencrypt').is_dir()
   bindings.extend([(root/'letsencrypt','/etc/letsencrypt'),(root/'certificate-logs','/var/log/letsencrypt')])
  if p.get('nativeInterruption'):
   shim=root/'certbot-interruption';shim.write_text("#!/usr/bin/python3\nimport time,sys\na=sys.argv[1:]\nassert '--nginx' in a and '--staging' in a and a[a.index('-d')+1]=='eztoy.app'\nprint('한글 중단 검수용 일회성 실행 · 실제 ACME 요청 없음',flush=True)\ntime.sleep(70)\nraise SystemExit(1)\n");shim.chmod(0o755);bindings.append((shim,'/usr/bin/certbot'))
  if p.get('nativeIssueFailure'):
   shim=root/'certbot-failure';shim.write_text("#!/bin/sh\nprintf '%s\\n' 'urn:ietf:params:acme:error:dns :: injected verification failure' >&2\nexit 1\n");shim.chmod(0o755);bindings.append((shim,'/usr/bin/certbot'))
  if p.get('nativeRenewOutput'):
   shim=root/'certbot-output';shim.write_text("#!/usr/bin/python3\nimport sys,json\na=sys.argv[1:]\nassert a[0]=='renew' and '--dry-run' in a and '--cert-name' in a and a[a.index('--cert-name')+1]=='eztoy.app'\nfor i in range(1600):print(f'검수 출력 {i:04d} · 한글 😀 · '+json.dumps({'logs':'셸이 출력한 JSON'},ensure_ascii=False))\nprint('CERTIFICATE_LONG_OUTPUT_END_20261008')\n");shim.chmod(0o755);bindings.append((shim,'/usr/bin/certbot'))
  launcher=root/'launcher.py';launcher.write_text("import os,subprocess,json\nassert os.readlink('/proc/self/ns/mnt')!=os.readlink('/proc/1/ns/mnt')\n"+"subprocess.run(['/usr/bin/mount','--make-rprivate','/'],check=True)\n"+"import pathlib\nsaved=pathlib.Path(%r);saved.mkdir(mode=0o700,exist_ok=True)\nsubprocess.run(['/usr/bin/mount','--bind','/var/lib/dpkg',str(saved)],check=True)\nsubprocess.run(['/usr/bin/mount','-t','tmpfs','-o','mode=755','tmpfs','/var/lib'],check=True)\nfor name in ['linux','dpkg','letsencrypt']:pathlib.Path('/var/lib/'+name).mkdir(mode=0o755)\nsubprocess.run(['/usr/bin/mount','--bind',str(saved),'/var/lib/dpkg'],check=True)\nsubprocess.run(['/usr/bin/mount','-o','remount,bind,ro','/var/lib/dpkg'],check=True)\n"%str(root/'host-dpkg')+''.join("subprocess.run(['/usr/bin/mount','--bind',%r,%r],check=True)\n"%(str(a),b) for a,b in bindings)+"os.execve('/usr/bin/node',%r,dict(os.environ))\n"%args)
  args=['/usr/bin/unshare','--mount','--','/usr/bin/python3',str(launcher)]
 with (root/'web.log').open('w') as log:
  child=subprocess.Popen(args,cwd=source,env=env,stdin=subprocess.DEVNULL,stdout=log,stderr=log,start_new_session=True)
 # Preserve PID identity before exporting connection metadata.
 stat=pathlib.Path('/proc/'+str(child.pid)+'/stat').read_text();start=stat[stat.rfind(')')+2:].split()[19]
 connection={'root':str(root),'pid':child.pid,'start':start,'port':p['port'],'nativeRenew':p['nativeRenew'],'nativeIssueFailure':p.get('nativeIssueFailure',False),'nativeRenewOutput':p.get('nativeRenewOutput',False),'nativeBackupHistory':p.get('nativeBackupHistory',False),'nativeWebrootIssue':p.get('nativeWebrootIssue',False),'nativeInterruption':p.get('nativeInterruption',False),'identity':os.urandom(24).hex()};(root/'connection.json').write_text(json.dumps(connection));print(json.dumps(connection))
else:
 assert re.fullmatch(r'/tmp/tastedev-cert-gui-[a-zA-Z0-9_-]+',p['root']);root=pathlib.Path(p['root']);assert not root.is_symlink() and root.stat().st_uid==0 and not root.stat().st_mode&0o077
 connection=json.loads((root/'connection.json').read_text());assert connection['identity']==p['identity']
 proc=pathlib.Path('/proc/'+str(connection['pid'])+'/stat');alive=False
 if proc.exists():
  stat=proc.read_text();alive=stat[stat.rfind(')')+2:].split()[19]==connection['start']
 if p['action']=='interrupt-restart':
  assert connection.get('nativeInterruption') and alive
  pending=list((root/'auth/certificate-jobs').glob('*.pending.json'));assert len(pending)==1
  record=json.loads(pending[0].read_text());assert record['status']=='running' and record['exitCode'] is None
  assert all(not file.exists() for file in [(pending[0].parent/('.'+record['id']+'.publish.lock')),(pending[0].parent/(record['id']+'.log.json'))])
  backupIds=[]
  for row in record['logs']:
   text=json.loads(row).get('logs','')
   if text.startswith('nginx 설정 백업 · '):backupIds.append(text.strip().split(' · ')[-1])
  assert len(backupIds)==27 and all(re.fullmatch(r'[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}',id) for id in backupIds)
  lock=root/'state/server-tools/admin.lock';assert lock.is_file()
  before={'pendingSha256':hashlib.sha256(pending[0].read_bytes()).hexdigest(),'backupIds':backupIds,'jobId':record['id'],'operatingBefore':json.loads((root/'before.json').read_text())}
  # Save only the known environment of this dedicated launcher. No other user's
  # process, real Certbot or service is interrupted.
  raw=(pathlib.Path('/proc')/str(connection['pid'])/'environ').read_bytes();env={}
  for item in raw.split(b'\0'):
   if b'=' in item:
    key,value=item.split(b'=',1);env[key.decode()]=value.decode()
  assert env['HOME']==str(root) and env['LINUX_AUTH_ROOT']==str(root/'auth')
  leader=connection['pid'];assert os.getpgid(leader)==leader;os.killpg(leader,signal.SIGKILL)
  for attempt in range(100):
   active=[]
   for entry in pathlib.Path('/proc').iterdir():
    if not entry.name.isdigit():continue
    try:stat=(entry/'stat').read_text();parts=stat[stat.rfind(')')+2:].split()
    except OSError:continue
    if parts[2]==str(leader) and parts[0]!='Z':active.append(entry.name)
   if not active:break
   time.sleep(.1)
  else:raise RuntimeError('Old web group did not stop')
  assert lock.is_file() and hashlib.sha256(pending[0].read_bytes()).hexdigest()==before['pendingSha256']
  with (root/'web.log').open('a') as log:
   child=subprocess.Popen(['/usr/bin/unshare','--mount','--','/usr/bin/python3',str(root/'launcher.py')],cwd=root/'source',env=env,stdin=subprocess.DEVNULL,stdout=log,stderr=log,start_new_session=True)
  stat=pathlib.Path('/proc/'+str(child.pid)+'/stat').read_text();start=stat[stat.rfind(')')+2:].split()[19]
  connection.update(pid=child.pid,start=start);(root/'connection.json').write_text(json.dumps(connection));(root/'interruption.json').write_text(json.dumps(before))
  print(json.dumps({'restartedConnection':connection,'interruption':{'jobId':before['jobId'],'backupCount':len(backupIds),'pendingPreserved':True,'lockPreserved':True,'ownWebGroupSigkill':True}}))
 elif p['action']=='status':print(json.dumps({'running':alive,'port':connection['port'],'sourceFiles':len(json.loads((root/'manifest.json').read_text())),'nativeRenew':connection.get('nativeRenew',False),'nativeIssueFailure':connection.get('nativeIssueFailure',False),'readOnly':not (connection.get('nativeRenew',False) or connection.get('nativeIssueFailure',False) or connection.get('nativeRenewOutput',False) or connection.get('nativeWebrootIssue',False) or connection.get('nativeInterruption',False))}))
 else:
  if alive:
   pid=connection['pid'];assert os.getpgid(pid)==pid;os.killpg(pid,signal.SIGTERM)
   for attempt in range(100):
    if not proc.exists() or proc.read_text().split(') ',1)[1].split()[0]=='Z':break
    time.sleep(.1)
   else:raise RuntimeError('Own server did not stop; preserve stage')
  # Parent exit does not prove Next.js child workers have stopped.
  for attempt in range(100):
   active=[]
   for entry in pathlib.Path('/proc').iterdir():
    if not entry.name.isdigit():continue
    try:stat=(entry/'stat').read_text();parts=stat[stat.rfind(')')+2:].split()
    except (FileNotFoundError,ProcessLookupError,PermissionError):continue
    if parts[2]==str(connection['pid']) and parts[0]!='Z':active.append(entry.name)
   if not active:break
   time.sleep(.1)
  else:raise RuntimeError('Own child process group did not stop; preserve stage')
  preserved=True
  if connection.get('nativeRenew') or connection.get('nativeIssueFailure') or connection.get('nativeRenewOutput') or connection.get('nativeBackupHistory') or connection.get('nativeWebrootIssue') or connection.get('nativeInterruption'):
   after=snapshot(root);before=json.loads((root/'before.json').read_text());preserved=after==before
   assert preserved,'Operating state changed; keep private evidence'
  if connection.get('nativeWebrootIssue'):
   challenge=pathlib.Path('/var/www/letsencrypt/.well-known/acme-challenge');after={str(file):hashlib.sha256(file.read_bytes()).hexdigest() for file in challenge.iterdir() if file.is_file()};assert after==json.loads((root/'challenge-before.json').read_text()),'Public challenge directory differs; retain evidence'
  def absent_only(function,path,error):
   if not isinstance(error[1],FileNotFoundError):raise error[1]
  shutil.rmtree(root,onerror=absent_only);print(json.dumps({'temporaryServerStopped':True,'privateStageRemoved':not root.exists(),'nativeRenew':connection.get('nativeRenew',False),'nativeIssueFailure':connection.get('nativeIssueFailure',False),'nativeRenewOutput':connection.get('nativeRenewOutput',False),'nativeWebrootIssue':connection.get('nativeWebrootIssue',False),'nativeInterruption':connection.get('nativeInterruption',False),'operatingStatePreserved':preserved,'installedHelperReplaced':False}))
'''.replace('__PARAMETERS__',repr(parameters))
r=subprocess.run(['ssh','-o','BatchMode=yes','-o','ConnectTimeout=8','-o','StrictHostKeyChecking=yes','-i','/home/whitecalvin/.ssh/id_ed25519','whitecalvin@192.168.0.103','sudo -n python3 -'],input=remote,text=True,capture_output=True,timeout=120)
if r.returncode:print(r.stderr[-1500:]);raise SystemExit(r.returncode)
result=json.loads(r.stdout)
if a.action=='prepare':target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(result));(target.parent/'source-manifest.json').write_text(json.dumps(parameters['manifest'],indent=2))
else:
 (target.parent/(a.action+'.json')).write_text(json.dumps(result,indent=2))
 if a.action=='interrupt-restart':
  (target.parent/'initial-connection.json').write_text(target.read_text());target.write_text(json.dumps(result['restartedConnection']))
  result=result['interruption']

print(json.dumps({k:v for k,v in result.items() if k not in ['identity','start']}))
