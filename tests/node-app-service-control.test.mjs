import test from 'node:test';
import assert from 'node:assert/strict';
import {controlNodeAppService} from '../lib/node-app-service-control.ts';
import {nodeAppUnit} from '../lib/node-app-unit.ts';
const profile={id:'fixture',label:'Fixture',directory:'/srv/fixture',entry:'server.js',environmentFile:'.env'},uid=1000;
const input={uid,profile,confirm:true,operation:'start'},text='# Managed by Tastedev Linux\n'+nodeAppUnit(profile,uid);
function fixture(patch={}){const calls=[];return {calls,hooks:{callerUid:uid,verifyContext:async()=>{},readUnit:async()=>text,inspectManager:async()=>({LoadState:'loaded',FragmentPath:'/etc/systemd/system/tastedev-node-fixture.service',User:'1000',DropInPaths:''}),perform:async(action,unit)=>calls.push({action,unit}),...patch}};}
test('Node service control binds each operation to verified generated unit and effective account',async()=>{
 for(const operation of ['start','stop','restart','enable','disable']){const {hooks,calls}=fixture();const result=await controlNodeAppService({...input,operation},hooks);assert.equal(result.changed,true);assert.deepEqual(calls.map(call=>call.action),['daemon-reload',operation]);assert(calls.every(call=>call.unit==='tastedev-node-fixture.service'));}
});
test('Node service control rejects altered unit, effective override, invalid operation and account before app operation',async()=>{
 const altered=fixture({readUnit:async()=>text+'ExecStartPre=/bin/false\n'});await assert.rejects(controlNodeAppService(input,altered.hooks),{status:409});assert.equal(altered.calls.length,0);
 for(const patch of [{User:'0'},{DropInPaths:'/etc/systemd/system/service.d/override.conf'},{FragmentPath:'/run/systemd/system/tastedev-node-fixture.service'},{LoadState:'not-found'}]){const blocked=fixture({inspectManager:async()=>({LoadState:'loaded',FragmentPath:'/etc/systemd/system/tastedev-node-fixture.service',User:'1000',DropInPaths:'',...patch})});await assert.rejects(controlNodeAppService(input,blocked.hooks),{status:409});assert.deepEqual(blocked.calls.map(call=>call.action),['daemon-reload']);}
 await assert.rejects(controlNodeAppService({...input,operation:'reload'},fixture().hooks),{status:400});await assert.rejects(controlNodeAppService({...input,uid:0},fixture().hooks),{status:403});
});

test('Node stop and disable derive bounded options from installed unit without trusting client options',async()=>{
 const installed='# Managed by Tastedev Linux\n'+nodeAppUnit(profile,uid,{restart:'always',restartSeconds:30,stopSeconds:60});
 for(const operation of ['stop','disable']){const {hooks,calls}=fixture({readUnit:async()=>installed});const result=await controlNodeAppService({...input,operation,options:{restart:'no',restartSeconds:5}},hooks);assert.equal(result.changed,true);assert.equal(calls.at(-1).action,operation);}
 const modified=fixture({readUnit:async()=>installed+'ExecStop=/bin/true\n'});await assert.rejects(controlNodeAppService({...input,operation:'stop'},modified.hooks),{status:409});assert.equal(modified.calls.length,0);
});

test('Installed Node settings inspection returns only bounded options and rejects changes or extra directives',async()=>{
 const {inspectNodeAppService}=await import('../lib/node-app-service-control.ts');
 const options={restart:'always',restartSeconds:30,stopSeconds:60},installed='# Managed by Tastedev Linux\n'+nodeAppUnit(profile,uid,options);
 const result=await inspectNodeAppService({uid,profile},{callerUid:uid,readUnit:async()=>installed});assert.deepEqual(result.serviceOptions,options);assert.equal(result.registered,true);assert.match(result.unitVersion,/^[a-f0-9]{64}$/);assert(!Object.hasOwn(result,'text'));
 await assert.rejects(inspectNodeAppService({uid,profile},{callerUid:uid,readUnit:async()=>installed+'ExecStop=/bin/false\n'}),{status:409});
 let reads=0;await assert.rejects(inspectNodeAppService({uid,profile},{callerUid:uid,readUnit:async()=>++reads===1?installed:installed+'# changed\n'}),{status:409});
 const absent=await inspectNodeAppService({uid,profile},{callerUid:uid,readUnit:async()=>{throw Object.assign(Error('Missing'),{code:'ENOENT'});}});assert.equal(absent.registered,false);
});
