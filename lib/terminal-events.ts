export type TerminalEventJob = {id: string; status: string; logSequence?: number; stdinOpen?: boolean; exitCode?: number | null; signal?: string | null; logs?: {sequence?: number; text: string}[]; [key: string]: unknown};
export type TerminalEventOptions = {readJob: (id: string | null,since: number) => TerminalEventJob; authorize: () => boolean | Promise<boolean>; subscribe?: (id: string | null,wake: () => void) => (() => void) | null; interval?: number; authInterval?: number; heartbeatInterval?: number};
const encoder=new TextEncoder();
const authError='로그인이 필요하거나 세션이 만료되었습니다.';
const event=(name: string,data: unknown,id?: number)=>encoder.encode((id===undefined?'':'id: '+id+'\n')+'event: '+name+'\ndata: '+JSON.stringify(data)+'\n\n');
export async function terminalEventResponse(request: Request,{readJob,authorize,subscribe,interval=100,authInterval=1000,heartbeatInterval=15000}: TerminalEventOptions): Promise<Response>{
 const denied=()=>Response.json({error:authError},{status:401,headers:{'Cache-Control':'no-store'}});
 if(!await authorize())return denied();
 const query=new URL(request.url).searchParams,id=query.get('job');
 const supplied=[query.get('since'),request.headers.get('last-event-id')].filter(value=>value!==null);
 if(supplied.some(value=>!/^\d{1,16}$/.test(value)||!Number.isSafeInteger(Number(value))))throw Object.assign(Error('터미널 세션 옵션을 확인하세요.'),{status:400});
 let sequence=Math.max(0,...supplied.map(Number)),active=true,lastAuth=Date.now(),lastHeartbeat=Date.now(),dirty=false;
 let initial: TerminalEventJob | null=readJob(id,sequence),timer: ReturnType<typeof setTimeout> | undefined,wake: (() => void) | null | undefined,signature: string | null=null,unsubscribe: (() => void) | null | undefined;
 const stop=()=>{active=false;clearTimeout(timer);wake?.();unsubscribe?.();unsubscribe=null;request.signal.removeEventListener('abort',stop);};
 const close=(controller: ReadableStreamDefaultController<Uint8Array>)=>{stop();try{controller.close();}catch{}};
 const wait=()=>new Promise<void>(resolve=>{
  if(dirty||!active){resolve();return;}
  wake=()=>{clearTimeout(timer);wake=null;resolve();};
  const delay=typeof unsubscribe==='function'?Math.max(1,Math.min(authInterval-(Date.now()-lastAuth),heartbeatInterval-(Date.now()-lastHeartbeat))):interval;
  timer=setTimeout(()=>{wake=null;resolve();},delay);
 });
 if(subscribe)unsubscribe=subscribe(id,()=>{dirty=true;wake?.();});
 request.signal.addEventListener('abort',stop,{once:true});if(request.signal.aborted)stop();
 const stream=new ReadableStream<Uint8Array>({
  async pull(controller){try{while(active){
   if(Date.now()-lastAuth>=authInterval){const allowed=await authorize();if(!active)break;if(!allowed){controller.enqueue(event('terminal-error',{status:401,error:authError}));close(controller);return;}lastAuth=Date.now();}
   dirty=false;const job=initial??readJob(id,sequence);initial=null;
   const next=[job.logSequence,job.status,job.stdinOpen,job.exitCode,job.signal].join('|');
   if(next!==signature){const logs=(job.logs||[]).filter(item=>(item.sequence??0)>sequence);controller.enqueue(event('job',{job:{...job,logs}},job.logSequence));sequence=Math.max(sequence,job.logSequence||0);signature=next;lastHeartbeat=Date.now();if(job.status!=='running')close(controller);return;}
   if(Date.now()-lastHeartbeat>=heartbeatInterval){controller.enqueue(event('heartbeat',{}));lastHeartbeat=Date.now();return;}
   await wait();
  }close(controller);}catch(error){const missing=error!==null&&typeof error==='object'&&'status' in error&&error.status===404;if(active){controller.enqueue(event('terminal-error',{status:missing?404:503,error:missing?'명령 기록을 찾을 수 없습니다.':'서버 요청에 실패했습니다.'}));close(controller);}}},
  cancel(){stop();}
 });
 return new Response(stream,{headers:{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-store, no-transform','X-Accel-Buffering':'no'}});
}
