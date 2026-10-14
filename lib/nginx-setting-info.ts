export type NginxSettingInfo = {description: string; url: string; defaultValue?: string; unknown?: boolean};
export type NginxHelpNode = {id: string; label: string; kind?: string; line?: number; start?: number; end?: number; children?: NginxHelpNode[]};
export type NginxSettingsSelection = {context: string; nodes: NginxHelpNode[]; addTargetId: string | null};
import {nginxProxySettingInfo} from './nginx-proxy-settings.ts';
import {nginxTlsSettingInfo} from './nginx-tls-settings.ts';
import {nginxChildContext} from './nginx-file-contexts.ts';
import {nginxSettingParts} from './nginx-setting-name.ts';
import {nginxProtocolBlockInfo,nginxProtocolSettingInfo} from './nginx-protocol-help.ts';
import {nginxModuleSettingInfo} from './nginx-module-settings.ts';
import {nginxMappingSettingInfo} from './nginx-mapping-help.ts';
import {nginxOperationalSettingInfo,nginxOperationalBlockInfo} from './nginx-operational-help.ts';
import {nginxMainSettingInfo} from './nginx-main-settings.ts';
import {nginxHttpCoreSettingInfo} from './nginx-http-core-settings.ts';
const core='https://nginx.org/en/docs/http/ngx_http_core_module.html';
const entries: Record<string,[string,string?]>={
 client_header_buffer_size:['요청 헤더를 읽는 기본 버퍼 크기입니다.','1k'],
 client_header_timeout:['요청 헤더 전체를 받는 데 허용하는 시간입니다.','60s'],
 large_client_header_buffers:['긴 요청 헤더에 사용하는 버퍼 수와 크기입니다.','4 8k'],
 underscores_in_headers:['요청 헤더 이름에 밑줄을 허용합니다.','off'],
 client_body_in_file_only:['요청 본문을 파일에 보관하는 방식입니다. clean은 처리 후 임시 파일을 제거합니다.','off'],
 client_body_in_single_buffer:['요청 본문을 하나의 메모리 버퍼에 보관합니다.','off'],
 chunked_transfer_encoding:['HTTP/1.1 응답의 청크 전송을 허용합니다.','on'],
 variables_hash_bucket_size:['변수 이름 해시의 버킷 크기입니다.','64'],
 variables_hash_max_size:['변수 이름 해시의 최대 크기입니다.','1024'],
 types_hash_bucket_size:['MIME 유형 해시의 버킷 크기입니다.','64'],
 types_hash_max_size:['MIME 유형 해시의 최대 크기입니다.','1024'],
 listen:['이 서버가 요청을 받을 주소와 포트입니다.'],
 server_name:['이 서버가 처리할 호스트 이름입니다.'],
 root:['요청 URI에 대응하는 파일을 찾을 기본 디렉터리입니다.'],
 alias:['선택한 location에 대응하는 파일 경로입니다.'],
 try_files:['파일 존재 여부를 순서대로 검사하고 마지막 대상으로 처리합니다.'],
 client_max_body_size:['허용할 요청 본문의 최대 크기입니다. 0은 크기 제한을 해제합니다.'],
 keepalive_timeout:['요청 사이에 연결을 유지할 시간입니다.'],
 error_page:['오류 응답을 처리할 URI 또는 대체 응답입니다.'],
 server_tokens:['오류 페이지와 응답 헤더의 nginx 버전 표시를 제어합니다.'],
 sendfile:['파일 전송에 sendfile 시스템 호출을 사용합니다.'],
 tcp_nodelay:['일부 연결에서 작은 데이터를 지연 없이 전송합니다.'],
 tcp_nopush:['파일 전송 시 TCP 패킷 사용을 조절합니다.'],
 etag:['정적 파일 응답에 ETag를 생성합니다.'],
 absolute_redirect:['nginx가 생성하는 리다이렉트에 절대 주소를 사용합니다.'],
 limit_rate:['응답 전송 속도를 제한합니다.'],
 limit_rate_after:['이 크기까지 전송한 뒤 속도 제한을 적용합니다.'],
 resolver_timeout:['DNS 이름 확인에 허용할 시간입니다.'],
 log_not_found:['파일을 찾지 못한 오류를 로그에 기록합니다.']
};

