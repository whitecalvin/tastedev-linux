import type {NginxAstNode} from './nginx-node-key.ts';
export type CodeBuffer = {text: string; baseline: string; dirty?: boolean};
export type CodeBuffers = Record<string,CodeBuffer>;
export type EditorTarget = {identity: string; filePath: string; kind: string; label: string; exists: boolean; readOnly: boolean; source: string | null};
export type RecoveryEntry = {identity: string; buffer: CodeBuffer; filePath?: string; kind?: string; label?: string; state: string};
export type RecoveryConfirmation = {kind: 'discard'; identity: string; buffer: CodeBuffer} | {kind: 'replace'; identity: string; buffer: CodeBuffer; target: EditorTarget; destination?: CodeBuffer};
type RecoveryFile = {path: string; source: string; nodes: NginxAstNode[]; error?: string | null; readOnly?: boolean};
type ResetRequest = {identity: string; source: string; buffer: CodeBuffer};
type ResetTarget = {identity: string; source: string; readOnly: boolean};
import {nginxNodeFromKey} from './nginx-node-key.ts';
export function nginxEditorTarget(identity: string,files: RecoveryFile[]): EditorTarget | null{
 let parts: [string,string],key: [string,string,number][] | null;
 try{const parsed: unknown=JSON.parse(identity);if(!Array.isArray(parsed)||parsed.length!==2||typeof parsed[0]!=='string'||typeof parsed[1]!=='string')return null;parts=[parsed[0],parsed[1]];
  const path: unknown=parts[1]==='root'?null:JSON.parse(parts[1]);
  if(path!==null&&(!Array.isArray(path)||!path.length||path.some(part=>!Array.isArray(part)||part.length!==3||typeof part[0]!=='string'||typeof part[1]!=='string'||!Number.isInteger(part[2])||part[2]<0)))return null;
  // Every saved path segment above is a kind/label/occurrence tuple.
  key=path as [string,string,number][] | null;
 }catch{return null;}
 const file=files.find(file=>file.path===parts[0]),node=key&&file?nginxNodeFromKey(file.nodes,parts[1]):null;
 const kind=key?.at(-1)?.[0]||'file',label=key?.at(-1)?.[1]||parts[0];
 const exists=Boolean(file&&!file.error&&(!key||node));
 return {identity,filePath:parts[0],kind,label,exists,readOnly:Boolean(file?.readOnly),source:exists?(node?file!.source.slice(node.start,node.end):file!.source):null};
}
export function nginxCodeRecoveryEntries(buffers: CodeBuffers | null | undefined,files: RecoveryFile[]): RecoveryEntry[]{
 return Object.entries(buffers||{}).filter(([,buffer])=>typeof buffer?.text==='string'&&(buffer.dirty||buffer.text!==buffer.baseline)).map(([identity,buffer])=>{
  const target=nginxEditorTarget(identity,files);
  return {identity,buffer,...target,state:!target?.exists?'missing':target.source!==buffer.baseline?'changed':'current'};
 });
}
export function recoverNginxCodeBuffer(buffers: CodeBuffers,identity: string,target: EditorTarget | null | undefined,replace=false): CodeBuffers{
 const original=buffers[identity],old=nginxEditorTarget(identity,[]);
 if(!original||!old||!target?.exists||target.readOnly||typeof target.source!=='string'||old.filePath!==target.filePath||old.kind!==target.kind)throw Error('같은 파일의 같은 종류 노드를 선택하세요.');
 const current=buffers[target.identity];
 if(identity!==target.identity&&current&&(current.dirty||current.text!==current.baseline)&&current.text!==original.text&&!replace)throw Error('대상 노드에 미저장 코드가 있습니다.');
 const next={...buffers};delete next[identity];if(original.text!==target.source)next[target.identity]={text:original.text,baseline:target.source,dirty:true};else delete next[target.identity];return next;
}

function sameBuffer(left: CodeBuffer | null | undefined,right: CodeBuffer | null | undefined){return !left&&!right||Boolean(left&&right&&left.text===right.text&&left.baseline===right.baseline&&Boolean(left.dirty)===Boolean(right.dirty));}
// Re-check captured source and destination buffers when approval is finally applied.
export function applyNginxRecoveryConfirmation(buffers: CodeBuffers,request: RecoveryConfirmation | null | undefined,target: EditorTarget | null | undefined): CodeBuffers{
 if(!request||!sameBuffer(buffers[request.identity],request.buffer))throw Error('설정이 변경되었습니다. 다시 확인하세요.');
 if(request.kind==='discard'){const next={...buffers};delete next[request.identity];return next;}
 const captured=request.target;
 if(request.kind!=='replace'||!target?.exists||target.readOnly||!captured||target.identity!==captured.identity||target.filePath!==captured.filePath||target.kind!==captured.kind||target.source!==captured.source||!sameBuffer(buffers[target.identity],request.destination))throw Error('설정이 변경되었습니다. 다시 확인하세요.');
 return recoverNginxCodeBuffer(buffers,request.identity,target,true);
}

export function resetNginxEditorBuffer(buffers: CodeBuffers,request: ResetRequest | null | undefined,current: ResetTarget | null | undefined): CodeBuffers{
 if(!request?.buffer||typeof request.buffer.text!=='string'||current?.readOnly||request.identity!==current?.identity||request.source!==current?.source)throw Error('설정이 변경되었습니다. 다시 확인하세요.');
 return applyNginxRecoveryConfirmation(buffers,{...request,kind:'discard'},null);
}
