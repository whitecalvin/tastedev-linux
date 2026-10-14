import test from 'node:test';
import assert from 'node:assert/strict';
import {redisKoreanHelpNames,redisSettingDescription as describe} from '../lib/redis-setting-description.ts';
import {redisSettingNames,redisSettingSuggestionNames} from '../lib/redis-setting-names.ts';
test('Redis Korean help covers connection, auth, memory and persistence without inventing unknown explanations',()=>{
 const expected=['bind','protected-mode','port','tcp-backlog','timeout','tcp-keepalive','unixsocket','unixsocketperm','daemonize','supervised','loglevel','logfile','databases','maxclients','requirepass','aclfile','user','maxmemory','maxmemory-policy','maxmemory-samples','save','dbfilename','dir','appendonly','appendfsync','appenddirname','stop-writes-on-bgsave-error','rdbcompression','rdbchecksum'];
 const tls=redisSettingNames.filter(name=>name.startsWith('tls-'));assert.equal(tls.length,20);expected.push(...tls);
 expected.push('bind-source-addr','replicaof','masterauth','masteruser','replica-serve-stale-data','replica-read-only','repl-diskless-sync','repl-diskless-sync-delay','repl-diskless-sync-max-replicas','repl-diskless-load','repl-ping-replica-period','repl-timeout','repl-disable-tcp-nodelay','repl-backlog-size','repl-backlog-ttl','replica-full-sync-buffer-limit','replica-priority','propagation-error-behavior','replica-ignore-disk-write-errors','replica-announced','min-replicas-to-write','min-replicas-max-lag','replica-announce-ip','replica-announce-port','replica-ignore-maxmemory','replica-lazy-flush','slaveof','slave-serve-stale-data','slave-read-only','repl-ping-slave-period','slave-priority','min-slaves-to-write','min-slaves-max-lag','slave-announce-ip','slave-announce-port','slave-ignore-maxmemory','slave-lazy-flush');
 expected.push(...redisSettingNames.filter(name=>name.startsWith('cluster-')&&name!=='cluster-ping-interval'));
 expected.push(...redisSettingSuggestionNames,'server_cpulist','bio_cpulist','aof_rewrite_cpulist','bgsave_cpulist','hash-max-ziplist-entries','hash-max-ziplist-value','zset-max-ziplist-entries','zset-max-ziplist-value','list-max-ziplist-size','lua-time-limit','list-max-ziplist-entries','list-max-ziplist-value','lua-replicate-commands','io-threads-do-reads');assert.deepEqual(redisKoreanHelpNames,[...new Set(expected)].sort());
 for(const name of expected){assert(redisSettingNames.includes(name),name);const help=describe(name,'ko-KR');assert.equal(help.language,'ko');assert(help.translated);assert(help.paragraphs.every(text=>/[가-힣]/.test(text)),name);}
 for(const name of ['custom.feature','constructor','__proto__',null])assert.equal(describe(name),null);
 assert.equal(describe('port','en-US'),null,'deferred translations must not silently label Korean as English');
 assert.deepEqual(describe('PORT'),describe('port'));
});

test('복제 한국어 안내는 초 단위, 0 값과 Sentinel 승격 조건을 구분한다',()=>{
 const text=name=>describe(name).paragraphs.join(' ');
 assert.match(text('repl-backlog-ttl'),/초.*0.*해제하지.*복제본.*적용하지/);
 assert.match(text('replica-full-sync-buffer-limit'),/0.*client-output-buffer-limit.*하드.*무제한.*뜻하지/);
 assert.match(text('replica-priority'),/Sentinel.*낮은 숫자.*0.*제외/);
 assert.match(text('replica-announced'),/no.*승격.*막지는.*replica-priority.*0/);
 assert.match(text('min-replicas-to-write'),/0.*제한.*쓰기.*복제 완료.*보장하지/);
 assert.match(text('repl-diskless-load'),/disabled.*파일.*on-empty-db.*DB.*swapdb.*추가 메모리/);
 assert.match(text('masterauth'),/masteruser.*ACL/);
 for(const [old,current] of [['slaveof','replicaof'],['slave-priority','replica-priority'],['min-slaves-to-write','min-replicas-to-write'],['cluster-slave-no-failover','cluster-replica-no-failover']]){
  assert(text(old).startsWith(current+'의 이전 표기입니다.'));
  assert(text(old).endsWith(text(current)));
 }
});