const additional: Record<string,NginxSettingInfo> = {
 "accept_mutex_delay": {
  "description": "accept_mutex가 켜져 있을 때 다른 워커가 연결을 수락 중이면, 다시 연결 수락을 시도하기까지 기다리는 최대 시간입니다.",
  "defaultValue": "500ms",
  "url": "https://nginx.org/en/docs/ngx_core_module.html#accept_mutex_delay"
 },
 "debug_connection": {
  "description": "디버그 로그를 기록할 클라이언트 주소·호스트 이름·CIDR을 지정합니다. unix:는 Unix 소켓 연결을 대상으로 합니다. --with-debug로 빌드된 nginx가 필요합니다.",
  "url": "https://nginx.org/en/docs/ngx_core_module.html#debug_connection"
 },
 "use": {
  "description": "연결 처리 방식을 지정합니다. 일반적으로 생략하면 nginx가 가장 효율적인 방식을 자동 선택합니다. epoll은 Linux에서 사용하는 방식이며 설치된 nginx가 지원해야 합니다.",
  "url": "https://nginx.org/en/docs/ngx_core_module.html#use"
 },
 "worker_aio_requests": {
  "description": "epoll 방식에서 aio를 사용할 때 워커 하나가 동시에 대기시킬 수 있는 비동기 입출력 요청 수입니다.",
  "defaultValue": "32",
  "url": "https://nginx.org/en/docs/ngx_core_module.html#worker_aio_requests"
 },
 "stall_threshold": {
  "description": "이벤트 루프 지연을 보고할 시간 기준입니다. nginx 1.29.0 이상에서 제공되는 상용 구독 기능이며 timer_resolution을 설정하면 이 기준은 무시됩니다.",
  "defaultValue": "1000ms",
  "url": "https://nginx.org/en/docs/ngx_core_module.html#stall_threshold"
 },
 "worker_processes": {
  "description": "워커 프로세스 수입니다. auto는 사용 가능한 CPU 수를 기준으로 정합니다.",
  "url": "https://nginx.org/en/docs/ngx_core_module.html#worker_processes"
 },
 "worker_connections": {
  "description": "워커 하나가 동시에 처리할 연결 수입니다. 클라이언트와 업스트림 연결을 모두 포함하며 파일 디스크립터 한도의 영향도 받습니다.",
  "url": "https://nginx.org/en/docs/ngx_core_module.html#worker_connections"
 },
 "user": {
  "description": "워커 프로세스를 실행할 사용자와 선택적 그룹입니다. 마스터가 권한을 내려 실행할 때 사용합니다.",
  "url": "https://nginx.org/en/docs/ngx_core_module.html#user"
 },
 "pid": {
  "description": "마스터 프로세스의 PID를 저장할 파일 경로입니다.",
  "url": "https://nginx.org/en/docs/ngx_core_module.html#pid"
 },
 "include": {
  "description": "설정 파일 또는 와일드카드에 맞는 파일들을 현재 위치에 포함합니다. 포함한 내용은 해당 블록에서 유효해야 합니다.",
  "url": "https://nginx.org/en/docs/ngx_core_module.html#include"
 },
 "load_module": {
  "description": "동적 모듈 파일을 불러옵니다. 설치된 nginx와 호환되는 모듈 경로를 지정합니다.",
  "url": "https://nginx.org/en/docs/ngx_core_module.html#load_module"
 },
 "error_log": {
  "description": "오류 로그의 파일 경로와 최소 심각도입니다. 지정한 수준 이상의 메시지를 기록하며 stderr와 syslog도 사용할 수 있습니다.",
  "url": "https://nginx.org/en/docs/ngx_core_module.html#error_log"
 },
 "multi_accept": {
  "description": "켜면 워커가 대기 중인 새 연결을 한 번에 모두 수락합니다. 끄면 한 번에 하나씩 수락합니다.",
  "url": "https://nginx.org/en/docs/ngx_core_module.html#multi_accept"
 },
 "accept_mutex": {
  "description": "워커가 새 연결을 번갈아 수락하도록 조정합니다. EPOLLEXCLUSIVE 또는 reuseport 환경에서는 켤 필요가 없습니다.",
  "url": "https://nginx.org/en/docs/ngx_core_module.html#accept_mutex"
 },
 "worker_rlimit_nofile": {
  "description": "워커가 열 수 있는 파일 디스크립터 수의 한도를 설정합니다.",
  "url": "https://nginx.org/en/docs/ngx_core_module.html#worker_rlimit_nofile"
 },
 "default_type": {
  "description": "MIME 유형을 판별하지 못한 응답의 기본 Content-Type입니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_core_module.html#default_type"
 },
 "client_body_buffer_size": {
  "description": "요청 본문을 읽는 메모리 버퍼 크기입니다. 본문이 버퍼보다 크면 일부 또는 전체를 임시 파일에 저장할 수 있습니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_core_module.html#client_body_buffer_size"
 },
 "client_body_timeout": {
  "description": "요청 본문을 연속해서 읽는 사이의 제한 시간입니다. 전체 업로드 시간 제한이 아닙니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_core_module.html#client_body_timeout"
 },
 "send_timeout": {
  "description": "응답을 클라이언트에 연속해서 쓰는 사이의 제한 시간입니다. 전체 응답 전송 시간 제한이 아닙니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_core_module.html#send_timeout"
 },
 "keepalive_requests": {
  "description": "연결 하나에서 처리할 최대 요청 수입니다. 한도에 도달하면 연결을 닫습니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_core_module.html#keepalive_requests"
 },
 "keepalive_time": {
  "description": "연결을 재사용할 수 있는 최대 시간입니다. 시간이 지나면 다음 요청을 처리한 뒤 연결을 닫습니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_core_module.html#keepalive_time"
 },
 "resolver": {
  "description": "업스트림 등의 이름 확인에 사용할 DNS 서버 주소입니다. 캐시 유효 시간과 IPv4·IPv6 사용 여부도 지정할 수 있습니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_core_module.html#resolver"
 },
 "access_log": {
  "description": "요청 로그의 저장 경로와 형식 이름입니다. off는 해당 범위의 요청 로그를 끕니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_log_module.html#access_log"
 },
 "log_format": {
  "description": "요청 로그 형식에 이름을 붙이고 변수와 문자열로 기록 내용을 정의합니다. access_log에서 이 이름을 사용합니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_log_module.html#log_format"
 },
 "index": {
  "description": "슬래시로 끝나는 요청에 사용할 인덱스 파일을 지정한 순서대로 찾습니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_index_module.html#index"
 },
 "return": {
  "description": "요청 처리를 끝내고 상태 코드와 응답 본문 또는 리다이렉트 주소를 반환합니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_rewrite_module.html#return"
 },
 "rewrite": {
  "description": "정규식과 치환 문자열로 요청 URI를 변경합니다. last·break·redirect·permanent 플래그로 이후 처리를 정합니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_rewrite_module.html#rewrite"
 },
 "set": {
  "description": "변수에 문자열 또는 다른 변수를 조합한 값을 지정합니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_rewrite_module.html#set"
 },
 "proxy_pass": {
  "description": "요청을 전달할 업스트림 URL입니다. URL에 URI를 포함하면 location에 일치하는 URI 부분의 치환 방식이 달라집니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass"
 },
 "add_header": {
  "description": "응답 헤더를 추가합니다. always를 지정하면 응답 상태 코드에 관계없이 추가합니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_headers_module.html#add_header"
 },
 "expires": {
  "description": "응답의 Expires와 Cache-Control 유효 시간을 설정합니다. off는 이 지시어에 의한 변경을 끕니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_headers_module.html#expires"
 },
 "server": {
  "description": "업스트림 서버의 주소와 선택적 포트입니다. weight·max_fails·fail_timeout·backup 등의 매개변수로 분산 및 장애 처리를 조정합니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_upstream_module.html#server"
 },
 "keepalive": {
  "description": "워커마다 캐시에 보관할 유휴 업스트림 연결 수입니다. 업스트림 전체 연결 수를 제한하는 값은 아닙니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_upstream_module.html#keepalive"
 },
 "types": {
  "description": "파일 확장자를 MIME 유형에 연결하는 블록입니다. include mime.types로 공통 매핑을 불러올 수 있습니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_core_module.html#types"
 }
};

