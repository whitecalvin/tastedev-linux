import pathlib, subprocess, json, datetime, shlex, uuid, sys, hashlib, base64, re
root=pathlib.Path.cwd()
if len(sys.argv)!=2: raise SystemExit('Usage: remote-postgresql-helper.py IMAGE_RESULT_JSON')
plan=json.loads(pathlib.Path(sys.argv[1]).read_text())
assert hashlib.sha256((root/'scripts/admin/linux-admin').read_bytes()).hexdigest()==plan['helperSha256']
prepared=json.loads(subprocess.run(['node',str(root/'scripts/verification/postgresql-systemd-source.ts')],check=True,capture_output=True,text=True,timeout=120).stdout)
assert prepared['format']=='tastedev-postgresql-systemd-source-v1' and isinstance(prepared['files'],dict)
assert all(name in prepared['files'] and hashlib.sha256(base64.b64decode(prepared['files'][name],validate=True)).hexdigest()==digest for name,digest in plan['runtimeManifest'].items())
assert plan['status']=='PASS' and plan['remoteHost']=='192.168.0.103'
image=plan['imageId']; assert re.fullmatch(r'sha256:[a-f0-9]{64}',image)
name='tastedev-pg-helper-'+uuid.uuid4().hex
helper_source=json.loads(subprocess.run(['node',str(root/'scripts/verification/postgresql-helper-container-source.ts')],check=True,capture_output=True,text=True,timeout=120).stdout)
assert helper_source['format']=='tastedev-postgresql-helper-container-source-v1' and isinstance(helper_source['fixture'],str)
fixture=helper_source['fixture']
ssh=['ssh','-o','BatchMode=yes','-o','ConnectTimeout=8','-o','StrictHostKeyChecking=yes','-i','/home/whitecalvin/.ssh/id_ed25519','whitecalvin@192.168.0.103']
args=['docker','run','--rm','--name',name,'--network','none','--read-only','--cap-drop','ALL','--cap-add','SETUID','--cap-add','SETGID','--pids-limit','128','--memory','512m','--cpus','1','--tmpfs','/mnt/data/build/tastedev-linux:rw,nosuid,nodev,mode=0700,size=128m','--tmpfs','/etc/postgresql:rw,nosuid,nodev,mode=0755,size=16m','--tmpfs','/var/lib/linux:rw,nosuid,nodev,mode=0700,size=16m','-i','--entrypoint','/usr/bin/node',image,'--input-type=module']
try:
    check=subprocess.run(ssh+[shlex.join(args)],input=fixture,text=True,capture_output=True,timeout=110)
    try: result=json.loads(check.stdout)
    except ValueError: result={'status':'FAIL','message':'격리 helper 검사 실행 또는 결과 읽기 실패'}
finally:
    state=subprocess.run(ssh+['docker container inspect '+shlex.quote(name)],capture_output=True,text=True,timeout=15)
    if state.returncode==0:
        subprocess.run(ssh+['docker rm -f '+shlex.quote(name)],check=True,capture_output=True,timeout=15)
absent=subprocess.run(ssh+['docker container inspect '+shlex.quote(name)],capture_output=True,timeout=15).returncode!=0
result.update(remoteHost=plan['remoteHost'],imageId=image,containerAbsentAfter=absent,hostMounts=False,publishedPorts=False,network='none',privileged=False,unconfined=False,exitCode=check.returncode)
evidence=pathlib.Path('/mnt/data/build/tastedev-linux')/('remote-postgresql-helper-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ'));evidence.mkdir(parents=True)
(evidence/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');(evidence/'process.log').write_text(check.stdout+check.stderr)
print(json.dumps(dict(result,evidence=str(evidence/'result.json')),ensure_ascii=False))
if result['status']=='FAIL' or not absent: raise SystemExit(1)
