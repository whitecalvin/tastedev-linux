import {hasErrorCode} from './error-code.ts';
type HbaCandidateFile=Readonly<{relative:string;nativePath:string;sourcePath:string;text:string}>;
export type PostgresqlHbaCandidate=Readonly<{root:string;sourceRoot:string;graphVersion:string;files:readonly HbaCandidateFile[];directories:readonly string[];scope:string;operationalFilesChanged:false}>;
import {isPostgresqlWorkPath} from './postgresql-work-directory.ts';
import path from 'node:path';
import {open,lstat,mkdir} from 'node:fs/promises';import {constants} from 'node:fs';
import {assertPostgresqlHbaGraph} from './postgresql-hba-graph.ts';
const candidates=new WeakMap<object,PostgresqlHbaCandidate>();
const fail:()=>never=()=>{throw Error('PostgreSQL 접속 규칙 검수 복사본을 확인하세요.');};
// Only a registered, complete graph and its verified text can create a plan.
export function preparePostgresqlHbaCandidate(value:unknown,sources:Map<string,string>,root:unknown){
 const graph=assertPostgresqlHbaGraph(value,sources);if(typeof root!=='string'||!isPostgresqlWorkPath(root,'linux-pg-hba-'))fail();
 const aliases=new Map(graph.files.map((file,index)=>[file.path,file.path===graph.root?'pg_hba.conf':'files/f'+String(index).padStart(4,'0')+'.conf']));
 for(const [index,name] of graph.missing.entries())aliases.set(name,'missing/m'+String(index).padStart(4,'0')+'.conf');
 const dirs=new Map(graph.directories.map((dir,index)=>[dir.path,'directories/d'+String(index).padStart(4,'0')]));
 const native=(name:string)=>path.join(root,aliases.get(name)??dirs.get(name)??fail());
 function rewritten(name:string){const source=sources.get(name);if(typeof source!=='string')fail();const edges=graph.edges.filter(edge=>edge.from===name),includes=edges.filter(edge=>edge.kind!=='list');const replacements:{start:number;end:number;text:string}[]=[];
  for(const edge of includes){const original=source.slice(edge.start,edge.end),eols=original.match(/\r?\n/g)||[];replacements.push({start:edge.start,end:edge.end,text:edge.kind+' "'+native(edge.target)+'"'+eols.join('')});}
  const seen=new Set<string>();for(const edge of edges.filter(edge=>edge.kind==='list')){if(includes.some(include=>edge.start>=include.start&&edge.end<=include.end))continue;const key=edge.start+':'+edge.end;if(seen.has(key))continue;seen.add(key);const eols=source.slice(edge.start,edge.end).match(/\r?\n/g)||[];replacements.push({start:edge.start,end:edge.end,text:'@"'+native(edge.target)+'"'+eols.map(eol=>'\\'+eol).join('')});}
  replacements.sort((a,b)=>b.start-a.start);let text=source,last=source.length;for(const item of replacements){if(item.end>last||item.start<0||item.end>source.length)fail();text=text.slice(0,item.start)+item.text+text.slice(item.end);last=item.start;}if(Buffer.byteLength(text)>1048576)fail();return text;
 }
 const files=graph.files.map(file=>Object.freeze({relative:aliases.get(file.path)??fail(),nativePath:native(file.path),sourcePath:file.path,text:rewritten(file.path)}));
 for(const directory of graph.directories){for(const [index,name] of directory.names.entries()){const sourcePath=path.join(directory.path,name),relative=dirs.get(directory.path)+'/'+String(index).padStart(4,'0')+'.conf';if(!aliases.has(sourcePath))fail();files.push(Object.freeze({relative,nativePath:path.join(root,relative),sourcePath,text:rewritten(sourcePath)}));}}
 if(files.reduce((sum,file)=>sum+Buffer.byteLength(file.text),0)>4194304)fail();
 const plan:PostgresqlHbaCandidate=Object.freeze({root,sourceRoot:graph.root,graphVersion:graph.version,files:Object.freeze(files),directories:Object.freeze([...dirs.values()]),scope:'private-hba-copy',operationalFilesChanged:false});candidates.set(plan,plan);return plan;
}
export async function writePostgresqlHbaCandidate(value:unknown){
 if(!value||typeof value!=='object')fail();const plan=candidates.get(value);if(!plan)fail();const uid=process.getuid?.(),rootStat=await lstat(plan.root);if(!rootStat.isDirectory()||rootStat.isSymbolicLink()||rootStat.uid!==uid||(rootStat.mode&0o077))fail();
 const directory=async(relative:string)=>{let cursor=plan.root;for(const part of relative.split('/').filter(Boolean)){cursor=path.join(cursor,part);try{await mkdir(cursor,{mode:0o700});}catch(error){if(!hasErrorCode(error,'EEXIST'))throw error;}const stat=await lstat(cursor);if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==uid||(stat.mode&0o077))fail();}}
 for(const relative of plan.directories)await directory(relative);
 for(const file of plan.files){await directory(path.dirname(file.relative)==='.'?'':path.dirname(file.relative));const handle=await open(file.nativePath,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);try{await handle.writeFile(file.text);await handle.sync();}finally{await handle.close();}}
 return {root:plan.root,graphVersion:plan.graphVersion,files:plan.files.map(({nativePath,sourcePath})=>({nativePath,sourcePath})),scope:plan.scope};
}
