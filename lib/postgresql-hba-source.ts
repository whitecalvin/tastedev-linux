import type {Stats} from 'node:fs';
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {lstat} from 'node:fs/promises';
import {execFile} from './admin-native-exec.ts';
import {promisify} from 'node:util';
import path from 'node:path';
import {readLiveConfig} from './config-live.ts';
const exec=promisify(execFile);
// Internal root helper; optional roots/uid are fixture hooks, never HTTP fields.
export async function readPostgresqlHba(input:unknown,{base='/etc',ownerUid}:{base?:string;ownerUid?:number}={}){
 const fail:()=>never=()=>{throw Object.assign(Error('접속 규칙 파일을 안전하게 읽을 수 없습니다.'),{status:400});};
 if(!object(input)||Object.keys(input).some(key=>key!=='path')||typeof input.path!=='string'||!/^\/etc\/postgresql\/\d+\/[a-zA-Z0-9_-]+\/pg_hba\.conf$/.test(input.path))fail();
 if(ownerUid===undefined){const binary=await lstat('/usr/bin/id');if(!binary.isFile()||binary.isSymbolicLink()||binary.uid!==0||(binary.mode&0o022))fail();const {stdout}=await exec('/usr/bin/id',['-u','postgres'],{timeout:5000,maxBuffer:64,env:{NODE_ENV:process.env.NODE_ENV,PATH:'/usr/bin:/bin',LC_ALL:'C'}});if(typeof stdout!=='string'||!/^\d+\s*$/.test(stdout))fail();ownerUid=Number(stdout.trim());}
 const file=path.join(base,input.path.slice(5)),before=await lstat(file);const safe=(stat:Stats)=>stat.isFile()&&!stat.isSymbolicLink()&&[0,ownerUid].includes(stat.uid)&&stat.nlink===1&&!(stat.mode&0o022)&&stat.size<=262144;
 if(!safe(before))fail();const result=await readLiveConfig('postgresql',input.path,base),after=await lstat(file);if(!safe(after)||(['dev','ino','size','mtimeMs','ctimeMs'] as const).some(key=>before[key]!==after[key]))fail();return result;
}
