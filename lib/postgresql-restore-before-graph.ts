export type BeforeGraphRequest={kind:'file'|'directory';path:string};
type IncludeKind='include'|'include_if_exists'|'include_dir';
type Origin={path:string;line:number;kind:IncludeKind};
type BeforeFile={path:string;version:string;bytes:number};
type BeforeDirectory={path:string;present:boolean;names:string[];version:string};
type BeforeEdge={from:string;line:number;kind:IncludeKind;target:string;targets:string[]};
export type PostgresqlBeforeGraph={root:string;cluster:string;files:BeforeFile[];directories:BeforeDirectory[];edges:BeforeEdge[];missing:string[];requiredMissing:{path:string;kind:'file'|'directory'}[];issues:(Origin&{reason:string})[];complete:boolean;version:string;scope:'before-cluster-config-includes';operationalResourcesVerified:false};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const includeKind=(value:unknown):value is IncludeKind=>value==='include'||value==='include_if_exists'||value==='include_dir';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {parsePostgresqlSettings} from './postgresql-settings-text.ts';
import {postgresqlConfigRoot} from './postgresql-config-graph.ts';

const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
const fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 여러 파일 복원 기록을 확인하세요.'),{status:409});};
function* discover(value:unknown):Generator<BeforeGraphRequest,PostgresqlBeforeGraph,unknown>{
 if(typeof value!=='string')fail();const target=value;
 const cluster=postgresqlConfigRoot(target),files=new Map<string,BeforeFile>(),directories=new Map<string,BeforeDirectory>(),edges:BeforeEdge[]=[],missing=new Set<string>(),required=new Map<string,{path:string;kind:'file'|'directory'}>(),issues:(Origin&{reason:string})[]=[];let visits=0,bytes=0;
 const permitted=(name:unknown):name is string=>typeof name==='string'&&name.startsWith(cluster+'/')&&path.normalize(name)===name&&!/[\x00-\x1f\x7f]/.test(name);
 const problem=(origin:Origin,reason:string)=>{if(issues.length>=300)fail();issues.push({...origin,reason});};
 function* visit(name:string,stack:string[]=[],optional=false,origin:Origin={path:target,line:1,kind:'include'}):Generator<BeforeGraphRequest,void,unknown>{
  if(++visits>300)fail();if(stack.includes(name)){problem(origin,'cycle');return;}if(stack.length>=16){problem(origin,'depth');return;}
  const source=yield {kind:'file',path:name};if(!object(source)||typeof source.present!=='boolean')fail();
  if(!source.present){missing.add(name);if(!optional)required.set('file:'+name,{path:name,kind:'file'});return;}
  if(typeof source.text!=='string'||typeof source.version!=='string'||source.version!==hash(source.text)||Buffer.byteLength(source.text)>262144||source.text.includes('\0'))fail();
  if(!files.has(name)){if(files.size>=100||(bytes+=Buffer.byteLength(source.text))>1048576)fail();files.set(name,{path:name,version:source.version,bytes:Buffer.byteLength(source.text)});}else if(files.get(name)?.version!==source.version)fail();
  for(const row of parsePostgresqlSettings(source.text)){
   const kind=row.name?.toLowerCase();if(!row.enabled||!includeKind(kind))continue;const origin={path:name,line:row.line,kind};
   if(!row.valid||typeof row.value!=='string'||row.value[0]!=="'"||row.value.at(-1)!=="'"||row.value.includes('\\')){problem(origin,'invalid-include');continue;}
   const value=row.value.slice(1,-1).replaceAll("''","'");if(!value||/[\x00-\x1f\x7f]/.test(value)){problem(origin,'invalid-include');continue;}
   const destination=path.isAbsolute(value)?value:path.resolve(path.dirname(name),value);if(!permitted(destination)){problem(origin,'outside-scope');continue;}
   if(edges.length>=300)fail();const edge:BeforeEdge={from:name,line:row.line,kind,target:destination,targets:[]};edges.push(edge);
   if(kind!=='include_dir'){edge.targets.push(destination);yield* visit(destination,[...stack,name],kind==='include_if_exists',origin);continue;}
   const directory=yield {kind:'directory',path:destination};if(!object(directory)||typeof directory.present!=='boolean'||!Array.isArray(directory.names)||directory.names.length>100)fail();
   const names:unknown[]=directory.names;if(!names.every((name):name is string=>typeof name==='string'&&!name.startsWith('.')&&name.endsWith('.conf')&&!name.includes('/')&&!/[\x00-\x1f\x7f]/.test(name))||!directory.present&&names.length)fail();
   if(names.some((name,index)=>index>0&&Buffer.compare(Buffer.from(names[index-1]),Buffer.from(name))>=0))fail();
   const item={path:destination,present:directory.present,names:[...names],version:hash(JSON.stringify(names))};if(directories.has(destination)&&JSON.stringify(directories.get(destination))!==JSON.stringify(item))fail();directories.set(destination,item);if(directories.size>100)fail();if(!directory.present)required.set('directory:'+destination,{path:destination,kind:'directory'});
   for(const leaf of names){const child=path.join(destination,leaf);edge.targets.push(child);yield* visit(child,[...stack,name],false,origin);}
  }
 }
 yield* visit(target);
 const ordered=<T extends {path:string}>(values:Iterable<T>):T[]=>[...values].sort((a,b)=>Buffer.compare(Buffer.from(a.path),Buffer.from(b.path))),data={root:target,cluster,files:ordered(files.values()),directories:[...directories.values()],edges,missing:[...missing].sort(),requiredMissing:ordered(required.values()),issues};
 return {...data,complete:data.requiredMissing.length===0&&issues.length===0,version:hash(JSON.stringify(data)),scope:'before-cluster-config-includes' as const,operationalResourcesVerified:false as const};
}
export async function capturePostgresqlBeforeGraph(target:unknown,respond:(request:BeforeGraphRequest)=>unknown|Promise<unknown>){const iterator=discover(target);let result=iterator.next();while(!result.done)result=iterator.next(await respond(result.value));return result.value;}
function pairs(value:unknown):Map<string,unknown>{
 if(!Array.isArray(value))fail();const result=new Map<string,unknown>();for(const item of value){const pair:unknown=item;if(!Array.isArray(pair)||pair.length!==2||typeof pair[0]!=='string')fail();result.set(pair[0],pair[1]);}return result;
}
function identicalGraph(value:unknown,expected:PostgresqlBeforeGraph):value is PostgresqlBeforeGraph{return object(value)&&JSON.stringify(value)===JSON.stringify(expected);}
export function validatePostgresqlBeforeGraph(graph:unknown,body:unknown):PostgresqlBeforeGraph{
 if(!object(body)||!Array.isArray(body.files))fail();const files=new Map<string,unknown>();for(const item of body.files){const row:unknown=item;if(!object(row)||typeof row.path!=='string')fail();files.set(row.path,row.before);}
 const directories=pairs(body.directories),memberships=pairs(body.memberships),iterator=discover(body.target);let result=iterator.next();
 while(!result.done){const request=result.value;let answer:unknown;if(request.kind==='file'){if(!files.has(request.path))fail();answer=files.get(request.path);}else{if(!directories.has(request.path)||!memberships.has(request.path))fail();answer={present:directories.get(request.path)!==null,names:memberships.get(request.path)};}result=iterator.next(answer);}
 if(!identicalGraph(graph,result.value))fail();return graph;
}
