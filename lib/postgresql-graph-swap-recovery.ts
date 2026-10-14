import type {Stats} from 'node:fs';
import type {FileHandle} from 'node:fs/promises';
import type {RestoreFileIdentity,RestoreFileAttributes,RestoreFileRow,RestoreBeforeSource,RestoreAfterSource} from './postgresql-graph-restore-snapshot.ts';
import type {SwapOptions} from './postgresql-graph-swap.ts';
import {hasErrorCode} from './error-code.ts';
import path from 'node:path';
import {open,lstat,readdir,rename,link,unlink} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {postgresqlGraphSwapProgressContext,assertPostgresqlGraphSwapProgress,assertPostgresqlGraphSwapIntent,validatePostgresqlGraphSwapProgress} from './postgresql-graph-swap-progress.ts';
import {pinPostgresqlStageDirectory} from './postgresql-stage-directory.ts';
import {acquireConfigOperationLease} from './config-operation-lease.ts';

const hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex'),same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 여러 파일 복원 기록을 확인하세요.'),{status:409});};
const identity=(stat:Stats):RestoreFileIdentity=>({dev:stat.dev,ino:stat.ino,uid:stat.uid,gid:stat.gid,mode:stat.mode,nlink:stat.nlink,size:stat.size,mtimeMs:stat.mtimeMs,ctimeMs:stat.ctimeMs});
const directory=(stat:Stats)=>({dev:stat.dev,ino:stat.ino,uid:stat.uid,gid:stat.gid,mode:stat.mode&0o777});
async function stat(file:string){try{return await lstat(file);}catch(error){if(hasErrorCode(error,'ENOENT'))return null;throw error;}}
async function read(file:string){const named=await stat(file);if(!named)return null;if(!named.isFile()||named.isSymbolicLink()||![1,2].includes(named.nlink)||named.size>262144)fail();const fd=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);try{const first=await fd.stat();if(!same(identity(first),identity(named)))fail();const bytes=Buffer.alloc(first.size+1);let size=0;while(size<bytes.length){const result=await fd.read(bytes,size,bytes.length-size,null);if(!result.bytesRead)break;size+=result.bytesRead;}if(size!==first.size||!same(identity(first),identity(await fd.stat()))||!same(identity(first),identity(await lstat(file))))fail();return {identity:identity(first),version:hash(bytes.subarray(0,size)),attributes:{uid:first.uid,gid:first.gid,mode:first.mode&0o777}};}finally{await fd.close();}}
type FileSnapshot={identity:RestoreFileIdentity;version:string;attributes:RestoreFileAttributes};
const matches=(actual:FileSnapshot|null,expected:RestoreBeforeSource|RestoreAfterSource,recorded:Pick<RestoreFileIdentity,'dev'|'ino'>|undefined)=>!!actual&&!!recorded&&expected.present&&actual.version===expected.version&&same(actual.attributes,expected.attributes)&&actual.identity.dev===recorded.dev&&actual.identity.ino===recorded.ino;
const alias=(a:FileSnapshot|null,b:FileSnapshot|null)=>!!a&&!!b&&a.identity.dev===b.identity.dev&&a.identity.ino===b.identity.ino&&a.identity.nlink===2&&b.identity.nlink===2;

