import type {RedisCandidate} from './redis-candidate.ts';
import type {RedisResource} from './redis-resource-review.ts';
export type RedisCandidateResourceReview={scope:string;files:number;resources:(RedisResource&{path:string})[];totalResources:number;unsupportedSyntax:number;truncated:boolean;resourceIsolationVerified:boolean};
import {opendir,open} from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {assertRedisCandidate} from './redis-candidate.ts';
import {redisResourceReview} from './redis-resource-review.ts';
const fail:()=>never=()=>{throw Object.assign(Error('Redis 후보 설정의 참조 파일·저장 경로와 검수 범위를 확인하세요.'),{status:409});};
const dataDirectories=new WeakMap<RedisCandidateResourceReview,readonly string[]>();
export function redisCandidateDataDirectories(review:RedisCandidateResourceReview){const value=dataDirectories.get(review);if(!value)fail();return value;}
// Inventory all copied candidate files. This is not a native syntax validator
// or proof that unknown directives cannot access external resources.
export async function redisCandidateResources(candidate:RedisCandidate){
 await assertRedisCandidate(candidate);const resources:(RedisResource&{path:string})[]=[],directories=new Set<string>();let entries=0,files=0,bytes=0,totalResources=0,unsupportedSyntax=0;
 async function visit(relative:string){
  for await(const entry of await opendir(path.join(candidate.directory,relative))){if(++entries>1000)fail();const nested=path.join(relative,entry.name);if(entry.isDirectory()){await visit(nested);continue;}if(!entry.isFile()||++files>100)fail();
   const handle=await open(path.join(candidate.directory,nested),constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);let text:string;
   try{const stat=await handle.stat();if(!stat.isFile()||stat.uid!==process.getuid?.()||stat.nlink!==1||(stat.mode&0o077)||stat.size>262144)fail();const buffer=Buffer.alloc(262145),{bytesRead}=await handle.read(buffer,0,buffer.length,0);if(bytesRead>262144||(bytes+=bytesRead)>1048576)fail();text=new TextDecoder('utf-8',{fatal:true}).decode(buffer.subarray(0,bytesRead));}finally{await handle.close();}
   // Redis resolves dir while parsing, before the command-line override. Only
   // create empty namespace paths: never bind an operating data directory.
   for(const line of text.split(/\r?\n/)){
    const match=/^\s*dir\s+(?:"([^"\\]+)"|'([^'\\]+)'|([^\s"']+))\s*$/i.exec(line);
    if(!match)continue;const value=match[1]??match[2]??match[3];
    if(value.length>1024||!/^\/(?:var|srv|opt|home|data|mnt)\//.test(value)||path.posix.normalize(value)!==value||value.split('/').some(part=>part==='.'||part==='..')||value.includes('\0'))continue;
    directories.add(value);if(directories.size>100)fail();
   }
   const review=redisResourceReview(text);totalResources+=review.totalResources;unsupportedSyntax+=review.unsupportedSyntax;for(const resource of review.resources){if(resources.length>=256)break;resources.push({path:'/etc/redis/'+nested.split(path.sep).join('/'),...resource});}
  }
 }
 await visit('');await assertRedisCandidate(candidate);
 const result={scope:'whole-private-candidate',files,resources,totalResources,unsupportedSyntax,truncated:totalResources>resources.length,resourceIsolationVerified:false};
 dataDirectories.set(result,Object.freeze([...directories].sort()));return result;
}
