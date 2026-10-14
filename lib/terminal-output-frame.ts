export type TerminalOutputCursor = {id: string | null; sequence: number; legacy?: string};
export type TerminalOutputJob = {id: string; command?: string; logs?: readonly {text: string; sequence?: number}[]};
type OutputChunk = {text: string; gap: boolean};
export type TerminalOutputFrame = {reset: boolean; header: string | null; chunks: OutputChunk[]; cursor: TerminalOutputCursor};
export function terminalOutputFrame(previous: TerminalOutputCursor | null | undefined,job: TerminalOutputJob | null | undefined): TerminalOutputFrame{
 const id=job?.id??null,reset=previous?.id!==id;let sequence=reset?0:previous?.sequence||0;const logs=job?.logs||[];
 if(logs.some(entry=>!Number.isInteger(entry.sequence)||(entry.sequence ?? 0)<1)){
  const legacy=JSON.stringify(logs.map(entry=>entry.text)),refresh=reset||previous?.legacy!==legacy;return {reset:refresh,header:refresh&&job?'$ '+job.command:null,chunks:refresh?logs.map(entry=>({text:entry.text,gap:false})):[],cursor:{id,sequence:0,legacy}};
 }
 const chunks: OutputChunk[]=[];for(const entry of logs){const next=entry.sequence!;if(next<=sequence)continue;chunks.push({text:entry.text,gap:next>sequence+1});sequence=next;}
 return {reset,header:reset&&job?'$ '+job.command:null,chunks,cursor:{id,sequence}};
}
