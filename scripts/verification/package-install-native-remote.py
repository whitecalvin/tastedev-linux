"""Verify current app installation in an already-owned disposable package fixture."""
import argparse, json, pathlib, subprocess

p = argparse.ArgumentParser()
p.add_argument('--connection', required=True)
a = p.parse_args()
project = pathlib.Path.cwd()
connection = pathlib.Path(a.connection).resolve()
assert connection.is_relative_to(project / '.runtime/verification')
fixture = json.loads(connection.read_text())
worker = r'''
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {startInstall,getJob,inventory} from '/mnt/data/build/tastedev-linux/package-fixture/source/lib/packages.mjs';
assert.equal(process.getuid(),1000);
const groups=['nginx','certbot','nodejs','postgresql','mariadb','redis'];
const before=await inventory();
const started=await startInstall(groups);
let job,deadline=Date.now()+300000;
do{await new Promise(resolve=>setTimeout(resolve,250));job=await getJob();assert.equal(job.id,started.id);assert(Date.now()<deadline,'Installation deadline exceeded');}while(job.status==='running');
const after=await inventory();
const rootManifest=JSON.parse(await fs.readFile('/mnt/data/build/tastedev-linux/package-fixture/source-manifest.json','utf8'));
for(const [file,hash] of Object.entries(rootManifest))assert.equal(createHash('sha256').update(await fs.readFile('/mnt/data/build/tastedev-linux/package-fixture/source/'+file)).digest('hex'),hash);
const postgres=[];
try{for(const version of await fs.readdir('/usr/lib/postgresql')){const file='/usr/lib/postgresql/'+version+'/bin/postgres';try{postgres.push({file,sha256:createHash('sha256').update(await fs.readFile(file)).digest('hex')});}catch{}}}catch{}
let lockPresent=true;const lockDeadline=Date.now()+5000;while(lockPresent&&Date.now()<lockDeadline){try{await fs.stat(process.env.LINUX_AUTH_ROOT+'/install-jobs/install.lock');await new Promise(resolve=>setTimeout(resolve,50));}catch(error){if(error.code==='ENOENT')lockPresent=false;else throw error;}}
const status=job.status==='success'&&after.length===6&&after.every(row=>row.installed)&&!lockPresent?'PASS':'FAIL';
console.log(JSON.stringify({status,scope:'Current application startInstall, actual apt and six-package inventory in disposable container; not GUI click coverage',uid:process.getuid(),before,after,job,postgres,sourceManifest:rootManifest,lockPresent,allSixPackageGroupsTested:true}));
'''
remote = r'''
import json,pathlib,subprocess,time
fixture=FIXTURE
root=pathlib.Path(fixture['root'])
assert root.parent==pathlib.Path('/mnt/data/build/tastedev-linux/package-gui') and root.name.startswith('tastedev-package-gui-') and not root.is_symlink()
assert (root/'identity').read_text()==fixture['identity']
info=json.loads(subprocess.check_output(['docker','inspect',fixture['container']],text=True))[0]
assert info['Id']==fixture['container'] and info['Image']==fixture['image'] and info['Config']['Labels']['tastedev.qa.identity']==fixture['identity']
deadline=time.monotonic()+90
while not (root/'ready').exists():
 assert time.monotonic()<deadline,'Fixture readiness deadline exceeded'
 info=json.loads(subprocess.check_output(['docker','inspect',fixture['container']],text=True))[0]
 assert info['State']['Running'],'Fixture exited during preparation'
 time.sleep(.5)
proc=subprocess.run(['docker','exec','--interactive','--user','packageqa','--workdir','/mnt/data/build/tastedev-linux/package-fixture/source',fixture['container'],'/usr/bin/node','--input-type=module','-'],input=WORKER,text=True,capture_output=True,timeout=330)
print(json.dumps({'workerExit':proc.returncode,'stdout':proc.stdout,'stderr':proc.stderr}))
'''.replace('FIXTURE',repr(fixture)).replace('WORKER',repr(worker))
ssh=['ssh','-F','/dev/null','-i','/home/whitecalvin/.ssh/id_ed25519','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','whitecalvin@192.168.0.103','sudo -n python3 -']
result={'status':'FAIL'}
try:
    proc=subprocess.run(ssh,input=remote,text=True,capture_output=True,timeout=430)
    (connection.parent/'native-transport-stdout.log').write_text(proc.stdout)
    (connection.parent/'native-transport-stderr.log').write_text(proc.stderr)
    assert proc.returncode==0,'Remote worker failed; inspect saved transport log'
    envelope=json.loads(proc.stdout)
    (connection.parent/'native-worker-stderr.log').write_text(envelope['stderr'])
    assert envelope['workerExit']==0,'Application worker failed; inspect saved worker stderr'
    result=json.loads(envelope['stdout'].strip().splitlines()[-1])
finally:
    cleanup=subprocess.run(['python3','scripts/verification/package-install-original-gui.py','cleanup','--connection',str(connection)],text=True,capture_output=True,timeout=120)
    (connection.parent/'cleanup.log').write_text(cleanup.stdout+cleanup.stderr)
    result['cleanupConfirmed']=cleanup.returncode==0
    if cleanup.returncode:result['status']='FAIL'
    (connection.parent/'native-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':result['status'],'evidence':str(connection.parent/'native-result.json'),'cleanupConfirmed':result['cleanupConfirmed']}))
raise SystemExit(0 if result['status']=='PASS' else 1)
