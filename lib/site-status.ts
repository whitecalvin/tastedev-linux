import {hasErrorCode} from './error-code.ts';
import {certificateSummary,type CertificateSummary} from './certificate-public.ts';
export {certificateSummary} from './certificate-public.ts';
export type {CertificateSummary} from './certificate-public.ts';
import {runHelper} from './privilege.ts';
import {securitySettings} from './security.ts';
const detail=(value: unknown): string=>value instanceof Error?('code' in value&&typeof value.code==='string'&&value.code?value.code:value.message):String(value);
import { readdir, readFile, lstat } from 'node:fs/promises';
import path from 'node:path';
import { nginxFormAvailability } from './nginx-form-import.ts';
import { createHash } from 'node:crypto';
export async function managedSites() {
  const directory = '/etc/nginx/conf.d';
  try {
    const names = (await readdir(directory)).filter((name) => /^linux-[a-z0-9.-]+\.conf(?:\.disabled)?$/.test(name));
    const sites = [];
    for (const name of names) {
      const file = path.join(directory, name),
        stat = await lstat(file);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 262144) continue;
      const config = await readFile(file, 'utf8');
      if (!/^# Managed by (?:LINUX|LINUX)\n/.test(config)) continue;
      const domain = name.replace(/^linux-/, '').replace(/\.conf(?:\.disabled)?$/, '');
      sites.push({
        domain,
        ...nginxFormAvailability(config, domain),
        version: createHash('sha256').update(config).digest('hex'),
        enabled: !name.endsWith('.disabled'),
        path: file,
        config,
      });
    }
    return { sites, warning: null };
  } catch (e) {
    return { sites: [], warning: '운영 설정을 조회할 수 없습니다. ' + (detail(e)) };
  }
}
export async function certificates() {
  const directory = '/etc/letsencrypt/live';
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const result: CertificateSummary[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || !/^[a-z0-9.-]+$/i.test(entry.name)) continue;
      try {
        const pem = await readFile(path.join(directory, entry.name, 'cert.pem'), 'utf8');
        result.push(certificateSummary(pem, entry.name));
      } catch (e) {
        result.push({ name: entry.name, status: 'unavailable', warning: detail(e) });
      }
    }
    return { certificates: result, warning: null };
  } catch (e) {
    if(hasErrorCode(e,'EACCES')||hasErrorCode(e,'EPERM')){
      try{
        if((await securitySettings()).settings.sudoWithoutPrompt){
          const result=await runHelper('certificate',{operation:'inspect'});
          if(Array.isArray(result.certificates)&&result.certificates.every(item=>item&&typeof item==='object'&&typeof item.name==='string'&&['valid','pending','expiring','expired','unavailable'].includes(item.status)))return {certificates:result.certificates as CertificateSummary[],warning:typeof result.warning==='string'?result.warning:null};
        }
      }catch{}
    }
    return {
      certificates: [],
      warning:
        hasErrorCode(e,'ENOENT')
          ? '인증서 디렉토리가 없습니다.'
          : '인증서 공개 정보를 읽을 권한이 없습니다. 권한이 부족한 경우 상태를 추정하지 않습니다.',
    };
  }
}
