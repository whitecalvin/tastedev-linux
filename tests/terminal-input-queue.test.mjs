import test from 'node:test';
import assert from 'node:assert/strict';
import {terminalInputQueue} from '../lib/terminal-input-queue.ts';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('terminal input remains ordered and disposed sessions discard pending bytes',async()=>{
 const sent=[],resolvers=[];const queue=terminalInputQueue(text=>{sent.push(text);return new Promise(resolve=>resolvers.push(resolve));});queue.push('a');queue.push('b');queue.push('\r');assert.deepEqual(sent,['a']);resolvers.shift()();await tick();assert.deepEqual(sent,['a','b\r']);queue.push('late');queue.dispose();resolvers.shift()();await tick();assert.deepEqual(sent,['a','b\r']);
});
test('terminal input failures clear queued data and report without leaking input',async()=>{
 let errors=0;const sent=[];const queue=terminalInputQueue(async text=>{sent.push(text);throw Error('private-value');},()=>errors++);queue.push('fixture');queue.push('discarded');await tick();queue.push('later');assert.equal(errors,1);assert.deepEqual(sent,['fixture']);
});
test('terminal queue preserves surrogate pairs and ignores errors after disposal',async()=>{
 let reject,errors=0;const queue=terminalInputQueue(()=>new Promise((_resolve,rejectFn)=>{reject=rejectFn;}),()=>errors++);queue.push('a');queue.dispose();reject(Error('late'));await tick();assert.equal(errors,0);
 const chunks=[],unicode=terminalInputQueue(async text=>{chunks.push(text);});const value='a'.repeat(1023)+'😀'+'b';unicode.push(value);await tick();assert.equal(chunks.join(''),value);assert(!/[\uD800-\uDBFF]$/.test(chunks[0]));
});
test('explicit recovery accepts fresh input without replaying failed bytes and cannot revive a disposed queue',async()=>{
 const sent=[];let reject,errors=0;const queue=terminalInputQueue(text=>{sent.push(text);if(sent.length===1)return new Promise((_resolve,fail)=>reject=fail);return Promise.resolve();},()=>errors++);
 queue.push('uncertain');queue.push('queued');assert.equal(queue.resume(),false,'in-flight input cannot be resumed');reject(Error('network'));await tick();queue.push('blocked');assert.deepEqual(sent,['uncertain']);assert.equal(errors,1);
 assert.equal(queue.resume(),true);queue.push('fresh');await tick();assert.deepEqual(sent,['uncertain','fresh']);queue.dispose();assert.equal(queue.resume(),false);queue.push('disposed');assert.deepEqual(sent,['uncertain','fresh']);
});
test('large Unicode paste preserves exact order while pending limits and NUL rejection remain active',async()=>{
 const sent=[],errors=[],payload='x'.repeat(9000)+'😀한글'.repeat(16000);const queue=terminalInputQueue(async text=>sent.push(text),reason=>errors.push(reason));queue.push(payload);await tick();assert.deepEqual(errors,[]);assert.equal(sent.join(''),payload);assert(sent.every(text=>Buffer.byteLength(text)<=4096&&!/[\uD800-\uDBFF]$/.test(text)));queue.push('blocked\0value');await tick();assert.equal(sent.join(''),payload);queue.dispose();
 let resolve;const pending=[],reasons=[];const bounded=terminalInputQueue(text=>{pending.push(text);return new Promise(done=>resolve=done);},reason=>reasons.push(reason));bounded.push('in-flight');bounded.push('x'.repeat(262145));assert.deepEqual(reasons,['capacity']);resolve();await tick();bounded.push('blocked');assert.deepEqual(pending,['in-flight']);assert.equal(bounded.resume(),true);bounded.push('fresh');assert.deepEqual(pending,['in-flight','fresh']);bounded.dispose();resolve();
});
