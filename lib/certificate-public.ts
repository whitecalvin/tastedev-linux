import {X509Certificate} from 'node:crypto';
export type CertificateSummary = {name: string;status: 'valid'|'pending'|'expiring'|'expired'|'unavailable';expiresAt?: string;daysRemaining?: number;domains?: string;issuer?: string;validFrom?: string;fingerprint?: string;warning?: string};
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
