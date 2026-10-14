import type {Stats,Dirent} from 'node:fs';
import type {FileHandle} from 'node:fs/promises';
import type {RestoreJournal} from './postgresql-graph-restore-journal.ts';
import type {RestoreFileIdentity,RestoreFileAttributes,RestoreFileRow} from './postgresql-graph-restore-snapshot.ts';
import {hasErrorCode} from './error-code.ts';
import path from 'node:path';
import {mkdir,lstat,open,link,unlink,rename,readdir,rmdir} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {postgresqlGraphRestoreJournalBody,assertPostgresqlGraphRestoreJournal} from './postgresql-graph-restore-journal.ts';
import {pinPostgresqlStageDirectory} from './postgresql-stage-directory.ts';
import {acquireConfigOperationLease} from './config-operation-lease.ts';
const MAX=8000000,hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex'),same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 복원 임시 파일 기록을 확인하세요.'),{status:409});};
const identity=(stat:Stats):RestoreFileIdentity=>({dev:stat.dev,ino:stat.ino,uid:stat.uid,gid:stat.gid,mode:stat.mode,nlink:stat.nlink,size:stat.size,mtimeMs:stat.mtimeMs,ctimeMs:stat.ctimeMs});
const dirIdentity=(stat:Stats)=>({dev:stat.dev,ino:stat.ino,uid:stat.uid,gid:stat.gid,mode:stat.mode&0o777});
const fileAttrs=(stat:Stats)=>({uid:stat.uid,gid:stat.gid,mode:stat.mode&0o777});
const changed=(row:RestoreFileRow):row is RestoreFileRow&{after:Extract<RestoreFileRow['after'],{present:true}>}=>row.after.present&&(!row.before.present||row.before.version!==row.after.version||!same(row.before.attributes,row.after.attributes));
async function sync(dir:string){const fd=await open(dir,constants.O_RDONLY);try{await fd.sync();}finally{await fd.close();}}
async function rootPath(backupRoot:string){if(typeof backupRoot!=='string'||!path.isAbsolute(backupRoot)||path.normalize(backupRoot)!==backupRoot)fail();let parent='/';for(const part of backupRoot.split('/').filter(Boolean)){parent=path.join(parent,part);const stat=await lstat(parent);if(!stat.isDirectory()||stat.isSymbolicLink()||![0,process.getuid?.()].includes(stat.uid)||(stat.mode&0o022)&&!(stat.uid===0&&(stat.mode&0o1000)))fail();}const base=await lstat(backupRoot);if(base.uid!==process.getuid?.()||(base.mode&0o077))fail();const root=path.join(backupRoot,'graph-stages');await mkdir(root,{mode:0o700}).catch(error=>{if(!hasErrorCode(error,'EEXIST'))throw error;});const stat=await lstat(root);if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==process.getuid?.()||(stat.mode&0o777)!==0o700)fail();await sync(backupRoot);return root;}
function binding(journal:RestoreJournal){const body=postgresqlGraphRestoreJournalBody(journal);return {body,physical:(name:string)=>path.join(body.base,name.slice(5)),id:journal.record.id,version:journal.version};}
type StagedIdentity=Pick<RestoreFileIdentity,'dev'|'ino'>&Partial<RestoreFileIdentity>;
type StagedFile={path:string;name:string;version:string;attributes:RestoreFileAttributes;identity:StagedIdentity|null;ready:boolean};
type StagedDirectory={path:string;uid:number;gid:number;mode:number;identity:{dev:number;ino:number}|null};
type Cleanup={layout?:'adjacent-v1';name:string;identity:{dev:number;ino:number};files:('source'|'custody'|'removed')[];directories:('source'|'custody'|'removed')[]};
type StageData={format:'postgresql-graph-stages-v1'|'postgresql-graph-stages-v2';journalId:string;journalVersion:string;target:string;phase:'preparing'|'ready'|'cleaning';files:StagedFile[];directories:StagedDirectory[];cleanup?:Cleanup};
type Binding=ReturnType<typeof binding>;
type Saved={data:StageData;identity:RestoreFileIdentity;version:string};
type Parent=Awaited<ReturnType<typeof pinPostgresqlStageDirectory>>;
const object=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function inode(v:unknown):v is StagedIdentity{return object(v)&&typeof v.dev==='number'&&Number.isSafeInteger(v.dev)&&typeof v.ino==='number'&&Number.isSafeInteger(v.ino)&&['uid','gid','mode','nlink','size','mtimeMs','ctimeMs'].every(k=>v[k]===undefined||typeof v[k]==='number'&&Number.isFinite(v[k]));}
function fullIdentity(v:unknown):v is RestoreFileIdentity{return object(v)&&['dev','ino','uid','gid','mode','nlink','size'].every(k=>typeof v[k]==='number'&&Number.isSafeInteger(v[k])&&v[k]>=0)&&typeof v.mtimeMs==='number'&&Number.isFinite(v.mtimeMs)&&typeof v.ctimeMs==='number'&&Number.isFinite(v.ctimeMs);}
function attrs(v:unknown):v is RestoreFileAttributes&Record<string,unknown>{return object(v)&&['uid','gid','mode'].every(k=>typeof v[k]==='number'&&Number.isSafeInteger(v[k]));}
function stagedFile(v:unknown):v is StagedFile{return object(v)&&typeof v.path==='string'&&typeof v.name==='string'&&typeof v.version==='string'&&attrs(v.attributes)&&(v.identity===null||inode(v.identity))&&typeof v.ready==='boolean';}
function stagedDirectory(v:unknown):v is StagedDirectory{return object(v)&&typeof v.path==='string'&&attrs(v)&&(v.identity===null||inode(v.identity));}
function cleanupShape(v:unknown):v is Cleanup{return object(v)&&(v.layout===undefined||v.layout==='adjacent-v1')&&typeof v.name==='string'&&inode(v.identity)&&Array.isArray(v.files)&&Array.isArray(v.directories)&&[...v.files,...v.directories].every(k=>k==='source'||k==='custody'||k==='removed');}
function shape(v:unknown):v is StageData{return object(v)&&(v.format==='postgresql-graph-stages-v1'||v.format==='postgresql-graph-stages-v2')&&typeof v.journalId==='string'&&typeof v.journalVersion==='string'&&typeof v.target==='string'&&(v.phase==='preparing'||v.phase==='ready'||v.phase==='cleaning')&&Array.isArray(v.files)&&v.files.every(stagedFile)&&Array.isArray(v.directories)&&v.directories.every(stagedDirectory)&&(v.cleanup===undefined||cleanupShape(v.cleanup));}
function cleanup(data:StageData){if(!data.cleanup)fail();return data.cleanup;}
function requireFile(entry:StagedFile|StagedDirectory){if(!stagedFile(entry))fail();return entry;}
function requireDirectory(entry:StagedFile|StagedDirectory){if(!stagedDirectory(entry))fail();return entry;}
function validate(value:unknown,ctx:Binding){if(!shape(value))fail();const data=value;if(!['postgresql-graph-stages-v1','postgresql-graph-stages-v2'].includes(data?.format)||data.journalId!==ctx.id||data.journalVersion!==ctx.version||data.target!==ctx.body.target||!['preparing','ready','cleaning'].includes(data.phase)||!Array.isArray(data.files)||!Array.isArray(data.directories)||data.files.length>300||data.directories.length>1000)fail();const expected=ctx.body.files.filter(changed);if(expected.length!==data.files.length)fail();
 for(let index=0;index<expected.length;index++){const file=data.files[index],row=expected[index];if(file.path!==row.path||file.version!==row.after.version||!same(file.attributes,row.after.attributes)||typeof file.ready!=='boolean'||!/^\.tastedev-pg-stage-[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}\.tmp$/.test(file.name)||file.identity!==null&&(!Number.isSafeInteger(file.identity.dev)||!Number.isSafeInteger(file.identity.ino))||file.ready&&!file.identity)fail();}
 const missing=ctx.body.directories.filter(([,value])=>value===null);if(missing.length!==data.directories.length)fail();for(const dir of data.directories){if(!missing.some(([name])=>name===dir.path)||dir.uid!==ctx.body.ownerUid||!Number.isSafeInteger(dir.gid)||dir.gid<0||dir.mode!==0o700||dir.identity!==null&&(!Number.isSafeInteger(dir.identity.dev)||!Number.isSafeInteger(dir.identity.ino)))fail();}if(data.phase==='cleaning'){const cleanup=data.cleanup;if(!cleanup||(data.format==='postgresql-graph-stages-v2'?cleanup.layout!=='adjacent-v1':cleanup.layout!==undefined)||cleanup.name!==ctx.id+'.custody'||!cleanup.identity||!Number.isSafeInteger(cleanup.identity.dev)||!Number.isSafeInteger(cleanup.identity.ino)||!Array.isArray(cleanup.files)||!Array.isArray(cleanup.directories)||cleanup.files.length!==data.files.length||cleanup.directories.length!==data.directories.length||[...cleanup.files,...cleanup.directories].some(value=>!['source','custody','removed'].includes(value))||data.files.some(file=>!file.ready)||data.directories.some(dir=>!dir.identity))fail();}else if(data.cleanup!==undefined)fail();if(new Set(data.directories.map(dir=>dir.path)).size!==data.directories.length||data.phase==='ready'&&(data.files.some(file=>!file.ready)||data.directories.some(dir=>!dir.identity)))fail();return data;}
