// Actual local PostgreSQL parser against private generated clusters only.
// This verifies the validator and Korean explanations, not the privileged helper.
import type {PostgresqlHbaGraph} from '../../lib/postgresql-hba-graph.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {diagnostic} from './nginx-native-report.ts';
import assert from 'node:assert/strict';
import {promisify} from 'node:util';
import {execFile} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {validatePostgresqlHba} from '../../lib/postgresql-hba-validate.ts';
import {preparePostgresqlHbaCandidate,writePostgresqlHbaCandidate} from '../../lib/postgresql-hba-candidate.ts';
import {postgresqlHbaValidationPlan,postgresqlHbaValidationReport} from '../../lib/postgresql-hba-validation.ts';
import {postgresqlHbaDiagnosticMessage} from '../../lib/postgresql-hba.ts';
assert(process.getuid,'Linux identity support required');const uid=process.getuid();
assert(uid!==0,'임시 PostgreSQL 검사는 일반 계정으로 실행하세요.');
assert(process.argv.length===2,'추가 경로 또는 실행 인수는 받지 않습니다.');
const exec=promisify(execFile),hash=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex');
const root=await verificationWorkDirectory('tastedev-hba-local-'),base=path.join(root,'etc'),cluster=path.join(base,'postgresql/18/fixture'),target='/etc/postgresql/18/fixture/pg_hba.conf';
const source='local all all peer\n',checks:Record<string,unknown>[]=[];
let result:Record<string,unknown>={status:'FAIL'},phase='initialize';
const run=async(binary:string,args:readonly string[],stdin?:string)=>{
 const pending=exec(binary,args,{timeout:20000,maxBuffer:1048576,env:{NODE_ENV:'test',PATH:'/usr/bin:/bin',LANG:'C',LC_ALL:'C',TMPDIR:verificationWorkRoot,TMP:verificationWorkRoot,TEMP:verificationWorkRoot},cwd:'/'});
 assert(pending.child.stdin);pending.child.stdin.end(stdin??'');return (await pending).stdout;
};
async function candidate(graph:PostgresqlHbaGraph,sources:Map<string,string>,major:number){
 assert.equal(major,18);
 const privateRoot=await verificationWorkDirectory('linux-pg-hba-');
 try{
  const prepared=preparePostgresqlHbaCandidate(graph,sources,privateRoot),copy=await writePostgresqlHbaCandidate(prepared),plan=postgresqlHbaValidationPlan(privateRoot,major);
  await run(plan.init.binary,plan.init.args);
  await run(plan.inspect.binary,plan.inspect.args,plan.inspect.stdin);
  return postgresqlHbaValidationReport(await readFile(plan.report,'utf8'),{major,files:copy.files});
 }finally{await rm(privateRoot,{recursive:true,force:true});}
}
try{
 await mkdir(cluster,{recursive:true,mode:0o700});await writeFile(path.join(cluster,'pg_hba.conf'),source,{mode:0o600});
 await writeFile(path.join(cluster,'included.conf'),'local included all scram-sha-256\n',{mode:0o600});
 const fixtures=[
  ['유효한 포함 파일','include included.conf\nlocal all all peer\n',null],
  ['잘못된 인증 방식','local all all nonexistent_method\n','invalid-method'],
  ['잘못된 CIDR 주소','host all all 127.0.0.1/99 scram-sha-256\n','invalid-address'],
  ['지원하지 않는 인증 옵션','local all all peer secret_fixture=secret_value\n','invalid-option'],
  ['접속 규칙 필드 누락','host all\n','invalid-rule'],
  ['필수 포함 파일 없음','include missing.conf\n','missing-file'],
  ['포함 파일 순환','include pg_hba.conf\n','cycle-or-limit']
 ] as const;
 for(const [name,text,category] of fixtures){
  phase=name;
  const report=await validatePostgresqlHba({path:target,version:hash(source),text},{base,ownerUid:uid,runCandidate:candidate});
  assert.equal(report.valid,category===null,name);
  if(category){assert(report.diagnostics.some(item=>item.category===category),JSON.stringify(report.diagnostics));for(const item of report.diagnostics){assert.equal(item.path,category==='missing-file'?'/etc/postgresql/18/fixture/missing.conf':target);assert.match(postgresqlHbaDiagnosticMessage(item.category),/[가-힣]/);}}
  assert(!JSON.stringify(report).includes('secret_value'));
  assert.equal(await readFile(path.join(cluster,'pg_hba.conf'),'utf8'),source);
  checks.push({name,valid:report.valid,engine:report.engine,diagnostics:report.diagnostics.map(item=>({...item,message:postgresqlHbaDiagnosticMessage(item.category)}))});
 }
 const binary='/usr/lib/postgresql/18/bin/postgres';
 result={status:'PASS',scope:'한국어 접속 규칙 안내와 실제 PostgreSQL 단일 사용자 파서',version:(await run(binary,['--version'])).trim(),binarySha256:hash(await readFile(binary)),checks,operatingFilesChanged:false,privilegedHelperVerified:false,guiVerified:false,postmasterStarted:false,authenticationAttempted:false};
}catch(error){result={status:'FAIL',phase,message:diagnostic(error),checks};process.exitCode=1;}
finally{
 await rm(root,{recursive:true,force:true});
 const evidence=path.join(verificationWorkRoot,'postgresql-hba-local-'+new Date().toISOString().replaceAll(':','-')+'.json');await mkdir(path.dirname(evidence),{recursive:true});await writeFile(evidence,JSON.stringify({...result,fixtureCleaned:true},null,2)+'\n');console.log(JSON.stringify({...result,evidence}));
}
