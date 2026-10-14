import type {Stats} from 'node:fs';
import {hasErrorCode} from './error-code.ts';
export type NginxSiteEntry={path:string;name:string;identity:string;kind?:'link'|'file'|'other';linkVersion?:string;status?:'external'|'unsafe'|'linked'|'broken';target?:string;version?:string;included?:boolean|null};
type SiteGraph={complete:boolean;files:{path:string}[]};
type SiteGroup={group:string;exists:boolean;entries:NginxSiteEntry[]};
import {lstat,opendir,readlink,realpath,open} from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
const fail:()=>never=()=>{throw Object.assign(Error('Nginx site inventory requires review'),{status:409});};
const identity=(stat:Stats)=>[stat.dev,stat.ino,stat.mode,stat.uid,stat.nlink,stat.size,stat.mtimeMs,stat.ctimeMs].join(':');
const namePattern=/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;
// Trusted roots only. Link existence is separate from inclusion in the live graph.
export async function inspectNginxSites(graph:SiteGraph|null|undefined,{base='/etc/nginx',ownerUid=process.getuid?.()}:{base?:string;ownerUid?:number}={}){
 base=path.resolve(base);
 async function safeDirectory(location:string){
  let cursor=path.parse(location).root;
  for(const segment of location.slice(cursor.length).split(path.sep).filter(Boolean)){
   cursor=path.join(cursor,segment);const stat=await lstat(cursor);
   if(!stat.isDirectory()||stat.isSymbolicLink())fail();
   if((cursor===base||cursor.startsWith(base+path.sep))&&(stat.uid!==ownerUid||(stat.mode&0o022)))fail();
  }
 }
 async function scan(group:string):Promise<SiteGroup>{
  const directory=path.join(base,group);let before;
  try{await safeDirectory(directory);before=await lstat(directory);}catch(error){if(hasErrorCode(error,'ENOENT'))return {group,exists:false,entries:[]};throw error;}
  const entries:NginxSiteEntry[]=[];let bytes=0;
  for await(const item of await opendir(directory)){
   if(entries.length>=100)fail();if(!namePattern.test(item.name))fail();
   const file=path.join(directory,item.name),stat=await lstat(file);
   if(stat.uid!==ownerUid)fail();
   const entry:NginxSiteEntry={path:'/etc/nginx/'+group+'/'+item.name,name:item.name,identity:identity(stat)};
   if(stat.isSymbolicLink()){
    entry.kind='link';const target=await readlink(file);entry.linkVersion=hash(target);
    const lexical=path.resolve(directory,target);
    if(!lexical.startsWith(base+path.sep)){entry.status='external';}
    else try{
     await safeDirectory(path.dirname(lexical));const resolved=await realpath(file);
     if(!resolved.startsWith(base+path.sep)){entry.status='external';}
     else{await safeDirectory(path.dirname(resolved));const final=await lstat(resolved);
      if(!final.isFile()||final.uid!==ownerUid||final.nlink!==1||(final.mode&0o022))entry.status='unsafe';
      else{entry.status='linked';entry.target='/etc/nginx/'+path.relative(base,resolved);}
     }
    }catch(error){if(hasErrorCode(error,'ENOENT'))entry.status='broken';else entry.status='unsafe';}
    if(identity(await lstat(file))!==entry.identity||await readlink(file)!==target)fail();
   }else if(stat.isFile()&&stat.nlink===1&&!(stat.mode&0o022)&&stat.size<=262144){
    bytes+=stat.size;if(bytes>1048576)fail();
    const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
    try{if(identity(await handle.stat())!==entry.identity)fail();const buffer=Buffer.alloc(262145),{bytesRead}=await handle.read(buffer,0,buffer.length,0);if(bytesRead>262144)fail();entry.kind='file';entry.version=hash(buffer.subarray(0,bytesRead));if(identity(await handle.stat())!==entry.identity||identity(await lstat(file))!==entry.identity)fail();}finally{await handle.close();}
   }else{entry.kind='other';entry.status='unsafe';}
   entry.included=graph?.complete?graph.files.some(value=>value.path===entry.path):null;
   entries.push(entry);
  }
  if(identity(await lstat(directory))!==identity(before))fail();
  entries.sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0);return {group,exists:true,entries};
 }
 const available=await scan('sites-available'),enabled=await scan('sites-enabled');
 // Re-read bounded inventories to reject a source or alias changed during lookup.
 const secondAvailable=await scan('sites-available'),secondEnabled=await scan('sites-enabled');
 if(JSON.stringify([available,enabled])!==JSON.stringify([secondAvailable,secondEnabled]))fail();
 const sites=available.entries.map(entry=>({...entry,links:enabled.entries.filter(link=>link.status==='linked'&&link.target===entry.path).map(link=>({path:link.path,included:link.included})),conflict:enabled.entries.some(link=>link.name===entry.name&&link.target!==entry.path)}));
 const result={available:{...available,entries:sites},enabled,graphComplete:graph?.complete===true,operatingConfigurationChanged:false};
 return {...result,version:hash(JSON.stringify(result))};
}
