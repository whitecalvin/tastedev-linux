// xterm commits compositionend on the next task, after a tab may become hidden.
// Preserve that final input only for the original, still writable session.
export function terminalCompositionVisibility(visible: () => boolean,current: () => boolean,{schedule=setTimeout,cancel=handle=>clearTimeout(handle as ReturnType<typeof setTimeout>)}: {schedule?: (callback: () => void, delay: number) => unknown; cancel?: (handle: unknown) => void}={}){
 let composing=false,finishing=false,generation=0,disposed=false;let timer: unknown=null;
 return {
  start(){if(disposed||!visible()||!current())return;generation++;if(timer!==null)cancel(timer);timer=null;composing=true;finishing=false;},
  end(){if(disposed||!composing)return;composing=false;finishing=true;const ticket=generation;
   // Registered after xterm's own composition listener; its commit runs first.
   timer=schedule(()=>{if(ticket===generation){finishing=false;timer=null;}},0);
  },
  accepts(){return !disposed&&current()&&(visible()||finishing);},
  dispose(){disposed=true;composing=finishing=false;generation++;if(timer!==null)cancel(timer);timer=null;}
 };
}
