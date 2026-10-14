"""Read candidate copies in private namespaces; never start an operating cluster."""
import pathlib,json,re,subprocess,datetime,hashlib
project=pathlib.Path.cwd()
names=re.findall(r"'([^']+\.mjs)'",(project/'scripts/admin/runtime-files.mjs').read_text())
files={name:(project/'lib'/name).read_text() for name in names}
runner=r'''
import fs from 'node:fs/promises';import assert from 'node:assert/strict';
import {postgresqlConfigGraph} from './postgresql-config-graph.mjs';
import {postgresqlConfigCandidate} from './postgresql-config-candidate.mjs';
import {inspectPostgresqlConfigCandidate} from './postgresql-config-validation.mjs';
import {postgresqlHbaGraph} from './postgresql-hba-graph.mjs';
import {runPostgresqlHbaCandidate} from './postgresql-hba-sandbox.mjs';
const root=process.env.FIXTURE_ROOT,base=root+'/etc',cluster=base+'/postgresql/18/fixture';
await fs.mkdir(cluster,{recursive:true,mode:0o700});
const text='port=55439\nmax_connections=42\nshared_buffers=16MB\nwork_mem=4MB\nlogging_collector=off\n';
await fs.writeFile(cluster+'/postgresql.conf',text,{mode:0o600});
let candidate;const proof={status:'FAIL'};
try{
 candidate=await postgresqlConfigCandidate(await postgresqlConfigGraph('/etc/postgresql/18/fixture/postgresql.conf',{base,ownerUid:0}),{validationUid:65534,validationGid:65534});
 const report=await inspectPostgresqlConfigCandidate(candidate);
 assert(report.valid);assert.equal(report.values.port,'55439');assert.equal(report.values.max_connections,'42');assert.equal(await fs.readFile(cluster+'/postgresql.conf','utf8'),text);
 assert(candidate.directory.startsWith('/mnt/data/build/'));await candidate.cleanup();candidate=null;
 const hba='local all all peer\nhost all all 127.0.0.1/32 scram-sha-256\n';
 await fs.writeFile(cluster+'/pg_hba.conf',hba,{mode:0o600});
 const sources=new Map(),graph=await postgresqlHbaGraph('/etc/postgresql/18/fixture/pg_hba.conf',{base,ownerUid:0,sources});
 const rules=await runPostgresqlHbaCandidate(graph,sources,18);assert(rules.valid);assert.equal(rules.ruleCount,2);assert.equal(await fs.readFile(cluster+'/pg_hba.conf','utf8'),hba);
 await fs.writeFile(cluster+'/pg_hba.conf','local all all invalid_method\n',{mode:0o600});
 const invalidSources=new Map(),invalidGraph=await postgresqlHbaGraph('/etc/postgresql/18/fixture/pg_hba.conf',{base,ownerUid:0,sources:invalidSources});
 const invalid=await runPostgresqlHbaCandidate(invalidGraph,invalidSources,18);assert.equal(invalid.valid,false);assert(invalid.diagnostics.some(row=>row.category==='invalid-method'));
 assert.deepEqual(await fs.readdir(process.env.TMPDIR),[]);
 Object.assign(proof,{status:'PASS',nativeConfigValues:report.values,hbaRules:rules.rules,invalidHbaRejected:true,candidateAndRuntimeCleaned:true,originalConfigurationPreserved:true,postmasterStarted:false,operatingServiceChanged:false});
}catch(error){proof.error={name:error.name,message:error.message};}finally{await candidate?.cleanup();}
console.log(JSON.stringify(proof));if(proof.status!=='PASS')process.exitCode=1;
'''
remote=r'''
import pathlib,tempfile,os,json,subprocess,shutil,hashlib
files=__FILES__;runner=__RUNNER__;assert os.getuid()==0
parent=pathlib.Path('/mnt/data/build/tastedev-linux');parent.mkdir(parents=True,mode=0o700,exist_ok=True)
assert parent.is_dir() and not parent.is_symlink() and parent.stat().st_uid==0 and not parent.stat().st_mode&0o077
root=pathlib.Path(tempfile.mkdtemp(prefix='pg-path-native-',dir=parent));result={'status':'FAIL'}
protected=[pathlib.Path('/etc/postgresql/18/main/postgresql.conf'),pathlib.Path('/etc/postgresql/18/main/pg_hba.conf'),pathlib.Path('/usr/lib/tastedev-linux/scripts/admin/linux-admin')]
def snapshot():return {str(p):hashlib.sha256(p.read_bytes()).hexdigest() if p.is_file() else None for p in protected}
before=snapshot()
try:
 for name,text in files.items():(root/name).write_text(text)
 (root/'package.json').write_text('{"type":"module"}');(root/'run.mjs').write_text(runner);(root/'temporary').mkdir(mode=0o700)
 env=dict(os.environ,FIXTURE_ROOT=str(root),TMPDIR=str(root/'temporary'),TMP=str(root/'temporary'),TEMP=str(root/'temporary'))
 run=subprocess.run(['/usr/bin/node',str(root/'run.mjs')],env=env,cwd=root,capture_output=True,text=True,timeout=150)
 result=json.loads(run.stdout);result['stderrSha256']=hashlib.sha256(run.stderr.encode()).hexdigest();result['exitCode']=run.returncode
 result['postgresBinarySha256']=hashlib.sha256(pathlib.Path('/usr/lib/postgresql/18/bin/postgres').read_bytes()).hexdigest()
except Exception as error:result['errorClass']=type(error).__name__
finally:
 result['hostProtectedFilesPreserved']=snapshot()==before
 shutil.rmtree(root);result['privateStageRemoved']=not root.exists()
print(json.dumps(result))
'''.replace('__FILES__',repr(files)).replace('__RUNNER__',repr(runner))
run=subprocess.run(['ssh','-F','/dev/null','-i','/home/whitecalvin/.ssh/id_ed25519','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','whitecalvin@192.168.0.103','sudo -n python3 -'],input=remote,text=True,capture_output=True,timeout=180)
folder=project/'.runtime/verification'/('postgresql-work-path-native-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ'));folder.mkdir(parents=True)
(folder/'transport-stderr.log').write_text(run.stderr);(folder/'transport-stdout.log').write_text(run.stdout)
result=json.loads(run.stdout) if run.returncode==0 else {'status':'FAIL','transportExit':run.returncode}
result['sourceSha256']={name:hashlib.sha256(text.encode()).hexdigest() for name,text in files.items()}
(folder/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'evidence':str(folder/'result.json'),**{key:value for key,value in result.items() if key!='sourceSha256'}},ensure_ascii=False))
raise SystemExit(0 if result['status']=='PASS' and result['hostProtectedFilesPreserved'] and result['privateStageRemoved'] else 1)
