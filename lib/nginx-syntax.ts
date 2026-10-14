export type NginxAstNode = {id: string; label: string; line: number; start: number; end: number; children: NginxAstNode[]} & ({kind: 'block'; open: number; close: number} | {kind: 'directive'});
type NginxBlock = Extract<NginxAstNode,{kind: 'block'}>;
type NginxDirective = Extract<NginxAstNode,{kind: 'directive'}>;
import {validNginxSettingName,nginxSettingParts} from './nginx-setting-name.ts';
import {nginxServerPresetBody} from './nginx-server-presets.ts';
// Display parser only: nginx -t remains the authoritative configuration validator.
export function parseNginxTree(text: string): NginxAstNode[]{
 const roots: NginxAstNode[]=[],stack=[roots],blocks: NginxBlock[]=[];let buffer='',quote='',escaped=false,comment=false,line=1,start=1,count=0,offset=0,startOffset=0;
 function add(block?: false): NginxDirective | null;
 function add(block: true): NginxBlock | null;
 function add(block=false): NginxAstNode | null {const label=buffer.trim();buffer='';if(!label)return null;if(++count>2000)throw new Error('설정 노드가 너무 많습니다.');const common={id:String(count),label,line:start,start:startOffset,end:offset+1};
  const node: NginxAstNode=block?{...common,kind:'block',children:[],open:offset,close:-1}:{...common,kind:'directive',children:[]};stack.at(-1)!.push(node);return node;}

 for(let index=0;index<text.length;index++){const ch=text[index];offset=index;
  if(comment){if(ch==='\n'){comment=false;buffer+=' ';}else continue;}
  else if(escaped){buffer+=ch;escaped=false;}
  else if(ch==='\\'){if(!buffer.trim()){start=line;startOffset=index;}buffer+=ch;escaped=true;}
  else if(quote){buffer+=ch;if(ch===quote)quote='';}
  else if(ch==='"'||ch==="'"){if(!buffer.trim()){start=line;startOffset=index;}quote=ch;buffer+=ch;}
  else if(ch==='#')comment=true;
  else if(ch==='{'){const node=add(true);if(!node||stack.length>64)throw new Error('블록 구조를 확인하세요.');stack.push(node.children);blocks.push(node);}
  else if(ch==='}'){if(buffer.trim()||stack.length===1)throw new Error('블록 구조를 확인하세요.');stack.pop();const block=blocks.pop()!;block.close=index;block.end=index+1;buffer='';}
  else if(ch===';')add();
  else {if(!buffer.trim()&&!/\s/.test(ch)){start=line;startOffset=index;}buffer+=ch;}
  if(ch==='\n')line++;
 }
 if(quote||escaped||stack.length!==1||buffer.trim())throw new Error('완료되지 않은 설정 구문입니다.');
 return roots;
}

