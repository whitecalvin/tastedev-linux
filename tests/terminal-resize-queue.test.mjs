import test from 'node:test';
import assert from 'node:assert/strict';
import {terminalResizeQueue} from '../lib/terminal-resize-queue.ts';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('resize requests serialize and keep only latest pending dimensions',async()=>{
 const sent=[],resolvers=[];const queue=terminalResizeQueue((cols,rows)=>{sent.push([cols,rows]);return new Promise(resolve=>resolvers.push(resolve));});queue.push(80,24);queue.push(90,25);queue.push(100,30);assert.deepEqual(sent,[[80,24]]);resolvers.shift()();await tick();assert.deepEqual(sent,[[80,24],[100,30]]);queue.push(120,40);queue.dispose();resolvers.shift()();await tick();assert.equal(sent.length,2);
});
test('disposed resize ignores late failure',async()=>{
 let reject,errors=0;const queue=terminalResizeQueue(()=>new Promise((_resolve,fail)=>{reject=fail;}),()=>errors++);queue.push(80,24);queue.dispose();reject(Error('late'));await tick();assert.equal(errors,0);
});
test('successful resize reports recovery after failure and disposed queues ignore late success',async()=>{
 let fail=true,successes=0,errors=0;
 const queue=terminalResizeQueue(async()=>{if(fail)throw Error('temporary');},()=>errors++,()=>successes++);
 queue.push(80,24);await tick();assert.equal(errors,1);assert.equal(successes,0);
 fail=false;queue.push(100,30);await tick();assert.equal(successes,1);assert.equal(errors,1);queue.dispose();
 let finish;const late=terminalResizeQueue(()=>new Promise(resolve=>{finish=resolve;}),()=>errors++,()=>successes++);
 late.push(120,40);late.dispose();finish();await tick();assert.equal(successes,1);
});
