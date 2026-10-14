type TerminalDimensions = {cols: number; rows: number};
export function terminalResizeQueue(send: (cols: number,rows: number) => unknown,onError: (error: unknown) => void=()=>{},onSuccess: () => void=()=>{}){
 let active=true,running=false;let pending: TerminalDimensions | null=null;
 async function drain(){if(running||!active)return;running=true;try{while(active&&pending){const size=pending;pending=null;try{await send(size.cols,size.rows);if(active)onSuccess();}catch(error){if(active)onError(error);}}}finally{running=false;}}
 return {push(cols: number,rows: number){if(!active)return;pending={cols,rows};void drain();},dispose(){active=false;pending=null;}};
}
