import type {Stats} from 'node:fs';
import type {FileHandle} from 'node:fs/promises';
import type {RestoreSnapshotContext,RestoreFileIdentity,RestoreFileAttributes,RestoreDirectoryIdentity,RestoreBeforeSource,RestoreAfterSource} from './postgresql-graph-restore-snapshot.ts';
import type {PostgresqlBeforeGraph} from './postgresql-restore-before-graph.ts';
import type {PostgresqlRestoreServiceContext} from './postgresql-restore-service-context.ts';
import {hasErrorCode} from './error-code.ts';
export type RestoreJournalBody=Omit<RestoreSnapshotContext,'beforeGraph'>&{beforeGraph?:PostgresqlBeforeGraph;serviceContext?:PostgresqlRestoreServiceContext};
export type RestoreJournalRecord={format:'postgresql-graph-restore-intent-v1'|'postgresql-graph-restore-intent-v2'|'postgresql-graph-restore-intent-v3';id:string;createdAt:string;body:RestoreJournalBody;digest:string};
export type RestoreJournal={record:RestoreJournalRecord;identity:RestoreFileIdentity;version:string};
type TrustedOptions={base:string;ownerUid:number};
type JournalOptions={base?:string;ownerUid?:number};
type Registration={journal:RestoreJournal;proof:string;target:string;backupRoot:string;opts:TrustedOptions;completedId?:string};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {assertPostgresqlRestoreServiceContext} from './postgresql-restore-service-context.ts';
import {postgresqlGraphSwapProgressContext,assertPostgresqlGraphSwapProgress} from './postgresql-graph-swap-progress.ts';
import path from 'node:path';
import {mkdir,lstat,open,link,unlink,opendir,rename} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {validatePostgresqlBeforeGraph} from './postgresql-restore-before-graph.ts';
import {postgresqlConfigRoot} from './postgresql-config-graph.ts';
import {postgresqlGraphRestoreContext,assertPostgresqlGraphRestoreSnapshot} from './postgresql-graph-restore-snapshot.ts';
const MAX=32000000,verified=new WeakMap<object,Registration>(),hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
const fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 여러 파일 복원 기록을 확인하세요.'),{status:409});};
const uuid=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(value),hex=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const identity=(stat:Stats):RestoreFileIdentity=>({dev:stat.dev,ino:stat.ino,uid:stat.uid,gid:stat.gid,mode:stat.mode,nlink:stat.nlink,size:stat.size,mtimeMs:stat.mtimeMs,ctimeMs:stat.ctimeMs});
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b),keys=(value:unknown,allowed:readonly string[]):value is Record<string,unknown>=>object(value)&&Object.keys(value).every(key=>allowed.includes(key));
const integer=(value:unknown):value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0;
function attrs(value:unknown):value is RestoreFileAttributes{return keys(value,['uid','gid','mode'])&&integer(value.uid)&&integer(value.gid)&&integer(value.mode)&&value.mode<=0o777&&!(value.mode&0o022);}
function directoryState(value:unknown):value is RestoreDirectoryIdentity{return keys(value,['dev','ino','uid','gid','mode'])&&integer(value.dev)&&integer(value.ino)&&attrs({uid:value.uid,gid:value.gid,mode:value.mode});}
function fileState(state:unknown,kind:'before'|'after',name:string,ownerUid:number):state is RestoreBeforeSource|RestoreAfterSource{
 if(!keys(state,kind==='before'?['path','present','version','text','attributes','identity']:['path','present','version','text','attributes'])||state.path!==name||typeof state.present!=='boolean')fail();if(!state.present){if(Object.keys(state).length!==2)fail();return true;}
 if(typeof state.text!=='string'||state.text.includes('\0')||Buffer.byteLength(state.text)>262144||state.version!==hash(state.text)||!attrs(state.attributes)||![0,ownerUid].includes(state.attributes.uid))fail();
 if(kind==='before'){const value=state.identity;if(!keys(value,['dev','ino','uid','gid','mode','nlink','size','mtimeMs','ctimeMs'])||!['dev','ino','uid','gid','mode','size'].every(key=>integer(value[key]))||!integer(value.mode)||!integer(value.size)||value.nlink!==1||(value.mode&0o170000)!==0o100000||value.size!==Buffer.byteLength(state.text)||value.uid!==state.attributes.uid||value.gid!==state.attributes.gid||(value.mode&0o777)!==state.attributes.mode||typeof value.mtimeMs!=='number'||!Number.isFinite(value.mtimeMs)||typeof value.ctimeMs!=='number'||!Number.isFinite(value.ctimeMs))fail();}return true;
}
function validRecord(record:unknown,target:string,{base,ownerUid}:TrustedOptions):record is RestoreJournalRecord{
 const cluster=postgresqlConfigRoot(target);if(!keys(record,['format','id','createdAt','body','digest'])||!keys(record.body,['target','base','ownerUid','archiveId','archiveGraphVersion','snapshotVersion','baseIdentity','directories','memberships','files','beforeGraph','serviceContext']))fail();const body=record.body;
 if(typeof record.format!=='string'||!['postgresql-graph-restore-intent-v1','postgresql-graph-restore-intent-v2','postgresql-graph-restore-intent-v3'].includes(record.format)||!uuid(record.id)||typeof record.createdAt!=='string'||!Number.isFinite(Date.parse(record.createdAt))||!hex(record.digest)||record.digest!==hash(JSON.stringify(body))||body.target!==target||body.base!==base||body.ownerUid!==ownerUid||!uuid(body.archiveId)||!hex(body.archiveGraphVersion)||!hex(body.snapshotVersion)||!directoryState(body.baseIdentity)||![0,ownerUid].includes(body.baseIdentity.uid)||!Array.isArray(body.files)||body.files.length<1||body.files.length>300||!Array.isArray(body.directories)||body.directories.length>1000||!Array.isArray(body.memberships)||body.memberships.length>100)fail();
 const permitted=(name:unknown):name is string=>typeof name==='string'&&name.startsWith(cluster+'/')&&path.normalize(name)===name&&!/[\x00-\x1f\x7f]/.test(name),parent=(name:unknown):name is string=>typeof name==='string'&&(name===cluster||Boolean(permitted(name))||cluster.startsWith(name+'/')&&name.startsWith('/etc/postgresql'))&&path.normalize(name)===name&&!/[\x00-\x1f\x7f]/.test(name);
 let beforeBytes=0,afterBytes=0,mainAfter=false;const names=new Set<string>();
 for(const value of body.files){const row:unknown=value;if(!keys(row,['path','before','after'])||!permitted(row.path)||names.has(row.path))fail();names.add(row.path);for(const [kind,state] of [['before',row.before],['after',row.after]] as const){if(!fileState(state,kind,row.path,ownerUid))fail();if(state.present){if(kind==='before')beforeBytes+=Buffer.byteLength(state.text);else{afterBytes+=Buffer.byteLength(state.text);if(row.path===target)mainAfter=true;}}}}
 if(!names.has(target)||!mainAfter||beforeBytes>2097152||afterBytes>1048576)fail();
 let previousDirectory:string|undefined;
 for(const value of body.directories){const row:unknown=value;if(!Array.isArray(row)||row.length!==2||!parent(row[0])||row[1]!==null&&(!directoryState(row[1])||![0,ownerUid].includes(row[1].uid))||previousDirectory!==undefined&&Buffer.compare(Buffer.from(previousDirectory),Buffer.from(row[0]))>=0)fail();previousDirectory=row[0];}
 let previousMembership:string|undefined;
 for(const value of body.memberships){const row:unknown=value;if(!Array.isArray(row)||row.length!==2||!permitted(row[0])||!Array.isArray(row[1])||row[1].length>100||previousMembership!==undefined&&Buffer.compare(Buffer.from(previousMembership),Buffer.from(row[0]))>=0)fail();const members:unknown[]=row[1];if(!members.every((name):name is string=>typeof name==='string'&&!name.startsWith('.')&&name.endsWith('.conf')&&!name.includes('/')&&!/[\x00-\x1f\x7f]/.test(name))||members.some((name,index)=>index>0&&Buffer.compare(Buffer.from(members[index-1]),Buffer.from(name))>=0))fail();previousMembership=row[0];}
 const input:unknown[]=[body.archiveId,body.archiveGraphVersion,body.baseIdentity,body.directories,body.memberships,body.files];if(['postgresql-graph-restore-intent-v2','postgresql-graph-restore-intent-v3'].includes(record.format)){validatePostgresqlBeforeGraph(body.beforeGraph,body);input.push(body.beforeGraph);}else if(Object.hasOwn(body,'beforeGraph'))fail();if(body.snapshotVersion!==hash(JSON.stringify(input)))fail();if(record.format==='postgresql-graph-restore-intent-v3')assertPostgresqlRestoreServiceContext(body.serviceContext,target);else if(Object.hasOwn(body,'serviceContext'))fail();return true;
}
function validate(record:unknown,target:string,opts:TrustedOptions){if(!validRecord(record,target,opts))fail();return record;}
function registered(journal:unknown){if(!object(journal))fail();const record=verified.get(journal);if(!record||record.proof!==hash(JSON.stringify(journal)))fail();return record;}
async function location(target:string,backupRoot:string,create=false){postgresqlConfigRoot(target);if(typeof backupRoot!=='string'||!path.isAbsolute(backupRoot)||path.normalize(backupRoot)!==backupRoot)fail();let current='/';for(const part of backupRoot.split('/').filter(Boolean)){current=path.join(current,part);const stat=await lstat(current);if(!stat.isDirectory()||stat.isSymbolicLink()||![0,process.getuid?.()].includes(stat.uid)||(stat.mode&0o022)&&!(stat.uid===0&&(stat.mode&0o1000)))fail();}const base=await lstat(backupRoot);if(base.uid!==process.getuid?.()||(base.mode&0o077))fail();const root=path.join(backupRoot,'graph-transactions');if(create)await mkdir(root,{mode:0o700}).catch(error=>{if(!hasErrorCode(error,'EEXIST'))throw error;});const stat=await lstat(root);if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==process.getuid?.()||(stat.mode&0o777)!==0o700)fail();return {root,file:path.join(root,hash(target)+'.json')};}
async function sync(root:string){const fd=await open(root,constants.O_RDONLY);try{await fd.sync();}finally{await fd.close();}}
function options(value:JournalOptions={}):TrustedOptions{const result={base:value.base??'/etc',ownerUid:value.ownerUid??process.getuid?.()};if(typeof result.base!=='string'||!path.isAbsolute(result.base)||path.normalize(result.base)!==result.base||!integer(result.ownerUid))fail();return {base:result.base,ownerUid:result.ownerUid};}
export async function createPostgresqlGraphRestoreJournal(value:unknown,backupRoot:string,{serviceContext}:{serviceContext?:unknown}={}){
 const snapshot=await assertPostgresqlGraphRestoreSnapshot(value);const body={...postgresqlGraphRestoreContext(snapshot),...(serviceContext?{serviceContext:structuredClone(assertPostgresqlRestoreServiceContext(serviceContext,snapshot.path))}:{})},record={format:serviceContext?'postgresql-graph-restore-intent-v3':'postgresql-graph-restore-intent-v2',id:randomUUID(),createdAt:new Date().toISOString(),body,digest:hash(JSON.stringify(body))};validate(record,body.target,options(body));const {root,file}=await location(body.target,backupRoot,true);await sync(backupRoot);const bytes=Buffer.from(JSON.stringify(record));if(bytes.length>MAX)fail();const temporary=path.join(root,'.graph-journal-init-'+randomUUID()),fd=await open(temporary,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);let published=false;
 try{await fd.writeFile(bytes);await fd.sync();await assertPostgresqlGraphRestoreSnapshot(snapshot);try{await link(temporary,file);published=true;}catch(error){if(hasErrorCode(error,'EEXIST'))fail();throw error;}}
 finally{await fd.close();await unlink(temporary);if(published)await sync(root);}
 const saved=await readPostgresqlGraphRestoreJournal(body.target,backupRoot,options(body));if(!saved||saved.version!==hash(bytes)||saved.record.id!==record.id)fail();return saved;
}
export async function readPostgresqlGraphRestoreJournal(target:string,backupRoot:string,trustedOptions:JournalOptions={}){
 const opts=options(trustedOptions);let loc;try{loc=await location(target,backupRoot);}catch(error){if(hasErrorCode(error,'ENOENT'))return null;throw error;}let fd;try{fd=await open(loc.file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);}catch(error){if(hasErrorCode(error,'ENOENT'))return null;throw error;}
 try{let before=await fd.stat();const safe=(stat:Stats)=>stat.isFile()&&stat.uid===process.getuid?.()&&(stat.mode&0o777)===0o600&&stat.size<=MAX&&[1,2].includes(stat.nlink);if(!safe(before))fail();const bytes=Buffer.alloc(before.size+1);let size=0;while(size<bytes.length){const result=await fd.read(bytes,size,bytes.length-size,null);if(!result.bytesRead)break;size+=result.bytesRead;}const after=await fd.stat(),named=await lstat(loc.file);if(size!==before.size||!safe(after)||!safe(named)||!same(identity(before),identity(after))||!same(identity(before),identity(named)))fail();let raw:unknown;try{raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,size)));}catch{fail();}const record=validate(raw,target,opts);
  if(before.nlink===2){let count=0,alias;for await(const entry of await opendir(loc.root)){if(++count>1000)fail();if(!/^\.graph-journal-init-[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(entry.name))continue;const file=path.join(loc.root,entry.name),stat=await lstat(file);if(stat.dev===before.dev&&stat.ino===before.ino){if(alias||!safe(stat))fail();alias=file;}}if(!alias)fail();await unlink(alias);await sync(loc.root);before=await fd.stat();if(before.nlink!==1||!safe(before)||!same(identity(before),identity(await lstat(loc.file))))fail();}
  const result={record,identity:identity(before),version:hash(bytes.subarray(0,size))};verified.set(result,{journal:result,proof:hash(JSON.stringify(result)),target,backupRoot,opts});return result;
 }finally{await fd.close();}
}
export function postgresqlGraphRestoreJournalSummary(value:unknown){const record=registered(value),journal=record.journal,body=journal.record.body;return {id:journal.record.id,path:body.target,snapshotVersion:body.snapshotVersion,archiveId:body.archiveId,archiveGraphVersion:body.archiveGraphVersion,version:journal.version,fileCount:body.files.length,interruptedRecordPresent:!record.completedId,beforeGraphVersion:body.beforeGraph?.version??null,beforeGraphComplete:body.beforeGraph?.complete??false};}
export async function clearPostgresqlGraphRestoreJournal(target:string,value:unknown,backupRoot:string,trustedOptions:JournalOptions={}){const record=registered(value),expected=record.journal,opts=options(trustedOptions);if(record.target!==target||record.backupRoot!==backupRoot||!same(record.opts,opts))fail();const current=await readPostgresqlGraphRestoreJournal(target,backupRoot,opts);if(!current||current.version!==expected.version||!same(current.identity,expected.identity))fail();for(const name of [expected.record.id+'.json',expected.record.id+'.swap'])try{await lstat(path.join(backupRoot,'graph-stages',name));fail();}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}const loc=await location(target,backupRoot);await unlink(loc.file);await sync(loc.root);}
export function postgresqlGraphRestoreJournalBody(value:unknown){return structuredClone(registered(value).journal.record.body);}
export function postgresqlGraphRestoreJournalServiceContext(value:unknown){const journal=registered(value).journal,context=assertPostgresqlRestoreServiceContext(journal.record.body.serviceContext,journal.record.body.target);return structuredClone(context);}
export async function assertPostgresqlGraphRestoreJournal(value:unknown,backupRoot:string){const record=registered(value),journal=record.journal;if(record.backupRoot!==backupRoot)fail();const current=record.completedId?await readCompletedPostgresqlGraphRestoreJournal(record.target,record.completedId,backupRoot,record.opts):await readPostgresqlGraphRestoreJournal(record.target,backupRoot,record.opts);if(!current||current.version!==journal.version||!same(current.identity,journal.identity))fail();return journal;}