async function read(root:string,ctx:Binding):Promise<Saved|null>{const file=path.join(root,ctx.id+'.json');let fd:FileHandle;try{fd=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);}catch(error){if(hasErrorCode(error,'ENOENT'))return null;throw error;}try{const before=await fd.stat(),safe=(stat:Stats)=>stat.isFile()&&stat.nlink===1&&stat.uid===process.getuid?.()&&(stat.mode&0o777)===0o600&&stat.size<=MAX;if(!safe(before))fail();const bytes=Buffer.alloc(before.size+1);let size=0;while(size<bytes.length){const result=await fd.read(bytes,size,bytes.length-size,null);if(!result.bytesRead)break;size+=result.bytesRead;}const after=await fd.stat(),named=await lstat(file);if(size!==before.size||!safe(after)||!safe(named)||!same(identity(before),identity(after))||!same(identity(before),identity(named)))fail();let record:unknown;try{record=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,size)));}catch{fail();}if(!object(record)||record.digest!==hash(JSON.stringify(record.data)))fail();return {data:validate(record.data,ctx),identity:identity(before),version:hash(bytes.subarray(0,size))};}finally{await fd.close();}}
async function save(root:string,ctx:Binding,data:StageData,previous:Saved|null=null):Promise<Saved>{validate(data,ctx);const bytes=Buffer.from(JSON.stringify({data,digest:hash(JSON.stringify(data))}));if(bytes.length>MAX)fail();const temporary=path.join(root,'.stages-write-'+randomUUID()),file=path.join(root,ctx.id+'.json'),fd=await open(temporary,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);try{await fd.writeFile(bytes);await fd.sync();}finally{await fd.close();}try{if(previous){const current=await read(root,ctx);if(!current||current.version!==previous.version||!same(current.identity,previous.identity))fail();await rename(temporary,file);}else{try{await link(temporary,file);}catch(error){if(hasErrorCode(error,'EEXIST'))fail();throw error;}}await sync(root);}finally{await unlink(temporary).catch(error=>{if(!hasErrorCode(error,'ENOENT'))throw error;});}const saved=await read(root,ctx);if(!saved)fail();return saved;}
async function currentFile(file:string){let stat;try{stat=await lstat(file);}catch(error){if(hasErrorCode(error,'ENOENT'))return null;throw error;}if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1||stat.size>262144)fail();const fd=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);try{const before=await fd.stat();if(!same(identity(before),identity(stat)))fail();const bytes=Buffer.alloc(before.size+1);let size=0;while(size<bytes.length){const result=await fd.read(bytes,size,bytes.length-size,null);if(!result.bytesRead)break;size+=result.bytesRead;}const after=await fd.stat(),named=await lstat(file);if(size!==before.size||!same(identity(before),identity(after))||!same(identity(before),identity(named)))fail();return {identity:identity(before),attributes:fileAttrs(before),version:hash(bytes.subarray(0,size))};}finally{await fd.close();}}
async function unchanged(ctx:Binding,data:StageData|{phase:'intent-only';directories:StagedDirectory[]}){if(!same(dirIdentity(await lstat(ctx.body.base)),ctx.body.baseIdentity))fail();for(const [name,expected] of ctx.body.directories){let stat;try{stat=await lstat(ctx.physical(name));}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}const created=data.directories.find(dir=>dir.path===name);if(expected){if(!stat||!stat.isDirectory()||stat.isSymbolicLink()||!same(dirIdentity(stat),expected))fail();}else if(data.phase==='cleaning'&&cleanup(data).directories[data.directories.indexOf(created??fail())]!=='source'){if(stat)fail();}else if(created?.identity){if(!stat||!stat.isDirectory()||stat.isSymbolicLink()||stat.dev!==created.identity.dev||stat.ino!==created.identity.ino||stat.uid!==created.uid||stat.gid!==created.gid||(stat.mode&0o777)!==created.mode)fail();}else if(stat)fail();}
 for(const row of ctx.body.files){const actual=await currentFile(ctx.physical(row.path));if(row.before.present){if(!actual||actual.version!==row.before.version||!same(actual.identity,row.before.identity))fail();}else if(actual)fail();}
 for(const [name,expected] of ctx.body.memberships){let entries:Dirent[];try{entries=await readdir(ctx.physical(name),{withFileTypes:true});}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;entries=[];}const names=[];for(const entry of entries){if(entry.name.startsWith('.')||!entry.name.endsWith('.conf')||entry.isDirectory())continue;if(!entry.isFile()||entry.isSymbolicLink())fail();names.push(entry.name);}names.sort((a,b)=>Buffer.compare(Buffer.from(a),Buffer.from(b)));if(!same(names,expected))fail();}}
