import type {NginxAstNode} from './nginx-syntax.ts';
type LocatedNode = {node: NginxAstNode; parent: NginxAstNode | null};
export type NginxPasteOptions = {rootContext?: string; domain?: string; moveId?: string | null};
export type NginxPasteResult = {source: string; start: number};
import {parseNginxTree,updateNginxDirective,addNginxDirective} from './nginx-syntax.ts';
import {nginxPresets} from './nginx-presets.ts';
const name=(node: NginxAstNode)=>node.label.split(/\s/)[0];
function locate(nodes: NginxAstNode[],id: string | null | undefined,parent: NginxAstNode | null=null): LocatedNode | null{for(const node of nodes){if(node.id===id)return {node,parent};const found=locate(node.children,id,node);if(found)return found;}return null;}
export function copyNginxNode(source: string,id: string | null | undefined): string{const item=locate(parseNginxTree(source),id);if(!item)throw Error('복사할 블록 노드를 선택하세요.');return source.slice(item.node.start,item.node.end);}
export function nginxPasteDomain(text: string): boolean{return parseNginxTree(text).some(node=>node.kind==='block'&&name(node)==='server');}
export function pasteNginxNode(source: string,text: unknown,targetId: string | null=null,{rootContext='main',domain=undefined,moveId=null}: NginxPasteOptions={}): NginxPasteResult{
 if(typeof text!=='string'||text.length>262144||text.includes('\0'))throw Error('복사한 설정 내용을 확인하세요.');
 let blockText: string=text;
 let copied=parseNginxTree(blockText);if(copied.length!==1||copied[0].kind!=='block')throw Error('블록 노드 하나만 붙여넣을 수 있습니다.');
 if(domain!==undefined){
  if(!/^(?:\*\.)?(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(domain)||domain.length>253)throw Error('올바른 도메인을 입력하세요.');
  if(name(copied[0])!=='server')throw Error('도메인은 server 블록에만 지정할 수 있습니다.');
  const entries=copied[0].children.filter(node=>node.kind==='directive'&&name(node)==='server_name');
  for(const entry of [...entries].reverse())blockText=updateNginxDirective(blockText,entry.id,domain.toLowerCase());
  if(!entries.length)blockText=addNginxDirective(blockText,copied[0].id,'server_name',domain.toLowerCase());
  copied=parseNginxTree(blockText);
 }
 const roots=parseNginxTree(source),target=targetId===null?null:locate(roots,targetId);
 if(targetId!==null&&!target)throw Error('붙여넣을 대상 노드를 다시 선택하세요.');
 const sibling=target&&target.node.kind===copied[0].kind&&name(target.node)===name(copied[0]);
 const parent=sibling?target.parent:target?.node;
 if(parent&&parent.kind!=='block')throw Error('대상 블록이나 설정 파일을 선택하세요.');
 const context=parent?name(parent):rootContext;
 if(!nginxPresets(parent,null,context).some(item=>item.kind==='block'&&item.name===name(copied[0])))throw Error('이 위치에는 해당 블록을 추가할 수 없습니다.');
 let position=sibling?target.node.start:parent?parent.close:source.length;
 let base=source;
 if(moveId!==null){const moved=locate(roots,moveId)?.node;if(!moved)throw Error('이동할 노드를 다시 선택하세요.');if(target&&(target.node.start>=moved.start&&target.node.start<moved.end))throw Error('자기 자신이나 하위 노드로 이동할 수 없습니다.');base=source.slice(0,moved.start)+source.slice(moved.end);if(position>=moved.end)position-=moved.end-moved.start;}
 const lineStart=parent?source.lastIndexOf('\n',parent.start-1)+1:0;
 const indent=parent?(source.slice(lineStart,parent.start).match(/^[ \t]*/)?.[0]||'')+'    ':'';
 const lines=blockText.trim().split('\n'),margin=lines.slice(1).filter(line=>line.trim()).reduce((min,line)=>Math.min(min,line.match(/^[ \t]*/)![0].length),Infinity);
 const block=lines.map((line,index)=>indent+(index===0?line:line.slice(Number.isFinite(margin)?margin:0))).join('\n');
 const prefix=position&&base[position-1]!=='\n'?'\n':'';
 const inserted=prefix+block+'\n';
 const updated=base.slice(0,position)+inserted+base.slice(position);parseNginxTree(updated);
 return {source:updated,start:position+prefix.length+indent.length};
}
