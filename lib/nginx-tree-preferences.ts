import {hasErrorCode} from './error-code.ts';
import {openSync,closeSync,fstatSync,readFileSync,constants} from 'node:fs';
import {mkdir,writeFile,rename,unlink} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {join} from 'node:path';
import {stateRoot} from './runtime-paths.ts';
import {treeExpansion} from './nginx-tree-expansion.ts';
const pathFor=(userId: string)=>join(stateRoot(),'nginx-tree-'+createHash('sha256').update(userId).digest('hex')+'.json');
export function nginxTreePreferences(userId: string|null|undefined){
 if(!userId)return null;
 let fd: number|undefined;
 try{fd=openSync(pathFor(userId),constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);const stat=fstatSync(fd);if(!stat.isFile()||stat.nlink!==1||stat.size>1048576)throw Error('트리 상태 저장 파일을 확인하세요.');return treeExpansion(JSON.parse(readFileSync(fd,'utf8')));}
 catch(error){if(hasErrorCode(error,'ENOENT'))return null;throw error;}
 finally{if(fd!==undefined)closeSync(fd);}
}
export async function saveNginxTreePreferences(userId: string|null|undefined,value: unknown){
 if(!userId)throw Error('로그인이 필요합니다.');
 const data=JSON.stringify(treeExpansion(value));if(Buffer.byteLength(data)>1048576)throw Error('트리 상태가 저장 한도를 초과했습니다.');
 await mkdir(stateRoot(),{recursive:true,mode:0o700});const temp=join(stateRoot(),'.nginx-tree-'+randomUUID());
 try{await writeFile(temp,data,{flag:'wx',mode:0o600});await rename(temp,pathFor(userId));}
 finally{await unlink(temp).catch(error=>{if(!hasErrorCode(error,'ENOENT'))throw error;});}
}
