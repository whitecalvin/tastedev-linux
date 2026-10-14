import {hasErrorCode} from './error-code.ts';
export type PostgresqlClusterService = {unit: string;ActiveState: string;SubState: string;LoadState: string;UnitFileState?: string;error?: string};
type ClusterRunner = (binary: string,args: string[],options: {timeout: number;maxBuffer: number;encoding: 'utf8'})=>Promise<{stdout: string}>;
const object=(value: unknown): value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {readdir,lstat} from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const execute=promisify(execFile);
export function postgresqlClusterUnit(file: unknown){
 const match=/^\/etc\/postgresql\/([0-9]{1,255})\/([a-zA-Z0-9_-]{1,255})\/(?:postgresql|pg_hba)\.conf$/.exec(typeof file==='string'?file:'');
 if(!match)throw Object.assign(Error('허용된 운영 설정 파일을 선택하세요.'),{status:400});
 return 'postgresql@'+match[1]+'-'+match[2]+'.service';
}
export async function postgresqlClusterStatuses(files: {path: string}[],run: ClusterRunner=execute): Promise<PostgresqlClusterService[]>{
 const units=[...new Set(files.map(file=>postgresqlClusterUnit(file.path)))];
 if(!units.length)return [];
 if(units.length>100)throw Error('Too many PostgreSQL clusters');
 let stdout='',failed=false,diagnostic='서비스 상태를 확인할 수 없습니다.';
 try{({stdout}=await run('/usr/bin/systemctl',['show',...units,'--property=Id,ActiveState,SubState,LoadState,UnitFileState','--no-pager'],{timeout:5000,maxBuffer:131072,encoding:'utf8'}));}
 catch(error){
  failed=true;
  // A normal nonzero result may contain complete observations for other units.
  // Timeout, signal and transport failures do not provide a completed snapshot.
  const detail=object(error)?error:{};
  const interrupted=detail.killed||detail.code==='ETIMEDOUT'||detail.signal;
  stdout=!interrupted&&Number.isInteger(detail.code)&&typeof detail.stdout==='string'?detail.stdout:'';
  diagnostic=detail.killed||detail.code==='ETIMEDOUT'?'서비스 상태 조회 시간이 초과되었습니다. 잠시 후 다시 갱신하세요.':detail.signal?'서비스 상태 조회가 중단되었습니다. 잠시 후 다시 갱신하세요.':['EACCES','EPERM'].includes(typeof detail.code==='string'?detail.code:'')?'서비스 상태를 조회할 권한이 없습니다. 서버 실행 계정의 권한을 확인하세요.':'서비스 상태를 확인할 수 없습니다.';
 }
 const observed=new Map<string,PostgresqlClusterService>();
 for(const block of stdout.trim().split(/\n\s*\n/)){
  const values=Object.fromEntries(block.split('\n').filter(line=>line.includes('=')).map(line=>{const at=line.indexOf('=');return [line.slice(0,at),line.slice(at+1)];}));
  if(units.includes(values.Id)&&values.ActiveState&&values.SubState&&values.LoadState)observed.set(values.Id,{unit:values.Id,ActiveState:values.ActiveState,SubState:values.SubState,LoadState:values.LoadState,UnitFileState:values.UnitFileState});
 }
 return units.map(unit=>observed.get(unit)??{unit,ActiveState:'unknown',SubState:'unknown',LoadState:'unknown',...(failed?{error:diagnostic}:{})});
}

// Only registered Debian-style cluster configuration directories are listed.
export async function discoverPostgresqlClusters(root='/etc/postgresql'){
 const directory=async (location: string)=>{const stat=await lstat(location);if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('Unsafe PostgreSQL cluster directory');const names=await readdir(location,{withFileTypes:true});if(names.length>1000)throw Error('Too many PostgreSQL directory entries');return names;};
 let versions;try{versions=await directory(root);}catch(error){if(hasErrorCode(error,'ENOENT'))return [];throw error;}
 const files: {path: string}[]=[];
 for(const version of versions.sort((a,b)=>a.name.localeCompare(b.name))){
  if(!version.isDirectory()||! /^[1-9][0-9]?$/.test(version.name))continue;
  const versionPath=path.join(root,version.name);
  for(const cluster of (await directory(versionPath)).sort((a,b)=>a.name.localeCompare(b.name))){
   if(!cluster.isDirectory()||! /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,254}$/.test(cluster.name))continue;
   const clusterPath=path.join(versionPath,cluster.name);await directory(clusterPath);
   const file=path.join(clusterPath,'postgresql.conf');let stat;try{stat=await lstat(file);}catch(error){if(hasErrorCode(error,'ENOENT'))continue;throw error;}
   if(!stat.isFile()||stat.isSymbolicLink())continue;
   if(files.length>=100)throw Error('Too many PostgreSQL clusters');
   files.push({path:'/etc/postgresql/'+version.name+'/'+cluster.name+'/postgresql.conf'});
  }
 }
 return files;
}