test('클러스터 한국어 안내는 밀리초, 내부 버스와 외부 주소 및 장애 읽기를 구분한다',()=>{
 const text=name=>describe(name).paragraphs.join(' ');
 assert.match(text('cluster-node-timeout'),/밀리초/);
 assert.match(text('cluster-port'),/버스.*0.*10000.*명령 포트.*별도/);
 assert.match(text('cluster-config-file'),/Redis.*갱신.*직접 편집하지.*공유하지/);
 assert.match(text('cluster-announce-ip'),/실제 수신 주소.*변경하지/);
 assert.match(text('cluster-announce-tls-port'),/tls-cluster.*no.*효과.*tls-port/);
 assert.match(text('cluster-announce-port'),/tls-cluster.*yes.*0.*TLS/);
 assert.match(text('cluster-allow-reads-when-down'),/일관성.*보장하지.*쓰기.*허용하지/);
 assert.match(text('cluster-replica-no-failover'),/자동.*수동.*막.*아닙니다/);
 assert.match(text('cluster-replica-validity-factor'),/0.*시간 검사.*끕니다/);
});
test('Korean help distinguishes disabling TCP and RDB from disabling all persistence or TLS',()=>{
 assert.match(describe('port').paragraphs[0],/0.*일반 TCP.*TLS/);
 assert.match(describe('save').paragraphs[0],/초와 변경 수.*빈 문자열.*자동 저장/);
 assert.match(describe('appendonly').paragraphs[0],/RDB.*별도로/);
 assert.match(describe('requirepass').paragraphs[0],/기본 ACL.*aclfile.*ACL LOAD.*무시/);
 assert.match(describe('aclfile').paragraphs[0],/user.*함께 사용하지/);
 assert.match(describe('maxmemory-policy').paragraphs[0],/noeviction.*키를 제거하지.*쓰기.*거부/);
});

test('Redis TLS 한국어 설명은 인증 방향, TLS 버전과 캐시 단위를 구분한다',()=>{
 assert.match(describe('tls-port').paragraphs[0],/일반 TCP.*별도.*port.*0/);
 assert.match(describe('tls-auth-clients').paragraphs[0],/yes.*필수.*no.*받지.*optional.*검증/);
 assert.match(describe('tls-ca-cert-file').paragraphs[0],/시스템 CA.*자동 사용하지/);
 assert.match(describe('tls-replication').paragraphs[0],/복제본.*원본/);
 assert.match(describe('tls-ciphers').paragraphs[0],/TLSv1.2 이하.*TLSv1.3.*tls-ciphersuites/);
 assert.match(describe('tls-dh-params-file').paragraphs[0],/OpenSSL 3.0.*필요하지/);
 assert.match(describe('tls-session-cache-size').paragraphs[0],/0.*제한 없음/);
 assert.match(describe('tls-session-cache-timeout').paragraphs[0],/초/);
});

test('공개 Redis 8.0.5 제안 목록 전체에 한국어 설명이 있으며 내부·알 수 없는 이름을 자동 설명하지 않는다',()=>{
 assert.equal(redisSettingSuggestionNames.length,185);
 for(const name of redisSettingSuggestionNames){
  const description=describe(name,'ko-KR');
  assert(description,name);assert.equal(description.language,'ko');
  assert(description.paragraphs.every(text=>text.length>15&&/[가-힣]/.test(text)),name);
 }
 for(const name of ['cluster-ping-interval','watchdog-period','custom.module-option'])assert.equal(describe(name),null);
});

