import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {terminalEventResponse,type TerminalEventJob} from '../lib/terminal-events.ts';
import {verifyPackageTerminalStream,verifyPackageStreamRevocation} from '../scripts/verification/package-terminal-events.ts';

test('package SSE checks consume actual application frames and authentication revocation with synthetic jobs',async()=>{
 let job:TerminalEventJob={id:'fixture',status:'running',logSequence:1,logs:[{sequence:1,text:'SSE_READY한글 😀'}]},sent=0;
 const response=await terminalEventResponse(new Request('http://fixture/events?job=fixture'),{readJob:()=>job,authorize:()=>true,interval:1,heartbeatInterval:1});
 await verifyPackageTerminalStream(response,async()=>{sent++;job={...job,status:'completed',logSequence:2,logs:[...job.logs??[],{sequence:2,text:'SSE_DONE'}]};});assert.equal(sent,1);
 let authorized=true;
 const revoked=await terminalEventResponse(new Request('http://fixture/events?job=fixture'),{readJob:()=>({id:'fixture',status:'running',logs:[]}),authorize:()=>authorized,interval:1,authInterval:1});
 assert(revoked.body);const reader=revoked.body.getReader();assert.equal((await reader.read()).done,false);authorized=false;await verifyPackageStreamRevocation(reader);
});

test('package SSE parser preserves split UTF8 and rejects duplicate cursors and malformed protocol',async()=>{
 const heartbeat='event: heartbeat\ndata: {}\n\n';
 const frame=(sequence:number,text:string,status='running')=>'event: job\ndata: '+JSON.stringify({job:{status,logs:[{sequence,text}]}})+'\n\n';
 function response(text:string){const bytes=new TextEncoder().encode(text);return new Response(new ReadableStream<Uint8Array>({start(controller){for(const byte of bytes)controller.enqueue(Uint8Array.of(byte));controller.close();}}),{headers:{'content-type':'text/event-stream','x-accel-buffering':'no'}});}
 await verifyPackageTerminalStream(response(frame(1,'SSE_READY한글 😀')+heartbeat+frame(2,'SSE_DONE','completed')),async()=>{});
 await assert.rejects(verifyPackageTerminalStream(response(frame(1,'SSE_READY')+heartbeat+frame(1,'SSE_DONE','completed')),async()=>{}),/repeated output/);
 await assert.rejects(verifyPackageTerminalStream(response(frame(1,'SSE_READY')+'event: heartbeat\nid: 1\ndata: {}\n\n'),async()=>{}),/heartbeat must not advance/);
 await assert.rejects(verifyPackageTerminalStream(response('event: job\ndata: {}\n\n'),async()=>{}),/JSON object/);
 await assert.rejects(verifyPackageTerminalStream(response('event: job\n\n'),async()=>{}),/data is missing/);
 await assert.rejects(verifyPackageTerminalStream(response(frame(0,'SSE_READY')),async()=>{}),/Invalid SSE output cursor/);
  const remainder=response('tail of a partially consumed job frame\n\nevent: terminal-error\ndata: {"status":401}\n\n');
  assert(remainder.body);await verifyPackageStreamRevocation(remainder.body.getReader());
});

test('Node22 emitted package SSE utility verifies actual producer frames without TypeScript loading',async()=>{
 const root=await verificationWorkDirectory('package-sse-runtime-');
 const files=['scripts/verification/package-terminal-events.mjs','scripts/verification/http-json.mjs','lib/terminal-events.mjs'];
 try{
  for(const file of files){await mkdir(dirname(join(root,file)),{recursive:true});await writeFile(join(root,file),await readRuntimeModule(file,files));}
  const worker=join(root,'verify.mjs');await writeFile(worker,"import {terminalEventResponse} from './lib/terminal-events.mjs';import {verifyPackageTerminalStream} from './scripts/verification/package-terminal-events.mjs';let job={id:'fixture',status:'running',logSequence:1,logs:[{sequence:1,text:'SSE_READY한글 😀'}]};const response=await terminalEventResponse(new Request('http://fixture/events'),{readJob:()=>job,authorize:()=>true,interval:1,heartbeatInterval:1});await verifyPackageTerminalStream(response,async()=>{job={...job,status:'completed',logSequence:2,logs:[{sequence:2,text:'SSE_DONE'}]};});console.log('PASS');");
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{encoding:'utf8',timeout:10000});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'PASS');
 }finally{await rm(root,{recursive:true,force:true});}
});
