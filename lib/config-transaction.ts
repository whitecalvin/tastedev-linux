import type {Stats} from 'node:fs';
import type {ConfigJournal,ConfigFileIdentity} from './config-journal.ts';
import {hasErrorCode} from './error-code.ts';
type Owners = number|undefined|(number|undefined)[];
type FileSnapshot = {content: Buffer;version: string;stat: Stats};
type JournalSnapshot = Awaited<ReturnType<typeof readConfigJournal>>;
type Hook = ()=>unknown|Promise<unknown>;
export type ConfigTransactionOptions = {file: string;backupRoot: string;version: unknown;transform: (text: string)=>unknown|Promise<unknown>;validate: (file: string)=>unknown|Promise<unknown>;activate: Hook;recover: Hook;beforeCommit?: Hook;validationSuffix?: string;configurationUid?: number;backupKind?: 'postgresql'|null;backupContext?: unknown};
export type ConfigRecoveryOptions = {file: string;backupRoot: string;confirm: unknown;beforeRecovery: (record: ConfigJournal)=>unknown|Promise<unknown>;validate: (file: string)=>unknown|Promise<unknown>;recover: (record: ConfigJournal)=>unknown|Promise<unknown>;validationSuffix?: string;configurationUid?: number};
const object=(value: unknown): value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {open,lstat,rename,unlink} from 'node:fs/promises';
import {createConfigJournal,readConfigJournal,clearConfigJournal,assertConfigJournalClear} from './config-journal.ts';
import {acquireConfigOperationLease} from './config-operation-lease.ts';
import {constants} from 'node:fs';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
const hash=(buffer: Buffer)=>createHash('sha256').update(buffer).digest('hex');
const fail: (message: string,status?: number)=>never=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const owned=(stat: Stats,uid: Owners)=>Array.isArray(uid)?uid.includes(stat.uid):stat.uid===uid;
async function directory(dir: string,uid: Owners){
 const resolved=path.resolve(dir);let current=path.parse(resolved).root;
 for(const part of resolved.slice(current.length).split(path.sep).filter(Boolean)){
  current=path.join(current,part);const stat=await lstat(current);
  if(!stat.isDirectory()||stat.isSymbolicLink())fail('Unsafe configuration directory');
 }
 const stat=await lstat(resolved);if(!owned(stat,uid)||(stat.mode&0o022))fail('Configuration directory must be owned by the executing account and not writable by other users');
}
async function read(file: string,uid: Owners): Promise<FileSnapshot>{
 const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{const stat=await handle.stat();if(!stat.isFile()||stat.nlink!==1||!owned(stat,uid)||(stat.mode&0o022)||stat.size>262144)fail('Unsafe configuration file');
 const buffer=Buffer.alloc(262145);let bytesRead=0;while(bytesRead<buffer.length){const value=await handle.read(buffer,bytesRead,buffer.length-bytesRead,null);if(!value.bytesRead)break;bytesRead+=value.bytesRead;}if(bytesRead>262144)fail('Configuration file too large');
 const after=await handle.stat(),named=await lstat(file);if((['dev','ino','uid','gid','mode','nlink','size','mtimeMs','ctimeMs'] as const).some(key=>stat[key]!==after[key]||stat[key]!==named[key]))fail('Configuration changed while reading',409);
 const content=buffer.subarray(0,bytesRead);if(content.includes(0))fail('Configuration must not contain NUL');try{new TextDecoder('utf-8',{fatal:true}).decode(content);}catch{fail('Configuration must contain valid UTF-8');}return {content,version:hash(content),stat};
 }finally{await handle.close();}
}
async function stage(file: string,content: Buffer,stat: Pick<Stats,'uid'|'gid'|'mode'>,suffix=''){
 const temp=path.join(path.dirname(file),'.tastedev-config-'+randomUUID()+suffix);
 const handle=await open(temp,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);
 try{await handle.writeFile(content);await handle.chown(stat.uid,stat.gid);await handle.chmod(stat.mode&0o777);await handle.sync();}
 catch(error){await unlink(temp).catch(()=>{});throw error;}
 finally{await handle.close();}
 return temp;
}
async function replace(file: string,content: Buffer,expected: FileSnapshot,uid: Owners,beforeRename?: (identity: ConfigFileIdentity,temp: string)=>unknown|Promise<unknown>){
 const temp=await stage(file,content,expected.stat);let replaced=false;
 try{
  const current=await read(file,uid);
  if(current.version!==expected.version||current.stat.ino!==expected.stat.ino||current.stat.dev!==expected.stat.dev)fail('Configuration changed before replacement',409);
  if(beforeRename)await beforeRename(identity(await lstat(temp)),path.basename(temp));
  const latest=await read(file,uid);if(latest.version!==expected.version||latest.stat.ino!==expected.stat.ino||latest.stat.dev!==expected.stat.dev)fail('Configuration changed before replacement',409);
  await rename(temp,file);replaced=true;
  const dir=await open(path.dirname(file),constants.O_RDONLY);try{await dir.sync();}finally{await dir.close();}
 }catch(error){if(replaced&&object(error))error.replacementOccurred=true;throw error;}finally{await unlink(temp).catch(error=>{if(!hasErrorCode(error,'ENOENT'))throw error;});}
}
function identity(stat: Pick<Stats,'dev'|'ino'|'uid'|'gid'|'mode'>): ConfigFileIdentity{return {dev:stat.dev,ino:stat.ino,uid:stat.uid,gid:stat.gid,mode:stat.mode&0o777};}
async function finishJournal(file: string,journal: JournalSnapshot|undefined,root: string){try{await clearConfigJournal(file,journal,root);return true;}catch{return false;}}
// Internal primitive: callers must independently allowlist target paths and gate privilege.
// No command strings, logs or raw configuration are returned. Backups may contain secrets.
export async function configTransaction({file,backupRoot,version,transform,validate,activate,recover,beforeCommit=async()=>{},validationSuffix='',configurationUid,backupKind=null,backupContext=null}: ConfigTransactionOptions){
 if(typeof file!=='string'||!path.isAbsolute(file)||path.resolve(file)!==file||typeof backupRoot!=='string'||!path.isAbsolute(backupRoot)||path.resolve(backupRoot)!==backupRoot||typeof version!=='string'||!/^[a-f0-9]{64}$/.test(version)||![transform,validate,activate,recover,beforeCommit].every(fn=>typeof fn==='function'))fail('Invalid configuration transaction');
 if(!['','.service'].includes(validationSuffix))fail('Invalid validation suffix');
 if(configurationUid!==undefined&&(!Number.isSafeInteger(configurationUid)||configurationUid<0)||![null,'postgresql'].includes(backupKind))fail('Invalid trusted configuration ownership policy');
 let context: unknown=null;if(backupContext!==null){if(backupKind!=='postgresql'||typeof backupContext!=='object'||Array.isArray(backupContext))fail('Invalid trusted backup context');try{const encoded=JSON.stringify(backupContext);if(Buffer.byteLength(encoded)>16384)fail('Invalid trusted backup context');context=JSON.parse(encoded);}catch{fail('Invalid trusted backup context');}}
 const uid=process.getuid?.(),fileUid=configurationUid===undefined?uid:[uid,configurationUid];await directory(path.dirname(file),fileUid);await directory(backupRoot,uid);
 if(path.dirname(path.resolve(file))===path.resolve(backupRoot))fail('Backups must use a separate private directory');
 const backupStat=await lstat(backupRoot);if(backupStat.mode&0o077)fail('Backup directory must be private');
 const release=await acquireConfigOperationLease(file+'.tastedev-lock');
 let backupId: string|null=null,replaced=false;
 try{
  await assertConfigJournalClear(file,backupRoot);
  const original=await read(file,fileUid);if(original.version!==version)fail('Configuration changed; inspect it again',409);
  const text=await transform(original.content.toString('utf8'));
  if(typeof text!=='string'||text.includes('\0')||Buffer.byteLength(text)>262144)fail('Invalid replacement configuration');
  const candidate=Buffer.from(text);if(hash(candidate)===original.version)return {changed:false,version:original.version};
  // Validate the complete candidate before changing the operational file.
  const candidateFile=await stage(file,candidate,original.stat,validationSuffix);
  try{const before=await read(candidateFile,fileUid);await validate(candidateFile);const after=await read(candidateFile,fileUid);if(before.version!==hash(candidate)||after.version!==before.version||after.stat.ino!==before.stat.ino||after.stat.dev!==before.stat.dev)fail('Configuration changed during validation',409);}catch(error){if(object(error)&&error.status===409)fail('Configuration changed during validation',409);fail('Configuration validation failed');}finally{await unlink(candidateFile);}
  backupId=randomUUID();const backup=await open(path.join(backupRoot,backupId+'.json'),constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);
  try{await backup.writeFile(JSON.stringify({id:backupId,...(backupKind?{kind:backupKind}:{}),...(context?{context}:{}),target:file,createdAt:new Date().toISOString(),version:original.version,text:original.content.toString('utf8')}));await backup.sync();}finally{await backup.close();}
  const backupDirectory=await open(backupRoot,constants.O_RDONLY);try{await backupDirectory.sync();}finally{await backupDirectory.close();}
  await beforeCommit();
  let journal: JournalSnapshot|undefined;try{await replace(file,candidate,original,fileUid,async(stagedIdentity,temp)=>{await createConfigJournal({kind:'configuration-transaction-v1',target:file,backupId,originalVersion:original.version,draftVersion:hash(candidate),originalIdentity:identity(original.stat),stagedIdentity,temp},backupRoot);journal=await readConfigJournal(file,backupRoot);});replaced=true;}catch(error){if(object(error)&&error.replacementOccurred)return {changed:true,failed:true,restored:false,recovered:false,backupId,reason:'Configuration replacement occurred but durability was not confirmed; inspect the file and backup'};throw error;}
  const applied=await read(file,fileUid);
  if(applied.version!==hash(candidate))return {changed:true,failed:true,restored:false,recovered:false,backupId,reason:'Configuration changed after replacement; inspect it before service activation'};
  try{await activate();const current=await read(file,fileUid);if(current.version!==applied.version||current.stat.ino!==applied.stat.ino||current.stat.dev!==applied.stat.dev)return {changed:true,failed:true,restored:false,recovered:false,backupId,reason:'Configuration changed during activation; interrupted record preserved'};const journalCleanupVerified=await finishJournal(file,journal,backupRoot);return {changed:true,backupId,version:applied.version,journalCleanupVerified};}
  catch{
   // Never overwrite an external edit made while activation was running.
   try{await replace(file,original.content,applied,fileUid);}catch{ return {changed:true,failed:true,restored:false,recovered:false,backupId,reason:'Activation failed; configuration restoration requires manual review'}; }
   try{await recover();const current=await read(file,fileUid);if(current.version!==original.version)fail('Configuration changed during recovery',409);const journalCleanupVerified=await finishJournal(file,journal,backupRoot);return {changed:false,failed:true,restored:true,recovered:true,backupId,version:original.version,journalCleanupVerified};}
   catch{return {changed:false,failed:true,restored:true,recovered:false,backupId,version:original.version,reason:'Original configuration restored; service recovery failed'};}
  }
 }catch(error){if(replaced)throw Object.assign(new Error('Configuration transaction failed after replacement; inspect the service and backup'),{status:500,backupId});throw error;}
 finally{await release();}
}

