import test from 'node:test';import assert from 'node:assert/strict';import {terminalEventResponse} from '../lib/terminal-events.ts';
const request=(suffix='',options)=>new Request('http://localhost/api/terminal-events?job=fixture'+suffix,options);
const decode=chunk=>{const text=new TextDecoder().decode(chunk.value);return {name:text.match(/^event: (.+)$/m)?.[1],...JSON.parse(text.match(/^data: (.+)$/m)[1])};};
const job={id:'fixture',status:'running',stdinOpen:true,pty:true,logSequence:1,logs:[{sequence:1,text:'first'}]};
test('terminal events send only fresh output and close after the final exit state',async()=>{
 let current=job;const cursors=[];const response=await terminalEventResponse(request(),{readJob:(_id,since)=>(cursors.push(since),current),authorize:async()=>true,interval:2});
 assert.match(response.headers.get('content-type'),/text\/event-stream/);assert.equal(response.headers.get('x-accel-buffering'),'no');assert.match(response.headers.get('cache-control'),/no-store/);
 const reader=response.body.getReader();assert.deepEqual(decode(await reader.read()).job.logs,[{sequence:1,text:'first'}]);
 current={...job,logSequence:2,logs:[...job.logs,{sequence:2,text:'한글😀'}]};const next=decode(await reader.read());assert.equal(next.name,'job');assert.deepEqual(next.job.logs,[{sequence:2,text:'한글😀'}]);assert(cursors.includes(1));
 current={...current,status:'success',stdinOpen:false,exitCode:0};const final=decode(await reader.read()).job;assert.equal(final.status,'success');assert.deepEqual(final.logs,[]);assert.equal((await reader.read()).done,true);
});
test('stream resumes from the greater URL or Last-Event-ID cursor and rejects invalid cursors',async()=>{
 let since;const response=await terminalEventResponse(request('&since=1',{headers:{'Last-Event-ID':'2'}}),{readJob:(_id,value)=>(since=value,{...job,status:'success',logSequence:3,logs:[...job.logs,{sequence:3,text:'third'}]}),authorize:async()=>true});assert.equal(since,2);assert.deepEqual(decode(await response.body.getReader().read()).job.logs,[{sequence:3,text:'third'}]);
 for(const value of ['-1','1.5','x','9007199254740992'])await assert.rejects(terminalEventResponse(request('&since='+value),{readJob:()=>job,authorize:async()=>true}),error=>error.status===400);
 let reads=0;const denied=await terminalEventResponse(request(),{readJob:()=>{reads++;return job;},authorize:async()=>false});assert.equal(denied.status,401);assert.equal(reads,0);
});
test('session revocation ends the stream without delivering additional output',async()=>{
 let allowed=true;const response=await terminalEventResponse(request(),{readJob:()=>job,authorize:async()=>allowed,interval:2,authInterval:0});const reader=response.body.getReader();await reader.read();allowed=false;const ended=decode(await reader.read());assert.equal(ended.name,'terminal-error');assert.equal(ended.status,401);assert.equal((await reader.read()).done,true);
});
test('abort and consumer cancellation stop reads; authentication errors expose no private details',async()=>{
 for(const mode of ['abort','cancel']){const controller=new AbortController();let reads=0;const response=await terminalEventResponse(request('',{signal:controller.signal}),{readJob:()=>{reads++;return job;},authorize:async()=>true,interval:2});const reader=response.body.getReader();await reader.read();if(mode==='abort'){const pending=reader.read();controller.abort();assert.equal((await pending).done,true);}else await reader.cancel();const before=reads;await new Promise(resolve=>setTimeout(resolve,10));assert.equal(reads,before);}
 let checks=0;const response=await terminalEventResponse(request(),{readJob:()=>job,authorize:async()=>{if(++checks>1)throw Error('private-auth-path');return true;},authInterval:0});const event=decode(await response.body.getReader().read());assert.equal(event.status,503);assert(!JSON.stringify(event).includes('private-auth-path'));
});