test('한국어 도움말은 AOF 잘림과 중간 손상, 저장 방식과 종료 인수를 구분한다',()=>{
 const text=name=>describe(name).paragraphs.join(' ');
 assert.match(text('aof-load-truncated'),/끝부분.*yes|yes.*끝부분/);
 assert.match(text('aof-load-truncated'),/중간.*손상.*아닙니다/);
 assert.match(text('aof-use-rdb-preamble'),/별도 RDB.*아닙니다/);
 assert.match(text('auto-aof-rewrite-percentage'),/0.*자동 재작성.*끕니다/);
 assert.match(text('rdb-del-sync-files'),/AOF.*RDB.*모두.*꺼진.*어느 한.*무시/);
 for(const name of ['shutdown-on-sigint','shutdown-on-sigterm'])assert.match(text(name),/save.*nosave.*동시에 지정하지/);
 assert.match(text('no-appendfsync-on-rewrite'),/fsync.*생략.*내구성.*낮아/);
});

test('한국어 도움말은 로그 시간 단위와 0·음수의 다른 의미를 설명한다',()=>{
 const text=name=>describe(name).paragraphs.join(' ');
 assert.match(text('slowlog-log-slower-than'),/마이크로초.*음수.*끄고.*0.*모든 명령.*통신 시간.*포함하지/);
 assert.match(text('latency-monitor-threshold'),/밀리초.*0.*끕니다/);
 assert.match(text('lfu-decay-time'),/분.*0.*감소.*끕니다/);
 assert.match(text('busy-reply-threshold'),/밀리초.*0.*자동 종료.*아닙니다/);
 assert.match(text('notify-keyspace-events'),/K.*E.*하나.*빈 문자열.*A.*새 키.*포함하지/);
});

test('한국어 도움말은 메모리·스레드와 ACL 권한의 효과를 과장하지 않는다',()=>{
 const text=name=>describe(name).paragraphs.join(' ');
 assert.match(text('maxmemory-clients'),/비율.*1%.*100%.*연결.*해제.*0.*끕니다/);
 assert.match(text('client-output-buffer-limit'),/하드.*소프트.*초.*0.*제한/);
 assert.match(text('io-threads'),/1.*주 스레드.*명령 실행 전체.*아닙니다/);
 assert.match(text('disable-thp'),/운영체제 전체.*변경하지/);
 assert.match(text('list-max-listpack-size'),/양수.*항목 수.*-1.*-5.*4.*64.*KiB/);
 assert.match(text('oom-score-adj-values'),/원본.*복제본.*자식.*세 개/);
 assert.match(text('rename-command'),/폐기.*ACL.*AOF.*복제/);
 assert.match(text('enable-debug-command'),/no.*local.*yes.*ACL/);
 assert.match(text('sentinel'),/일반 Redis.*Sentinel.*바꾸지는/);
});

test('기존 파일의 별칭과 무시되는 폐기 옵션은 구분하고 새 목록에는 추가하지 않는다',()=>{
 for(const [old,current] of [['hash-max-ziplist-entries','hash-max-listpack-entries'],['list-max-ziplist-size','list-max-listpack-size'],['lua-time-limit','busy-reply-threshold'],['server_cpulist','server-cpulist']]){
  assert(describe(old).paragraphs[0].endsWith(describe(current).paragraphs[0]));
  assert(!redisSettingSuggestionNames.includes(old));
 }
 for(const name of ['list-max-ziplist-entries','list-max-ziplist-value','lua-replicate-commands','io-threads-do-reads']){
  assert.match(describe(name).paragraphs[0],/8.0.5.*인수 하나.*효과 없이 무시.*폐기/);
  assert(!redisSettingSuggestionNames.includes(name));
 }
});