Object.assign(additional, {
 "fastcgi_param": {
  "description": "FastCGI 서버에 전달할 매개변수 이름과 값입니다. if_not_empty를 붙이면 값이 비어 있지 않을 때만 전달합니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_fastcgi_module.html#fastcgi_param"
 },
 "fastcgi_pass": {
  "description": "요청을 전달할 FastCGI 서버의 주소와 포트 또는 unix: 소켓 경로입니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_fastcgi_module.html#fastcgi_pass"
 },
 "fastcgi_index": {
  "description": "URI가 슬래시로 끝날 때 $fastcgi_script_name에 덧붙일 파일 이름입니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_fastcgi_module.html#fastcgi_index"
 },
 "fastcgi_split_path_info": {
  "description": "두 캡처를 가진 정규식으로 URI를 스크립트 이름과 PATH_INFO로 나눕니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_fastcgi_module.html#fastcgi_split_path_info"
 },
 "fastcgi_read_timeout": {
  "description": "FastCGI 응답을 연속해서 읽는 사이의 제한 시간입니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_fastcgi_module.html#fastcgi_read_timeout"
 },
 "fastcgi_buffering": {
  "description": "FastCGI 응답을 메모리 버퍼와 필요한 경우 임시 파일에 저장합니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_fastcgi_module.html#fastcgi_buffering"
 },
 "fastcgi_buffers": {
  "description": "FastCGI 응답을 읽을 연결별 버퍼 수와 크기입니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_fastcgi_module.html#fastcgi_buffers"
 },
 "ssl_ciphers": {
  "description": "클라이언트 TLS 연결에 사용할 암호 목록입니다. OpenSSL 형식으로 지정하며 TLS 1.3 암호 설정과 구분됩니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_ssl_module.html#ssl_ciphers"
 },
 "ssl_dhparam": {
  "description": "DHE 암호에 사용할 PEM 형식의 DH 매개변수 파일 경로입니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_ssl_module.html#ssl_dhparam"
 },
 "ssl_trusted_certificate": {
  "description": "클라이언트 인증서 또는 OCSP 응답 검증에 사용할 신뢰 CA 인증서 파일입니다. 클라이언트에게 전송하지 않습니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_ssl_module.html#ssl_trusted_certificate"
 },
 "ssl_stapling": {
  "description": "서버 인증서의 OCSP 응답을 TLS 핸드셰이크에 첨부하는 기능입니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_ssl_module.html#ssl_stapling"
 }
});

