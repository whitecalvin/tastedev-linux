"""Approved QA-103: real ACME webroot issuance and nginx installer, isolated nginx."""
import pathlib,json,hashlib,re,subprocess,datetime,sys
gui_mode='--gui' in sys.argv;nginx_auth='--nginx-auth' in sys.argv;interrupt_acme='--interrupt-acme' in sys.argv;assert all(v in ['--gui','--nginx-auth','--interrupt-acme'] for v in sys.argv[1:]);assert not nginx_auth or gui_mode;assert not interrupt_acme or nginx_auth
project=pathlib.Path.cwd();names=re.findall(r"'([^']+\.mjs)'",(project/'scripts/admin/runtime-files.mjs').read_text())
files={name:(project/'lib'/name).read_text() for name in names};helper=(project/'scripts/admin/linux-admin').read_text()
sources={}
if gui_mode:
 for directory in ['app','components','lib','public']:
  for file in sorted((project/directory).rglob('*')):
   assert not file.is_symlink()
   if file.is_file():sources[str(file.relative_to(project))]=file.read_text()
 for name in ['package.json','next.config.mjs']:sources[name]=(project/name).read_text()
remote=r'''
import os,pathlib,tempfile,subprocess,shutil,json,hashlib,time,signal
assert os.getuid()==0
files=FILES;helper=HELPER;sources=SOURCES;gui_mode=GUI_MODE;nginx_auth=NGINX_AUTH;interrupt_acme=INTERRUPT_ACME;root=pathlib.Path(tempfile.mkdtemp(prefix='tastedev-cert-install-'));root.chmod(0o700)
unit=root.name+'.service';created=False;child=None;result={'status':'FAIL','guiVerified':False}
protected=[pathlib.Path('/etc/nginx/nginx.conf'),pathlib.Path('/etc/nginx/conf.d/vhost_eztoy.conf'),pathlib.Path('/etc/letsencrypt/renewal/eztoy.app.conf'),pathlib.Path('/etc/letsencrypt/live/eztoy.app/fullchain.pem')]
before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
challenge=pathlib.Path('/var/www/letsencrypt/.well-known/acme-challenge');assert challenge.is_dir()
challengeBefore={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in challenge.iterdir() if p.is_file()}
try:
 home=root/'admin';(home/'runtime').mkdir(parents=True)
 for name,raw in files.items():(home/'runtime'/name).write_text(raw)
 for name,raw in files.items():assert hashlib.sha256((home/'runtime'/name).read_bytes()).hexdigest()==hashlib.sha256(raw.encode()).hexdigest()
 (home/'runtime/manifest.json').write_text(json.dumps({k:hashlib.sha256(v.encode()).hexdigest() for k,v in files.items()}));(home/'linux-admin').write_text(helper);(home/'linux-admin').chmod(0o755);(root/'admin-helper.sha256').write_text(hashlib.sha256(helper.encode()).hexdigest()+'\n');(home/'package.json').write_text('{"type":"commonjs"}')
 for d in [home,home/'runtime']:d.chmod(0o755)
 cert=root/'certificates';cert.mkdir(mode=0o700)
 account=pathlib.Path('/etc/letsencrypt/accounts/acme-staging-v02.api.letsencrypt.org/directory');assert len(list(account.glob('*/regr.json')))==1
 target=cert/'accounts/acme-staging-v02.api.letsencrypt.org/directory';target.parent.mkdir(parents=True);
 if not nginx_auth:shutil.copytree(account,target)
 config=root/'nginx';(config/'conf.d').mkdir(parents=True)
 initial='server { listen 80; server_name eztoy.app; location / { return 200 "한글 자동 HTTPS 연계"; } }\n';(config/'conf.d/eztoy.conf').write_text(initial)
 (config/'nginx.conf').write_text('user root;\nworker_processes 1;\npid /tmp/nginx-fixture.pid;\nerror_log stderr;\nevents { worker_connections 64; }\nhttp { charset utf-8; access_log off; client_body_temp_path /tmp/body; proxy_temp_path /tmp/proxy; fastcgi_temp_path /tmp/fastcgi; uwsgi_temp_path /tmp/uwsgi; scgi_temp_path /tmp/scgi; include /etc/nginx/conf.d/*.conf; }\n')
 for name in ['tmp','state','logs','auth','workspace']:(root/name).mkdir(mode=0o700)
 if gui_mode:
  source=root/'source';source.mkdir()
  for name,raw in sources.items():
   file=source/name;file.parent.mkdir(parents=True,exist_ok=True);file.write_text(raw);assert hashlib.sha256(file.read_bytes()).hexdigest()==hashlib.sha256(raw.encode()).hexdigest()
  (source/'node_modules').symlink_to('/usr/lib/tastedev-linux/node_modules',target_is_directory=True)
 command=['systemd-run','--quiet','--unit='+unit,'--property=Type=exec','--property=Restart=no','--property=PrivateNetwork=yes','--property=TemporaryFileSystem=/etc /var/lib','--property=BindReadOnlyPaths='+str(config)+':/etc/nginx '+str(cert)+':/etc/letsencrypt /etc/passwd:/etc/passwd /etc/group:/etc/group','--property=BindPaths='+str(root/'tmp')+':/tmp','/usr/sbin/nginx','-g','daemon off;']
 subprocess.run(command,check=True,capture_output=True,timeout=30);created=True
 for i in range(100):
  value=subprocess.check_output(['systemctl','show',unit,'--property=MainPID','--value'],text=True).strip()
  if value.isdigit() and int(value)>0 and (root/'tmp/nginx-fixture.pid').exists():break
  time.sleep(.1)
 else:raise RuntimeError('Dedicated nginx not ready')
 pid=int(value);assert int((root/'tmp/nginx-fixture.pid').read_text())==pid
 worker=r"""
import os,pathlib,subprocess,json,hashlib,ssl,socket,sys,time
root=pathlib.Path('/proc/'+str(os.getpid())+'/fd/'+str(os.open(sys.argv[1],os.O_RDONLY|os.O_DIRECTORY)));pid=int(sys.argv[2]);hostns=os.readlink('/proc/self/ns/mnt')
def run(*args):subprocess.run(args,check=True,capture_output=True)
run('mount','--make-rprivate','/')
run('mount','-t','tmpfs','-o','mode=755','tmpfs','/mnt');pathlib.Path('/mnt/fixture').mkdir();run('mount','--bind',str(root),'/mnt/fixture');root=pathlib.Path('/mnt/fixture')
for source,target in [(root/'nginx','/etc/nginx'),(root/'certificates','/etc/letsencrypt'),(root/'logs','/var/log/letsencrypt'),(root/'tmp','/tmp'),(root/'admin','/usr/lib/tastedev-linux/scripts/admin'),(root/'admin-helper.sha256','/usr/lib/tastedev-linux/admin-helper.sha256')]:run('mount','--bind',str(source),target)
(root/'host-dpkg').mkdir();run('mount','--bind','/var/lib/dpkg',str(root/'host-dpkg'))
run('mount','-t','tmpfs','-o','mode=755','tmpfs','/var/lib');pathlib.Path('/var/lib/linux').mkdir(mode=0o700);pathlib.Path('/var/lib/letsencrypt').mkdir(mode=0o755);run('mount','--bind',str(root/'state'),'/var/lib/linux')
gui_mode=GUI_WORKER_PLACEHOLDER
pathlib.Path('/var/lib/dpkg').mkdir();run('mount','--bind',str(root/'host-dpkg'),'/var/lib/dpkg');run('mount','-o','remount,bind,ro','/var/lib/dpkg')
nginx_auth=NGINX_AUTH_WORKER
request={'domain':'eztoy.app','email':'certbot-test@eztoy.app','authenticator':'webroot','webroot':'/var/www/letsencrypt','installNginx':True,'staging':True,'confirm':True,'agree':True}
if not gui_mode:
 proc=subprocess.run(['/usr/bin/node','/usr/lib/tastedev-linux/scripts/admin/linux-admin','certificate'],input=json.dumps(request),capture_output=True,text=True,timeout=310)
 (root/'helper-stdout.log').write_text(proc.stdout);(root/'helper-stderr.log').write_text(proc.stderr)
 if proc.returncode:raise RuntimeError('Certificate helper failed; saved output')
 
else:
 import urllib.request
 env=dict(os.environ,PATH='/usr/bin:/usr/sbin:/bin',HOME=str(root),LANG='C.UTF-8',NEXT_TELEMETRY_DISABLED='1',LINUX_PACKAGED='true',LINUX_AUTH_ROOT=str(root/'auth'),LINUX_STATE_ROOT='/var/lib/linux',LINUX_WORKSPACE_ROOT=str(root/'workspace'),LINUX_ENABLE_ADMIN='true',BETTER_AUTH_URL='http://localhost:48979')
 setup="import {randomBytes} from 'node:crypto';import {writeFileSync} from 'node:fs';import {storeCredentials} from './lib/auth-store.mjs';import {passwordHash} from './lib/auth-password.mjs';import {defaultSecurity} from './lib/security.mjs';const username='cert-install-gui',password=randomBytes(32).toString('base64url');storeCredentials(username,await passwordHash(password));writeFileSync(process.env.HOME+'/gui-login.json',JSON.stringify({username,password}),{mode:0o600});writeFileSync(process.env.LINUX_STATE_ROOT+'/security.json',JSON.stringify({...defaultSecurity,readOnly:false,certificateChanges:true,sudoWithoutPrompt:true}),{mode:0o600});"
 subprocess.run(['/usr/bin/node','--input-type=module','-'],input=setup,text=True,cwd=root/'source',env=env,check=True,capture_output=True)
 webLog=open(root/'web.log','w');web=subprocess.Popen(['/usr/bin/node',str(root/'source/node_modules/next/dist/bin/next'),'dev','--webpack','--hostname','127.0.0.1','--port','48979'],cwd=root/'source',env=env,stdout=webLog,stderr=webLog)
 try:
  deadline=time.monotonic()+600
  while time.monotonic()<deadline:
   assert web.poll() is None,'GUI server stopped'
   try:
    if urllib.request.urlopen('http://127.0.0.1:48979/login',timeout=2).status==200:break
   except Exception:pass
   time.sleep(.2)
  else:raise RuntimeError('GUI startup timeout')
  (root/'gui-ready.json').write_text(json.dumps({'port':48979}))
  while not (root/'gui-done.json').exists():
   if (root/'gui-cancel').exists():raise RuntimeError('GUI canceled before issue')
   assert time.monotonic()<deadline and web.poll() is None,'GUI deadline exceeded'
   time.sleep(.2)
  assert json.loads((root/'gui-done.json').read_text())['status']=='PASS'
 finally:
  web.terminate()
  try:web.wait(timeout=15)
  except subprocess.TimeoutExpired:web.kill();web.wait(timeout=5)
  webLog.close()
text=pathlib.Path('/etc/nginx/conf.d/eztoy.conf').read_text();assert 'ssl_certificate' in text and '443' in text and 'https://' in text
assert int(pathlib.Path('/tmp/nginx-fixture.pid').read_text())==pid
renew=pathlib.Path('/etc/letsencrypt/renewal/eztoy.app.conf').read_text();assert ('authenticator = nginx' if nginx_auth else 'authenticator = webroot') in renew and 'installer = nginx' in renew
full=pathlib.Path('/etc/letsencrypt/live/eztoy.app/fullchain.pem');key=pathlib.Path('/etc/letsencrypt/live/eztoy.app/privkey.pem');assert full.exists() and key.exists()
# independent verifier enters only the dedicated daemon's network namespace.
verify="import ssl,socket,json,hashlib,sys,time\nfull=sys.argv[1];context=ssl.create_default_context(cafile=full);context.verify_flags|=ssl.VERIFY_X509_PARTIAL_CHAIN\nexpected=ssl.PEM_cert_to_DER_cert(open(full).read().split('-----END CERTIFICATE-----')[0]+'-----END CERTIFICATE-----\\n')\nfor i in range(100):\n try:\n  with socket.create_connection(('127.0.0.1',443),timeout=2) as tcp:\n   with context.wrap_socket(tcp,server_hostname='eztoy.app') as tls:\n    peer=tls.getpeercert(binary_form=True);assert peer==expected;tls.sendall(b'GET / HTTP/1.1\\r\\nHost: eztoy.app\\r\\nConnection: close\\r\\n\\r\\n');data=b''\n    while True:\n     chunk=tls.recv(65536)\n     if not chunk:break\n     data+=chunk\n    assert b'200 OK' in data and '한글 자동 HTTPS 연계'.encode() in data\n    print(json.dumps({'status':'PASS','tls':tls.version(),'peerSha256':hashlib.sha256(peer).hexdigest(),'hostnameVerified':True,'trustVerified':True,'koreanHttp200':True}));break\n except (ConnectionRefusedError,TimeoutError):time.sleep(.1)\nelse:raise RuntimeError('TLS listener unavailable')"
verification=subprocess.run(['nsenter','--net=/proc/'+str(pid)+'/ns/net','python3','-c',verify,str(full)],capture_output=True,text=True,timeout=30)
(root/'tls-stdout.log').write_text(verification.stdout);(root/'tls-stderr.log').write_text(verification.stderr)
if verification.returncode:raise RuntimeError('Independent TLS failed')
backups=list((root/'state/admin/nginx-config').glob('*.json'));assert len(backups)>=2
proof={'status':'PASS','guiVerified':gui_mode,'tlsProof':json.loads(verification.stdout),'nginxInstallerChangedConfig':True,'savedRenewalAuthenticator':'nginx' if nginx_auth else 'webroot','savedRenewalInstaller':'nginx','backups':len(backups),'privateMountNamespace':os.readlink('/proc/self/ns/mnt')!=os.readlink('/proc/1/ns/mnt'),'dedicatedNginxPid':pid,'sourceFilesMatched':len(FILES_COUNT_PLACEHOLDER)}
(root/'proof.json').write_text(json.dumps(proof))
""".replace('len(FILES_COUNT_PLACEHOLDER)',str(len(files))).replace('GUI_WORKER_PLACEHOLDER',repr(gui_mode)).replace('NGINX_AUTH_WORKER',repr(nginx_auth))
 (root/'worker.py').write_text(worker)
 child=subprocess.Popen(['unshare','--mount','--','python3',str(root/'worker.py'),str(root),str(pid)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,start_new_session=True)
 if gui_mode:
  deadline=time.monotonic()+680;announced=False;bridged={};interrupted=None
  while child.poll() is None:
   assert time.monotonic()<deadline,'GUI deadline'
   if nginx_auth:
    # Publish only responses served by the dedicated real nginx. The existing
    # public webroot is a test HTTP relay; never alter the operating nginx.
    import re
    for conf in (root/'nginx').rglob('*'):
     if not conf.is_file():continue
     try:content=conf.read_text()
     except (UnicodeError,OSError):continue
     for token in re.findall(r'location\s*=\s*/\.well-known/acme-challenge/([A-Za-z0-9_-]{20,200})',content):
      if token in bridged:continue
      if interrupted and token==interrupted['token']:
       active=list((root/'auth/certificate-jobs').glob('*.pending.json'))
       if any(json.loads(f.read_text()).get('id')==interrupted['jobId'] and not (f.parent/(interrupted['jobId']+'.log.json')).exists() for f in active):continue
      if interrupt_acme and interrupted is None:
       candidates=[];namespace=os.readlink('/proc/'+str(child.pid)+'/ns/mnt')
       for entry in pathlib.Path('/proc').iterdir():
        if not entry.name.isdigit():continue
        try:
         args=(entry/'cmdline').read_bytes().split(b'\0')
         if not args or pathlib.Path(args[0].decode()).name not in ['python3','certbot']:continue
         if b'/usr/bin/certbot' not in args or b'--nginx' not in args or b'--staging' not in args:continue
         if os.readlink(entry/'ns/mnt')!=namespace:continue
         stat=(entry/'stat').read_text();start=stat[stat.rfind(')')+2:].split()[19]
         candidates.append((int(entry.name),start,args))
        except (OSError,UnicodeError):continue
       assert len(candidates)==1,'Expected exactly one dedicated real Certbot child'
       nativePid,nativeStart,nativeArgs=candidates[0]
       pending=list((root/'auth/certificate-jobs').glob('*.pending.json'));assert len(pending)==1
       pendingRecord=json.loads(pending[0].read_text());assert pendingRecord['status']=='running'
       interrupted={'token':token,'pid':nativePid,'startTick':nativeStart,'namespace':namespace,'jobId':pendingRecord['id'],'signal':'SIGTERM','realChallengeConfigurationSha256':hashlib.sha256(content.encode()).hexdigest(),'realCertbotBinarySha256':hashlib.sha256(pathlib.Path('/usr/bin/certbot').read_bytes()).hexdigest(),'challengePublishedBeforeInterrupt':False}
       assert not (challenge/token).exists()
       os.kill(nativePid,signal.SIGSTOP)
       for attempt in range(100):
        stat=pathlib.Path('/proc/'+str(nativePid)+'/stat').read_text();parts=stat[stat.rfind(')')+2:].split();assert parts[19]==nativeStart
        if parts[0]=='T':break
        time.sleep(.005)
       else:raise RuntimeError('Dedicated Certbot pause failed')
       interrupted['nativePausedBeforeSignal']=True
       os.kill(nativePid,signal.SIGTERM);os.kill(nativePid,signal.SIGCONT)
       (root/'native-interruption.json').write_text(json.dumps(interrupted))
       continue
      query="import urllib.request,sys;req=urllib.request.Request('http://127.0.0.1/.well-known/acme-challenge/'+sys.argv[1],headers={'Host':'eztoy.app'});sys.stdout.buffer.write(urllib.request.urlopen(req,timeout=1).read(2048))"
      reply=subprocess.run(['nsenter','--net=/proc/'+str(pid)+'/ns/net','python3','-c',query,token],capture_output=True,timeout=3)
      if reply.returncode:continue
      body=reply.stdout
      if not re.fullmatch(re.escape(token.encode())+rb'\.[A-Za-z0-9_-]{20,200}',body):continue
      destination=challenge/token
      with destination.open('xb') as stream:stream.write(body)
      destination.chmod(0o644);bridged[token]=hashlib.sha256(body).hexdigest()
   assert time.monotonic()<deadline,'GUI deadline' 
   if (root/'gui-ready.json').exists() and not announced:
    print(json.dumps({'status':'GUI_READY','root':str(root),'port':48979,'unit':unit}),flush=True);announced=True
   time.sleep(.2)
 out,err=child.communicate(timeout=340);result['workerStdout']=out;result['workerStderr']=err
 if (root/'proof.json').exists():result.update(json.loads((root/'proof.json').read_text()))
 if interrupt_acme:
  result['actualAcmeInterruption']=interrupted
  failed=[json.loads(f.read_text()) for f in (root/'auth/certificate-jobs').glob('*.log.json') if json.loads(f.read_text()).get('status')=='failed']
  assert interrupted and len(failed)==1 and failed[0]['id']==interrupted['jobId']
  result['interruptedJob']={k:failed[0].get(k) for k in ['id','status','exitCode','signal','logs']}
  result['guiRetryAfterActualInterruption']=True
 for name in ['helper-stdout.log','helper-stderr.log','tls-stdout.log','tls-stderr.log']:
  if (root/name).exists():result[name]=(root/name).read_text()
except Exception as error:result.update(errorClass=type(error).__name__,errorMessage=str(error))
finally:
 if child is not None and child.poll() is None:
  os.killpg(child.pid,signal.SIGTERM)
  try:child.communicate(timeout=10)
  except subprocess.TimeoutExpired:os.killpg(child.pid,signal.SIGKILL);child.communicate(timeout=10)
 if created:subprocess.run(['systemctl','stop',unit],capture_output=True,timeout=30)
 result['unitStopped']=subprocess.run(['systemctl','is-active',unit],capture_output=True,text=True).stdout.strip() in ['inactive','failed','unknown']
 result['protectedFilesPreserved']=before=={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
 if nginx_auth:
  result['realNginxChallengeRelayCount']=len(locals().get('bridged',{}))
  for token,digest in locals().get('bridged',{}).items():
   file=challenge/token;assert file.is_file() and not file.is_symlink() and hashlib.sha256(file.read_bytes()).hexdigest()==digest;file.unlink()
  if not result['realNginxChallengeRelayCount']:result['status']='FAIL'
 result['challengeFilesPreserved']=challengeBefore=={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in challenge.iterdir() if p.is_file()}
 result['cronOrOtherServicesChanged']=False;result['helperSha256']=hashlib.sha256(helper.encode()).hexdigest()
 result['certbotSha256']=hashlib.sha256(pathlib.Path('/usr/bin/certbot').read_bytes()).hexdigest();result['nginxSha256']=hashlib.sha256(pathlib.Path('/usr/sbin/nginx').read_bytes()).hexdigest()
 shutil.rmtree(root);result['fixtureRemoved']=not root.exists()
 if not all(result[k] for k in ['unitStopped','protectedFilesPreserved','challengeFilesPreserved','fixtureRemoved']):result['status']='FAIL'
print(json.dumps(result))
'''.replace('FILES',repr(files),1).replace('HELPER',repr(helper),1).replace('SOURCES',repr(sources),1).replace('GUI_MODE',repr(gui_mode),1).replace('NGINX_AUTH',repr(nginx_auth),1).replace('INTERRUPT_ACME',repr(interrupt_acme),1)
evidence=project/'.runtime/verification'/(('certificate-acme-interrupted-original-gui-' if interrupt_acme else 'certificate-nginx-auth-original-gui-' if nginx_auth else 'certificate-webroot-nginx-native-')+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ'));evidence.mkdir(parents=True)
(evidence/'source-manifest.json').write_text(json.dumps({k:hashlib.sha256(v.encode()).hexdigest() for k,v in files.items()},indent=2))
command=['ssh','-i','/home/whitecalvin/.ssh/id_ed25519','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=8','whitecalvin@192.168.0.103','sudo -n python3 -']
if gui_mode:
 process=subprocess.Popen(command,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True);process.stdin.write(remote);process.stdin.close();lines=[]
 for line in process.stdout:
  lines.append(line)
  if line.startswith('{') and json.loads(line).get('status')=='GUI_READY':(evidence/'connection.json').write_text(line);print(line,flush=True)
 check=subprocess.CompletedProcess(command,process.wait(),''.join(lines),process.stderr.read())
else:check=subprocess.run(command,input=remote,capture_output=True,text=True,timeout=380)
(evidence/'transport-stdout.log').write_text(check.stdout);(evidence/'transport-stderr.log').write_text(check.stderr)
result=json.loads(check.stdout.splitlines()[-1]) if check.returncode==0 else {'status':'FAIL','transportExit':check.returncode}
(evidence/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':result['status'],'evidence':str(evidence/'result.json')}))
raise SystemExit(0 if result['status']=='PASS' else 1)
