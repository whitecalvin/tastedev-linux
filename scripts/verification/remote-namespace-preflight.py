import subprocess, pathlib, json, datetime, sys
remote = r'''
import urllib.request, tempfile, pathlib, json, hashlib, subprocess
url='https://raw.githubusercontent.com/moby/profiles/main/seccomp/default.json'
image='postgres@sha256:5a5a84b19854a9ffaa54082c166ff4ec27473a361e496e5ea167f298f2da9722'
with tempfile.TemporaryDirectory(prefix='tastedev-namespace-preflight-') as root:
 raw=urllib.request.urlopen(url,timeout=20).read(100000)
 profile=json.loads(raw)
 assert hashlib.sha256(raw).hexdigest()=='6416b47770785a41ac59073cdc77d9fe98517df2799dc83ef207e622de3053f6'
 assert profile['defaultAction']=='SCMP_ACT_ERRNO' and isinstance(profile['syscalls'],list)
 profile['syscalls'].append({'names':['unshare'],'action':'SCMP_ACT_ALLOW','args':[{'index':0,'value':268435456,'op':'SCMP_CMP_EQ'}]})
 policy=pathlib.Path(root)/'seccomp.json';policy.write_text(json.dumps(profile));policy.chmod(0o600)
 args=['docker','run','--rm','--name','tastedev-namespace-preflight-20261006','--network','none','--read-only','--cap-drop','ALL','--cap-add','SETUID','--cap-add','SETGID','--tmpfs','/tmp','--security-opt','seccomp='+str(policy),'--entrypoint','/bin/sh',image,'-c','runuser -u postgres -- unshare --user --map-root-user /bin/sh -c "id; cat /proc/self/uid_map; cat /proc/self/attr/current"']
 try:
  check=subprocess.run(args,text=True,capture_output=True,timeout=20)
  result={'status':'PASS' if check.returncode==0 else 'BLOCKED','scope':'nonroot CLONE_NEWUSER allowance in disposable container','baselineUrl':url,'baselineSha256':hashlib.sha256(raw).hexdigest(),'profileSha256':hashlib.sha256(policy.read_bytes()).hexdigest(),'extraAllowedCall':{'name':'unshare','arg0':268435456},'image':image,'exitCode':check.returncode,'stdout':check.stdout,'stderr':check.stderr,'hostSettingsChanged':False,'unconfined':False,'privileged':False,'hostMounts':False,'network':'none'}
 finally:
  state=subprocess.run(['docker','container','inspect','tastedev-namespace-preflight-20261006'],capture_output=True,text=True)
  if state.returncode==0:
   subprocess.run(['docker','rm','-f','tastedev-namespace-preflight-20261006'],check=True,capture_output=True)
 result['containerAbsentAfter']=subprocess.run(['docker','container','inspect','tastedev-namespace-preflight-20261006'],capture_output=True).returncode!=0
 print(json.dumps(result))
'''
if '--root' in sys.argv:
 remote=remote.replace("'--cap-add','SETGID'","'--cap-add','SETGID','--cap-add','SETFCAP'").replace('runuser -u postgres -- unshare','unshare').replace('nonroot CLONE_NEWUSER allowance','root CLONE_NEWUSER allowance with SETFCAP')
command=['ssh','-o','BatchMode=yes','-o','ConnectTimeout=8','-o','StrictHostKeyChecking=yes','-i','/home/whitecalvin/.ssh/id_ed25519','whitecalvin@192.168.0.103','python3 -']
check=subprocess.run(command,input=remote,text=True,capture_output=True,timeout=60)
if check.returncode:
 raise RuntimeError(check.stderr)
result=json.loads(check.stdout)
result['capabilities']=['SETUID','SETGID']+(['SETFCAP'] if '--root' in sys.argv else [])
evidence=pathlib.Path('.runtime/verification')/('remote-namespace-policy-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
evidence.mkdir(parents=True);(evidence/'result.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(dict(result,evidence=str(evidence/'result.json'))))
