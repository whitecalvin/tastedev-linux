// Standalone helper backup routines with existing privileged runtime bindings.
declare const fs:typeof import('node:fs'),path:typeof import('node:path'),BASE:string;
declare function fail(message:string,status?:number):never;
declare function rootDir(dir:string):void;
declare function hash(text:string|Buffer):string;
type MariaBackup={id:string;target:string;text:string;version:string;createdAt:string;[key:string]:unknown};
type MariaCatalogItem={id:string;kind:'mariadb';target:string;createdAt:string;bytes:number;version:string};
function helperDatabaseErrorCode(error:unknown,code:string):boolean{return error!==null&&typeof error==='object'&&'code' in error&&error.code===code;}
function helperMariaBackupValid(value:unknown,id:string):value is MariaBackup{
 if(value===null||typeof value!=='object'||Array.isArray(value))return false;
 return 'id' in value&&value.id===id&&'text' in value&&typeof value.text==='string'&&!value.text.includes('\0')&&Buffer.byteLength(value.text)<=262144&&'version' in value&&value.version===hash(value.text)&&'target' in value&&typeof value.target==='string'&&/^\/etc\/mysql\/(?:my\.cnf|mariadb\.cnf|(?:conf\.d|mariadb\.conf\.d)\/[A-Za-z0-9_-][A-Za-z0-9_.-]*\.cnf)$/.test(value.target)&&'createdAt' in value&&typeof value.createdAt==='string'&&Number.isFinite(Date.parse(value.createdAt));
}
export function mariaBackupRoot():string{
 rootDir(BASE);const dir=path.join(BASE,'mariadb');
 try{fs.mkdirSync(dir,{mode:0o700});}catch(error){if(!helperDatabaseErrorCode(error,'EEXIST'))throw error;}
 rootDir(dir);if(fs.lstatSync(dir).mode&0o077)fail('MariaDB backups must be private');return dir;
}
export function redisBackupRoot():string{
 rootDir(BASE);const dir=path.join(BASE,'redis');
 try{fs.mkdirSync(dir,{mode:0o700});}catch(error){if(!helperDatabaseErrorCode(error,'EEXIST'))throw error;}
 rootDir(dir);if(fs.lstatSync(dir).mode&0o077)fail('Redis backups must be private');return dir;
}
export function mariaBackupRecord(id:unknown):MariaBackup{
 if(typeof id!=='string'||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(id))fail('Invalid MariaDB backup ID');
 const dir=path.join(BASE,'mariadb');rootDir(dir);if(fs.lstatSync(dir).mode&0o077)fail('MariaDB backups must be private');
 const file=path.join(dir,id+'.json'),fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);let data:unknown;
 try{
  const stat=fs.fstatSync(fd);
  if(!stat.isFile()||stat.uid!==0||stat.nlink!==1||(stat.mode&0o077)||stat.size>2097152)fail('Unsafe MariaDB backup');
  data=JSON.parse(fs.readFileSync(fd,'utf8'));
 }finally{fs.closeSync(fd);}
 if(!helperMariaBackupValid(data,id))fail('Invalid MariaDB backup');return data;
}
export function mariaBackups(){
 const dir=path.join(BASE,'mariadb');
 try{rootDir(dir);}catch(error){if(helperDatabaseErrorCode(error,'ENOENT'))return {backups:[],warnings:0,truncated:false};throw error;}
 if(fs.lstatSync(dir).mode&0o077)fail('MariaDB backups must be private');
 const names=fs.readdirSync(dir).filter(name=>/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}\.json$/.test(name)),backups:MariaCatalogItem[]=[];let warnings=0;
 for(const name of names.slice(0,1000)){
  try{const record=mariaBackupRecord(name.slice(0,-5));backups.push({id:record.id,kind:'mariadb',target:record.target,createdAt:record.createdAt,bytes:Buffer.byteLength(record.text),version:record.version});}
  catch{warnings++;}
 }
 backups.sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
 return {backups:backups.slice(0,100),warnings,truncated:names.length>1000||backups.length>100};
}
