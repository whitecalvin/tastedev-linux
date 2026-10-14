// Runs only inside the separately owned QA-103 cluster created by the controller.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const [runtime,target,root,port,role]=process.argv.slice(2),password=process.env.QA_SCRAM_PASSWORD;
assert.equal(process.getuid?.(),0);assert(typeof runtime==='string'&&typeof target==='string'&&typeof root==='string'&&typeof port==='string'&&typeof role==='string'&&typeof password==='string');assert(/^\/mnt\/data\/build\/tastedev-linux\/postgresql-scram-[A-Za-z0-9_-]+$/.test(root));assert.equal(runtime,root+'/runtime');assert.equal(target,'/etc/postgresql/18/'+role+'/pg_hba.conf');assert(/^[0-9]+$/.test(port)&&Number(port)>0&&Number(port)<=65535);assert(/^[a-f0-9]{48}$/.test(password));assert(/^qa_scram_[a-f0-9]{12}$/.test(role));
const operation:typeof import('../../lib/postgresql-hba-operation.ts')=await import(pathToFileURL(runtime+'/postgresql-hba-operation.mjs').href);const {postgresqlHbaOperationPlan,applyPostgresqlHbaOperation}=operation;
const serviceModule:typeof import('../../lib/postgresql-hba-service.ts')=await import(pathToFileURL(runtime+'/postgresql-hba-service.mjs').href);const {postgresqlHbaServiceHooks}=serviceModule;
const options={...postgresqlHbaServiceHooks(),root:root+'/backups'},hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
const env={NODE_ENV:'test' as const,PATH:'/usr/bin:/usr/sbin:/bin',HOME:'/',LANG:'C.UTF-8',LC_ALL:'C.UTF-8',TMPDIR:root,TMP:root,TEMP:root};
function sql(query:string){const result=spawnSync('/usr/sbin/runuser',['--user','postgres','--','/usr/lib/postgresql/18/bin/psql','-X','-w','-h','/run/postgresql','-p',port,'-U','postgres','-d','postgres','-A','-t','-v','ON_ERROR_STOP=1','-f','-'],{input:query,encoding:'utf8',timeout:10000,env});assert.equal(result.status,0,'Fixture SQL failed');return result.stdout.trim();}
function login(pass:string){return spawnSync('/usr/lib/postgresql/18/bin/psql',['-X','-w','-h','127.0.0.1','-p',port,'-U',role,'-d','postgres','-A','-t','-v','ON_ERROR_STOP=1','-c','SELECT value FROM qa_scram_data'],{encoding:'utf8',timeout:10000,env:{...env,PGPASSWORD:pass,PGCONNECT_TIMEOUT:'3'}});}
const original=await readFile(target,'utf8'),reject=`host postgres ${role} 127.0.0.1/32 reject`,allow=reject.replace(' reject',' scram-sha-256');assert(original.startsWith(reject+'\n'));
sql(`SET password_encryption='scram-sha-256'; CREATE ROLE ${role} LOGIN PASSWORD '${password}'; CREATE TABLE qa_scram_data(value text); INSERT INTO qa_scram_data VALUES ('한글 SCRAM 인증'); GRANT SELECT ON qa_scram_data TO ${role};`);
assert.equal(sql(`SELECT rolpassword LIKE 'SCRAM-SHA-256$%' FROM pg_authid WHERE rolname='${role}'`),'t');
assert.notEqual(login(password).status,0,'Baseline reject must deny the correct password');
const before=await options.inspectService(target);assert(before!==null&&typeof before==='object'&&'pid' in before&&typeof before.pid==='number');const request={path:target,version:hash(original),text:original.replace(reject,allow)},plan=await postgresqlHbaOperationPlan(request,options);
assert.equal(plan.validation.valid,true);const applied=await applyPostgresqlHbaOperation({...request,reviewVersion:plan.reviewVersion,confirm:true},options);assert.equal(applied.changed,true);
const accepted=login(password);assert.equal(accepted.status,0,'SCRAM authentication failed');assert.equal(accepted.stdout.trim(),'한글 SCRAM 인증');
const denied=login('incorrect-fixture-password');assert.notEqual(denied.status,0);assert.match(denied.stderr,/password authentication failed/i);
assert.equal(sql(`SELECT auth_method FROM pg_hba_file_rules WHERE user_name=ARRAY['${role}'] AND error IS NULL`),'scram-sha-256');
const restore={path:target,version:hash(await readFile(target)),backupId:applied.backupId},review=await postgresqlHbaOperationPlan(restore,options);const restored=await applyPostgresqlHbaOperation({...restore,reviewVersion:review.reviewVersion,confirm:true},options);assert.equal(restored.changed,true);
assert.equal(await readFile(target,'utf8'),original);assert.notEqual(login(password).status,0);assert.equal(sql('SELECT value FROM qa_scram_data'),'한글 SCRAM 인증');const after=await options.inspectService(target);assert(after!==null&&typeof after==='object'&&'pid' in after&&typeof after.pid==='number');assert.equal(after.pid,before.pid);
console.log(JSON.stringify({status:'PASS',checks:['native candidate validation','reviewed HBA apply and reload','SCRAM password storage','correct password and Korean query success','incorrect password rejection','actual parsed SCRAM rule','reviewed backup restore and baseline rejection','Korean data and same server PID preserved'],pid:after.pid,port:Number(port),backupId:applied.backupId,passwordRecorded:false}));