// Internal recovery primitive. Native original-candidate validation and fixed
// service-state restoration are supplied by the coordinator, never web input.
export async function recoverPostgresqlGraphSwap(progress:unknown,{validate,reactivate,verify}:Pick<SwapOptions,'validate'|'reactivate'|'verify'>={}){
 if(typeof validate!=='function'||typeof reactivate!=='function'||typeof verify!=='function')fail();const actions={validate,reactivate,verify};const ctx=postgresqlGraphSwapProgressContext(progress);if(!['applying','activating','rolling-back','rolled-back'].includes(ctx.data.phase))fail();
 const release=await acquireConfigOperationLease(path.join(ctx.root,ctx.journalId+'.lock'));let custody:FileHandle|undefined;
 try{
  await assertPostgresqlGraphSwapProgress(progress);custody=await open(ctx.operationRoot,constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW);const ownedCustody=custody;const child=(name:string)=>`/proc/self/fd/${ownedCustody.fd}/${name}`;
  async function checkCustody(){const actual=await ownedCustody.stat(),named=await lstat(ctx.operationRoot);if(!actual.isDirectory()||!named.isDirectory()||named.isSymbolicLink()||!same(directory(actual),ctx.custodyIdentity)||!same(directory(named),ctx.custodyIdentity))fail();}
  let version=ctx.version,expectedIdentity=ctx.identity;const data=ctx.data;
  async function save(){validatePostgresqlGraphSwapProgress(data,ctx);await assertPostgresqlGraphSwapIntent(progress);await checkCustody();const current=await read(child('progress.json'));if(!current||current.identity.nlink!==1||current.version!==version||!same(current.identity,expectedIdentity))fail();
   const bytes=Buffer.from(JSON.stringify({data,digest:hash(JSON.stringify(data))}));if(bytes.length>262144)fail();const temporary='.recovery-progress-'+randomUUID(),fd=await open(child(temporary),constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);try{await fd.writeFile(bytes);await fd.sync();}finally{await fd.close();}
   try{const latest=await read(child('progress.json'));if(!latest||latest.version!==version||!same(latest.identity,expectedIdentity))fail();await rename(child(temporary),child('progress.json'));await ownedCustody.sync();const saved=await read(child('progress.json'));if(!saved||saved.version!==hash(bytes)||saved.identity.nlink!==1)fail();version=saved.version;expectedIdentity=saved.identity;}finally{await unlink(child(temporary)).catch(error=>{if(!hasErrorCode(error,'ENOENT'))throw error;});}
  }
  type Parent=Awaited<ReturnType<typeof pinPostgresqlStageDirectory>>;
  async function withParent<T>(row:RestoreFileRow|undefined,run:(parent:Parent)=>Promise<T>){if(!row)fail();const parent=await pinPostgresqlStageDirectory(ctx.body,ctx.stages.directories,path.dirname(row.path));try{await parent.verify();return await run(parent);}finally{await parent.close();}}
  const retiredPath=(index:number,parent:Parent)=>data.format==='postgresql-graph-swap-v3'?parent.child('.tastedev-pg-retired-'+ctx.journalId+'-'+index):child('retired-'+index);
  async function retiredFile(index:number,parent:Parent){
   const adjacent=await read(parent.child('.tastedev-pg-retired-'+ctx.journalId+'-'+index)),legacy=await read(child('retired-'+index));
   // Every valid location must retain the exact registered stage inode. A
   // legacy checkpoint upgrades before any source move, without moving evidence.
   if(adjacent&&legacy||data.format==='postgresql-graph-swap-v2'&&adjacent)fail();
   return adjacent||legacy;
  }
  async function observe(index:number,parent:Parent){const state=data.rows[index],row=ctx.body.files.find(row=>row.path===state.path),stage=ctx.stages.files.find(entry=>entry.path===state.path);if(!row)fail();const target=await read(parent.child(path.basename(row.path))),undo=await read(parent.child(state.undoName)),candidate=stage?await read(parent.child(stage.name)):null,retired=await retiredFile(index,parent);
   const before=matches(target,row.before,(row.before.present?row.before.identity:undefined)),after=stage&&matches(target,row.after,stage.identity);
   if(target&&!before&&!after||undo&&!matches(undo,row.before,(row.before.present?row.before.identity:undefined))||candidate&&(!stage||!matches(candidate,row.after,stage.identity))||retired&&(!stage||!matches(retired,row.after,stage.identity)||retired.identity.nlink!==1))fail();
   if(target?.identity.nlink===2&&!alias(target,before?undo:candidate)||undo?.identity.nlink===2&&!alias(undo,target)||candidate?.identity.nlink===2&&!alias(candidate,target))fail();
   if(row.before.present&&!before&&!undo||!row.before.present&&undo||retired&&after||retired&&candidate)fail();
   if(state.candidateLinked&&!after&&!retired)fail();
   if(after&&row.before.present&&!undo||undo&&target&&!before&&!after)fail();
   const moved=!!undo||!!before&&(state.originalMoved||!!retired),linked=!!after||!!retired,placed=!!retired||!!after&&!candidate;
   // A one-link candidate and a separate before target are valid only before
   // publication; unknown extra aliases never authorize deletion.
   if(candidate&&!after&&candidate.identity.nlink!==1||undo&&!before&&undo.identity.nlink!==1||target&&!alias(target,before?undo:candidate)&&target.identity.nlink!==1)fail();
   return {row,stage,target,undo,candidate,retired,before:!!before,after:!!after,restoreAlias:!!before&&!!undo,state:{...state,originalMoved:moved,candidateLinked:linked,candidatePlaced:placed,originalRestored:moved&&!!before&&!undo,candidateRetired:!!retired}};
  }
  async function checkMembership(targets:Map<string,boolean>){for(const [name,original] of ctx.body.memberships){const parent=await pinPostgresqlStageDirectory(ctx.body,ctx.stages.directories,name);try{const names=[];for(const entry of await readdir(parent.directory,{withFileTypes:true})){if(entry.name.startsWith('.')||!entry.name.endsWith('.conf')||entry.isDirectory())continue;if(!entry.isFile()||entry.isSymbolicLink()||names.length>=100)fail();names.push(entry.name);}const expected=new Set(original);for(const row of ctx.body.files)if(path.dirname(row.path)===name&&!path.basename(row.path).startsWith('.')&&row.path.endsWith('.conf')){if(targets.get(row.path))expected.add(path.basename(row.path));else expected.delete(path.basename(row.path));}const sorted=(values:Iterable<string>)=>[...values].sort((a,b)=>Buffer.compare(Buffer.from(a),Buffer.from(b)));if(!same(sorted(names),sorted(expected)))fail();await parent.verify();}finally{await parent.close();}}}
  async function inspect(){const observations:Awaited<ReturnType<typeof observe>>[]=[],targets=new Map<string,boolean>();for(const row of ctx.body.files){const index=data.rows.findIndex(value=>value.path===row.path);await withParent(row,async parent=>{if(index>=0){const observed=await observe(index,parent);observations[index]=observed;targets.set(row.path,!!observed.target);}else{const actual=await read(parent.child(path.basename(row.path)));if(row.before.present){if(!actual||!matches(actual,row.before,(row.before.present?row.before.identity:undefined))||actual.identity.nlink!==1)fail();}else if(actual)fail();targets.set(row.path,!!actual);}await parent.verify();});}await checkMembership(targets);return observations;}
  async function originalFiles(){const targets=new Map<string,boolean>();for(const row of ctx.body.files)await withParent(row,async parent=>{const actual=await read(parent.child(path.basename(row.path)));if(row.before.present){if(!actual||!matches(actual,row.before,(row.before.present?row.before.identity:undefined))||actual.identity.nlink!==1)fail();}else if(actual)fail();targets.set(row.path,!!actual);await parent.verify();});await checkMembership(targets);}
  // Preflight every target/undo/alias before any file mutation.
  let observed=await inspect();if(await validate()!==true)fail();await assertPostgresqlGraphSwapProgress(progress);observed=await inspect();
  if(data.phase==='rolled-back'){await originalFiles();if(await actions.verify({rollback:true})!==true)fail();await originalFiles();return {journalId:ctx.journalId,phase:'rolled-back',filesystemRecoveryVerified:true,serviceCoordinatorInvoked:false,intentPreserved:true};}
  if(data.format==='postgresql-graph-swap-v2')data.format='postgresql-graph-swap-v3';
  data.phase='rolling-back';data.rows=observed.map(value=>value.state);await save();
  for(let index=data.rows.length-1;index>=0;index--){await assertPostgresqlGraphSwapIntent(progress);await checkCustody();await withParent(ctx.body.files.find(row=>row.path===data.rows[index].path),async parent=>{
   const current=await observe(index,parent);data.rows[index]=current.state;await save();const state=data.rows[index],row=current.row,target=parent.child(path.basename(row.path)),undo=parent.child(state.undoName);
   if(current.after){if(!current.stage)fail();
    if(current.candidate){if(!alias(current.target,current.candidate))fail();await parent.verify();await unlink(parent.child(current.stage.name));await parent.sync();}
    const actual=await read(target);if(!actual||!matches(actual,row.after,current.stage.identity)||actual.identity.nlink!==1||await stat(retiredPath(index,parent)))fail();await parent.verify();await rename(target,retiredPath(index,parent));await parent.sync();await ownedCustody.sync();await parent.verify();if(!matches(await read(retiredPath(index,parent)),row.after,current.stage.identity))fail();state.candidatePlaced=true;state.candidateRetired=true;await save();
   }
   if(state.originalMoved&&!state.originalRestored){
    const original=await read(undo),actual=await read(target);if(actual){if(!actual||!matches(actual,row.before,(row.before.present?row.before.identity:undefined))||!matches(original,row.before,(row.before.present?row.before.identity:undefined))||!alias(actual,original))fail();}else{if(!original||!matches(original,row.before,(row.before.present?row.before.identity:undefined))||original.identity.nlink!==1)fail();await parent.verify();await link(undo,target);await parent.sync();const a=await read(target),b=await read(undo);if(!matches(a,row.before,(row.before.present?row.before.identity:undefined))||!alias(a,b))fail();}
    await parent.verify();await unlink(undo);await parent.sync();const restored=await read(target);if(!restored||!matches(restored,row.before,(row.before.present?row.before.identity:undefined))||restored.identity.nlink!==1)fail();state.originalRestored=true;await save();
   }
   await parent.verify();
  });}
  await originalFiles();await actions.reactivate();if(await actions.verify({rollback:true})!==true)fail();await originalFiles();data.phase='rolled-back';await save();return {journalId:ctx.journalId,phase:'rolled-back',filesystemRecoveryVerified:true,serviceCoordinatorInvoked:true,intentPreserved:true};
 }finally{await custody?.close();await release();}
}
