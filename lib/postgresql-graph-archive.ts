import type {Stats} from 'node:fs';
import type {PostgresqlConfigGraph} from './postgresql-config-graph.ts';
import {hasErrorCode} from './error-code.ts';
export type PostgresqlGraphArchive={format:'postgresql-config-graph-v1';id:string;target:string;createdAt:string;graph:PostgresqlConfigGraph;sources:{path:string;text:string;attributes:{uid:number;gid:number;mode:number}}[]};
export type PostgresqlGraphArchiveReference={id:string;version:string;bytes:number;graphVersion:string};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import path from 'node:path';
import {open,mkdir,lstat,unlink} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {postgresqlConfigRoot,postgresqlConfigSources,postgresqlConfigFileAttributes,assertPostgresqlConfigGraph} from './postgresql-config-graph.ts';
const verified=new WeakMap<object,{record:PostgresqlGraphArchive;proof:string}>();
const MAX=16000000,hash=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex');
const fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 설정 묶음 백업을 확인하세요.'),{status:409});};
const uuid=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(value);
const hex=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const same=(a:Stats,b:Stats)=>(['dev','ino','uid','gid','mode','nlink','size','mtimeMs','ctimeMs'] as const).every(key=>a[key]===b[key]);
async function directory(root:string,create=false){
 if(typeof root!=='string'||!path.isAbsolute(root)||path.normalize(root)!==root)fail();let parent='/';
 for(const part of root.split('/').filter(Boolean)){parent=path.join(parent,part);const stat=await lstat(parent);if(!stat.isDirectory()||stat.isSymbolicLink()||![0,process.getuid?.()].includes(stat.uid)||(stat.mode&0o022)&&!(stat.uid===0&&(stat.mode&0o1000)))fail();}
 const base=await lstat(root);if(base.uid!==process.getuid?.()||(base.mode&0o077))fail();
 const dir=path.join(root,'graphs');if(create)await mkdir(dir,{mode:0o700}).catch(error=>{if(!hasErrorCode(error,'EEXIST'))throw error;});
 const stat=await lstat(dir);if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==process.getuid?.()||(stat.mode&0o777)!==0o700)fail();return {dir,stat};
}
function archiveSchema(record:unknown,target:string):record is PostgresqlGraphArchive{
 const cluster=postgresqlConfigRoot(target);if(!object(record)||!object(record.graph))fail();const graph=record.graph;
 if(record.format!=='postgresql-config-graph-v1'||record.target!==target||!uuid(record.id)||typeof record.createdAt!=='string'||!Number.isFinite(Date.parse(record.createdAt))||graph.root!==target||graph.cluster!==cluster||graph.complete!==true||graph.scope!=='cluster-config-includes'||graph.operationalResourcesVerified!==false||!hex(graph.version)||!Array.isArray(graph.files)||graph.files.length<1||graph.files.length>100||!Array.isArray(record.sources)||record.sources.length!==graph.files.length||!Array.isArray(graph.directories)||!Array.isArray(graph.edges)||graph.edges.length>300||!Array.isArray(graph.missing))fail();
 const allowed=(name:unknown):name is string=>typeof name==='string'&&name.startsWith(cluster+'/')&&path.normalize(name)===name&&!/[\x00-\x1f\x7f]/.test(name);
 let total=0,previous:string|undefined;const names=new Set<string>();const files:unknown[]=graph.files,sources:unknown[]=record.sources;
 for(let i=0;i<files.length;i++){
  const file=files[i],source=sources[i];if(!object(file)||!object(source)||!object(source.attributes))fail();const attributes=source.attributes;
  if(!allowed(file.path)||names.has(file.path)||previous!==undefined&&Buffer.compare(Buffer.from(previous),Buffer.from(file.path))>=0||source.path!==file.path||typeof source.text!=='string'||source.text.includes('\0')||!(['uid','gid','mode'] as const).every(key=>typeof attributes[key]==='number'&&Number.isSafeInteger(attributes[key])&&attributes[key]>=0)||typeof attributes.uid!=='number'||attributes.uid>2147483647||typeof attributes.gid!=='number'||attributes.gid>2147483647||typeof attributes.mode!=='number'||attributes.mode>0o777||(attributes.mode&0o022)||Buffer.byteLength(source.text)>262144||typeof file.bytes!=='number'||file.bytes!==Buffer.byteLength(source.text)||file.version!==hash(source.text)||(total+=file.bytes)>1048576)fail();names.add(file.path);previous=file.path;
 }
 if(!names.has(target)||graph.directories.length>100||graph.missing.length>300)fail();
 for(const value of graph.directories){const item:unknown=value;if(!object(item)||!allowed(item.path)||!Array.isArray(item.names)||item.names.length>100||!item.names.every((name:unknown)=>typeof name==='string'&&!name.startsWith('.')&&name.endsWith('.conf')&&!name.includes('/')&&!/[\x00-\x1f\x7f]/.test(name))||item.version!==hash(JSON.stringify(item.names)))fail();}
 if(!graph.missing.every(allowed))fail();
 for(const value of graph.edges){const edge:unknown=value;if(!object(edge)||typeof edge.from!=='string'||!names.has(edge.from)||!allowed(edge.target)||typeof edge.kind!=='string'||!['include','include_if_exists','include_dir'].includes(edge.kind)||typeof edge.line!=='number'||!Number.isSafeInteger(edge.line)||edge.line<1||!Array.isArray(edge.targets)||!edge.targets.every(allowed))fail();}
 const version=hash(JSON.stringify({files:graph.files,directories:graph.directories,edges:graph.edges,missing:graph.missing}));if(version!==graph.version)fail();return true;
}
function validate(record:unknown,target:string){if(!archiveSchema(record,target))fail();return record;}
export async function createPostgresqlGraphArchive(value:unknown,backupRoot:string){
 const graph=await assertPostgresqlConfigGraph(value);const sources=postgresqlConfigSources(graph),attributes=postgresqlConfigFileAttributes(graph),record=validate({format:'postgresql-config-graph-v1',id:randomUUID(),target:graph.root,createdAt:new Date().toISOString(),graph,sources:graph.files.map(file=>({path:file.path,text:sources.get(file.path),attributes:attributes.get(file.path)}))},graph.root);
 const bytes=Buffer.from(JSON.stringify(record));if(bytes.length>MAX)fail();const {dir,stat:parent}=await directory(backupRoot,true),file=path.join(dir,record.id+'.json'),fd=await open(file,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);let allocated:Stats|undefined,complete=false;
 try{allocated=await fd.stat();await fd.writeFile(bytes);await fd.sync();await assertPostgresqlConfigGraph(graph);const current=await directory(backupRoot);if(current.stat.dev!==parent.dev||current.stat.ino!==parent.ino)fail();const named=await lstat(file),after=await fd.stat();if(!same(named,after)||named.dev!==allocated.dev||named.ino!==allocated.ino||named.uid!==process.getuid?.()||named.nlink!==1||(named.mode&0o777)!==0o600||named.size!==bytes.length)fail();const folder=await open(dir,constants.O_RDONLY);try{await folder.sync();}finally{await folder.close();}complete=true;return {id:record.id,version:hash(bytes),bytes:bytes.length,graphVersion:graph.version};}
 finally{await fd.close();if(!complete&&allocated){const named=await lstat(file).catch(()=>null);if(named?.dev===allocated.dev&&named?.ino===allocated.ino)await unlink(file);}}
}
// Internal reader: references come from a trusted private backup, never a client path.
export async function readPostgresqlGraphArchive(reference:unknown,backupRoot:string,target:unknown){
 if(!object(reference)||Object.keys(reference).some(key=>!['id','version','bytes','graphVersion'].includes(key))||!uuid(reference.id)||!hex(reference.version)||!hex(reference.graphVersion)||typeof reference.bytes!=='number'||!Number.isSafeInteger(reference.bytes)||reference.bytes<1||reference.bytes>MAX)fail();
 postgresqlConfigRoot(target);if(typeof target!=='string')fail();const {dir,stat:parent}=await directory(backupRoot),file=path.join(dir,reference.id+'.json'),fd=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{const before=await fd.stat(),safe=(stat:Stats)=>stat.isFile()&&stat.nlink===1&&stat.uid===process.getuid?.()&&(stat.mode&0o777)===0o600&&stat.size===reference.bytes;if(!safe(before))fail();const bytes=Buffer.alloc(reference.bytes+1);let size=0;while(size<bytes.length){const result=await fd.read(bytes,size,bytes.length-size,null);if(!result.bytesRead)break;size+=result.bytesRead;}const after=await fd.stat(),named=await lstat(file),current=await directory(backupRoot);if(size!==reference.bytes||hash(bytes.subarray(0,size))!==reference.version||!safe(after)||!safe(named)||!same(before,after)||!same(before,named)||current.stat.dev!==parent.dev||current.stat.ino!==parent.ino)fail();let raw:unknown;try{raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,size)));}catch{fail();}const record=validate(raw,target);if(record.id!==reference.id||record.graph.version!==reference.graphVersion)fail();verified.set(record,{record,proof:hash(JSON.stringify(record))});return record;
 }finally{await fd.close();}
}

export function assertPostgresqlGraphArchive(value:unknown){if(!object(value))fail();const registered=verified.get(value);if(!registered||registered.proof!==hash(JSON.stringify(value)))fail();return registered.record;}