test('idle streams emit heartbeat events without duplicating output or advancing the cursor',async()=>{
 const cursors=[];const response=await terminalEventResponse(request(),{readJob:(_id,since)=>(cursors.push(since),job),authorize:async()=>true,interval:2,heartbeatInterval:4});const reader=response.body.getReader();assert.equal(decode(await reader.read()).name,'job');const heartbeat=decode(await reader.read());assert.deepEqual(heartbeat,{name:'heartbeat'});assert(cursors.slice(1).every(value=>value===1));await reader.cancel();
});

test('subscribed output wakes an idle stream immediately and unsubscribes on exit',async()=>{
 let current=job,notify,subscriptions=0,reads=0;
 const response=await terminalEventResponse(request(),{readJob:()=>{reads++;return current;},authorize:async()=>true,subscribe:(id,listener)=>{assert.equal(id,'fixture');notify=listener;subscriptions++;return()=>subscriptions--;},interval:60000,authInterval:60000,heartbeatInterval:60000});
 const reader=response.body.getReader();let deadline;
 try{
  await reader.read();const next=reader.read();await new Promise(resolve=>setImmediate(resolve));const idleReads=reads;
  await new Promise(resolve=>setTimeout(resolve,15));assert.equal(reads,idleReads,'idle subscription does not repeatedly read output');
  current={...job,logSequence:2,logs:[...job.logs,{sequence:2,text:'echo:한글😀'}]};notify();
  const result=await Promise.race([next,new Promise((_resolve,reject)=>deadline=setTimeout(()=>reject(Error('output waited for the polling timer')),200))]);
  assert.deepEqual(decode(result).job.logs,[{sequence:2,text:'echo:한글😀'}]);
  current={...current,status:'success',stdinOpen:false,exitCode:0};notify();assert.equal(decode(await reader.read()).job.status,'success');assert.equal((await reader.read()).done,true);assert.equal(subscriptions,0);
 }finally{clearTimeout(deadline);await reader.cancel();}
});

test('idle subscriptions still detect revocation and release listeners on cancellation or abort',async()=>{
 for(const mode of ['revoke','cancel','abort']){
  let allowed=true,subscriptions=0;const controller=new AbortController();
  const response=await terminalEventResponse(request('',{signal:controller.signal}),{readJob:()=>job,authorize:async()=>allowed,subscribe:(_id,_notify)=>{subscriptions++;return()=>subscriptions--;},authInterval:10,heartbeatInterval:60000});
  const reader=response.body.getReader();await reader.read();
  if(mode==='revoke'){allowed=false;assert.equal(decode(await reader.read()).status,401);assert.equal((await reader.read()).done,true);}
  else if(mode==='abort'){const pending=reader.read();controller.abort();assert.equal((await pending).done,true);}
  else await reader.cancel();
  assert.equal(subscriptions,0,mode+' releases its subscriber');
 }
});

test('a retained session without output notifications keeps the polling fallback',async()=>{
 let current=job,subscriptions=0;
 const response=await terminalEventResponse(request(),{readJob:()=>current,authorize:async()=>true,subscribe:()=>{subscriptions++;return null;},interval:2,authInterval:60000,heartbeatInterval:60000});
 const reader=response.body.getReader();let timer;
 try{
  await reader.read();const next=reader.read();await new Promise(resolve=>setImmediate(resolve));
  current={...job,logSequence:2,logs:[{sequence:2,text:'retained shell output'}]};
  const output=await Promise.race([next,new Promise((_resolve,reject)=>timer=setTimeout(()=>reject(Error('legacy output notification was incorrectly required')),200))]);
  assert.deepEqual(decode(output).job.logs,[{sequence:2,text:'retained shell output'}]);assert.equal(subscriptions,1);
 }finally{clearTimeout(timer);await reader.cancel();}
});
