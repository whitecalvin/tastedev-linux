import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {prepareDatabaseConfigBackup} from '../lib/database-config-backup.ts';
for(const kind of ['redis','mariadb'])test(kind+' manual backup requires authentication, same origin and database permission, then forwards only the live version',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../lib/api.ts',import.meta.url),'utf8'),{filename:'api.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});
 let loggedIn=false,allowed=false;const calls=[],events=[],module={exports:{}};
 const require=name=>name==='./database-config-backup.ts'?{prepareDatabaseConfigBackup}:name==='./auth.ts'?{cookieSession:async()=>loggedIn?{username:'fixture'}:null}:name==='./security.ts'?{assertFeature:async(feature,options)=>{assert.equal(feature,'databaseChanges');assert.equal(options.sudo,true);if(!allowed)throw Object.assign(Error('disabled'),{status:403});},auditEvent:async(action,result)=>events.push({action,result})}:name==='./privilege.ts'?{runHelper:async(action,input)=>{calls.push({action,input});return{created:true,operatingServiceChanged:false};}}:{};
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const action=kind+'-config-backup',input={path:kind==='redis'?'/etc/redis/redis.conf':'/etc/mysql/my.cnf',version:'a'.repeat(64),confirm:true};
 const post=(data=input,origin='http://localhost')=>module.exports.handle(new Request('http://localhost/api/'+action,{method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify(data)}),action);
 assert.equal((await post()).status,401);loggedIn=true;assert.equal((await post()).status,403);assert.deepEqual(events.at(-1),{action,result:'blocked'});
 allowed=true;assert.equal((await post(input,'https://foreign.example')).status,403);assert.equal(calls.length,0);
 for(const changes of [{confirm:false},{text:'edited draft'},{path:'/etc/passwd'},{backupRoot:'/tmp'},{ownerUid:0}]){assert.equal((await post({...input,...changes})).status,400);assert.equal(calls.length,0);assert.equal(events.at(-1).result,'failed');}
 assert.equal((await post()).status,200);assert.deepEqual(calls,[{action,input}]);assert.equal(events.at(-1).result,'completed');assert(!JSON.stringify(events).includes(input.version));
});
