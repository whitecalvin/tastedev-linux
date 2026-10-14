import type {Stats} from 'node:fs';
import type {HbaToken} from './postgresql-hba-links.ts';
import {hasErrorCode} from './error-code.ts';
type HbaGraphFile={path:string;version:string;sourceVersion:string;bytes:number};
type HbaGraphDirectory={path:string;version:string;names:string[]};
type HbaGraphEdge={from:string;line:number;kind:string;target:string;start:number;end:number;targets?:string[]};
export type PostgresqlHbaGraph={root:string;cluster:string;files:HbaGraphFile[];directories:HbaGraphDirectory[];missing:string[];edges:HbaGraphEdge[];complete:boolean;warnings:{path:string;line?:number;reason:string}[];version:string};
type GraphOptions={base?:string;ownerUid?:number;sources?:Map<string,string>;override?:string};
import {open,lstat,readdir} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFile} from './admin-native-exec.ts';import {promisify} from 'node:util';
import path from 'node:path';
import {postgresqlHbaLines} from './postgresql-hba-links.ts';
const records=new WeakMap<object,{graph:PostgresqlHbaGraph;serialized:string}>();
const exec=promisify(execFile),hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
const fail:()=>never=()=>{throw Object.assign(Error('접속 규칙 파일과 참조 경로를 확인하세요.'),{status:400});};
export function postgresqlHbaRoot(target:unknown){if(typeof target!=='string'||!/^\/etc\/postgresql\/\d+\/[a-zA-Z0-9_-]+\/pg_hba\.conf$/.test(target))fail();return path.dirname(target);}
function permitted(target:string,root:string){return target.startsWith(root+'/')&&!/[\x00-\x1f\x7f]/.test(target)&&path.resolve(target)===target;}
// Trusted filesystem/owner/source-map dependencies only. No source text is
// included in the public graph, and no file outside this cluster is inspected.
export async function postgresqlHbaGraph(value:unknown,{base='/etc',ownerUid,sources=new Map(),override}:GraphOptions={}){
 const cluster=postgresqlHbaRoot(value),target=typeof value==='string'?value:fail();if(!(sources instanceof Map)||override!==undefined&&(typeof override!=='string'||override.includes('\0')||Buffer.byteLength(override)>262144))fail();
 if(ownerUid===undefined){const binary=await lstat('/usr/bin/id');if(!binary.isFile()||binary.isSymbolicLink()||binary.uid!==0||(binary.mode&0o022))fail();const {stdout}=await exec('/usr/bin/id',['-u','postgres'],{timeout:5000,maxBuffer:64,env:{NODE_ENV:process.env.NODE_ENV,PATH:'/usr/bin:/bin',LC_ALL:'C'}});if(typeof stdout!=='string'||!/^\d+\s*$/.test(stdout))fail();ownerUid=Number(stdout.trim());if(typeof ownerUid!=='number'||!Number.isSafeInteger(ownerUid)||ownerUid<1)fail();}
 if(typeof ownerUid!=='number'||!Number.isSafeInteger(ownerUid)||ownerUid<0)fail();
 const files=new Map<string,HbaGraphFile>(),directories=new Map<string,HbaGraphDirectory>(),missing=new Set<string>(),edges:HbaGraphEdge[]=[],warnings:PostgresqlHbaGraph['warnings']=[],normalized=new Map<string,HbaGraphEdge>();let bytes=0,visits=0,tokens=0;
 const physical=(name:string)=>path.join(base,name.slice(5));
 const safeDirectory=async(dir:string)=>{let cursor=path.parse(path.resolve(dir)).root;for(const part of path.resolve(dir).slice(cursor.length).split(path.sep).filter(Boolean)){cursor=path.join(cursor,part);const stat=await lstat(cursor);if(!stat.isDirectory()||stat.isSymbolicLink()||![0,ownerUid].includes(stat.uid)||((stat.mode&0o022)&&!(stat.uid===0&&(stat.mode&0o1000))))fail();}};
 async function read(name:string){if(!permitted(name,cluster))fail();const file=physical(name);await safeDirectory(path.dirname(file));const before=await lstat(file),safe=(stat:Stats)=>stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1&&[0,ownerUid].includes(stat.uid)&&!(stat.mode&0o022)&&stat.size<=262144;
  if(!safe(before))fail();const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);try{const opened=await handle.stat();const same=(a:Stats,b:Stats)=>(['dev','ino','size','mode','uid','gid','mtimeMs','ctimeMs'] as const).every(key=>a[key]===b[key]);if(!safe(opened)||!same(before,opened))fail();const buffer=Buffer.alloc(262145);let length=0;while(length<buffer.length){const result=await handle.read(buffer,length,buffer.length-length,null);if(!result.bytesRead)break;length+=result.bytesRead;}if(length>262144)fail();await safeDirectory(path.dirname(file));const after=await lstat(file);if(!safe(after)||!same(opened,after)||!same(opened,await handle.stat()))fail();const text=new TextDecoder('utf-8',{fatal:true}).decode(buffer.subarray(0,length));if(text.includes('\0'))fail();return {text,version:hash(buffer.subarray(0,length))};}finally{await handle.close();}
 }
 async function listing(name:string){if(!permitted(name+'/placeholder',cluster))fail();const location=physical(name);await safeDirectory(location);const names=await readdir(location);if(names.length>1000)fail();return names.filter(name=>!name.startsWith('.')&&name.endsWith('.conf')).sort((a,b)=>Buffer.compare(Buffer.from(a),Buffer.from(b)));}
 const resolve=(from:string,value:string)=>{const result=path.resolve(path.dirname(from),value);if(!permitted(result,cluster))fail();return result;};
 async function visit(name:string,stack:string[]=[],optional=false):Promise<HbaToken[][][]>{
  if(++visits>300||stack.length>=16||stack.includes(name)){warnings.push({path:name,reason:'cycle-or-limit'});return [];}
  let text:string;try{const source=await read(name);text=name===target&&override!==undefined?override:source.text;const version=hash(text);if(files.has(name)&&files.get(name)?.version!==version)fail();if(!files.has(name)){bytes+=Buffer.byteLength(text);if(files.size>=128||bytes>1048576)fail();files.set(name,{path:name,version,sourceVersion:source.version,bytes:Buffer.byteLength(text)});}sources.set(name,text);
  }catch(error){if(hasErrorCode(error,'ENOENT')&&optional){missing.add(name);return [];}warnings.push({path:name,reason:hasErrorCode(error,'ENOENT')?'missing-file':'unsafe-or-unreadable'});return [];}
  const output:HbaToken[][][]=[];for(const line of postgresqlHbaLines(text)){
   const fields:HbaToken[][]=[];for(const field of line.fields){const expanded:HbaToken[]=[];for(const token of field){if(++tokens>10000){warnings.push({path:name,reason:'token-limit'});return [];}
    if(!token.initialQuote&&token.value.startsWith('@')&&token.value.length>1){try{const included=resolve(name,token.value.slice(1));edges.push({from:name,line:line.line,kind:'list',target:included,start:token.start,end:token.end});const lines=await visit(included,[...stack,name]);expanded.push(...lines.flatMap(row=>row.flat()));}catch{warnings.push({path:name,line:line.line,reason:'unsafe-list-reference'});}}
    else expanded.push(token);
   }if(expanded.length)fields.push(expanded);}
   const command=fields[0]?.[0]?.value;if(fields.length===2&&['include','include_if_exists','include_dir'].includes(command)){try{const included=resolve(name,fields[1][0].value);let destinations=[included];if(command==='include_dir'){const names=await listing(included);const record={path:included,version:hash(JSON.stringify(names)),names};if(directories.has(included)&&directories.get(included)?.version!==record.version)fail();directories.set(included,record);destinations=names.map(child=>path.join(included,child));}const key=name+':'+line.start;const edge={from:name,line:line.line,kind:command,target:included,targets:destinations,start:line.start,end:line.end};if(!normalized.has(key)){edges.push(edge);normalized.set(key,edge);}for(const child of destinations)output.push(...await visit(child,[...stack,name],command==='include_if_exists'));}catch(error){warnings.push({path:name,line:line.line,reason:hasErrorCode(error,'ENOENT')?'missing-directory':'unsafe-include-reference'});}}
   else if(fields.length)output.push(fields);
  }return output;
 }
 await visit(target);
 // Re-read source versions, optional absences and directory memberships so a
 // mid-inspection edit cannot make a mixed snapshot look complete.
 for(const file of files.values())try{if((await read(file.path)).version!==file.sourceVersion)throw Error();}catch{warnings.push({path:file.path,reason:'changed-during-inspection'});}
 for(const item of directories.values())try{if(hash(JSON.stringify(await listing(item.path)))!==item.version)throw Error();}catch{warnings.push({path:item.path,reason:'directory-changed'});}
 for(const name of missing)try{await lstat(physical(name));warnings.push({path:name,reason:'optional-file-appeared'});}catch(error){if(!hasErrorCode(error,'ENOENT'))warnings.push({path:name,reason:'optional-file-unreadable'});}
 const graph={root:target,cluster,files:[...files.values()],directories:[...directories.values()],missing:[...missing].sort(),edges,complete:warnings.length===0,warnings};const serialized=JSON.stringify(graph),result:PostgresqlHbaGraph={...graph,version:hash(serialized)};records.set(result,{graph:result,serialized});return result;
}

export function assertPostgresqlHbaGraph(value:unknown,sources:Map<string,string>){
 if(!value||typeof value!=='object')fail();const record=records.get(value),registered=record?.serialized,graph=record?.graph;if(!registered||!graph||!graph.complete||!(sources instanceof Map))fail();const {version,...state}=graph;if(JSON.stringify(state)!==registered||hash(registered)!==version)fail();
 for(const file of graph.files){const text=sources.get(file.path);if(typeof text!=='string'||hash(text)!==file.version||Buffer.byteLength(text)!==file.bytes)fail();}return graph;
}
