import type {TerminalKeyEvent} from './terminal-key-event.ts';
export type TerminalClipboardContext = {screen: {getSelection: () => string; paste: (text: string) => void; options: {disableStdin?: boolean}}; clipboard?: {writeText: (text: string) => unknown; readText: () => unknown}; inputEnabled: boolean; current: () => boolean; error: () => void};
type ClipboardKey = TerminalKeyEvent & {ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; metaKey?: boolean; isComposing?: boolean; type: string; repeat?: boolean; preventDefault: () => void};
export type TerminalClipboardHandler = ((event: ClipboardKey) => boolean) & {input: (text: string,send: (text: string) => unknown) => void};
import {terminalKeyEvent} from './terminal-key-event.ts';

// xterm.paste preserves its bracketed-paste protocol and onData input queue.
// Never echo clipboard text locally or send it to another/ended session.
export function terminalClipboardHandler(context: () => TerminalClipboardContext | null | undefined): TerminalClipboardHandler{
 let pending: Promise<unknown>=Promise.resolve();let waiting=0,pasting=false;
 const enqueue=(task: () => unknown)=>{waiting++;pending=pending.then(task).catch(()=>{const target=context();if(target?.current())target.error();}).finally(()=>{waiting--;});};
 const handler: TerminalClipboardHandler=(event: ClipboardKey)=>{
  if(!event.ctrlKey||!event.shiftKey||event.altKey||event.metaKey||event.isComposing||event.keyCode===229||!['c','v'].includes(event.key?.toLowerCase()))return terminalKeyEvent(event);
  event.preventDefault();
  if(event.type!=='keydown'||event.repeat)return false;
  const target=context();if(!target?.current())return false;
  const fail=()=>{if(target.current())target.error();};
  if(event.key.toLowerCase()==='c'){
   const text=target.screen.getSelection();if(!text)return false;
   try{Promise.resolve(target.clipboard?.writeText(text)??Promise.reject(Error('clipboard unavailable'))).catch(fail);}catch{fail();}
  }else if(target.inputEnabled){
   let read: Promise<unknown>;try{read=Promise.resolve(target.clipboard?.readText()??Promise.reject(Error('clipboard unavailable')));}catch(error){read=Promise.reject(error);}
   // Attach rejection handling immediately, while preserving gesture order.
   const outcome: Promise<{text: unknown; failed?: never} | {failed: true; text?: never}>=read.then(text=>({text}),()=>({failed:true as const}));
   enqueue(async()=>{const result=await outcome;if(!target.current())return;if(result.failed){fail();return;}if(typeof result.text==='string'&&!target.screen.options.disableStdin){pasting=true;try{target.screen.paste(result.text);}finally{pasting=false;}}});
  }
  return false;
 };
 // Reserve clipboard input's position before Enter or another key arrives.
 handler.input=(text: string,send: (text: string) => unknown)=>{if(pasting||!waiting)send(text);else enqueue(()=>send(text));};
 return handler;
}