Object.assign(additional, {
 "worker_cpu_affinity": {
  "description": "워커별 CPU 사용 범위를 비트 마스크로 지정합니다. auto는 워커를 CPU에 자동 배정하며 선택적 마스크로 대상 CPU를 제한할 수 있습니다.",
  "url": "https://nginx.org/en/docs/ngx_core_module.html#worker_cpu_affinity"
 },
 "proxy_ssl_name": {
  "description": "HTTPS 업스트림 인증서 검증과 SNI에 사용할 이름입니다. SNI를 보내려면 proxy_ssl_server_name도 켜야 합니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_ssl_name"
 },
 "allow": {
  "description": "접근을 허용할 IP 주소·CIDR·unix: 또는 all입니다. allow와 deny를 파일 순서대로 검사해 처음 일치한 규칙을 적용합니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_access_module.html#allow"
 },
 "deny": {
  "description": "접근을 거부할 IP 주소·CIDR·unix: 또는 all입니다. allow와 deny를 파일 순서대로 검사해 처음 일치한 규칙을 적용합니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_access_module.html#deny"
 }
});

// Help for directives encountered in installed files; no configuration is added automatically.
Object.assign(additional, {
 "ssl_stapling_verify": {
  "description": "OCSP 응답의 서명을 검증합니다. ssl_trusted_certificate에 발급자·중간·루트 CA 인증서를 지정해야 합니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_ssl_module.html#ssl_stapling_verify",
  "defaultValue": "off"
 },
 "ssl_client_certificate": {
  "description": "클라이언트 인증서 검증에 사용할 PEM CA 인증서 파일입니다. CA 목록은 클라이언트에게 전송되며 검증 방식은 ssl_verify_client에서 정합니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_ssl_module.html#ssl_client_certificate"
 },
 "ssl_verify_depth": {
  "description": "클라이언트 인증서 체인을 검증할 최대 깊이입니다. 정수로 지정합니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_ssl_module.html#ssl_verify_depth",
  "defaultValue": "1"
 },
 "ssl_buffer_size": {
  "description": "TLS 응답 전송 버퍼의 크기입니다. k 단위를 사용할 수 있으며 작은 값은 첫 응답 지연과 전송 효율에 영향을 줍니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_ssl_module.html#ssl_buffer_size",
  "defaultValue": "16k"
 },
 "set_real_ip_from": {
  "description": "실제 클라이언트 주소를 전달한다고 신뢰할 프록시의 IP·CIDR·호스트 이름 또는 unix:입니다. 신뢰할 수 있는 프록시만 지정하며 realip 모듈이 필요합니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_realip_module.html#set_real_ip_from"
 },
 "real_ip_header": {
  "description": "클라이언트 주소를 읽을 요청 헤더 이름입니다. proxy_protocol을 사용하려면 listen에도 proxy_protocol을 지정해야 하며 realip 모듈이 필요합니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_realip_module.html#real_ip_header",
  "defaultValue": "X-Real-IP"
 },
 "real_ip_recursive": {
  "description": "끄면 전달된 마지막 주소를 사용하고, 켜면 마지막 신뢰하지 않는 주소를 사용합니다. 원래 연결 주소가 신뢰 목록에 있을 때 적용하며 realip 모듈이 필요합니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_realip_module.html#real_ip_recursive",
  "defaultValue": "off"
 },
 "rewrite_log": {
  "description": "URI 재작성 처리 결과를 error_log의 notice 수준으로 기록합니다. 해당 로그 수준도 notice 이상 메시지를 포함하도록 설정해야 합니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_rewrite_module.html#rewrite_log",
  "defaultValue": "off"
 },
 "uninitialized_variable_warn": {
  "description": "초기화되지 않은 변수 사용에 대한 경고를 로그에 기록할지 정합니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_rewrite_module.html#uninitialized_variable_warn",
  "defaultValue": "on"
 }
});

