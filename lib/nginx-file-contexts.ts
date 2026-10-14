import type {NginxAstNode} from './nginx-node-key.ts';
export type NginxContextFile = {path: string; source?: string; error?: string | null; nodes: NginxAstNode[]; symbolicLink?: boolean; linkTarget?: string};
export type NginxFileContexts = {contexts: Map<string,string[]>; complete: boolean};
export type NginxContextOverride = {path: string; value: string} | null;
import {nginxIncludeLinks} from './nginx-include-links.ts';
export function nginxChildContext(parent: string | null | undefined,name: string): string{
 if(['http','stream','mail'].includes(name))return name==='http'?'http':name+':'+name;
 const family=parent?.split(':')[0];
 if(family!==undefined&&['stream','mail'].includes(family))return family+':'+name;
 if(family==='unknown'&&['server','upstream'].includes(name))return 'unknown:'+name;
 return name;
}
// Structural help only, over files already inspected; never read or activate includes.
export function nginxFileContexts(files: NginxContextFile[],root='/etc/nginx'): NginxFileContexts{
 const contexts=new Map<string,Set<string>>(),byPath=new Map(files.map(file=>[file.path,file]));
 const queue=[{path:root.replace(/\/$/,'')+'/nginx.conf',context:'main'}],seen=new Set();let complete=true;
 while(queue.length){
  if(seen.size>=2048){complete=false;break;}
  const current=queue.shift()!;const key=current.path+'\0'+current.context;if(seen.has(key))continue;seen.add(key);
  const file=byPath.get(current.path);if(!file||file.error){complete=false;continue;}
  if(!contexts.has(file.path))contexts.set(file.path,new Set());contexts.get(file.path)!.add(current.context);
  if(file.symbolicLink&&file.linkTarget){
   const target=byPath.get(file.linkTarget);
   // Both paths were inspected by the tree reader; propagate include context
   // only while the alias and its canonical target still have identical bytes.
   if(target&&!target.error&&target.path.startsWith(root.replace(/\/$/,'')+'/')&&target.source===file.source)queue.push({path:target.path,context:current.context});
   else complete=false;
  }
  function walk(nodes: NginxAstNode[] | null | undefined,parent: string){for(const node of nodes||[]){
   if(node.kind==='block'){walk(node.children,nginxChildContext(parent,node.label.split(/\s/)[0]));continue;}
   const links=nginxIncludeLinks(node,files,root);if(!links)continue;
   if(!links.supported){complete=false;continue;}
   // Empty wildcard sets are valid; an exact uninspected target is incomplete.
   if(!links.files.length&&!links.pattern.includes('*'))complete=false;
   for(const included of links.files)queue.push({path:included.path,context:parent});
  }}walk(file.nodes,current.context);
 }
 return {contexts:new Map([...contexts].map(([path,values])=>[path,[...values].sort()])),complete};
}

const helpContexts=['main','http','server','location','upstream','types','map','geo','split_clients','stream:stream','stream:server','stream:upstream','mail:mail','mail:server'];
export function nginxHelpContext(mapping: NginxFileContexts,path: string | null | undefined,root='/etc/nginx',override: NginxContextOverride=null){
 if(!path)return {value:'unknown:root',choices:[],choose:false};
 const known=mapping.contexts.get(path)||[];
 const certain=known.length===1&&mapping.complete;
 const main=path===root.replace(/\/$/,'')+'/nginx.conf';
 const choose=!main&&!certain;
 const choices=known.length>1&&mapping.complete?known:helpContexts;
 const selected=choose&&override?.path===path&&choices.includes(override?.value)?override.value:null;
 return {value:selected||(main?'main':certain?known[0]:'unknown:root'),choices,choose};
}
