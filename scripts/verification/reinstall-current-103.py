"""User-authorized final web DEB update. Preserve accounts/config and rollback code.
All new remote work stays under /mnt/data/build/tastedev-linux.
"""
import hashlib,json,pathlib,shlex,subprocess,sys,datetime,secrets

project=pathlib.Path.cwd()
package=pathlib.Path(sys.argv[1]).resolve()
assert package.is_relative_to(pathlib.Path('/mnt/data/build/tastedev-linux'))
assert package.name=='tastedev-linux_0.1.0_amd64.deb'
digest=hashlib.sha256(package.read_bytes()).hexdigest()
identity=secrets.token_hex(16)
stage='/mnt/data/build/tastedev-linux/deployment-'+identity
evidence=pathlib.Path('/mnt/data/build/tastedev-linux')/('final-web-reinstall-103-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
evidence.mkdir(mode=0o700)
ssh=['ssh','-F','/dev/null','-i','/home/whitecalvin/.ssh/id_ed25519','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','whitecalvin@192.168.0.103']
def remote(code,timeout=60):
 command='sudo -n /usr/bin/python3 -'
 result=subprocess.run(ssh+[command],input=code,text=True,capture_output=True,timeout=timeout)
 if result.returncode:
  raise RuntimeError('Remote deployment step failed; inspect private deployment evidence. '+result.stderr[-1000:])
 return json.loads(result.stdout)
parameters=json.dumps({'stage':stage,'identity':identity,'digest':digest})
common='''
import pathlib,os,json,hashlib,subprocess,stat,urllib.request,urllib.error,time,tarfile
p=__PARAMETERS__;root=pathlib.Path(p['stage']);assert os.getuid()==0
assert root.parent==pathlib.Path('/mnt/data/build/tastedev-linux')
def command(args,**kwargs):return subprocess.run(args,check=True,capture_output=True,text=True,timeout=90,**kwargs)
def owned():
 st=root.lstat();assert stat.S_ISDIR(st.st_mode) and st.st_uid==0 and not st.st_mode&0o077
 assert (root/'identity').read_text()==p['identity']
 os.environ.update(TMPDIR=str(root),TMP=str(root),TEMP=str(root))
def service():
 text=command(['/usr/bin/systemctl','show','tastedev-linux.service','--property=ActiveState,MainPID,User','--no-pager']).stdout
 return dict(line.split('=',1) for line in text.splitlines())
def protected():
 paths=[pathlib.Path('/etc/tastedev-linux'),pathlib.Path('/etc/systemd/system/tastedev-linux.service.d'),pathlib.Path('/var/lib/tastedev-linux')]
 result={}
 for folder in paths:
  if not folder.exists():continue
  for f in sorted(folder.rglob('*')):
   if f.is_symlink():result[str(f)]={'link':os.readlink(f)}
   elif f.is_file():result[str(f)]={'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'uid':f.stat().st_uid,'mode':stat.S_IMODE(f.stat().st_mode)}
 return result
'''.replace('__PARAMETERS__',parameters)
try:
 prepared=remote(common+'''
base=root.parent;st=base.lstat();assert stat.S_ISDIR(st.st_mode) and not base.is_symlink() and st.st_uid==0 and not st.st_mode&0o022
root.mkdir(mode=0o700);(root/'identity').write_text(p['identity']);(root/'identity').chmod(0o600);owned()
print(json.dumps({'stage':str(root),'service':service(),'node':command(['/usr/bin/node','--version']).stdout.strip()}))
''')
 (evidence/'prepared.json').write_text(json.dumps(prepared,indent=2)+'\n')
 upload='sudo -n /usr/bin/python3 -c '+shlex.quote("import os,sys,pathlib; p=pathlib.Path("+repr(stage+'/package.deb')+"); fd=os.open(p,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600); f=os.fdopen(fd,'wb'); import shutil; shutil.copyfileobj(sys.stdin.buffer,f); f.close()")
 with package.open('rb') as stream:
  subprocess.run(ssh+[upload],stdin=stream,stdout=subprocess.DEVNULL,check=True,timeout=120)
 preflight=remote(common+'''
owned();deb=root/'package.deb';assert hashlib.sha256(deb.read_bytes()).hexdigest()==p['digest']
assert command(['/usr/bin/dpkg-deb','--field',str(deb),'Package']).stdout.strip()=='tastedev-linux'
command(['/usr/bin/dpkg-deb','-x',str(deb),str(root/'candidate')])
app=root/'candidate/usr/lib/tastedev-linux'
code="const Database=require(process.argv[1]);const db=new Database(':memory:');if(db.prepare('select 1 as value').get().value!==1)process.exit(1);db.close();console.log('AUTH_DATABASE_NATIVE_OK');"
native=command(['/usr/bin/node','-e',code,str(app/'node_modules/better-sqlite3')]).stdout.strip()
assert native=='AUTH_DATABASE_NATIVE_OK'
for name in ['nodejs','adduser','util-linux','bubblewrap','init-system-helpers']:
 assert command(['/usr/bin/dpkg-query','-W','-f=${Status}',name]).stdout.strip()=='install ok installed'
version=command(['/usr/bin/node','-p','process.versions.node']).stdout.strip();assert int(version.split('.')[0])>=22
before={'service':service(),'buildId':pathlib.Path('/usr/lib/tastedev-linux/.next/BUILD_ID').read_text().strip(),'protected':protected()}
(root/'before.json').write_text(json.dumps(before));(root/'before.json').chmod(0o600)
print(json.dumps({'nativeAuthenticationModule':native,'node':version,'newBuildId':(app/'.next/BUILD_ID').read_text().strip(),'beforeBuildId':before['buildId'],'protectedFileCount':len(before['protected'])}))
''',120)
 (evidence/'preflight.json').write_text(json.dumps(preflight,indent=2)+'\n')
 result=remote(common+'''
owned();before=json.loads((root/'before.json').read_text());assert service()['MainPID']==before['service']['MainPID'];assert pathlib.Path('/usr/lib/tastedev-linux/.next/BUILD_ID').read_text().strip()==before['buildId']
assert hashlib.sha256((root/'package.deb').read_bytes()).hexdigest()==p['digest']
archive=root/'rollback.tar';originalPaths=['usr/lib/tastedev-linux','usr/bin/tastedev-linux','usr/lib/systemd/system/tastedev-linux.service','etc/tastedev-linux','etc/systemd/system/tastedev-linux.service.d','var/lib/tastedev-linux']
paths=[name for name in originalPaths if pathlib.Path('/',name).exists()]
command(['/usr/bin/systemctl','stop','tastedev-linux.service'])
backupComplete=False
try:
 stable=protected();(root/'protected-stopped.json').write_text(json.dumps(stable));(root/'protected-stopped.json').chmod(0o600)
 with tarfile.open(archive,'w') as tar:
  for name in paths:tar.add('/'+name,arcname=name)
 archive.chmod(0o600);backupComplete=True
 installed=subprocess.run(['/usr/bin/dpkg','-i',str(root/'package.deb')],capture_output=True,text=True,timeout=180)
 (root/'install.stdout.log').write_text(installed.stdout);(root/'install.stderr.log').write_text(installed.stderr)
 assert installed.returncode==0,'DEB installation failed'
 deadline=time.time()+45
 while time.time()<deadline:
  state=service()
  if state['ActiveState']=='active' and int(state['MainPID'])>0:
   try:
    with urllib.request.urlopen('http://127.0.0.1:8791/login',timeout=3) as response:
     if response.status==200:break
   except Exception:pass
  time.sleep(.5)
 else:raise RuntimeError('Installed application did not become healthy')
 assert protected()==stable,'Existing accounts or configuration changed'
 with urllib.request.urlopen('http://127.0.0.1:8791/api/auth/status',timeout=5) as response:
  auth=json.load(response)
 request=urllib.request.Request('http://127.0.0.1:8791/api/operations')
 try:urllib.request.urlopen(request,timeout=5);raise AssertionError('Protected API accepted unauthenticated request')
 except urllib.error.HTTPError as error:assert error.code==401
 new=pathlib.Path('/usr/lib/tastedev-linux/.next/BUILD_ID').read_text().strip()
 candidate=(root/'candidate/usr/lib/tastedev-linux/.next/BUILD_ID').read_text().strip();assert new==candidate and new!=before['buildId']
 result={'status':'PASS_INSTALLED_CURRENT_WEB_DEB_UPDATE_SCOPE','sha256':p['digest'],'buildId':new,'previousBuildId':before['buildId'],'service':state,'loginHttp':200,'publicAuthStatusHttp':200,'protectedApiHttp':401,'existingAccountsAndConfigurationPreserved':True,'accountConfigured':auth.get('configured'),'rollbackArchive':str(archive),'wholeProductComplete':False}
except Exception:
 command(['/usr/bin/systemctl','stop','tastedev-linux.service'])
 if backupComplete:command(['/usr/bin/tar','--extract','--file',str(archive),'--directory','/'])
 command(['/usr/bin/systemctl','daemon-reload']);command(['/usr/bin/systemctl','start','tastedev-linux.service'])
 raise
(root/'result.json').write_text(json.dumps(result));(root/'result.json').chmod(0o600)
print(json.dumps(result))
''',300)
 (evidence/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'result':result,'evidence':str(evidence)}),flush=True)
except Exception as error:
 (evidence/'failure.json').write_text(json.dumps({'status':'NOT_COMPLETED','stage':stage,'error':str(error),'wholeProductComplete':False},indent=2)+'\n')
 raise
