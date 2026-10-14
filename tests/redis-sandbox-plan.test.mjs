import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {redisTopology} from '../lib/redis-topology.ts';
import {redisCandidate} from '../lib/redis-candidate.ts';
import {redisSandboxPlan} from '../lib/redis-sandbox-plan.ts';
import {redisSandboxProcessHooks} from '../lib/redis-sandbox-process.ts';
import {EventEmitter} from 'node:events';
import {validateRedisSandboxCandidate} from '../lib/redis-sandbox-validation.ts';
import {redisSandboxReviewer} from '../lib/redis-sandbox-review.ts';

test('configured data paths exist as empty namespace directories without operating mounts',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','redis-empty-data-'));let candidate;
 try{
  const base=path.join(root,'redis');await mkdir(base,{mode:0o700});
  await writeFile(path.join(base,'redis.conf'),'dir /var/lib/redis\ninclude /etc/redis/extra.conf\n',{mode:0o600});
  await writeFile(path.join(base,'extra.conf'),'dir "/srv/redis data"\ndir /usr/bin\ndir /var/../usr/bin\n',{mode:0o600});
  const graph=await redisTopology(undefined,base);candidate=await redisCandidate({version:graph.version,changes:{port:6380}},base);
  const runtime='/mnt/data/build/tastedev-linux/tastedev-redis-validation-fixture',plan=await redisSandboxPlan(candidate,runtime);
  for(const directory of ['/var/lib/redis','/srv/redis data']){const i=plan.args.indexOf(directory);assert.equal(plan.args[i-1],'--dir');}
  assert(!plan.args.includes('/var/../usr/bin'));
  assert(!JSON.stringify(plan.validation.resourceReview).includes('/srv/redis data'));
  assert.deepEqual(plan.args.flatMap((arg,i)=>['--bind','--ro-bind'].includes(arg)?[plan.args.slice(i+1,i+3)]:[]),[['/usr','/usr'],[candidate.directory,candidate.directory],[runtime,runtime]]);
 }finally{await candidate?.cleanup();await rm(root,{recursive:true,force:true});}
});

