import type {RedisTopology} from './redis-topology.ts';
export type RedisGraphView={root?:string;files?:{path:string;bytes?:number;version?:string}[];edges?:{from:string;line:number;to?:string;targets?:string[]}[];warnings?:RedisTopology['warnings']};
export type RedisTreeNode={path:string;line:number|null;bytes:number|null;version:string|null;missing:boolean;cycle:boolean;truncated:boolean;children:RedisTreeNode[]};
export function redisConfigTree(graph:RedisGraphView|null|undefined):RedisTreeNode|null{
 const files=new Map((graph?.files||[]).map(file=>[file.path,file]));let remaining=512;
 function visit(path:string,ancestors=new Set<string>(),line:number|null=null):RedisTreeNode{
  const file=files.get(path),node:RedisTreeNode={path,line,bytes:file?.bytes??null,version:file?.version??null,missing:!file,cycle:ancestors.has(path),truncated:false,children:[]};
  if(node.cycle)return node;if(--remaining<0||ancestors.size>=32){node.truncated=true;return node;}
  const next=new Set(ancestors);next.add(path);
  edges: for(const edge of graph?.edges||[]){if(edge.from!==path)continue;for(const target of edge.targets||[edge.to]){if(remaining<=0){node.truncated=true;break edges;}if(typeof target==='string')node.children.push(visit(target,next,edge.line));}}
  return node;
 }
 return graph?.root?visit(graph.root):null;
}

export function redisFileDetails(graph:RedisGraphView|null|undefined,path:unknown){
 if(!graph||typeof path!=='string')return null;const file=graph.files?.find(item=>item.path===path);if(!file||typeof file.bytes!=='number'||typeof file.version!=='string')return null;
 return {path:file.path,bytes:file.bytes,version:file.version,main:path===graph.root,incoming:(graph.edges||[]).filter(edge=>(edge.targets||[edge.to]).includes(path)).map(edge=>({from:edge.from,line:edge.line})),outgoing:(graph.edges||[]).filter(edge=>edge.from===path).map(edge=>({line:edge.line,targets:(edge.targets||[edge.to]).filter((value):value is string=>typeof value==='string')})),warnings:(graph.warnings||[]).filter(warning=>warning.path===path)};
}
