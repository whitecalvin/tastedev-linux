export type RedisCandidate = Readonly<{directory:string;main:string;version:string;candidateVersion:string;restoreVersion:string|null;changes:Readonly<Record<string,unknown>>;cleanup:()=>Promise<void>}>;
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {open,lstat,mkdir,writeFile,rm,readdir} from 'node:fs/promises';
import {constants} from 'node:fs';
import {redisWorkDirectory} from './redis-work-directory.ts';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {assertRedisGraphVersion,redisTopology} from './redis-topology.ts';
import {patchConfig} from './config-patch.ts';
const snapshots=new WeakMap<RedisCandidate,string>(),registered=new WeakSet<object>(),keys=new Set(['port','connections','maxMemory','eviction','appendOnly','fsync']);
const fail:(message:string,status?:number)=>never=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
export const isRedisCandidate=(value:unknown):value is RedisCandidate=>Boolean(value&&typeof value==='object'&&registered.has(value));
async function snapshot(directory:string){
 const entries:([string,'directory',string[]]|[string,'file',string])[]=[];let count=0;
 async function visit(relative:string){
  if(++count>1000)fail('Redis candidate changed',409);
  const location=path.join(directory,relative),stat=await lstat(location);
  if(stat.isSymbolicLink()||(!stat.isDirectory()&&!stat.isFile()))fail('Redis candidate changed',409);
  if(stat.isDirectory()){
   if((stat.mode&0o777)!==0o700)fail('Redis candidate changed',409);
   const names=(await readdir(location)).sort();entries.push([relative,'directory',names]);
   for(const name of names)await visit(path.join(relative,name));
  }else{
   if(stat.nlink!==1||stat.size>262144||(stat.mode&0o777)!==0o600)fail('Redis candidate changed',409);
   const handle=await open(location,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
   try{const opened=await handle.stat();if(!opened.isFile()||opened.ino!==stat.ino||opened.dev!==stat.dev)fail('Redis candidate changed',409);
    const bytes=Buffer.alloc(262145),{bytesRead}=await handle.read(bytes,0,bytes.length,0);if(bytesRead>262144)fail('Redis candidate changed',409);
    entries.push([relative,'file',hash(bytes.subarray(0,bytesRead))]);
   }finally{await handle.close();}
  }
 }
 await visit('');return hash(JSON.stringify(entries));
}
export async function assertRedisCandidate(candidate:unknown){
 if(!isRedisCandidate(candidate))fail('Unregistered Redis candidate',409);
 try{if(await snapshot(candidate.directory)!==snapshots.get(candidate))fail('Redis candidate changed',409);}
 catch{fail('Redis candidate changed',409);}
 return candidate;
}
// Internal only: candidate paths and raw content must never leave the helper.
export async function redisCandidate({version,changes,restoreText}:{version:string;changes:unknown;restoreText?:string},base='/etc/redis'){
 const restoring=restoreText!==undefined;
 if(!object(changes)||(!restoring&&!Object.keys(changes).length)||Object.keys(changes).some(key=>!keys.has(key))||(restoring&&Object.keys(changes).length))fail('Select supported Redis configuration changes');
 if(restoring&&(typeof restoreText!=='string'||Buffer.byteLength(restoreText)>262144||restoreText.includes('\0')))fail('Invalid Redis restore text');
 const original=await assertRedisGraphVersion(version,base),overrides=new Map(restoring?[[original.root,restoreText]]:[]);
 const graph=restoring?await redisTopology(original.root,base,overrides):original,texts=new Map<string,string>();
 if(!graph.complete)fail('Resolve restored Redis include connections');
 for(const file of graph.files){
  let location=base;if((await lstat(location)).isSymbolicLink())fail('Redis main directory changed',409);
  for(const part of file.path.slice(11).split('/')){location=path.join(location,part);if((await lstat(location)).isSymbolicLink())fail('Redis include link changed',409);}
  if(!(await lstat(location)).isFile())fail('Redis include is not a regular file');
  const handle=await open(location,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
  try{
   const stat=await handle.stat();if(!stat.isFile()||stat.nlink!==1||stat.size>262144)fail('Unsafe Redis configuration');
   const buffer=Buffer.alloc(262145),{bytesRead}=await handle.read(buffer,0,buffer.length,0),content=buffer.subarray(0,bytesRead);
   const expected=restoring&&file.path===graph.root?original.files.find(item=>item.path===graph.root)?.version:file.version;
   if(bytesRead>262144||hash(content)!==expected)fail('Redis configuration changed',409);
   let text:string;try{text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(content);}catch{fail('Redis configuration must be UTF-8');}
   texts.set(file.path,file.path===graph.root?(restoring?restoreText:patchConfig('redis',text,changes)):text);
  }finally{await handle.close();}
 }
 const directory=await redisWorkDirectory('tastedev-redis-candidate-');let result:RedisCandidate|undefined;
 const cleanup=async()=>{if(result){registered.delete(result);snapshots.delete(result);}await rm(directory,{recursive:true,force:true});};
 const local=(logical:string)=>path.join(directory,logical.slice(11));
 try{
  if(!/^\/[a-zA-Z0-9_./-]+$/.test(directory))fail('Unsupported Redis candidate directory');
  for(const dir of graph.directories)await mkdir(local(dir.path),{recursive:true,mode:0o700});
  for(const [logical,text] of texts){
   const lines=(text.match(/[^\r\n]*(?:\r\n|\n|$)/g)??[]).filter(Boolean);
   const rewritten=new Set<number>();
   for(const edge of graph.edges.filter(edge=>edge.from===logical)){
    if(rewritten.has(edge.line))continue;rewritten.add(edge.line);
    const original=lines[edge.line-1],ending=original.endsWith('\r\n')?'\r\n':original.endsWith('\n')?'\n':'';
    lines[edge.line-1]='include "'+local(edge.to)+'"'+ending;
   }
   const target=local(logical);await mkdir(path.dirname(target),{recursive:true,mode:0o700});await writeFile(target,lines.join(''),{flag:'wx',mode:0o600});
  }
  await assertRedisGraphVersion(version,base);
  if(restoring){const latest=await redisTopology(original.root,base,overrides);if(!latest.complete||latest.version!==graph.version)fail('Redis restored include graph changed',409);}
  result=Object.freeze({directory,main:local(graph.root),version,candidateVersion:graph.version,restoreVersion:restoring?hash(Buffer.from(restoreText)):null,changes:Object.freeze({...changes}),cleanup});snapshots.set(result,await snapshot(directory));registered.add(result);return result;
 }catch(error){await cleanup();throw error;}
}
