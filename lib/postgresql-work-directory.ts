import {mkdir,lstat,mkdtemp} from 'node:fs/promises';
import path from 'node:path';
const prefixes=new Set(['linux-pg-hba-','tastedev-pg-config-','tastedev-pg-original-','tastedev-pg-restore-','tastedev-pg-history-']);
export const postgresqlSandboxScratch='/mnt/data/build/tastedev-linux/postgresql-sandbox-scratch';
export function isPostgresqlWorkPath(value: unknown,prefix: string,{file=false}={}){
 if(!prefixes.has(prefix)||typeof value!=='string'||!/^\/mnt\/data\/build\/[a-zA-Z0-9_./-]+$/.test(value)||value.split('/').includes('..')||path.resolve(value)!==value)return false;
 const parts=value.split('/'),index=parts.findIndex(part=>part.startsWith(prefix));
 return index>=4&&new RegExp('^'+prefix+'[a-zA-Z0-9_-]+$').test(parts[index])&&(file?index<parts.length-1:index===parts.length-1);
}
export async function postgresqlWorkDirectory(prefix: string){
 if(!prefixes.has(prefix))throw Error('PostgreSQL 검수 작업 종류를 확인하세요.');
 const parent=process.env.TMPDIR||'/mnt/data/build/tastedev-linux';
 if(!/^\/mnt\/data\/build\/[a-zA-Z0-9_./-]+$/.test(parent)||parent.split('/').includes('..')||path.resolve(parent)!==parent)throw Error('PostgreSQL 검수 작업 경로를 확인하세요.');
 await mkdir(parent,{recursive:true,mode:0o700});const stat=await lstat(parent);
 if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==process.getuid?.()||(stat.mode&0o077))throw Error('PostgreSQL 검수 작업 경로 권한을 확인하세요.');
 return mkdtemp(path.join(parent,prefix));
}
