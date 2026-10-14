import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export async function verifyPackagedCatalog(app:string,phrases:readonly string[],get:(route:string)=>Promise<Response>){
 assert(path.isAbsolute(app));
 assert(phrases.length>0&&phrases.every(phrase=>typeof phrase==='string'&&phrase.length>0));
 const staticRoot=path.join(app,'.next/static');
 async function search(directory:string):Promise<string|null>{
  for(const entry of await readdir(directory,{withFileTypes:true})){
   const file=path.join(directory,entry.name);
   if(entry.isDirectory()){const found=await search(file);if(found)return found;}
   else if(entry.isFile()&&entry.name.endsWith('.js')){
    const source=await readFile(file,'utf8');if(phrases.every(phrase=>source.includes(phrase)))return file;
   }
  }
  return null;
 }
 const file=await search(staticRoot);assert(file,'Missing packaged catalog chunk: '+phrases[0]);
 const route='/_next/static/'+path.relative(staticRoot,file).split(path.sep).join('/');
 const response=await get(route);assert.equal(response.status,200,'Packaged catalog chunk is not served');
 const source=await response.text();assert(phrases.every(phrase=>source.includes(phrase)),'Served catalog content differs');
}

// Installed applications contain emitted MJS; source TS imports cannot run on all Node22 distributions.
export function packageAccountSetup(app:string,username:string,password:string):string{
 assert(path.isAbsolute(app));assert(/^[a-zA-Z0-9._-]{1,64}$/.test(username));assert(password.length>=12&&password.length<=256);
 const hashModule=pathToFileURL(path.join(app,'lib/auth-password.mjs')).href;
 const storeModule=pathToFileURL(path.join(app,'lib/auth-store.mjs')).href;
 return `import {passwordHash} from ${JSON.stringify(hashModule)};import {storeCredentials} from ${JSON.stringify(storeModule)};storeCredentials(${JSON.stringify(username)},await passwordHash(${JSON.stringify(password)}));`;
}