test('sandbox plan isolates network and host resources with only private writable mount',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','redis-sandbox-plan-'));let candidate;
 try {
  const base=path.join(root,'redis');await mkdir(base,{mode:0o700});
  await writeFile(path.join(base,'redis.conf'),'port 6379\n',{mode:0o600});
  const graph=await redisTopology(undefined,base);
  candidate=await redisCandidate({version:graph.version,changes:{port:6380}},base);
  const runtime='/mnt/data/build/tastedev-linux/tastedev-redis-validation-fixture';
  const plan=await redisSandboxPlan(candidate,runtime);
  assert.equal(plan.binary,'/usr/bin/bwrap');
  assert.ok(plan.args.includes('--unshare-all'));
  assert.ok(plan.args.includes('--unshare-user'));
  assert.ok(plan.args.includes('--die-with-parent'));
  assert.ok(plan.args.includes('--disable-userns'));
  assert.ok(plan.args.includes('--assert-userns-disabled'));
  assert.deepEqual(plan.args.slice(plan.args.indexOf('--size'),plan.args.indexOf('--size')+4),['--size','16777216','--tmpfs','/mnt/data/build/tastedev-linux/redis-sandbox-scratch']);
  assert.ok(!plan.args.includes('--share-net'));
  const writable=plan.args.flatMap((arg,i)=>arg==='--bind'?[plan.args.slice(i+1,i+3)]:[]);
  assert.deepEqual(writable,[[runtime,runtime]]);
  assert.ok(!plan.args.includes('/var/lib/redis'));
  assert.equal(plan.args[plan.args.indexOf('--')+1],'/usr/bin/prlimit');
  assert.equal(plan.args[plan.args.lastIndexOf('--')+1],'/usr/bin/redis-server');
  for(const limit of ['--as=536870912:536870912','--cpu=10:10','--fsize=1048576:1048576','--nofile=128:128','--nproc=32:32','--core=0:0'])assert.ok(plan.args.includes(limit));
  assert.equal(plan.resourceLimitsVerified,false);
  assert.equal(plan.executed,false);assert.equal(plan.resourceIsolationVerified,false);
  assert.throws(()=>plan.args.push('--share-net'));
  let probeCalls=0;
  const reviewer=redisSandboxReviewer({inspectExecutables:()=>['fixed-fixture'],execute:(binary,args,options)=>{
   probeCalls++;assert.equal(binary,'/usr/bin/bwrap');assert.equal(args.at(-1),'/usr/bin/true');
   assert.ok(!args.includes('/usr/bin/redis-server'));assert.equal(options.timeout,3000);assert.equal(options.shell,false);
  }});
  assert.equal(reviewer(plan),true);assert.equal(probeCalls,1);
  assert.equal(reviewer({...plan}),false);assert.equal(probeCalls,1);
  assert.throws(()=>redisSandboxReviewer({inspectExecutables:()=>[],execute:()=>{throw Error('private probe detail');}})(plan),error=>error.status===503&&error.code==='REDIS_SANDBOX_UNAVAILABLE'&&!error.message.includes('private probe detail'));
  let inspectCount=0;assert.equal(redisSandboxReviewer({inspectExecutables:()=>[inspectCount++],execute:()=>{throw Error('private probe detail');}})(plan),false,'changed executables must remain a review denial');
  let launches=0;
  const child=new EventEmitter();child.kill=()=>queueMicrotask(()=>child.emit('close',0));
  const options={plan,verifyBinary:()=>true,probe:async()=>{},launch:(binary,args)=>{
   launches++;assert.equal(binary,'/usr/bin/bwrap');assert.equal(args,plan.args);return child;
  }};
  const denied=redisSandboxProcessHooks({...options,verifySandbox:()=>false});
  assert.throws(()=>denied.start(plan.validation,runtime));assert.equal(launches,0);
  assert.throws(()=>redisSandboxProcessHooks({...options,plan:{...plan},verifySandbox:()=>true}));
  const hooks=redisSandboxProcessHooks({...options,verifySandbox:()=>true});
  assert.throws(()=>hooks.start({...plan.validation},runtime));
  assert.throws(()=>hooks.start(plan.validation,'/tmp/other'));
  assert.equal(hooks.start(plan.validation,runtime),child);
  await hooks.waitReady(child,runtime,{timeoutMs:1000});await hooks.stop(child);
  assert.equal(launches,1);
  const binary={path:'/usr/bin/redis-server',sha256:'a'.repeat(64)};
  let nativeCalls=0,location;
  const executables=['/usr/bin/bwrap','/usr/bin/prlimit'].map(path=>({path,sha256:'a'.repeat(64)}));
  const native={inspectBinary:()=>binary,inspectExecutables:()=>executables,probe:async()=>{},launch:(executable,argv)=>{
   nativeCalls++;assert.equal(executable,'/usr/bin/bwrap');location=argv[argv.indexOf('--chdir')+1];
   const handle=new EventEmitter();handle.kill=()=>queueMicrotask(()=>handle.emit('close',0));return handle;
  }};
  await assert.rejects(validateRedisSandboxCandidate(candidate,{...native,verifySandbox:()=>false}));
  assert.equal(nativeCalls,0);
  await assert.rejects(validateRedisSandboxCandidate(candidate,{...native,inspectBinary:()=>{throw Object.assign(Error('private executable path'),{code:'ENOENT'});},verifySandbox:()=>true}),error=>error.code==='REDIS_EXECUTABLE_UNAVAILABLE'&&!error.message.includes('private executable path'));
  let failedRuntime;await assert.rejects(validateRedisSandboxCandidate(candidate,{...native,verifySandbox:plan=>{failedRuntime=plan.args[plan.args.indexOf('--chdir')+1];throw Object.assign(Error('private namespace path'),{status:503,code:'REDIS_SANDBOX_UNAVAILABLE'});}}),error=>error.status===503&&error.code==='REDIS_SANDBOX_UNAVAILABLE'&&!error.message.includes('private namespace path'));assert.equal(nativeCalls,0);
  const {stat:runtimeStat}=await import('node:fs/promises');await assert.rejects(runtimeStat(failedRuntime),{code:'ENOENT'});
  const result=await validateRedisSandboxCandidate(candidate,{...native,verifySandbox:()=>true});
  assert.equal(result.valid,true);assert.equal(result.operationalResourcesVerified,false);
  assert.equal(nativeCalls,1);
  const {stat}=await import('node:fs/promises');await assert.rejects(stat(location),{code:'ENOENT'});
  await assert.rejects(validateRedisSandboxCandidate(candidate,{...native,verifySandbox:()=>{
   executables[0].sha256='b'.repeat(64);return true;
  }}));
  assert.equal(nativeCalls,1);
  await assert.rejects(validateRedisSandboxCandidate(candidate,{...native,inspectExecutables:()=>[],verifySandbox:()=>true}));
  await assert.rejects(validateRedisSandboxCandidate(candidate,{...native,verifySandbox:()=>true,probe:async()=>{throw Error('private readiness error');}}),error=>!error.message.includes('private readiness error'));
  assert.equal(nativeCalls,2);await assert.rejects(stat(location),{code:'ENOENT'});
  let deniedLocation;
  await assert.rejects(validateRedisSandboxCandidate(candidate,{...native,verifySandbox:plan=>{
   deniedLocation=plan.args[plan.args.indexOf('--chdir')+1];binary.sha256='b'.repeat(64);return true;
  }}));
  assert.equal(nativeCalls,2);await assert.rejects(stat(deniedLocation),{code:'ENOENT'});
  await assert.rejects(redisSandboxPlan({...candidate},runtime));
  await assert.rejects(redisSandboxPlan(candidate,'/run/redis'));
 } finally {await candidate?.cleanup();await rm(root,{recursive:true,force:true});}
});
