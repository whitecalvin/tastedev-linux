import {lstat,readdir,realpath,open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {join,relative,sep} from 'node:path';
import {certificateSummary,type CertificateSummary} from './certificate-public.ts';

// The root helper supplies no browser-controlled path. Only public certN.pem
// files in a trusted Certbot tree are read; private keys are never opened.
export async function inspectCertificates(root='/etc/letsencrypt',owner=0){
 const trusted=async(path:string,directory:boolean)=>{const stat=await lstat(path);if(stat.isSymbolicLink()||stat.uid!==owner||(stat.mode&0o022)||(directory?!stat.isDirectory():!stat.isFile()))throw Error('인증서 저장 경로를 확인하세요.');return stat;};
 await trusted(root,true);root=await realpath(root);const live=join(root,'live');await trusted(live,true);
 const entries=(await readdir(live,{withFileTypes:true})).filter(entry=>entry.isDirectory()&&/^[a-z0-9._-]+$/i.test(entry.name)).sort((a,b)=>a.name.localeCompare(b.name,'en'));
 const certificates:CertificateSummary[]=[];
 for(const entry of entries.slice(0,500)){
  try{
   const directory=join(live,entry.name);await trusted(directory,true);
   const requested=join(directory,'cert.pem'),link=await lstat(requested);
   if(link.uid!==owner)throw Error('인증서 소유자를 확인하세요.');
   const file=await realpath(requested);
   if(link.isSymbolicLink()){
    const archive=join(root,'archive');await trusted(archive,true);
    const segments=relative(archive,file).split(sep);
    if(segments.length!==2||segments[0]!==entry.name||!/^cert[0-9]+\.pem$/.test(segments[1]))throw Error('인증서 연결 경로를 확인하세요.');
    await trusted(join(archive,entry.name),true);
   }else if(file!==requested)throw Error('인증서 경로를 확인하세요.');
   const stat=await trusted(file,false);if(stat.size>262144)throw Error('인증서 크기를 확인하세요.');
   const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
   try{
    const current=await handle.stat();if(current.dev!==stat.dev||current.ino!==stat.ino||!current.isFile()||current.size>262144)throw Error('인증서가 변경되었습니다.');
    const buffer=Buffer.alloc(262145);const {bytesRead}=await handle.read(buffer,0,buffer.length,0);if(bytesRead>262144)throw Error('인증서 크기를 확인하세요.');
    certificates.push(certificateSummary(buffer.subarray(0,bytesRead),entry.name));
   }finally{await handle.close();}
  }catch{certificates.push({name:entry.name,status:'unavailable',warning:'인증서 공개 정보를 안전하게 읽을 수 없습니다.'});}
 }
 return {certificates,warning:entries.length>500?'인증서가 많아 처음 500개만 표시합니다.':null};
}
