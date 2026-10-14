import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';

test('nginx check, backup and toggle audit final outcomes without storing payload or output',async()=>{
 await loadBindings();
 const compiled=await transform(await readFile(new URL('../lib/api.ts',import.meta.url),'utf8'),{filename:'api.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});
 const module={exports:{}},events=[],calls=[];let authenticated=true,allowed=true,outcome={},failure=null;
 const require=name=>name==='./auth.ts'?{cookieSession:async()=>authenticated?{username:'fixture'}:null}:name==='./security.ts'?{assertFeature:async(key,options)=>{assert.equal(key,'nginxChanges');assert.equal(options.sudo,true);if(!allowed)throw Object.assign(Error('policy denied'),{status:403});},auditEvent:async(...args)=>events.push(args)}:name==='./privilege.ts'?{runHelper:async(action,data)=>{calls.push({action,data});if(failure)throw failure;return outcome;}}:{};
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const post=(action,data={},origin)=>module.exports.handle(new Request('http://localhost/api/'+action,{method:'POST',headers:{'content-type':'application/json',...(origin?{origin}:{})},body:JSON.stringify(data)}),action);
 for(const action of ['nginx-check','nginx-config-backup','nginx-toggle']){
  events.length=0;calls.length=0;outcome=action==='nginx-check'?{valid:true,logs:'private output'}:action==='nginx-toggle'?{changed:true,logs:'private output'}:{backup:{id:'fixture',text:'private config'}};
  const payload=action==='nginx-check'?{}:action==='nginx-toggle'?{domain:'fixture.example.invalid',enabled:false,version:'a'.repeat(64),confirm:true}:{path:'/etc/nginx/nginx.conf',version:'a'.repeat(64),confirm:true};
  assert.equal((await post(action,payload)).status,200);
  assert.deepEqual(events,[[action,'requested'],[action,'completed']]);assert.deepEqual(calls,[{action,data:payload}]);
  events.length=0;failure=Object.assign(Error('private helper error'),{status:403});assert.equal((await post(action,payload)).status,403);
  assert.deepEqual(events,[[action,'requested'],[action,'failed']]);failure=null;
  events.length=0;calls.length=0;allowed=false;assert.equal((await post(action,payload)).status,403);
  assert.deepEqual(events,[[action,'blocked']]);assert.equal(calls.length,0);allowed=true;
  events.length=0;authenticated=false;assert.equal((await post(action,payload)).status,401);assert.deepEqual(events,[]);authenticated=true;
  assert.equal((await post(action,payload,'https://foreign.example')).status,403);assert.deepEqual(events,[]);assert.equal(calls.length,0);
 }
 events.length=0;outcome={valid:false};await post('nginx-check');assert.deepEqual(events,[['nginx-check','requested'],['nginx-check','invalid']]);
 events.length=0;outcome={changed:false};await post('nginx-toggle',{domain:'fixture.example.invalid',enabled:false,confirm:true,version:'a'.repeat(64)});assert.deepEqual(events,[['nginx-toggle','requested'],['nginx-toggle','unchanged']]);
 for(const payload of [{domain:'fixture.example.invalid',enabled:false,confirm:true},{domain:'fixture.example.invalid',enabled:false,confirm:true,version:'not-a-hash'},{domain:'fixture.example.invalid',enabled:false,confirm:true,version:'a'.repeat(64),path:'/other'}]){events.length=0;calls.length=0;assert.equal((await post('nginx-toggle',payload)).status,400);assert.equal(calls.length,0);assert.deepEqual(events,[['nginx-toggle','requested'],['nginx-toggle','failed']]);}
 events.length=0;calls.length=0;assert.equal((await post('nginx-check',{command:'private'})).status,400);assert.deepEqual(events,[['nginx-check','requested'],['nginx-check','failed']]);assert.equal(calls.length,0);
});

test('install and certificate API acknowledge pending jobs without premature completion and audit startup failures',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../lib/api.ts',import.meta.url),'utf8'),{filename:'api.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}}),module={exports:{}},events=[],calls=[];let failure=null,allowed=true;
 const start=async data=>{calls.push(data);if(failure)throw failure;return {id:'fixture',status:'running'};};
 const require=name=>name==='./auth.ts'?{cookieSession:async()=>({username:'fixture'})}:name==='./security.ts'?{assertFeature:async()=>{if(!allowed)throw Object.assign(Error('denied'),{status:403});},auditEvent:async(...args)=>events.push(args)}:name==='./packages.ts'?{commandFor:()=>['fixed-command'],startInstall:start}:name==='./server-tools.ts'?{startCertificate:start}:name==='./workspace.ts'?{runCommand:start}:{};
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const post=(action,data)=>module.exports.handle(new Request('http://localhost/api/'+action,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)}),action);
 for(const action of ['install','certbot-issue','terminal']){
  const data={packages:['nginx'],confirm:true};events.length=0;assert.equal((await post(action,data)).status,202);assert.deepEqual(events,[[action,'requested']]);
  events.length=0;failure=Object.assign(Error('start failed'),{status:409});assert.equal((await post(action,data)).status,409);assert.deepEqual(events,[[action,'requested'],[action,'failed']]);failure=null;
  events.length=0;calls.length=0;allowed=false;assert.equal((await post(action,data)).status,403);assert.deepEqual(events,[[action,'blocked']]);assert.deepEqual(calls,[]);allowed=true;
 }
 events.length=0;assert.equal((await post('install',{packages:['nginx'],confirm:false})).status,400);assert.deepEqual(events,[['install','requested'],['install','failed']]);
});

test('service, cron, restore and site apply record authorization and synchronous final outcomes',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../lib/api.ts',import.meta.url),'utf8'),{filename:'api.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});
 const module={exports:{}},events=[],calls=[],gates=[];let allowed=true,failure=null,result={};
 const work=async data=>{calls.push(data);if(failure)throw failure;return result;};
 const require=name=>name==='./auth.ts'?{cookieSession:async()=>({username:'fixture'})}:name==='./security.ts'?{assertFeature:async(...args)=>{gates.push(args);if(!allowed)throw Object.assign(Error('disabled'),{status:403});},auditEvent:async(...args)=>events.push(args)}:name==='./operations.ts'?{controlService:work,restoreBackup:work}:name==='./server-tools.ts'?{applySite:work,deleteCron:work,applyCron:work}:{};
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const post=(action,data)=>module.exports.handle(new Request('http://localhost/api/'+action,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)}),action);
 for(const [action,key,sudo] of [['service','serviceChanges',true],['nginx-apply','nginxChanges',true],['cron-delete','cronChanges',false],['cron-apply','cronChanges',false],['restore','cronChanges',false],['restore','nginxChanges',true]]){
  const payload={privileged:sudo,confirm:true,text:'private fixture'};
  for(const [value,expected] of [[{changed:true},'completed'],[{changed:false},'unchanged'],[{failed:true,restored:true,recovered:true},'rolled-back'],[{failed:true,restored:false},'recovery-required']]){
   events.length=0;gates.length=0;result=value;assert.equal((await post(action,payload)).status,200);assert.deepEqual(events,[[action,'requested'],[action,expected]]);assert.deepEqual(gates,[[key,{sudo}]]);
  }
  events.length=0;failure=Object.assign(Error('private error'),{status:409});assert.equal((await post(action,payload)).status,409);assert.deepEqual(events,[[action,'requested'],[action,'failed']]);failure=null;
  events.length=0;calls.length=0;allowed=false;assert.equal((await post(action,payload)).status,403);assert.deepEqual(events,[[action,'blocked']]);assert.deepEqual(calls,[]);allowed=true;
 }
});
