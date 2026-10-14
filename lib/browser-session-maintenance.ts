type Timer=ReturnType<typeof globalThis.setTimeout>|number;
type SessionOptions={target:Pick<EventTarget,'addEventListener'|'removeEventListener'>;document:Pick<Document,'visibilityState'|'addEventListener'|'removeEventListener'>;fetchStatus:(options:{signal:AbortSignal})=>Promise<{status:number;ok:boolean;json:()=>Promise<unknown>}>;onExpired:()=>unknown;now?:()=>number;setInterval?:(callback:()=>void,ms:number)=>Timer;clearInterval?:(timer:Timer)=>void;setTimeout?:(callback:()=>void,ms:number)=>Timer;clearTimeout?:(timer:Timer)=>void};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
// The protected shell persists across routes, so renewal must not depend on remounts.
export function maintainBrowserSession({target,document,fetchStatus,onExpired,now=Date.now,setInterval:interval=globalThis.setInterval,clearInterval:cancelInterval=globalThis.clearInterval,setTimeout:timeout=globalThis.setTimeout,clearTimeout:cancelTimeout=globalThis.clearTimeout}:SessionOptions){
 const period=5*60*1000;
 let stopped=false,expired=false,lastActivity=now(),lastAttempt=-Infinity,pending:AbortController|null=null;
 async function check(){
  const time=now();
  if(stopped||expired||document.visibilityState==='hidden'||time-lastActivity>period||time-lastAttempt<period||pending)return;
  lastAttempt=time;
  const controller=new AbortController();pending=controller;
  const deadline=timeout(()=>controller.abort(),10000);
  try{
   const response=await fetchStatus({signal:controller.signal});
   if(stopped||expired||controller.signal.aborted)return;
   let invalid=response.status===401;
   if(!invalid&&response.ok){const data:unknown=await response.json();invalid=object(data)&&data.authenticated===false;}
   if(stopped||expired||controller.signal.aborted||!invalid)return;
   expired=true;onExpired();
  }catch{/* A network/storage outage is not proof that the session has expired. */}
  finally{cancelTimeout(deadline);if(pending===controller)pending=null;}
 }
 function active(){lastActivity=now();void check();}
 function visible(){if(document.visibilityState!=='hidden')active();}
 const activityEvents=['pointerdown','keydown','wheel','touchstart'];
 for(const event of activityEvents)target.addEventListener(event,active,{passive:true});
 target.addEventListener('focus',active);
 document.addEventListener('visibilitychange',visible);
 const timer=interval(check,60000);
 void check();
 return()=>{stopped=true;pending?.abort();cancelInterval(timer);for(const event of activityEvents)target.removeEventListener(event,active);target.removeEventListener('focus',active);document.removeEventListener('visibilitychange',visible);};
}
