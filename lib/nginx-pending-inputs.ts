import type {NginxAstNode} from './nginx-syntax.ts';
export type PendingInput = string | {name: string; value: string};
export type PendingCache = Map<string,{source: string; values: Map<string,PendingInput>}>;
export type PendingSnapshot = Record<string,{source: string; values: Record<string,PendingInput>}>;
// Unapplied inputs belong to the exact file text from which they were edited.
import {parseNginxTree} from './nginx-syntax.ts';
import {nginxSettingParts} from './nginx-setting-name.ts';
import {nginxNodeKey,nginxNodeFromKey} from './nginx-node-key.ts';
export function nginxPendingFileInputs(cache: PendingCache,path: string,source: string){
 let entry=cache.get(path);
 if(!entry||entry.source!==source){entry={source,values:new Map()};cache.delete(path);cache.set(path,entry);}
 while(cache.size>16){const oldest=cache.keys().next().value;if(oldest===undefined)break;cache.delete(oldest);}
 return entry.values;
}
// Only explicit local setting edits may carry untouched inputs to a new draft.
// Refreshes, code replacement and structural edits still invalidate old inputs.
export function carryNginxSettingInputs(cache: PendingCache,path: string,before: string,after: string){
 const entry=cache.get(path);if(!entry||entry.source!==before)return;
 const previous=parseNginxTree(before),next=parseNginxTree(after),values=new Map<string,PendingInput>();
 function find(nodes: NginxAstNode[],id: string): NginxAstNode | null{for(const node of nodes){if(node.id===id)return node;const result=find(node.children,id);if(result)return result;}return null;}
 for(const [key,value] of entry.values){
  let parts;try{parts=JSON.parse(key);}catch{continue;}if(!Array.isArray(parts)||parts.length!==4)continue;
  const [scope,available,id,label]=parts;if(typeof scope!=='string'||typeof available!=='boolean'||typeof id!=='string'||typeof label!=='string')continue;
  if(available){
   const parent=scope==='root'?null:nginxNodeFromKey(previous,scope),updatedParent=scope==='root'?null:nginxNodeFromKey(next,scope);
   if(scope==='root'||parent?.kind==='block'&&updatedParent?.kind==='block'&&parent.id===updatedParent.id)values.set(key,value);
   continue;
  }
  const node=find(previous,id),updated=node&&nginxNodeFromKey(next,nginxNodeKey(previous,id));
  if(node?.label!==label||!updated||updated.kind!=='directive'||updated.id!==node.id)continue;
  if(value!==nginxSettingParts(updated.label).value)values.set(JSON.stringify([scope,false,updated.id,updated.label]),value);
 }
 cache.set(path,{source:after,values});
}

export function hasPendingNginxInputs(cache: PendingCache,path: string,source: string,buffers: Record<string,{text?: string; baseline?: string}>={}){
 const entry=cache.get(path);if(entry?.source===source&&entry.values.size)return true;
 return Object.entries(buffers).some(([identity,buffer])=>{
  try{return JSON.parse(identity)[0]===path&&buffer?.text!==buffer?.baseline;}catch{return false;}
 });
}

export function nginxAuxiliaryInputKey(scope: string | null,name: string){return JSON.stringify([scope,true,'$ui:'+name,'$ui:'+name]);}
export function setNginxAuxiliaryInput(values: Map<string,PendingInput>,scope: string | null,name: string,value: PendingInput,empty=false){
 const key=nginxAuxiliaryInputKey(scope,name);if(empty)values.delete(key);else values.set(key,value);
}

export function snapshotNginxPendingInputs(cache: PendingCache): PendingSnapshot{
 return Object.fromEntries([...cache].filter(([,entry])=>entry.values.size).map(([path,entry])=>[path,{source:entry.source,values:structuredClone(Object.fromEntries(entry.values))}]));
}
function pendingInput(value: unknown): value is PendingInput {return typeof value==='string'||value!==null&&typeof value==='object'&&'name' in value&&typeof value.name==='string'&&'value' in value&&typeof value.value==='string';}
export function restoreNginxPendingInputs(snapshot: unknown={}): PendingCache {
 const cache: PendingCache=new Map();if(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot))return cache;
 for(const [path,entry] of Object.entries(snapshot).slice(-16)){
  if(!entry||typeof entry!=='object'||!('source' in entry)||typeof entry.source!=='string'||!('values' in entry)||!entry.values||typeof entry.values!=='object'||Array.isArray(entry.values))continue;
  const values=new Map<string,PendingInput>();for(const [key,value] of Object.entries(entry.values))if(pendingInput(value))values.set(key,structuredClone(value));
  cache.set(path,{source:entry.source,values});
 }
 return cache;
}
