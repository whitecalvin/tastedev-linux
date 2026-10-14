export type ConfigDraft = {source: string; baseline: string; past?: string[]; future?: string[]};
export function recordConfigChange(previous: ConfigDraft | null | undefined,baseline: string,source: string): ConfigDraft{
 const current=previous||{source:baseline,baseline,past:[],future:[]};
 if(current.source===source)return current;
 return {...current,source,past:[...(current.past||[]),current.source].slice(-20),future:[]};
}
export function stepConfigHistory(current: ConfigDraft,direction: string): ConfigDraft;
export function stepConfigHistory(current: null,direction: string): null;
export function stepConfigHistory(current: undefined,direction: string): undefined;
export function stepConfigHistory(current: ConfigDraft | null | undefined,direction: string): ConfigDraft | null | undefined{
 if(!current||!['undo','redo'].includes(direction))return current;
 const undo=direction==='undo',from=undo?current.past:current.future;
 if(!from?.length)return current;
 const target=from.at(-1)!,remaining=from.slice(0,-1);
 return {...current,source:target,past:undo?remaining:[...(current.past||[]),current.source].slice(-20),future:undo?[...(current.future||[]),current.source].slice(-20):remaining};
}
