export type TreeExpansion = {defaultOpen: boolean; nodes: Record<string,boolean>};
export const nginxTreeExpansionKey='tastedev-linux.nginx-tree-expansion.v1';
export function treeExpansion(value: unknown): TreeExpansion{
 const input=value&&typeof value==='object'?value as Record<string,unknown>:{};
 const nodes: Record<string,boolean>={};
 if(input.nodes&&typeof input.nodes==='object')for(const [key,open] of Object.entries(input.nodes)){
  if(key.length<=4096&&typeof open==='boolean')nodes[key]=open;
 }
 return {defaultOpen:typeof input.defaultOpen==='boolean'?input.defaultOpen:true,nodes};
}
export function treeNodeOpen(value: TreeExpansion | null | undefined,key: string): boolean{return value?.nodes?.[key]??value?.defaultOpen??true;}
export function setTreeNodeOpen(value: TreeExpansion,key: string,open: boolean): TreeExpansion{
 const current=treeExpansion(value);
 if(treeNodeOpen(current,key)===open)return value;
 return {...current,nodes:{...current.nodes,[key]:open}};
}
