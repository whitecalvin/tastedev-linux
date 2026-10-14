import type {PostgresqlClusterService} from './postgresql-cluster-status.ts';
import type {ConfigValues,DatabaseConfigKind} from './config-schema.ts';
import {isDatabaseConfigKind} from './config-schema.ts';
import type {FileHandle} from 'node:fs/promises';
import {hasErrorCode} from './error-code.ts';
export type LiveConfigFile = {path: string;version: string|null;values: ConfigValues;warnings: string[];format?: string;groups?: string[];error?: string;service?: PostgresqlClusterService};
export type LiveConfigSnapshot = {kind: DatabaseConfigKind;configs: LiveConfigFile[];warnings: string[];notice: string};
import {postgresqlClusterStatuses,postgresqlClusterUnit} from './postgresql-cluster-status.ts';
import {createHash} from 'node:crypto';
import {readdir,lstat,open,realpath} from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {mariadbSettingGroups} from './mariadb-setting-groups.ts';
import {parseLiveConfig} from './config-value-parser.ts';
export {parseLiveConfig} from './config-value-parser.ts';
async function configBytes(file: string,base: string){
 const inspectParents=async()=>{let current=path.parse(path.resolve(file)).root;for(const part of path.dirname(path.resolve(file)).slice(current.length).split(path.sep).filter(Boolean)){current=path.join(current,part);const stat=await lstat(current);if(stat.isSymbolicLink()||!stat.isDirectory())throw Error('SYMLINK');}};
 await inspectParents();if(!path.resolve(file).startsWith(path.resolve(base)+path.sep))throw Error('PATH');
 const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{const before=await handle.stat();if(!before.isFile()||before.nlink!==1||before.size>262144)throw Error('SIZE');const buffer=Buffer.alloc(262145);let size=0;while(size<buffer.length){const {bytesRead}=await handle.read(buffer,size,buffer.length-size,size);if(!bytesRead)break;size+=bytesRead;}if(size>262144)throw Error('SIZE');await inspectParents();const after=await lstat(file);if(after.isSymbolicLink()||after.dev!==before.dev||after.ino!==before.ino||after.size!==before.size||after.mtimeMs!==before.mtimeMs||after.ctimeMs!==before.ctimeMs)throw Error('CHANGED');const content=buffer.subarray(0,size),text=new TextDecoder('utf-8',{fatal:true}).decode(content);if(text.includes('\0'))throw Error('ENCODING');return {text,version:createHash('sha256').update(content).digest('hex')};
 }finally{await handle.close();}
}
export async function liveConfig(kind: unknown,base='/etc'): Promise<LiveConfigSnapshot>{
 if(!isDatabaseConfigKind(kind))throw Object.assign(new Error('운영 설정 조회를 지원하는 패키지를 선택하세요.'),{status:400});
 const candidates: string[]=[],warnings: string[]=[];
 if(kind==='redis')candidates.push('redis/redis.conf');
 if(kind==='mariadb'){
  candidates.push('mysql/my.cnf','mysql/mariadb.cnf');
  for(const dir of ['mysql/mariadb.conf.d','mysql/conf.d'])try{for(const name of await readdir(path.join(base,dir)))if(/^[a-zA-Z0-9_.-]+\.cnf$/.test(name)&&!name.startsWith('.'))candidates.push(dir+'/'+name);}catch(e){if(!hasErrorCode(e,'ENOENT'))warnings.push('/etc/'+dir+': 설정 목록을 읽을 수 없습니다.');}
 }
 if(kind==='postgresql'){
  try{for(const version of await readdir(path.join(base,'postgresql'))){if(!/^\d+$/.test(version))continue;const dir=path.join(base,'postgresql',version);if(!(await lstat(dir)).isDirectory())continue;for(const cluster of await readdir(dir)){if(/^[a-zA-Z0-9_-]+$/.test(cluster)){candidates.push(`postgresql/${version}/${cluster}/postgresql.conf`);try{const hba=`postgresql/${version}/${cluster}/pg_hba.conf`;await lstat(path.join(base,hba));candidates.push(hba);}catch(error){if(!hasErrorCode(error,'ENOENT'))warnings.push('/etc/postgresql/'+version+'/'+cluster+'/pg_hba.conf: 설정 목록을 읽을 수 없습니다.');}}}}}catch(e){if(!hasErrorCode(e,'ENOENT'))warnings.push('PostgreSQL 설정 목록을 읽을 수 없습니다.');}
 }
 const configs: LiveConfigFile[]=[];
 for(const relative of candidates.sort().slice(0,100)){
  const target=path.join(base,relative);let handle: FileHandle|undefined;
  try{
   // Debian's my.cnf can be an alternatives alias of the separately listed
   // mariadb.cnf. Keep editing bound to that regular canonical file; never
   // follow an arbitrary link or add a duplicate source node.
   if(kind==='mariadb'&&relative==='mysql/my.cnf'&&(await lstat(target)).isSymbolicLink()){
    const canonical=path.join(base,'mysql/mariadb.cnf');
    if(await realpath(target)===path.resolve(canonical)){
     await configBytes(canonical,base);
     continue;
    }
   }
   let current=base;for(const part of relative.split('/')){current=path.join(current,part);if((await lstat(current)).isSymbolicLink())throw Error('SYMLINK');}
   const content=await configBytes(target,base);
   const hba=kind==='postgresql'&&relative.endsWith('/pg_hba.conf');const parsed=hba?{values:{},warnings:[],format:'hba'}:parseLiveConfig(kind,content.text);
   configs.push({path:'/etc/'+relative,version:content.version,...parsed,...(kind==='mariadb'?{groups:mariadbSettingGroups(content.text)}:{})});
  }catch(e){
   if(hasErrorCode(e,'EACCES')&&((kind==='postgresql'&&relative.endsWith('/pg_hba.conf'))||(kind==='redis'&&relative==='redis/redis.conf'))){
    // Discovery keeps the protected file selectable. Its source request reports
    // the missing permission/helper setup after selection, rather than showing
    // a generic safety failure before the user has opened any file.
    configs.push({path:'/etc/'+relative,...(kind==='postgresql'?{format:'hba'}:{}),values:{},warnings:['설정 파일을 읽을 권한이 없습니다.'],version:null,error:'EACCES'});
   }else if(!hasErrorCode(e,'ENOENT'))warnings.push('/etc/'+relative+': 설정 파일을 안전하게 읽을 수 없습니다.');
  }finally{await handle?.close();}
 }
 if(kind==='postgresql'){const states=await postgresqlClusterStatuses(configs);for(const file of configs)file.service=states.find(state=>state.unit===postgresqlClusterUnit(file.path));}
 return {kind,configs,warnings,notice:'지정 파일의 지원 항목만 읽습니다. include 파일과 실행 중인 서버의 최종 설정은 별도로 확인하세요.'};
}

