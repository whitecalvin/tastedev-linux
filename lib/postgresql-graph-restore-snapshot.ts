import type {Stats} from 'node:fs';
import type {PostgresqlGraphArchive} from './postgresql-graph-archive.ts';
import type {PostgresqlBeforeGraph} from './postgresql-restore-before-graph.ts';
import {hasErrorCode} from './error-code.ts';
export type RestoreFileIdentity=Pick<Stats,'dev'|'ino'|'uid'|'gid'|'mode'|'nlink'|'size'|'mtimeMs'|'ctimeMs'>;
export type RestoreFileAttributes={uid:number;gid:number;mode:number};
export type RestoreDirectoryIdentity=RestoreFileAttributes&{dev:number;ino:number};
type MissingSource={path:string;present:false};
type SourceContent={path:string;present:true;version:string;text:string;attributes:RestoreFileAttributes};
export type RestoreBeforeSource=MissingSource|(SourceContent&{identity:RestoreFileIdentity});
export type RestoreAfterSource=MissingSource|SourceContent;
export type RestoreFileRow={path:string;before:RestoreBeforeSource;after:RestoreAfterSource};
export type RestoreSnapshot={path:string;archiveId:string;archiveGraphVersion:string;version:string;beforeGraphVersion:string;beforeGraphComplete:boolean;files:{path:string;action:'unchanged'|'remove'|'create'|'update';beforeVersion:string|null;afterVersion:string|null}[];directories:{path:string;present:boolean;beforeNames:string[];afterNames:string[]}[];operatingConfigurationChanged:false;operatingServiceChanged:false};
export type RestoreSnapshotContext={target:string;base:string;ownerUid:number;archiveId:string;archiveGraphVersion:string;snapshotVersion:string;baseIdentity:RestoreDirectoryIdentity;directories:[string,RestoreDirectoryIdentity|null][];memberships:[string,string[]][];files:RestoreFileRow[];beforeGraph:PostgresqlBeforeGraph};
type SnapshotOptions={base?:string;ownerUid?:number};
type SnapshotRecord={snapshot:RestoreSnapshot;proof:string;archive:PostgresqlGraphArchive;options:{base:string;ownerUid:number};rows:RestoreFileRow[];directoryRows:[string,RestoreDirectoryIdentity|null][];membershipRows:[string,string[]][];observedBase:RestoreDirectoryIdentity;beforeGraph:PostgresqlBeforeGraph};
const object=(value:unknown):value is object=>value!==null&&typeof value==='object';
import path from 'node:path';
import {open,lstat,readdir} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash} from 'node:crypto';
import {capturePostgresqlBeforeGraph} from './postgresql-restore-before-graph.ts';
import {assertPostgresqlGraphArchive} from './postgresql-graph-archive.ts';
const records=new WeakMap<object,SnapshotRecord>(),hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
const fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 묶음 복원 검토 대상이 변경되었습니다.'),{status:409});};
const fileIdentity=(stat:Stats):RestoreFileIdentity=>({dev:stat.dev,ino:stat.ino,uid:stat.uid,gid:stat.gid,mode:stat.mode,nlink:stat.nlink,size:stat.size,mtimeMs:stat.mtimeMs,ctimeMs:stat.ctimeMs});
const attributes=(stat:Stats):RestoreFileAttributes=>({uid:stat.uid,gid:stat.gid,mode:stat.mode&0o777});
const directoryIdentity=(stat:Stats):RestoreDirectoryIdentity=>({dev:stat.dev,ino:stat.ino,...attributes(stat)});
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
export async function postgresqlGraphRestoreSnapshot(value:unknown,{base='/etc',ownerUid=process.getuid?.()}:SnapshotOptions={}):Promise<RestoreSnapshot>{
 const archive=assertPostgresqlGraphArchive(value);if(typeof base!=='string'||!path.isAbsolute(base)||path.normalize(base)!==base||typeof ownerUid!=='number'||!Number.isSafeInteger(ownerUid)||ownerUid<0)fail();
 const root=archive.graph.cluster,owners=[0,ownerUid],directories=new Map<string,RestoreDirectoryIdentity|null>(),memberships=new Map<string,string[]>(),files=new Map<string,RestoreFileRow>();
 const permitted=(name:unknown):name is string=>typeof name==='string'&&(name===root||name.startsWith(root+'/'))&&path.normalize(name)===name&&!/[\x00-\x1f\x7f]/.test(name);
 const physical=(name:unknown)=>{if(!permitted(name))fail();return path.join(base,name.slice(5));};
 const trustedDirectory=(stat:Stats)=>stat.isDirectory()&&!stat.isSymbolicLink()&&owners.includes(stat.uid)&&!(stat.mode&0o022);
 let parent='/';for(const part of base.split('/').filter(Boolean)){parent=path.join(parent,part);const stat=await lstat(parent);if(!stat.isDirectory()||stat.isSymbolicLink()||![0,process.getuid?.(),ownerUid].includes(stat.uid)||(stat.mode&0o022)&&!(stat.uid===0&&(stat.mode&0o1000)))fail();}
 const baseStat=await lstat(base);if(!trustedDirectory(baseStat))fail();const observedBase=directoryIdentity(baseStat);
 async function parents(name:string,include=false){physical(name);const parts=name.slice(5).split('/'),end=include?parts.length:parts.length-1;let logical='/etc',missing=false;
  for(let index=0;index<end;index++){logical+='/'+parts[index];const file=path.join(base,logical.slice(5));let stat;try{stat=await lstat(file);}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;missing=true;}
   if(stat){if(missing||!trustedDirectory(stat))fail();}const entry=stat?directoryIdentity(stat):null;if(directories.has(logical)&&!same(directories.get(logical),entry))fail();directories.set(logical,entry);
  }
 }
 async function read(name:string):Promise<RestoreBeforeSource>{await parents(name);const file=physical(name);let before;try{before=await lstat(file);}catch(error){if(hasErrorCode(error,'ENOENT'))return {path:name,present:false};throw error;}
  const safe=(stat:Stats)=>stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1&&owners.includes(stat.uid)&&!(stat.mode&0o022)&&stat.size<=262144;
  if(!safe(before))fail();const fd=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
  try{const first=await fd.stat();if(!safe(first)||!same(fileIdentity(before),fileIdentity(first)))fail();const bytes=Buffer.alloc(262145);let size=0;while(size<bytes.length){const result=await fd.read(bytes,size,bytes.length-size,null);if(!result.bytesRead)break;size+=result.bytesRead;}const after=await fd.stat(),named=await lstat(file);if(size>262144||!safe(after)||!safe(named)||!same(fileIdentity(first),fileIdentity(after))||!same(fileIdentity(first),fileIdentity(named)))fail();let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,size));}catch{fail();}if(text.includes('\0'))fail();return {path:name,present:true,version:hash(bytes.subarray(0,size)),text,attributes:attributes(first),identity:fileIdentity(first)};
  }finally{await fd.close();}
 }
 for(const source of archive.sources){if(!owners.includes(source.attributes.uid))fail();const before=await read(source.path),after:RestoreAfterSource={path:source.path,present:true,version:hash(source.text),text:source.text,attributes:{...source.attributes}};files.set(source.path,{path:source.path,before,after});}
 async function readDirectory(name:string){await parents(name,true);const file=physical(name),known=directories.get(name),names:string[]=[];if(known===undefined)fail();
  if(known){for(const entry of await readdir(file,{withFileTypes:true})){if(entry.name.startsWith('.')||!entry.name.endsWith('.conf')||entry.isDirectory())continue;if(entry.isSymbolicLink()||!entry.isFile())fail();names.push(entry.name);if(names.length>100)fail();}names.sort((a,b)=>Buffer.compare(Buffer.from(a),Buffer.from(b)));const after=await lstat(file);if(!trustedDirectory(after)||!same(known,directoryIdentity(after)))fail();}
  if(memberships.has(name)&&!same(memberships.get(name),names))fail();memberships.set(name,names);return {present:known!==null,names};
 }
 for(const dir of archive.graph.directories){const {names}=await readDirectory(dir.path);
  for(const name of names){const logical=path.join(dir.path,name);if(!dir.names.includes(name)&&!files.has(logical)){const before=await read(logical);files.set(logical,{path:logical,before,after:{path:logical,present:false}});}}
 }
 for(const name of archive.graph.missing){const before=await read(name);if(files.has(name))fail();files.set(name,{path:name,before,after:{path:name,present:false}});}
 const beforeGraph=await capturePostgresqlBeforeGraph(archive.target,async request=>{if(request.kind==='directory')return readDirectory(request.path);const known=files.get(request.path);if(known)return known.before;const before=await read(request.path),after:RestoreAfterSource=before.present?{path:request.path,present:true,version:before.version,text:before.text,attributes:{...before.attributes}}:{path:request.path,present:false};files.set(request.path,{path:request.path,before,after});return before;});
 if(files.size>300)fail();let total=0;for(const row of files.values())if(row.before.present&&(total+=Buffer.byteLength(row.before.text))>2097152)fail();
 for(const row of files.values())if(!same(row.before,await read(row.path)))fail();
 for(const [name,expected] of directories){let stat;try{stat=await lstat(path.join(base,name.slice(5)));}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}if(!same(expected,stat?directoryIdentity(stat):null)||stat&&!trustedDirectory(stat))fail();}
 for(const [name,expected] of memberships){const names:string[]=[];if(directories.get(name)){for(const entry of await readdir(physical(name),{withFileTypes:true})){if(entry.name.startsWith('.')||!entry.name.endsWith('.conf')||entry.isDirectory())continue;if(entry.isSymbolicLink()||!entry.isFile())fail();names.push(entry.name);}names.sort((a,b)=>Buffer.compare(Buffer.from(a),Buffer.from(b)));}if(!same(expected,names))fail();}
 if(!same(observedBase,directoryIdentity(await lstat(base))))fail();
 assertPostgresqlGraphArchive(archive);
 const rows=[...files.values()].sort((a,b)=>Buffer.compare(Buffer.from(a.path),Buffer.from(b.path))),directoryRows=[...directories].sort(([a],[b])=>Buffer.compare(Buffer.from(a),Buffer.from(b))),membershipRows=[...memberships].sort(([a],[b])=>Buffer.compare(Buffer.from(a),Buffer.from(b)));
 const version=hash(JSON.stringify([archive.id,archive.graph.version,observedBase,directoryRows,membershipRows,rows,beforeGraph]));
 const recordedMembers=(name:string)=>{const values=memberships.get(name);if(!values)fail();return values;};
 const result:RestoreSnapshot={path:archive.target,archiveId:archive.id,archiveGraphVersion:archive.graph.version,version,beforeGraphVersion:beforeGraph.version,beforeGraphComplete:beforeGraph.complete,files:rows.map(row=>({path:row.path,action:!row.before.present&&!row.after.present?'unchanged':!row.after.present?'remove':!row.before.present?'create':row.before.version!==row.after.version||!same(row.before.attributes,row.after.attributes)?'update':'unchanged',beforeVersion:row.before.present?row.before.version:null,afterVersion:row.after.present?row.after.version:null})),directories:archive.graph.directories.map(dir=>({path:dir.path,present:directories.get(dir.path)!==null,beforeNames:[...recordedMembers(dir.path)],afterNames:[...dir.names]})),operatingConfigurationChanged:false,operatingServiceChanged:false};
 records.set(result,{snapshot:result,proof:hash(JSON.stringify(result)),archive,options:{base,ownerUid},rows,directoryRows,membershipRows,observedBase,beforeGraph});return result;
}
function registered(snapshot:unknown):SnapshotRecord{if(!object(snapshot))fail();const record=records.get(snapshot);if(!record||record.proof!==hash(JSON.stringify(snapshot)))fail();assertPostgresqlGraphArchive(record.archive);return record;}
export function postgresqlGraphRestoreFiles(snapshot:unknown){return structuredClone(registered(snapshot).rows);}
export async function assertPostgresqlGraphRestoreSnapshot(value:unknown){const record=registered(value),current=await postgresqlGraphRestoreSnapshot(record.archive,record.options);if(current.version!==record.snapshot.version)fail();return record.snapshot;}
export function postgresqlGraphRestoreContext(snapshot:unknown):RestoreSnapshotContext{const record=registered(snapshot),value=record.snapshot;return structuredClone({target:value.path,base:record.options.base,ownerUid:record.options.ownerUid,archiveId:value.archiveId,archiveGraphVersion:value.archiveGraphVersion,snapshotVersion:value.version,baseIdentity:record.observedBase,directories:record.directoryRows,memberships:record.membershipRows,files:record.rows,beforeGraph:record.beforeGraph});}
