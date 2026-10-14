export type RedisGraphFile={path:string;version:string;bytes:number};
export type RedisTopology={root:string;files:RedisGraphFile[];directories:{path:string;version:string}[];edges:{from:string;line:number;to:string;targets?:string[]}[];warnings:{path:string;line?:number;reason:string}[];complete:boolean;version:string;notice:string};
import {open,lstat,readdir} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
const permitted=(value:unknown):value is string=>typeof value==='string'&&value.startsWith('/etc/redis/')&&value.slice(11).split('/').every(part=>/^[a-zA-Z0-9_][a-zA-Z0-9_.-]*$/.test(part))&&value.endsWith('.conf');
// Structural metadata only. Incomplete graphs cannot authorize application.
export async function redisTopology(root='/etc/redis/redis.conf',base='/etc/redis',overrides:ReadonlyMap<string,string>=new Map()):Promise<RedisTopology>{
 if(root!=='/etc/redis/redis.conf')throw Object.assign(new Error('허용된 Redis main 설정을 선택하세요.'),{status:400});
 const files=new Map<string,RedisGraphFile>(),directories=new Map<string,{path:string;version:string}>(),edges:RedisTopology['edges']=[],warnings:RedisTopology['warnings']=[];let visits=0,total=0;
 const warn=(target:string,line:number|null,reason:string)=>warnings.push({path:target,...(line?{line}:{}),reason});
 async function safe(target:string){
  let location=base;const parent=await lstat(location);if(!parent.isDirectory()||parent.isSymbolicLink())throw Error();
  for(const part of target.slice(11).split('/').filter(Boolean)){location=path.join(location,part);if((await lstat(location)).isSymbolicLink())throw Error();}
  return location;
 }
 async function visit(target:string,stack:string[]=[]){
  if(++visits>300||stack.length>=16){warn(target,null,'include 검사 한도를 초과했습니다.');return;}
  if(stack.includes(target)){warn(target,null,'include 순환 연결을 발견했습니다.');return;}
  let text:string;
  try{
   const location=await safe(target);if(!(await lstat(location)).isFile())throw Error();
   const handle=await open(location,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
   try{
    const stat=await handle.stat();if(!stat.isFile()||stat.nlink!==1||stat.size>262144)throw Error();
    const buffer=Buffer.alloc(262145),{bytesRead}=await handle.read(buffer,0,buffer.length,0);if(bytesRead>262144)throw Error();
    let content:Buffer;if(overrides.has(target)){const changed=overrides.get(target);if(typeof changed!=='string')throw Error();content=Buffer.from(changed);}else content=buffer.subarray(0,bytesRead);if(content.length>262144)throw Error();text=new TextDecoder('utf-8',{fatal:true}).decode(content);if(text.includes('\0'))throw Error();
    const entry={path:target,version:hash(content),bytes:content.length};
    if(!files.has(target)){total+=content.length;if(files.size>=100||total>1048576)throw Error();}else if(files.get(target)?.version!==entry.version)throw Error();
    files.set(target,entry);
   }finally{await handle.close();}
  }catch{warn(target,null,'설정 파일을 안전하게 읽을 수 없습니다.');return;}
  const lines=text.split(/\r?\n/);
  for(let index=0;index<lines.length;index++){
   const line=lines[index].trim();if(!/^include(?:\s|$)/i.test(line))continue;
   if(edges.length>=300){warn(target,index+1,'include 검사 한도를 초과했습니다.');break;}
   // Support literal paths and the common directory/*.conf pattern. Other
   // wildcards and escapes require native resolution, never an assumption.
   const match=/^include\s+(?:"([^"\\]+)"|'([^'\\]+)'|([^\s"'\\]+))\s*$/i.exec(line),destination=match&&(match[1]||match[2]||match[3]);
   if(destination?.endsWith('/*.conf')){
    const dir=destination.slice(0,-7);
    if(dir!=='/etc/redis'&&!permitted(dir+'/placeholder.conf')){warn(target,index+1,'지원하지 않는 include 경로 또는 구문입니다.');continue;}
    try{
     const location=await safe(dir);if(!(await lstat(location)).isDirectory())throw Error();
     const all=await readdir(location);if(all.length>1000)throw Error();
     const names=all.filter(name=>!name.startsWith('.')&&name.endsWith('.conf')).sort();
     if(names.length>100||names.some(name=>!permitted(dir+'/'+name)))throw Error();
     const version=hash(JSON.stringify(names));if(directories.has(dir)&&directories.get(dir)?.version!==version)throw Error();
     directories.set(dir,{path:dir,version});
     const targets=names.map(name=>dir+'/'+name);edges.push({from:target,line:index+1,to:destination,targets});
     for(const included of targets)await visit(included,[...stack,target]);
    }catch{warn(target,index+1,'include 디렉터리를 안전하게 읽을 수 없습니다.');}
    continue;
   }
   if(!permitted(destination)){warn(target,index+1,'지원하지 않는 include 경로 또는 구문입니다.');continue;}
   edges.push({from:target,line:index+1,to:destination});await visit(destination,[...stack,target]);
  }
 }
 await visit(root);
 // Recheck membership after traversal: a file added while reading an earlier
 // include must not produce a falsely complete structural snapshot.
 for(const [dir,entry] of directories){
  try{
   const location=await safe(dir),all=await readdir(location);if(all.length>1000)throw Error();
   const names=all.filter(name=>!name.startsWith('.')&&name.endsWith('.conf')).sort();
   if(hash(JSON.stringify(names))!==entry.version)throw Error();
  }catch{warn(dir,null,'검사 중 include 디렉터리 목록이 변경되었거나 읽을 수 없습니다.');}
 }
 const entries=[...files.values()].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
 const directoryEntries=[...directories.values()].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
 return {root,files:entries,directories:directoryEntries,edges,warnings,complete:warnings.length===0,version:hash(JSON.stringify({files:entries,directories:directoryEntries,edges})),notice:'Redis main의 include 파일과 디렉터리 목록만 조회합니다. 서버의 glob 정렬·실행 인수·실행 중 변경·최종 설정값은 별도 확인해야 합니다.'};
}

// Internal precommit gate. Client metadata is never trusted as file content.
export async function assertRedisGraphVersion(version:unknown,base='/etc/redis'){
 if(typeof version!=='string'||!/^[a-f0-9]{64}$/.test(version))throw Object.assign(new Error('Redis include graph inspection is required'),{status:400});
 const graph=await redisTopology('/etc/redis/redis.conf',base);
 if(!graph.complete||graph.version!==version)throw Object.assign(new Error('Redis include graph changed; inspect it again'),{status:409});
 return graph;
}
