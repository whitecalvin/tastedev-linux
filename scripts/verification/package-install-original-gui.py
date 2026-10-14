"""Current-source package installation GUI in owned disposable QA-103 Docker.
No host package/service/sudo modifications. No secrets included in source transfer.
"""
import argparse,base64,hashlib,io,json,pathlib,re,subprocess,tarfile
p=argparse.ArgumentParser();p.add_argument('action',choices=['prepare','status','cleanup']);p.add_argument('--connection',required=True);p.add_argument('--port',type=int,default=48977);p.add_argument('--sudo-policy',action='store_true');p.add_argument('--sudo-enable-preview',action='store_true');a=p.parse_args();project=pathlib.Path.cwd();target=pathlib.Path(a.connection).resolve();assert target.is_relative_to(project/'.runtime/verification');assert 1024<=a.port<=65535
assert not a.sudo_enable_preview or a.sudo_policy
params={'action':a.action,'port':a.port,'sudoPolicy':a.sudo_policy,'sudoEnablePreview':a.sudo_enable_preview}
if a.action=='prepare':
 files={}
 for folder in ['app','components','lib','public']:
  for f in sorted((project/folder).rglob('*')):
   assert not f.is_symlink()
   if f.is_file():files[str(f.relative_to(project))]=f.read_bytes()
 for f in ['package.json','next.config.mjs','scripts/admin/linux-admin','scripts/admin/package.json']:files[f]=(project/f).read_bytes()
 b=io.BytesIO()
 with tarfile.open(fileobj=b,mode='w') as t:
  for name,raw in files.items():
   entry=tarfile.TarInfo(name);entry.size=len(raw);entry.mode=0o644;t.addfile(entry,io.BytesIO(raw))
 params.update(archive=base64.b64encode(b.getvalue()).decode(),manifest={n:hashlib.sha256(v).hexdigest() for n,v in files.items()},runtimeNames=re.findall(r"'([^']+\.mjs)'",(project/'scripts/admin/runtime-files.mjs').read_text()))
