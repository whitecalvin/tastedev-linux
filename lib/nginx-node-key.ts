export type {NginxAstNode} from './nginx-syntax.ts';
type KeyNode<N> = {id: string; label: string; kind?: string; children?: N[]};
type KeyPart = [string | undefined,string,number];
// Semantic ancestry keeps editor buffers stable when unrelated preceding nodes change.
// Equal sibling labels are distinguished by occurrence within that label group.
export function nginxNodeKey<N extends KeyNode<N>>(nodes: readonly N[] | null | undefined,id: string | null | undefined): string | null{
 function visit(list: readonly N[] | null | undefined,parents: KeyPart[]): string | null{const occurrences=new Map<string,number>();for(const node of list||[]){const occurrence=occurrences.get(node.label)||0;occurrences.set(node.label,occurrence+1);const path: KeyPart[]=[...parents,[node.kind,node.label,occurrence]];if(node.id===id)return JSON.stringify(path);const found=visit(node.children,path);if(found)return found;}return null;}
 return id==null?'root':visit(nodes,[]);
}
export function nginxNodeFromKey<N extends KeyNode<N>>(nodes: readonly N[] | null | undefined,key: string | null | undefined): N | null{
 if(!key||key==='root')return null;let path: unknown;try{path=JSON.parse(key);}catch{return null;}if(!Array.isArray(path))return null;
 let list: readonly N[] | null | undefined=nodes;let node: N | null=null;for(const part of path){if(!Array.isArray(part)||part.length!==3)return null;const [kind,label,occurrence]=part;if(typeof occurrence!=='number'||!Number.isInteger(occurrence)||occurrence<0)return null;node=(list||[]).filter(item=>item.kind===kind&&item.label===label)[occurrence]??null;if(!node)return null;list=node.children;}return node;
}
