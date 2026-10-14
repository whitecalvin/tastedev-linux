import assert from 'node:assert/strict';
import {jsonRecord,recordField,listField,textField} from './http-json.ts';

function event(frame:string):{name:string;data:Record<string,unknown>}{
 const lines=frame.split('\n'),names=lines.filter(line=>line.startsWith('event: ')),values=lines.filter(line=>line.startsWith('data: '));
 assert.equal(names.length,1,'SSE event name is missing or ambiguous');assert.equal(values.length,1,'SSE data is missing or ambiguous');
 return {name:names[0].slice(7),data:jsonRecord(JSON.parse(values[0].slice(6)))};
}
function frames(reader:ReadableStreamDefaultReader<Uint8Array>){
 const decoder=new TextDecoder();let buffer='';
 return async(message:string):Promise<string[]>=>{
  const chunk=await reader.read();assert(!chunk.done,message);buffer+=decoder.decode(chunk.value,{stream:true});
  const values:string[]=[];let at:number;while((at=buffer.indexOf('\n\n'))>=0){values.push(buffer.slice(0,at));buffer=buffer.slice(at+2);}return values;
 };
}

export async function verifyPackageTerminalStream(response:Response,sendPrivateInput:()=>Promise<void>){
 assert.equal(response.status,200);assert(response.headers.get('content-type')?.startsWith('text/event-stream'));assert.equal(response.headers.get('x-accel-buffering'),'no');assert(response.body);
 const reader=response.body.getReader(),receiveFrames=frames(reader),logs=new Map<number,string>();let observed=false,heartbeat=false,ended=false;
 async function receive(){
  for(const frame of await receiveFrames('terminal stream ended before exit state')){
   const parsed=event(frame);
   if(parsed.name==='heartbeat'){assert.deepEqual(parsed.data,{});assert(!frame.split('\n').some(line=>line.startsWith('id: ')),'heartbeat must not advance output cursor');heartbeat=true;continue;}
   if(parsed.name!=='job')continue;
   const job=recordField(parsed.data,'job'),status=textField(job,'status');assert(status.length>0);
   for(const entry of listField(job,'logs')){
    const sequence=entry.sequence;assert(typeof sequence==='number'&&Number.isSafeInteger(sequence)&&sequence>0,'Invalid SSE output cursor');assert(!logs.has(sequence),'SSE repeated output');logs.set(sequence,textField(entry,'text'));
   }
   observed=[...logs.values()].join('').includes('SSE_READY');ended=status!=='running';
  }
 }
 try{
  while(!observed||!heartbeat)await receive();await sendPrivateInput();while(!ended)await receive();
  const output=[...logs.values()].join('');assert(output.includes('SSE_DONE'));assert(!output.includes('stream-private-input'));assert.equal((await reader.read()).done,true);
 }finally{await reader.cancel();}
}

export async function verifyPackageStreamRevocation(reader:ReadableStreamDefaultReader<Uint8Array>){
 const receiveFrames=frames(reader);let revoked=false;
 try{
  // The caller consumes one warm-up chunk; its remaining job frame may arrive here.
  while(!revoked){for(const frame of await receiveFrames('SSE ended without authentication revocation event')){if(!frame.split('\n').includes('event: terminal-error'))continue;const parsed=event(frame);assert.equal(parsed.data.status,401);revoked=true;}}
  assert.equal((await reader.read()).done,true);
 }finally{await reader.cancel();}
}
