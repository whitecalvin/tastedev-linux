import type {NginxAstNode} from './nginx-node-key.ts';
import type {NginxContextFile,NginxFileContexts,NginxContextOverride} from './nginx-file-contexts.ts';
type SearchOptions = {translate?: (text: string) => string; root?: string; contexts?: NginxFileContexts; override?: NginxContextOverride};
import {nginxSettingParts} from './nginx-setting-name.ts';
import {nginxChildContext,nginxFileContexts,nginxHelpContext} from './nginx-file-contexts.ts';
import {nginxBlockInfo,nginxSettingMatches} from './nginx-setting-info.ts';

export function filterNginxFiles<F extends NginxContextFile & {name: string}>(files: F[],query: string,{translate=text=>text,root='/etc/nginx',contexts=undefined,override=null}: SearchOptions={}): F[]{
 const term=query.trim().toLocaleLowerCase();if(!term)return files;
 const mapping=contexts||nginxFileContexts(files,root);
 function filter(nodes: NginxAstNode[],parent: string): NginxAstNode[]{return nodes.flatMap(node=>{
  const name=nginxSettingParts(node.label).name,childContext=nginxChildContext(parent,name);
  if(node.kind==='block'){
   const info=nginxBlockInfo(name,childContext);
   if([node.label,info.description,translate(info.description)].join(' ').toLocaleLowerCase().includes(term))return [node];
  }else if(nginxSettingMatches(name,node.label,term,translate,parent))return [node];
  const children=filter(node.children,childContext);return children.length?[{...node,children}]:[];
 });}
 return files.flatMap(file=>{if(file.name.toLocaleLowerCase().includes(term))return [file];const context=nginxHelpContext(mapping,file.path,root,override).value;const nodes=filter(file.nodes,context);return nodes.length?[{...file,nodes}]:[];});
}