async function completedDirectory(target:string,backupRoot:string){
 const loc=await location(target,backupRoot),fd=await open(path.join(loc.root,'completed'),constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW);
 try{const before=await fd.stat();if(before.uid!==process.getuid?.()||(before.mode&0o777)!==0o700||!same(identity(before),identity(await lstat(path.join(loc.root,'completed')))))fail();return {fd,loc,target,backupRoot,graphRoot:identity(await lstat(loc.root)),proof:{dev:before.dev,ino:before.ino,uid:before.uid,gid:before.gid,mode:before.mode}};}catch(error){await fd.close();throw error;}
}
async function assertCompletedDirectory(root:Awaited<ReturnType<typeof completedDirectory>>){await location(root.target,root.backupRoot);if(!same(root.graphRoot,identity(await lstat(root.loc.root))))fail();const value=await root.fd.stat(),named=await lstat(path.join(root.loc.root,'completed'));for(const key of ['dev','ino','uid','gid','mode'] as const)if(value[key]!==root.proof[key]||named[key]!==root.proof[key])fail();}
export async function completedPostgresqlGraphRestoreIds(target:string,backupRoot:string){
 let root;try{root=await completedDirectory(target,backupRoot);}catch(error){if(hasErrorCode(error,'ENOENT'))return {ids:[],truncated:false};throw error;}
 try{const ids:string[]=[];let truncated=false;for await(const entry of await opendir(`/proc/self/fd/${root.fd.fd}`)){if(!uuid(entry.name))continue;if(ids.length===1000){truncated=true;break;}ids.push(entry.name);}await assertCompletedDirectory(root);return {ids:ids.sort(),truncated};}finally{await root.fd.close();}
}
export async function readCompletedPostgresqlGraphRestoreJournal(target:string,id:unknown,backupRoot:string,trustedOptions:JournalOptions={}){
 if(!uuid(id))fail();const opts=options(trustedOptions),root=await completedDirectory(target,backupRoot);let custody:FileHandle|undefined,file:FileHandle|undefined;
 try{
  const directory=`/proc/self/fd/${root.fd.fd}/${id}`;custody=await open(directory,constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW);
  const first=await custody.stat();if(first.uid!==process.getuid?.()||(first.mode&0o777)!==0o700||!same(identity(first),identity(await lstat(directory))))fail();
  const name=`/proc/self/fd/${custody.fd}/intent.json`;file=await open(name,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);const before=await file.stat();
  if(!before.isFile()||before.uid!==process.getuid?.()||before.nlink!==1||(before.mode&0o777)!==0o600||before.size>MAX)fail();
  const bytes=Buffer.alloc(before.size+1);let size=0;while(size<bytes.length){const read=await file.read(bytes,size,bytes.length-size,null);if(!read.bytesRead)break;size+=read.bytesRead;}
  if(size!==before.size||!same(identity(before),identity(await file.stat()))||!same(identity(before),identity(await lstat(name)))||!same(identity(first),identity(await custody.stat()))||!same(identity(first),identity(await lstat(directory))))fail();
  await assertCompletedDirectory(root);let raw:unknown;try{raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,size)));}catch{fail();}
  if(!object(raw)||!object(raw.body)||raw.id!==id||typeof raw.body.target!=='string')fail();postgresqlConfigRoot(raw.body.target);if(raw.body.target!==target)return null;
  const record=validate(raw,target,opts);const result={record,identity:identity(before),version:hash(bytes.subarray(0,size))};
  verified.set(result,{journal:result,proof:hash(JSON.stringify(result)),target,backupRoot,opts,completedId:id});return result;
 }finally{await file?.close();await custody?.close();await root.fd.close();}
}