const upstreamHelp: Record<string,NginxSettingInfo> = {
 "server": {
  "description": "백엔드 주소(IP·도메인·unix: 경로)와 선택 인수입니다. weight는 가중치, max_conns는 활성 연결 한도(0=제한 없음), max_fails·fail_timeout은 실패 횟수와 제외 기간, backup은 예비 서버, down은 제외 상태입니다. resolve는 zone·resolver가 필요하며 공개 nginx 1.27.3 이상에서 동적 DNS를 지원합니다. service는 resolve와 포트 없는 호스트 이름에 사용합니다. backup은 hash·ip_hash·random 방식과 함께 사용할 수 없습니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_upstream_module.html#server"
 },
 "keepalive": {
  "description": "워커마다 캐시에 유지할 유휴 업스트림 연결 수입니다. 전체 활성 연결 수를 제한하지 않습니다. nginx 1.28에서는 부하 분산 방식을 이 항목보다 앞에 두고, HTTP 프록시에 proxy_http_version 1.1과 proxy_set_header Connection \"\"를 지정해야 연결을 재사용할 수 있습니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_upstream_module.html#keepalive"
 },
 "zone": {
  "description": "업스트림 그룹의 설정과 실행 상태를 워커 사이에 공유할 메모리 영역의 이름과 크기입니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_upstream_module.html#zone"
 },
 "hash": {
  "description": "지정한 키의 해시로 HTTP 백엔드를 선택합니다. consistent는 서버 추가·제거 시 키 재배치를 줄입니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_upstream_module.html#hash"
 },
 "ip_hash": {
  "description": "클라이언트 IP를 기준으로 HTTP 백엔드를 선택합니다. 같은 클라이언트는 해당 서버가 사용 가능하면 같은 서버로 전달됩니다. 인수 없이 작성합니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_upstream_module.html#ip_hash"
 },
 "least_conn": {
  "description": "서버 가중치를 고려하여 활성 연결이 가장 적은 HTTP 백엔드를 선택합니다. 인수 없이 작성합니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_upstream_module.html#least_conn"
 },
 "random": {
  "description": "가중치를 고려하여 HTTP 백엔드를 무작위로 선택합니다. two는 두 후보를 비교하며 기본 비교 방식은 least_conn입니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_upstream_module.html#random"
 },
 "resolver": {
  "description": "이 HTTP 업스트림 그룹의 서버 이름을 확인할 DNS 서버입니다. upstream 안에서 사용하려면 nginx 1.27.3 이상 또는 해당 기능을 지원하는 상용 버전이 필요합니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_upstream_module.html#resolver"
 },
 "keepalive_requests": {
  "description": "업스트림 연결 하나에서 처리할 최대 요청 수입니다. 한도에 도달하면 연결을 닫습니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_upstream_module.html#keepalive_requests"
 },
 "keepalive_time": {
  "description": "업스트림 연결을 재사용할 수 있는 최대 시간입니다. 시간이 지나면 다음 요청을 처리한 뒤 연결을 닫습니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_upstream_module.html#keepalive_time"
 },
 "keepalive_timeout": {
  "description": "유휴 업스트림 연결을 캐시에 유지할 시간입니다. 시간이 지나면 해당 연결을 닫습니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_upstream_module.html#keepalive_timeout"
 },
 "resolver_timeout": {
  "description": "이 업스트림 그룹의 서버 이름을 DNS로 확인하는 데 허용할 시간입니다. 지원 여부는 설치된 nginx 버전에 따라 다릅니다.",
  "url": "https://nginx.org/en/docs/http/ngx_http_upstream_module.html#resolver_timeout"
 }
};
Object.assign(additional, {
 auth_basic: {
  description: 'HTTP Basic 인증의 realm 문자열입니다. off는 상위 블록에서 상속한 Basic 인증을 해제합니다.',
  defaultValue: 'off',
  url: 'https://nginx.org/en/docs/http/ngx_http_auth_basic_module.html#auth_basic'
 },
 auth_basic_user_file: {
  description: 'HTTP Basic 인증에 사용할 사용자 이름과 암호 해시가 담긴 파일 경로입니다. auth_basic으로 인증을 활성화하며 파일 값은 이 화면에서 읽지 않습니다.',
  url: 'https://nginx.org/en/docs/http/ngx_http_auth_basic_module.html#auth_basic_user_file'
 }
});
function checkedSettingInfo(value: unknown): NginxSettingInfo | null {if(value===null||typeof value!=='object'||!('description' in value)||typeof value.description!=='string'||!('url' in value)||typeof value.url!=='string')return null;return {description:value.description,url:value.url,...('defaultValue' in value&&typeof value.defaultValue==='string'?{defaultValue:value.defaultValue}:{}),...('unknown' in value&&value.unknown===true?{unknown:true}:{})};}
export function nginxSettingInfo(name: string,context?: string | null): NginxSettingInfo{if(context?.includes(':'))return checkedSettingInfo(nginxProtocolSettingInfo(name,context))||{description:'이 항목은 외부 모듈 또는 사용자 지정 지시어일 수 있습니다. 설치된 모듈의 문서에서 의미와 허용 값을 확인하세요.',url:'https://nginx.org/en/docs/dirindex.html',unknown:true};if(context==='types')return name==='include'?{description:'types 블록 없이 MIME 유형과 확장자 항목만 담은 파일을 포함합니다. types { }를 감싼 일반 mime.types 파일은 상위 http·server·location에서 포함하세요.',url:additional.include.url}:{description:'선택된 MIME 유형에 연결할 파일 확장자 목록입니다.',url:core+'#types'};const mapping=checkedSettingInfo(nginxMappingSettingInfo(name,context))||checkedSettingInfo(nginxOperationalSettingInfo(name,context))||checkedSettingInfo(nginxMainSettingInfo(name))||checkedSettingInfo(nginxHttpCoreSettingInfo(name,context));if(mapping)return mapping;if(context==='upstream'&&Object.hasOwn(upstreamHelp,name))return upstreamHelp[name];const record=Object.hasOwn(entries,name)?entries[name]:null;return record?{description:record[0],defaultValue:record[1],url:core+'#'+name}:Object.hasOwn(additional,name)?additional[name]:nginxModuleSettingInfo(name)||checkedSettingInfo(nginxProxySettingInfo(name,context))||checkedSettingInfo(nginxTlsSettingInfo(name,context))||{description:'이 항목은 외부 모듈 또는 사용자 지정 지시어일 수 있습니다. 설치된 모듈의 문서에서 의미와 허용 값을 확인하세요.',url:'https://nginx.org/en/docs/dirindex.html',unknown:true};}

