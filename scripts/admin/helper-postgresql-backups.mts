// Standalone implementation embedded in the privileged helper.
declare const fs:typeof import('node:fs'),path:typeof import('node:path'),BASE:string;
declare function fail(message:string,status?:number):never;
declare function rootDir(dir:string):void;
declare function hash(text:string|Buffer):string;
declare const pgRead:typeof import('./helper-postgresql-files.mts').pgRead;
declare const pgApply:typeof import('./helper-postgresql-files.mts').pgApply;
declare function mariaRuntime():Promise<{postgresqlRecoveryBackup:typeof import('../../lib/postgresql-recovery-backup.ts').postgresqlRecoveryBackup}>;
type Input=Readonly<Record<string,unknown>>;
type PgBackup={id:string;kind:'postgresql';target:string;text:string;version:string;createdAt:string;context?:unknown;[key:string]:unknown};
type CatalogItem={id:string;kind:'postgresql';target:string;createdAt:string;bytes:number;version:string};
function helperPgBackupObject(value:unknown):value is Record<string,unknown>{return value!==null&&typeof value==='object'&&!Array.isArray(value);}
function helperPgBackupValid(value:unknown,id:string):value is PgBackup{
 return helperPgBackupObject(value)&&value.id===id&&value.kind==='postgresql'&&typeof value.text==='string'&&!value.text.includes('\0')&&Buffer.byteLength(value.text)<=262144&&value.version===hash(value.text)&&typeof value.target==='string'&&/^\/etc\/postgresql\/([1-9][0-9]?)\/([a-zA-Z0-9][a-zA-Z0-9_-]*)\/postgresql\.conf$/.test(value.target)&&typeof value.createdAt==='string'&&Number.isFinite(Date.parse(value.createdAt));
}
export function pgBackupRecord(id:unknown):PgBackup{
 if(typeof id!=='string'||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(id))fail('Invalid PostgreSQL backup ID');
 const dir=path.join(BASE,'postgresql');rootDir(dir);
 if(fs.lstatSync(dir).mode&0o077)fail('PostgreSQL backups must be private');
 const file=path.join(dir,id+'.json'),stat=fs.lstatSync(file);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1||stat.uid!==0||(stat.mode&0o077)||stat.size>2097152)fail('Unsafe PostgreSQL backup');
 const data:unknown=JSON.parse(fs.readFileSync(file,'utf8'));
 if(!helperPgBackupValid(data,id))fail('Invalid PostgreSQL backup');
 return data;
}
export function pgPublicValues(text:string):Record<string,string>{
 const values:Record<string,string>={},allowed=new Set(['port','max_connections','shared_buffers','work_mem','logging_collector']);
 for(const line of text.split(/\r?\n/)){
  const match=/^\s*([a-z_]+)\s*=\s*(.*?)\s*(?:#.*)?$/.exec(line);
  if(!match||!allowed.has(match[1]))continue;
  const value=match[2].replace(/^'(.*)'$/,'$1');delete values[match[1]];
  if(match[1]==='logging_collector'){if(/^(on|off)$/i.test(value))values[match[1]]=value.toLowerCase();}
  else if(/^[0-9]+(?:[kmg]b)?$/i.test(value))values[match[1]]=value;
 }
 return values;
}
export function pgRestorePlan(input:Input){
 const record=pgBackupRecord(input.id),current=pgRead(record.target),before=pgPublicValues(current.text),after=pgPublicValues(record.text);
 return {id:record.id,target:record.target,version:current.version,backupVersion:record.version,createdAt:record.createdAt,changed:current.version!==record.version,codeRestoreAvailable:helperPgBackupObject(record.context)&&record.context.version===1,
  fields:[...new Set([...Object.keys(before),...Object.keys(after)])].map(key=>({key,before:before[key]??null,after:after[key]??null})),
  notice:'지원 항목만 표시하지만 복원은 선택한 백업의 전체 설정 파일을 교체하고 클러스터를 재시작합니다.'};
}
export function pgRestore(input:Input){
 if(input.confirm!==true||typeof input.backupVersion!=='string')fail('PostgreSQL restore confirmation required');
 const record=pgBackupRecord(input.id);if(record.version!==input.backupVersion)fail('PostgreSQL backup changed');
 return pgApply({path:record.target,version:input.version,confirm:true,changes:{port:5432}},record.text);
}
export async function pgBackups(input:Input={}){
 if(input.path!==undefined&&(typeof input.path!=='string'||!/^\/etc\/postgresql\/[1-9][0-9]?\/[a-zA-Z0-9][a-zA-Z0-9_-]{0,254}\/postgresql\.conf$/.test(input.path)))fail('Invalid PostgreSQL backup path');
 const dir=path.join(BASE,'postgresql');
 try{rootDir(dir);}catch(error){if(error!==null&&typeof error==='object'&&'code' in error&&error.code==='ENOENT')return {backups:[],warnings:0,truncated:false};throw error;}
 if(fs.lstatSync(dir).mode&0o077)fail('PostgreSQL backups must be private');
 const names=fs.readdirSync(dir).filter(name=>/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}\.json$/.test(name));
 let warnings=0;const backups:CatalogItem[]=[];
 for(const name of names.slice(0,1000)){
  try{
   const file=path.join(dir,name),stat=fs.lstatSync(file);
   if(!stat.isFile()||stat.isSymbolicLink()||![1,2].includes(stat.nlink)||stat.uid!==0||(stat.mode&0o077)||stat.size>2097152)throw Error('Unsafe PostgreSQL backup');
   const parsed:unknown=JSON.parse(fs.readFileSync(file,'utf8'));
   if(!helperPgBackupValid(parsed,name.slice(0,-5)))throw Error('Invalid PostgreSQL backup');
   let record:PgBackup=parsed;
   if(stat.nlink===2){const runtime=await mariaRuntime();record=await runtime.postgresqlRecoveryBackup(record.id,dir,record.target);}
   if(input.path!==undefined&&record.target!==input.path)continue;
   backups.push({id:record.id,kind:'postgresql',target:record.target,createdAt:record.createdAt,bytes:Buffer.byteLength(record.text),version:record.version});
  }catch{warnings++;}
 }
 backups.sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
 return {backups:backups.slice(0,100),warnings,truncated:names.length>1000||backups.length>100};
}
