"""Exercise saved network settings through an exclusively owned QA-103 app.
Prepare/cleanup use app-restart-original-gui.py; never change the operating app.
"""
import argparse,json,pathlib,subprocess,urllib.request,urllib.error,threading,datetime
p=argparse.ArgumentParser();p.add_argument('--connection',required=True);a=p.parse_args()
connection=pathlib.Path(a.connection).resolve();project=pathlib.Path.cwd()
assert connection.is_relative_to(project/'.runtime/verification')
c=json.loads(connection.read_text());assert c['networkStart'] and c['production']
remote=r'''
import json,pathlib,subprocess,time,urllib.request,urllib.error,hashlib,os,re
c=__CONNECTION__;assert os.getuid()==0
root=pathlib.Path(c['root']);assert re.fullmatch(r'/mnt/data/build/tastedev-linux-restart/gui-[a-zA-Z0-9_-]+',str(root))
assert not root.is_symlink() and root.stat().st_uid==0 and (root/'identity').read_text()==c['identity']
assert json.loads((root/'connection.json').read_text())==c
unit=c['unit'];assert re.fullmatch(r'tastedev-restart-gui-[a-f0-9]{12}\.service',unit)
unitfile=pathlib.Path('/etc/systemd/system')/unit
assert not unitfile.is_symlink() and hashlib.sha256(unitfile.read_bytes()).hexdigest()==c['unitSha256']
protected=json.loads((root/'host-snapshot.json').read_text())
def unchanged():return all(hashlib.sha256(pathlib.Path(name).read_bytes()).hexdigest()==value for name,value in protected.items())
assert unchanged()
credentials=json.loads((root/'auth/gui-login.json').read_text());cookie=None
opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
def request(base,route,payload=None,authenticated=True):
 headers={}
 if authenticated and cookie:headers['Cookie']=cookie
 if payload is not None:headers.update({'Content-Type':'application/json','Origin':base})
 req=urllib.request.Request(base+route,data=json.dumps(payload).encode() if payload is not None else None,headers=headers)
 with opener.open(req,timeout=3) as response:return response.status,response.headers,response.read()
def api(base,route,payload=None):
 status,headers,body=request(base,route,payload);assert status==200;return json.loads(body)
def wait(base):
 deadline=time.monotonic()+30
 while True:
  try:
   if request(base,'/login',authenticated=False)[0]==200:return
  except (urllib.error.URLError,TimeoutError,ConnectionError):pass
  assert time.monotonic()<deadline,'Dedicated listener did not become ready';time.sleep(.2)
def manager():
 output=subprocess.run(['systemctl','show',unit,'--property=MainPID,ActiveState','--no-pager'],check=True,capture_output=True,text=True,timeout=5).stdout
 return dict(line.split('=',1) for line in output.splitlines())
def restart(base,version):
 before=manager();scheduled=api(base,'/api/app-restart',{'version':version,'confirm':True});assert scheduled['scheduled']
 deadline=time.monotonic()+20
 while True:
  after=manager()
  if after['ActiveState']=='active' and int(after['MainPID'])>0 and after['MainPID']!=before['MainPID']:return before,after
  assert time.monotonic()<deadline,'Owned manager did not restart';time.sleep(.2)
result={'status':'FAIL','operatingAppChanged':False,'wholeProductComplete':False,'checks':[]}
try:
 initial='http://127.0.0.1:'+str(c['port']);external='http://192.168.0.103:'+str(c['nextPort'])
 wait(initial);status,headers,body=request(initial,'/api/auth/login',credentials,False);assert status==200
 cookie=headers['Set-Cookie'].split(';')[0]
 settings=api(initial,'/api/network-settings');assert settings['active']['host']=='127.0.0.1' and settings['active']['port']==c['port']
 saved=api(initial,'/api/network-settings',{'externalEnabled':True,'host':'0.0.0.0','port':c['nextPort'],'version':settings['version']})
 assert saved['restartRequired'] and saved['active']['host']=='127.0.0.1' and saved['active']['port']==c['port']
 result['checks'].append('saved external bind and new port remain pending until actual app restart')
 before,after=restart(initial,saved['version']);wait(external)
 running=api(external,'/api/network-settings');assert running['active']['host']=='0.0.0.0' and running['active']['port']==c['nextPort'] and not running['restartRequired']
 assert external in running['active']['urls'];assert request(external,'/settings')[0]==200
 result['checks'].append('canonical startup script reads saved settings; new PID serves LAN interface and port with existing session')
 result['externalRuntime']={'before':before,'after':after,'settings':running}
 # Saving through the new LAN origin must pass the real origin/auth gates.
 disabled=api(external,'/api/network-settings',{'externalEnabled':False,'host':'0.0.0.0','port':c['port'],'version':running['version']})
 assert disabled['host']=='127.0.0.1' and disabled['restartRequired']
 result['checks'].append('authenticated mutation from new LAN origin accepted and external-off normalizes to loopback')
 before,after=restart(external,disabled['version']);wait(initial)
 local=api(initial,'/api/network-settings');assert local['active']['host']=='127.0.0.1' and local['active']['port']==c['port'] and not local['restartRequired']
 for base in [external,'http://192.168.0.103:'+str(c['port'])]:
  try:request(base,'/login',authenticated=False)
  except (urllib.error.URLError,TimeoutError,ConnectionError):pass
  else:raise AssertionError('Disabled external listener still reachable')
 result['loopbackRuntime']={'before':before,'after':after,'settings':local}
 result['checks'].append('second actual restart closes relocated listener and denies LAN access while loopback remains available')
 assert unchanged();result.update(status='PASS_ACTUAL_SAVED_NETWORK_STARTUP_AND_EXTERNAL_OFF',hostSnapshotsPreserved=True)
except Exception as error:result.update(errorClass=type(error).__name__,diagnosticSha256=hashlib.sha256(str(error).encode()).hexdigest())
print(json.dumps(result,ensure_ascii=False))
'''.replace('__CONNECTION__',repr(c))
probe_stop=threading.Event();external_probe=[]
def probe_external_from_development():
 opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
 url='http://192.168.0.103:'+str(c['nextPort'])+'/login'
 while not probe_stop.is_set():
  try:
   with opener.open(url,timeout=2) as response:
    body=response.read()
    if response.status==200 and response.geturl()==url and b'LINUX' in body:
     external_probe.append({'url':url,'status':200,'loginPageObserved':True});return
  except (urllib.error.URLError,TimeoutError,ConnectionError):pass
  probe_stop.wait(.1)
