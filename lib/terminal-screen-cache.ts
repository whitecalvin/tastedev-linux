import type {Terminal} from '@xterm/xterm';
import type {FitAddon} from '@xterm/addon-fit';
import type {TerminalOutputCursor} from './terminal-output-frame.ts';
type DisposableScreen = {instance?: {dispose: () => void}};
export type RetainedTerminalScreen = {instance: Terminal; fit: FitAddon; cursor: TerminalOutputCursor};
// Client-only entries are admitted by effects, never during SSR. A retained
// emulator preserves ANSI cursor state and scrollback across route navigation.
export function createTerminalScreenCache<T extends DisposableScreen = DisposableScreen>(limit=4){
 const entries=new Map<string,T>(),closed=new Set<string>();let generation=0;
 const dispose=(entry: T | undefined)=>{try{entry?.instance?.dispose();}catch{}};
 return {
  get generation(){return generation;},
  take(id: string | undefined){if(!id)return null;const entry=entries.get(id);entries.delete(id);return entry??null;},
  put(id: string | undefined,entry: T,ticket: number){if(!id||ticket!==generation||closed.has(id))return false;const previous=entries.get(id);if(previous&&previous!==entry)dispose(previous);entries.delete(id);entries.set(id,entry);while(entries.size>limit){const first=entries.keys().next().value;if(first===undefined)break;dispose(entries.get(first));entries.delete(first);}return true;},
  forget(id: string | undefined){if(!id)return;closed.add(id);dispose(entries.get(id));entries.delete(id);},
  clear(){generation++;for(const entry of entries.values())dispose(entry);entries.clear();closed.clear();},
  get size(){return entries.size;}
 };
}
export const terminalScreenCache=createTerminalScreenCache<RetainedTerminalScreen>();
