import test from 'node:test';
import assert from 'node:assert/strict';
import {inventorySnapshot} from '../lib/inventory-snapshot.ts';
test('navigation shares the first inventory and explicit refresh replaces it without exposing mutable references',async()=>{
 let count=0;const read=inventorySnapshot(async()=>[{installed:++count}]);
 const first=await read();first[0].installed=99;assert.equal((await read())[0].installed,1);assert.equal(count,1);
 assert.equal((await read({refresh:true}))[0].installed,2);assert.equal((await read())[0].installed,2);assert.equal(count,2);
});
test('concurrent initial navigation shares one pending inventory read',async()=>{
 let resolve,count=0;const read=inventorySnapshot(()=>{count++;return new Promise(done=>resolve=done);});
 const a=read(),b=read();await Promise.resolve();assert.equal(count,1);resolve([1]);assert.deepEqual(await a,[1]);assert.deepEqual(await b,[1]);
});
test('older refresh completion cannot replace a newer explicit refresh',async()=>{
 const pending=[];const read=inventorySnapshot(()=>new Promise(done=>pending.push(done)));
 const a=read();await Promise.resolve();const b=read({refresh:true});await Promise.resolve();pending[1](['new']);assert.deepEqual(await b,['new']);pending[0](['old']);await a;assert.deepEqual(await read(),['new']);
});
test('refresh failure preserves the last successful inventory and initial failure can be retried',async()=>{
 let fail=true;const read=inventorySnapshot(async()=>{if(fail)throw Error('unavailable');return ['valid'];});
 await assert.rejects(read(),/unavailable/);fail=false;assert.deepEqual(await read(),['valid']);fail=true;await assert.rejects(read({refresh:true}),/unavailable/);assert.deepEqual(await read(),['valid']);
});
