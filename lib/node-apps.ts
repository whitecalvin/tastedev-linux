import type {NodeAppProfile} from './node-app-profile.ts';
import type {FileHandle} from 'node:fs/promises';
export type NodeAppRegistry = {apps: NodeAppProfile[]; version: string};
import {open,lstat,mkdir,rename,unlink} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';
import {stateRoot} from './runtime-paths.ts';
import {nodeAppProfile} from './node-app-profile.ts';
const digest=(apps: NodeAppProfile[])=>createHash('sha256').update(JSON.stringify(apps)).digest('hex');
const fail: (message: string,status?: number)=>never=(message,status=400)=>{throw Object.assign(Error(message),{status});};
const root=()=>path.join(stateRoot(),'node-apps');
async function directory(){await mkdir(root(),{recursive:true,mode:0o700});let current=path.parse(path.resolve(root())).root;for(const part of path.resolve(root()).slice(current.length).split(path.sep).filter(Boolean)){current=path.join(current,part);const component=await lstat(current);if(!component.isDirectory()||component.isSymbolicLink())fail('앱 등록 경로 권한을 확인하세요.',403);}const stat=await lstat(root());if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==process.getuid?.()||(stat.mode&0o077))fail('앱 등록 경로 권한을 확인하세요.',403);}
export async function nodeApps(): Promise<NodeAppRegistry>{
 await directory();let handle: FileHandle | undefined;
 try{handle=await open(path.join(root(),'apps.json'),constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);const stat=await handle.stat();if(!stat.isFile()||stat.nlink!==1||stat.uid!==process.getuid?.()||(stat.mode&0o077)||stat.size>65536)fail('앱 등록 파일을 확인하세요.',403);const buffer=Buffer.alloc(65537),{bytesRead}=await handle.read(buffer,0,buffer.length,0);if(bytesRead>65536)fail('앱 등록 파일을 확인하세요.');let data: unknown;try{data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buffer.subarray(0,bytesRead)));}catch{fail('앱 등록 파일을 확인하세요.');}if(!Array.isArray(data)||data.length>50)fail('앱 등록 파일을 확인하세요.');const rows: unknown[]=data;const apps=rows.map(nodeAppProfile);if(new Set(apps.map(app=>app.id)).size!==apps.length)fail('앱 등록 ID가 중복되었습니다.');return {apps,version:digest(apps)};}
 catch(error){if(error!==null&&typeof error==='object'&&'code' in error&&error.code==='ENOENT')return {apps:[],version:digest([])};throw error;}finally{await handle?.close();}
}
async function changeNodeApps(input: {version?: unknown},change: (apps: NodeAppProfile[])=>NodeAppProfile[]){
 if(process.getuid?.()===0)fail('앱 등록은 일반 사용자 권한으로 실행하세요.',403);await directory();let lock;const lockPath=path.join(root(),'apps.lock');try{lock=await open(lockPath,'wx',0o600);}catch{fail('다른 앱 등록 저장이 진행 중입니다.',409);}
 const temporary=path.join(root(),'.apps-'+randomUUID());try{const current=await nodeApps();if(current.version!==input.version)fail('앱 목록이 변경되었습니다. 다시 조회하세요.',409);const apps=change(current.apps).sort((a,b)=>a.id.localeCompare(b.id));if(apps.length>50)fail('앱은 최대 50개까지 등록할 수 있습니다.');if(Buffer.byteLength(JSON.stringify(apps))>65536)fail('앱 등록 목록의 크기 제한을 초과했습니다.');const file=await open(temporary,'wx',0o600);try{await file.writeFile(JSON.stringify(apps));await file.sync();}finally{await file.close();}await rename(temporary,path.join(root(),'apps.json'));return {apps,version:digest(apps)};}finally{await unlink(temporary).catch(()=>{});await lock.close();await unlink(lockPath);}
}

export async function saveNodeApp(input: {profile?: unknown; version?: unknown}){const profile=nodeAppProfile(input?.profile);return changeNodeApps(input,apps=>[...apps.filter(app=>app.id!==profile.id),profile]);}
export async function removeNodeApp(input: {confirm?: unknown; id?: unknown; version?: unknown}){
 if(input?.confirm!==true)fail('앱 등록 해제를 확인하세요.');
 if(typeof input.id!=='string'||!(/^[a-z][a-z0-9-]{0,39}$/).test(input.id))fail('등록한 앱을 선택하세요.');
 return changeNodeApps(input,apps=>{if(!apps.some(app=>app.id===input.id))fail('등록한 앱을 찾을 수 없습니다.',404);return apps.filter(app=>app.id!==input.id);});
}
