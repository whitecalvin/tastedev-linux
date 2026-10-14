import type {NginxPreset} from './nginx-presets.ts';
import type {NginxSettingInfo} from './nginx-setting-info.ts';
const contexts=['http','server','location'];
const url='https://nginx.org/en/docs/http/ngx_http_core_module.html#';
// Editable examples; module/version support is checked by native validation.
const rows: [string,string,string[],string,string?][]=[
 ['aio','off',contexts,'파일 비동기 입출력 방식입니다. on은 Linux에서 directio가 필요하며 threads 또는 threads=풀은 --with-threads 빌드가 필요합니다.','off'],
 ['aio_write','off',contexts,'프록시 임시 파일 쓰기에 비동기 입출력을 사용합니다. aio threads를 설정해야 합니다.','off'],
 ['default_type','application/octet-stream',contexts,'확장자 매핑이 없는 응답의 MIME 유형입니다.','text/plain'],
 ['resolver','127.0.0.1',contexts,'이름 조회에 사용할 신뢰할 DNS 서버 주소와 선택적 포트·유효 시간을 지정합니다.'],
 ['server_names_hash_bucket_size','64',['http'],'서버 이름 해시의 버킷 크기입니다. 플랫폼 기본값은 32·64·128 중 하나입니다.','32|64|128'],
 ['try_files','$uri $uri/ =404',['server','location'],'파일을 순서대로 확인하고 마지막 URI·이름 있는 location·상태 코드로 처리합니다.'],
 ['lingering_close','on',contexts,'연결 종료 전 남은 데이터를 처리합니다. always는 항상 기다리고 off는 즉시 종료합니다.','on'],
 ['lingering_time','30s',contexts,'연결 종료 전 남은 데이터를 처리할 최대 시간입니다.','30s'],
 ['lingering_timeout','5s',contexts,'연결 종료 전 다음 데이터를 기다릴 시간입니다.','5s'],
 ['log_subrequest','off',contexts,'하위 요청도 접근 로그에 기록합니다.','off'],
 ['max_ranges','16',contexts,'요청의 바이트 범위 수를 제한합니다. 0은 범위 요청을 해제합니다.'],
 ['merge_slashes','on',['http','server'],'URI의 연속 슬래시를 하나로 합쳐 경로를 비교합니다.','on'],
 ['msie_padding','on',contexts,'구형 MSIE의 오류 응답에 패딩을 추가합니다.','on'],
 ['msie_refresh','off',contexts,'구형 MSIE에는 리다이렉트 대신 새로고침 응답을 사용합니다.','off'],
 ['open_file_cache','off',contexts,'파일 정보를 캐시합니다. max=개수 inactive=시간 또는 off를 지정합니다.','off'],
 ['open_file_cache_errors','off',contexts,'파일 조회 실패도 캐시합니다.','off'],
 ['open_file_cache_min_uses','1',contexts,'파일 캐시 유지에 필요한 최소 접근 횟수입니다.','1'],
 ['open_file_cache_valid','60s',contexts,'파일 캐시 정보의 재확인 간격입니다.','60s'],
 ['output_buffers','2 32k',contexts,'파일 읽기 버퍼의 개수와 크기입니다.','2 32k'],
 ['port_in_redirect','on',contexts,'절대 리다이렉트 주소에 포트를 포함합니다.','on'],
 ['postpone_output','1460',contexts,'응답 전송을 모아 보낼 크기입니다. 0은 대기를 해제합니다.','1460'],
 ['read_ahead','0',contexts,'파일을 미리 읽습니다. Linux에서는 지정한 크기를 무시합니다.','0'],
 ['recursive_error_pages','off',contexts,'error_page의 반복 리다이렉트를 허용합니다.','off'],
 ['request_pool_size','4k',['http','server'],'요청당 메모리 풀 크기입니다. 일반적으로 변경할 필요가 없습니다.','4k'],
 ['reset_timedout_connection','off',contexts,'시간 초과 또는 444로 종료하는 연결에 TCP RST를 보냅니다.','off'],
 ['satisfy','all',contexts,'접근 검사 통과 조건입니다. all은 모두, any는 하나 이상입니다.','all'],
 ['send_lowat','0',contexts,'소켓 전송 최소 크기입니다. Linux에서는 무시됩니다.','0'],
 ['sendfile_max_chunk','2m',contexts,'sendfile 호출 한 번의 최대 전송량입니다. nginx 1.21.4 이전 기본값은 무제한입니다.','2m'],
 ['server_name_in_redirect','off',contexts,'절대 리다이렉트에 첫 server_name을 사용합니다.','off'],
 ['subrequest_output_buffer_size','4k',contexts,'하위 요청 응답 버퍼 크기입니다. 플랫폼 기본값은 4k 또는 8k입니다.','4k|8k'],
 ['server_names_hash_max_size','512',['http'],'서버 이름 해시의 최대 크기입니다.','512'],
 ['internal','',['location'],'외부 요청에는 404를 반환하고 내부 요청만 허용합니다. 값을 지정하지 않고 internal;로 작성합니다.'],
 ['auth_delay','0s',contexts,'401 인증 실패 응답을 지연합니다. nginx 1.17.10 이상이 필요합니다.','0s'],
 ['client_body_temp_path','/var/lib/nginx/body',contexts,'요청 본문 임시 파일의 디렉터리와 선택적 하위 경로 수준을 지정합니다. 워커의 쓰기 권한을 확인하세요.','client_body_temp'],
 ['connection_pool_size','512',['http','server'],'연결당 메모리 풀 크기입니다. 기본값은 플랫폼에 따라 256 또는 512바이트입니다. 일반적으로 변경할 필요가 없습니다.','256|512'],
 ['directio','off',contexts,'지정한 크기 이상의 파일을 직접 입출력으로 읽습니다. 해당 요청의 sendfile 사용은 해제됩니다.','off'],
 ['directio_alignment','512',contexts,'직접 입출력의 정렬 크기입니다. 파일시스템 요구에 맞춰 설정합니다.','512'],
 ['disable_symlinks','off',contexts,'파일 경로의 심볼릭 링크 허용 방식입니다. on은 거부하고 if_not_owner는 소유자가 다른 링크를 거부합니다. 선택적으로 from=경로를 지정합니다.','off'],
 ['if_modified_since','exact',contexts,'요청의 수정 시각 비교 방식입니다. off는 비교하지 않고, exact는 일치 여부, before는 그 이전 시각도 허용합니다.','exact'],
 ['ignore_invalid_headers','on',['http','server'],'유효하지 않은 이름의 요청 헤더를 무시합니다.','on'],
 ['keepalive_disable','msie6',contexts,'연결 재사용을 제한할 브라우저를 지정합니다. none은 제한을 해제하며 여러 브라우저를 나열할 수 있습니다.','msie6'],
 ['keepalive_min_timeout','0',contexts,'연결 재사용이나 워커 정상 종료 시 연결을 닫지 않고 유지할 최소 시간입니다. nginx 1.27.4 이상이 필요합니다.','0']
];
export function nginxHttpCorePresets(context: string): NginxPreset[]{return rows.filter(row=>row[2].includes(context||'')).map<NginxPreset>(([name,value])=>({name,value,kind:'directive'}));}
export function nginxHttpCoreSettingInfo(name: string,context?: string | null): NginxSettingInfo | null{const row=rows.find(row=>row[0]===name&&row[2].includes(context||''));return row?{description:row[3],defaultValue:row[4],url:url+name}:null;}
