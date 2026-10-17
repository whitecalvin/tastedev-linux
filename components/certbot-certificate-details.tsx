'use client';
import type {CertificateSummary} from './server-manager-types';
import {Badge} from './ui/controls';
import {useLanguage} from './language-provider';

export default function CertbotCertificateDetails({certificate}:{certificate:CertificateSummary}){
 const {t,locale}=useLanguage();
 const labels={valid:'기간 유효',pending:'유효 기간 시작 전',expiring:'만료 임박',expired:'만료',unavailable:'조회 불가'};
 const date=(value?:string)=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleString(locale,{timeZone:'UTC'}):'—';
 const domains=(certificate.domains??'').replace(/DNS:/g,'').split(/,\s*/).filter(Boolean);
 return <section className="certbot-certificate-details" aria-label={t('인증서 상세 정보')}>
  <header><div><span className="certbot-eyebrow">{t('선택한 인증서')}</span><h2>{certificate.name}</h2></div><Badge tone={certificate.status==='valid'?'success':certificate.status==='expired'?'danger':'warning'}>{t(labels[certificate.status])}</Badge></header>
  {certificate.warning&&<p role="status" className="hint">{t(certificate.warning)}</p>}
  <div className="certbot-domain-list" aria-label={t('도메인')}>{domains.map(domain=><code key={domain}>{domain}</code>)}</div>
  <dl className="certbot-facts"><div><dt>{t('만료 시각')} · UTC</dt><dd>{date(certificate.expiresAt)}</dd></div><div><dt>{t('남은 유효 기간')}</dt><dd>{typeof certificate.daysRemaining==='number'?certificate.daysRemaining<0?t('만료'):certificate.daysRemaining+' '+t('일 남음'):'—'}</dd></div><div><dt>{t('발급자')}</dt><dd>{certificate.issuer||'—'}</dd></div></dl>
  <details className="certbot-technical"><summary>{t('인증서 기술 정보')}</summary><dl><dt>{t('유효 기간 시작')} · UTC</dt><dd>{date(certificate.validFrom)}</dd><dt>SHA-256</dt><dd><code>{certificate.fingerprint||'—'}</code></dd><dt>{t('공개 인증서 경로')}</dt><dd><code>{'/etc/letsencrypt/live/'+certificate.name+'/cert.pem'}</code></dd></dl></details>
 </section>;
}
