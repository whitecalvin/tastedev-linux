import test from 'node:test';
import assert from 'node:assert/strict';
import {maintainBrowserSession} from '../lib/browser-session-maintenance.ts';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(fetchStatus){
 const target=new EventTarget(),document=new EventTarget();document.visibilityState='visible';
 let time=0,tick,expired=0,intervalCleared=false;const deadlines=new Map();let serial=0;
 const dispose=maintainBrowserSession({target,document,fetchStatus,onExpired:()=>expired++,now:()=>time,setInterval:callback=>(tick=callback,1),clearInterval:()=>intervalCleared=true,setTimeout:callback=>{const id=++serial;deadlines.set(id,callback);return id;},clearTimeout:id=>deadlines.delete(id)});
 return {target,document,dispose,advance:milliseconds=>time+=milliseconds,tick:()=>tick(),expired:()=>expired,deadlines,intervalCleared:()=>intervalCleared,activity:type=>target.dispatchEvent(new Event(type))};
}
test('visible activity renews the session without requiring a route remount or per-key request',async()=>{
 let calls=0;const f=fixture(async()=>{calls++;return Response.json({authenticated:true});});
 try{await flush();assert.equal(calls,1);for(let i=0;i<20;i++)f.activity('keydown');await flush();assert.equal(calls,1);
  f.advance(5*60000);f.activity('pointerdown');await flush();assert.equal(calls,2);assert.equal(f.expired(),0);
 }finally{f.dispose();}
});
test('idle or hidden pages do not keep the browser cookie alive without activity',async()=>{
 let calls=0;const f=fixture(async()=>{calls++;return Response.json({authenticated:true});});
 try{await flush();f.advance(6*60000);f.tick();await flush();assert.equal(calls,1);
  f.document.visibilityState='hidden';f.activity('keydown');await flush();assert.equal(calls,1);
  f.document.visibilityState='visible';f.document.dispatchEvent(new Event('visibilitychange'));await flush();assert.equal(calls,2);
 }finally{f.dispose();}
});
test('only confirmed authentication rejection redirects, once',async()=>{
 for(const response of [()=>new Response(null,{status:401}),()=>Response.json({authenticated:false})]){
  const f=fixture(async()=>response());try{await flush();assert.equal(f.expired(),1);f.advance(6*60000);f.activity('focus');f.tick();await flush();assert.equal(f.expired(),1);}finally{f.dispose();}
 }
});
test('network, storage and malformed responses do not masquerade as logout',async()=>{
 for(const response of [()=>{throw Error('offline');},()=>Response.json({authenticated:false},{status:503}),()=>Response.json({error:'unknown'}),()=>new Response('broken',{status:200})]){
  const f=fixture(async()=>response());try{await flush();assert.equal(f.expired(),0);}finally{f.dispose();}
 }
});
test('single in-flight refresh survives frequent input, and disposed shells ignore late responses',async()=>{
 let calls=0,resolve,signal;const f=fixture(options=>{calls++;signal=options.signal;return new Promise(done=>resolve=done);});
 f.advance(6*60000);for(let i=0;i<10;i++)f.activity('keydown');f.tick();assert.equal(calls,1);
 f.dispose();assert(signal.aborted);assert(f.intervalCleared());resolve(Response.json({authenticated:false}));await flush();assert.equal(f.expired(),0);assert.equal(f.deadlines.size,0);
 f.activity('focus');assert.equal(calls,1);
});
test('late parsed rejection after disposal cannot clear a new session',async()=>{
 let resolve;const f=fixture(async()=>({ok:true,status:200,json:()=>new Promise(done=>resolve=done)}));
 await flush();f.dispose();resolve({authenticated:false});await flush();assert.equal(f.expired(),0);
});
test('timed-out requests release their slot after abort and activity can retry',async()=>{
 let calls=0;const f=fixture(({signal})=>{calls++;if(calls>1)return Promise.resolve(Response.json({authenticated:true}));return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('timeout')),{once:true}));});
 try{[...f.deadlines.values()][0]();await flush();assert.equal(f.expired(),0);f.advance(6*60000);f.activity('wheel');await flush();assert.equal(calls,2);}finally{f.dispose();}
});