// Called only after terminal progress and service verification. Preserve the
// entire intent rather than delete original configuration or recovery evidence.
export async function retainPostgresqlGraphRestoreJournal(value:unknown,backupRoot:string,progress:unknown){
 const journal=await assertPostgresqlGraphRestoreJournal(value,backupRoot);
 const context=postgresqlGraphSwapProgressContext(progress);
 if(context.journalId!==journal.record.id||context.journalVersion!==journal.version||!['committed','rolled-back'].includes(context.data.phase))fail();
 await assertPostgresqlGraphSwapProgress(progress);
 const registration=registered(journal),loc=await location(registration.target,backupRoot);
 const history=path.join(loc.root,'completed');
 await mkdir(history,{mode:0o700}).catch(error=>{if(!hasErrorCode(error,'EEXIST'))throw error;});
 const parent=await lstat(history);if(!parent.isDirectory()||parent.isSymbolicLink()||parent.uid!==process.getuid?.()||(parent.mode&0o777)!==0o700)fail();
 const destination=path.join(history,journal.record.id);
 // A crash may leave the exclusive custody directory empty before moving the
 // intent. Reuse only that exact private, empty directory; preserve all entries.
 await mkdir(destination,{mode:0o700}).catch(error=>{if(!hasErrorCode(error,'EEXIST'))throw error;});
 const fd=await open(destination,constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW),created=await fd.stat();
 try{
  const check=async()=>{const named=await lstat(destination),current=await fd.stat(),historyNow=await lstat(history);if(!named.isDirectory()||named.isSymbolicLink()||!same(identity(named),identity(current))||current.dev!==created.dev||current.ino!==created.ino||current.uid!==process.getuid?.()||(current.mode&0o777)!==0o700||historyNow.dev!==parent.dev||historyNow.ino!==parent.ino||historyNow.uid!==parent.uid||(historyNow.mode&0o777)!==0o700)fail();};
  const empty=async()=>{for await(const entry of await opendir('/proc/self/fd/'+fd.fd)){fail();}await check();};
  await check();await empty();await assertPostgresqlGraphRestoreJournal(journal,backupRoot);await assertPostgresqlGraphSwapProgress(progress);await empty();
  const file='/proc/self/fd/'+fd.fd+'/intent.json';await rename(loc.file,file);await fd.sync();await sync(loc.root);await sync(history);await check();
  const saved=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
  try{const stat=await saved.stat(),stable=(value:RestoreFileIdentity)=>Object.fromEntries(Object.entries(value).filter(([key])=>key!=='ctimeMs'));if(!same(stable(identity(stat)),stable(journal.identity))||stat.nlink!==1||stat.size>MAX)fail();const bytes=await saved.readFile();if(hash(bytes)!==journal.version||!same(identity(await saved.stat()),identity(stat)))fail();}finally{await saved.close();}
  return {id:journal.record.id,version:journal.version,retained:true,activeIntentCleared:true,originalEvidencePreserved:true};
 }finally{await fd.close();}
}
