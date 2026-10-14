import {mkdir,lstat,realpath,mkdtemp} from 'node:fs/promises';
import {join} from 'node:path';

export const verificationWorkRoot='/mnt/data/build/tastedev-linux';

// All verification fixtures and inherited tool temporary files use the user's
// designated directory. An unusable directory must fail rather than fall back.
export async function verificationWorkDirectory(prefix:string){
 if(!/^[a-zA-Z0-9-]+-$/.test(prefix))throw Error('검수 작업 이름을 확인하세요.');
 await mkdir(verificationWorkRoot,{recursive:true,mode:0o700});
 const stat=await lstat(verificationWorkRoot);
 if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==process.getuid?.()||(stat.mode&0o077)||await realpath(verificationWorkRoot)!==verificationWorkRoot)throw Error('검수 작업 경로와 권한을 확인하세요.');
 for(const name of ['TMPDIR','TMP','TEMP'])process.env[name]=verificationWorkRoot;
 return mkdtemp(join(verificationWorkRoot,prefix));
}
