import type {NginxPreset} from './nginx-presets.ts';
import type {NginxSettingInfo} from './nginx-setting-info.ts';
const inherited=['http','server','location'],tls=['http','server'];
const proxy='https://nginx.org/en/docs/http/ngx_http_proxy_module.html';
const ssl='https://nginx.org/en/docs/http/ngx_http_ssl_module.html';
const gzip='https://nginx.org/en/docs/http/ngx_http_gzip_module.html';
// Editable examples, not installation/version-specific defaults.
const rows: [string,string,string[],string,string][]=[
 ['proxy_set_header','Host $host',inherited,proxy,'프록시 요청에 전달할 헤더입니다. 같은 지시어를 여러 번 추가할 수 있습니다.'],
 ['proxy_connect_timeout','60s',inherited,proxy,'업스트림 연결을 맺는 데 허용하는 시간입니다.'],
 ['proxy_read_timeout','60s',inherited,proxy,'업스트림 응답을 연속해서 읽는 사이의 제한 시간입니다.'],
 ['proxy_send_timeout','60s',inherited,proxy,'업스트림 요청을 연속해서 보내는 사이의 제한 시간입니다.'],
 ['proxy_buffering','on',inherited,proxy,'프록시 응답을 버퍼에 저장합니다.'],
 ['proxy_request_buffering','on',inherited,proxy,'요청 본문을 먼저 읽은 뒤 업스트림에 전달합니다.'],
 ['proxy_http_version','1.1',inherited,proxy,'업스트림 요청에 사용할 HTTP 버전입니다. 지원 버전은 설치된 nginx에 따라 다릅니다.'],
 ['proxy_redirect','default',inherited,proxy,'업스트림의 Location과 Refresh 헤더를 변경합니다.'],
 ['proxy_ssl_server_name','off',inherited,proxy,'HTTPS 업스트림 연결에 SNI를 전송합니다.'],
 ['proxy_ssl_verify','off',inherited,proxy,'HTTPS 업스트림 인증서를 검증합니다.'],
 ['proxy_intercept_errors','off',inherited,proxy,'프록시 오류 응답을 error_page 설정으로 처리합니다.'],
 ['proxy_pass_request_headers','on',inherited,proxy,'원래 요청 헤더를 업스트림으로 전달합니다.'],
 ['proxy_pass_request_body','on',inherited,proxy,'원래 요청 본문을 업스트림으로 전달합니다.'],
 ['gzip','off',inherited,gzip,'응답을 gzip으로 압축합니다.'],
 ['gzip_types','text/plain application/json',inherited,gzip,'압축할 응답의 MIME 유형입니다.'],
 ['gzip_comp_level','1',inherited,gzip,'gzip 압축 수준입니다. 1부터 9까지 지정합니다.'],
 ['gzip_http_version','1.1',inherited,gzip,'gzip 응답을 허용할 최소 요청 HTTP 버전입니다.'],
 ['gzip_min_length','20',inherited,gzip,'압축할 응답의 최소 Content-Length입니다.'],
 ['gzip_vary','off',inherited,gzip,'압축 응답에 Vary: Accept-Encoding 헤더를 추가합니다.'],
 ['gzip_proxied','off',inherited,gzip,'Via 헤더가 있는 요청의 압축 조건입니다.'],
 ['ssl_protocols','TLSv1.2 TLSv1.3',tls,ssl,'클라이언트 연결에 허용할 TLS 프로토콜입니다.'],
 ['ssl_certificate','/etc/letsencrypt/live/example.com/fullchain.pem',tls,ssl,'PEM 인증서와 중간 인증서 체인의 경로입니다.'],
 ['ssl_certificate_key','/etc/letsencrypt/live/example.com/privkey.pem',tls,ssl,'인증서의 PEM 개인 키 경로입니다.'],
 ['ssl_session_cache','none',tls,ssl,'TLS 세션 캐시의 방식과 크기입니다.'],
 ['ssl_session_timeout','5m',tls,ssl,'TLS 세션 정보를 재사용할 수 있는 시간입니다.'],
 ['ssl_session_tickets','on',tls,ssl,'TLS 세션 티켓을 통한 연결 재개를 허용합니다.'],
 ['ssl_prefer_server_ciphers','off',tls,ssl,'암호 협상에서 서버의 우선순위를 사용합니다.'],
 ['ssl_verify_client','off',tls,ssl,'클라이언트 인증서 검증 방식을 설정합니다.']
];
export function nginxModulePresets(context: string): NginxPreset[]{return rows.filter(row=>row[2].includes(context)).map(([name,value])=>({name,value,kind:'directive'}));}
export function nginxModuleSettingInfo(name: string): NginxSettingInfo | null{const row=rows.find(row=>row[0]===name);return row?{description:row[4],url:row[3]+'#'+name}:null;}
