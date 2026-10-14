// Runtime bindings come from the root helper; emitted code has no module imports.
declare const fs:typeof import('node:fs');
declare const path:typeof import('node:path');
declare const randomUUID:typeof import('node:crypto').randomUUID;
declare const BASE:string,MARK:string;
declare function fail(message:string,status?:number):never;
declare function domain(value:unknown):string;
declare function hash(text:string|Buffer):string;

export function rootDir(dir:string):void{
 const stat=fs.lstatSync(dir);
 if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==0||(stat.mode&0o022))fail('Directory must be root-owned and not group/world writable: '+dir);
}
export function target(name:unknown):string{
 rootDir('/etc/nginx');rootDir('/etc/nginx/conf.d');
 return '/etc/nginx/conf.d/linux-'+domain(name)+'.conf';
}
export function current(file:string):string|null{
 try{
  const stat=fs.lstatSync(file);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1||stat.uid!==0||(stat.mode&0o022)||stat.size>262144)fail('Unsafe config file');
  const text=fs.readFileSync(file,'utf8');
  if(!text.startsWith(MARK)&&!text.startsWith('# Managed by LINUX\n'))fail('Not LINUX managed');
  return text;
 }catch(error){
  if(error!==null&&typeof error==='object'&&'code' in error&&error.code==='ENOENT')return null;
  throw error;
 }
}
export function writeConfig(file:string,text:string):void{
 const temp=path.join(path.dirname(file),'.linux-'+randomUUID());
 fs.writeFileSync(temp,text,{mode:0o644,flag:'wx'});
 try{fs.renameSync(temp,file);}catch(error){fs.unlinkSync(temp);throw error;}
}
export function backup(file:string,text:string){
 const data={id:randomUUID(),kind:'nginx',target:file,text,createdAt:new Date().toISOString(),sha256:hash(text)};
 fs.writeFileSync(path.join(BASE,data.id+'.json'),JSON.stringify(data),{mode:0o600,flag:'wx'});
 return data;
}
export function record(id:unknown):Record<string,unknown>&{text:string;target:string;sha256:string}{
 if(typeof id!=='string'||!/^[0-9a-f-]{36}$/.test(id))fail('Invalid backup ID');
 const file=path.join(BASE,id+'.json'),stat=fs.lstatSync(file);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1||stat.uid!==0||(stat.mode&0o022)||stat.size>2*1024*1024)fail('Unsafe backup');
 const data:unknown=JSON.parse(fs.readFileSync(file,'utf8'));
 if(data===null||typeof data!=='object'||Array.isArray(data)||!('text' in data)||typeof data.text!=='string'||!('target' in data)||typeof data.target!=='string'||!('sha256' in data)||typeof data.sha256!=='string')fail('Invalid backup');
 if(data.sha256!==hash(data.text)||!/^\/etc\/nginx\/conf\.d\/linux-[a-z0-9.-]+\.conf$/.test(data.target))fail('Invalid backup');
 target(path.basename(data.target).slice(6,-5));
 return {...data,text:data.text,target:data.target,sha256:data.sha256};
}
