import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,chmod,symlink,link,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {postgresqlAutoConfigVersion,postgresqlConfigRuntimeValues,inspectPostgresqlConfigService} from '../lib/postgresql-config-service.ts';
const hash=text=>createHash('sha256').update(text).digest('hex'),target='/etc/postgresql/16/main/postgresql.conf';
const values={port:'5432',max_connections:'100',shared_buffers:'16384',work_mem:'4096',logging_collector:'off'};
async function fixture(run){const root=await mkdtemp('/mnt/data/build/tastedev-linux/pg-runtime-test-');try{await mkdir(root+'/data',{mode:0o700});await run(root);}finally{await rm(root,{recursive:true,force:true});}}
test('PostgreSQL auto configuration is privately fingerprinted; absent and present files differ',async()=>fixture(async root=>{
 const absent=await postgresqlAutoConfigVersion(root+'/data',process.getuid());assert.equal(absent.present,false);
 const secret="password='private-runtime-value'\n";await writeFile(root+'/data/postgresql.auto.conf',secret,{mode:0o600});const result=await postgresqlAutoConfigVersion(root+'/data',process.getuid());assert.deepEqual(result,{present:true,version:hash(secret)});assert(!JSON.stringify(result).includes(secret));assert.notEqual(result.version,absent.version);
}));
test('PostgreSQL auto configuration rejects unsafe ancestors, directory links, leaf links and hardlinks',async()=>fixture(async root=>{
 await symlink(root+'/data',root+'/redirect');await assert.rejects(postgresqlAutoConfigVersion(root+'/redirect',process.getuid()));
 await writeFile(root+'/private.conf','port=5432\n',{mode:0o600});await symlink(root+'/private.conf',root+'/data/postgresql.auto.conf');await assert.rejects(postgresqlAutoConfigVersion(root+'/data',process.getuid()));await rm(root+'/data/postgresql.auto.conf');
 await link(root+'/private.conf',root+'/data/postgresql.auto.conf');await assert.rejects(postgresqlAutoConfigVersion(root+'/data',process.getuid()));await rm(root+'/data/postgresql.auto.conf');
 await chmod(root+'/data',0o777);await assert.rejects(postgresqlAutoConfigVersion(root+'/data',process.getuid()));
}));
test('PostgreSQL runtime parser permits only public scalar values and explicitly counts disk errors',()=>{
 assert.deepEqual(postgresqlConfigRuntimeValues(JSON.stringify({...values,errors:0,password:'private'})),values);
 assert.throws(()=>postgresqlConfigRuntimeValues(JSON.stringify({...values,errors:1})));assert.deepEqual(postgresqlConfigRuntimeValues(JSON.stringify({...values,errors:1}),{allowErrors:true}),values);
 for(const result of [{...values,port:5432,errors:0},{...values,logging_collector:'true',errors:0},{...values,errors:-1}])assert.throws(()=>postgresqlConfigRuntimeValues(JSON.stringify(result)));
});
test('PostgreSQL service inspection uses fixed readonly SQL and verifies identity and auto configuration twice',async()=>{
 const service={identityVerified:true,config:target,hba:'/etc/postgresql/16/main/pg_hba.conf',settingsSource:'running-server',data:'/var/lib/postgresql/16/main',major:16,socket:'/var/run/postgresql',port:5432};let identities=0,versions=0;
 const result=await inspectPostgresqlConfigService(target,{ownerUid:process.getuid(),inspect:async file=>{assert.equal(file,service.hba);return service;},identity:async item=>{assert.equal(item,service);identities++;},autoVersion:async()=>{versions++;return {present:true,version:hash('auto')};},runCommand:async(binary,args,env)=>{assert.equal(binary,'/usr/sbin/runuser');assert(args.includes('--no-password'));assert(args.includes('--no-psqlrc'));assert(args.at(-1).includes('pg_catalog.pg_file_settings'));assert(env.PGOPTIONS.includes('default_transaction_read_only=on'));assert.equal(env.PGPASSFILE,'/dev/null');return {stdout:JSON.stringify({...values,errors:2,password:'private'})};}});
 assert.equal(identities,2);assert.equal(versions,2);assert.deepEqual(result.values,values);assert.equal(result.configurationErrors,2);assert(!JSON.stringify(result).includes('private'));
 let count=0;await assert.rejects(inspectPostgresqlConfigService(target,{ownerUid:process.getuid(),inspect:async()=>service,identity:async()=>{},autoVersion:async()=>({present:true,version:hash(String(count++))}),runCommand:async()=>({stdout:JSON.stringify({...values,errors:0})})}),error=>error.status===409);
});
