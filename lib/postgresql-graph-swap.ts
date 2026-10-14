import type {Stats} from 'node:fs';
import type {FileHandle} from 'node:fs/promises';
import type {RestoreFileIdentity,RestoreFileAttributes,RestoreFileRow,RestoreBeforeSource,RestoreAfterSource} from './postgresql-graph-restore-snapshot.ts';
import type {RestoreStageContext,SwapData} from './postgresql-graph-swap-progress.ts';
import {assertRestoreStageContext} from './postgresql-graph-swap-progress.ts';
import {hasErrorCode} from './error-code.ts';
import path from 'node:path';
import {open,lstat,mkdir,rename,link,unlink,readdir} from 'node:fs/promises';
import {constants} from 'node:fs';
import {randomUUID,createHash} from 'node:crypto';
import {postgresqlGraphRestoreStageContext,postgresqlGraphRestoreRecoveryContext} from './postgresql-graph-restore-stages.ts';
import {assertPostgresqlGraphRestoreJournal} from './postgresql-graph-restore-journal.ts';
import {pinPostgresqlStageDirectory} from './postgresql-stage-directory.ts';
import {validatePostgresqlGraphSwapProgress} from './postgresql-graph-swap-progress.ts';
import {acquireConfigOperationLease} from './config-operation-lease.ts';

const hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 여러 파일 복원 기록을 확인하세요.'),{status:409});};
const identity=(stat:Stats):RestoreFileIdentity=>({dev:stat.dev,ino:stat.ino,uid:stat.uid,gid:stat.gid,mode:stat.mode,nlink:stat.nlink,size:stat.size,mtimeMs:stat.mtimeMs,ctimeMs:stat.ctimeMs});
const attrs=(stat:Stats)=>({uid:stat.uid,gid:stat.gid,mode:stat.mode&0o777});
const changed=(row:RestoreFileRow)=>row.before.present!==row.after.present||row.before.present&&row.after.present&&(row.before.version!==row.after.version||!same(row.before.attributes,row.after.attributes));
async function stat(file:string){try{return await lstat(file);}catch(error){if(hasErrorCode(error,'ENOENT'))return null;throw error;}}
async function read(file:string,allowAlias=false){const named=await stat(file);if(!named)return null;if(!named.isFile()||named.isSymbolicLink()||!(named.nlink===1||allowAlias&&named.nlink===2)||named.size>262144)fail();const fd=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);try{const first=await fd.stat();if(!same(identity(first),identity(named)))fail();const bytes=Buffer.alloc(first.size+1);let size=0;while(size<bytes.length){const result=await fd.read(bytes,size,bytes.length-size,null);if(!result.bytesRead)break;size+=result.bytesRead;}if(size!==first.size||!same(identity(first),identity(await fd.stat()))||!same(identity(first),identity(await lstat(file))))fail();return {identity:identity(first),attributes:attrs(first),version:hash(bytes.subarray(0,size))};}finally{await fd.close();}}
type FileSnapshot={identity:RestoreFileIdentity;attributes:RestoreFileAttributes;version:string};
function matches(actual:FileSnapshot|null,expected:RestoreBeforeSource|RestoreAfterSource,recorded:Pick<RestoreFileIdentity,'dev'|'ino'>|undefined):actual is FileSnapshot{return !!actual&&expected.present&&!!recorded&&actual.version===expected.version&&same(actual.attributes,expected.attributes)&&actual.identity.dev===recorded.dev&&actual.identity.ino===recorded.ino;}
const sameStage=(a:RestoreStageContext,b:RestoreStageContext)=>a.stageVersion===b.stageVersion&&same(a.stageIdentity,b.stageIdentity)&&a.journalVersion===b.journalVersion&&a.root===b.root;

