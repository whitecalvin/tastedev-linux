"""Actual data dump/restore on a disposable QA-103 local-socket cluster."""
import pathlib,subprocess,json,hashlib,datetime,sys
failure_mode='--failure' in sys.argv
assert all(arg=='--failure' for arg in sys.argv[1:])
project=pathlib.Path.cwd();native_exec=(project/'lib/admin-native-exec.mjs').read_text();source=(project/'lib/postgresql-data-backup.mjs').read_text()
remote=r'''
import os,pwd,pathlib,tempfile,subprocess,json,shutil
assert os.getuid()==0
root=pathlib.Path(tempfile.mkdtemp(prefix='tastedev-pg-data-'));root.chmod(0o755)
account=pwd.getpwnam('postgres');binary='/usr/lib/postgresql/16/bin/';started=False;proof={'status':'FAIL'}
def run(name,args):return subprocess.run(['runuser','-u','postgres','--',binary+name,*args],capture_output=True,text=True,check=True,timeout=90)
try:
 for name in ['cluster','socket']:
  p=root/name;p.mkdir(mode=0o700);os.chown(p,account.pw_uid,account.pw_gid)
 (root/'backups').mkdir(mode=0o700)
 (root/'executor.mjs').write_text(__SOURCE__)
 (root/'admin-native-exec.mjs').write_text(__NATIVE_EXEC__)
 run('initdb',['-D',str(root/'cluster'),'--no-locale','--encoding=UTF8','--auth=trust'])
 run('pg_ctl',['-D',str(root/'cluster'),'-l',str(root/'cluster/log'),'-o',"-c listen_addresses='' -k "+str(root/'socket')+' -p 18451','-w','start']);started=True
 run('createdb',['-h',str(root/'socket'),'-p','18451','fixture'])
 run('psql',['-h',str(root/'socket'),'-p','18451','-d','fixture','-v','ON_ERROR_STOP=1','-c',"CREATE TABLE sample(id integer primary key, value text); INSERT INTO sample VALUES(1,'한글 원본');"])
 script=r"""import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {execFileSync} from 'node:child_process';import {createPostgresqlDataBackup,planPostgresqlDataRestore,restorePostgresqlDataBackup,listPostgresqlDataBackups} from './executor.mjs';
const root=process.env.FIXTURE_ROOT,binary='/usr/lib/postgresql/16/bin/',sql=text=>execFileSync('runuser',['-u','postgres','--',binary+'psql','-h',root+'/socket','-p','18451','-d','fixture','-At','-v','ON_ERROR_STOP=1','-c',text],{encoding:'utf8'}).trim();
const context={version:'16',socket:root+'/socket',port:18451,uid:Number(process.env.PG_UID),gid:Number(process.env.PG_GID),database:'fixture',databaseOid:sql("SELECT oid FROM pg_database WHERE datname='fixture'"),systemIdentifier:sql('SELECT system_identifier FROM pg_control_system()')};
const assertCurrent=async()=>{assert.equal(sql('SELECT system_identifier FROM pg_control_system()'),context.systemIdentifier);assert.equal(sql("SELECT oid FROM pg_database WHERE datname='fixture'"),context.databaseOid);};
const options={root:root+'/backups',context,assertCurrent},proof={status:'FAIL',checks:[]};
try{const backup=await createPostgresqlDataBackup(options);assert(backup.bytes>5);assert.equal(sql('SELECT value FROM sample'),'한글 원본');proof.checks.push('native custom dump preserves source Korean data');
const plan=await planPostgresqlDataRestore({...options,id:backup.id});await assert.rejects(restorePostgresqlDataBackup({...options,plan,confirmation:'wrong'}));assert.equal((await listPostgresqlDataBackups(options.root)).backups.length,1);proof.checks.push('wrong database confirmation rejected before undo or write');
sql("UPDATE sample SET value='수정된 값'; INSERT INTO sample VALUES(2,'추가된 값');");const result=await restorePostgresqlDataBackup({...options,plan,confirmation:'fixture'});assert(result.changed);assert.equal(sql('SELECT value FROM sample'),'한글 원본');assert.equal(sql('SELECT count(*) FROM sample'),'1');proof.checks.push('native transactional restore replaces table contents with Korean original');
const undoPlan=await planPostgresqlDataRestore({...options,id:result.undoBackupId});assert((await restorePostgresqlDataBackup({...options,plan:undoPlan,confirmation:'fixture'})).changed);assert.equal(sql('SELECT count(*) FROM sample'),'2');assert.equal(sql('SELECT value FROM sample WHERE id=1'),'수정된 값');proof.checks.push('automatic pre-restore backup retains and restores previous data');
const file=options.root+'/'+backup.id+'/data.dump';await fs.appendFile(file,'tampered');await assert.rejects(planPostgresqlDataRestore({...options,id:backup.id}));const listed=await listPostgresqlDataBackups(options.root);assert.equal(listed.warnings,1);assert.equal(sql('SELECT count(*) FROM sample'),'2');proof.checks.push('tampered archive rejected and excluded before database modification');proof.status='PASS';
}catch(error){proof.errorClass=error.name;proof.errorMessage=error.message;}await fs.writeFile(root+'/proof.json',JSON.stringify(proof));if(proof.status!=='PASS')process.exitCode=1;
"""
 if __FAILURE__:
  start=script.index('try{const backup=')
  end=script.index('}catch(error)',start)
  script=script[:start]+r"""try{const backup=await createPostgresqlDataBackup(options),plan=await planPostgresqlDataRestore({...options,id:backup.id});sql("UPDATE sample SET value='수정된 값'; CREATE VIEW restore_blocker AS SELECT * FROM sample;");const result=await restorePostgresqlDataBackup({...options,plan,confirmation:'fixture'});assert(result.failed);assert.equal(result.transactionStatus,'unknown');assert(result.undoBackupId);assert.equal(sql('SELECT value FROM sample'),'수정된 값');assert.equal(sql('SELECT value FROM restore_blocker'),'수정된 값');const undo=await planPostgresqlDataRestore({...options,id:result.undoBackupId});assert(undo.bytes>5);proof.checks.push('actual pg_restore dependency failure preserves original table and view');proof.checks.push('pre-restore data backup remains available after native failure');proof.status='PASS';
"""+script[end:]
 (root/'run.mjs').write_text(script)
 env={**os.environ,'FIXTURE_ROOT':str(root),'PG_UID':str(account.pw_uid),'PG_GID':str(account.pw_gid)}
 subprocess.run(['/usr/bin/node',str(root/'run.mjs')],env=env,capture_output=True,text=True,timeout=180)
 proof=json.loads((root/'proof.json').read_text())
except Exception as error:proof.update(errorClass=type(error).__name__)
finally:
 if started:
  stop=run('pg_ctl',['-D',str(root/'cluster'),'-m','fast','-w','stop']);proof['dedicatedClusterStopped']=stop.returncode==0
 shutil.rmtree(root);proof['privateStageRemoved']=not root.exists()
print(json.dumps(proof,ensure_ascii=False))
'''.replace('__SOURCE__',repr(source)).replace('__NATIVE_EXEC__',repr(native_exec)).replace('__FAILURE__',repr(failure_mode))
run=subprocess.run(['ssh','-i','/home/whitecalvin/.ssh/id_ed25519','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=8','whitecalvin@192.168.0.103','sudo -n python3 -'],input=remote,text=True,capture_output=True,timeout=360)
result=json.loads(run.stdout) if run.returncode==0 else {'status':'FAIL','transportErrorSha256':hashlib.sha256(run.stderr.encode()).hexdigest()}
result['sourceSha256']=hashlib.sha256(source.encode()).hexdigest()
folder=project/'.runtime/verification'/('postgresql-data-backup-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ'));folder.mkdir(parents=True)
(folder/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'evidence':str(folder/'result.json'),**result},ensure_ascii=False));raise SystemExit(0 if result['status']=='PASS' else 1)