probe=threading.Thread(target=probe_external_from_development,daemon=True);probe.start()
try:
 run=subprocess.run(['ssh','-F','/dev/null','-o','BatchMode=yes','-o','ConnectTimeout=8','-o','StrictHostKeyChecking=yes','-i','/home/whitecalvin/.ssh/id_ed25519','whitecalvin@192.168.0.103','sudo -n python3 -'],input=remote,text=True,capture_output=True,timeout=120)
finally:probe_stop.set();probe.join(3)
if run.returncode:raise RuntimeError('Network verification SSH execution failed: '+str(run.returncode))
result=json.loads(run.stdout);result['sourceManifestEvidence']=str(connection.parent/'source-manifest.json')
result['developmentMachineExternalEnabledProbe']=external_probe
result['nativeStartupStatus']=result['status']
result['externalClientEnabledVerified']=bool(external_probe)
if not external_probe and result['status'].startswith('PASS_'):result['status']='PARTIAL_NATIVE_STARTUP_ONLY_EXTERNAL_CLIENT_UNVERIFIED'
# Independently confirm LAN denial from this development machine after external-off.
opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
denied=[]
for port in [c['port'],c['nextPort']]:
 try:opener.open('http://192.168.0.103:'+str(port)+'/login',timeout=3).close()
 except (urllib.error.URLError,TimeoutError,ConnectionError):denied.append(port)
result['developmentMachineExternalOffDeniedPorts']=denied
path=connection.parent/('native-client-result-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'.json');path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':result['status'],'evidence':str(path),'checks':result['checks'],'externalOffDeniedPorts':denied},ensure_ascii=False))
raise SystemExit(0 if result['status'].startswith('PASS_') and len(denied)==2 and external_probe else 1)
