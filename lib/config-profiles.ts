import {nodeConfigProfile} from './node-config-profile.ts';
import {databaseConfigProfile} from './database-config-profile.ts';
import {randomUUID} from 'node:crypto';
import {saveCode} from './workspace.ts';
import {nginxConfig,certificateCommand} from './server-tools.ts';
import {configSchemas,configDefaults,isConfigKind} from './config-schema.ts';
export const profiles=configSchemas;
const fail: (message: string) => never = (message)=>{throw Object.assign(new Error(message),{status:400});};
const integer=(value: unknown,label: string,min: number,max: number): number=>{const number=Number(value);if(!(typeof value==='number'||typeof value==='string'&&/^\d+$/.test(value))||!Number.isInteger(number)||number<min||number>max)fail(`${label}: ${min}~${max} 범위의 정수를 입력하세요.`);return number;};
const choice=(value: unknown,list: readonly string[],label: string): string=>{if(typeof value!=='string'||!list.includes(value))fail(label+' 값을 확인하세요.');return value;};
export function configProfile(kind: unknown,input: Record<string,unknown>){
 if(!isConfigKind(kind))fail('지원하는 패키지를 선택하세요.');const p={...configDefaults(kind),...input};
 for(const [key,label,type] of profiles[kind].fields)if(type==='switch'&&typeof p[key]!=='boolean')fail(label+' 값을 확인하세요.');
 if(kind==='nginx')return nginxConfig({domain:p.domain,port:p.port,mode:p.mode,upstreamPort:p.appPort,root:p.root});
 if(kind==='certbot'){choice(p.operation,['issue','renew-check'],'작업');if(p.operation==='renew-check'){if(typeof p.certName!=='string')fail('인증서 이름을 확인하세요.');return certificateCommand({operation:p.operation,...(p.certName===''?{}:{certName:p.certName})}).join(' ')+'\n';}return certificateCommand({domain:p.domain,email:p.email,staging:p.staging,authenticator:p.authenticator,webroot:p.webroot,installNginx:p.authenticator==='webroot'?p.installNginx:undefined}).join(' ')+'\n';}
 const port=integer(p.port,'포트',kind==='redis'?0:1,65535);
 if(kind==='nodejs')return nodeConfigProfile(p);
 return databaseConfigProfile(kind,p);
}

export async function saveConfigDraft(kind: unknown,input: Record<string,unknown>){
 if(!isConfigKind(kind))fail('지원하는 패키지를 선택하세요.');
 const text=configProfile(kind,input);
 const extensions: Record<string,string>={nodejs:'.env',certbot:'.txt',mariadb:'.cnf'};const extension=extensions[kind]||'.conf';
 const name=kind+'-draft-'+randomUUID()+extension;
 return {...await saveCode(name,text,null),text};
}
