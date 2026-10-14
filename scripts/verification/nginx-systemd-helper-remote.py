"""QA-103 current helper with a dedicated real nginx systemd service."""
import pathlib,json,subprocess,hashlib,re,datetime,sys
tls_mode='--gui-tls' in sys.argv
rollback_mode='--gui-rollback' in sys.argv
sites_mode='--sites-only' in sys.argv
gui_service_mode='--gui-service' in sys.argv
service_mode='--service-only' in sys.argv or gui_service_mode
gui_mode='--gui' in sys.argv or rollback_mode or tls_mode or gui_service_mode
assert all(arg in ['--gui','--gui-rollback','--gui-tls','--sites-only','--service-only','--gui-service'] for arg in sys.argv[1:])
assert not (sites_mode and gui_mode)
assert not (service_mode and (sites_mode or rollback_mode or tls_mode or (gui_mode and not gui_service_mode)))
project=pathlib.Path.cwd();names=re.findall(r"'([^']+\.mjs)'",(project/'scripts/admin/runtime-files.mjs').read_text())
files={'runtime/'+name:(project/'lib'/name).read_text() for name in names}
files['runtime/manifest.json']=json.dumps({name:hashlib.sha256(files['runtime/'+name].encode()).hexdigest() for name in names})
for name in ['linux-admin','package.json']:files[name]=(project/'scripts/admin'/name).read_text()
if gui_mode:
 for directory in ['app','components','lib','public']:
  for file in sorted((project/directory).rglob('*')):
   assert not file.is_symlink()
   if file.is_file():files['source/'+str(file.relative_to(project))]=file.read_text()
 for name in ['package.json','next.config.mjs','scripts/admin/linux-admin']:files['source/'+name]=(project/name).read_text()
