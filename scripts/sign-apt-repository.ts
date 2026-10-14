import {aptRepositoryPath} from './apt-repository-path.ts';
import {hasErrorCode} from '../lib/error-code.ts';
import {readFile,mkdtemp,copyFile,rm,lstat,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {constants} from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile),root=await aptRepositoryPath(process.argv[2]||''),fingerprint=(process.argv[3]||'').toUpperCase();
if(! /^(?:[A-F0-9]{40}|[A-F0-9]{64})$/.test(fingerprint))throw Error('Provide generated repository path and full public signing-key fingerprint');
for(const name of ['InRelease','Release.gpg','Signature.json']){try{await lstat(path.join(root,'dists/stable',name));throw Error('Repository already has signatures; generate a fresh repository');}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}}
await exec(process.execPath,['scripts/verify-apt-repository.ts',root],{maxBuffer:1048576});
const release=path.join(root,'dists/stable/Release'),snapshot=await readFile(release),stage=await mkdtemp(path.join(root,'.signing-'));const created:string[]=[];
try{
 const input=path.join(stage,'Release');await copyFile(release,input,constants.COPYFILE_EXCL);
 for(const [name,mode] of [['InRelease','--clearsign'],['Release.gpg','--detach-sign']])await exec('/usr/bin/gpg',['--batch','--armor','--local-user',fingerprint,'--output',path.join(stage,name),mode,input],{timeout:60000,maxBuffer:1048576});
 for(const args of [['--verify',path.join(stage,'InRelease')],['--verify',path.join(stage,'Release.gpg'),input]]){
  const {stdout}=await exec('/usr/bin/gpg',['--batch','--status-fd','1',...args],{timeout:10000,maxBuffer:1048576});
  if(!stdout.split('\n').some(line=>{const parts=line.split(' ');return parts[0]==='[GNUPG:]'&&parts[1]==='VALIDSIG'&&(parts[2]===fingerprint||parts.at(-1)===fingerprint);}))throw Error('Signature identity mismatch');
 }
 const decoded=path.join(stage,'decoded');await exec('/usr/bin/gpg',['--batch','--output',decoded,'--decrypt',path.join(stage,'InRelease')],{timeout:10000,maxBuffer:1048576});
 if(!(await readFile(decoded)).equals(snapshot)||!(await readFile(release)).equals(snapshot))throw Error('Release changed during signing');
 await writeFile(path.join(stage,'Signature.json'),JSON.stringify({fingerprint,releaseSha256:createHash('sha256').update(snapshot).digest('hex'),signatureVerified:true,published:false},null,2)+'\n');
 for(const name of ['InRelease','Release.gpg','Signature.json']){const target=path.join(root,'dists/stable',name);await copyFile(path.join(stage,name),target,constants.COPYFILE_EXCL);created.push(target);}
 process.stdout.write(JSON.stringify({repository:root,fingerprint,signatureVerified:true,published:false,installed:false})+'\n');
}catch(error){for(const file of created)await rm(file,{force:true});throw error;}finally{await rm(stage,{recursive:true,force:true});}
