// Each queue belongs to one session. Input is never persisted or echoed here.
export type TerminalInputError = 'capacity' | 'send';
export function terminalInputQueue(send: (text: string) => unknown,onError: (reason: TerminalInputError) => void=()=>{}){
 let pending='',active=true,running=false,disposed=false;
 async function drain(){if(running||!active)return;running=true;try{while(active&&pending){let text=pending.slice(0,1024);if(text.length===1024&&/[\uD800-\uDBFF]/.test(text.at(-1) ?? ''))text=text.slice(0,-1);pending=pending.slice(text.length);try{await send(text);}catch{pending='';if(active){active=false;onError('send');}}}}finally{running=false;}}
 return {push(text: unknown){if(!active||typeof text!=='string'||text.includes('\0'))return;if(pending.length+text.length>262144){pending='';active=false;onError('capacity');return;}pending+=text;void drain();},resume(){if(disposed||running)return false;pending='';active=true;return true;},dispose(){disposed=true;active=false;pending='';}};
}
