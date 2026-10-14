import type {NginxConfigInput} from './nginx-config.ts';
import {nginxValidationDiagnostic} from './nginx-validation-diagnostic.ts';
import {mkdir,writeFile,rm} from 'node:fs/promises';
import {nginxWorkDirectory} from './nginx-work-directory.ts';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
import {nginxPlan} from './server-tools.ts';
const execute=promisify(execFile);
export async function validateNginxDraft(input:NginxConfigInput&{https?:unknown;confirm?:unknown}){
 if(process.getuid?.()===0)throw Object.assign(Error('문법 검사는 일반 사용자 권한으로 실행하세요.'),{status:403});
 if(input?.version||input?.https)throw Object.assign(Error('기존 운영 설정은 전체 설정·인증서를 포함한 서버 적용 검사 경로를 사용하세요.'),{status:400});
 const plan=await nginxPlan(input),root=await nginxWorkDirectory('tastedev-nginx-check-');
 try{
  await mkdir(path.join(root,'logs'),{mode:0o700});const config=path.join(root,'nginx.conf');
  const text=`error_log stderr;\npid ${root}/nginx.pid;\nevents { worker_connections 32; }\nhttp {\naccess_log off;\nclient_body_temp_path ${root}/client-body;\nproxy_temp_path ${root}/proxy;\nfastcgi_temp_path ${root}/fastcgi;\nuwsgi_temp_path ${root}/uwsgi;\nscgi_temp_path ${root}/scgi;\n${plan.config}\n}\n`;
  await writeFile(config,text,{mode:0o600});
  try{await execute('/usr/sbin/nginx',['-t','-p',root+'/','-c',config,'-e','stderr'],{timeout:5000,maxBuffer:16384,encoding:'utf8',cwd:'/',env:{NODE_ENV:process.env.NODE_ENV,PATH:'/usr/bin:/bin',LANG:'C',LC_ALL:'C',TMPDIR:root,TMP:root,TEMP:root}});}catch(error){return {valid:false,scope:'isolated-http-draft',...nginxValidationDiagnostic(error),serviceChanged:false};}
  const latest=await nginxPlan(input);if(latest.config!==plan.config)throw Object.assign(Error('검사 중 운영 설정이 변경되었습니다. 다시 검토하세요.'),{status:409});
  return {valid:true,scope:'isolated-http-draft',serviceChanged:false,notice:'임시 HTTP 설정의 문법 검사입니다. 운영 전체 설정 검사와 서버 적용은 별도로 수행합니다.'};
 }finally{await rm(root,{recursive:true,force:true});}
}