export async function preparePostgresqlGraphRestoreStages(value:unknown,backupRoot:string,{ownerGid,resume=false}:{ownerGid?:number;resume?:boolean}={}){
 const journal=await assertPostgresqlGraphRestoreJournal(value,backupRoot);const ctx=binding(journal),root=await rootPath(backupRoot),release=await acquireConfigOperationLease(path.join(root,ctx.id+'.lock'));
 try{let saved=await read(root,ctx);if(saved&&(!resume||saved.data.phase!=='preparing')||resume&&!saved)fail();const missing=ctx.body.directories.filter(([,value])=>value===null);if(missing.length&&ownerGid===undefined){if(ctx.body.ownerUid!==process.getuid?.())fail();ownerGid=process.getgid?.();}if(missing.length&&(typeof ownerGid!=='number'||!Number.isSafeInteger(ownerGid)||ownerGid<0))fail();const data:StageData=saved?saved.data:{format:'postgresql-graph-stages-v2',journalId:ctx.id,journalVersion:ctx.version,target:ctx.body.target,phase:'preparing',directories:missing.map(([name])=>({path:name,uid:ctx.body.ownerUid,gid:ownerGid??fail(),mode:0o700,identity:null})).sort((a,b)=>a.path.length-b.path.length||Buffer.compare(Buffer.from(a.path),Buffer.from(b.path))),files:ctx.body.files.filter(changed).map(row=>({path:row.path,name:'.tastedev-pg-stage-'+randomUUID()+'.tmp',version:row.after.version,attributes:row.after.attributes,identity:null,ready:false}))};await unchanged(ctx,data);if(!saved)saved=await save(root,ctx,data);
  for(const dir of data.directories){
   if(dir.identity)continue;
   await unchanged(ctx,data);await assertPostgresqlGraphRestoreJournal(journal,backupRoot);
   const parent=await pinPostgresqlStageDirectory(ctx.body,data.directories,path.dirname(dir.path));
   try{await parent.verify();const file=parent.child(path.basename(dir.path));await mkdir(file,{mode:0o700});const fd=await open(file,constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW);
    try{const stat=await fd.stat(),named=await lstat(file);if(!stat.isDirectory()||stat.uid!==process.getuid?.()||(stat.mode&0o777)!==0o700||!same(dirIdentity(stat),dirIdentity(named)))fail();dir.identity={dev:stat.dev,ino:stat.ino};saved=await save(root,ctx,data,saved);await parent.verify();await fd.chown(dir.uid,dir.gid);await fd.chmod(dir.mode);await fd.sync();const final=await lstat(file);if(final.dev!==stat.dev||final.ino!==stat.ino||!final.isDirectory()||final.isSymbolicLink())fail();await parent.verify();await parent.sync();}finally{await fd.close();}
   }finally{await parent.close();}
  }
  for(const entry of data.files){
   await unchanged(ctx,data);await assertPostgresqlGraphRestoreJournal(journal,backupRoot);
   const row=ctx.body.files.find(row=>row.path===entry.path);if(!row||!row.after.present)fail();const text=row.after.text,parent=await pinPostgresqlStageDirectory(ctx.body,data.directories,path.dirname(entry.path));
   try{await parent.verify();const file=parent.child(entry.name);
    if(entry.ready){const actual=await currentFile(file);if(!actual||actual.version!==entry.version||!same(actual.identity,entry.identity)||!same(actual.attributes,entry.attributes))fail();await parent.verify();continue;}
    const fd=await open(file,entry.identity?constants.O_RDWR|constants.O_NOFOLLOW|constants.O_NONBLOCK:constants.O_RDWR|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);
    try{const stat=await fd.stat();
     if(entry.identity){
      if(!stat.isFile()||stat.nlink!==1||stat.dev!==(entry.identity??fail()).dev||stat.ino!==(entry.identity??fail()).ino||stat.size>Buffer.byteLength(text)||![process.getuid?.(),entry.attributes.uid].includes(stat.uid)||![process.getgid?.(),entry.attributes.gid].includes(stat.gid)||![0o600,entry.attributes.mode].includes(stat.mode&0o777))fail();
      const bytes=Buffer.alloc(stat.size+1),result=await fd.read(bytes,0,bytes.length,0),expected=Buffer.from(text);
      if(result.bytesRead!==stat.size||!bytes.subarray(0,stat.size).equals(expected.subarray(0,stat.size))||!same(identity(await fd.stat()),identity(stat))||!same(identity(await lstat(file)),identity(stat)))fail();
     }else{entry.identity={dev:stat.dev,ino:stat.ino};saved=await save(root,ctx,data,saved);}
     await parent.verify();await fd.writeFile(text);await fd.chown(entry.attributes.uid,entry.attributes.gid);await fd.chmod(entry.attributes.mode);await fd.sync();const actual=await currentFile(file);if(!actual||actual.identity.dev!==stat.dev||actual.identity.ino!==stat.ino||actual.version!==requireFile(entry).version||!same(actual.attributes,requireFile(entry).attributes))fail();await parent.verify();entry.identity=actual.identity;entry.ready=true;await parent.sync();saved=await save(root,ctx,data,saved);}finally{await fd.close();}
   }finally{await parent.close();}
  }
  await unchanged(ctx,data);await assertPostgresqlGraphRestoreJournal(journal,backupRoot);data.phase='ready';await save(root,ctx,data,saved);return {journalId:ctx.id,phase:'ready',stagedFiles:data.files.length,createdDirectories:data.directories.length,operatingConfigurationChanged:false,operatingServiceChanged:false};
 }finally{await release();}
}
export async function inspectPostgresqlGraphRestoreStages(value:unknown,backupRoot:string){const journal=await assertPostgresqlGraphRestoreJournal(value,backupRoot);const ctx=binding(journal),root=await rootPath(backupRoot),saved=await read(root,ctx);if(!saved)return null;const data=saved.data;await unchanged(ctx,data);if(data.phase==='ready')for(const entry of data.files){const parent=await pinPostgresqlStageDirectory(ctx.body,data.directories,path.dirname(entry.path));try{const actual=await currentFile(parent.child(entry.name));if(!actual||actual.version!==entry.version||!same(actual.identity,entry.identity)||!same(actual.attributes,entry.attributes))fail();await parent.verify();}finally{await parent.close();}}return {journalId:ctx.id,phase:data.phase,stagedFiles:data.files.filter(file=>file.ready).length,createdDirectories:data.directories.filter(dir=>dir.identity).length,operatingConfigurationChanged:false,operatingServiceChanged:false};}

