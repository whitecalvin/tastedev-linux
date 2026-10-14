import test from 'node:test';import assert from 'node:assert/strict';import {writeFile,rm} from 'node:fs/promises';import {join} from 'node:path';import {spawnSync} from 'node:child_process';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';import {jsonRecord} from '../scripts/verification/http-json.ts';
test('PostgreSQL HBA helper TS preparation emits Node22 JavaScript and refuses the ordinary host before installed runtime loading',async()=>{
 const root=await verificationWorkDirectory('postgresql-helper-container-runtime-');
 try{
  const prepared=spawnSync(process.execPath,['scripts/verification/postgresql-helper-container-source.ts'],{encoding:'utf8',timeout:10000});assert.equal(prepared.status,0,prepared.stderr);const record=jsonRecord(JSON.parse(prepared.stdout));assert.equal(record.format,'tastedev-postgresql-helper-container-source-v1');assert(typeof record.fixture==='string');const file=join(root,'fixture.mjs');await writeFile(file,record.fixture);
  const checked=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--check',file],{encoding:'utf8'});assert.equal(checked.status,0,checked.stderr);
  const refused=spawnSync('/usr/bin/node',['--no-experimental-strip-types',file],{encoding:'utf8',timeout:10000});assert.equal(refused.status,1);assert(/AssertionError|전용 격리 마운트/.test(refused.stderr));assert(!refused.stderr.includes('MODULE_NOT_FOUND'));assert(!refused.stdout.includes('PASS'));
 }finally{await rm(root,{recursive:true,force:true});}
});
