import './build-workspace.ts';
import type {ExecFileSyncOptions} from 'node:child_process';
import type {PostgresqlConfigCandidate} from '../lib/postgresql-config-candidate.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './verification/work-directory.ts';
import {jsonRecord,recordField} from './verification/http-json.ts';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {execFile,execFileSync} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {postgresqlConfigGraph} from '../lib/postgresql-config-graph.ts';
import {postgresqlConfigCandidate} from '../lib/postgresql-config-candidate.ts';
import {inspectPostgresqlConfigCandidate} from '../lib/postgresql-config-validation.ts';
import {validationIdentityBinary} from '../lib/validation-identity-binary.ts';
import {execFileSync as privateExecFileSync} from '../lib/admin-native-exec.ts';

const args=process.argv.slice(2),worker=args[0]==='--worker',major=worker?args[2]:args[0]??'18';
if(!/^[1-9][0-9]$/.test(major)||Number(major)<15||args.length>(worker?3:1)||worker&&!['valid','invalid'].includes(args[1]))throw Error('Usage: node scripts/verify-postgresql-private-diagnostics-host.ts [major]');
assert(process.getuid&&process.getgid);const uid=process.getuid(),gid=process.getgid();assert.notEqual(uid,0,'Private verifier must run as an ordinary account');
if(worker){
 const base=await verificationWorkDirectory('tastedev-pg-private-diagnostic-');let candidate:PostgresqlConfigCandidate|undefined;
 try{
  const cluster=path.join(base,'postgresql',major,'fixture');await mkdir(cluster,{recursive:true,mode:0o700});
  await writeFile(path.join(cluster,'postgresql.conf'),args[1]==='valid'?"port=5433\nmax_connections=20\nshared_buffers='16MB'\nwork_mem='4MB'\nlogging_collector=off\n":"port='private-setting-value'\n",{mode:0o600});
  candidate=await postgresqlConfigCandidate(await postgresqlConfigGraph('/etc/postgresql/'+major+'/fixture/postgresql.conf',{base}),{validationUid:uid,validationGid:gid});
  let privateNativeMarkerObserved=false;
  const execute=(binary:string,args:string[],options:ExecFileSyncOptions)=>{try{return privateExecFileSync(binary,args,options);}catch(error){privateNativeMarkerObserved=String(error!==null&&typeof error==='object'&&'stderr' in error?error.stderr:'').includes('private-setting-value');throw error;}};
  try{process.stdout.write(JSON.stringify(await inspectPostgresqlConfigCandidate(candidate,{execute,validationUid:uid,validationGid:gid})));}
  catch(error){assert(error instanceof Error&&'status' in error);process.stdout.write(JSON.stringify({valid:false,status:error.status,message:error.message,keys:Object.keys(error),privateNativeMarkerObserved}));}
 }finally{await candidate?.cleanup();await rm(base,{recursive:true,force:true});}
}else{
 const binary='/usr/lib/postgresql/'+major+'/bin/postgres';
 const binaries=['/usr/bin/bwrap','/usr/bin/prlimit','/usr/bin/id',binary].map(binary=>validationIdentityBinary({binary}));
 const version=execFileSync(binary,['--version'],{encoding:'utf8',timeout:10000,stdio:['ignore','pipe','pipe']}).trim();
 const checks:string[]=[];
 for(const mode of ['valid','invalid']){
  const output=await promisify(execFile)(process.execPath,[fileURLToPath(import.meta.url),'--worker',mode,major],{timeout:60000,maxBuffer:65536});
  assert.equal(output.stderr,'');assert(!output.stdout.includes('private-setting-value'));
  const result=jsonRecord(JSON.parse(output.stdout));
  if(mode==='valid'){assert.equal(result.valid,true);assert.equal(recordField(result,'values').port,'5433');assert.equal(result.namespaceCommandsCompleted,true);}
  else{assert.equal(result.valid,false);assert.equal(result.status,400);assert.equal(result.message,'PostgreSQL 격리 설정 검수가 실패했습니다.');assert.deepEqual(result.keys,['status']);assert.equal(result.privateNativeMarkerObserved,true,'The actual native error must include the fixture marker in its private pipe');}
  checks.push(mode+': native namespace stdout is a public bounded result and parent stderr is empty');
 }
 assert.deepEqual(binaries,binaries.map(({path:binary})=>validationIdentityBinary({binary})));
 const sha256=createHash('sha256').update(await readFile(new URL('../lib/postgresql-config-validation.ts',import.meta.url))).digest('hex');
 const record={status:'PASS',scope:'private-fixture-native-diagnostic-containment',version,binaries,sourceSha256:sha256,checks,namespaceUid:uid,namespaceGid:gid,nativeConfigurationValidation:true,operatingConfigurationChanged:false,operatingServiceChanged:false,rootHelperInvoked:false};
 const evidence=path.join(verificationWorkRoot,'postgresql-private-diagnostics-host-'+new Date().toISOString().replaceAll(':','-')+'.json');
 await mkdir(path.dirname(evidence),{recursive:true,mode:0o700});await writeFile(evidence,JSON.stringify(record,null,2)+'\n',{mode:0o600,flag:'wx'});
 process.stdout.write(JSON.stringify({...record,evidence})+'\n');
}