remote=r'''
import os,pathlib,tempfile,subprocess,shutil,json,hashlib,time,signal
assert os.getuid()==0
files=__FILES__;gui_mode=__GUI__;rollback_mode=__ROLLBACK__;tls_mode=__TLS__;sites_mode=__SITES__;service_mode=__SERVICE__;gui_service_mode=__GUI_SERVICE__;root=pathlib.Path(tempfile.mkdtemp(prefix='tastedev-nginx-systemd-'));root.chmod(0o700)
unit=root.name+'.service';unit_file=pathlib.Path('/run/systemd/system')/unit;created=False;process=None;result={'status':'FAIL'}
protected=[pathlib.Path('/etc/nginx/nginx.conf'),pathlib.Path('/usr/lib/tastedev-linux/scripts/admin/linux-admin')]
if tls_mode:protected.extend([pathlib.Path('/etc/letsencrypt/live/eztoy.app/fullchain.pem'),pathlib.Path('/etc/letsencrypt/renewal/eztoy.app.conf')])
before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() if p.is_file() else None for p in protected}
try:
 usr=root/'usr';home=usr/'lib/tastedev-linux/scripts/admin';home.mkdir(parents=True);(usr/'bin').mkdir();(usr/'package.json').write_text('{"type":"commonjs"}')
 for name,value in files.items():p=(root/name if name.startswith('source/') else home/name);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(value)
 (home/'linux-admin').chmod(0o755)
 for directory in [usr,*[p for p in usr.rglob('*') if p.is_dir()]]:directory.chmod(0o755)
 native=root/'native-systemctl';shutil.copyfile('/usr/bin/systemctl',native);native.chmod(0o755)
 adapter='#!/usr/bin/node\nconst {execFileSync}=require("node:child_process");let a=process.argv.slice(2);if(a.filter(x=>x==="nginx.service").length!==1||!a.some(x=>["show","reload"].includes(x)))process.exit(90);a=a.map(x=>x==="nginx.service"?'+json.dumps(unit)+':x);try{process.stdout.write(execFileSync('+json.dumps(str(native))+',a,{encoding:"utf8"}));}catch{process.exit(91);}\n'
 if service_mode:adapter=adapter.replace('["show","reload"]','["show","reload","start","stop","restart"]')
 (usr/'bin/systemctl').write_text(adapter);(usr/'bin/systemctl').chmod(0o755)
 config=root/'config';(config/'conf.d').mkdir(parents=True);config.chmod(0o755);(config/'conf.d').chmod(0o755)
 initial='server { listen 18081; location / { return 200 "before"; } }\n';(config/'conf.d/reviewed.conf').write_text(initial)
 (config/'nginx.conf').write_text('user root;\nworker_processes 1;\nerror_log stderr;\npid /tmp/nginx-fixture.pid;\nevents { worker_connections 64; }\nhttp { client_body_temp_path /tmp/body; proxy_temp_path /tmp/proxy; fastcgi_temp_path /tmp/fastcgi; uwsgi_temp_path /tmp/uwsgi; scgi_temp_path /tmp/scgi; access_log off; include /etc/nginx/conf.d/*.conf; }\n')
 if sites_mode:
  for name in ['sites-available','sites-enabled']:(config/name).mkdir(mode=0o755)
  (config/'sites-available/example').write_text('server { listen 18082; location / { return 200 "한국어 사이트 연결"; } }\n')
  main=config/'nginx.conf';main.write_text(main.read_text().replace('include /etc/nginx/conf.d/*.conf;','include /etc/nginx/conf.d/*.conf; include /etc/nginx/sites-enabled/*;'))
 for p in config.rglob('*'):
  if p.is_file():p.chmod(0o600)
 for name in ['tmp','state','usr-merged']:(root/name).mkdir(mode=0o700)
 (root/'tmp/fixture-reload').write_text('#!/bin/sh\necho reload >> /tmp/reload-attempts\nif [ -e /tmp/fail-reload-once ]; then /usr/bin/rm /tmp/fail-reload-once; exit 1; fi\nexec /usr/bin/kill -HUP "$1"\n');(root/'tmp/fixture-reload').chmod(0o700)
 command=['/usr/bin/systemd-run','--quiet','--unit='+unit,'--property=Type=exec','--property=Restart=no','--property=PrivateNetwork=yes','--property=TemporaryFileSystem=/etc /var/lib','--property=BindReadOnlyPaths='+str(config)+':/etc/nginx /etc/passwd:/etc/passwd /etc/group:/etc/group'+(' /etc/letsencrypt:/etc/letsencrypt' if tls_mode else ''),'--property=BindPaths='+str(root/'tmp')+':/tmp','--property=ExecReload=/bin/sh /tmp/fixture-reload $MAINPID','--setenv=LC_ALL=C','/usr/sbin/nginx','-g','daemon off;']
 if service_mode:
  assert not unit_file.exists()
  unit_file.write_text('[Unit]\nDescription=Owned tastedev nginx service verification\n[Service]\nType=exec\nRestart=no\nPrivateNetwork=yes\nTemporaryFileSystem=/etc /var/lib\nBindReadOnlyPaths='+str(config)+':/etc/nginx /etc/passwd:/etc/passwd /etc/group:/etc/group\nBindPaths='+str(root/'tmp')+':/tmp\nEnvironment=LC_ALL=C\nExecStart=/usr/sbin/nginx -g "daemon off;"\nExecReload=/bin/sh /tmp/fixture-reload $MAINPID\n');unit_file.chmod(0o600);created=True
  subprocess.run(['/usr/bin/systemctl','daemon-reload'],check=True,capture_output=True,timeout=30)
  command=['/usr/bin/systemctl','start',unit]
 subprocess.run(command,check=True,capture_output=True,timeout=30);created=True
 for attempt in range(100):
  info=subprocess.check_output(['/usr/bin/systemctl','show',unit,'--property=MainPID','--value'],text=True).strip()
  if info.isdigit() and int(info)>0 and (root/'tmp/nginx-fixture.pid').exists():break
  time.sleep(.1)
 else:raise RuntimeError('dedicated service not ready')
 pid=int(info)
 (root/'package.json').write_text('{"type":"module"}')
 runner=r"""import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {nginxTopology} from '/usr/lib/tastedev-linux/scripts/admin/runtime/nginx-topology.mjs';import {inspectNginxService} from '/usr/lib/tastedev-linux/scripts/admin/runtime/nginx-service-inspect.mjs';
const root=process.env.FIXTURE_ROOT,file='/etc/nginx/conf.d/reviewed.conf',original=fs.readFileSync(file,'utf8'),proof={status:'FAIL',checks:[]};
const call=(action,input)=>{const text=execFileSync('/usr/bin/node',['/usr/lib/tastedev-linux/scripts/admin/linux-admin',action],{input:JSON.stringify(input),encoding:'utf8',timeout:60000,maxBuffer:1048576});return JSON.parse(text);};
const response=async()=>await (await fetch('http://127.0.0.1:18081/',{signal:AbortSignal.timeout(1000)})).text();
const wait=async expected=>{for(let i=0;i<100;i++){try{if(await response()===expected)return;}catch{}await new Promise(r=>setTimeout(r,30));}throw Error('native HTTP response unavailable');};
const input=async text=>{const graph=await nginxTopology(),service=await inspectNginxService();assert(graph.complete);assert(service.identityVerified);return{path:file,text,version:graph.files.find(x=>x.path===file).version,graphVersion:graph.version,confirm:true,review:{confirm:true,pid:service.pid,start:service.start,graphVersion:graph.version,locale:{LC_ALL:'C'}}};};
try{await wait('before');const request=await input(original.replace('before','after'));proof.initialPid=request.review.pid;
const stale={...request,review:{...request.review,start:'0'}};assert.throws(()=>call('nginx-config-apply',stale));assert.equal(fs.readFileSync(file,'utf8'),original);proof.checks.push('stale actual process identity rejected');
const applied=call('nginx-config-apply',request);assert(applied.changed);assert(applied.journalCleanupVerified);await wait('after');proof.checks.push('canonical helper candidate validation apply and real systemd reload HTTP after');
assert.throws(()=>call('nginx-config-apply',request));proof.checks.push('stale graph rejected');
const current=await input(original);const{text,...restoration}=current;const restored=call('nginx-config-restore',{...restoration,backupId:applied.backupId});assert(restored.changed);assert(restored.journalCleanupVerified);await wait('before');assert.equal(fs.readFileSync(file,'utf8'),original);proof.checks.push('canonical helper backup restore and real systemd reload HTTP before');
assert.throws(()=>call('nginx-config-apply',awaitInputPlaceholder));
fs.writeFileSync(root+'/tmp/fail-reload-once','fixture-only');const rolledBack=call('nginx-config-apply',await input(original.replace('before','rollback')));assert(rolledBack.restored);assert(rolledBack.recovered);assert(rolledBack.journalCleanupVerified);assert.equal(fs.readFileSync(file,'utf8'),original);await wait('before');proof.checks.push('actual systemd ExecReload failure followed by original file recovery and successful real reload');proof.reloadFailureRecovered=true;
proof.status='PASS';proof.realSystemdVerified=true;proof.nativeHttpVerified=true;proof.originalBytesRestored=true;proof.finalPid=(await inspectNginxService()).pid;
}catch(error){proof.errorClass=error.name;proof.errorMessage=error.message;}finally{fs.writeFileSync(root+'/proof.json',JSON.stringify(proof));}if(proof.status!=='PASS')process.exitCode=1;
""".replace("assert.throws(()=>call('nginx-config-apply',awaitInputPlaceholder));","const invalid=await input('server { tastedev_invalid on; }');assert.throws(()=>call('nginx-config-apply',invalid));assert.equal(fs.readFileSync(file,'utf8'),original);await wait('before');proof.checks.push('invalid native directive rejected before file change');")
 if sites_mode:
  runner=r"""import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {nginxTopology} from '/usr/lib/tastedev-linux/scripts/admin/runtime/nginx-topology.mjs';import {inspectNginxSites} from '/usr/lib/tastedev-linux/scripts/admin/runtime/nginx-sites.mjs';import {inspectNginxService} from '/usr/lib/tastedev-linux/scripts/admin/runtime/nginx-service-inspect.mjs';
const root=process.env.FIXTURE_ROOT,file='/etc/nginx/sites-available/example',link='/etc/nginx/sites-enabled/example',original=fs.readFileSync(file,'utf8'),proof={status:'FAIL',mode:'sites-only',checks:[]};
const call=(action,input)=>JSON.parse(execFileSync('/usr/bin/node',['/usr/lib/tastedev-linux/scripts/admin/linux-admin',action],{input:JSON.stringify(input),encoding:'utf8',timeout:60000,maxBuffer:1048576}));
const request=async enabled=>{const graph=await nginxTopology(),sites=await inspectNginxSites(graph),service=await inspectNginxService();assert(graph.complete&&service.identityVerified);return {path:file,link,enabled,sitesVersion:sites.version,graphVersion:graph.version,confirm:true,review:{confirm:true,pid:service.pid,start:service.start,graphVersion:graph.version,locale:{LC_ALL:'C'}}};};
const observe=async enabled=>{for(let i=0;i<100;i++){try{const text=await(await fetch('http://127.0.0.1:18082/',{signal:AbortSignal.timeout(300)})).text();if(enabled&&text==='한국어 사이트 연결')return;}catch{if(!enabled)return;}await new Promise(resolve=>setTimeout(resolve,30));}throw Error('Site listener state did not match link state');};
try{
 await observe(false);const enable=await request(true),{confirm,review,...plan}=enable;
 assert(call('nginx-site-plan',plan).changed);assert(!fs.existsSync(link));proof.checks.push('canonical helper plan retains absent link');
 const applied=call('nginx-site-apply',enable);assert(applied.changed&&!applied.failed);assert.equal(fs.readlinkSync(link),'../sites-available/example');await observe(true);proof.checks.push('actual symlink enable and systemd reload serve Korean HTTP');
 assert.throws(()=>call('nginx-site-apply',enable));await observe(true);proof.checks.push('stale site graph request rejected while active link retained');
 const disabled=call('nginx-site-apply',await request(false));assert(disabled.changed&&!disabled.failed);assert(!fs.existsSync(link));await observe(false);assert.equal(fs.readFileSync(file,'utf8'),original);proof.checks.push('disable removes only link, closes listener and preserves source bytes');
 fs.writeFileSync(file,'server { tastedev_invalid on; }\n');const invalid=call('nginx-site-apply',await request(true));assert(invalid.failed&&invalid.restored&&invalid.recovered);assert(!fs.existsSync(link));await observe(false);fs.writeFileSync(file,original);proof.checks.push('invalid enabled candidate removes created link before reload');
 fs.writeFileSync(root+'/tmp/fail-reload-once','fixture-only');const failed=call('nginx-site-apply',await request(true));assert(failed.failed&&failed.restored&&failed.recovered);assert(!fs.existsSync(link));await observe(false);assert.equal(fs.readFileSync(file,'utf8'),original);assert.equal(call('nginx-site-recovery',{}).recoveryRequired,false);proof.checks.push('actual ExecReload failure restores absent link and clears recovery journal after real reload');
 proof.status='PASS';proof.realSystemdVerified=true;proof.nativeHttpVerified=true;proof.originalBytesRestored=true;proof.reloadFailureRecovered=true;
}catch(error){proof.errorClass=error.name;proof.errorMessage=error.message;}finally{fs.writeFileSync(root+'/proof.json',JSON.stringify(proof));}if(proof.status!=='PASS')process.exitCode=1;
"""
 if gui_mode:
  if rollback_mode:(root/'tmp/fail-reload-once').write_text('fixture-only')
  source=root/'source';(source/'node_modules').symlink_to('/usr/lib/tastedev-linux/node_modules',target_is_directory=True)
  (usr/'lib/tastedev-linux/admin-helper.sha256').write_text(hashlib.sha256((home/'linux-admin').read_bytes()).hexdigest()+'\n')
  for name in ['auth','workspace','dpkg','etc-upper','etc-work','etc-merged']:(root/name).mkdir(mode=0o700)
  shutil.copyfile('/var/lib/dpkg/status',root/'dpkg/status')
  if tls_mode:
   verifier=root/'tls-verify.py';verifier.write_text(r"""import ssl,socket,hashlib,json,subprocess,sys
context=ssl.create_default_context();expected=subprocess.check_output(['/usr/bin/openssl','x509','-in','/etc/letsencrypt/live/eztoy.app/cert.pem','-outform','DER'])
with context.wrap_socket(socket.create_connection(('127.0.0.1',18443),timeout=2),server_hostname='eztoy.app') as client:
 assert hashlib.sha256(client.getpeercert(binary_form=True)).digest()==hashlib.sha256(expected).digest()
 client.sendall(b'GET / HTTP/1.0\r\nHost: eztoy.app\r\n\r\n');response=b''
 while True:
  part=client.recv(65536)
  if not part:break
  response+=part
 assert b'200 OK' in response and b'after-gui' in response
 print(json.dumps({'tlsVersion':client.version(),'hostnameVerified':True,'peerCertificateMatched':True,'response':'after-gui'}))
""");verifier.chmod(0o600)
  runner=r"""import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync,spawn} from 'node:child_process';import {randomBytes} from 'node:crypto';
const root=process.env.FIXTURE_ROOT,source=root+'/source',port=49005,file='/etc/nginx/conf.d/reviewed.conf',original=fs.readFileSync(file,'utf8'),proof={status:'FAIL'};
const response=()=>execFileSync('/usr/bin/nsenter',['--net=/proc/'+process.env.FIXTURE_PID+'/ns/net','/usr/bin/node','-e',"fetch('http://127.0.0.1:18081/',{signal:AbortSignal.timeout(1000)}).then(r=>r.text()).then(t=>process.stdout.write(t)).catch(()=>process.exit(1))"],{encoding:'utf8',timeout:10000});assert.equal(response(),'before');
const env={...process.env,NODE_ENV:'development',NEXT_TELEMETRY_DISABLED:'1',LINUX_STATE_ROOT:root+'/state',LINUX_AUTH_ROOT:root+'/auth',LINUX_WORKSPACE_ROOT:root+'/workspace',LINUX_PACKAGED:'true',LINUX_ENABLE_ADMIN:'true',LINUX_ENABLE_INSTALL:'false',LINUX_ENABLE_CRON:'false',LINUX_ENABLE_TERMINAL:'false',LINUX_ENABLE_AI:'false',BETTER_AUTH_URL:'http://127.0.0.1:'+port};delete env.OPENAI_API_KEY;Object.assign(process.env,env);
const {storeCredentials}=await import(source+'/lib/auth-store.mjs'),{passwordHash}=await import(source+'/lib/auth-password.mjs'),{defaultSecurity}=await import(source+'/lib/security.mjs');const username='nginx-gui-fixture',password=randomBytes(32).toString('base64url');storeCredentials(username,await passwordHash(password));fs.writeFileSync(root+'/gui-login.json',JSON.stringify({username,password}),{mode:0o600});fs.writeFileSync(root+'/state/security.json',JSON.stringify({...defaultSecurity,readOnly:false,nginxChanges:true,sudoWithoutPrompt:true}),{mode:0o600});
const rollback=process.env.FIXTURE_ROLLBACK==='true',tls=process.env.FIXTURE_TLS==='true';let tlsProof=null;
const observeTls=()=>JSON.parse(execFileSync('/usr/bin/nsenter',['--net=/proc/'+process.env.FIXTURE_PID+'/ns/net','/usr/bin/python3',root+'/tls-verify.py'],{encoding:'utf8',timeout:10000}));
const log=fs.openSync(root+'/web.log','w',0o600),web=spawn('/usr/bin/node',[source+'/node_modules/next/dist/bin/next','dev','--webpack','--hostname','127.0.0.1','--port',String(port)],{cwd:source,env,stdio:['ignore',log,log]});let applied=false;
try{const deadline=Date.now()+600000;for(;;){assert(Date.now()<deadline&&web.exitCode===null,'GUI startup unavailable');try{if((await fetch('http://127.0.0.1:'+port+'/login')).status===200)break;}catch{}await new Promise(resolve=>setTimeout(resolve,200));}fs.writeFileSync(root+'/gui-connection.json',JSON.stringify({root,port,usernameFile:root+'/gui-login.json',unit:process.env.FIXTURE_UNIT}));
for(;;){assert(Date.now()<deadline&&web.exitCode===null,'GUI deadline exceeded');if(fs.readFileSync(file,'utf8').includes('after-gui'))try{if(response()==='after-gui'){applied=true;if(tls&&!tlsProof)tlsProof=observeTls();}}catch{}if(fs.existsSync(root+'/gui-result.json')){proof.gui=JSON.parse(fs.readFileSync(root+'/gui-result.json'));break;}await new Promise(resolve=>setTimeout(resolve,200));}
assert.equal(proof.gui.status,'PASS');if(rollback){assert(!fs.existsSync(root+'/tmp/fail-reload-once'));assert.equal(fs.readFileSync(root+'/tmp/reload-attempts','utf8').trim(),'reload\nreload');assert.equal(fs.readdirSync('/var/lib/linux/admin/nginx-config/transactions').filter(name=>name.endsWith('.json')).length,0);proof.actualFailedReloadThenRecovery=true;proof.journalCleared=true;}else assert(applied,'actual HTTP after-gui not observed');assert.equal(response(),'before');assert.equal(fs.readFileSync(file,'utf8'),original);if(tls){assert(tlsProof,'actual TLS response not observed');assert.throws(observeTls);proof.tlsProof=tlsProof;proof.tlsListenerRemovedAfterRestore=true;}proof.status='PASS';proof.appliedHttpAfterObserved=applied;proof.restoredHttpBefore=true;proof.originalBytesRestored=true;proof.realSystemdVerified=true;
}catch(error){proof.errorClass=error.name;proof.errorMessage=error.message;}finally{web.kill('SIGTERM');await new Promise(resolve=>{const timer=setTimeout(()=>{web.kill('SIGKILL');resolve();},10000);web.once('close',()=>{clearTimeout(timer);resolve();});});fs.closeSync(log);fs.writeFileSync(root+'/proof.json',JSON.stringify(proof));}if(proof.status!=='PASS')process.exitCode=1;
"""
 if service_mode and not gui_service_mode:
  runner=r"""import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const root=process.env.FIXTURE_ROOT,file='/etc/nginx/conf.d/reviewed.conf',original=fs.readFileSync(file,'utf8'),proof={status:'FAIL',mode:'service-only',checks:[]};
const native=root+'/native-systemctl',unit=root.split('/').at(-1)+'.service';
const state=()=>Object.fromEntries(execFileSync(native,['show',unit,'--property=ActiveState,MainPID'],{encoding:'utf8'}).trim().split('\n').map(row=>row.split('=')));
const call=(input)=>JSON.parse(execFileSync('/usr/bin/node',['/usr/lib/tastedev-linux/scripts/admin/linux-admin','service'],{input:JSON.stringify(input),encoding:'utf8',timeout:60000,maxBuffer:1048576}));
const change=action=>call({unit:'nginx.service',action,confirm:true});
const http=()=>{const pid=state().MainPID;assert(Number(pid)>0);return execFileSync('/usr/bin/nsenter',['--net=/proc/'+pid+'/ns/net','/usr/bin/node','-e',"fetch('http://127.0.0.1:18081/',{signal:AbortSignal.timeout(1000)}).then(r=>r.text()).then(t=>process.stdout.write(t)).catch(()=>process.exit(1))"],{encoding:'utf8',timeout:5000});};
const wait=async()=>{for(let i=0;i<100;i++){try{if(state().ActiveState==='active'&&http()==='before')return;}catch{}await new Promise(resolve=>setTimeout(resolve,50));}throw Error('dedicated nginx HTTP unavailable');};
try{
 await wait();proof.initialPid=Number(state().MainPID);
 assert.throws(()=>call({unit:'nginx.service',action:'stop',confirm:false}));assert.equal(Number(state().MainPID),proof.initialPid);proof.checks.push('missing confirmation rejected without stopping native service');
 assert(change('stop').changed);assert.equal(state().ActiveState,'inactive');assert.equal(Number(state().MainPID),0);proof.checks.push('canonical helper stop produces actual inactive service and zero PID');
 fs.writeFileSync(file,'server { tastedev_invalid on; }\n');assert.throws(()=>change('start'));assert.equal(state().ActiveState,'inactive');assert.equal(Number(state().MainPID),0);proof.checks.push('invalid configuration fails nginx -t before service start');fs.writeFileSync(file,original);
 const started=change('start');assert(started.changed);assert.match(started.logs,/syntax is ok/);await wait();proof.startedPid=Number(state().MainPID);assert.notEqual(proof.startedPid,proof.initialPid);proof.checks.push('canonical helper start validates config and serves HTTP with new native PID');
 assert(change('restart').changed);await wait();proof.restartedPid=Number(state().MainPID);assert.notEqual(proof.restartedPid,proof.startedPid);proof.checks.push('canonical helper restart replaces process and recovers HTTP');
 assert(change('stop').changed);assert.equal(Number(state().MainPID),0);assert.equal(fs.readFileSync(file,'utf8'),original);proof.checks.push('final stop leaves original configuration unchanged');
 proof.status='PASS';proof.realSystemdVerified=true;proof.nativeHttpVerified=true;proof.originalBytesRestored=true;
}catch(error){proof.errorClass=error.name;proof.errorMessage=error.message;}finally{fs.writeFileSync(root+'/proof.json',JSON.stringify(proof));}if(proof.status!=='PASS')process.exitCode=1;
"""
 if gui_service_mode:
  runner=runner.replace("const response=()=>execFileSync", "const native=root+'/native-systemctl',unit=process.env.FIXTURE_UNIT;const serviceState=()=>Object.fromEntries(execFileSync(native,['show',unit,'--property=ActiveState,MainPID'],{encoding:'utf8'}).trim().split('\\n').map(row=>row.split('=')));const initialPid=Number(serviceState().MainPID);let stopped=false,started=false;const response=()=>execFileSync")
  runner=runner.replace("process.env.FIXTURE_PID+'/ns/net'", "serviceState().MainPID+'/ns/net'")
  runner=runner.replace('nginxChanges:true,sudoWithoutPrompt:true','nginxChanges:true,serviceChanges:true,sudoWithoutPrompt:true')
  runner=runner.replace("if(fs.readFileSync(file,'utf8').includes('after-gui'))", "const observed=serviceState();if(observed.ActiveState==='inactive'&&Number(observed.MainPID)===0)stopped=true;if(stopped&&observed.ActiveState==='active'&&Number(observed.MainPID)>0&&Number(observed.MainPID)!==initialPid)started=true;if(fs.readFileSync(file,'utf8').includes('after-gui'))")
  runner=runner.replace("else assert(applied,'actual HTTP after-gui not observed');", "else {assert(stopped,'GUI stop was not observed in native systemd');assert(started,'GUI start was not observed with a new PID');proof.nativeStopObserved=true;proof.nativeStartObserved=true;proof.initialPid=initialPid;proof.finalPid=Number(serviceState().MainPID);}")
 (root/'runner.mjs').write_text(runner)
 launch="import os,subprocess\npasswd=open('/etc/passwd','rb').read();group=open('/etc/group','rb').read()\nsubprocess.run(['/usr/bin/mount','--make-rprivate','/'],check=True)\nsubprocess.run(['/usr/bin/mount','-t','overlay','overlay','-o',%r,%r],check=True)\nsubprocess.run(['/usr/bin/mount','--bind',%r,'/usr'],check=True)\nsubprocess.run(['/usr/bin/mount','-t','tmpfs','tmpfs','/etc'],check=True)\nopen('/etc/passwd','wb').write(passwd);open('/etc/group','wb').write(group)\nos.mkdir('/etc/nginx',0o755)\nsubprocess.run(['/usr/bin/mount','--bind',%r,'/etc/nginx'],check=True)\nsubprocess.run(['/usr/bin/mount','-t','tmpfs','tmpfs','/var/lib'],check=True)\nos.mkdir('/var/lib/linux',0o700)\nsubprocess.run(['/usr/bin/mount','--bind',%r,'/var/lib/linux'],check=True)\nos.environ['FIXTURE_ROOT']=%r\nos.execv('/usr/bin/node',['/usr/bin/node',%r])\n"%('ro,lowerdir='+str(usr)+':/usr',str(root/'usr-merged'),str(root/'usr-merged'),str(config),str(root/'state'),str(root),str(root/'runner.mjs'))
 if gui_mode:
  launch="import os,subprocess\nsubprocess.run(['/usr/bin/mount','--make-rprivate','/'],check=True)\nsubprocess.run(['/usr/bin/mount','-t','overlay','overlay','-o',%r,%r],check=True)\nsubprocess.run(['/usr/bin/mount','--bind',%r,'/usr'],check=True)\nsubprocess.run(['/usr/bin/mount','-t','overlay','overlay','-o',%r,%r],check=True)\nsubprocess.run(['/usr/bin/mount','--bind',%r,'/etc'],check=True)\nsubprocess.run(['/usr/bin/mount','--bind',%r,'/etc/nginx'],check=True)\nsubprocess.run(['/usr/bin/mount','-t','tmpfs','tmpfs','/var/lib'],check=True)\nos.mkdir('/var/lib/linux',0o700)\nsubprocess.run(['/usr/bin/mount','--bind',%r,'/var/lib/linux'],check=True)\nos.mkdir('/var/lib/dpkg',0o755)\nsubprocess.run(['/usr/bin/mount','--bind',%r,'/var/lib/dpkg'],check=True)\nsubprocess.run(['/usr/bin/mount','-o','remount,bind,ro','/var/lib/dpkg'],check=True)\nos.environ['FIXTURE_ROOT']=%r\nos.environ['FIXTURE_PID']=%r\nos.environ['FIXTURE_UNIT']=%r\nos.environ['FIXTURE_ROLLBACK']=%r\nos.execv('/usr/bin/node',['/usr/bin/node',%r])\n"%('ro,lowerdir='+str(usr)+':/usr',str(root/'usr-merged'),str(root/'usr-merged'),'lowerdir=/etc,upperdir='+str(root/'etc-upper')+',workdir='+str(root/'etc-work'),str(root/'etc-merged'),str(root/'etc-merged'),str(config),str(root/'state'),str(root/'dpkg'),str(root),str(pid),unit,'true' if rollback_mode else 'false',str(root/'runner.mjs'))
 if tls_mode:launch=launch.replace("os.execv('/usr/bin/node'","os.environ['FIXTURE_TLS']='true'\nos.execv('/usr/bin/node'")
 (root/'launch.py').write_text(launch)
 process=subprocess.Popen(([] if gui_mode or service_mode else ['/usr/bin/nsenter','--net=/proc/'+str(pid)+'/ns/net'])+['/usr/bin/unshare','--mount','--','python3',str(root/'launch.py')],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,start_new_session=True)
 if gui_mode:
  deadline=time.time()+750;announced=False
  while process.poll() is None:
   assert time.time()<deadline,'GUI control deadline'
   if (root/'gui-connection.json').exists() and not announced:print(json.dumps({'status':'GUI_READY',**json.loads((root/'gui-connection.json').read_text())}),flush=True);announced=True
   time.sleep(.2)
  out,err=process.communicate(timeout=10)
 else:out,err=process.communicate(timeout=240)
 proof=json.loads((root/'proof.json').read_text()) if (root/'proof.json').exists() else None
 result.update(status=proof['status'] if proof else 'FAIL',proof=proof,sourceSha256={k:hashlib.sha256(v.encode()).hexdigest() for k,v in files.items()},nginxSha256=hashlib.sha256(pathlib.Path('/usr/sbin/nginx').read_bytes()).hexdigest(),dedicatedNetwork=True)
 if not proof:result['fixedFixtureLaunchError']=err.replace(str(root),'[private-fixture]')[-1000:]
except Exception as error:
 result.update(errorClass=type(error).__name__)
 if created:result['dedicatedFixtureJournal']=subprocess.run(['/usr/bin/journalctl','--unit='+unit,'-n','12','--no-pager','--output=cat'],capture_output=True,text=True).stdout.replace(str(root),'[private-fixture]')[-2000:]
finally:
 if process is not None and process.poll() is None:
  os.killpg(process.pid,signal.SIGTERM)
  try:process.communicate(timeout=15)
  except subprocess.TimeoutExpired:os.killpg(process.pid,signal.SIGKILL);process.communicate(timeout=10)
 if created:
  subprocess.run(['/usr/bin/systemctl','stop',unit],capture_output=True,timeout=30)
  result['dedicatedUnitStopped']=subprocess.run(['/usr/bin/systemctl','is-active',unit],capture_output=True,text=True).stdout.strip() in ['inactive','failed','unknown']
 if service_mode and unit_file.exists():
  unit_file.unlink();subprocess.run(['/usr/bin/systemctl','daemon-reload'],check=True,capture_output=True,timeout=30);result['dedicatedUnitFileRemoved']=not unit_file.exists()
 result['hostProtectedFilesPreserved']=before=={str(p):hashlib.sha256(p.read_bytes()).hexdigest() if p.is_file() else None for p in protected}
 def vanished(function,name,error):
  if not isinstance(error[1],FileNotFoundError):raise error[1]
 try:shutil.rmtree(root,onerror=vanished)
 except Exception as error:result.update(status='FAIL',cleanupErrorClass=type(error).__name__)
 result['privateStageRemoved']=not root.exists()
print(json.dumps(result))
'''.replace('__FILES__',repr(files)).replace('__GUI__',repr(gui_mode)).replace('__ROLLBACK__',repr(rollback_mode)).replace('__TLS__',repr(tls_mode)).replace('__SITES__',repr(sites_mode)).replace('__SERVICE__',repr(service_mode)).replace('__GUI_SERVICE__',repr(gui_service_mode))
command=['ssh','-F','/dev/null','-i','/home/whitecalvin/.ssh/id_ed25519','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','whitecalvin@192.168.0.103','sudo -n python3 -']
gui_evidence=project/'.runtime/verification'/('nginx-systemd-'+('tls-' if tls_mode else 'rollback-' if rollback_mode else '')+'original-gui-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
if gui_mode:
 transport=subprocess.Popen(command,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True);transport.stdin.write(remote);transport.stdin.close();lines=[]
 for line in transport.stdout:
  value=json.loads(line)
  if value.get('status')=='GUI_READY':
   gui_evidence.mkdir(parents=True,exist_ok=False);(gui_evidence/'connection.json').write_text(json.dumps(value));print(json.dumps({**value,'connectionEvidence':str(gui_evidence/'connection.json')}),flush=True)
  else:lines.append(line)
 transport.wait(timeout=30);run=subprocess.CompletedProcess(command,transport.returncode,''.join(lines),transport.stderr.read())
else:run=subprocess.run(command,input=remote,text=True,capture_output=True,timeout=360)
folder=project/'.runtime/verification'/('nginx-systemd-helper-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ'));folder.mkdir(parents=True)
result=json.loads(run.stdout) if run.returncode==0 else {'status':'FAIL','transportErrorSha256':hashlib.sha256(run.stderr.encode()).hexdigest()}
(folder/'transport-stdout.log').write_text(run.stdout);(folder/'transport-stderr.log').write_text(run.stderr)
(folder/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'evidence':str(folder/'result.json'),**{k:v for k,v in result.items() if k!='sourceSha256'}},ensure_ascii=False));raise SystemExit(0 if result['status']=='PASS' else 1)
