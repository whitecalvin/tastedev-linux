import type {NginxPreset} from './nginx-presets.ts';
import type {NginxSettingInfo} from './nginx-setting-info.ts';
// Editable examples from the nginx core reference. They are never auto-applied.
const url='https://nginx.org/en/docs/ngx_core_module.html#';
const rows: [string,string,(string | null)?,string?][]=[
 ['daemon','on','nginx를 백그라운드 데몬으로 실행할지 정합니다. 프로세스 관리 도구가 전경 실행을 요구하면 off를 사용합니다.','on'],
 ['debug_points','stop','내부 오류가 발생했을 때 디버깅을 위해 프로세스를 정지(stop)하거나 코어 파일을 생성(abort)합니다. 일반 운영 설정으로 추가할 필요는 없습니다.'],
 ['env','TZ','부모 프로세스에서 상속할 환경 변수 또는 변수=값을 지정합니다. TZ 외의 환경 변수는 기본적으로 제거됩니다. 내부용 NGINX 변수는 지정하지 마세요.','TZ'],
 ['load_module','/path/to/module.so','동적 모듈 파일을 불러옵니다. 설치된 nginx와 호환되는 실제 모듈 경로가 필요하며 nginx 1.9.11 이상에서 지원합니다.'],
 ['lock_file','/run/nginx.lock','잠금 파일 이름의 접두 경로입니다. 원자 연산으로 잠금을 구현하는 대부분의 시스템에서는 사용하지 않습니다.','logs/nginx.lock'],
 ['master_process','on','마스터가 워커 프로세스를 생성할지 정합니다. off는 nginx 자체 개발·디버깅 용도입니다.','on'],
 ['pcre_jit','off','설정의 정규식을 PCRE JIT로 컴파일합니다. JIT를 지원하는 PCRE 라이브러리와 nginx 빌드가 필요합니다. nginx 1.1.12 이상에서 지원합니다.','off'],
 ['ssl_engine','engine_name','OpenSSL 하드웨어 가속 엔진을 지정합니다. 설치된 OpenSSL에서 사용할 수 있는 실제 엔진 이름이 필요하며 검수 중 엔진이 로드될 수 있습니다.'],
 ['ssl_object_cache_inheritable','on','파일에서 읽은 TLS 객체를 설정 재조회 시 상속할지 정합니다. 파일 수정 시각과 파일 식별자가 같아야 하며 nginx 1.27.4 이상에서 지원합니다. 변수에서 읽은 객체는 상속하지 않습니다.','on'],
 ['thread_pool','default threads=32 max_queue=65536','파일 입출력에 사용할 스레드 풀 이름·스레드 수·대기열 한도를 지정합니다. --with-threads 빌드와 nginx 1.7.11 이상이 필요합니다. 대기열 초과 작업은 오류로 처리합니다.','default threads=32 max_queue=65536'],
 ['timer_resolution','100ms','워커가 현재 시각을 갱신할 간격을 지정해 시각 조회 호출을 줄입니다. 생략하면 커널 이벤트마다 갱신하며 타이머 구현은 연결 처리 방식에 따라 다릅니다.'],
 ['worker_cpu_affinity','auto',null],
 ['worker_priority','0','워커의 스케줄링 우선순위입니다. 음수는 높은 우선순위를 뜻하며 허용 범위와 변경 권한은 운영체제에 따라 다릅니다.','0'],
 ['worker_rlimit_core','0','워커가 생성할 수 있는 코어 파일의 최대 크기입니다. working_directory의 쓰기 권한과 운영체제 제한도 함께 확인해야 합니다.'],
 ['worker_rlimit_nofile','65535','워커가 열 수 있는 파일 디스크립터의 한도입니다. 연결 수 외에도 파일과 업스트림 소켓이 이 한도를 사용하며 운영체제 권한·한도의 영향도 받습니다.'],
 ['worker_shutdown_timeout','30s','워커가 정상 종료할 때 기다리는 최대 시간입니다. 시간이 지나면 열린 연결을 닫아 종료하며 nginx 1.11.11 이상에서 지원합니다.'],
 ['working_directory','/var/lib/nginx','워커의 작업 디렉터리입니다. 코어 파일 생성 등에 사용하며 워커 사용자에게 필요한 쓰기 권한이 있어야 합니다.']
];
export function nginxMainPresets(context: string): NginxPreset[]{return context==='main'?rows.map<NginxPreset>(([name,value])=>({name,value,kind:'directive'})):[];}
export function nginxMainSettingInfo(name: string): NginxSettingInfo | null{const row=rows.find(row=>row[0]===name);return row?.[2]?{description:row[2],url:url+name,...(row[3]!==undefined?{defaultValue:row[3]}:{})}:null;}
