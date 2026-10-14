import type {NginxAstNode} from './nginx-syntax.ts';
export type NginxGraphFile = {path:string;resolved:string;version:string;bytes:number;readOnly?:boolean};
export type NginxGraphDirectory = {path:string;pattern:string;version:string};
export type NginxGraphEdge = {from:string;line:number;to:string;resolved:string;targets:string[]};
export type NginxGraphWarning = {path:string;line?:number;reason:string};
export type NginxTopology = {root:string;files:NginxGraphFile[];directories:NginxGraphDirectory[];edges:NginxGraphEdge[];complete:boolean;warnings:NginxGraphWarning[];version:string};
import {open,lstat,realpath,readdir} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {parseNginxTree} from './nginx-syntax.ts';
import {nginxIncludeLinks,certbotNginxOptions} from './nginx-include-links.ts';
const hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
const permitted=(target:unknown)=>target===certbotNginxOptions||typeof target==='string'&&target.startsWith('/etc/nginx/')&&target.slice(11).split('/').every(part=>/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(part));
// Bounded structural inventory only; native nginx validation remains mandatory.
export async function nginxTopology(base='/etc/nginx',overrides:ReadonlyMap<string,string>=new Map(),sources:Map<string,string>|null=null,certbotDirectory='/etc/letsencrypt'):Promise<NginxTopology>{
 const files=new Map<string,NginxGraphFile>(),directories=new Map<string,NginxGraphDirectory>(),edges:NginxGraphEdge[]=[],warnings:NginxGraphWarning[]=[];let visits=0,total=0;
 const physical=(target:string)=>target===certbotNginxOptions?path.join(certbotDirectory,'options-ssl-nginx.conf'):path.join(base,target.slice(11));
 async function safe(location:string){let cursor=path.parse(path.resolve(location)).root;for(const part of path.dirname(path.resolve(location)).slice(cursor.length).split('/').filter(Boolean)){cursor=path.join(cursor,part);const stat=await lstat(cursor);if(!stat.isDirectory()||stat.isSymbolicLink())throw Error();}}
 async function visit(target:string,stack:string[]=[]){
  if(++visits>300||stack.length>=16||stack.includes(target)){warnings.push({path:target,reason:'include cycle or inspection limit'});return;}
  let nodes:NginxAstNode[];
  try{if(!permitted(target)||target===certbotNginxOptions&&overrides.has(target))throw Error();const external=target===certbotNginxOptions;const location=physical(target);await safe(location);const resolved=await realpath(location);if(external?resolved!==path.resolve(location):!resolved.startsWith(path.resolve(base)+'/'))throw Error();await safe(resolved);
   const handle=await open(resolved,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);let text;
   try{const stat=await handle.stat();if(!stat.isFile()||stat.uid!==process.getuid?.()||(stat.mode&0o022)||stat.nlink!==1||stat.size>262144)throw Error();const buffer=Buffer.alloc(262145),{bytesRead}=await handle.read(buffer,0,buffer.length,0);if(bytesRead>262144)throw Error();const canonical=external?certbotNginxOptions:'/etc/nginx/'+path.relative(base,resolved);if(overrides.has(target)&&overrides.has(canonical)&&overrides.get(target)!==overrides.get(canonical))throw Error();const override=overrides.has(target)?overrides.get(target):overrides.get(canonical);const bytes=override===undefined?buffer.subarray(0,bytesRead):Buffer.from(override);if(bytes.length>262144)throw Error();text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);if(text.includes('\0'))throw Error();const after=await lstat(resolved);if(after.ino!==stat.ino||after.dev!==stat.dev||after.size!==stat.size||after.mtimeMs!==stat.mtimeMs||await realpath(location)!==resolved)throw Error();const entry={path:target,resolved:canonical,version:hash(bytes),bytes:bytes.length,...(external?{readOnly:true}:{})};if(!files.has(target)){total+=bytes.length;if(files.size>=100||total>1048576)throw Error();}else if(files.get(target)?.version!==entry.version)throw Error();files.set(target,entry);nodes=parseNginxTree(text);if(sources instanceof Map)sources.set(target,text);}finally{await handle.close();}
  }catch{warnings.push({path:target,reason:'unsafe or unreadable nginx configuration'});return;}
  async function walk(list:NginxAstNode[]){for(const node of list){if(node.kind==='block'){await walk(node.children);continue;}if(!/^include\s/.test(node.label))continue;
   const match=/^include\s+(?:"([^"\\]+)"|'([^'\\]+)'|([^\s"'\\]+))$/.exec(node.label),destination=match&&(match[1]||match[2]||match[3]);let targets:string[]=[];
   try{const include=nginxIncludeLinks(node,[]);if(!include?.supported||typeof destination!=='string')throw Error();const resolved=include.pattern;if(resolved.includes('*')){const slash=resolved.lastIndexOf('/'),directory=resolved.slice(0,slash);if(!permitted(directory+'/placeholder'))throw Error();const location=physical(directory);await safe(location+'/placeholder');const stat=await lstat(location);if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==process.getuid?.()||(stat.mode&0o022))throw Error();const names=await readdir(location);if(names.length>1000)throw Error();const selected=nginxIncludeLinks(node,names.filter(name=>!name.startsWith('.')).map(name=>({path:directory+'/'+name})))!.files.map(file=>path.basename(file.path)).sort();if(selected.length>100||selected.some(name=>!permitted(directory+'/'+name)))throw Error();const entry={path:directory,pattern:resolved,version:hash(JSON.stringify(selected))};if(directories.has(resolved)&&directories.get(resolved)?.version!==entry.version)throw Error();directories.set(resolved,entry);targets=selected.map(name=>directory+'/'+name);}else{if(!permitted(resolved))throw Error();targets=[resolved];}
    edges.push({from:target,line:node.line,to:destination,resolved,targets});for(const included of targets)await visit(included,[...stack,target]);
   }catch{warnings.push({path:target,line:node.line,reason:'unsupported or unsafe include connection'});}
  }}await walk(nodes);
 }
 await visit('/etc/nginx/nginx.conf');
 for(const entry of directories.values()){
  try{const location=physical(entry.path);await safe(location+'/placeholder');const stat=await lstat(location);if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==process.getuid?.()||(stat.mode&0o022))throw Error();const names=await readdir(location);if(names.length>1000)throw Error();const selected=nginxIncludeLinks({kind:'directive',label:'include '+entry.pattern},names.filter(name=>!name.startsWith('.')).map(name=>({path:entry.path+'/'+name})))!.files.map(file=>path.basename(file.path)).sort();if(hash(JSON.stringify(selected))!==entry.version)throw Error();}
  catch{warnings.push({path:entry.path,reason:'include directory changed during inspection'});}
 }
 const graph={root:'/etc/nginx/nginx.conf',files:[...files.values()],directories:[...directories.values()],edges,complete:!warnings.length,warnings};return {...graph,version:hash(JSON.stringify(graph))};
}
export async function assertNginxGraphVersion(version:unknown,base='/etc/nginx',overrides:ReadonlyMap<string,string>=new Map(),certbotDirectory='/etc/letsencrypt'){
 if(typeof version!=='string'||!/^[a-f0-9]{64}$/.test(version))throw Object.assign(Error('Invalid nginx graph version'),{status:400});const graph=await nginxTopology(base,overrides,null,certbotDirectory);if(!graph.complete||graph.version!==version)throw Object.assign(Error('Nginx include graph changed or requires review'),{status:409});return graph;
}
