// Real auth/API over HTTP. Executable permissions are a private filesystem fixture; privileged transport is an adapter;
// this does not inspect or modify an operating Redis service.
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {jsonRecord} from './http-json.ts';
import {diagnostic} from './nginx-native-report.ts';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import path from 'node:path';
import {redisValidationBinary} from '../../lib/redis-validation-binary.ts';
import {redisTopology} from '../../lib/redis-topology.ts';
import {redisCodeOperationPlan} from '../../lib/redis-code-operation.ts';
import {helperErrorFromStderr,helperErrorCollector} from '../../lib/helper-error.ts';
import {postgresqlLocalApi} from './postgresql-local-api.ts';

assert(process.getuid,'Linux identity support required');const ownerUid=process.getuid();
const root=await verificationWorkDirectory('tastedev-redis-diagnostic-'),checks:string[]=[];
let api:Awaited<ReturnType<typeof postgresqlLocalApi>>|undefined,result:Record<string,unknown>={status:'FAIL',checks};
try{
 const base=path.join(root,'redis');await mkdir(base,{mode:0o700});
 await writeFile(path.join(base,'redis.conf'),'port 6379\n',{mode:0o600});
 const binary=path.join(base,'unsafe-binary');await writeFile(binary,'private executable fixture',{mode:0o722});
 const graph=await redisTopology(undefined,base),request={path:graph.root,version:graph.files[0].version,text:'port 6380\n'};
 let rejected:unknown;
 try{await redisCodeOperationPlan(request,{base,validate:async()=>redisValidationBinary({binary,anchor:base,ownerUid})});}
 catch(error){rejected=error;}
 assert(rejected instanceof Error);const failure=rejected;assert('status' in failure);assert.equal(failure.status,409);assert('code' in failure);assert.equal(failure.code,'VALIDATION_EXECUTABLE_UNTRUSTED');
 assert.equal(failure.message,'Redis 검수 실행 파일의 경로·소유권·권한을 확인하세요.');
 const source=await readFile(new URL('../admin/linux-admin',import.meta.url),'utf8');
 const context=vm.createContext({require:createRequire(import.meta.url),process,Buffer});
 vm.runInContext(source.replace(/^#!.*\n/,'').split('main().catch')[0],context);
 const action='redis-code-plan',serialize=jsonRecord(context).helperErrorOutput;assert(typeof serialize==='function');const envelope:unknown=serialize(rejected,action);assert(typeof envelope==='string');const collector=helperErrorCollector();
 for(const byte of Buffer.from(envelope))collector.write(Buffer.from([byte]));
 const received=helperErrorFromStderr(action,collector.finish());
 assert(received);assert.equal(received.status,409);assert.equal(received.message,failure.message);
 checks.push('current helper serializer and fragmented UTF-8 transport preserve Korean path diagnosis and HTTP status');
 api=await postgresqlLocalApi(root,async requested=>{assert.equal(requested,action);throw received;});
 const response=await api.post(action,request);
 assert.equal(response.status,409);assert.equal(response.data.error,failure.message);
 assert(!JSON.stringify(response.data).includes('NOPASSWD'));assert.deepEqual(api.helperCalls,[action]);
 checks.push('authenticated actual HTTP API returns specific service error without misreporting sudo failure');
 api.policy.readOnly=true;await api.savePolicy();
 assert.equal((await api.post(action,request)).status,403);assert.deepEqual(api.helperCalls,[action]);
 checks.push('read-only policy still rejects before privileged dispatch');
 const audits=await api.audits();
 assert(audits.some(item=>item.action===action&&item.result==='failed'));
 assert(audits.every(item=>Object.keys(item).sort().join(',')==='action,at,result'));
 assert(!JSON.stringify(audits).includes(base));assert(!JSON.stringify(audits).includes(request.text));
 checks.push('audit records failure without directory metadata or configuration contents');
 result={status:'PASS',checks,httpApiTested:true,betterAuthTested:true,helperSerializerTested:true,privilegedTransportFixture:true,privateExecutablePermissionsTested:true,operatingServiceTested:false,configurationApplied:false,serviceReloaded:false};
}catch(error){result={status:'FAIL',checks,message:diagnostic(error)};process.exitCode=1;}
finally{
 try{await api?.close();await rm(root,{recursive:true,force:true});result.privateFixtureRemoved=true;}
 catch(error){result.status='FAIL';result.cleanupError=diagnostic(error);process.exitCode=1;}
 const evidence=path.join(verificationWorkRoot,'redis-executable-diagnostic-api-'+new Date().toISOString().replaceAll(':','-')+'.json');
 await mkdir(path.dirname(evidence),{recursive:true});await writeFile(evidence,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({...result,evidence}));
}
