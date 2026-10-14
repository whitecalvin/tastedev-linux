import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,mkdir,writeFile,readFile,rm,stat} from 'node:fs/promises';import path from 'node:path';
import {postgresqlConfigGraph} from '../lib/postgresql-config-graph.ts';import {postgresqlConfigCandidate} from '../lib/postgresql-config-candidate.ts';import {postgresqlConfigNamespacePlan,inspectPostgresqlConfigCandidate} from '../lib/postgresql-config-validation.ts';
const root='/etc/postgresql/16/main/postgresql.conf',identity={validationUid:process.getuid(),validationGid:process.getgid()};
async function fixture(run){const base=await mkdtemp('/mnt/data/build/tastedev-linux/pg-config-validation-');let candidate;try{const cluster=path.join(base,'postgresql/16/main');await mkdir(path.join(cluster,'conf.d'),{recursive:true,mode:0o700});await writeFile(path.join(cluster,'postgresql.conf'),"port=5433\ninclude_dir 'conf.d'\npassword='private-configuration'\n",{mode:0o600});await writeFile(path.join(cluster,'conf.d/10-app.conf'),'max_connections=100\n',{mode:0o600});candidate=await postgresqlConfigCandidate(await postgresqlConfigGraph(root,{base}));await run(candidate);}finally{await candidate?.cleanup();await rm(base,{recursive:true,force:true});}}
const inspect=({binary})=>({path:binary,sha256:'a'.repeat(64),ino:1,dev:1,bytes:100});
const executor=calls=>(binary,args,options)=>{calls.push({binary,args,options});assert.equal(binary,'/usr/bin/bwrap');const payload=args.slice(args.lastIndexOf('--')+1);if(payload[0]==='/usr/bin/id')return String(payload[1]==='-u'?identity.validationUid:identity.validationGid)+'\n';return ({port:'5433',max_connections:'100',shared_buffers:'16384',work_mem:'4096',logging_collector:'off'})[payload.at(-1)]+'\n';};
test('PostgreSQL fixed namespace mounts private payload without exposing its host private ancestor or operational data',async()=>fixture(async candidate=>{
 assert.equal((await stat(candidate.directory)).mode&0o777,0o700);assert.equal((await stat(candidate.payload)).mode&0o777,0o700);assert.equal((await stat(candidate.main)).mode&0o777,0o600);const plan=await postgresqlConfigNamespacePlan(candidate,'/usr/lib/postgresql/16/bin/postgres',['-D','/mnt/data/build/tastedev-linux/postgresql-sandbox-scratch','-c','config_file='+candidate.main,'-c','data_directory=/mnt/data/build/tastedev-linux/postgresql-sandbox-scratch','-C','port']);assert(plan.args.includes('--unshare-all'));assert(plan.args.includes('--disable-userns'));assert(plan.args.includes('--cap-drop'));assert(plan.args.includes('--perms'));assert(!plan.args.includes('--bind'));assert(!plan.args.includes('/var/lib/postgresql'));assert(plan.args.includes(candidate.payload));assert(!plan.args.includes('/etc/postgresql'));
 await assert.rejects(postgresqlConfigNamespacePlan({...candidate},'/usr/bin/id',['-u']));await assert.rejects(postgresqlConfigNamespacePlan(candidate,'/bin/sh',['-c','bad']));await assert.rejects(postgresqlConfigNamespacePlan(candidate,'/usr/lib/postgresql/16/bin/postgres',['-D','/var/lib/postgresql','-C','port']));await assert.rejects(postgresqlConfigNamespacePlan(candidate,'/usr/lib/postgresql/16/bin/postgres',['-D','/mnt/data/build/tastedev-linux/postgresql-sandbox-scratch','-c','config_file='+candidate.main,'-c','data_directory=/mnt/data/build/tastedev-linux/postgresql-sandbox-scratch','-C','password']));
}));
test('PostgreSQL native read validates namespace identity and returns only fixed public values with explicit limits',async()=>fixture(async candidate=>{
 const calls=[],report=await inspectPostgresqlConfigCandidate(candidate,{...identity,inspect,execute:executor(calls)});assert.equal(calls.length,7);assert.equal(report.valid,true);assert.equal(report.values.port,'5433');assert.equal(report.scope,'private-config-options');assert.equal(report.postmasterStarted,false);assert.equal(report.autoConfigurationVerified,false);assert.equal(report.operationalResourcesVerified,false);assert(!JSON.stringify(report).includes('private-configuration'));assert.equal(calls[0].options.shell,false);assert.deepEqual(calls[0].options.stdio,['ignore','pipe','pipe']);assert.equal(calls[0].options.timeout,30000);assert.equal(calls[0].options.maxBuffer,4096);assert.equal(await readFile(candidate.main,'utf8').then(text=>text.includes('private-configuration')),true);
}));
test('PostgreSQL parser rejects failed identity, native errors, excessive/private output, executable changes and candidate mutation',async()=>fixture(async candidate=>{
 await assert.rejects(inspectPostgresqlConfigCandidate(candidate,{...identity,inspect,execute:()=>'-1\n'}));
 await assert.rejects(inspectPostgresqlConfigCandidate(candidate,{...identity,inspect,execute:()=>{throw Error('private-diagnostic');}}),error=>!error.message.includes('private-diagnostic'));
 await assert.rejects(inspectPostgresqlConfigCandidate(candidate,{...identity,inspect:()=>{throw Error('private-path');},execute:()=>assert.fail()}),error=>error.status===409&&!error.message.includes('private-path'));
 await assert.rejects(inspectPostgresqlConfigCandidate(candidate,{...identity,inspect,execute:()=> 'x'.repeat(4097)}));
 const calls=[];await assert.rejects(inspectPostgresqlConfigCandidate(candidate,{...identity,inspect,execute:(binary,args,options)=>args.at(-1)==='port'?'private-password':executor(calls)(binary,args,options)}));
 let changed=false;await assert.rejects(inspectPostgresqlConfigCandidate(candidate,{...identity,inspect:options=>({...inspect(options),sha256:(changed?'b':'a').repeat(64)}),execute:()=>{changed=true;return String(identity.validationUid);}}),error=>error.status===409);
 await assert.rejects(inspectPostgresqlConfigCandidate(candidate,{...identity,inspect,execute:async()=>{await writeFile(candidate.main,'port=9999\n');return String(identity.validationUid);}}),error=>error.status===409);
}));
test('PostgreSQL validator rejects a zero UID or mismatched candidate account before any execution',async()=>fixture(async candidate=>{
 for(const change of [{validationUid:0},{validationUid:identity.validationUid+1},{validationGid:identity.validationGid+1}])await assert.rejects(inspectPostgresqlConfigCandidate(candidate,{...identity,...change,inspect,execute:()=>assert.fail()}));
}));

test('native diagnostic output stays private on success, failure and stderr overflow in a real subprocess',async()=>{
 const {execFile}=await import('node:child_process'),{promisify}=await import('node:util');
 for(const mode of ['success','failure','excessive-stderr']){
  const result=await promisify(execFile)(process.execPath,[new URL('./helpers/postgresql-diagnostic-worker.mjs',import.meta.url).pathname,mode],{timeout:15000,maxBuffer:65536});
  assert.equal(result.stderr,'',mode+' must not print diagnostic output into parent stderr');
  assert(!result.stdout.includes('private-setting-value'));
  const report=JSON.parse(result.stdout);
  if(mode==='success'){assert.equal(report.valid,true);assert.equal(report.values.port,'5433');}
  else{assert.equal(report.valid,false);assert.equal(report.status,400);assert.equal(report.message,'PostgreSQL 격리 설정 검수가 실패했습니다.');assert.deepEqual(report.keys,['status']);}
 }
});