export async function resumePostgresqlGraphRestoreStages(journal:unknown,backupRoot:string,options:{ownerGid?:number}={}){return preparePostgresqlGraphRestoreStages(journal,backupRoot,{...options,resume:true});}

const withoutCtime=(value:StagedIdentity|null)=>Object.fromEntries(Object.entries(value??fail()).filter(([key])=>key!=='ctimeMs'));
async function maybeStat(file:string){try{return await lstat(file);}catch(error){if(hasErrorCode(error,'ENOENT'))return null;throw error;}}
function matchesMovedFile(actual:Awaited<ReturnType<typeof currentFile>>,entry:StagedFile){return actual&&actual.version===entry.version&&same(actual.attributes,entry.attributes)&&same(withoutCtime(actual.identity),withoutCtime(entry.identity));}
function matchesCreatedDirectory(stat:Stats|null,entry:StagedDirectory){return stat?.isDirectory()&&!stat.isSymbolicLink()&&stat.dev===(entry.identity??fail()).dev&&stat.ino===(entry.identity??fail()).ino&&stat.uid===entry.uid&&stat.gid===entry.gid&&(stat.mode&0o777)===entry.mode;}

// Move first into an executor-owned private directory. A substituted source is
// retained in custody and never deleted when its recorded identity does not match.
export async function cancelPostgresqlGraphRestoreStages(value:unknown,backupRoot:string,{expectedVersion}:{expectedVersion?:string}={}){
 const journal=await assertPostgresqlGraphRestoreJournal(value,backupRoot);const ctx=binding(journal),root=await rootPath(backupRoot),release=await acquireConfigOperationLease(path.join(root,ctx.id+'.lock'));
 let rootFd:FileHandle|undefined,custodyFd:FileHandle|undefined;
 try{
  let saved=await read(root,ctx);if(!saved||!['ready','cleaning'].includes(saved.data.phase)||expectedVersion!==undefined&&saved.version!==expectedVersion)fail();const data=saved.data;
  if(expectedVersion!==undefined&&await maybeStat(path.join(root,ctx.id+'.swap')))fail();
  rootFd=await open(root,constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW);const rootIdentity=dirIdentity(await rootFd.stat()),rootChild=(name:string)=>`/proc/self/fd/${(rootFd??fail()).fd}/${name}`;
  async function checkCustody(){const rootStat=await lstat(root),stat=await (custodyFd??fail()).stat(),named=await lstat(rootChild(cleanup(data).name));if(!same(dirIdentity(rootStat),rootIdentity)||!stat.isDirectory()||!named.isDirectory()||named.isSymbolicLink()||stat.dev!==cleanup(data).identity.dev||stat.ino!==cleanup(data).identity.ino||!same(dirIdentity(stat),dirIdentity(named))||stat.uid!==process.getuid?.()||(stat.mode&0o777)!==0o700)fail();}
  if(data.phase==='ready'){
   await unchanged(ctx,data);
   // Inspect every candidate before removing any source name.
   for(const entry of data.files){const parent=await pinPostgresqlStageDirectory(ctx.body,data.directories,path.dirname(entry.path));try{const actual=await currentFile(parent.child(entry.name));if(!actual||!same(actual.identity,entry.identity)||actual.version!==requireFile(entry).version||!same(actual.attributes,requireFile(entry).attributes))fail();if(data.format==='postgresql-graph-stages-v2'&&await maybeStat(parent.child('.tastedev-pg-cancel-'+ctx.id+'-files-'+data.files.indexOf(entry))))fail();await parent.verify();}finally{await parent.close();}}
   if(data.format==='postgresql-graph-stages-v2')for(const [index,entry] of data.directories.entries()){const parent=await pinPostgresqlStageDirectory(ctx.body,data.directories,path.dirname(entry.path));try{if(await maybeStat(parent.child('.tastedev-pg-cancel-'+ctx.id+'-directories-'+index)))fail();await parent.verify();}finally{await parent.close();}}
   const name=ctx.id+'.custody';await mkdir(rootChild(name),{mode:0o700});custodyFd=await open(rootChild(name),constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW);const stat=await (custodyFd??fail()).stat();if(stat.uid!==process.getuid?.()||(stat.mode&0o777)!==0o700)fail();
   data.phase='cleaning';data.cleanup={...(data.format==='postgresql-graph-stages-v2'?{layout:'adjacent-v1'}:{}),name,identity:{dev:stat.dev,ino:stat.ino},files:data.files.map(()=>'source'),directories:data.directories.map(()=>'source')};await custodyFd.sync();await rootFd.sync();saved=await save(root,ctx,data,saved);
  }else custodyFd=await open(rootChild(cleanup(data).name),constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW);
  await checkCustody();if(data.format==='postgresql-graph-stages-v2')return await cancelAdjacentStages(ctx,root,data,saved,{journal,backupRoot,checkCustody,rootFd,rootChild,custodyFd});const child=(name:string)=>`/proc/self/fd/${(custodyFd??fail()).fd}/${name}`;
  // Reconcile the rename/unlink-to-checkpoint windows before checking parents.
  for(const [kind,entries] of [['files',data.files],['directories',data.directories]] as const)for(let index=0;index<entries.length;index++){
   const entry=entries[index],destination=child((kind==='files'?'file-':'dir-')+index),source=kind==='files'?path.join(path.dirname(ctx.physical(entry.path)),requireFile(entry).name):ctx.physical(entry.path),stat=await maybeStat(destination),sourceStat=await maybeStat(source),state=cleanup(data)[kind][index];
   if(stat){if(sourceStat||state==='removed')fail();if(kind==='files'){if(!matchesMovedFile(await currentFile(destination),requireFile(entry)))fail();}else if(!matchesCreatedDirectory(stat,requireDirectory(entry)))fail();if(state==='source'){const parent=await pinPostgresqlStageDirectory(ctx.body,data.directories,path.dirname(entry.path));try{await parent.sync();await parent.verify();}finally{await parent.close();}}cleanup(data)[kind][index]='custody';}
   else if(state==='custody'){if(sourceStat)fail();cleanup(data)[kind][index]='removed';}
   else if(state==='removed'){if(sourceStat)fail();}
   else if(!sourceStat)fail();
  }
  await custodyFd.sync();saved=await save(root,ctx,data,saved);await unchanged(ctx,data);
  for(let index=0;index<data.files.length;index++){
   const entry=data.files[index],destination=child('file-'+index);await checkCustody();await assertPostgresqlGraphRestoreJournal(journal,backupRoot);await unchanged(ctx,data);
   if(cleanup(data).files[index]==='source'){
    const parent=await pinPostgresqlStageDirectory(ctx.body,data.directories,path.dirname(entry.path));
    try{const source=parent.child(entry.name),actual=await currentFile(source);if(!actual||!same(actual.identity,entry.identity)||actual.version!==requireFile(entry).version||!same(actual.attributes,requireFile(entry).attributes)||await maybeStat(destination))fail();await parent.verify();await rename(source,destination);await parent.sync();await custodyFd.sync();await parent.verify();if(!matchesMovedFile(await currentFile(destination),requireFile(entry)))fail();cleanup(data).files[index]='custody';saved=await save(root,ctx,data,saved);}finally{await parent.close();}
   }
   if(cleanup(data).files[index]==='custody'){await checkCustody();if(!matchesMovedFile(await currentFile(destination),requireFile(entry)))fail();await unlink(destination);await custodyFd.sync();cleanup(data).files[index]='removed';saved=await save(root,ctx,data,saved);}
  }
  for(let index=data.directories.length-1;index>=0;index--){
   const entry=data.directories[index],destination=child('dir-'+index);await checkCustody();await assertPostgresqlGraphRestoreJournal(journal,backupRoot);await unchanged(ctx,data);
   if(cleanup(data).directories[index]==='source'){
    const parent=await pinPostgresqlStageDirectory(ctx.body,data.directories,path.dirname(entry.path));
    try{const source=parent.child(path.basename(entry.path));if(!matchesCreatedDirectory(await maybeStat(source),entry)||(await readdir(source)).length||await maybeStat(destination))fail();await parent.verify();await rename(source,destination);await parent.sync();await custodyFd.sync();await parent.verify();if(!matchesCreatedDirectory(await maybeStat(destination),entry))fail();cleanup(data).directories[index]='custody';saved=await save(root,ctx,data,saved);}finally{await parent.close();}
   }
   if(cleanup(data).directories[index]==='custody'){await checkCustody();if(!matchesCreatedDirectory(await maybeStat(destination),entry)||(await readdir(destination)).length)fail();await rmdir(destination);await custodyFd.sync();cleanup(data).directories[index]='removed';saved=await save(root,ctx,data,saved);}
  }
  await unchanged(ctx,data);await checkCustody();if((await readdir(`/proc/self/fd/${(custodyFd??fail()).fd}`)).length)fail();await assertPostgresqlGraphRestoreJournal(journal,backupRoot);const current=await read(root,ctx);if(!current||current.version!==saved.version||!same(current.identity,saved.identity))fail();
  // Keep the empty custody directory until after the ledger is removed: a crash
  // before unlink can re-enter cleaning without an unrecorded missing parent.
  await unlink(rootChild(ctx.id+'.json'));await rootFd.sync();await rmdir(rootChild(cleanup(data).name));await rootFd.sync();
  return {journalId:ctx.id,phase:'cancelled',removedFiles:data.files.length,removedDirectories:data.directories.length,operatingConfigurationChanged:false,operatingServiceChanged:false,intentPreserved:true};
 }finally{await custodyFd?.close();await rootFd?.close();await release();}
}

