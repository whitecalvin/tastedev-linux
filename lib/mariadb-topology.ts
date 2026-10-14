export type MariaDBGraphFile={path:string;version:string;bytes:number};
type GraphEdge={from:string;line:number;directive:string;to:string;targets:string[]};
export type MariaDBTopology={root:string;files:MariaDBGraphFile[];edges:GraphEdge[];warnings:{path:string;line?:number;reason:string}[];complete:boolean;version:string;notice:string};
import {open,lstat,readdir} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
function permitted(target:unknown,directory=false):target is string{if(directory&&target==='/etc/mysql')return true;return typeof target==='string'&&target.startsWith('/etc/mysql/')&&target.slice(11).split('/').every(part=>/^[a-zA-Z0-9_][a-zA-Z0-9_.-]*$/.test(part))&&(directory||target.endsWith('.cnf'));}
// Structural inventory only: no option values or file text leave this function.
export async function mariadbTopology(root='/etc/mysql/my.cnf',base='/etc/mysql',overrides:ReadonlyMap<string,string>=new Map()):Promise<MariaDBTopology>{
 if(!['/etc/mysql/my.cnf','/etc/mysql/mariadb.cnf'].includes(root))throw Object.assign(new Error('허용된 MariaDB main 설정을 선택하세요.'),{status:400});
 const files=new Map<string,MariaDBGraphFile>(),directories=new Map<string,{path:string;version:string}>(),edges:GraphEdge[]=[],warnings:MariaDBTopology['warnings']=[];let visits=0,total=0;
 const physical=(target:string)=>path.join(base,target.slice(11));
 async function safe(target:string){let cursor=base;const baseStat=await lstat(cursor);if(!baseStat.isDirectory()||baseStat.isSymbolicLink())throw Error();for(const part of target.slice(11).split('/')){cursor=path.join(cursor,part);if((await lstat(cursor)).isSymbolicLink())throw Error();}return cursor;}
 async function visit(target:string,stack:string[]=[]){
  if(++visits>300||stack.length>=16){warnings.push({path:target,reason:'include 검사 한도를 초과했습니다.'});return;}
  if(stack.includes(target)){warnings.push({path:target,reason:'include 순환 연결을 발견했습니다.'});return;}
  let text:string;
  try{
   const location=await safe(target),handle=await open(location,constants.O_RDONLY|constants.O_NOFOLLOW);
   try{const stat=await handle.stat();if(!stat.isFile()||stat.size>262144)throw Error();const buffer=Buffer.alloc(262145),{bytesRead}=await handle.read(buffer,0,buffer.length,0);if(bytesRead>262144)throw Error();let content:Buffer;if(overrides.has(target)){const changed=overrides.get(target);if(typeof changed!=='string')throw Error();content=Buffer.from(changed);}else content=buffer.subarray(0,bytesRead);if(content.length>262144)throw Error();text=content.toString('utf8');if(text.includes('\0'))throw Error();
    const entry={path:target,version:hash(content),bytes:content.length};if(!files.has(target)){total+=content.length;if(files.size>=100||total>1048576)throw Error();}else if(files.get(target)?.version!==entry.version)throw Error();files.set(target,entry);
   }finally{await handle.close();}
  }catch{warnings.push({path:target,reason:'설정 파일을 안전하게 읽을 수 없습니다.'});return;}
  const lines=text.split(/\r?\n/);
  for(let index=0;index<lines.length;index++){
   const trimmed=lines[index].trim();if(!/^[!?]include/.test(trimmed))continue;
   if(visits>=300||edges.length>=300){warnings.push({path:target,line:index+1,reason:'include 검사 한도를 초과했습니다.'});break;}
   const match=/^([!?]includedir|!include)\s+(\/etc\/mysql\/[a-zA-Z0-9_./-]+)\s*$/.exec(trimmed);
   if(match&&match[1].endsWith('dir')&&match[2].endsWith('/'))match[2]=match[2].slice(0,-1);
   if(!match||!permitted(match[2],match[1].endsWith('dir'))){warnings.push({path:target,line:index+1,reason:'지원하지 않는 include 경로 또는 구문입니다.'});continue;}
   const [,directive,destination]=match;
   const edge:GraphEdge={from:target,line:index+1,directive,to:destination,targets:[]};edges.push(edge);
   if(directive==='!include'){edge.targets.push(destination);await visit(destination,[...stack,target]);continue;}
   try{
    const dir=await safe(destination);if(!(await lstat(dir)).isDirectory())throw Error();const names=(await readdir(dir)).filter(name=>name.endsWith('.cnf')).sort();
    if(names.length>100)throw Error();if(names.some(name=>!permitted(destination+'/'+name)))throw Error();
    const listVersion=hash(JSON.stringify(names));if(directories.has(destination)&&directories.get(destination)?.version!==listVersion)throw Error();directories.set(destination,{path:destination,version:listVersion});
    for(const name of names){if(visits>=300){warnings.push({path:target,line:index+1,reason:'include 검사 한도를 초과했습니다.'});break;}const file=destination+'/'+name;edge.targets.push(file);await visit(file,[...stack,target]);}
   }catch{warnings.push({path:target,line:index+1,reason:'include 디렉터리를 안전하게 읽을 수 없습니다.'});}
  }
 }
 await visit(root);
 const entries=[...files.values()].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
 return {root,files:entries,edges,warnings,complete:warnings.length===0,version:hash(JSON.stringify({files:entries,directories:[...directories.values()],edges})),notice:'main 파일의 include 연결만 조회합니다. 서버 버전별 옵션 그룹·실행 인수·최종 설정 값은 별도 검사해야 합니다.'};
}
