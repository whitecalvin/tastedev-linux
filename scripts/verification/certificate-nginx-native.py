"""Read-only operating nginx inspection, private backup gate; no ACME dispatch."""
import argparse,base64,hashlib,json,pathlib,re,subprocess,datetime
p=argparse.ArgumentParser();p.add_argument('--execute',action='store_true');p.add_argument('--renew',action='store_true');p.add_argument('--fresh-staging-account',action='store_true');a=p.parse_args();assert not a.fresh_staging_account or a.renew;project=pathlib.Path.cwd();files={}
def collect(name):
 if name in files:return
 assert re.fullmatch(r'[a-z0-9-]+\.mjs',name)
 raw=(project/'lib'/name).read_bytes();files[name]=raw
 for dependency in re.findall(r"\bfrom\s+['\"]\./([a-z0-9-]+\.mjs)['\"]",raw.decode()):collect(dependency)
collect('certificate-nginx-backup.mjs');
if a.renew:collect('certificate-command.mjs')
manifest={name:hashlib.sha256(raw).hexdigest() for name,raw in files.items()}
if not a.execute:print(json.dumps({'scope':'103 existing nginx private backup only','domain':'eztoy.app','files':manifest,'operatingWrites':False,'acmeRequests':a.renew,'freshStagingAccount':a.fresh_staging_account}));raise SystemExit()
payload={name:base64.b64encode(raw).decode() for name,raw in files.items()}
remote=r'''
import pathlib,tempfile,json,base64,hashlib,subprocess,shutil,os
assert os.getuid()==0
files=__FILES__;manifest=__MANIFEST__;renew=__RENEW__;root=pathlib.Path(tempfile.mkdtemp(prefix='tastedev-cert-nginx-'));root.chmod(0o700)
try:
 for name,encoded in files.items():
  data=base64.b64decode(encoded);assert hashlib.sha256(data).hexdigest()==manifest[name];(root/name).write_bytes(data);(root/name).chmod(0o600)
 code="""import {backupCertificateNginx} from './certificate-nginx-backup.mjs';
import {nginxTopology} from './nginx-topology.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const before=await nginxTopology();const sha=value=>createHash('sha256').update(value).digest('hex');const protectedPaths=['/etc/letsencrypt/renewal/eztoy.app.conf','/etc/letsencrypt/live/eztoy.app/fullchain.pem'];const protectedHashes=Object.fromEntries(await Promise.all(protectedPaths.map(async p=>[p,sha(await readFile(p))])));let renewalExitCode=null;
try {
const result=await backupCertificateNginx('eztoy.app',{backupRoot:process.cwd()+'/backups'});
const proof=[];for(const item of result.backups){const record=JSON.parse(await readFile(process.cwd()+'/backups/'+item.id+'.json','utf8'));const current=await readFile(item.path);if(createHash('sha256').update(current).digest('hex')!==record.version||!current.equals(Buffer.from(record.text)))throw Error('Backup differs');proof.push({path:item.path,version:record.version});}
if (__NODE_RENEW__) {
const configuration=await readFile(protectedPaths[0],'utf8');if(/^(?:pre_hook|post_hook|renew_hook)\s*=/m.test(configuration))throw Error('Stored hook requires separate scope');
const {certificateCommand}=await import('./certificate-command.mjs');const {spawnSync}=await import('node:child_process');const command=certificateCommand({operation:'renew-check',certName:'eztoy.app',directoryHooks:false});const accountOptions=[];
if (__FRESH_ACCOUNT__) {
const fs=await import('node:fs/promises');const config=process.cwd()+'/certbot-config';await fs.mkdir(config+'/renewal',{recursive:true,mode:0o700});await fs.writeFile(config+'/renewal/eztoy.app.conf',configuration,{mode:0o600});await fs.mkdir(process.cwd()+'/certbot-work',{mode:0o700});await fs.mkdir(process.cwd()+'/certbot-logs',{mode:0o700});accountOptions.push('--config-dir',config,'--work-dir',process.cwd()+'/certbot-work','--logs-dir',process.cwd()+'/certbot-logs','--register-unsafely-without-email','--agree-tos');
}
const child=spawnSync(command[0],[...command.slice(1),...accountOptions],{encoding:'utf8',timeout:180000,maxBuffer:1048576});renewalExitCode=child.status;await (await import('node:fs/promises')).writeFile(process.cwd()+'/renew.log',(child.stdout||'')+(child.stderr||''),{mode:0o600});if(child.error||child.status!==0)throw Error('Native renewal dry-run failed');
}
for(const p of protectedPaths)if(sha(await readFile(p))!==protectedHashes[p])throw Error('Protected certificate or renewal changed');
const after=await nginxTopology();if(after.version!==before.version)throw Error('Operating graph changed');
console.log(JSON.stringify({status:'PASS',scope:'native operating graph/private backup',domain:'eztoy.app',graphVersion:before.version,backupFiles:proof,operatingConfigurationChanged:false,acmeRequests:__NODE_RENEW__,renewalExitCode,protectedHashes,freshStagingAccount:__FRESH_ACCOUNT__}));
}catch(error){const after=await nginxTopology();let protectedFilesChanged=false;for(const p of protectedPaths)if(sha(await readFile(p))!==protectedHashes[p])protectedFilesChanged=true;console.log(JSON.stringify({status:'FAIL',message:error.message,operatingConfigurationChanged:before.version!==after.version,protectedFilesChanged,graphComplete:before.complete,warnings:before.warnings,acmeRequests:__NODE_RENEW__,renewalExitCode,protectedHashes,freshStagingAccount:__FRESH_ACCOUNT__}));process.exitCode=1;}"""
 (root/'run.mjs').write_text(code)
 result=subprocess.run(['/usr/bin/node',str(root/'run.mjs')],cwd=root,capture_output=True,text=True,timeout=240)
 output=json.loads(result.stdout);output['sourceManifest']=manifest
 if renew and (root/'renew.log').exists():output['renewalLog']=(root/'renew.log').read_text()
finally:
 if 'output' in locals() and not output.get('operatingConfigurationChanged',True) and not output.get('protectedFilesChanged',False):shutil.rmtree(root)
 else:raise RuntimeError('Unverified operation; private evidence retained at '+str(root))
output['privateStageRemoved']=not root.exists();print(json.dumps(output));raise SystemExit(0 if output['status']=='PASS' else 1)
'''.replace('__FILES__',repr(payload)).replace('__MANIFEST__',repr(manifest)).replace('__RENEW__',repr(a.renew)).replace('__NODE_RENEW__','true' if a.renew else 'false').replace('__FRESH_ACCOUNT__','true' if a.fresh_staging_account else 'false')
r=subprocess.run(['ssh','-o','BatchMode=yes','-o','ConnectTimeout=8','-o','StrictHostKeyChecking=yes','-i','/home/whitecalvin/.ssh/id_ed25519','whitecalvin@192.168.0.103','sudo -n python3 -'],input=remote,text=True,capture_output=True,timeout=270)
evidence=project/('.runtime/verification/certificate-nginx-native-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ'));evidence.mkdir(exist_ok=True)
(evidence/'result.json').write_text(r.stdout);(evidence/'stderr.log').write_text(r.stderr);data=json.loads(r.stdout);print(json.dumps({k:v for k,v in data.items() if k not in ['sourceManifest','backupFiles','renewalLog','protectedHashes']}));raise SystemExit(r.returncode)
