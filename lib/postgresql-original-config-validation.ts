import {postgresqlWorkDirectory} from './postgresql-work-directory.ts';
import {mkdir,writeFile,lstat,rm} from 'node:fs/promises';
import path from 'node:path';
import {assertPostgresqlGraphRestoreJournal,postgresqlGraphRestoreJournalBody} from './postgresql-graph-restore-journal.ts';
import {inspectPostgresqlConfiguration} from './postgresql-config-inspect.ts';
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 원래 설정 검수를 확인하세요.'),{status:409});};
// Reconstruct only recorded original include sources. Host files are never
// substituted for missing original evidence or a failed namespace check.
export async function inspectPostgresqlOriginalConfiguration(journal:unknown,backupRoot:string,options:Parameters<typeof inspectPostgresqlConfiguration>[1]={}){
 await assertPostgresqlGraphRestoreJournal(journal,backupRoot);
 const body=postgresqlGraphRestoreJournalBody(journal),original=body.beforeGraph;
 if(original?.complete!==true)fail();
 const base=await postgresqlWorkDirectory('tastedev-pg-original-'),allocated=await lstat(base);
 try{
  for(const entry of original.files){
   const row=body.files.find(row=>row.path===entry.path);
   if(!row?.before.present||row.before.version!==entry.version)fail();
   const file=path.join(base,entry.path.slice(5));
   await mkdir(path.dirname(file),{recursive:true,mode:0o700});await writeFile(file,row.before.text,{mode:0o600,flag:'wx'});
  }
  for(const directory of original.directories)await mkdir(path.join(base,directory.path.slice(5)),{recursive:true,mode:0o700});
  const result=await inspectPostgresqlConfiguration(body.target,{...options,base,ownerUid:process.getuid?.()});
  const directories=original.directories.map(({path,names,version})=>({path,names,version}));
  if(!same(result.files,original.files)||!same(result.directories,directories)||!same(result.missing,original.missing))fail();
  await assertPostgresqlGraphRestoreJournal(journal,backupRoot);
  return {...result,source:'private-journal-original-config',originalGraphVersion:original.version};
 }finally{
  const current=await lstat(base);
  if(!current.isDirectory()||current.isSymbolicLink()||current.dev!==allocated.dev||current.ino!==allocated.ino||current.uid!==allocated.uid)fail();
  await rm(base,{recursive:true,force:true});
 }
}
