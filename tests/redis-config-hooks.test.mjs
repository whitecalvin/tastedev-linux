import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';
import {redisConfigHooks} from '../lib/redis-config-hooks.ts';import {redisCandidate} from '../lib/redis-candidate.ts';import {redisTopology} from '../lib/redis-topology.ts';
const scope={identityVerified:true,startupMainVerified:true,service:'redis-server.service',main:'/etc/redis/redis.conf'};
test('Redis operating hooks require verified explicit service main and restart only the fixed service',async()=>{
 const calls=[];let inspected=0;const hooks=redisConfigHooks({port:6380},async(...args)=>calls.push(args),{inspectService:async()=>{inspected++;return scope;}});
 await hooks.inspectService();await hooks.activate();await hooks.recover();assert.equal(inspected,3);assert.deepEqual(calls,Array.from({length:2},()=>['/usr/bin/systemctl',['--no-ask-password','restart','redis-server.service']]));
 for(const invalid of [{...scope,startupMainVerified:false},{...scope,main:'/etc/redis/other.conf'},{...scope,identityVerified:false}])await assert.rejects(redisConfigHooks({port:6380},async()=>{}, {inspectService:async()=>invalid}).inspectService(),error=>error.status===409);
});
test('Redis native adapter binds reviewed changes and rejects failed isolated validation',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','redis-hooks-'));let candidate;
 try{const base=path.join(root,'redis');await mkdir(base,{mode:0o700});await writeFile(path.join(base,'redis.conf'),'port 6379\n',{mode:0o600});const graph=await redisTopology(undefined,base);candidate=await redisCandidate({version:graph.version,changes:{port:6380}},base);
 let validations=0;const hooks=redisConfigHooks({port:6381},async()=>{}, {validateCandidate:async()=>{validations++;return {valid:true};}});await assert.rejects(hooks.validatePrepared(candidate));assert.equal(validations,0);
 await assert.rejects(redisConfigHooks({port:6380},async()=>{}, {validateCandidate:async()=>({valid:false})}).validatePrepared(candidate));
 const result=await redisConfigHooks({port:6380},async()=>{}, {validateCandidate:async()=>({valid:true,scope:'isolated-startup',operatingServiceChanged:false})}).validatePrepared(candidate);assert.equal(result.valid,true);
 }finally{await candidate?.cleanup();await rm(root,{recursive:true,force:true});}
});
