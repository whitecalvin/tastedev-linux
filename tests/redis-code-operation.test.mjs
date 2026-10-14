import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm,stat} from 'node:fs/promises';import path from 'node:path';import {tmpdir} from 'node:os';
import {redisTopology} from '../lib/redis-topology.ts';import {prepareRedisCode,redisCodeReviewVersion} from '../lib/redis-code-request.ts';import {redisCodeOperationPlan,applyRedisCodeOperation} from '../lib/redis-code-operation.ts';
async function fixture(run){const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','redis-code-operation-'));try{const base=path.join(root,'redis'),backupRoot=path.join(root,'backup');await mkdir(base,{mode:0o700});await mkdir(backupRoot,{mode:0o700});const original='port 6379\nrequirepass fixture-private\nsave 900 1\n',file=path.join(base,'redis.conf');await writeFile(file,original,{mode:0o600});const graph=await redisTopology(undefined,base),input={path:graph.root,version:graph.files[0].version,text:'port 6380\nrequirepass fixture-new-private\nsave 300 10\n'};await run({base,backupRoot,original,file,graph,input});}finally{await rm(root,{recursive:true,force:true});}}
const validated={valid:true,scope:'isolated-startup',operatingServiceChanged:false},service={identityVerified:true,startupMainVerified:true,service:'redis-server.service',main:'/etc/redis/redis.conf'};
test('Redis complete code request binds confirmation to exact code and graph and rejects extra fields and UTF-8 overflow',()=>{
 const input={path:'/etc/redis/redis.conf',version:'a'.repeat(64),graphVersion:'b'.repeat(64),candidateGraphVersion:'c'.repeat(64),text:'save 300 10\n'},commit={...input,reviewVersion:redisCodeReviewVersion(input),confirm:true};assert.deepEqual(prepareRedisCode(commit,true),commit);
 for(const change of [{text:'save 1 1\n'},{graphVersion:'c'.repeat(64)},{confirm:false},{base:'/tmp'},{text:'x\0'},{text:'x\ry'},{text:'가'.repeat(87382)},{path:'/etc/redis/other.conf'}])assert.throws(()=>prepareRedisCode({...commit,...change},true));
});
test('Redis code plan validates exact complete candidate, returns no passwords and cleans temporary files without changing original',async()=>fixture(async({base,backupRoot,original,file,input})=>{
 let directory;const plan=await redisCodeOperationPlan(input,{base,validate:async candidate=>{directory=candidate.directory;assert.equal(await readFile(candidate.main,'utf8'),input.text);return {...validated,secret:'private-native-output'};}});
 assert(plan.changed);assert(plan.reviewVersion);assert.equal(plan.operatingServiceChanged,false);assert(!JSON.stringify(plan).includes('fixture-new-private'));assert(!JSON.stringify(plan).includes('private-native-output'));assert.equal(await readFile(file,'utf8'),original);assert.deepEqual(await readdir(backupRoot),[]);await assert.rejects(stat(directory),{code:'ENOENT'});
}));
test('Redis code validation rejects stale includes, failed or mutated candidates and masks native details',async()=>fixture(async({base,file,input})=>{
 await assert.rejects(redisCodeOperationPlan({...input,version:'f'.repeat(64)},{base,validate:async()=>validated}),error=>error.status===409);
 await assert.rejects(redisCodeOperationPlan(input,{base,validate:async()=>{throw Error('private-native-output');}}),error=>error.status===400&&!error.message.includes('private-native-output'));
 await assert.rejects(redisCodeOperationPlan(input,{base,validate:async()=>{throw Object.assign(Error('private namespace path'),{status:503,code:'REDIS_SANDBOX_UNAVAILABLE'});}}),error=>error.status===503&&error.code==='REDIS_SANDBOX_UNAVAILABLE'&&!error.message.includes('private namespace path'));
 await assert.rejects(redisCodeOperationPlan(input,{base,validate:async candidate=>{await writeFile(candidate.main,'port 9999\n');return validated;}}),error=>error.status===409);
 await assert.rejects(redisCodeOperationPlan(input,{base,validate:async()=>{await writeFile(file,'port 6378\n');return validated;}}),error=>error.status===409);
}));
test('Redis full code application changes arbitrary directives, backs up original and rejects changed reviewed text before writes',async()=>fixture(async({base,backupRoot,original,file,input,graph})=>{
 const candidateGraph=await redisTopology(undefined,base,new Map([[input.path,input.text]])),reviewed={...input,graphVersion:graph.version,candidateGraphVersion:candidateGraph.version},commit={...reviewed,confirm:true,reviewVersion:redisCodeReviewVersion(reviewed)};let restarts=0;
 const hooks={base,backupRoot,inspectService:async()=>service,validateCandidate:async candidate=>{assert.equal(await readFile(candidate.main,'utf8'),input.text);return validated;},run:async(binary,args)=>{assert.equal(binary,'/usr/bin/systemctl');assert.deepEqual(args,['--no-ask-password','restart','redis-server.service']);restarts++;}};
 await assert.rejects(applyRedisCodeOperation({...commit,text:'port 6390\n'},hooks));assert.equal(restarts,0);assert.deepEqual(await readdir(backupRoot),[]);
 const result=await applyRedisCodeOperation(commit,hooks);assert.equal(result.changed,true);assert.equal(restarts,1);assert.equal(await readFile(file,'utf8'),input.text);const backup=JSON.parse(await readFile(path.join(backupRoot,result.backupId+'.json'),'utf8'));assert.equal(backup.text,original);assert(!JSON.stringify(result).includes('fixture-new-private'));
}));
test('Redis full code application restores exact original if service activation fails',async()=>fixture(async({base,backupRoot,original,file,input,graph})=>{
 const candidateGraph=await redisTopology(undefined,base,new Map([[input.path,input.text]])),reviewed={...input,graphVersion:graph.version,candidateGraphVersion:candidateGraph.version},commit={...reviewed,confirm:true,reviewVersion:redisCodeReviewVersion(reviewed)};let calls=0;
 const result=await applyRedisCodeOperation(commit,{base,backupRoot,inspectService:async()=>service,validateCandidate:async()=>validated,run:async()=>{if(++calls===1)throw Error('failed activation');}});assert(result.failed&&result.restored&&result.recovered);assert.equal(calls,2);assert.equal(await readFile(file,'utf8'),original);
}));

test('new Redis include files are bound to the review before native validation or replacement',async()=>fixture(async({base,backupRoot,file,input,original})=>{
 const included=path.join(base,'new.conf');await writeFile(included,'save 10 1\n',{mode:0o600});input.text+='include /etc/redis/new.conf\n';
 const plan=await redisCodeOperationPlan(input,{base,validate:async()=>validated}),commit={...input,graphVersion:plan.graphVersion,candidateGraphVersion:plan.candidateGraphVersion,reviewVersion:plan.reviewVersion,confirm:true};await writeFile(included,'save 20 2\n');let calls=0;
 await assert.rejects(applyRedisCodeOperation(commit,{base,backupRoot,inspectService:async()=>{calls++;return service;},validateCandidate:async()=>{calls++;return validated;},run:async()=>calls++}),error=>error.status===409);assert.equal(calls,0);assert.deepEqual(await readdir(backupRoot),[]);assert.equal(await readFile(file,'utf8'),original);
 await assert.rejects(redisCodeOperationPlan(input,{base,validate:async()=>{await writeFile(included,'save 30 3\n');return validated;}}),error=>error.status===409);
}));


test('Redis unsafe native executable is distinct from a stale graph and all private validation resources are cleaned',async()=>fixture(async({base,backupRoot,original,file,input})=>{
 const {redisValidationBinary}=await import('../lib/redis-validation-binary.ts'),{validateRedisCandidate}=await import('../lib/redis-candidate-validation.ts'),{redisValidationRuntimeHooks}=await import('../lib/redis-validation-runtime.ts');
 const binary=path.join(base,'unsafe-binary');await writeFile(binary,'private fixture executable',{mode:0o722});let directory,runtime,starts=0;
 const hooks=redisValidationRuntimeHooks();
 await assert.rejects(redisCodeOperationPlan(input,{base,validate:async candidate=>{
  directory=candidate.directory;
  return validateRedisCandidate(candidate,{...hooks,createRuntime:async()=>runtime=await hooks.createRuntime(),reviewResources:async()=>{redisValidationBinary({binary,anchor:base,ownerUid:process.getuid()});return {resourceIsolationVerified:true};},start:()=>{starts++;return {};},waitReady:async()=>{},stop:async()=>{}});
 }}),error=>error.status===409&&error.code==='VALIDATION_EXECUTABLE_UNTRUSTED'&&error.message==='Redis 검수 실행 파일의 경로·소유권·권한을 확인하세요.');
 assert.equal(starts,0);assert.equal(await readFile(file,'utf8'),original);assert.deepEqual(await readdir(backupRoot),[]);await assert.rejects(stat(directory),{code:'ENOENT'});await assert.rejects(stat(runtime),{code:'ENOENT'});
 await assert.rejects(redisCodeOperationPlan(input,{base,validate:async()=>{throw Object.assign(Error('private cleanup detail'),{status:500,code:'VALIDATION_EXECUTABLE_UNTRUSTED'});}}),error=>error.status===500&&!error.message.includes('private cleanup detail'));
}));
