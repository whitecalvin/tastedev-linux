export type CertificateInput = {operation?: unknown; directoryHooks?: unknown; certName?: unknown; staging?: unknown; domain?: unknown; authenticator?: unknown; installNginx?: unknown; email?: unknown; webroot?: unknown; confirm?: unknown; agree?: unknown};
import {domainName} from './nginx-config.ts';
const fail: (message: string) => never = message=>{throw Object.assign(Error(message),{status:400});};
export function certificateWebroot(value: unknown): string{
 if(typeof value!=='string'||value.length>240||!/^\/[A-Za-z0-9_./-]+$/.test(value)||value.split('/').slice(1).some(part=>!part||part==='.'||part==='..')||!['/var/www','/srv','/opt','/usr/share/nginx'].some(root=>value===root||value.startsWith(root+'/')))fail('웹 루트는 /var/www, /srv, /opt, /usr/share/nginx 아래의 절대 경로로 입력하세요.');
 return value;
}
export function certificateCommand(input: CertificateInput): string[]{
 if(input.operation==='renew-check'){
  if(input.directoryHooks!==undefined&&typeof input.directoryHooks!=='boolean')fail('디렉터리 hook 실행 옵션을 확인하세요.');
  if(input.certName!==undefined&&(typeof input.certName!=='string'||input.certName.length>253||! /^[a-z0-9][a-z0-9.-]*$/i.test(input.certName)))fail('인증서 이름을 확인하세요.');
  return ['/usr/bin/certbot','renew','--dry-run','--non-interactive','--no-random-sleep-on-renew',...(input.certName!==undefined?['--cert-name',input.certName]:[]),...(input.directoryHooks===false?['--no-directory-hooks']:[])];
 }
 if(input.operation!==undefined&&input.operation!=='issue')fail('인증서 작업 유형을 확인하세요.');
 if(input.staging!==undefined&&typeof input.staging!=='boolean')fail('테스트 인증서 옵션을 확인하세요.');
 const domain=domainName(input.domain),method=input.authenticator??'nginx';
 if(method!=='nginx'&&method!=='webroot'&&method!=='standalone')fail('인증 방식을 확인하세요.');
 if(input.installNginx!==undefined&&typeof input.installNginx!=='boolean')fail('nginx HTTPS 연계 옵션을 확인하세요.');
 if(input.installNginx===true&&method!=='webroot')fail('추가 nginx HTTPS 연계는 webroot 인증 방식에서 선택하세요.');
 if(typeof input.email!=='string'||!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(input.email))fail('인증서 연락 이메일을 입력하세요.');
 const plugin=method==='nginx'?['--nginx']:method==='webroot'?(input.installNginx?['run','--authenticator','webroot','--installer','nginx','--webroot-path',certificateWebroot(input.webroot)]:['certonly','--webroot','--webroot-path',certificateWebroot(input.webroot)]):['certonly','--standalone'];
 return ['/usr/bin/certbot',...plugin,'--non-interactive','--agree-tos','--email',input.email,'-d',domain,...(method==='nginx'||input.installNginx===true?['--redirect']:[]),...(input.staging?['--staging']:[])];
}
