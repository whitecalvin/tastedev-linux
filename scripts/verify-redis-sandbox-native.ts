import type {RedisCandidate} from '../lib/redis-candidate.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './verification/work-directory.ts';
import {mkdir,writeFile,readFile,readlink,stat,rm} from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import assert from 'node:assert/strict';
import {redisTopology} from '../lib/redis-topology.ts';
import {redisCandidate} from '../lib/redis-candidate.ts';
import {redisSandboxPlan} from '../lib/redis-sandbox-plan.ts';
import {redisSandboxExecutables} from '../lib/redis-sandbox-executables.ts';
import {redisValidationRuntimeHooks} from '../lib/redis-validation-runtime.ts';
import {redisSandboxReviewer} from '../lib/redis-sandbox-review.ts';
const exec=promisify(execFile),runtimeHooks=redisValidationRuntimeHooks();
const root=await verificationWorkDirectory('redis-sandbox-native-');let candidate:RedisCandidate|undefined,runtime:string|undefined;
try{
 const executables=redisSandboxExecutables();
 const base=path.join(root,'redis');await mkdir(base,{mode:0o700});
 const original='port 6379\n';await writeFile(path.join(base,'redis.conf'),original,{mode:0o600});
 const graph=await redisTopology(undefined,base);
 candidate=await redisCandidate({version:graph.version,changes:{port:6380}},base);
 runtime=await runtimeHooks.createRuntime();const plan=await redisSandboxPlan(candidate,runtime);
 assert.equal(redisSandboxReviewer()(plan),true);
 // Replace only the Redis payload with a fixed infrastructure probe. No server
 // starts and no candidate directive is executed by this probe.
 const hostNamespaces=await Promise.all(['net','pid'].map(name=>readlink('/proc/self/ns/'+name)));
 const script=`set -eu
test -r "$1"
if (printf x >> "$1") 2>/dev/null; then exit 21; fi
test ! -e /etc/passwd
test ! -e /run/systemd
test "$(ulimit -v)" = 524288
test "$(ulimit -n)" = 128
test "$(ulimit -c)" = 0
test "$(ulimit -f)" = 2048
umask 077
printf sandbox-ok > "$2/redis.log"
if /usr/bin/dd if=/dev/zero of="$2/validation.rdb" bs=1048576 count=2 >/dev/null 2>&1; then exit 22; fi
printf 'PASS\\n'
/usr/bin/readlink /proc/self/ns/net /proc/self/ns/pid`;
 const argv=[...plan.args.slice(0,plan.args.lastIndexOf('--')+1),'/usr/bin/sh','-c',script,'probe',candidate.main,runtime];
 const result=await exec(plan.binary,argv,{timeout:10000,maxBuffer:4096,env:{NODE_ENV:'test',PATH:'/usr/bin:/bin',TMPDIR:verificationWorkRoot,TMP:verificationWorkRoot,TEMP:verificationWorkRoot},encoding:'utf8',shell:false});
 const output=result.stdout.trim().split('\n');assert.equal(output[0],'PASS');assert.equal(output.length,3);
 for(let index=0;index<2;index++){assert.match(output[index+1],/^(net|pid):\[\d+\]$/);assert.notEqual(output[index+1],hostNamespaces[index]);}
 assert.equal((await stat(path.join(runtime,'validation.rdb'))).size,1048576);
 assert.equal(await readFile(path.join(runtime,'redis.log'),'utf8'),'sandbox-ok');
 assert.equal(await readFile(path.join(base,'redis.conf'),'utf8'),original);await runtimeHooks.verifyRuntime(runtime);
 const record={status:'PASS',scope:'sandbox-infrastructure-only',executables,checks:['registered candidate mount read-only','private runtime writable','host passwd and systemd absent','virtual memory and descriptor limits','core dumps disabled','file write capped at 1 MiB','network and PID namespaces differ from caller','original fixture preserved'],redisStarted:false,operatingConfigurationChanged:false,redisConfigurationValidated:false};
 const evidence=path.join(verificationWorkRoot,'evidence/redis-sandbox-native-'+new Date().toISOString().replaceAll(':','-')+'.json');
 await mkdir(path.dirname(evidence),{recursive:true,mode:0o700});await writeFile(evidence,JSON.stringify(record,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({...record,evidence}));
}finally{if(runtime)await runtimeHooks.cleanupRuntime(runtime);await candidate?.cleanup();await rm(root,{recursive:true,force:true});}