export function nginxSettingMatches(name: string,value: string,query: string,translate: (text: string)=>string = text=>text,context?: string | null){const info=nginxSettingInfo(name,context);return [name,value,info?.description,info&&translate(info.description)].filter(Boolean).join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());}

// Block help is separate: `server {}` is not an upstream `server address;`.
const blockHelp: Record<string,[string,string]>={
 if:["조건이 참이면 내부 설정을 적용하는 블록입니다. server 또는 location 안에서 괄호로 조건을 지정하며 변수 비교·정규식·파일 존재 검사를 사용할 수 있습니다.",'https://nginx.org/en/docs/http/ngx_http_rewrite_module.html#if'],
 events:['연결 수락과 워커의 연결 처리 방식을 설정하는 블록입니다. 인수 없이 최상위에 작성합니다.','https://nginx.org/en/docs/ngx_core_module.html#events'],
 http:['HTTP 서버 공통 설정과 server·upstream 블록을 담습니다. 인수 없이 최상위에 작성합니다.',core+'#http'],
 server:['요청을 처리할 가상 HTTP 서버입니다. 인수 없이 http 안에 작성하고 listen과 server_name으로 대상 요청을 정합니다.',core+'#server'],
 location:['요청 URI에 따라 처리 방식을 나눕니다. 경로 앞에 =는 정확 일치, ^~는 접두 경로 우선, ~는 정규식, ~*는 대소문자 무시 정규식을 뜻합니다.',core+'#location'],
 upstream:['백엔드 서버 그룹입니다. 인수에 그룹 이름을 지정하고 내부 server 항목으로 대상 주소를 등록합니다.','https://nginx.org/en/docs/http/ngx_http_upstream_module.html#upstream'],
 types:['파일 확장자를 MIME 유형에 연결하는 블록입니다. include mime.types로 공통 매핑을 불러올 수 있습니다.',core+'#types'],
 limit_except:['지정한 HTTP 메서드를 제외한 요청에 접근 제한을 적용합니다. location 안에서 메서드를 인수로 지정합니다. GET을 제외하면 HEAD도 제외됩니다.',core+'#limit_except'],
 map:['원본 변수 값에 따라 결과 변수 값을 만듭니다. http 안에서 원본 값과 결과 변수 이름을 인수로 지정하고 내부에 매핑 규칙을 작성합니다.','https://nginx.org/en/docs/http/ngx_http_map_module.html#map'],
 geo:['클라이언트 IP 주소에 따라 변수 값을 정합니다. http 안에서 결과 변수 이름을 지정하고 내부에 주소 또는 CIDR별 값을 작성합니다.','https://nginx.org/en/docs/http/ngx_http_geo_module.html#geo']
};
export function nginxBlockInfo(name: string,context?: string | null): NginxSettingInfo{if(context?.startsWith('unknown:'))return nginxSettingInfo(name,context);const protocol=checkedSettingInfo(nginxOperationalBlockInfo(name,context))||checkedSettingInfo(nginxProtocolBlockInfo(name,context));if(protocol)return protocol;const entry=Object.hasOwn(blockHelp,name)?blockHelp[name]:null;return entry?{description:entry[0],url:entry[1]}:{description:'이 항목은 외부 모듈 또는 사용자 지정 지시어일 수 있습니다. 설치된 모듈의 문서에서 의미와 허용 값을 확인하세요.',url:'https://nginx.org/en/docs/dirindex.html',unknown:true};}

// A directly selected directive must retain its parent's module context.
export function nginxSettingsSelection(nodes: NginxHelpNode[] | null | undefined,id: string | null | undefined,rootContext='main'): NginxSettingsSelection{
 function visit(list: NginxHelpNode[] | null | undefined,parent=rootContext,parentId: string | null=null): NginxSettingsSelection | null{for(const node of list||[]){const name=nginxSettingParts(node.label).name,context=nginxChildContext(parent,name);if(node.id===id)return node.kind==='directive'?{context:parent,nodes:[node],addTargetId:parentId}:{context,nodes:node.children||[],addTargetId:node.id};const found=visit(node.children,context,node.id);if(found)return found;}return null;}
 return id==null?{context:rootContext,nodes:nodes||[],addTargetId:null}:visit(nodes)||{context:rootContext,nodes:[],addTargetId:null};
}
