// Real auth/API over HTTP. OS metadata and privileged transport are fixtures;
// this does not inspect or modify an operating PostgreSQL service.
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {jsonRecord} from './http-json.ts';
import {diagnostic} from './nginx-native-report.ts';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import path from 'node:path';
import {postgresqlServiceDirectory} from '../../lib/postgresql-hba-service.ts';
import {helperErrorFromStderr,helperErrorCollector} from '../../lib/helper-error.ts';
import {postgresqlLocalApi} from './postgresql-local-api.ts';

const root=await verificationWorkDirectory('tastedev-pg-diagnostic-'),checks:string[]=[];
let api:Awaited<ReturnType<typeof postgresqlLocalApi>>|undefined,result:Record<string,unknown>={status:'FAIL',checks};
try{
 let rejected:unknown;
 try{await postgresqlServiceDirectory('/media/user/data/postgresql/18/main',{uid:128,gid:134},{statPath:async folder=>({uid:folder==='/media/user/data'?1000:0,gid:0,mode:0o755,isDirectory:()=>true,isSymbolicLink:()=>false})});}
 catch(error){rejected=error;}
 assert(rejected instanceof Error);const failure=rejected;assert('status' in failure);assert.equal(failure.status,409);assert('directory' in failure);assert.equal(failure.directory,'/media/user/data');
 const source=await readFile(new URL('../admin/linux-admin',import.meta.url),'utf8');
 const context=vm.createContext({require:createRequire(import.meta.url),process,Buffer});
 vm.runInContext(source.replace(/^#!.*\n/,'').split('main().catch')[0],context);
 const action='postgresql-hba-operation-plan',serialize=jsonRecord(context).helperErrorOutput;assert(typeof serialize==='function');const envelope:unknown=serialize(rejected,action);assert(typeof envelope==='string');const collector=helperErrorCollector();
 for(const byte of Buffer.from(envelope))collector.write(Buffer.from([byte]));
 const received=helperErrorFromStderr(action,collector.finish());
 assert(received);assert.equal(received.status,409);assert.equal(received.message,failure.message);
 checks.push('current helper serializer and fragmented UTF-8 transport preserve Korean path diagnosis and HTTP status');
 api=await postgresqlLocalApi(root,async requested=>{assert.equal(requested,action);throw received;});
 const request={path:'/etc/postgresql/18/main/pg_hba.conf',version:'a'.repeat(64),text:'local all all peer\n'};
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
 assert(!JSON.stringify(audits).includes('/media/user/data'));
 checks.push('audit records failure without directory metadata or configuration contents');
 result={status:'PASS',checks,httpApiTested:true,betterAuthTested:true,helperSerializerTested:true,privilegedTransportFixture:true,osMetadataFixture:true,operatingServiceTested:false,configurationApplied:false,serviceReloaded:false};
}catch(error){result={status:'FAIL',checks,message:diagnostic(error)};process.exitCode=1;}
finally{
 try{await api?.close();await rm(root,{recursive:true,force:true});result.privateFixtureRemoved=true;}
 catch(error){result.status='FAIL';result.cleanupError=diagnostic(error);process.exitCode=1;}
 const evidence=path.join(verificationWorkRoot,'postgresql-service-diagnostic-api-'+new Date().toISOString().replaceAll(':','-')+'.json');
 await mkdir(path.dirname(evidence),{recursive:true});await writeFile(evidence,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({...result,evidence}));
}
