import test from 'node:test';
import assert from 'node:assert/strict';
import {requireNodeEnvSaved,nodeEnvSavedSnapshot} from '../lib/node-env-outcome.ts';
test('Failed environment replacement never overwrites the GUI baseline or exposes diagnostic contents',()=>{
 const snapshot={name:'app.env',version:'a'.repeat(64),values:{port:3000}},id='12345678-1234-1234-1234-123456789abc';
 for(const result of [{saved:false,failed:true,backupId:id,reason:'fixture-secret'},{saved:true,version:undefined,values:{port:3100}},{saved:true,failed:true,version:'b'.repeat(64),values:{port:3100}},{saved:false,backupId:'fixture-secret'}]){
  assert.throws(()=>nodeEnvSavedSnapshot(snapshot,result),error=>error.status===409&&!error.message.includes('fixture-secret'));
  assert.equal(snapshot.version,'a'.repeat(64));assert.equal(snapshot.values.port,3000);
 }
 assert.throws(()=>requireNodeEnvSaved({failed:true,backupId:id}),error=>error.message.includes(id));
});
test('Successful and unchanged environment results establish a validated GUI baseline',()=>{
 const snapshot={name:'app.env',skipped:1};for(const changed of [true,false]){const saved={saved:true,changed,version:'b'.repeat(64),values:{port:3100}};assert.deepEqual(nodeEnvSavedSnapshot(snapshot,saved),{...snapshot,version:saved.version,values:saved.values,backupId:undefined});}
});

test('saved result rejects malformed and private fields without replacing the baseline',()=>{
 const snapshot={name:'app.env',version:'a'.repeat(64),values:{port:3000}};
 for(const values of [{port:true},{port:null},{port:[]},{port:NaN},{port:Infinity},{API_KEY:'fixture-secret'}]){
  assert.throws(()=>nodeEnvSavedSnapshot(snapshot,{saved:true,version:'b'.repeat(64),values}),error=>error.status===409&&!error.message.includes('fixture-secret'));
  assert.equal(snapshot.values.port,3000);assert.equal(snapshot.version,'a'.repeat(64));
 }
});
