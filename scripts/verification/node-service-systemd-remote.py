"""Current native Node service lifecycle on an exclusively owned QA-103 unit."""
import pathlib,subprocess,json,hashlib,datetime,re,sys
stop_only='--stop-only' in sys.argv
helper_mode='--helper' in sys.argv
recovery_mode='--recovery' in sys.argv
assert not recovery_mode or helper_mode
assert all(arg in ['--stop-only','--helper','--recovery'] for arg in sys.argv[1:])
project=pathlib.Path.cwd();sources={}
def collect(name):
 if name in sources:return
 source=(project/'lib'/name).read_text();sources[name]=source
 for spec in re.findall(r"\bfrom\s+['\"]([^'\"]+)['\"]",source):
  if spec.startswith('node:'):continue
  assert re.fullmatch(r'\./[a-z-]+\.mjs',spec),spec
  collect(spec[2:])
for name in ['node-app-service-install.mjs','node-app-service-control.mjs','node-app-service-hooks.mjs']:collect(name)
helper_source=(project/'scripts/admin/linux-admin').read_text()
if helper_mode:
 for name in re.findall(r"'([^']+\.mjs)'",(project/'scripts/admin/runtime-files.mjs').read_text()):collect(name)
remote=r'''
import pathlib,subprocess,tempfile,os,pwd,json,shutil,secrets,hashlib
assert os.getuid()==0
root=pathlib.Path(tempfile.mkdtemp(prefix='tastedev-node-systemd-'));root.chmod(0o755)
account=pwd.getpwnam('whitecalvin');assert account.pw_uid>0
identifier='verify-'+secrets.token_hex(6);unit='tastedev-node-'+identifier+'.service';unitfile=pathlib.Path('/etc/systemd/system')/unit
assert not unitfile.exists() and not unitfile.is_symlink()
proof={'status':'FAIL','checks':[]};expected=None
try:
 source=root/'modules';source.mkdir(mode=0o755)
 for name,text in __SOURCES__.items():
  p=source/name;p.write_text(text);p.chmod(0o644)
 if __HELPER_MODE__:
  stage=root/'admin';runtime=stage/'runtime';runtime.mkdir(parents=True,mode=0o755);stage.chmod(0o755)
  (stage/'linux-admin').write_text(__HELPER_SOURCE__);(stage/'linux-admin').chmod(0o755);(stage/'package.json').write_text('{"type":"commonjs"}')
  manifest={}
  for name,text in __SOURCES__.items():
   (runtime/name).write_text(text);(runtime/name).chmod(0o644);manifest[name]=hashlib.sha256(text.encode()).hexdigest()
  (runtime/'manifest.json').write_text(json.dumps(manifest))
  state=root/'state';state.mkdir(mode=0o700);(state/'admin').mkdir(mode=0o700)
  launcher="import os,sys,subprocess;root=sys.argv[1];subprocess.run(['/usr/bin/mount','--make-rprivate','/'],check=True);subprocess.run(['/usr/bin/mount','--bind',root+'/admin','/usr/lib/tastedev-linux/scripts/admin'],check=True);subprocess.run(['/usr/bin/mount','-t','tmpfs','-o','mode=755','tmpfs','/var/lib'],check=True);os.mkdir('/var/lib/linux',0o700);subprocess.run(['/usr/bin/mount','--bind',root+'/state','/var/lib/linux'],check=True);os.execv('/usr/bin/node',['/usr/bin/node','/usr/lib/tastedev-linux/scripts/admin/linux-admin',sys.argv[2]])"
  (root/'helper-entry.py').write_text(launcher)
 app=root/'app';app.mkdir(mode=0o700);os.chown(app,account.pw_uid,account.pw_gid)
 for name,text in [('server.mjs',"import http from 'node:http';import path from 'node:path';import fs from 'node:fs';const socket=path.join(process.cwd(),'probe.sock');try{fs.unlinkSync(socket)}catch{};const server=http.createServer((req,res)=>res.end(process.env.VALUE));server.listen(socket);console.log('전용 Node 서비스 시작');"),('.env','VALUE="한글 서비스"\n')]:
  p=app/name;p.write_text(text);p.chmod(0o600);os.chown(p,account.pw_uid,account.pw_gid)
 script=r"""import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {installNodeAppService} from './modules/node-app-service-install.mjs';import {controlNodeAppService,inspectNodeAppService} from './modules/node-app-service-control.mjs';import {nodeAppUnit} from './modules/node-app-unit.mjs';import {nodeAppServiceHooks,nodeAppServiceControlHooks} from './modules/node-app-service-hooks.mjs';
const root=process.env.FIXTURE_ROOT,uid=Number(process.env.FIXTURE_UID),profile={id:process.env.FIXTURE_ID,label:'전용 Node 검수',directory:root+'/app',entry:'server.mjs',environmentFile:'.env'},unit='tastedev-node-'+profile.id+'.service',options={restart:'no',restartSeconds:5,stopSeconds:15},hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const files=await Promise.all(['server.mjs','.env'].map(async name=>({name,version:hash(await fs.readFile(root+'/app/'+name))}))),input={profile,uid,files,options,confirm:true},proof={status:'FAIL',checks:[],unit};
const manager=()=>execFileSync('/usr/bin/systemctl',['show',unit,'--property=ActiveState,MainPID,UnitFileState','--no-pager'],{encoding:'utf8'}),pid=()=>Number(/^MainPID=(\d+)$/m.exec(manager())?.[1]),request=()=>execFileSync('/usr/bin/curl',['--silent','--show-error','--max-time','2','--unix-socket',root+'/app/probe.sock','http://localhost/'],{encoding:'utf8',stdio:['ignore','pipe','ignore']});
async function ready(){for(let n=0;n<50;n++){try{assert.equal(request(),'한글 서비스');return;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}throw Error('fixture HTTP readiness failed');}
function helper(action,payload){try{return JSON.parse(execFileSync('/usr/bin/unshare',['--mount','--','/usr/bin/python3',root+'/helper-entry.py',root,action],{input:JSON.stringify(payload),encoding:'utf8',timeout:90000,stdio:['pipe','pipe','pipe']}));}catch(error){let protocol;try{protocol=JSON.parse(error.stderr.trim().split('\n').at(-1));}catch{}throw Object.assign(Error(protocol?.message||'canonical helper fixture failed'),{status:protocol?.status,fixtureDiagnostic:protocol?undefined:String(error.stderr||'').slice(-4000)});}}
async function control(operation){const request={...input,operation};return process.env.HELPER_MODE==='1'?helper('node-service-control',request):controlNodeAppService(request,{callerUid:uid,...nodeAppServiceControlHooks(request,uid)});}
const modifiedOptions={...options,restart:'on-failure',restartSeconds:7};
await fs.writeFile(root+'/expected-unit-sha256',[options,modifiedOptions].map(value=>hash('# Managed by Tastedev Linux\n'+nodeAppUnit(profile,uid,value))).join('\n'),{mode:0o600});
try{
 const installed=process.env.HELPER_MODE==='1'?helper('node-service-install',input):await installNodeAppService(input,nodeAppServiceHooks(input,uid));assert(installed.installed);assert.equal(installed.started,false);assert.equal(installed.enabled,false);assert.match(manager(),/ActiveState=inactive/);proof.checks.push('actual unit installation validates but does not start or enable service');
 const inspected=process.env.HELPER_MODE==='1'?helper('node-service-inspect',input):await inspectNodeAppService(input,{callerUid:uid,readUnit:nodeAppServiceControlHooks(input,uid).readUnit});assert(inspected.registered);assert.equal(inspected.serviceOptions.restart,'no');proof.checks.push('actual installed unit inspection matches reviewed profile and options');
 assert((await control('start')).changed);await ready();assert.match(manager(),/ActiveState=active/);const first=pid();assert(first>0);proof.checks.push('actual start runs as installer account and serves Korean env content through private socket');
 if(process.env.RECOVERY_MODE==='1'){
 proof.prerequisites=proof.checks.splice(0);const originalBytes=await fs.readFile('/etc/systemd/system/'+unit);
 assert.throws(()=>helper('node-service-update',{...input,uid:uid+1,unitVersion:inspected.unitVersion,options:modifiedOptions}),error=>error.status===400);assert.deepEqual(await fs.readFile('/etc/systemd/system/'+unit),originalBytes);proof.checks.push('canonical helper rejects a different service account before changing the unit');
 const updated=helper('node-service-update',{...input,unitVersion:inspected.unitVersion,options:modifiedOptions});assert.equal(updated.changed,true);assert.equal(updated.restarted,false);assert.equal(updated.journalCleanupVerified,true);assert.equal(pid(),first);await ready();assert.equal(helper('node-service-inspect',input).serviceOptions.restart,'on-failure');proof.checks.push('reviewed service update creates backup and reloads manager without restarting app');
 const backups=helper('node-service-backups',input);assert(backups.backups.some(value=>value.id===updated.backupId));const backup=backups.backups.find(value=>value.id===updated.backupId);assert.equal(backup.serviceOptions.restart,'no');const plan=helper('node-service-restore-plan',{...input,backupId:backup.id});assert.equal(plan.unitVersion,updated.version);assert.equal(plan.backupVersion,inspected.unitVersion);proof.checks.push('canonical helper lists and reviews the exact original service backup');
 const restored=helper('node-service-restore',{...input,...plan});assert.equal(restored.changed,true);assert.equal(restored.restarted,false);assert.equal(restored.journalCleanupVerified,true);assert.deepEqual(await fs.readFile('/etc/systemd/system/'+unit),originalBytes);assert.equal(pid(),first);await ready();const after=helper('node-service-backups',input);assert(after.backups.some(value=>value.id===restored.backupId&&value.version===updated.version));proof.checks.push('restore returns original unit bytes, preserves running PID and creates undo backup');await control('stop');assert.match(manager(),/ActiveState=inactive/);
 }else{
 if(process.env.STOP_ONLY!=='1'){assert((await control('restart')).changed);await ready();assert(pid()>0&&pid()!==first);proof.checks.push('actual restart changes process and preserves reviewed environment');
 await control('enable');assert.match(manager(),/UnitFileState=enabled/);await control('disable');assert.match(manager(),/UnitFileState=disabled/);proof.checks.push('enable and disable affect only the dedicated generated unit');}
 await fs.writeFile(root+'/app/.env','VALUE="변경됨"\n');await assert.rejects(control('restart'),error=>error.status===409);assert.equal(pid()>0,true);await control('stop');assert.match(manager(),/ActiveState=inactive/);proof.checks.push('changed reviewed env blocks restart while explicit stop remains available');if(process.env.STOP_ONLY==='1'){proof.prerequisites=proof.checks.slice(0,3);proof.checks=proof.checks.slice(3);}}proof.status='PASS';
}catch(error){proof.errorClass=error.name;proof.errorMessage=error.message;if(error.fixtureDiagnostic)proof.fixtureDiagnostic=error.fixtureDiagnostic;}await fs.writeFile(root+'/proof.json',JSON.stringify(proof));
"""
 (root/'run.mjs').write_text(script)
 env={**os.environ,'FIXTURE_ROOT':str(root),'FIXTURE_UID':str(account.pw_uid),'FIXTURE_ID':identifier,'STOP_ONLY':'1' if __STOP_ONLY__ else '0','HELPER_MODE':'1' if __HELPER_MODE__ else '0','RECOVERY_MODE':'1' if __RECOVERY_MODE__ else '0'}
 completed=subprocess.run(['/usr/bin/node',str(root/'run.mjs')],env=env,capture_output=True,text=True,timeout=120)
 if (root/'proof.json').exists():proof=json.loads((root/'proof.json').read_text())
 else:proof['errorClass']='RunnerFailed'
 if unitfile.exists():
  expected=(root/'expected-unit-sha256').read_text()
finally:
 if unitfile.exists():
  expected=expected or (root/'expected-unit-sha256').read_text();assert not unitfile.is_symlink() and hashlib.sha256(unitfile.read_bytes()).hexdigest() in expected.splitlines()
  subprocess.run(['/usr/bin/systemctl','--no-ask-password','stop',unit],check=True,capture_output=True,timeout=30)
  subprocess.run(['/usr/bin/systemctl','--no-ask-password','disable',unit],check=True,capture_output=True,timeout=30)
  text=unitfile.read_text();assert expected and hashlib.sha256(text.encode()).hexdigest() in expected.splitlines()
  unitfile.unlink();subprocess.run(['/usr/bin/systemctl','--no-ask-password','daemon-reload'],check=True,capture_output=True,timeout=30)
 proof['dedicatedUnitRemoved']=not unitfile.exists()
 shutil.rmtree(root);proof['privateStageRemoved']=not root.exists()
print(json.dumps(proof,ensure_ascii=False))
'''.replace('__SOURCES__',repr(sources)).replace('__STOP_ONLY__',repr(stop_only)).replace('__HELPER_MODE__',repr(helper_mode)).replace('__HELPER_SOURCE__',repr(helper_source)).replace('__RECOVERY_MODE__',repr(recovery_mode))
run=subprocess.run(['ssh','-i','/home/whitecalvin/.ssh/id_ed25519','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=8','whitecalvin@192.168.0.103','sudo -n python3 -'],input=remote,text=True,capture_output=True,timeout=240)
result=json.loads(run.stdout) if run.returncode==0 else {'status':'FAIL','transportErrorSha256':hashlib.sha256(run.stderr.encode()).hexdigest()}
result['canonicalHelper']=helper_mode
result['recoveryMode']=recovery_mode
if helper_mode:result['helperSha256']=hashlib.sha256(helper_source.encode()).hexdigest()
result['sources']={name:hashlib.sha256(text.encode()).hexdigest() for name,text in sources.items()}
folder=project/'.runtime/verification'/('node-service-systemd-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ'));folder.mkdir(parents=True);(folder/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'evidence':str(folder/'result.json'),**{k:v for k,v in result.items() if k!='sources'},'sourceCount':len(sources)},ensure_ascii=False));raise SystemExit(0 if result['status']=='PASS' else 1)
