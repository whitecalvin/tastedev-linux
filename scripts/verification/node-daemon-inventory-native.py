"""Approved QA-103 owned Node unit and read-only current daemon inventory."""
import pathlib,json,subprocess,datetime,hashlib
project=pathlib.Path.cwd();files={str(p.relative_to(project)):p.read_text() for p in (project/'lib').rglob('*') if p.is_file() and p.suffix in ['.mjs','.json']}
runner=r'''
import assert from 'node:assert/strict';import {serviceStatus} from './lib/operations.mjs';
const services=await serviceStatus(),id=process.env.FIXTURE_ID,row=services.find(row=>row.nodeAppId===id);
assert(row);assert.equal(row.unit,'tastedev-node-'+id+'.service');assert.equal(row.LoadState,'loaded');assert.equal(row.ActiveState,process.env.EXPECTED_STATE);assert.equal(row.nodeRegistry.apps[0].id,id);
console.log(JSON.stringify({unit:row.unit,nodeAppId:row.nodeAppId,LoadState:row.LoadState,ActiveState:row.ActiveState,SubState:row.SubState,registryVersion:row.registryVersion}));
'''
remote=r'''
import pathlib,tempfile,os,pwd,json,subprocess,shutil,hashlib
files=__FILES__;runner=__RUNNER__;assert os.getuid()==0
account=pwd.getpwnam('whitecalvin');assert account.pw_uid>0
base=pathlib.Path('/mnt/data/build/tastedev-linux-node');base.mkdir(mode=0o755,exist_ok=True)
assert base.is_dir() and not base.is_symlink() and not base.stat().st_mode&0o022 and base.stat().st_mode&0o001
root=pathlib.Path(tempfile.mkdtemp(prefix='node-daemon-',dir=base));os.chown(root,account.pw_uid,account.pw_gid);root.chmod(0o700)
identity='inventory-'+root.name.split('-')[-1];unit='tastedev-node-'+identity+'.service';unitFile=pathlib.Path('/run/systemd/system')/unit;created=False;result={'status':'FAIL'}
protected=pathlib.Path('/usr/lib/tastedev-linux/scripts/admin/linux-admin');before=hashlib.sha256(protected.read_bytes()).hexdigest()
def run(args):return subprocess.run(args,check=True,capture_output=True,text=True,timeout=20)
try:
 assert not unitFile.exists()
 for name,text in files.items():
  file=root/name;file.parent.mkdir(parents=True,exist_ok=True);file.write_text(text)
 (root/'package.json').write_text('{"type":"module"}');(root/'run.mjs').write_text(runner);(root/'server.mjs').write_text('setInterval(()=>{},1000);\n');(root/'.env').write_text('')
 registry=root/'state/node-apps';registry.mkdir(parents=True,mode=0o700)
 profile={'id':identity,'label':'전용 Node 데몬 검수','directory':str(root),'entry':'server.mjs','environmentFile':'.env'}
 (registry/'apps.json').write_text(json.dumps([profile]))
 for file in [root,*root.rglob('*')]:os.chown(file,account.pw_uid,account.pw_gid);file.chmod(0o700 if file.is_dir() else 0o600)
 unitFile.write_text('[Unit]\nDescription=Owned Tastedev Node inventory fixture\n[Service]\nType=simple\nUser='+str(account.pw_uid)+'\nGroup='+str(account.pw_gid)+'\nExecStart=/usr/bin/node '+str(root/'server.mjs')+'\nPrivateNetwork=yes\nNoNewPrivileges=yes\nRestart=no\n');created=True
 run(['systemctl','daemon-reload']);run(['systemctl','start',unit]);pid=int(run(['systemctl','show',unit,'--property=MainPID','--value']).stdout.strip());assert pid>0
 def inspect(state):
  command=['runuser','-u',account.pw_name,'--','env','LINUX_STATE_ROOT='+str(root/'state'),'FIXTURE_ID='+identity,'EXPECTED_STATE='+state,'TMPDIR='+str(root),'TMP='+str(root),'TEMP='+str(root),'/usr/bin/node',str(root/'run.mjs')]
  return json.loads(run(command).stdout)
 active=inspect('active');run(['systemctl','stop',unit]);inactive=inspect('inactive');assert int(run(['systemctl','show',unit,'--property=MainPID','--value']).stdout.strip())==0
 result.update(status='PASS',active=active,inactive=inactive,initialNativePid=pid,nativeAccountUid=account.pw_uid)
except Exception as error:result['errorClass']=type(error).__name__;result['diagnosticSha256']=hashlib.sha256(str(error).encode()).hexdigest()
finally:
 if created:subprocess.run(['systemctl','stop',unit],capture_output=True,timeout=20);unitFile.unlink(missing_ok=True);subprocess.run(['systemctl','daemon-reload'],capture_output=True,timeout=20)
 result['dedicatedUnitRemoved']=not unitFile.exists();result['installedHelperPreserved']=hashlib.sha256(protected.read_bytes()).hexdigest()==before
 shutil.rmtree(root);result['privateStageRemoved']=not root.exists()
print(json.dumps(result))
'''.replace('__FILES__',repr(files)).replace('__RUNNER__',repr(runner))
run=subprocess.run(['ssh','-F','/dev/null','-i','/home/whitecalvin/.ssh/id_ed25519','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','whitecalvin@192.168.0.103','sudo -n python3 -'],input=remote,capture_output=True,text=True,timeout=180)
folder=project/'.runtime/verification'/('node-daemon-inventory-native-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ'));folder.mkdir(parents=True)
(folder/'transport-stdout.log').write_text(run.stdout);(folder/'transport-stderr.log').write_text(run.stderr)
result=json.loads(run.stdout) if run.returncode==0 else {'status':'FAIL','transportExit':run.returncode};result['sourceSha256']={name:hashlib.sha256(text.encode()).hexdigest() for name,text in files.items()}
(folder/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'evidence':str(folder/'result.json'),**{k:v for k,v in result.items() if k!='sourceSha256'}},ensure_ascii=False))
raise SystemExit(0 if result['status']=='PASS' and result['dedicatedUnitRemoved'] and result['privateStageRemoved'] and result['installedHelperPreserved'] else 1)