// A missing ledger is not proof that deployment never started. Any swap or
// cleanup custody preserves the intent for recovery rather than authorizing deletion.
export async function inspectPostgresqlGraphPreparation(value:unknown,backupRoot:string){
 const journal=await assertPostgresqlGraphRestoreJournal(value,backupRoot);
 const ctx=binding(journal),root=await rootPath(backupRoot),saved=await read(root,ctx);
 if(await maybeStat(path.join(root,ctx.id+'.swap'))){if(!saved)fail();return null;}
 if(await maybeStat(path.join(root,ctx.id+'.custody')))fail();
 if(saved&&saved.data.phase!=='ready')fail();
 await unchanged(ctx,saved?.data??{phase:'intent-only',directories:[]});
 if(!saved){
  for(const parent of new Set(ctx.body.files.map(row=>path.dirname(row.path)))){
   let names;try{names=await readdir(ctx.physical(parent));}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;continue;}
   if(names.some(name=>name.startsWith('.tastedev-pg-stage-')||name.startsWith('.tastedev-pg-cancel-')))fail();
  }
  await unchanged(ctx,{phase:'intent-only',directories:[]});
 }
 if(saved){await inspectPostgresqlGraphRestoreStages(journal,backupRoot);const latest=await read(root,ctx);if(!latest||latest.version!==saved.version||!same(latest.identity,saved.identity))fail();}
 await assertPostgresqlGraphRestoreJournal(journal,backupRoot);
 return {phase:saved?'ready':'intent-only',stageVersion:saved?.version??null,stageIdentity:saved?.identity??null,
  stagedFiles:saved?.data.files.length??0,createdDirectories:saved?.data.directories.length??0};
}

