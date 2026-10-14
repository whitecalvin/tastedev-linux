export type ValidationBinaryOptions={binary?:string;ownerUid?:number;anchor?:string;allowHardLinks?:boolean};
export type ValidationBinary=Readonly<{path:string;sha256:string;ino:number;dev:number;bytes:number;links?:number}>;
import {lstatSync,openSync,readSync,fstatSync,closeSync,constants} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const fail=()=>{throw Object.assign(Error('Redis validation binary requires review'),{status:409,code:'VALIDATION_EXECUTABLE_UNTRUSTED'});};
// Dependency overrides are fixture-only trusted inputs, never request fields.
export function redisValidationBinary({binary='/usr/bin/redis-server',ownerUid=0,anchor='/',allowHardLinks=false}:ValidationBinaryOptions={}):ValidationBinary{
 if(typeof allowHardLinks!=='boolean')fail();
 const location=path.resolve(binary),base=path.resolve(anchor);if(base!=='/'&&!location.startsWith(base+'/'))fail();let cursor=base;
 const directories=[cursor];for(const part of path.relative(base,path.dirname(location)).split(path.sep).filter(Boolean)){cursor=path.join(cursor,part);directories.push(cursor);}
 for(const directory of directories){const stat=lstatSync(directory);if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==ownerUid||(stat.mode&0o022))fail();}
 const before=lstatSync(location);if(!before.isFile()||before.isSymbolicLink()||before.uid!==ownerUid||(before.mode&0o022)||!(before.mode&0o111)||before.nlink<1||!allowHardLinks&&before.nlink!==1||before.size>67108864)fail();
 const fd=openSync(location,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK),hash=createHash('sha256');let count=0;
 try{const stat=fstatSync(fd);if(stat.ino!==before.ino||stat.dev!==before.dev)fail();const buffer=Buffer.alloc(65536);while(true){const bytes=readSync(fd,buffer,0,buffer.length,null);if(!bytes)break;if((count+=bytes)>67108864)fail();hash.update(buffer.subarray(0,bytes));}const after=fstatSync(fd),current=lstatSync(location);if(after.size!==before.size||after.mtimeMs!==before.mtimeMs||after.mode!==before.mode||after.uid!==ownerUid||after.nlink!==before.nlink||current.ino!==before.ino||current.dev!==before.dev||current.isSymbolicLink()||count!==before.size)fail();}finally{closeSync(fd);}
 return Object.freeze({path:location,sha256:hash.digest('hex'),ino:before.ino,dev:before.dev,bytes:before.size,...(allowHardLinks?{links:before.nlink}:{})});
}
export function reviewedRedisBinary(expected:unknown,options:ValidationBinaryOptions={}){const current=redisValidationBinary(options);if(!expected||JSON.stringify(current)!==JSON.stringify(expected))fail();return current;}
