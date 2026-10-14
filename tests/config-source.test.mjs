import test from 'node:test';import assert from 'node:assert/strict';import {configSource} from '../lib/config-source.ts';
const target='/etc/postgresql/18/main/pg_hba.conf',denied=()=>{throw Object.assign(Error('denied'),{status:403});};
test('protected Redis source needs explicit permission and only the fixed source action',async()=>{
 let calls=[];const helper=async(...args)=>{calls.push(args);return {text:'port 6379\n'};};
 const path='/etc/redis/redis.conf';
 assert.equal((await configSource('redis',path,{readSource:async()=>({text:'readable'}),helper})).text,'readable');
 await assert.rejects(configSource('redis',path,{readSource:denied,readPolicy:async()=>({settings:{sudoWithoutPrompt:false}}),helper}),e=>e.status===403&&e.message.includes('Redis'));
 assert.equal(calls.length,0);
 const result=await configSource('redis',path,{readSource:()=>{throw Object.assign(Error('protected directory'),{code:'EACCES'});},readPolicy:async()=>({settings:{sudoWithoutPrompt:true}}),helper});
 assert.equal(result.text,'port 6379\n');assert.deepEqual(calls,[['redis-config-source',{}]]);
 for(const path of ['/etc/passwd','/etc/redis/../redis/redis.conf','/etc/redis/other.conf'])await assert.rejects(configSource('redis',path,{readSource:denied,readPolicy:()=>{throw Error('unexpected policy');}}),/denied/);
});
test('HBA source uses the app account first and privileged read requires the explicit sudo option',async()=>{let calls=[];const helper=async(...args)=>{calls.push(args);return{text:'local all all peer'};};assert.equal((await configSource('postgresql',target,{readSource:async()=>({text:'readable'}),readPolicy:()=>{throw Error('unused');},helper})).text,'readable');assert.equal(calls.length,0);await assert.rejects(configSource('postgresql',target,{readSource:denied,readPolicy:async()=>({settings:{sudoWithoutPrompt:false}}),helper}),error=>error.status===403);assert.equal(calls.length,0);assert.equal((await configSource('postgresql',target,{readSource:denied,readPolicy:async()=>({settings:{sudoWithoutPrompt:true}}),helper})).text,'local all all peer');assert.deepEqual(calls,[['postgresql-hba-source',{path:target}]]);});
test('permission fallback cannot privilege other config paths, traversal, other kinds or encoding failures',async()=>{for(const [kind,path,error] of [['postgresql','/etc/passwd',{status:403}],['postgresql','/etc/postgresql/18/main/../pg_hba.conf',{status:403}],['postgresql','/etc/postgresql/18/main/postgresql.conf',{status:403}],['redis',target,{status:403}],['postgresql',target,{status:400}]])await assert.rejects(configSource(kind,path,{readSource:()=>{throw Object.assign(Error('fixture'),error);},readPolicy:()=>{throw Error('unexpected policy query');},helper:()=>{throw Error('unexpected helper');}}),/fixture/);});
