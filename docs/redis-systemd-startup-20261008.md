# Redis 기본 프로세스 제목과 시작 기록 — 2026-10-08

Redis 7 공식 redis.conf의 set-proc-title 기본값 yes는 실행 인수를 프로세스 제목으로 바꾼다. 기존 제품은 /proc cmdline에서 명시적인 설정 파일을 증명하지 못하면 설정 적용을 거부했다. 일반적인 기본 실행을 지원하기 위해 잃어버린 argv를 systemd의 실제 실행 이력으로 확인하는 경로를 추가했다.

공식 systemd ExecStart D-Bus 타입 a(sasbttttuii)의 실행 파일·argv·시작/종료 시각·PID·종료 상태를 구조화된 busctl JSON으로 읽는다. 단일 실행 기록, 정확한 /usr/bin/redis-server 및 /etc/redis/redis.conf, 허용된 foreground/systemd 옵션, 이미 시작했고 아직 종료하지 않은 상태, active MainPID와 일치 조건이 필요하다. 시작 기록도 두 번 읽어 동일성을 검사하며 실제 /proc 실행 파일·UID·starttime·PID·cmdline 및 manager 상태 안정성 검사를 유지한다. cmdline이 단일 제목인 경우에만 보완하며 여러 인수의 다른 명시적 main은 거부한다. 사용하지 않은 unit 설정이나 프로세스 제목의 문자열 자체는 시작 경로 증거로 사용하지 않는다. busctl이 없거나 기록이 불충분하면 조회에는 startupMainVerified=false이며 적용은 계속 거부한다.

원문 시작 인수와 프로세스 제목은 반환/오류/로그에 포함하지 않는다. 새로운 명령은 고정된 서비스 D-Bus 대상과 ExecStart 속성의 읽기뿐이며 native lock supervisor를 통과한다. 기존 운영 설정이나 Redis의 제목 옵션을 바꾸지 않는다.

관련 파서·실제 호출 경로의 의존성 fixture·상태/PID/실행 파일 변경/인수 override/비밀 값/잘못된 자료 거부·기존 config hooks/적용/오류 규약 회귀37개 통과. 103번 실제 busctl 자료 구조를 읽기 전용 확인했고 자체 30초 sleep transient unit의 이미 시작한 기록·미종료·MainPID 일치가 성립함을 확인 후 즉시 종료했다. 기존 MariaDB unit의 시작 기록은 PID가 일치하지 않으므로 이 조건으로 신뢰할 수 없음도 관측했다. 구조 검사에 sleep fixture를 썼으므로 Redis 실제 PID 식별 성공으로 확대하지 않는다.

증거 `.runtime/verification/redis-systemd-startup-20261008/result.json`. 현재 제품으로 실제 Redis systemd unit의 제목 변경 상태→원래 GUI/API/helper 적용/복원 수용 검사는 다음 단계다. 전체 시스템 완료로 처리하지 않는다.

출처: https://raw.githubusercontent.com/redis/redis/7.0/redis.conf (set-proc-title), https://wiki.freedesktop.org/www/Software/systemd/dbus/ (ExecStart 구조), https://raw.githubusercontent.com/systemd/systemd/v255/src/core/service.c (서비스 실행 명령 복원에서 path/argv 일치).

## 실제 Redis systemd 식별 후속

새 scripts/verification/redis-service-identity-remote.py가 APT metadata SHA와 일치하는 redis-tools 및 필요한 라이브러리를 전용 임시 경로에 추출했다. systemd transient unit의 /usr·/etc·/var/lib mount를 private 폴더로 구성하고 실제 /usr/bin/redis-server /etc/redis/redis.conf를 Type=exec로 실행했다. port0/사설 Unix socket/기본 set-proc-title yes로 기동했다. 호스트 설치 파일을 추가하지 않았다.

현재 실제 inspectRedisService가 /proc 실행 파일·UID·starttime·변경된 cmdline을 읽고 systemctl active PID 및 실제 busctl ExecStart 이력을 조회하여 mode=systemd-started-main, identityVerified/startupMainVerified=true를 반환했다. 고정 systemctl/busctl 어댑터는 논리 단일 서비스/object만 자체 unit으로 매핑한다. 실행 기록의 argv/PID를 변조하거나 process snapshot을 fixture로 대체하지 않았다.

실제 Redis7.0.15 binary SHA=8716cd03cf5a0fcd99d0e95f9b04f7983fb134345d6e5802a7f4259af3658b6d. 전송한 서비스 식별 모듈 SHA는 결과에 기록했다. 호스트 redis-server 설치 유무 보존·전용 unit 종료·private package/config/data 제거 확인. 증거 `.runtime/verification/redis-service-identity-20261008T101521Z/result.json`. 실제 설정 변경/helper/native lock/GUI 적용 검사는 이 실행에 포함하지 않았다.

최초 101350Z 제어 실패, 101420Z/101445Z start-service 실패는 보존했다. systemd-run이 namespace 생성 전 호스트에서 Redis 실행 파일을 찾는 검수 준비 문제였다. 공식 v255 run.c에서 ExecSearchPath 속성을 제공하면 이 사전 검색을 생략함을 확인하고 고정 /usr/bin을 검수 unit에 지정한 후 성공했다. 기존 운영 서비스/제품 신뢰 조건을 바꾸지 않았다.
