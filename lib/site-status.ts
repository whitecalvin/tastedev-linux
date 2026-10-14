import {hasErrorCode} from './error-code.ts';
export type CertificateSummary = {name: string;status: 'valid'|'pending'|'expiring'|'expired'|'unavailable';expiresAt?: string;daysRemaining?: number;domains?: string;issuer?: string;validFrom?: string;fingerprint?: string;warning?: string};
const detail=(value: unknown): string=>value instanceof Error?('code' in value&&typeof value.code==='string'&&value.code?value.code:value.message):String(value);
import { readdir, readFile, lstat } from 'node:fs/promises';
import path from 'node:path';
import { nginxFormAvailability } from './nginx-form-import.ts';
import { X509Certificate, createHash } from 'node:crypto';
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
export function certificateSummary(pem: string|Buffer, name: string, now = Date.now()): CertificateSummary {
  const cert = new X509Certificate(pem);
  const expiry = new Date(cert.validTo).getTime();
  if (!Number.isFinite(expiry)) throw new Error('인증서 만료 시각을 읽을 수 없습니다.');
  const days = Math.floor((expiry - now) / 86400000);
  return {
    name,
    domains: cert.subjectAltName || cert.subject,
    issuer: cert.issuer,
    validFrom: new Date(cert.validFrom).toISOString(),
    expiresAt: new Date(expiry).toISOString(),
    daysRemaining: days,
    status:
      now < new Date(cert.validFrom).getTime()
        ? 'pending'
        : now >= expiry
          ? 'expired'
          : days <= 30
            ? 'expiring'
            : 'valid',
    fingerprint: cert.fingerprint256,
  };
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
    return {
      certificates: [],
      warning:
        hasErrorCode(e,'ENOENT')
          ? '인증서 디렉토리가 없습니다.'
          : '인증서 공개 정보를 읽을 권한이 없습니다. 권한이 부족한 경우 상태를 추정하지 않습니다.',
    };
  }
}
