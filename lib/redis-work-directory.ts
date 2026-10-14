import {mkdir,lstat,mkdtemp} from 'node:fs/promises';
import path from 'node:path';

export function isRedisWorkPath(value: unknown,prefix: string){
 return typeof value==='string'&&/^\/mnt\/data\/build\/[a-zA-Z0-9_./-]+$/.test(value)&&!value.split('/').includes('..')&&path.resolve(value)===value&&new RegExp('^'+prefix+'[a-zA-Z0-9_-]+$').test(path.basename(value));
}

// Internal work paths only. An API request cannot choose a directory.
export async function redisWorkDirectory(prefix: string){
 if(!['tastedev-redis-candidate-','tastedev-redis-validation-'].includes(prefix))throw Error('Redis 검수 작업 종류를 확인하세요.');
 let parent=process.env.TMPDIR||'/mnt/data/build/tastedev-linux';
 if(!/^\/mnt\/data\/build\/[a-zA-Z0-9_./-]+$/.test(parent)||parent.split('/').includes('..')||path.resolve(parent)!==parent)throw Error('Redis 검수 작업 경로를 확인하세요.');
 // Linux Unix socket paths must be shorter than 108 bytes, including the
 // generated six-character suffix and /redis.sock. Never fall back to /tmp.
 if(prefix==='tastedev-redis-validation-'&&Buffer.byteLength(path.join(parent,prefix+'XXXXXX','redis.sock'))>=108)parent='/mnt/data/build/tastedev-linux';
 await mkdir(parent,{recursive:true,mode:0o700});
 const stat=await lstat(parent);
 if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==process.getuid?.()||(stat.mode&0o077))throw Error('Redis 검수 작업 경로 권한을 확인하세요.');
 return mkdtemp(path.join(parent,prefix));
}
