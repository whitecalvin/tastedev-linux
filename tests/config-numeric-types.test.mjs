import test from 'node:test';
import assert from 'node:assert/strict';
import {configProfile} from '../lib/config-profiles.ts';
import {databaseConfigProfile} from '../lib/database-config-profile.ts';
import {parseLiveConfig} from '../lib/config-value-parser.ts';
import {patchConfig} from '../lib/config-patch.ts';
test('Package numeric inputs reject coerced booleans, arrays and empty values before rendering configuration',()=>{
 for(const value of [true,false,null,'',' ',[],[3000],{},'1e3','0x100','3000\n']){
  assert.throws(()=>configProfile('nodejs',{port:value}),error=>error.status===400);
  assert.throws(()=>databaseConfigProfile('redis',{maxMemory:value}),error=>error.status===400);
  assert.throws(()=>databaseConfigProfile('postgresql',{workMem:value}),error=>error.status===400);
  assert.throws(()=>databaseConfigProfile('mariadb',{slowSeconds:value}),error=>error.status===400);
 }
});
test('Explicit zero Redis memory and decimal form integers remain supported',()=>{
 assert.match(configProfile('redis',{maxMemory:0}),/maxmemory 0mb/);assert.match(configProfile('redis',{maxMemory:'0'}),/maxmemory 0mb/);assert.match(configProfile('nodejs',{port:'3000',memory:'512'}),/PORT=3000/);
});
test('Redis TCP-disabled port survives reading, generating and editing a Unix-socket configuration',()=>{
 const original='port 0\nunixsocket /run/redis/server.sock\nmaxclients 100\n';
 const parsed=parseLiveConfig('redis',original);
 assert.equal(parsed.values.port,0);assert.deepEqual(parsed.warnings,[]);
 assert.match(configProfile('redis',{port:0}),/^port 0$/m);
 assert.match(configProfile('redis',{port:'0'}),/^port 0$/m);
 const edited=patchConfig('redis',original,{connections:123,port:0});
 assert.equal(edited,original.replace('maxclients 100','maxclients 123'));
 assert.equal(parseLiveConfig('redis',edited).values.port,0);
 for(const kind of ['nodejs','postgresql','mariadb'])assert.throws(()=>configProfile(kind,{port:0}),error=>error.status===400);
 for(const port of [-1,65536,0.5,true,'',null])assert.throws(()=>configProfile('redis',{port}),error=>error.status===400);
});
