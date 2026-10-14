import test from 'node:test';import assert from 'node:assert/strict';
import {consoleRefreshGuard} from '../lib/console-refresh.ts';
test('console refresh drops old response after newer request or logout invalidation',async()=>{
 const guard=consoleRefreshGuard(),published=[],oldResolvers=[];
 const old=guard.refresh(()=>new Promise(resolve=>oldResolvers.push(resolve)),(data)=>published.push(data));
 await guard.refresh(async action=>action==='status'?'new':'policy',data=>published.push(data));
 for(const finish of oldResolvers)finish('old');assert.equal(await old,null);
 const gate=consoleRefreshGuard(),resolvers=[];
 const pending=gate.refresh(()=>new Promise(resolve=>resolvers.push(resolve)),data=>published.push(data));
 gate.invalidate();for(const resolve of resolvers)resolve('expired');
 assert.equal(await pending,null);assert.deepEqual(published,['new']);
});
test('invalidated refresh failures are discarded while current errors still propagate',async()=>{
 const guard=consoleRefreshGuard(),rejects=[];let published=0;
 const stale=guard.refresh(()=>new Promise((_,fail)=>rejects.push(fail)),()=>published++);
 guard.invalidate();for(const reject of rejects)reject(Error('old request failed'));assert.equal(await stale,null);assert.equal(published,0);
 await assert.rejects(guard.refresh(async()=>{throw Error('current failure');},()=>published++),/current failure/);
 assert.equal(published,0);
});
