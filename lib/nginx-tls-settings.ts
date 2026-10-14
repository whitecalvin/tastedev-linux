import type {NginxPreset} from './nginx-presets.ts';
import type {NginxSettingInfo} from './nginx-setting-info.ts';
const url='https://nginx.org/en/docs/http/ngx_http_ssl_module.html#';
// Editable open-source nginx 1.28 examples; certificate/key files are never read here.
const rows: [string,string,string?][]=[
 ['ssl_buffer_size','16k'],['ssl_certificate','/etc/letsencrypt/live/example.com/fullchain.pem'],
 ['ssl_certificate_cache','off','변수로 지정한 인증서·개인 키의 캐시입니다. max·inactive·valid를 지정하며 nginx 1.27.4 이상이 필요합니다.'],
 ['ssl_certificate_key','/etc/letsencrypt/live/example.com/privkey.pem'],['ssl_ciphers','HIGH:!aNULL:!MD5'],
 ['ssl_client_certificate','/etc/nginx/client-ca.pem'],
 ['ssl_conf_command','MinProtocol TLSv1.2','OpenSSL 설정 명령과 값입니다. nginx 1.19.4·OpenSSL 1.0.2 이상이 필요하며 TLS 1.3 암호 등은 Ciphersuites로 지정할 수 있습니다.'],
 ['ssl_crl','/etc/nginx/client-crl.pem','클라이언트 인증서의 폐기 상태 검증에 사용할 PEM CRL 파일입니다. 중간 CA를 쓰면 해당 폐기 목록도 필요합니다.'],
 ['ssl_dhparam','/etc/nginx/dhparam.pem'],
 ['ssl_early_data','off','TLS 1.3의 0-RTT 요청을 허용합니다. nginx 1.15.3 이상이며 OpenSSL 지원과 애플리케이션의 재전송 공격 처리가 필요합니다.'],
 ['ssl_ecdh_curve','auto','ECDHE 키 교환 곡선 목록입니다. auto는 OpenSSL과 nginx 버전에 맞는 목록을 사용합니다. ECDSA 인증서의 곡선도 포함해야 합니다.'],
 ['ssl_ocsp','off','클라이언트 인증서 체인의 OCSP 상태를 검사합니다. leaf는 마지막 인증서만 검사합니다. ssl_verify_client on·optional과 DNS resolver가 필요하며 nginx 1.19.0 이상에서 지원합니다.'],
 ['ssl_ocsp_cache','off','클라이언트 인증서 OCSP 상태를 공유 캐시에 저장합니다. shared:이름:크기 또는 off를 지정하며 nginx 1.19.0 이상이 필요합니다.'],
 ['ssl_ocsp_responder','http://127.0.0.1:8080/ocsp','클라이언트 인증서 OCSP 응답 서버를 덮어씁니다. http:// 주소만 지원하며 nginx 1.19.0 이상이 필요합니다.'],
 ['ssl_password_file','/etc/nginx/key-passwords','암호화된 개인 키를 읽기 위한 암호 파일 경로입니다. 파일의 각 줄을 순서대로 시도합니다. 암호 내용은 이 화면에서 읽지 않습니다.'],
 ['ssl_prefer_server_ciphers','off'],['ssl_protocols','TLSv1.2 TLSv1.3'],
 ['ssl_reject_handshake','off','해당 가상 서버의 TLS 핸드셰이크를 거부합니다. 기본 서버에서 알 수 없는 SNI를 거부할 때 사용할 수 있으며 nginx 1.19.4 이상이 필요합니다.'],
 ['ssl_session_cache','none'],['ssl_session_ticket_key','/etc/nginx/session-ticket.key','TLS 세션 티켓 암호화 키 파일 경로입니다. 48 또는 80바이트 난수 파일을 사용하고 여러 항목으로 키를 교체할 수 있습니다. 키 내용은 이 화면에서 읽지 않습니다.'],
 ['ssl_session_tickets','on'],['ssl_session_timeout','5m'],['ssl_stapling','off'],
 ['ssl_stapling_file','/etc/nginx/ocsp-response.der','서버 인증서의 OCSP 응답을 지정한 DER 파일에서 읽어 TLS 핸드셰이크에 첨부합니다. 파일을 지정하면 인증서에 기록된 응답 서버에 조회하지 않습니다.'],
 ['ssl_stapling_responder','http://127.0.0.1:8080/ocsp','서버 인증서의 OCSP 응답 서버를 덮어씁니다. http:// 주소만 지원하며 이름을 확인하려면 resolver도 필요합니다.'],
 ['ssl_stapling_verify','off'],['ssl_trusted_certificate','/etc/nginx/trusted-ca.pem'],['ssl_verify_client','off'],['ssl_verify_depth','1']
];
export function nginxTlsPresets(context: string): NginxPreset[]{return ['http','server'].includes(context||'')?rows.map<NginxPreset>(([name,value])=>({name,value,kind:'directive'})):[];}
export function nginxTlsSettingInfo(name: string,context?: string | null): NginxSettingInfo | null{if(context&&!['http','server'].includes(context||''))return null;const row=rows.find(row=>row[0]===name&&row[2]);return row?.[2]?{description:row[2],url:url+name}:null;}
export const nginxTlsNames=Object.freeze(rows.map(([name])=>name));