// Internal primitive. Native candidate verification, fixed service activation,
// runtime verification and recovery policy must be supplied by the coordinator.
// No web/root-helper endpoint calls this module yet.
export type SwapOptions={validate?:()=>unknown|Promise<unknown>;activate?:()=>unknown|Promise<unknown>;verify?:(state:{rollback:boolean})=>unknown|Promise<unknown>;reactivate?:()=>unknown|Promise<unknown>};
function beforeIdentity(row:RestoreFileRow){if(!row.before.present)fail();return row.before.identity;}
export async function swapPostgresqlGraphRestore(value:unknown,backupRoot:string,{validate,activate,verify,reactivate}:SwapOptions={}){
 if(typeof validate!=='function'||typeof activate!=='function'||typeof verify!=='function'||typeof reactivate!=='function')fail();
 const actions={validate,activate,verify,reactivate};
 const journal=await assertPostgresqlGraphRestoreJournal(value,backupRoot);
 let ctx=assertRestoreStageContext(await postgresqlGraphRestoreStageContext(journal,backupRoot),journal);const release=await acquireConfigOperationLease(path.join(ctx.root,ctx.journalId+'.lock'));let custody:FileHandle|undefined;
 try{
  const locked=assertRestoreStageContext(await postgresqlGraphRestoreStageContext(journal,backupRoot),journal);if(!sameStage(ctx,locked))fail();ctx=locked;await assertPostgresqlGraphRestoreJournal(journal,backupRoot);
  if(await validate()!==true)fail();const validated=assertRestoreStageContext(await postgresqlGraphRestoreStageContext(journal,backupRoot),journal);if(!sameStage(ctx,validated))fail();ctx=validated;
  const operationRoot=path.join(ctx.root,ctx.journalId+'.swap');await mkdir(operationRoot,{mode:0o700});custody=await open(operationRoot,constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW);const ownedCustody=custody,custodyIdentity=await ownedCustody.stat();if(custodyIdentity.uid!==process.getuid?.()||(custodyIdentity.mode&0o777)!==0o700)fail();
  const child=(name:string)=>`/proc/self/fd/${ownedCustody.fd}/${name}`;
  async function checkBinding(){await assertPostgresqlGraphRestoreJournal(journal,backupRoot);const current=assertRestoreStageContext(await postgresqlGraphRestoreRecoveryContext(journal,backupRoot),journal);if(!sameStage(ctx,current))fail();}
  async function checkCustody(){const actual=await ownedCustody.stat(),named=await lstat(operationRoot);if(!actual.isDirectory()||!named.isDirectory()||named.isSymbolicLink()||actual.dev!==custodyIdentity.dev||actual.ino!==custodyIdentity.ino||named.dev!==actual.dev||named.ino!==actual.ino||actual.uid!==process.getuid?.()||(actual.mode&0o777)!==0o700)fail();}
  const rows=ctx.body.files.filter(changed).map(row=>({path:row.path,undoName:'.tastedev-pg-undo-'+randomUUID(),originalMoved:false,candidateLinked:false,candidatePlaced:false,originalRestored:false,candidateRetired:false}));
  const data:SwapData={format:'postgresql-graph-swap-v3',journalId:ctx.journalId,journalVersion:ctx.journalVersion,stageVersion:ctx.stageVersion,target:ctx.body.target,phase:'applying',rows};let ledgerVersion:string|null=null;
  async function save(){validatePostgresqlGraphSwapProgress(data,ctx);await checkBinding();await checkCustody();const bytes=Buffer.from(JSON.stringify({data,digest:hash(JSON.stringify(data))}));if(bytes.length>262144)fail();const temporary='.progress-'+randomUUID(),fd=await open(child(temporary),constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);try{await fd.writeFile(bytes);await fd.sync();}finally{await fd.close();}try{await checkBinding();await checkCustody();if(ledgerVersion!==null){const current=await read(child('progress.json'));if(!current||current.version!==ledgerVersion)fail();await rename(child(temporary),child('progress.json'));}else{await link(child(temporary),child('progress.json'));await unlink(child(temporary));}await ownedCustody.sync();ledgerVersion=hash(bytes);}catch(error){await unlink(child(temporary)).catch(()=>{});throw error;}}
  await save();const rootFd=await open(ctx.root,constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW);try{await rootFd.sync();}finally{await rootFd.close();}
  async function withParent<T>(row:RestoreFileRow|undefined,run:(parent:Awaited<ReturnType<typeof pinPostgresqlStageDirectory>>)=>Promise<T>){if(!row)fail();const parent=await pinPostgresqlStageDirectory(ctx.body,ctx.stages.directories,path.dirname(row.path));try{await parent.verify();return await run(parent);}finally{await parent.close();}}
  async function verifyFiles(kind:'before'|'after'){
   for(const row of ctx.body.files)await withParent(row,async parent=>{const actual=await read(parent.child(path.basename(row.path))),expected=row[kind];if(!expected.present){if(actual)fail();}else{const recorded=kind==='before'?beforeIdentity(row):ctx.stages.files.find(entry=>entry.path===row.path)?.identity??beforeIdentity(row);if(!matches(actual,expected,recorded))fail();}await parent.verify();});
   for(const [name,original] of ctx.body.memberships){const parent=await pinPostgresqlStageDirectory(ctx.body,ctx.stages.directories,name);try{const names=[];for(const entry of await readdir(parent.directory,{withFileTypes:true})){if(entry.name.startsWith('.')||!entry.name.endsWith('.conf')||entry.isDirectory())continue;if(!entry.isFile()||entry.isSymbolicLink()||names.length>=100)fail();names.push(entry.name);}const expected=new Set(original);if(kind==='after')for(const row of ctx.body.files)if(path.dirname(row.path)===name&&!path.basename(row.path).startsWith('.')&&row.path.endsWith('.conf')){if(row.after.present)expected.add(path.basename(row.path));else expected.delete(path.basename(row.path));}const sorted=(value:Iterable<string>)=>[...value].sort((a,b)=>Buffer.compare(Buffer.from(a),Buffer.from(b)));if(!same(sorted(names),sorted(expected)))fail();await parent.verify();}finally{await parent.close();}}
  }
  async function rollbackPreflight(){
   await checkBinding();await checkCustody();const present=new Map<string,boolean>();
   for(const row of ctx.body.files)await withParent(row,async parent=>{
    const state=rows.find(value=>value.path===row.path),stage=ctx.stages.files.find(value=>value.path===row.path),actual=await read(parent.child(path.basename(row.path)),Boolean(state?.candidateLinked&&!state.candidatePlaced));present.set(row.path,Boolean(actual));
    if(state?.candidateLinked&&!state.candidateRetired&&await stat(parent.child('.tastedev-pg-retired-'+ctx.journalId+'-'+rows.indexOf(state))))fail();
    if(!state||!state.originalMoved&&!state.candidateLinked){
     if(row.before.present?!matches(actual,row.before,beforeIdentity(row)):actual)fail();
    }else{
     if(state.originalMoved&&!matches(await read(parent.child(state.undoName)),row.before,beforeIdentity(row)))fail();
     if(state.candidateLinked){
      if(!stage||!matches(actual,row.after,stage.identity))fail();
      if(!state.candidatePlaced){const alias=await read(parent.child(stage.name),true);if(alias){if(!matches(alias,row.after,stage.identity)||alias.identity.dev!==actual.identity.dev||alias.identity.ino!==actual.identity.ino||alias.identity.nlink!==2||actual.identity.nlink!==2)fail();}else if(actual.identity.nlink!==1)fail();}
     }else if(actual)fail();
    }
    if(stage&&!state?.candidateLinked){const candidate=await read(parent.child(stage.name));if(!candidate||!same(candidate.identity,stage.identity)||candidate.version!==stage.version||!same(candidate.attributes,stage.attributes))fail();}
    await parent.verify();
   });
   for(const [name,original] of ctx.body.memberships){const parent=await pinPostgresqlStageDirectory(ctx.body,ctx.stages.directories,name);try{const names=[];for(const entry of await readdir(parent.directory,{withFileTypes:true})){if(entry.name.startsWith('.')||!entry.name.endsWith('.conf')||entry.isDirectory())continue;if(!entry.isFile()||entry.isSymbolicLink()||names.length>=100)fail();names.push(entry.name);}const expected=new Set(original);for(const row of ctx.body.files)if(path.dirname(row.path)===name&&!path.basename(row.path).startsWith('.')&&row.path.endsWith('.conf')){if(present.get(row.path))expected.add(path.basename(row.path));else expected.delete(path.basename(row.path));}const sorted=(values:Iterable<string>)=>[...values].sort((a,b)=>Buffer.compare(Buffer.from(a),Buffer.from(b)));if(!same(sorted(names),sorted(expected)))fail();await parent.verify();}finally{await parent.close();}}
  }
  async function rollback(){await rollbackPreflight();data.phase='rolling-back';await save();
   for(let index=rows.length-1;index>=0;index--){await checkBinding();const state=rows[index],row=ctx.body.files.find(value=>value.path===state.path),stage=ctx.stages.files.find(value=>value.path===state.path);if(!row)fail();if(!state.originalMoved&&!state.candidateLinked)continue;
    if(!row)fail();
    await withParent(row,async parent=>{const target=parent.child(path.basename(row.path)),undo=parent.child(state.undoName);
     if(state.candidateLinked&&!state.candidateRetired){if(!stage)fail();
      // A second link is only allowed when both reviewed candidate names match.
      if(!state.candidatePlaced){const targetStat=await stat(target),stageStat=await stat(parent.child(stage.name));if(!targetStat||targetStat.dev!==stage.identity.dev||targetStat.ino!==stage.identity.ino)fail();if(stageStat){if(stageStat.dev!==targetStat.dev||stageStat.ino!==targetStat.ino||targetStat.nlink!==2||stageStat.nlink!==2)fail();await unlink(parent.child(stage.name));await parent.sync();}else if(targetStat.nlink!==1)fail();state.candidatePlaced=true;await save();}
      const actual=await read(target);if(!matches(actual,row.after,stage.identity))fail();const retired=parent.child('.tastedev-pg-retired-'+ctx.journalId+'-'+index);if(await stat(retired))fail();await parent.verify();await rename(target,retired);await parent.sync();await ownedCustody.sync();await parent.verify();if(!matches(await read(retired),row.after,stage.identity))fail();state.candidateRetired=true;await save();
     }
     if(state.originalMoved&&!state.originalRestored){if(await stat(target))fail();if(!matches(await read(undo),row.before,beforeIdentity(row)))fail();await parent.verify();await link(undo,target);await parent.sync();const targetStat=await lstat(target),undoStat=await lstat(undo);if(targetStat.dev!==beforeIdentity(row).dev||targetStat.ino!==beforeIdentity(row).ino||targetStat.nlink!==2||undoStat.dev!==targetStat.dev||undoStat.ino!==targetStat.ino)fail();await unlink(undo);await parent.sync();state.originalRestored=true;await save();}
     await parent.verify();
    });
   }
   await verifyFiles('before');await checkBinding();await actions.reactivate();await checkBinding();if(await actions.verify({rollback:true})!==true)fail();await verifyFiles('before');data.phase='rolled-back';await save();
  }
  try{
   for(const state of rows){await checkBinding();const row=ctx.body.files.find(value=>value.path===state.path),stage=ctx.stages.files.find(value=>value.path===state.path);
    if(!row)fail();
    await withParent(row,async parent=>{const target=parent.child(path.basename(row.path)),undo=parent.child(state.undoName);const current=await read(target);if(row.before.present){if(!current||!same(current.identity,beforeIdentity(row))||current.version!==row.before.version||!same(current.attributes,row.before.attributes)||await stat(undo))fail();}else if(current)fail();
     if(stage){const candidate=await read(parent.child(stage.name));if(!candidate||!same(candidate.identity,stage.identity)||candidate.version!==stage.version||!same(candidate.attributes,stage.attributes))fail();}
     await save();await parent.verify();
     if(row.before.present){await rename(target,undo);state.originalMoved=true;await parent.sync();await save();await parent.verify();if(!matches(await read(undo),row.before,beforeIdentity(row)))fail();}
     if(row.after.present){if(!stage)fail();if(await stat(target))fail();await link(parent.child(stage.name),target);state.candidateLinked=true;await parent.sync();await save();const targetStat=await lstat(target),stageStat=await lstat(parent.child(stage.name));if(targetStat.dev!==stage.identity.dev||targetStat.ino!==stage.identity.ino||stageStat.dev!==targetStat.dev||stageStat.ino!==targetStat.ino||targetStat.nlink!==2||stageStat.nlink!==2)fail();await unlink(parent.child(stage.name));await parent.sync();if(!matches(await read(target),row.after,stage.identity))fail();state.candidatePlaced=true;await save();}
     await parent.verify();
    });
   }
   await verifyFiles('after');data.phase='activating';await save();await actions.activate();await checkBinding();if(await actions.verify({rollback:false})!==true)fail();await verifyFiles('after');data.phase='committed';await save();return {journalId:ctx.journalId,phase:'committed',changedFiles:rows.length,operatingConfigurationChanged:rows.length>0,serviceCoordinatorInvoked:true,intentPreserved:true};
  }catch(error){try{await rollback();}catch(rollbackError){throw Object.assign(Error('PostgreSQL 여러 파일 복원 기록을 확인하세요.'),{status:409,rollbackComplete:false,journalId:ctx.journalId,cause:rollbackError});}throw Object.assign(Error('PostgreSQL 여러 파일 복원 기록을 확인하세요.'),{status:409,rollbackComplete:true,journalId:ctx.journalId,cause:error});}
 }finally{await custody?.close();await release();}
}
