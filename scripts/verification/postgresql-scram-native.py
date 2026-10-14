"""Approved QA-103: unique disposable loopback PostgreSQL cluster; no DEB build."""
import base64,hashlib,io,json,pathlib,re,subprocess,tarfile,uuid
project=pathlib.Path.cwd()
prepared=json.loads(subprocess.run(['node',str(project/'scripts/verification/postgresql-scram-payload.ts')],check=True,capture_output=True,text=True,timeout=120).stdout)
assert prepared['format']=='tastedev-scram-runtime-v1' and isinstance(prepared['files'],dict)
files={}
for name,value in prepared['files'].items():
 assert name=='worker.mjs' or re.fullmatch(r'runtime/[a-z0-9-]+\.mjs',name)
 files[name]=base64.b64decode(value,validate=True)
stream=io.BytesIO()
with tarfile.open(fileobj=stream,mode='w:gz') as archive:
 for name,data in files.items():
  entry=tarfile.TarInfo(name);entry.size=len(data);entry.mode=0o644;archive.addfile(entry,io.BytesIO(data))
payload={'archive':base64.b64encode(stream.getvalue()).decode(),'manifest':{n:hashlib.sha256(v).hexdigest() for n,v in files.items()}}
remote=r'''
import base64,hashlib,io,json,os,pathlib,secrets,shutil,socket,subprocess,tarfile,tempfile
p=__PAYLOAD__;assert os.getuid()==0
base=pathlib.Path('/mnt/data/build/tastedev-linux');assert base.is_dir() and not base.is_symlink() and base.stat().st_uid==0 and not base.stat().st_mode&0o077
root=pathlib.Path(tempfile.mkdtemp(prefix='postgresql-scram-',dir=base));identity=secrets.token_hex(6);cluster='qa_scram_'+identity;role=cluster;unit='postgresql@18-'+cluster+'.service';folder=pathlib.Path('/etc/postgresql/18')/cluster;data=pathlib.Path('/var/lib/postgresql/18')/cluster
assert not folder.exists() and not data.exists();sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
env={**os.environ,'TMPDIR':str(root),'TMP':str(root),'TEMP':str(root),'LANG':'C.UTF-8','LC_ALL':'C.UTF-8'}
def run(args,**kwargs):return subprocess.run(args,check=True,capture_output=True,text=True,timeout=120,env=kwargs.pop('env',env),**kwargs)
def snapshot():
 paths=list(pathlib.Path('/etc/postgresql').rglob('*.conf'))+[pathlib.Path('/usr/lib/tastedev-linux/scripts/admin/linux-admin'),pathlib.Path('/etc/tastedev-linux/config.env')]
 return {str(f):hashlib.sha256(f.read_bytes()).hexdigest() for f in paths if f.is_file() and folder not in f.parents}
before=snapshot();created=False;stage='prepare';result={};folder_inode=None;data_inode=None
(root/'connection.json').write_text(json.dumps({'root':str(root),'cluster':cluster,'identity':identity,'port':port,'unit':unit,'hostSnapshot':before}));(root/'connection.json').chmod(0o600)
try:
 archive=tarfile.open(fileobj=io.BytesIO(base64.b64decode(p['archive'])));members=archive.getmembers();assert {m.name for m in members}==set(p['manifest'])
 for m in members:
  assert m.isfile() and not pathlib.PurePosixPath(m.name).is_absolute() and '..' not in pathlib.PurePosixPath(m.name).parts
  raw=archive.extractfile(m).read();assert hashlib.sha256(raw).hexdigest()==p['manifest'][m.name];f=root/m.name;f.parent.mkdir(parents=True,exist_ok=True,mode=0o755);f.write_bytes(raw);f.chmod(0o644)
 run(['/usr/bin/pg_createcluster','--port',str(port),'--start-conf','manual','--pgoption','ssl=off','18',cluster,'--','--auth-local=peer','--auth-host=scram-sha-256']);created=True
 folder_inode=folder.stat().st_ino;data_inode=data.stat().st_ino;(folder/'.qa-scram-owned').write_text(identity)
 config=folder/'postgresql.conf';config.write_text(config.read_text()+"\n# dedicated loopback authentication fixture\nlisten_addresses='127.0.0.1'\n")
 hba=folder/'pg_hba.conf';hba.write_text('host postgres '+role+' 127.0.0.1/32 reject\n'+hba.read_text())
 run(['/usr/bin/systemctl','--no-ask-password','start',unit]);stage='native HBA validation and SCRAM lifecycle'
 qa_secret=secrets.token_hex(24)
 worker=run(['/usr/bin/node',str(root/'worker.mjs'),str(root/'runtime'),str(hba),str(root),str(port),role],env={**env,'QA_SCRAM_PASSWORD':qa_secret})
 result=json.loads(worker.stdout);assert result['status']=='PASS';assert snapshot()==before;result.update(hostProtectedConfigurationsPreserved=True,sourceSha256=p['manifest'])
except Exception as error:
 detail=getattr(error,'stderr',None) or str(error)
 if 'qa_secret' in locals():detail=detail.replace(qa_secret,'[redacted]')
 result={'status':'FAIL','stage':stage,'diagnostic':detail[-4000:],'passwordRecorded':False}
finally:
 if created:
  assert not folder.is_symlink() and not data.is_symlink() and folder.stat().st_ino==folder_inode and data.stat().st_ino==data_inode and (folder/'.qa-scram-owned').read_text()==identity
  run(['/usr/bin/systemctl','--no-ask-password','stop',unit]);(folder/'.qa-scram-owned').unlink();run(['/usr/bin/pg_dropcluster','18',cluster]);assert not folder.exists() and not data.exists()
 assert not folder.exists() and not data.exists();assert snapshot()==before;shutil.rmtree(root);result['cleanup']={'dedicatedClusterRemoved':True,'privateStageRemoved':True,'hostProtectedConfigurationsPreserved':True}
print(json.dumps(result));raise SystemExit(0 if result['status']=='PASS' else 1)
'''.replace('__PAYLOAD__',repr(payload))
r=subprocess.run(['ssh','-F','/dev/null','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-i','/home/whitecalvin/.ssh/id_ed25519','whitecalvin@192.168.0.103','sudo -n python3 -'],input=remote,text=True,capture_output=True,timeout=240)
evidence=pathlib.Path('/mnt/data/build/tastedev-linux')/('postgresql-scram-native-'+uuid.uuid4().hex);evidence.mkdir(parents=True,exist_ok=True,mode=0o700)
if r.stdout.strip():
 result=json.loads(r.stdout);(evidence/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='sourceSha256'},ensure_ascii=False))
else:
 (evidence/'transport-error.log').write_text(r.stderr[-4000:]);print('검수 준비 또는 정리에 실패했습니다. 저장한 진단과 작업 상태를 확인해야 합니다.')
raise SystemExit(r.returncode)