else:params.update(json.loads(target.read_text()))
remote=r'''
import pathlib,json,os,io,base64,tarfile,hashlib,subprocess,tempfile,re,shutil
p=__PARAMS__;assert os.getuid()==0
image='sha256:3a84f7c8110bbf7a1a55afcac2623be43ed0c48f912a02ff10b8607e6452aac3'
def run(argv):return subprocess.run(argv,check=True,capture_output=True,text=True,timeout=60)
if p['action']=='prepare':
 base=pathlib.Path('/mnt/data/build/tastedev-linux/package-gui');base.mkdir(parents=True,mode=0o755,exist_ok=True)
 assert base.is_dir() and not base.is_symlink() and base.stat().st_uid==0 and not base.stat().st_mode&0o022
 root=pathlib.Path(tempfile.mkdtemp(prefix='tastedev-package-gui-',dir=base));root.chmod(0o755);identity=os.urandom(24).hex();(root/'identity').write_text(identity);(root/'identity').chmod(0o600);name='tastedev-package-gui-'+identity[:12]
 source=root/'source';source.mkdir(mode=0o755);t=tarfile.open(fileobj=io.BytesIO(base64.b64decode(p['archive'])));assert {m.name for m in t.getmembers()}==set(p['manifest'])
 for m in t.getmembers():
  assert m.isfile() and not pathlib.PurePosixPath(m.name).is_absolute() and '..' not in pathlib.PurePosixPath(m.name).parts
  raw=t.extractfile(m).read();assert hashlib.sha256(raw).hexdigest()==p['manifest'][m.name];f=source/m.name;f.parent.mkdir(parents=True,exist_ok=True);f.write_bytes(raw);f.chmod(0o644)
 for f in [source,*source.rglob('*')]:os.chown(f,1000,1000)
 stage=root/'admin';runtime=stage/'runtime';runtime.mkdir(parents=True);manifest={}
 for n in ['linux-admin','package.json']:shutil.copyfile(source/'scripts/admin'/n,stage/n)
 (stage/'linux-admin').chmod(0o755)
 for n in p['runtimeNames']:
  assert re.fullmatch(r'[a-z0-9-]+\.mjs',n);raw=(source/'lib'/n).read_bytes();(runtime/n).write_bytes(raw);manifest[n]=hashlib.sha256(raw).hexdigest()
 (runtime/'manifest.json').write_text(json.dumps(manifest));(root/'admin-helper.sha256').write_text(hashlib.sha256((stage/'linux-admin').read_bytes()).hexdigest()+'\n');(root/'source-manifest.json').write_text(json.dumps(p['manifest']))
 setup="""import {randomBytes} from 'node:crypto';import {writeFileSync} from 'node:fs';import {storeCredentials} from '/mnt/data/build/tastedev-linux/package-fixture/source/lib/auth-store.mjs';import {passwordHash} from '/mnt/data/build/tastedev-linux/package-fixture/source/lib/auth-password.mjs';import {defaultSecurity} from '/mnt/data/build/tastedev-linux/package-fixture/source/lib/security.mjs';const username='package-gui-fixture',password=randomBytes(32).toString('base64url');storeCredentials(username,await passwordHash(password));writeFileSync('/mnt/data/build/tastedev-linux/package-fixture/gui-login.json',JSON.stringify({username,password}),{mode:0o600});writeFileSync(process.env.LINUX_STATE_ROOT+'/security.json',JSON.stringify({...defaultSecurity,readOnly:false,packageInstall:true,sudoWithoutPrompt:true}),{mode:0o600});"""
 if p.get('sudoPolicy'):
  setup=setup.replace('packageInstall:true,sudoWithoutPrompt:true','packageInstall:false,sudoPolicyChanges:true,sudoWithoutPrompt:true')
 (root/'setup.mjs').write_text(setup);(root/'setup.mjs').chmod(0o644)
 entry="""#!/bin/sh
set -eu
export DEBIAN_FRONTEND=noninteractive
mkdir -p /mnt/data/build/tastedev-linux/package-fixture/workspace
export TMPDIR=/mnt/data/build/tastedev-linux/package-fixture/workspace TMP=/mnt/data/build/tastedev-linux/package-fixture/workspace TEMP=/mnt/data/build/tastedev-linux/package-fixture/workspace
apt-get update > /mnt/data/build/tastedev-linux/package-fixture/preflight.log 2>&1
apt-get install --yes --no-remove --no-upgrade sudo >> /mnt/data/build/tastedev-linux/package-fixture/preflight.log 2>&1
useradd --uid 1000 --create-home --shell /bin/sh packageqa
printf 'packageqa ALL=(root) NOPASSWD: /usr/lib/tastedev-linux/scripts/admin/linux-admin\\n' > /etc/sudoers.d/tastedev-package-qa
chmod 440 /etc/sudoers.d/tastedev-package-qa
/usr/sbin/visudo -cf /etc/sudoers.d/tastedev-package-qa >> /mnt/data/build/tastedev-linux/package-fixture/preflight.log 2>&1
mkdir -p /mnt/data/build/tastedev-linux/package-fixture/auth /mnt/data/build/tastedev-linux/package-fixture/state /mnt/data/build/tastedev-linux/package-fixture/workspace /var/lib/linux
chmod 700 /var/lib/linux
chown 1000:1000 /mnt/data/build/tastedev-linux/package-fixture/auth /mnt/data/build/tastedev-linux/package-fixture/state /mnt/data/build/tastedev-linux/package-fixture/workspace
chmod 700 /mnt/data/build/tastedev-linux/package-fixture/auth /mnt/data/build/tastedev-linux/package-fixture/state /mnt/data/build/tastedev-linux/package-fixture/workspace
ln -s /usr/lib/tastedev-linux/node_modules /mnt/data/build/tastedev-linux/package-fixture/source/node_modules
# Only this owned fixture directory is writable by the disposable account.
chown 1000:1000 /mnt/data/build/tastedev-linux/package-fixture
cd /mnt/data/build/tastedev-linux/package-fixture/source
runuser -u packageqa --preserve-environment -- /usr/bin/node /mnt/data/build/tastedev-linux/package-fixture/setup.mjs
printf 'GUI_READY\\n' > /mnt/data/build/tastedev-linux/package-fixture/ready
exec runuser -u packageqa --preserve-environment -- /usr/bin/node node_modules/next/dist/bin/next dev --webpack --hostname 0.0.0.0 --port 8787
"""
 if p.get('sudoPolicy'):
  provision="""/usr/bin/node --input-type=module -e "import {sudoPolicyPlan} from '/mnt/data/build/tastedev-linux/package-fixture/source/lib/sudo-policy.mjs';import {writeFileSync} from 'node:fs';writeFileSync('/etc/sudoers.d/tastedev-linux-helper',sudoPolicyPlan({passwordless:true,actions:['sudo-policy-inspect','sudo-policy-update']},{username:'packageqa',uid:1000}).text,{mode:0o440});"
rm /etc/sudoers.d/tastedev-package-qa
/usr/sbin/visudo -c >> /mnt/data/build/tastedev-linux/package-fixture/preflight.log 2>&1
"""
  entry=entry.replace("printf 'GUI_READY",provision+"printf 'GUI_READY")
  if p.get('sudoEnablePreview'):
   # Keep the control plane separate: the target nginx-check command initially
   # requires a password. This is not evidence that the GUI enabled NOPASSWD.
   entry=entry.replace("passwordless:true,actions:['sudo-policy-inspect','sudo-policy-update']", "passwordless:false,actions:['nginx-check']")
   control="""printf 'packageqa ALL=(root) NOPASSWD: /usr/lib/tastedev-linux/scripts/admin/linux-admin sudo-policy-inspect, /usr/lib/tastedev-linux/scripts/admin/linux-admin sudo-policy-update\\n' > /etc/sudoers.d/tastedev-qa-policy-control
chmod 440 /etc/sudoers.d/tastedev-qa-policy-control
/usr/sbin/visudo -c >> /mnt/data/build/tastedev-linux/package-fixture/preflight.log 2>&1
"""
   entry=entry.replace("printf 'GUI_READY",control+"printf 'GUI_READY")
 (root/'entry.sh').write_text(entry);(root/'entry.sh').chmod(0o755)
 args=['docker','run','--detach','--name',name,'--label','tastedev.qa.identity='+identity,'--publish','127.0.0.1:'+str(p['port'])+':8787','--mount','type=bind,src='+str(root)+',dst=/mnt/data/build/tastedev-linux/package-fixture','--mount','type=bind,src='+str(stage)+',dst=/usr/lib/tastedev-linux/scripts/admin,readonly','--mount','type=bind,src='+str(root/'admin-helper.sha256')+',dst=/usr/lib/tastedev-linux/admin-helper.sha256,readonly','--mount','type=bind,src=/usr/lib/tastedev-linux/node_modules,dst=/usr/lib/tastedev-linux/node_modules,readonly']
 env={'LINUX_PACKAGED':'true','LINUX_ENABLE_ADMIN':'true','LINUX_ENABLE_INSTALL':'true','LINUX_ENABLE_AI':'false','LINUX_ENABLE_TERMINAL':'false','LINUX_ENABLE_CRON':'false','LINUX_ENABLE_SUDO_POLICY':'true' if p.get('sudoPolicy') else 'false','LINUX_AUTH_ROOT':'/mnt/data/build/tastedev-linux/package-fixture/auth','LINUX_STATE_ROOT':'/mnt/data/build/tastedev-linux/package-fixture/state','LINUX_WORKSPACE_ROOT':'/mnt/data/build/tastedev-linux/package-fixture/workspace','BETTER_AUTH_URL':'http://localhost:'+str(p['port']),'NEXT_TELEMETRY_DISABLED':'1','HOME':'/home/packageqa','LANG':'C.UTF-8','TMPDIR':'/mnt/data/build/tastedev-linux/package-fixture/workspace','TMP':'/mnt/data/build/tastedev-linux/package-fixture/workspace','TEMP':'/mnt/data/build/tastedev-linux/package-fixture/workspace'}
 for k,v in env.items():args+=['--env',k+'='+v]
 args+=[image,'/mnt/data/build/tastedev-linux/package-fixture/entry.sh'];container=run(args).stdout.strip();connection={'root':str(root),'identity':identity,'container':container,'name':name,'port':p['port'],'image':image,'sourceFiles':len(p['manifest']),'sudoEnablePreview':bool(p.get('sudoEnablePreview'))};(root/'connection.json').write_text(json.dumps(connection));print(json.dumps(connection))
else:
 root=pathlib.Path(p['root']);assert re.fullmatch(r'/mnt/data/build/tastedev-linux/package-gui/tastedev-package-gui-[a-zA-Z0-9_-]+',str(root));assert not root.is_symlink() and (root/'identity').read_text()==p['identity'];info=json.loads(run(['docker','inspect',p['container']]).stdout)[0];assert info['Id']==p['container'] and info['Config']['Labels']['tastedev.qa.identity']==p['identity'] and info['Image']==image
 if p['action']=='status':print(json.dumps({'running':info['State']['Running'],'exitCode':info['State']['ExitCode'],'ready':(root/'ready').exists(),'preflightTail':(root/'preflight.log').read_text()[-1500:] if (root/'preflight.log').exists() else ''}))
 else:
  run(['docker','stop','--time','20',p['container']]);(root/'docker.log').write_text(run(['docker','logs',p['container']]).stdout);run(['docker','rm',p['container']]);shutil.rmtree(root);print(json.dumps({'status':'CLEANED','ownedContainerRemoved':True,'privateStageRemoved':True,'hostPackagesChanged':False}))
'''.replace('__PARAMS__',repr(params))
r=subprocess.run(['ssh','-F','/dev/null','-i','/home/whitecalvin/.ssh/id_ed25519','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','whitecalvin@192.168.0.103','sudo -n python3 -'],input=remote,text=True,capture_output=True,timeout=120)
if r.returncode:print(r.stderr[-2000:]);raise SystemExit(r.returncode)
data=json.loads(r.stdout);target.parent.mkdir(parents=True,exist_ok=True)
if a.action=='prepare':
 target.write_text(json.dumps(data,indent=2)+'\n');(target.parent/'source-manifest.json').write_text(json.dumps(params['manifest'],indent=2)+'\n')
else:(target.parent/(a.action+'.json')).write_text(json.dumps(data,indent=2)+'\n')
print(json.dumps(data))
