import type {NginxAstNode} from './nginx-syntax.ts';
import {hasErrorCode} from './error-code.ts';
export type NginxTreeFile = {path: string;name: string;source: string;nodes: NginxAstNode[];error?: string|null;symbolicLink?: boolean;readOnly?: boolean;linkTarget?: string};
const detail=(value: unknown): string=>value instanceof Error?('code' in value&&typeof value.code==='string'&&value.code?value.code:value.message):String(value);
import {open,readdir,realpath,lstat} from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {parseNginxTree} from './nginx-syntax.ts';
import {nginxIncludeLinks,certbotNginxOptions} from './nginx-include-links.ts';
export {parseNginxTree} from './nginx-syntax.ts';
async function checkParents(file: string){
 let current=path.parse(file).root;for(const part of path.dirname(file).slice(current.length).split(path.sep).filter(Boolean)){current=path.join(current,part);const stat=await lstat(current);if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('설정 디렉터리 링크는 조회하지 않습니다.');}
}
async function readConfig(file: string){
 await checkParents(file);const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{const stat=await handle.stat();if(!stat.isFile()||stat.size>262144)throw new Error('256KB 이하 일반 파일만 조회합니다.');
  const buffer=Buffer.alloc(262145);let size=0;while(size<buffer.length){const {bytesRead}=await handle.read(buffer,size,buffer.length-size,size);if(!bytesRead)break;size+=bytesRead;}
  if(size>262144)throw Error('256KB 이하 일반 파일만 조회합니다.');await checkParents(file);const after=await lstat(file);
  if(after.isSymbolicLink()||after.dev!==stat.dev||after.ino!==stat.ino||after.size!==stat.size||after.mtimeMs!==stat.mtimeMs)throw Error('조회 중 설정 파일이 변경되었습니다. 다시 조회하세요.');
  const source=new TextDecoder('utf-8',{fatal:true}).decode(buffer.subarray(0,size));if(source.includes('\0'))throw new Error('UTF-8 설정만 조회합니다.');return source;
 }finally{await handle.close();}
}
export async function nginxTree({directory='/etc/nginx',certbotDirectory='/etc/letsencrypt'}={}){
 directory=path.resolve(directory);const files: NginxTreeFile[]=[],warnings: string[]=[],names=['nginx.conf'];
 try{names.push(...(await readdir(directory)).filter(name=>name!=='nginx.conf'&&/^[a-zA-Z0-9][a-zA-Z0-9_.-]*\.conf$/.test(name)).sort().slice(0,100));}catch(error){if(!hasErrorCode(error,'ENOENT'))warnings.push(detail(error));}
 for(const group of ['conf.d','sites-available','sites-enabled','snippets']){
  try{const folder=path.join(directory,group),stat=await lstat(folder);if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('설정 디렉터리 링크는 조회하지 않습니다.');
   const entries=(await readdir(folder)).filter(name=>/^[a-zA-Z0-9_.-]+$/.test(name)&&!name.startsWith('.')).filter(name=>group==='conf.d'?/\.conf(?:\.disabled)?$/.test(name):group==='snippets'?name.endsWith('.conf'):true).sort();
   if(entries.length>100)warnings.push(group+': 처음 100개 파일만 표시합니다.');names.push(...entries.slice(0,100).map(name=>group+'/'+name));
  }catch(error){if(!hasErrorCode(error,'ENOENT'))warnings.push(group+': '+(detail(error)));}
 }
 for(const name of names){
  const file: NginxTreeFile={path:path.join(directory,name),name,source:'',nodes:[],error:null};
  try{await checkParents(file.path);file.symbolicLink=(await lstat(file.path)).isSymbolicLink();if(file.symbolicLink)file.readOnly=true;const target=await realpath(file.path);if(!target.startsWith(directory+path.sep))throw Error('nginx 폴더 밖의 설정 링크는 조회하지 않습니다.');
   const source=await readConfig(target);if(await realpath(file.path)!==target)throw Error('조회 중 설정 링크가 변경되었습니다. 다시 조회하세요.');file.source=source;if(file.symbolicLink)file.linkTarget=target;try{file.nodes=parseNginxTree(file.source);}catch(error){file.error=detail(error);}
  }catch(error){file.error=detail(error);}files.push(file);
 }
 const includes: (nodes: NginxAstNode[])=>boolean=nodes=>nodes.some(node=>nginxIncludeLinks(node,[{path:certbotNginxOptions}],directory)?.files.length||includes(node.children||[]));
 if(files.some(file=>includes(file.nodes))){
  const file: NginxTreeFile={path:certbotNginxOptions,name:'letsencrypt/options-ssl-nginx.conf',source:'',nodes:[],error:null,readOnly:true};
  try{const target=path.join(path.resolve(certbotDirectory),'options-ssl-nginx.conf');file.source=await readConfig(target);file.nodes=parseNginxTree(file.source);}catch(error){file.error=detail(error);}files.push(file);
 }
 return {root:directory,files,warnings};
}
