import test from 'node:test';
import assert from 'node:assert/strict';
import {postgresqlConfigHooks} from '../lib/postgresql-config-hooks.ts';
const candidate='/etc/postgresql/16/main/.tastedev-config-12345678-1234-1234-1234-123456789abc';
test('PostgreSQL hooks identify one cluster and query requested candidate values without starting a server',async()=>{
 const calls=[];
 const hooks=postgresqlConfigHooks('/etc/postgresql/16/main/postgresql.conf',{port:5433,workMem:16,logging:true},async(binary,args)=>{calls.push([binary,args]);return {port:'5433\n',work_mem:'16384\n',logging_collector:'on\n'}[args.at(-1)]||'';});
 await hooks.preflight();await hooks.validate(candidate);assert.equal(calls.length,4);
 assert.deepEqual(calls[0],['/usr/bin/pg_ctlcluster',['16','main','status']]);
 assert.deepEqual(calls[1],['/usr/sbin/runuser',['-u','postgres','--','/usr/lib/postgresql/16/bin/postgres','-D','/etc/postgresql/16/main','-c','config_file='+candidate,'-C','port']]);
 assert(calls.slice(1).every(([,args])=>args.includes('-C')));
 await hooks.activate();assert.deepEqual(calls.slice(-2),[['/usr/bin/pg_ctlcluster',['16','main','restart']],['/usr/bin/pg_ctlcluster',['16','main','status']]]);
 await hooks.recover();assert.equal(calls.at(-2)[1].at(-1),'restart');
});
test('PostgreSQL hooks reject wrong target, unknown fields, stopped cluster and effective-value mismatch',async()=>{
 for(const target of ['/etc/passwd','/etc/postgresql/16/--bad/postgresql.conf','/etc/postgresql/16/main/../postgresql.conf'])assert.throws(()=>postgresqlConfigHooks(target,{port:5433},async()=>''));
 assert.throws(()=>postgresqlConfigHooks('/etc/postgresql/16/main/postgresql.conf',{password:'secret'},async()=>''));
 const hooks=postgresqlConfigHooks('/etc/postgresql/16/main/postgresql.conf',{port:5433},async()=>{throw Error('private');});
 await assert.rejects(hooks.preflight(),/must be running/);
 await assert.rejects(hooks.validate('/mnt/data/build/tastedev-linux/unsafe'),/candidate file/);
 const mismatch=postgresqlConfigHooks('/etc/postgresql/16/main/postgresql.conf',{port:5433},async()=> '5432\n');
 await assert.rejects(mismatch.validate(candidate),/does not resolve/);
});
