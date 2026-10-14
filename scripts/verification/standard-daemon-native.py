"""Verify current helper service dispatch against two owned real systemd units."""
import pathlib, subprocess, json, hashlib, datetime
project = pathlib.Path.cwd()
source = (project / 'scripts/admin/linux-admin').read_text()
remote = r'''
import pathlib, subprocess, tempfile, json, hashlib, shutil, os
assert os.getuid()==0
base=pathlib.Path('/mnt/data/build/tastedev-linux');base.mkdir(mode=0o700,parents=True,exist_ok=True)
assert not base.is_symlink() and base.stat().st_uid==0 and base.stat().st_mode&0o077==0
root=pathlib.Path(tempfile.mkdtemp(prefix='standard-daemon-',dir=base));root.chmod(0o700)
source=__SOURCE__;helper=root/'linux-admin';helper.write_text(source);helper.chmod(0o600)
prefix=root.name;service=prefix+'.service';timer=prefix+'.timer'
def command(args):return subprocess.run(args,check=True,capture_output=True,text=True,timeout=30).stdout
def snapshot():
 return {u:command(['/usr/bin/systemctl','show',u,'--property=ActiveState,LoadState,MainPID,UnitFileState','--no-pager']) for u in ['cron.service','certbot.timer','tastedev-linux.service']}
before=snapshot();created=[];result={'status':'FAIL','helperSha256':hashlib.sha256(source.encode()).hexdigest(),'operatingServicesChanged':False,'checks':[]}
try:
 for name,text in [(service,'[Unit]\nDescription=Owned daemon control verification\n[Service]\nType=simple\nExecStart=/usr/bin/sleep infinity\nRestart=no\nPrivateNetwork=yes\nNoNewPrivileges=yes\n[Install]\nWantedBy=multi-user.target\n'),(timer,'[Unit]\nDescription=Owned timer control verification\n[Timer]\nOnActiveSec=1h\nUnit='+service+'\n[Install]\nWantedBy=timers.target\n')]:
  target=pathlib.Path('/run/systemd/system')/name
  assert not target.exists();target.write_text(text);created.append(target)
 command(['/usr/bin/systemctl','daemon-reload'])
 runner=r"""
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process'),{createRequire}=require('node:module');
const root=process.argv[2],service=process.argv[3],timer=process.argv[4],file=root+'/linux-admin';
const source=fs.readFileSync(file,'utf8').replace(/^#!.*\n/,'').split('main().catch')[0];
const mapping={'cron.service':service,'certbot.timer':timer},calls=[];
const execute=(binary,args,timeout)=>{assert.equal(binary,'/usr/bin/systemctl');assert.equal(args.filter(value=>mapping[value]).length,1);const mapped=args.map(value=>mapping[value]||value);calls.push(mapped);return cp.execFileSync(binary,mapped,{encoding:'utf8',timeout:timeout||30000});};
const context=vm.createContext({require:createRequire(file),process,Buffer,__filename:file,__dirname:root,fixtureRun:execute});vm.runInContext(source,context);vm.runInContext('run=fixtureRun;',context);
const status=unit=>Object.fromEntries(cp.execFileSync('/usr/bin/systemctl',['show',mapping[unit],'--property=ActiveState,MainPID,UnitFileState','--no-pager'],{encoding:'utf8'}).trim().split('\n').map(line=>line.split('=')));
const invoke=(unit,action,confirm=true)=>vm.runInContext('dispatch("service",'+JSON.stringify({unit,action,confirm})+')',context);
const checks=[];
for(const unit of Object.keys(mapping)){
 const initialCalls=calls.length;assert.throws(()=>invoke(unit,'start',false));assert.equal(calls.length,initialCalls);assert.throws(()=>invoke(unit,'reload'));assert.equal(calls.length,initialCalls);checks.push(unit+': unconfirmed/reload rejected before systemctl');
 assert(invoke(unit,'start').changed);let active=status(unit);assert.equal(active.ActiveState,'active');if(unit==='cron.service')assert(Number(active.MainPID)>0);checks.push(unit+': start observed active');
 const pid=active.MainPID;assert(invoke(unit,'restart').changed);active=status(unit);assert.equal(active.ActiveState,'active');if(unit==='cron.service')assert.notEqual(active.MainPID,pid);checks.push(unit+': restart observed real service/timer state');
 assert(invoke(unit,'stop').changed);assert.equal(status(unit).ActiveState,'inactive');checks.push(unit+': stop observed inactive');
 assert(invoke(unit,'enable').changed);assert.equal(status(unit).UnitFileState,'enabled');checks.push(unit+': enable observed enabled');
 assert(invoke(unit,'disable').changed);assert.equal(status(unit).UnitFileState,'disabled');checks.push(unit+': disable observed disabled');
}
console.log(JSON.stringify({checks,calls,realSystemdVerified:true,unitAdapter:true,scope:'exact current helper dispatch; logical cron/certbot names map only to disposable service/timer units; helper main lock/permission gates are separately tested'}));
"""
 script=root/'runner.cjs';script.write_text(runner);script.chmod(0o600)
 proof=json.loads(command(['/usr/bin/node',str(script),str(root),service,timer]));result.update(proof);result['status']='PASS_CURRENT_CRON_AND_CERTBOT_TIMER_HELPER_DISPATCH_NATIVE_SCOPE'
except Exception as error:
 result['error']=str(error)
finally:
 for unit in [timer,service]:
  subprocess.run(['/usr/bin/systemctl','stop',unit],capture_output=True,timeout=30)
  subprocess.run(['/usr/bin/systemctl','disable',unit],capture_output=True,timeout=30)
 for file in created:file.unlink(missing_ok=True)
 subprocess.run(['/usr/bin/systemctl','daemon-reload'],check=True,capture_output=True,timeout=30)
 result['protectedServiceSnapshotsPreserved']=snapshot()==before
 result['ownedUnitsRemoved']=all(not f.exists() for f in created)
 assert result['protectedServiceSnapshotsPreserved'] and result['ownedUnitsRemoved']
 shutil.rmtree(root);result['privateStageRemoved']=True
 print(json.dumps(result));
if not result['status'].startswith('PASS'):raise SystemExit(1)
'''.replace('__SOURCE__', repr(source))
ssh=['ssh','-F','/dev/null','-i','/home/whitecalvin/.ssh/id_ed25519','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','whitecalvin@192.168.0.103','sudo -n /usr/bin/python3 -']
run=subprocess.run(ssh,input=remote,text=True,capture_output=True,timeout=180)
evidence=project/'.runtime/verification'/('standard-daemon-native-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ'));evidence.mkdir(mode=0o700)
(evidence/'transport.log').write_text(run.stderr)
result=json.loads(run.stdout) if run.stdout else {'status':'FAIL','error':'No remote proof'}
assert result.get('helperSha256')==hashlib.sha256(source.encode()).hexdigest()
(evidence/'result.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'status':result['status'],'checks':result.get('checks',[]),'evidence':str(evidence/'result.json'),'exitCode':run.returncode}))
raise SystemExit(run.returncode)
