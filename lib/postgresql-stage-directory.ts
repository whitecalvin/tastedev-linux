import type {Stats} from 'node:fs';
import type {FileHandle} from 'node:fs/promises';
import type {ConfigFileIdentity} from './config-journal.ts';
export type StageDirectoryBody={base:string;baseIdentity:ConfigFileIdentity;directories:[string,ConfigFileIdentity|null][]};
export type CreatedStageDirectory={path:string;identity?:{dev:number;ino:number}|null;uid:number;gid:number;mode:number};
import path from 'node:path';
import {open,lstat} from 'node:fs/promises';
import {constants} from 'node:fs';

const identity=(stat:Pick<Stats,'dev'|'ino'|'uid'|'gid'|'mode'>)=>({dev:stat.dev,ino:stat.ino,uid:stat.uid,gid:stat.gid,mode:stat.mode&0o777});
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 복원 임시 파일 기록을 확인하세요.'),{status:409});};

// Keep every ancestor open: O_NOFOLLOW on the leaf alone cannot pin its parents.
export async function pinPostgresqlStageDirectory(body:StageDirectoryBody,created:CreatedStageDirectory[],logical:unknown){
 if(typeof process.getuid!=='function')fail();const callerUid=process.getuid();
 if(typeof logical!=='string'||!logical.startsWith('/etc/')||path.normalize(logical)!==logical)fail();
 const destination=path.join(body.base,logical.slice(5)),handles:{fd:FileHandle;name:string;identity:ConfigFileIdentity|null}[]=[];
 async function close(){for(const item of handles.splice(0).reverse())await item.fd.close();}
 async function verify(){for(const item of handles){const actual=await item.fd.stat(),named=await lstat(item.name);if(!actual.isDirectory()||!named.isDirectory()||named.isSymbolicLink()||!same(identity(actual),item.identity)||!same(identity(named),item.identity))fail();}}
 try{
  let name='/';
  for(const part of ['',...destination.split('/').filter(Boolean)]){
   if(part)name=path.join(name,part);
   const parent=handles.at(-1),fd=await open(parent?`/proc/self/fd/${parent.fd.fd}/${part}`:'/',constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW);
   const item:{fd:FileHandle;name:string;identity:ConfigFileIdentity|null}={fd,name,identity:null};handles.push(item);const stat=await fd.stat();item.identity=identity(stat);
   if(!stat.isDirectory())fail();
   if(name===body.base){if(!same(item.identity,body.baseIdentity))fail();}
   else if(name.startsWith(body.base+'/')){
    const logicalName='/etc/'+path.relative(body.base,name),record=body.directories.find(([key])=>key===logicalName);
    if(!record)fail();
    if(record[1]){if(!same(item.identity,record[1]))fail();}
    else{const prepared=created.find(dir=>dir.path===logicalName);if(!prepared?.identity||stat.dev!==prepared.identity.dev||stat.ino!==prepared.identity.ino||stat.uid!==prepared.uid||stat.gid!==prepared.gid||(stat.mode&0o777)!==prepared.mode)fail();}
   }else if(![0,callerUid].includes(stat.uid)||(stat.mode&0o022)&&!(stat.uid===0&&(stat.mode&0o1000)))fail();
  }
  await verify();const last=handles.at(-1);if(!last)fail();const leaf=last.fd;
  return {directory:`/proc/self/fd/${leaf.fd}`,child(name:unknown){if(typeof name!=='string'||!name||name==='.'||name==='..'||name.includes('/')||name.includes('\0'))fail();return `/proc/self/fd/${leaf.fd}/${name}`;},verify,sync:()=>leaf.sync(),close};
 }catch(error){await close();throw error;}
}
