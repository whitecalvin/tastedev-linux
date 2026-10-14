import type {Stats} from 'node:fs';
import type {CertificateInput} from './certificate-command.ts';
export type CertificateBackupRecord = {path: string; id: string};
export type CertificateExecutionHooks = {inspectDirectory: (path: string) => Pick<Stats,'isDirectory'|'isSymbolicLink'|'uid'|'mode'>; backupNginx: (domain: string,report?: (record: CertificateBackupRecord) => unknown) => Promise<{backups?: CertificateBackupRecord[]} | undefined>; reportBackup?: (record: CertificateBackupRecord) => unknown; run: (binary: string,args: string[]) => Promise<string>};
import {certificateFailureMessage} from './certificate-failure.ts';
import {certificateCommand,certificateWebroot} from './certificate-command.ts';
const fail: (message: string) => never = message=>{throw Object.assign(Error(message),{status:403});};
export function inspectCertificateWebroot(value: unknown,inspect: CertificateExecutionHooks['inspectDirectory']){
 const root=certificateWebroot(value),parts=root.split('/').filter(Boolean),parents=['/'];let parent='';
 for(const part of parts){parent+='/'+part;parents.push(parent);}
 for(const name of [...parents,root+'/.well-known',root+'/.well-known/acme-challenge']){
  let stat;try{stat=inspect(name);}catch(error){if(error!==null&&typeof error==='object'&&'code' in error&&error.code==='ENOENT'&&name.startsWith(root+'/.well-known'))continue;throw error;}
  if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==0||(stat.mode&0o022))fail('웹 루트와 검증 디렉터리는 root 소유이며 다른 사용자가 변경할 수 없어야 합니다.');
 }
 return root;
}
export async function certificateExecution(input: CertificateInput,hooks: CertificateExecutionHooks){
 if(input.confirm!==true||input.agree!==true)fail('서버 변경 및 ACME 이용 약관 동의를 확인하세요.');
 const command=certificateCommand(input);let nginxBackup;
 if(input.operation!=='renew-check'){
  const method=input.authenticator??'nginx';
  if(method==='webroot')inspectCertificateWebroot(input.webroot,hooks.inspectDirectory);
  if(method==='nginx'||input.installNginx===true){
   const domain=command[command.indexOf('-d')+1];
   nginxBackup=await hooks.backupNginx(domain,hooks.reportBackup);
  }
 }
 let logs;
 try{logs=await hooks.run(command[0],command.slice(1));}catch(error){
  const message=certificateFailureMessage(error);
  if(!message)throw error;
  throw Object.assign(Error(message),{status:422});
 }
 const backupLog=!hooks.reportBackup&&nginxBackup?.backups?.map(item=>'nginx 설정 백업 · '+item.path+' · '+item.id).join('\n');
 return {logs:(backupLog?backupLog+'\n':'')+logs};
}
