import test from 'node:test';import assert from 'node:assert/strict';
import {postgresqlPidFile,postgresqlHbaServiceTarget,postgresqlRuntimeSettings,inspectPostgresqlHbaService,postgresqlHbaServiceHooks,postgresqlServiceDirectory} from '../lib/postgresql-hba-service.ts';
const hba='/etc/postgresql/16/main/pg_hba.conf',target=postgresqlHbaServiceTarget(hba),record={pid:123,data:'/var/lib/postgresql/16/main',started:1720000000,port:5433,socket:'/run/postgresql',start:'777'},settings={data:record.data,config:target.config,hba,port:5433,version:160015,pidFile:'123\n/var/lib/postgresql/16/main\n1720000000\n5433\n/run/postgresql\nlocalhost\n123 456\nready\n',readOnly:'on'};
test('untrusted data ancestors report the exact path without allowing another account or writable root directory',async()=>{
 const owner={uid:128,gid:134},visits=[];
 const root={uid:0,gid:0,mode:0o755,isDirectory:()=>true,isSymbolicLink:()=>false};
 const statPath=async folder=>{visits.push(folder);return folder==='/media/user/data'?{...root,uid:1000,gid:1000}:root;};
 await assert.rejects(postgresqlServiceDirectory('/media/user/data/postgresql/18/main',owner,{statPath}),error=>error.status===409&&error.code==='POSTGRESQL_UNTRUSTED_DIRECTORY'&&error.directory==='/media/user/data'&&error.message.includes('root 또는 PostgreSQL'));
 assert.deepEqual(visits,['/media','/media/user','/media/user/data']);
 for(const changes of [{mode:0o777},{mode:0o775},{isSymbolicLink:()=>true},{isDirectory:()=>false}])await assert.rejects(postgresqlServiceDirectory('/run',owner,{statPath:async()=>({...root,...changes})}),error=>error.code==='POSTGRESQL_UNTRUSTED_DIRECTORY');
 await postgresqlServiceDirectory('/run/postgresql',owner,{statPath:async folder=>folder==='/run'?root:{...root,uid:128,gid:134,mode:0o2775}});
 await assert.rejects(postgresqlServiceDirectory('/run/postgresql',owner,{statPath:async folder=>folder==='/run'?root:{...root,uid:128,gid:1000,mode:0o2775}}),error=>error.code==='POSTGRESQL_UNTRUSTED_DIRECTORY');
});
test('postmaster metadata rejects TCP endpoints, shutdown state and mismatched running HBA paths',()=>{
 const pid='123\n/var/lib/postgresql/16/main\n1720000000\n5433\n/run/postgresql\nlocalhost\n123 456\nready   \n';assert.deepEqual(postgresqlPidFile(pid,123),{pid:123,data:record.data,started:record.started,port:5433,socket:record.socket});
 for(const value of [pid.replace('1720000000','999999999999999999999'),pid.replace('ready','stopping'),pid.replace('/run/postgresql','@abstract'),pid.replace('/run/postgresql','/run/postgresql,remote.invalid'),pid.replace('\n5433\n','\n70000\n')])assert.throws(()=>postgresqlPidFile(value,123));assert.throws(()=>postgresqlPidFile(pid,124));
 assert.deepEqual(postgresqlRuntimeSettings(JSON.stringify(settings),record,target,hba),settings);for(const changes of [{hba:'/etc/other.conf'},{config:'/mnt/data/build/tastedev-linux/fake.conf'},{data:'/var/lib/postgresql/17/main'},{version:170001},{pidFile:settings.pidFile.replace('1720000000','1720000001')},{readOnly:'off'}])assert.throws(()=>postgresqlRuntimeSettings(JSON.stringify({...settings,...changes}),record,target,hba));
});
test('operational review uses a fixed read-only socket query, verifies native client and rejects PID changes',async()=>{
 const calls=[],binaries=[];let pid=123;const deps={lookup:async()=>({uid:100,gid:100}),verifyExecutable:binary=>binaries.push(binary),processSnapshot:async()=>({...record}),runCommand:async(binary,args,env)=>{calls.push({binary,args,env});return {stdout:binary==='/usr/bin/systemctl'?'LoadState=loaded\nActiveState=active\nMainPID='+pid+'\n':JSON.stringify(settings)};}};
 const result=await inspectPostgresqlHbaService(hba,deps);assert.equal(result.hba,hba);assert.equal(result.settingsSource,'running-server');assert.equal(result.pid,123);assert.deepEqual(binaries,[target.binary,'/usr/lib/postgresql/16/bin/psql']);
 const query=calls.find(call=>call.binary==='/usr/sbin/runuser');assert(query.args.includes('--no-password'));assert(query.args.includes('--host=/run/postgresql'));assert(query.env.PGOPTIONS.includes('default_transaction_read_only=on'));assert.equal(query.env.PGPASSFILE,'/dev/null');assert(!JSON.stringify(result).includes('SELECT'));assert(!calls.some(call=>call.args.some(arg=>arg.includes('pg_reload_conf'))));
 await assert.rejects(inspectPostgresqlHbaService(hba,{...deps,processSnapshot:async()=>{pid=124;return {...record};}}),error=>error.status===409);
});
test('reload verifies the original OS identity before and after signalling without new authentication during rollback',async()=>{
 const calls=[],service={hba,pid:123,unit:target.unit};const hooks=postgresqlHbaServiceHooks({inspect:async()=>service,identity:async received=>{assert.equal(received,service);calls.push('identity');},runCommand:async(binary,args)=>{assert.equal(binary,'/usr/bin/systemctl');assert.deepEqual(args,['--no-ask-password','reload',target.unit]);calls.push('reload');}});
 assert.deepEqual(await hooks.reload(service),{reloadRequested:true,reloadAcceptanceVerified:false});assert.deepEqual(calls,['identity','reload','identity']);
});

test('server-owned PID metadata verifies identity without comparing independently sampled SQL startup time',()=>{
 assert.deepEqual(postgresqlRuntimeSettings(JSON.stringify({...settings,started:record.started+1}),record,target,hba),{...settings,started:record.started+1});
 for(const pidFile of [undefined,settings.pidFile.replace('123\n','124\n'),settings.pidFile.replace('5433\n','5434\n'),settings.pidFile.replace('ready','stopping')])assert.throws(()=>postgresqlRuntimeSettings(JSON.stringify({...settings,pidFile}),record,target,hba));
});