// Internal executor input only: public summaries never contain raw configuration.
export async function postgresqlGraphRestoreStageContext(value:unknown,backupRoot:string){
 const journal=await assertPostgresqlGraphRestoreJournal(value,backupRoot);await inspectPostgresqlGraphRestoreStages(journal,backupRoot);const ctx=binding(journal),root=await rootPath(backupRoot),saved=await read(root,ctx);if(!saved||saved.data.phase!=='ready')fail();return {body:structuredClone(ctx.body),stages:structuredClone(saved.data),stageVersion:saved.version,stageIdentity:structuredClone(saved.identity),root,journalId:ctx.id,journalVersion:ctx.version};
}

// Recovery reads the verified private ledger without assuming targets still have
// their pre-swap contents. It does not authorize any filesystem recovery action.
export async function postgresqlGraphRestoreRecoveryContext(value:unknown,backupRoot:string){
 const journal=await assertPostgresqlGraphRestoreJournal(value,backupRoot);const ctx=binding(journal),root=await rootPath(backupRoot),saved=await read(root,ctx);if(!saved||saved.data.phase!=='ready')fail();
 for(const entry of saved.data.files){const value=entry.identity,row=ctx.body.files.find(row=>row.path===entry.path);if(!row||!row.after.present||!fullIdentity(value)||Object.keys(value).length!==9||value.nlink!==1||(value.mode&0o170000)!==0o100000||value.size!==Buffer.byteLength(row.after.text)||value.uid!==entry.attributes.uid||value.gid!==entry.attributes.gid||(value.mode&0o777)!==entry.attributes.mode)fail();}
 return {body:structuredClone(ctx.body),stages:structuredClone(saved.data),stageVersion:saved.version,stageIdentity:structuredClone(saved.identity),root,journalId:ctx.id,journalVersion:ctx.version};
}

