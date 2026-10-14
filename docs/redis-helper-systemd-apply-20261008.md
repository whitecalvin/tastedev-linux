# Redis 현재 helper → 실제 systemd 적용/복원 — 2026-10-08

103번 APT SHA 검증된 Redis7.0.15로 기본 set-proc-title yes/port0/사설 Unix socket/AOF 한글 값 fixture를 구성했다. 전용 systemd Type=notify/NotifyAccess=main은 실제 /usr/bin/redis-server /etc/redis/redis.conf 명령을 private /usr·설정·데이터 mount에서 실행한다. 전용 helper mount는 /etc/redis 및 /var/lib/linux 상태만 임시 fixture로 연결한다. 기존 설치 helper와 운영 상태/설정을 교체하지 않는다. 고정 systemctl/busctl 어댑터는 전용 단일 unit으로만 show/restart 및 ExecStart 읽기를 연결한다.

현재 canonical linux-admin 및 runtime143개/native lock supervisor의 실제 redis-code-plan→redis-code-apply→redis-restore-plan→redis-config-restore가 통과했다. 실제 서비스 PID/시작 기록 식별, bwrap 후보 격리 기동 검수, 재시작 후 maxclients100→123, 생성 원본 백업으로 복원 후100 및 원본 파일 바이트 일치, AOF 한글 값 보존을 확인했다. 원격 최초 전송149개 hash가 현재 소스와 일치한다. 설치 helper hash/host Redis 설치 유무 보존, 전용 unit 종료, private 전송물/config/DB 제거도 확인했다.

증거 `.runtime/verification/redis-service-identity-20261008T102416Z/result.json`. 실제 운영 host 기본 Redis unit을 변경한 검사나 브라우저/인증 HTTP 전체 흐름 검사가 아니다. Redis7 검수 결과를 Redis8 전체 기능으로 확대하지 않는다.

## 제품 오류 발견 및 수정

native 후보는 설정 파일의 dir /var/lib/redis를 처리할 때 해당 경로가 없으면 실패했다. --dir runtime 옵션은 파일을 읽은 뒤 처리되므로 초기 chdir 오류를 예방하지 못했다. stderr의 FATAL CONFIG FILE ERROR/No such file or directory를 자체 후보 로그에서 확인했다. 실제 운영 데이터 mount로 우회하지 않았다.

redisCandidateResources가 전체 복사 include 파일의 단순/따옴표 dir 값을 검사하여 정규화된 /var·/srv·/opt·/home·/data·/mnt 아래 경로를 등록하고, redisSandboxPlan은 그 위치에 namespace 전용 빈 디렉터리만 만든다. 외부 경로를 --bind/--ro-bind에 추가하지 않는다. 운영 데이터의 실제 접근·권한·존재를 검증하는 것이 아니며 종료 시 폐기된다. 경로 값은 WeakMap의 등록된 비공개 metadata로만 사용하고 공개 resourceReview에는 포함하지 않는다. 나머지 격리/실행 파일 trust/자원 한도/실제 후보 기동 검사도 유지한다. 지원 외 복잡한 경로 구문은 기존 native 거부가 유지된다.

include 경로·빈 폴더·운영 mount 미추가·값 비노출 및 기존 후보/적용/원복/서비스 식별/helper 오류 규약 회귀40개 통과. 중간 소스 검사는 신규 fixture의 빈 changes, 상대 include, GUI port0 변경값 사용으로 실패했고 각각 기존 검사 계약에 맞게 고쳤다. 제품의 원격 설정에는 TCP 비활성을 위해 원문 port0을 계속 사용한다.

## 중간 실행

101916Z/101945Z는 검수 JS 문자열 변환 오류였으며 실제 helper 이전에 중단했다. 102005Z/102140Z는 실제 native 후보 dir 오류, 102100Z는 기동 직후 서비스 식별 거부였다. 성공 기록과 별도로 보존한다. 실패 실행도 private unit/폴더 정리 및 설치 helper 보존을 확인했다. 이번 native 정상 흐름 이후 GUI/HTTP 적용·복원과 실제 서비스 기동 실패 자동 원복·중단 복구 수용은 남아 있다.

## 실제 기동 실패 자동 원복 후속

102812Z의 같은 current canonical helper/runtime149개 전송으로 다섯 번째 native 게이트를 확인했다. 변경 후보의 Unix socket을 자체 데이터 폴더 아래 존재하지 않는 missing/server.sock으로 바꿨다. 제품 후보 격리에서는 별도 runtime socket으로 검수하여 구문이 통과하지만, 실제 전용 서비스에서 이 경로는 기동에 실패한다. systemctl 명령이나 반환값을 실패 fixture로 대체하지 않았다.

redis-code-apply 결과 failed/restored/recovered=true·journalCleanupVerified=true, 원본 전체 파일 바이트·실제 maxclients100·AOF 한글 값·현재 서비스 /proc/systemd 시작 기록 확인. redis-recovery-plan의 recoveryRequired=false로 중단 journal이 남지 않았음을 별도 확인했다. source149개 현재 hash 일치·원래 설치 helper/host Redis 설치 유무 보존·unit 종료·전송/config/data 삭제 완료. 증거 `.runtime/verification/redis-service-identity-20261008T102812Z/result.json`. 정상/백업 복원/실제 기동 실패 원복 native5개가 통과했으며 브라우저 GUI/인증 API 흐름은 여전히 별도다.

102704Z 실행은 자동 원복의 failed/restored/recovered=true까지 확인한 후 검수 도구가 존재하지 않는 recoveryRequired 필드에 false를 요구해서 전체 FAIL이었다. 제품 자동 원복의 실제 계약인 journalCleanupVerified 및 redis-recovery-plan 조회로 수정했다. 이 최초 실패를 보존했다. 제품의 결과 필드를 성공으로 강제로 바꾸지 않았다.
