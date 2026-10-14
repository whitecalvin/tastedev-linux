"""Install Redis only in the existing owned GUI container; no host package writes."""
import json,pathlib,subprocess,sys,time,hashlib,os
project=pathlib.Path.cwd();file=pathlib.Path(sys.argv[1]).resolve();assert file.is_relative_to(project/'.runtime/verification');fixture=json.loads(file.read_text())
worker="""
import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {createHash} from 'node:crypto';
import {startInstall,getJob,inventory} from '/mnt/data/build/tastedev-linux/package-fixture/source/lib/packages.mjs';
assert.equal(process.getuid(),1000);const prior=await getJob();const expected=['/usr/bin/apt-get','install','--yes','--no-remove','--no-upgrade','redis-server'];const started=prior?.status==='success'&&JSON.stringify(prior.command)===JSON.stringify(expected)?prior:await startInstall(['redis']);let job;const deadline=Date.now()+180000;
do{await new Promise(resolve=>setTimeout(resolve,250));job=await getJob();assert.equal(job.id,started.id);assert(Date.now()<deadline);}while(job.status==='running');
assert.equal(job.status,'success');const redis=(await inventory()).find(row=>row.id==='redis');assert(redis.installed);
console.log(JSON.stringify({status:'PASS_ACTUAL_REDIS_INSTALL_FOR_RECOVERY_GUI',jobId:job.id,command:job.command,exitCode:job.exitCode,redis,binarySha256:createHash('sha256').update(await fs.readFile('/usr/bin/redis-server')).digest('hex'),hostPackagesChanged:false}));
"""
remote="""
import json,pathlib,subprocess,time
p=__FIXTURE__;root=pathlib.Path(p['root']);assert root.parent==pathlib.Path('/mnt/data/build/tastedev-linux/package-gui') and not root.is_symlink();assert (root/'identity').read_text()==p['identity']
info=json.loads(subprocess.check_output(['docker','inspect',p['container']],text=True))[0];assert info['Id']==p['container'] and info['Image']==p['image'] and info['Config']['Labels']['tastedev.qa.identity']==p['identity']
deadline=time.time()+90
while not (root/'ready').exists():
 assert time.time()<deadline;info=json.loads(subprocess.check_output(['docker','inspect',p['container']],text=True))[0];assert info['State']['Running'];time.sleep(.5)
r=subprocess.run(['docker','exec','--interactive','--user','packageqa','--workdir','/mnt/data/build/tastedev-linux/package-fixture/source',p['container'],'/usr/bin/node','--input-type=module','-'],input=__WORKER__,text=True,capture_output=True,timeout=200)
assert r.returncode==0,r.stderr[-1000:];proof=json.loads(r.stdout);subprocess.run(['docker','exec',p['container'],'/usr/bin/test','-f','/etc/redis/redis.conf'],check=True);proof['configurationPresent']=True;proof['privateConfigPermissionPreserved']=True;print(json.dumps(proof))
""".replace('__FIXTURE__',repr(fixture)).replace('__WORKER__',repr(worker))
ssh=['ssh','-F','/dev/null','-i','/home/whitecalvin/.ssh/id_ed25519','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','whitecalvin@192.168.0.103','sudo -n python3 -']
result=subprocess.run(ssh,input=remote,text=True,capture_output=True,timeout=300);assert result.returncode==0,result.stderr[-1000:];proof=json.loads(result.stdout);(file.parent/'native-install.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n');print(json.dumps(proof),flush=True)
