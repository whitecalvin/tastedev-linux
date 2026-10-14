import {nodeAppLogs} from '../lib/node-app-logs.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {nodeAppServiceValues,nodeAppServiceStatus,nodeAppServiceInventory} from '../lib/node-app-service-status.ts';
import {mkdtemp,rm} from 'node:fs/promises';
const previousStateRoot=process.env.LINUX_STATE_ROOT,privateRoot=await mkdtemp('/mnt/data/build/tastedev-linux/node-status-test-');
process.env.LINUX_STATE_ROOT=privateRoot;
test.after(async()=>{if(previousStateRoot===undefined)delete process.env.LINUX_STATE_ROOT;else process.env.LINUX_STATE_ROOT=previousStateRoot;await rm(privateRoot,{recursive:true,force:true});});
test('Registered app service state parser returns fixed metadata and rejects malformed or secret output',()=>{
 assert.deepEqual(nodeAppServiceValues('LoadState=not-found\nActiveState=inactive\nSubState=dead\nUnitFileState=\n'),{LoadState:'not-found',ActiveState:'inactive',SubState:'dead',UnitFileState:''});
 for(const text of ['ActiveState=active\n','LoadState=loaded\nAPI_KEY=secret\n','LoadState=loaded\nLoadState=not-found\n','LoadState=loaded\nActiveState=active\nSubState=running\nUnitFileState=enabled secret'])assert.throws(()=>nodeAppServiceValues(text));
});
test('Unregistered service lookup is rejected before systemctl',async()=>{await assert.rejects(nodeAppServiceStatus('--system'),error=>error.status===404);});

test('Unregistered app log lookup cannot select an arbitrary journal unit',async()=>{await assert.rejects(nodeAppLogs('nginx.service'),error=>error.status===404);});

test('daemon inventory reads one registration snapshot, bounds native lookups, and binds rows to registered apps',async()=>{
 const registry={version:'a'.repeat(64),apps:Array.from({length:9},(_,i)=>({id:'app-'+i,label:'앱 '+i,unit:'tastedev-node-app-'+i+'.service'}))};
 let reads=0,active=0,maximum=0;
 const result=await nodeAppServiceInventory({readRegistry:async()=>{reads++;return registry;},readStatus:async(id,{registrySnapshot})=>{
  assert.equal(registrySnapshot,registry);maximum=Math.max(maximum,++active);await Promise.resolve();active--;
  return {id,unit:registry.apps.find(app=>app.id===id).unit,registryVersion:registry.version,available:true,LoadState:'loaded',ActiveState:'active'};
 }});
 assert.equal(reads,2);assert.equal(maximum,4);assert.deepEqual(result.warnings,[]);assert.equal(result.services.length,9);
 assert.deepEqual(result.services.map(row=>row.nodeAppId),registry.apps.map(app=>app.id));
 assert.deepEqual(result.services[0].nodeRegistry,{apps:[registry.apps[0]],version:registry.version});
});
test('daemon inventory discards changed registrations or mismatched targets and retains explicit lookup failures',async()=>{
 const app={id:'demo',unit:'tastedev-node-demo.service'},registry={version:'a'.repeat(64),apps:[app]},status={id:app.id,unit:app.unit,registryVersion:registry.version,available:true,LoadState:'loaded'};
 let reads=0;const stale=await nodeAppServiceInventory({readRegistry:async()=>++reads===1?registry:{...registry,version:'b'.repeat(64)},readStatus:async()=>status});
 assert.deepEqual(stale.services,[]);assert.match(stale.warnings[0],/변경/);
 const mismatch=await nodeAppServiceInventory({readRegistry:async()=>registry,readStatus:async()=>({...status,unit:'nginx.service'})});assert.deepEqual(mismatch.services,[]);assert.equal(mismatch.warnings.length,1);
 const denied=await nodeAppServiceInventory({readRegistry:async()=>registry,readStatus:async()=>({...status,available:false,notice:'상태 조회 권한을 확인하세요.'})});
 assert.equal(denied.services[0].LoadState,'error');assert.equal(denied.services[0].ActiveState,'unknown');assert.equal(denied.services[0].error,'상태 조회 권한을 확인하세요.');
 const unreadable=await nodeAppServiceInventory({readRegistry:async()=>{throw Error('private registry');}});assert.equal(unreadable.services.length,0);assert(!JSON.stringify(unreadable).includes('private registry'));
});
