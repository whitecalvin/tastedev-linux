export type MariaDBCandidate=Readonly<{directory:string;main:string;target:string;sourceTarget:string;restoreVersion:string|null;changes:Readonly<Record<string,unknown>>;version:string;cleanup:()=>Promise<void>}>;
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {open,lstat,mkdir,mkdtemp,writeFile,rm,readdir} from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {mariadbTopology} from './mariadb-topology.ts';
import {patchConfig} from './config-patch.ts';
const candidates=new WeakSet<object>(),snapshots=new WeakMap<MariaDBCandidate,string>();
export const isMariaDBCandidate=(value:unknown):value is MariaDBCandidate=>Boolean(value&&typeof value==='object'&&candidates.has(value));
const fail:(message:string,status?:number)=>never=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const hash=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex');
async function snapshot(directory:string){const entries:[string,string|string[]][]=[];let count=0,total=0;async function walk(relative:string){if(++count>1000)fail('MariaDB candidate changed',409);const file=path.join(directory,relative),stat=await lstat(file);if(stat.isSymbolicLink()||stat.uid!==process.getuid?.())fail('MariaDB candidate changed',409);if(stat.isDirectory()){if((stat.mode&0o777)!==0o700)fail('MariaDB candidate changed',409);const names=(await readdir(file)).sort();entries.push([relative,names]);for(const name of names)await walk(path.join(relative,name));}else{if(!stat.isFile()||stat.nlink!==1||(stat.mode&0o777)!==0o600||stat.size>262144)fail('MariaDB candidate changed',409);const fd=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);try{const before=await fd.stat(),buffer=Buffer.alloc(262145);let size=0;while(size<buffer.length){const result=await fd.read(buffer,size,buffer.length-size,null);if(!result.bytesRead)break;size+=result.bytesRead;}const after=await fd.stat(),named=await lstat(file);if(size>262144||(total+=size)>1048576||(['dev','ino','uid','gid','mode','nlink','size','mtimeMs','ctimeMs'] as const).some(key=>before[key]!==stat[key]||before[key]!==after[key]||before[key]!==named[key]))fail('MariaDB candidate changed',409);entries.push([relative,hash(buffer.subarray(0,size))]);}finally{await fd.close();}}}await walk('');return hash(JSON.stringify(entries));}
export async function assertMariaDBCandidate(candidate:unknown){if(!isMariaDBCandidate(candidate)||await snapshot(candidate.directory)!==snapshots.get(candidate))fail('MariaDB candidate changed',409);return candidate;}
// Internal only. Private candidate files may contain credentials; never expose them over HTTP.
export async function mariadbCandidate(input:unknown,base='/etc/mysql'){
 if(!object(input)||typeof input.target!=='string'||typeof input.version!=='string'||(input.root!==undefined&&typeof input.root!=='string')||(input.changes!==undefined&&!object(input.changes)))fail('Selected MariaDB file is not included by this main configuration');
 const root=typeof input.root==='string'?input.root:undefined,target=input.target,version=input.version,changes=object(input.changes)?input.changes:{},restoreText=input.restoreText;
 const graph=await mariadbTopology(root,base);
 if(!graph.complete)fail('Resolve MariaDB include connections before preparing a candidate');
 if(graph.version!==version)fail('MariaDB configuration graph changed',409);
 if(!graph.files.some(file=>file.path===target))fail('Selected MariaDB file is not included by this main configuration');
 const restoring=typeof restoreText==='string';if(restoreText!==undefined&&(typeof restoreText!=='string'||Buffer.byteLength(restoreText)>262144||restoreText.includes('\0')))fail('Invalid MariaDB restore text');
 const candidateGraph=restoring?await mariadbTopology(root,base,new Map([[target,restoreText]])):graph;if(!candidateGraph.complete)fail('Resolve restored MariaDB include connections');
 const replacements=new Map<string,string>();
 for(const file of candidateGraph.files){
  let current=base;for(const part of file.path.slice(11).split('/')){current=path.join(current,part);if((await lstat(current)).isSymbolicLink())fail('MariaDB configuration link changed',409);}
  const handle=await open(current,constants.O_RDONLY|constants.O_NOFOLLOW);
  try{const stat=await handle.stat();if(!stat.isFile()||stat.size>262144)fail('Unsafe MariaDB configuration');const buffer=Buffer.alloc(262145),{bytesRead}=await handle.read(buffer,0,buffer.length,0);const content=buffer.subarray(0,bytesRead);if(bytesRead>262144||hash(content)!==(restoring&&file.path===target?graph.files.find(item=>item.path===target)?.version:file.version))fail('MariaDB configuration file changed',409);let text;try{text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(content);}catch{fail('MariaDB candidate requires UTF-8 configuration files');}replacements.set(file.path,file.path===target?(restoring?restoreText:patchConfig('mariadb',text,changes)):text);}finally{await handle.close();}
 }
 const temporary=process.env.TMPDIR||'/mnt/data/build/tastedev-linux';
 if(!/^\/mnt\/data\/build\/[a-zA-Z0-9_./-]+$/.test(temporary)||temporary.split('/').includes('..'))fail('MariaDB 검수 작업 경로를 확인하세요');
 await mkdir(temporary,{recursive:true,mode:0o700});
 const parent=await lstat(temporary);if(!parent.isDirectory()||parent.isSymbolicLink()||parent.uid!==process.getuid?.()||(parent.mode&0o077))fail('MariaDB 검수 작업 경로 권한을 확인하세요');
 const directory=await mkdtemp(path.join(temporary,'tastedev-mariadb-candidate-'));
 let result:MariaDBCandidate|undefined;const cleanup=async()=>{if(result)candidates.delete(result);if(result)snapshots.delete(result);await rm(directory,{recursive:true,force:true});};
 const local=(logical:string)=>path.join(directory,logical.slice(11));
 try{
  if(!/^\/[a-zA-Z0-9_./-]+$/.test(directory))fail('Unsupported MariaDB candidate directory');
  for(const edge of candidateGraph.edges){if(edge.directive.endsWith('dir'))await mkdir(local(edge.to),{recursive:true,mode:0o700});}
  for(const [logical,text] of replacements){
   const lines=(text.match(/[^\r\n]*(?:\r\n|\n|$)/g)??[]).filter(Boolean);
   // Supported settings may add lines at EOF, so original include line numbers remain stable.
   for(const edge of candidateGraph.edges.filter(edge=>edge.from===logical)){const original=lines[edge.line-1],ending=original.endsWith('\r\n')?'\r\n':original.endsWith('\n')?'\n':'';lines[edge.line-1]=edge.directive+' '+local(edge.to)+ending;}
   const file=local(logical);await mkdir(path.dirname(file),{recursive:true,mode:0o700});await writeFile(file,lines.join(''),{mode:0o600,flag:'wx'});
  }
  const latest=await mariadbTopology(root,base);if(!latest.complete||latest.version!==version)fail('MariaDB configuration changed while preparing the candidate',409);
  const checked=restoring?await mariadbTopology(root,base,new Map([[target,restoreText]])):latest;if(checked.version!==candidateGraph.version)fail('MariaDB restored include graph changed',409);
  result=Object.freeze({directory,main:local(candidateGraph.root),target:local(target),sourceTarget:target,restoreVersion:restoring?hash(Buffer.from(restoreText)):null,changes:Object.freeze({...changes}),version,cleanup});candidates.add(result);snapshots.set(result,await snapshot(directory));return result;
 }catch(error){await cleanup();throw error;}
}
