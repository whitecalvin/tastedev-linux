"""Prepared launcher: execution is only for the separately approved GUI transfer.
Run as root in an already private mount namespace; it does not create a cluster.
"""
import argparse, hashlib, json, os, pathlib, re, subprocess
parser=argparse.ArgumentParser()
parser.add_argument('--plan',action='store_true')
parser.add_argument('--execute',action='store_true')
parser.add_argument('--root')
parser.add_argument('--port',type=int)
parser.add_argument('--origin-host',choices=['127.0.0.1','localhost'],default='localhost')
args=parser.parse_args()
if args.plan:
 print(json.dumps({'scope':'temporary original Next.js GUI and authenticated API','cluster':'18/linuxverify20261008','requiresSeparateSourceTransferApproval':True,'operatingHelperReplaced':False,'mounts':'private namespace only','credentials':'disposable account, private output file only','listen':'127.0.0.1','existingServicesStarted':False}))
 raise SystemExit(0)
assert args.execute and os.getuid()==0
assert args.root and re.fullmatch(r'/mnt/data/build/tastedev-linux/tastedev-postgresql-gui-[a-zA-Z0-9_-]+',args.root)
assert args.port and 1024<=args.port<=65535
assert os.readlink('/proc/self/ns/mnt')!=os.readlink('/proc/1/ns/mnt'),'requires private mount namespace'
root=pathlib.Path(args.root)
assert root.is_dir() and not root.is_symlink() and root.stat().st_uid==0 and not root.stat().st_mode&0o077
source=root/'source';stage=root/'admin';state=root/'state';auth=root/'auth';workspace=root/'workspace'
for folder in [source,stage]:
 assert folder.is_dir() and not folder.is_symlink() and folder.stat().st_uid==0 and not folder.stat().st_mode&0o022
for folder in [state,auth,workspace]:folder.mkdir(mode=0o700)
manifest=json.loads((root/'source-manifest.json').read_text())
for name,digest in manifest.items():
 assert not pathlib.PurePosixPath(name).is_absolute() and '..' not in pathlib.PurePosixPath(name).parts
 file=source/name
 assert file.is_file() and not file.is_symlink() and file.stat().st_uid==0 and not file.stat().st_mode&0o022
 assert hashlib.sha256(file.read_bytes()).hexdigest()==digest
assert not list(source.glob('.env*'))
marker=pathlib.Path('/etc/postgresql/18/linuxverify20261008/.tastedev-verification')
assert marker.read_text()=='owned disposable systemd fixture linuxverify20261008\n'
unit=subprocess.check_output(['/usr/bin/systemctl','show','postgresql@18-linuxverify20261008.service','--property=ActiveState,MainPID'],text=True)
assert 'ActiveState=active' in unit and re.search(r'MainPID=[1-9][0-9]*',unit)
def mount(*values):subprocess.run(['/usr/bin/mount',*values],check=True)
mount('--make-rprivate','/')
mount('--bind',str(stage),'/usr/lib/tastedev-linux/scripts/admin')
mount('--bind',str(root/'admin-helper.sha256'),'/usr/lib/tastedev-linux/admin-helper.sha256')
saved=root/'host-postgresql';saved.mkdir(mode=0o700)
mount('--bind','/var/lib/postgresql',str(saved))
saved_dpkg=root/'host-dpkg';saved_dpkg.mkdir(mode=0o700)
mount('--bind','/var/lib/dpkg',str(saved_dpkg))
mount('-t','tmpfs','-o','mode=755','tmpfs','/var/lib')
pathlib.Path('/var/lib/postgresql').mkdir(mode=0o755)
pathlib.Path('/var/lib/linux').mkdir(mode=0o700)
mount('--bind',str(saved),'/var/lib/postgresql')
pathlib.Path('/var/lib/dpkg').mkdir(mode=0o755)
mount('--bind',str(saved_dpkg),'/var/lib/dpkg')
mount('-o','remount,bind,ro','/var/lib/dpkg')
mount('--bind',str(state),'/var/lib/linux')
env={'PATH':'/usr/bin:/usr/sbin:/bin','HOME':str(root),'TMPDIR':str(root),'TMP':str(root),'TEMP':str(root),'LANG':'C.UTF-8','LC_ALL':'C.UTF-8','NEXT_TELEMETRY_DISABLED':'1','LINUX_PACKAGED':'true','LINUX_AUTH_ROOT':str(auth),'LINUX_STATE_ROOT':str(state),'LINUX_WORKSPACE_ROOT':str(workspace),'LINUX_ENABLE_ADMIN':'true','LINUX_ENABLE_CRON':'false','LINUX_ENABLE_INSTALL':'false','LINUX_ENABLE_TERMINAL':'false','LINUX_ENABLE_AI':'false','LINUX_ENABLE_SUDO_POLICY':'false','LINUX_COOKIE_SECURE':'false','BETTER_AUTH_URL':'http://'+args.origin_host+':'+str(args.port)}
setup="""import {randomBytes} from 'node:crypto';import {writeFileSync} from 'node:fs';import {storeCredentials} from './lib/auth-store.mjs';import {passwordHash} from './lib/auth-password.mjs';import {defaultSecurity} from './lib/security.mjs';
const username='pg-gui-fixture',password=randomBytes(32).toString('base64url');storeCredentials(username,await passwordHash(password));
writeFileSync(process.env.LINUX_STATE_ROOT+'/security.json',JSON.stringify({...defaultSecurity,readOnly:false,databaseChanges:true,sudoWithoutPrompt:true}),{mode:0o600});
writeFileSync(process.env.HOME+'/gui-login.json',JSON.stringify({username,password,baseURL:process.env.BETTER_AUTH_URL}),{flag:'wx',mode:0o600});
"""
subprocess.run(['/usr/bin/node','--input-type=module','-'],input=setup,text=True,cwd=source,env=env,check=True)
os.chdir(source)
os.execve('/usr/bin/node',['/usr/bin/node',str(source/'node_modules/next/dist/bin/next'),'dev','--webpack','--hostname','127.0.0.1','--port',str(args.port)],env)