// v2 stages retire candidates beside their pinned source parent, avoiding EXDEV.
async function cancelAdjacentStages(ctx:Binding,root:string,data:StageData,saved:Saved,{journal,backupRoot,checkCustody,rootFd,rootChild,custodyFd}:{journal:RestoreJournal;backupRoot:string;checkCustody:()=>Promise<void>;rootFd:FileHandle;rootChild:(name:string)=>string;custodyFd:FileHandle}){
 const name=(kind:'files'|'directories',index:number)=>'.tastedev-pg-cancel-'+ctx.id+'-'+kind+'-'+index;
 const ancestorMoved=(entry:StagedFile|StagedDirectory)=>data.directories.some((dir,index)=>entry.path.startsWith(dir.path+'/')&&cleanup(data).directories[index]!=='source');
 const withParent=async<T>(entry:StagedFile|StagedDirectory,run:(parent:Parent)=>Promise<T>)=>{const parent=await pinPostgresqlStageDirectory(ctx.body,data.directories,path.dirname(entry.path));try{await parent.verify();return await run(parent);}finally{await parent.close();}};
 async function reconcile(kind:'files'|'directories',entries:(StagedFile|StagedDirectory)[]){
  for(let index=0;index<entries.length;index++){
   const entry=entries[index],state=cleanup(data)[kind][index];
   if(ancestorMoved(entry)){if(state!=='removed')fail();continue;}
   await withParent(entry,async parent=>{
    const source=parent.child(kind==='files'?requireFile(entry).name:path.basename(entry.path)),destination=parent.child(name(kind,index)),from=await maybeStat(source),to=await maybeStat(destination);
    if(to){if(from||state==='removed')fail();if(kind==='files'){if(!matchesMovedFile(await currentFile(destination),requireFile(entry)))fail();}else if(!matchesCreatedDirectory(to,requireDirectory(entry)))fail();await parent.sync();cleanup(data)[kind][index]='custody';}
    else if(state==='custody'){if(from)fail();cleanup(data)[kind][index]='removed';}
    else if(state==='removed'){if(from)fail();}
    else{if(!from)fail();if(kind==='files'){const actual=await currentFile(source);if(!actual||!same(actual.identity,entry.identity)||actual.version!==requireFile(entry).version||!same(actual.attributes,requireFile(entry).attributes))fail();}else if(!matchesCreatedDirectory(from,requireDirectory(entry)))fail();}
    await parent.verify();
   });
  }
 }
 // Ancestor checkpoints are reconciled first so removed descendants need no
 // lookup through a path that has already been retired and removed.
 await reconcile('directories',data.directories);await reconcile('files',data.files);
 await unchanged(ctx,data);saved=await save(root,ctx,data,saved);
 for(const [kind,entries] of [['files',data.files],['directories',data.directories]] as const){
  const order=entries.map((entry,index)=>({entry,index}));if(kind==='directories')order.reverse();
  for(const {entry,index} of order){
   if(cleanup(data)[kind][index]==='removed')continue;
   await checkCustody();await assertPostgresqlGraphRestoreJournal(journal,backupRoot);await unchanged(ctx,data);
   await withParent(entry,async parent=>{
    const source=parent.child(kind==='files'?requireFile(entry).name:path.basename(entry.path)),destination=parent.child(name(kind,index));
    const matches=async(file:string)=>kind==='files'?matchesMovedFile(await currentFile(file),requireFile(entry)):matchesCreatedDirectory(await maybeStat(file),requireDirectory(entry));
    if(cleanup(data)[kind][index]==='source'){
     if(kind==='files'){const actual=await currentFile(source);if(!actual||!same(actual.identity,entry.identity))fail();}
     if(!await matches(source)||await maybeStat(destination)||kind==='directories'&&(await readdir(source)).length)fail();
     await parent.verify();await rename(source,destination);await parent.sync();await parent.verify();if(!await matches(destination))fail();
     cleanup(data)[kind][index]='custody';saved=await save(root,ctx,data,saved);
    }
    if(cleanup(data)[kind][index]==='custody'){
     if(!await matches(destination)||kind==='directories'&&(await readdir(destination)).length)fail();
     await parent.verify();if(kind==='files')await unlink(destination);else await rmdir(destination);await parent.sync();await parent.verify();
     cleanup(data)[kind][index]='removed';saved=await save(root,ctx,data,saved);
    }
   });
  }
 }
 await unchanged(ctx,data);await checkCustody();if((await readdir(`/proc/self/fd/${(custodyFd??fail()).fd}`)).length)fail();
 await assertPostgresqlGraphRestoreJournal(journal,backupRoot);const current=await read(root,ctx);if(!current||current.version!==saved.version||!same(current.identity,saved.identity))fail();
 await unlink(rootChild(ctx.id+'.json'));await rootFd.sync();await rmdir(rootChild(cleanup(data).name));await rootFd.sync();
 return {journalId:ctx.id,phase:'cancelled',removedFiles:data.files.length,removedDirectories:data.directories.length,operatingConfigurationChanged:false,operatingServiceChanged:false,intentPreserved:true};
}