// Only predefined operational config paths are accepted; base is a server-only fixture hook.
export async function readLiveConfig(kind: unknown,target: unknown,base='/etc'){
 const allowed: Record<DatabaseConfigKind,RegExp>={redis:/^\/etc\/redis\/redis\.conf$/,postgresql:/^\/etc\/postgresql\/\d+\/[a-zA-Z0-9_-]+\/(?:postgresql|pg_hba)\.conf$/,mariadb:/^\/etc\/mysql\/(?:my\.cnf|mariadb\.cnf|(?:mariadb\.conf\.d|conf\.d)\/[a-zA-Z0-9_][a-zA-Z0-9_.-]*\.cnf)$/};
 const fail: (message: string,status?: number)=>never=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
 if(!isDatabaseConfigKind(kind)||typeof target!=='string'||!allowed[kind].test(target))fail('허용된 운영 설정 파일을 선택하세요.');
 let current=base;for(const part of target.slice(5).split('/')){current=path.join(current,part);if((await lstat(current)).isSymbolicLink())fail('설정 파일의 심볼릭 링크는 지원하지 않습니다.');}
 try{return await configBytes(current,base);}catch(error){throw Object.assign(Error('설정 파일을 안전하게 읽을 수 없습니다.'),{status:hasErrorCode(error,'EACCES')?403:400});}
}

// Privileged Redis lookup has no caller-selected path or command.
export async function readRedisConfigSource(input: unknown,base='/etc'){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw Error('Redis 설정 조회에는 경로나 명령을 지정할 수 없습니다.');
 return readLiveConfig('redis','/etc/redis/redis.conf',base);
}