export function updateNginxDirective(source: string,id: string | null | undefined,value: unknown): string{
 if(typeof value!=='string'||value.length>4096||/[;{}#\r\n\0]/.test(value))throw new Error('설정 값에 세미콜론·중괄호·주석·줄바꿈을 넣을 수 없습니다.');
 const found=findNode(parseNginxTree(source),id);
 if(!found||found.kind!=='directive')throw new Error('설정 항목을 선택하세요.');
 const {name}=nginxSettingParts(found.label);
 const replacement=name+(value.trim()?' '+value.trim():'')+';';
 const updated=source.slice(0,found.start)+replacement+source.slice(found.end);
 parseNginxTree(updated);return updated;
}

function findNode(nodes: NginxAstNode[],id: string | null | undefined): NginxAstNode | null{for(const node of nodes){if(node.id===id)return node;const found=findNode(node.children,id);if(found)return found;}return null;}
export function addNginxDirective(source: string,parentId: string | null | undefined,name: unknown,value: unknown,kind='directive',rootContext='main'): string{
 if(!['directive','block'].includes(kind))throw new Error('설정 노드 종류를 확인하세요.');
 if(typeof value!=='string'||value.length>4096||/[;{}#\r\n\0]/.test(value))throw new Error('설정 값에 세미콜론·중괄호·주석·줄바꿈을 넣을 수 없습니다.');
 const nodes=parseNginxTree(source),candidate=parentId===null?null:findNode(nodes,parentId);
 const parent=candidate?.kind==='block'?candidate:null;
 if(parentId!==null&&parent?.kind!=='block')throw new Error('추가할 블록을 선택하세요.');
 const context=parent?.label.split(/\s/)[0]||rootContext;
 if(!validNginxSettingName(name,kind==='directive'?context:null))throw new Error(context==='types'?'MIME 유형은 application/json 형식으로 입력하세요.':['map','geo','split_clients'].includes(context)?'매핑 키는 하나의 값으로 입력하고 공백이 있으면 따옴표로 감싸세요.':'설정 이름은 영문·숫자·밑줄로 입력하세요.');
 const balancingMethods=['hash','ip_hash','least_conn','least_time','random','sticky'];
 if(kind==='directive'&&context==='upstream'&&balancingMethods.includes(name)&&(parent?.children||nodes).some(node=>node.kind==='directive'&&balancingMethods.includes(nginxSettingParts(node.label).name)))throw new Error('이 업스트림에 부하 분산 방식이 이미 있습니다. 코드 보기에서 기존 방식을 변경한 뒤 추가하세요.');
 let position=parent?parent.close:source.length,indentFollowing=false;
 if(parent){const closeLine=source.lastIndexOf('\n',parent.close-1)+1;if(/^[ \t]*$/.test(source.slice(closeLine,parent.close)))position=closeLine;}
 if(kind==='directive'&&(context==='map'&&name==='hostnames'||context==='geo'&&name==='ranges'))position=parent?parent.open+1:0;
 // In nginx 1.28, a balancing method must be configured before keepalive.
 if(kind==='directive'&&context==='upstream'&&['hash','ip_hash','least_conn','random'].includes(name)){
  const keepalive=parent?.children.find(node=>node.kind==='directive'&&nginxSettingParts(node.label).name==='keepalive');
  if(keepalive){const line=source.lastIndexOf('\n',keepalive.start-1)+1;indentFollowing=!/^[ \t]*$/.test(source.slice(line,keepalive.start));position=indentFollowing?keepalive.start:line;}
 }
 if(kind==='directive'&&context==='split_clients'&&name!=='*'){
  const remainder=(parent?.children||nodes).find(node=>node.kind==='directive'&&nginxSettingParts(node.label).name==='*');
  if(remainder){const line=source.lastIndexOf('\n',remainder.start-1)+1;position=/^[ \t]*$/.test(source.slice(line,remainder.start))?line:remainder.start;}
 }
 const lineStart=parent?source.lastIndexOf('\n',parent.start-1)+1:0;
 const indent=parent?source.slice(lineStart,parent.start).match(/^\s*/)![0]+'    ':'';
 const header=indent+name+(value.trim()?' '+value.trim():'');
 const addition=(position&&source[position-1]!=='\n'?'\n':'')+header+(kind==='block'?' {\n'+indent+'}\n':';\n')+(indentFollowing?indent:'');
 const updated=source.slice(0,position)+addition+source.slice(position);parseNginxTree(updated);return updated;
}
export function addNginxServerBlock(source: string,parentId: string | null=null,preset='basic'): string{
 let updated=addNginxDirective(source,parentId,'server','','block','http');
 const tree=parseNginxTree(updated);
 const server=(parentId===null?tree:findNode(tree,parentId)!.children).at(-1);
 if(server?.kind!=='block')throw new Error('추가할 블록을 선택하세요.');
 const indent=updated.slice(updated.lastIndexOf('\n',server.start-1)+1,server.start).match(/^[ \t]*/)![0];
 const body=nginxServerPresetBody(preset).split('\n').map(line=>indent+'    '+line).join('\n');
 updated=updated.slice(0,server.open+1)+'\n'+body+'\n'+indent+updated.slice(server.close);
 parseNginxTree(updated);return updated;
}

export function removeNginxDirective(source: string,id: string | null | undefined): string{
 const found=findNode(parseNginxTree(source),id);
 if(found?.kind!=='directive')throw new Error('삭제할 설정 항목을 선택하세요.');
 const updated=source.slice(0,found.start)+source.slice(found.end);parseNginxTree(updated);return updated;
}

export function updateNginxBlock(source: string,id: string | null | undefined,value: unknown): string{
 if(typeof value!=='string'||value.length>4096||/[;{}#\r\n\0]/.test(value))throw new Error('설정 값에 세미콜론·중괄호·주석·줄바꿈을 넣을 수 없습니다.');
 const found=findNode(parseNginxTree(source),id);
 if(found?.kind!=='block')throw new Error('수정할 블록을 선택하세요.');
 const name=found.label.split(/\s/)[0];
 const updated=source.slice(0,found.start)+name+(value.trim()?' '+value.trim():'')+' '+source.slice(found.open);
 parseNginxTree(updated);return updated;
}

export function removeNginxBlock(source: string,id: string | null | undefined): string{
 const found=findNode(parseNginxTree(source),id);
 if(found?.kind!=='block')throw new Error('삭제할 블록을 선택하세요.');
 const updated=source.slice(0,found.start)+source.slice(found.end);
 parseNginxTree(updated);return updated;
}

export function duplicateNginxNode(source: string,id: string | null | undefined): string{
 const found=findNode(parseNginxTree(source),id);
 if(!found)throw new Error('복제할 설정 노드를 선택하세요.');
 const lineStart=source.lastIndexOf('\n',found.start-1)+1;
 const prefix=source.slice(lineStart,found.start);
 const indent=/^[ \t]*$/.test(prefix)?prefix:'';
 const updated=source.slice(0,found.end)+'\n'+indent+source.slice(found.start,found.end)+source.slice(found.end);
 parseNginxTree(updated);return updated;
}

export function moveNginxNode(source: string,id: string | null | undefined,direction: string): string{
 if(!['up','down'].includes(direction))throw new Error('이동 방향을 확인하세요.');
 const roots=parseNginxTree(source);let siblings: NginxAstNode[] | undefined;
 const visit=(nodes: NginxAstNode[])=>{if(nodes.some(node=>node.id===id))siblings=nodes;else for(const node of nodes)visit(node.children);};visit(roots);
 if(!siblings)throw new Error('이동할 설정 노드를 선택하세요.');
 const index=siblings.findIndex(node=>node.id===id),other=index+(direction==='up'?-1:1);
 if(other<0||other>=siblings.length)return source;
 const first=siblings[Math.min(index,other)],second=siblings[Math.max(index,other)];
 const gap=source.slice(first.end,second.start);
 // Comments between siblings may describe either node: retain their association by refusing ambiguous moves.
 if(!/^\s*$/.test(gap))throw new Error('노드 사이에 주석이 있어 순서를 이동할 수 없습니다.');
 const updated=source.slice(0,first.start)+source.slice(second.start,second.end)+gap+source.slice(first.start,first.end)+source.slice(second.end);
 parseNginxTree(updated);return updated;
}
