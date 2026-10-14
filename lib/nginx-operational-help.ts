import type {NginxPreset} from './nginx-presets.ts';
import type {NginxSettingInfo} from './nginx-setting-info.ts';
// Descriptions for directives observed in the installed server configuration.
const entries: Record<string,NginxSettingInfo>={
  "server_names_hash_bucket_size": {
    "description": "서버 이름 해시의 버킷 크기입니다. 긴 server_name을 처리할 때 조정하며 기본값은 CPU 캐시 라인 크기에 따라 다릅니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_core_module.html#server_names_hash_bucket_size"
  },
  "proxy_headers_hash_max_size": {
    "description": "프록시 요청·응답 헤더 이름 해시의 최대 크기입니다. proxy_set_header와 proxy_hide_header 처리에 사용합니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_headers_hash_max_size"
  },
  "proxy_headers_hash_bucket_size": {
    "description": "proxy_set_header와 proxy_hide_header에서 사용하는 헤더 이름 해시의 버킷 크기입니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_headers_hash_bucket_size"
  },
  "proxy_cache_path": {
    "description": "캐시 저장 경로와 keys_zone의 이름·크기, levels, inactive, max_size 등을 지정합니다. http 블록에 작성하며 proxy_cache에서 영역 이름을 참조합니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_path"
  },
  "charset": {
    "description": "응답 Content-Type에 추가할 문자셋입니다. source_charset과 함께 문자셋 변환에 사용할 수 있으며 off는 문자셋 추가를 끕니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_charset_module.html#charset"
  },
  "http2": {
    "description": "HTTP/2를 활성화합니다. nginx 1.25.1 이상과 HTTP/2 모듈이 필요하며 TLS 연결에서는 ALPN 지원도 필요합니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_v2_module.html#http2"
  },
  "proxy_cookie_path": {
    "description": "업스트림의 Set-Cookie에서 Path 속성을 치환합니다. off는 상위 블록에서 상속한 치환 규칙을 해제합니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cookie_path"
  },
  "proxy_cache_bypass": {
    "description": "조건 값 중 하나라도 비어 있지 않고 0이 아니면 캐시에서 응답을 읽지 않습니다. 캐시 저장을 막는 proxy_no_cache와 구분됩니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_bypass"
  },
  "internal": {
    "description": "외부 요청에는 404를 반환하고 내부 리다이렉트·하위 요청 등 내부 요청만 허용하는 location입니다. 인수 없이 작성합니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_core_module.html#internal"
  },
  "ignore_invalid_headers": {
    "description": "잘못된 이름의 요청 헤더를 무시할지 정합니다. 유효한 이름은 영문·숫자·하이픈과 underscores_in_headers에서 허용한 밑줄입니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_core_module.html#ignore_invalid_headers"
  },
  "break": {
    "description": "현재 rewrite 지시어 목록의 처리를 중단합니다. location 안에서는 같은 location에서 요청 처리를 계속하며 인수 없이 작성합니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_rewrite_module.html#break"
  },
  "proxy_max_temp_file_size": {
    "description": "프록시 응답 버퍼링용 임시 파일의 최대 크기입니다. 0은 임시 파일 버퍼링을 끄지만 캐시 또는 디스크 저장에는 이 제한이 적용되지 않습니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_max_temp_file_size"
  },
  "proxy_cache": {
    "description": "proxy_cache_path의 keys_zone 이름으로 사용할 캐시 영역을 지정합니다. off는 상위 블록에서 상속한 캐시를 끕니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache"
  },
  "proxy_buffers": {
    "description": "연결마다 업스트림 응답을 읽을 버퍼의 개수와 크기입니다. 크기는 플랫폼의 메모리 페이지 크기를 고려해 지정합니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_buffers"
  },
  "proxy_buffer_size": {
    "description": "업스트림 응답의 첫 부분을 읽는 버퍼 크기입니다. 보통 응답 헤더가 들어가며 이 크기를 초과하는 헤더는 유효하지 않은 응답으로 처리됩니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_buffer_size"
  },
  "proxy_cache_key": {
    "description": "캐시 항목을 식별할 키입니다. 변수와 문자열을 조합하여 서로 다른 요청이 같은 캐시를 공유할지 정합니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_key"
  },
  "proxy_cache_valid": {
    "description": "응답 상태 코드별 캐시 유효 시간입니다. 코드 없이 시간을 지정하면 200·301·302에 적용하고 any는 모든 응답 코드를 대상으로 합니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_valid"
  },
  "proxy_cache_use_stale": {
    "description": "업스트림 오류·시간 초과·갱신 중 등 지정한 조건에서 오래된 캐시 응답을 허용합니다. 조건 목록으로 지정하며 off는 오래된 캐시 사용을 끕니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_use_stale"
  },
  "proxy_cache_background_update": {
    "description": "만료된 캐시를 백그라운드에서 갱신하면서 오래된 응답을 반환합니다. 갱신 중 오래된 응답 사용도 proxy_cache_use_stale로 허용해야 합니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_background_update"
  },
  "proxy_cache_lock": {
    "description": "같은 키의 새 캐시 항목을 한 요청만 업스트림에서 채우도록 잠급니다. 나머지 요청은 항목 완성 또는 잠금 대기 시간까지 기다립니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_lock"
  },
  "autoindex": {
    "description": "인덱스 파일이 없을 때 슬래시로 끝나는 요청에 디렉터리 목록을 생성합니다. on은 디렉터리 목록 노출을 허용합니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_autoindex_module.html#autoindex"
  },
  "limit_req_zone": {
    "description": "요청 속도 제한의 키, 공유 메모리 zone 이름·크기, rate를 정의합니다. http에 작성하며 rate는 r/s 또는 r/m 단위입니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_limit_req_module.html#limit_req_zone"
  },
  "limit_req": {
    "description": "지정한 zone의 요청 속도 제한을 적용합니다. burst는 초과 요청 대기 한도이고 nodelay는 대기 없이 버스트를 처리합니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_limit_req_module.html#limit_req"
  },
  "limit_req_status": {
    "description": "요청 속도 제한으로 거부한 요청에 반환할 HTTP 상태 코드입니다. 기본값은 503입니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_limit_req_module.html#limit_req_status"
  },
  "split_clients": {
    "description": "원본 문자열을 해시하여 백분율별 결과 변수 값을 정합니다. http에 문자열과 결과 변수 이름을 인수로 지정하며 같은 원본은 같은 구간에 배정됩니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_split_clients_module.html#split_clients"
  },
  "<percentage>": {
    "description": "이 백분율의 해시 구간에 배정할 결과 값입니다. 항목의 파일 순서대로 구간을 나누며 요청마다 무작위로 선택하는 방식이 아닙니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_split_clients_module.html#split_clients"
  },
  "*": {
    "description": "앞의 백분율 구간에 배정되지 않은 나머지 해시 구간의 결과 값입니다. split_clients의 마지막 항목에 작성합니다.",
    "url": "https://nginx.org/en/docs/http/ngx_http_split_clients_module.html#split_clients"
  }
};
export function nginxOperationalSettingInfo(name: string,context?: string | null): NginxSettingInfo | null{
 if(context==='split_clients')return entries[name==='*'?'*':'<percentage>'];
 if(['split_clients','<percentage>','*'].includes(name))return null;
 return Object.hasOwn(entries,name)?entries[name]:null;
}
export function nginxOperationalBlockInfo(name: string,context?: string | null): NginxSettingInfo | null{return name==='split_clients'&&[undefined,'http','split_clients'].includes(context||'')?entries.split_clients:null;}
