import {mkdir,lstat,mkdtemp} from 'node:fs/promises';
import path from 'node:path';

// Internal paths only: never accept a work directory from an HTTP request.
export async function nginxWorkDirectory(prefix: string){
 if(!['tastedev-nginx-candidate-','tastedev-nginx-check-'].includes(prefix))throw Error('nginx 검수 작업 종류를 확인하세요.');
 const parent=process.env.TMPDIR||'/mnt/data/build/tastedev-linux';
 if(!/^\/mnt\/data\/build\/[a-zA-Z0-9_./-]+$/.test(parent)||parent.split('/').includes('..'))throw Error('nginx 검수 작업 경로를 확인하세요.');
 await mkdir(parent,{recursive:true,mode:0o700});
 const stat=await lstat(parent);
 if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==process.getuid?.()||(stat.mode&0o077))throw Error('nginx 검수 작업 경로 권한을 확인하세요.');
 return mkdtemp(path.join(parent,prefix));
}