async function journalBackup(file: string,root: string,record: ConfigJournal,uid: number|undefined){
 await directory(root,uid);if((await lstat(root)).mode&0o077)fail('Backup directory must be private');
 const handle=await open(path.join(root,record.backupId+'.json'),constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{
  const before=await handle.stat(),safe=(stat: Stats)=>stat.isFile()&&stat.nlink===1&&stat.uid===uid&&(stat.mode&0o777)===0o600&&stat.size<=1600000;if(!safe(before))fail('Unsafe interrupted configuration backup');
  const bytes=Buffer.alloc(1600001);let length=0;while(length<bytes.length){const value=await handle.read(bytes,length,bytes.length-length,null);if(!value.bytesRead)break;length+=value.bytesRead;}
  const after=await handle.stat(),named=await lstat(path.join(root,record.backupId+'.json'));if(length>1600000||!safe(after)||!safe(named)||(['dev','ino','uid','gid','mode','size','mtimeMs','ctimeMs'] as const).some(key=>before[key]!==after[key]||before[key]!==named[key]))fail('Interrupted configuration backup changed',409);
  let backup: unknown;try{backup=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,length)));}catch{fail('Invalid interrupted configuration backup');}
  if(!object(backup)||backup.id!==record.backupId||backup.target!==file||backup.version!==record.originalVersion||typeof backup.text!=='string'||backup.text.includes('\0')||Buffer.byteLength(backup.text)>262144||hash(Buffer.from(backup.text))!==record.originalVersion)fail('Interrupted configuration backup does not match');return Buffer.from(backup.text);
 }finally{await handle.close();}
}
// Internal recovery primitive, deliberately not a generic HTTP action. Each
// package must supply current native validation, scope/identity checks and its
// own recovery transport after explicit operator confirmation.
export async function recoverConfigTransaction({file,backupRoot,confirm,beforeRecovery,validate,recover,validationSuffix='',configurationUid}: ConfigRecoveryOptions){
 if(typeof file!=='string'||!path.isAbsolute(file)||path.resolve(file)!==file||typeof backupRoot!=='string'||!path.isAbsolute(backupRoot)||path.resolve(backupRoot)!==backupRoot||confirm!==true||![beforeRecovery,validate,recover].every(value=>typeof value==='function')||!['','.service'].includes(validationSuffix))fail('Confirmed package-specific configuration recovery is required');
 if(configurationUid!==undefined&&(!Number.isSafeInteger(configurationUid)||configurationUid<0))fail('Invalid trusted configuration ownership policy');
 const uid=process.getuid?.(),fileUid=configurationUid===undefined?uid:[uid,configurationUid];await directory(path.dirname(file),fileUid);await directory(backupRoot,uid);const release=await acquireConfigOperationLease(file+'.tastedev-lock');
 try{
  const journal=await readConfigJournal(file,backupRoot);if(!journal)return {changed:false,recoveryRequired:false};const record=journal.record,content=await journalBackup(file,backupRoot,record,uid),current=await read(file,fileUid);
  const original=current.version===record.originalVersion&&(['uid','gid','mode'] as const).every(key=>identity(current.stat)[key]===record.originalIdentity[key]);
  const draft=current.version===record.draftVersion&&JSON.stringify(identity(current.stat))===JSON.stringify(record.stagedIdentity);
  if(!original&&!draft)fail('Configuration changed after interruption; existing file and backup preserved',409);
  await beforeRecovery(record);
  const candidate=await stage(file,content,record.originalIdentity,validationSuffix);
  try{const before=await read(candidate,fileUid);await validate(candidate);const after=await read(candidate,fileUid);if(before.version!==record.originalVersion||after.version!==before.version||after.stat.ino!==before.stat.ino||after.stat.dev!==before.stat.dev)fail('Configuration changed during validation',409);}catch{fail('Original configuration validation failed');}finally{await unlink(candidate);}
  await beforeRecovery(record);
  if(draft)try{await replace(file,content,current,fileUid);}catch(error){if(object(error)&&error.replacementOccurred)return {changed:false,failed:true,restored:true,recovered:false,backupId:record.backupId,version:record.originalVersion,recoveryRequired:true,durabilityVerified:false};throw error;}
  await beforeRecovery(record);const beforeActivation=await read(file,fileUid);if(beforeActivation.version!==record.originalVersion||(!draft&&(beforeActivation.stat.ino!==current.stat.ino||beforeActivation.stat.dev!==current.stat.dev)))fail('Configuration changed before recovery activation',409);
  try{await recover(record);}catch{return {changed:false,failed:true,restored:true,recovered:false,backupId:record.backupId,version:record.originalVersion,recoveryRequired:true};}
  const final=await read(file,fileUid);if(final.version!==record.originalVersion||(['uid','gid','mode'] as const).some(key=>identity(final.stat)[key]!==record.originalIdentity[key]))fail('Configuration changed during recovery; interrupted record preserved',409);
  const temp=path.join(path.dirname(file),record.temp);try{const stat=await lstat(temp);if(stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1&&JSON.stringify(identity(stat))===JSON.stringify(record.stagedIdentity))await unlink(temp);else fail('Interrupted configuration staging file requires review',409);}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}
  const journalCleanupVerified=await finishJournal(file,journal,backupRoot);
  return {changed:false,restored:true,recovered:true,backupId:record.backupId,version:record.originalVersion,recoveryRequired:!journalCleanupVerified,journalCleanupVerified};
 }finally{await release();}
}
