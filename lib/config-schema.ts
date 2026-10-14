export type ConfigValue = string | number | boolean;
export type ConfigValues = Record<string,ConfigValue>;
export type ConfigSchemaField = [key: string,label: string,type: 'select',fallback: ConfigValue,options: readonly string[]] | [key: string,label: string,type: 'switch' | 'number' | 'text' | 'email',fallback: ConfigValue];
export type ConfigSchema = {label: string; description: string; path: string; fields: ConfigSchemaField[]};
export const redisEvictionPolicies = Object.freeze([
  'noeviction',
  'allkeys-lru',
  'allkeys-lfu',
  'allkeys-random',
  'volatile-lru',
  'volatile-lfu',
  'volatile-random',
  'volatile-ttl',
]);
export const configSchemas = {
  nginx: {
    label: 'nginx',
    description: '웹사이트 제공 방식과 프록시 연결을 설정합니다.',
    path: '/etc/nginx/conf.d/linux-도메인.conf',
    fields: [
      ['domain', '도메인', 'text', 'app.example.com'],
      ['port', '수신 포트', 'number', 80],
      ['mode', '서비스 방식', 'select', 'proxy', ['proxy', 'static']],
      ['appPort', '프록시 앱 포트', 'number', 3000],
      ['root', '정적 파일 루트', 'text', '/var/www/html'],
    ],
  },
  certbot: {
    label: 'Certbot',
    description: 'nginx 연계 인증서 발급 또는 갱신 점검 명령을 구성합니다.',
    path: 'Certbot 명령 미리보기',
    fields: [
      ['domain', '인증서 도메인', 'text', 'app.example.com'],
      ['email', '연락 이메일', 'email', ''],
      ['operation', '작업 유형', 'select', 'issue', ['issue', 'renew-check']],
      ['certName', '갱신할 인증서 이름 (비우면 전체)', 'text', ''],
      ['staging', '테스트 인증서 사용', 'switch', true],
      ['authenticator', '인증 방식', 'select', 'nginx', ['nginx', 'webroot', 'standalone']],
      ['webroot', '웹 루트 경로', 'text', '/var/www/html'],
      ['installNginx', '발급 후 nginx HTTPS 자동 연계', 'switch', false],
    ],
  },
  nodejs: {
    label: 'Node.js',
    description: '앱에서 읽을 실행 환경 변수와 Node 런타임 메모리를 설정합니다.',
    path: '앱 실행 환경 파일',
    fields: [
      ['environment', '실행 환경', 'select', 'production', ['production', 'development', 'test']],
      ['port', '앱 포트', 'number', 3000],
      ['host', '앱 수신 주소', 'select', '127.0.0.1', ['127.0.0.1', '::1', '0.0.0.0', '::']],
      ['memory', 'Node 메모리 제한 (MB)', 'number', 512],
      ['logLevel', '앱 로그 수준', 'select', 'info', ['debug', 'info', 'warn', 'error']],
    ],
  },
  postgresql: {
    label: 'PostgreSQL',
    description: '연결 한도, 메모리와 서버 로그 수집을 설정합니다.',
    path: 'postgresql.conf 설정 조각',
    fields: [
      ['port', 'DB 포트', 'number', 5432],
      ['connections', '최대 연결 수', 'number', 100],
      ['sharedBuffers', '공유 버퍼 (MB)', 'number', 128],
      ['workMem', '작업 메모리 (MB)', 'number', 4],
      ['logging', '로그 파일 수집', 'switch', false],
    ],
  },
  mariadb: {
    label: 'MariaDB',
    description: '연결 한도와 InnoDB 메모리, 느린 쿼리 로그를 설정합니다.',
    path: 'MariaDB [mariadbd] 설정 조각',
    fields: [
      ['port', 'DB 포트', 'number', 3306],
      ['connections', '최대 연결 수', 'number', 100],
      ['bufferPool', 'InnoDB 버퍼 풀 (MB)', 'number', 128],
      ['charset', '서버 문자셋', 'select', 'utf8mb4', ['utf8mb4', 'utf8']],
      ['slowLog', '느린 쿼리 로그', 'switch', false],
      ['slowSeconds', '느린 쿼리 기준 (초)', 'number', 2],
    ],
  },
  redis: {
    label: 'Redis',
    description: '클라이언트 수, 캐시 메모리, 제거 정책과 지속성을 설정합니다.',
    path: 'redis.conf 설정 조각',
    fields: [
      ['port', 'Redis 포트 (0=TCP 수신 안 함)', 'number', 6379],
      ['connections', '최대 클라이언트 수', 'number', 100],
      ['maxMemory', '최대 메모리 (MB, 0=제한 없음)', 'number', 256],
      ['eviction', '메모리 제거 정책', 'select', 'noeviction', redisEvictionPolicies],
      ['appendOnly', 'AOF 지속성', 'switch', true],
      ['fsync', 'AOF 동기화', 'select', 'everysec', ['always', 'everysec', 'no']],
    ],
  },
} satisfies Record<string,ConfigSchema>;
export type ConfigKind = keyof typeof configSchemas;
export type DatabaseConfigKind = 'postgresql' | 'mariadb' | 'redis';
export const isConfigKind = (kind: unknown): kind is ConfigKind => typeof kind==='string'&&Object.hasOwn(configSchemas,kind);
export const isDatabaseConfigKind = (kind: unknown): kind is DatabaseConfigKind => kind==='postgresql'||kind==='mariadb'||kind==='redis';
export function configDefaults(kind: string): ConfigValues {
 if(!isConfigKind(kind))throw Object.assign(Error('지원하는 패키지를 선택하세요.'),{status:400});
 return Object.fromEntries(configSchemas[kind].fields.map(([key, , , value]) => [key,value]));
}
export const configLabels: Record<string,string> = {
  nginx: 'nginx (자동 HTTPS 연계)',
  webroot: 'webroot (기존 웹 루트)',
  standalone: 'standalone (80 포트 직접 사용)',
  proxy: '앱 리버스 프록시',
  static: '정적 웹사이트',
  issue: '인증서 발급',
  'renew-check': '갱신 테스트 (dry-run)',
};

export const redisEvictionDescriptions: Readonly<Record<string,string>> = Object.freeze({
  noeviction: '메모리 한도에 도달하면 키를 제거하지 않고 추가 메모리가 필요한 쓰기를 거부합니다.',
  'allkeys-lru': '전체 키에서 최근 사용이 적은 키를 근사 LRU 방식으로 제거합니다.',
  'allkeys-lfu': '전체 키에서 사용 빈도가 낮은 키를 근사 LFU 방식으로 제거합니다.',
  'allkeys-random': '전체 키에서 무작위로 키를 제거합니다.',
  'volatile-lru': 'TTL이 있는 키에서 최근 사용이 적은 키를 근사 LRU 방식으로 제거합니다.',
  'volatile-lfu': 'TTL이 있는 키에서 사용 빈도가 낮은 키를 근사 LFU 방식으로 제거합니다.',
  'volatile-random': 'TTL이 있는 키에서 무작위로 키를 제거합니다.',
  'volatile-ttl': 'TTL이 있는 키에서 만료까지 남은 시간이 짧은 키를 우선 제거합니다.',
});
