## 현재 판정 보정 — 2026-10-09

AI API는 사용자 수용 완료이며 한도 해소 확인은 남은 작업이 아닙니다. sudo nginx-check 비밀번호 생략 켜기 후속 PASS도 확인했습니다. 설치 Tauri 전체 GUI 직접 확인과 실제 장기간 세션 관측은 아직 별도이며 공통 웹 디자인 검수는 `docs/console-design.md` 참조. 최신 대조는 `.runtime/verification/acceptance-current-20261009-design.json`에 보존합니다. 아래 시간순 기록의 과거 차단/미실행 상태를 현재 상태로 해석하지 않습니다.

2026-10-09 Node.js 복구 완료 후 이전 미확정 적용 경고가 남는 문제 수정. 부모 완료 신호로 이전 오류·검토·확인 차단, 복구 완료 안내 유지. 실제 SWC 관련 23개·397개 소스 빌드 성공. 수정된 원래 컴포넌트의 격리 응답 브라우저 확인·오류 0·자체 정리. `docs/node-recovery-completion-20261009.md`.

2026-10-09 Node.js 원래 GUI의 실제 전용 unit 설정 실패 자동 원복·helper SIGKILL 후 명시 복구 완료. 같은 PID/UID 1000/한글 HTTP/원본 unit bytes/journal 정리·감사·오류 0·로그아웃·전용 환경 정리 확인. 400개 전송 파일 해시 일치. `docs/node-service-faults-original-gui-20261009.md`. 서비스 메타데이터만 reload하며 앱은 재시작하지 않음.

2026-10-09 MariaDB 원래 GUI에서 실제 helper SIGKILL 후 같은 팝업 복구 직접 확인. 원본/실제 max_connections=100/한글 DB 데이터/journal 정리·완료 및 백업 ID 유지·오류 0·로그아웃·전용 환경 정리. 검수 wrapper 마지막 결과 기록의 미정의 변수 오류는 보존하고 수정했으므로 자동 결과는 PARTIAL. `docs/mariadb-interrupted-original-gui-20261009.md`. 이미 성공한 GUI/native 검사 반복 없음.

2026-10-09 Redis 실제 전용 systemd와 원래 GUI에서 설정 교체 뒤 helper SIGKILL→같은 팝업 명시 복구 확인. 원본/100/한글 AOF 데이터/중단 기록 정리 및 백업 ID·완료 표시 유지. 398개 소스 해시 일치·브라우저 오류 0·자체 환경 정리. `docs/redis-interrupted-original-gui-20261009.md`. MariaDB 같은 팝업 native 중단 검수는 남음.

2026-10-09 Redis·MariaDB 코드 적용의 알 수 없는 실패에 동일 팝업 명시 복구를 연결. MariaDB 선택 main/대상 유지, 복구 완료/백업 ID 보존 및 오래된 입력 차단. 관련 32개 검사·397개 소스 빌드 성공, fixture 브라우저에서 두 흐름 직접 확인. 자동 결과 표식 기록은 임시 저장 한도 오류로 PARTIAL 보존. 실제 중단 native GUI 검수는 별도. `docs/database-inline-recovery-20261009.md`.

2026-10-09 sudo 원래 GUI에서 격리 계정 NOPASSWD→PASSWD 적용·native visudo·원본 백업·실제 비밀번호 요구 차단·완료 감사 확인. 적용 안내에 웹 접근 차단과 서버 터미널 복구를 명시했고 관련 15개 검사 성공. `docs/sudo-policy-original-gui-20261009.md`. GUI에서 NOPASSWD를 새로 켜는 검수는 수행하지 않음.

2026-10-09 실제 패키지 설치 GUI에서 nginx·Redis 설치/목록 갱신/설치 잠금 해제/완료 감사 확인. JSON 포맷으로 잘리던 설치 로그를 helper 응답 해석 후 줄 단위로 저장하도록 수정. 10개 관련 검사·397개 소스 빌드 성공. `docs/package-install-original-gui-20261009.md`. 전용 Docker의 서비스 자동 시작은 차단되어 서비스 기동 증거로 확대하지 않음.

2026-10-09 원래 데몬 GUI의 전용 PostgreSQL 중지/시작/재시작/재로드·실제 PID·목록 갱신·확인 소모·정상 감사 4쌍 검수 완료. 자체 권한 비활성화 시 GUI/인증 API 403 차단·PID 유지·차단 감사 확인. 기존 운영/sudo 설정 미변경, 자체 환경 정리. `docs/daemon-postgresql-original-gui-20261009.md`.

2026-10-09 AI 기존 승인 키 재확인·실제 합성 로그 분석 요청도 OpenAI HTTP 429/providerCode null. 한국어 분석 응답 미완료, 공급자 사용 한도/요청 제한 확인 필요. 자동 반복 없음. `docs/ai-current-provider-status-20261009.md`.

수정된 PostgreSQL 팝업의 실제 helper SIGKILL 중단 안내→동일 팝업 명시 복구 확인. 원본 해시/SQL 4MB/한글 데이터/systemd/journal 정리, 브라우저 오류 0·로그아웃·자체 환경 정리 완료. `docs/postgresql-inline-recovery-original-gui-20261008.md`.

PostgreSQL 적용 중단의 잘못된 권한 안내 수정 및 같은 팝업의 선택 파일 복구 조회/확인 연결. 관련 28개 검사와 현재 396개 소스 빌드 성공. 변경 팝업 실제 브라우저 검수도 후속 완료(아래 기록). `docs/postgresql-interrupted-guidance-20261008.md`.

PostgreSQL 전체 코드 GUI 적용 helper SIGKILL→중단 기록 보존→원래 GUI 명시 복구→실제 systemd/SQL 4MB/원본 hash/journal 삭제 확인. 전용 환경 정리 완료. `docs/postgresql-code-interrupted-original-gui-20261008.md`. 이번 데이터 보존 검수는 별도 수행하지 않음.

PostgreSQL 전체 코드 원래 GUI→현재 helper→실제 systemd 재시작 실패 자동 원복 연결 완료. GUI 한국어 경고·확인 소모, 원본 hash/SQL 4MB/한글 데이터, 398개 소스 SHA, 로그아웃 및 자체 환경 정리 확인. `docs/postgresql-code-failure-original-gui-20261008.md`. SIGKILL 중단·수동 복구 GUI도 후속 검수 완료(문서 참조).

cron 단일 GUI 세션→실제 설치 setgid crontab/PAM/daemon→한글 UID 1000 실행→원본 GUI 검토 복원·로그아웃 완료. 현재 396개 소스 SHA 일치, 기존 예약 보존/자체 정리 확인. `docs/cron-installed-original-gui-20261008.md`.

Certbot 공통 설정의 자동 연계 켜짐 상태에 nginx 미변경 안내가 남는 오류 수정. 기존 화면 컴파일/코드 생성 검사 10개 및 수정 후 396개 소스 빌드 성공. `docs/certificate-installer-code-draft-20261008.md`. 직전 HTTP 16개 검사는 이 설명 수정 전 코드이며 발급 GUI 검수는 아직 미실행이다.

최신 빌드/HTTP: 396개 소스 일치, 인증 API의 Certbot nginx 연계 옵션 및 로그인/세션/PTY 포함 16개 그룹 성공. `docs/current-runtime-check-20261008.md`. 실제 native webroot 신규 staging 발급→nginx installer→독립 TLS/한국어 HTTP 확인은 완료(`docs/certificate-webroot-nginx-native-20261008.md`). 원래 GUI 최종 발급은 약관 확인 미응답으로 미실행이며 전용 검수 환경은 정리됐다.

현재 전체 검사: 1,446개 중 1,442개 성공, 다국어 보류 실패 4개. 신규 Certbot label 번역 검사 2개도 보류로 기록하며 실패를 숨기지 않는다. 최신 소스 빌드 396개 성공. `docs/current-regression-korean-final-20261008.md`.

## 2026-10-08 Certbot 코드 초안 설치 옵션 동기화

공통 Certbot 패키지 schema/profile에 webroot nginx installer 옵션을 연결하고 다른 방식의 숨은 값은 무시. 관련 12개 검사 성공. 실제 원래 GUI에서 옵션 변경 시 이전 preview/운영 확인 소모·실행 비활성 확인. 약관 동의 GUI 최종 제출은 사용자 확인 대기 중이며 ACME 실행 없음. docs/certificate-installer-code-draft-20261008.md.

## 2026-10-08 실제 webroot 신규 발급→nginx installer→TLS 성공

현재 canonical helper/native lock이 변경 전 nginx 백업 2개를 만든 뒤 실제 ACME staging 신규 인증서 발급 및 실제 nginx installer 배치/redirect 설정 완료. 전용 systemd nginx/private network에서 발급 인증서·호스트명·신뢰 검증 TLS1.3/한글 HTTP200 확인. 운영 설정/기존 인증서/challenge 보존, 전용 unit·키·fixture 정리 완료. 원래 GUI 최종 제출과 nginx 인증 플러그인 자체의 신규 인증은 별도. docs/certificate-webroot-nginx-native-20261008.md.

## 2026-10-08 webroot→nginx HTTPS 자동 연계 구현

원래 Certbot GUI에 webroot 인증 후 nginx installer 배치/redirect 옵션 연결. 명령 생성/실제 helper·웹 루트 권한·변경 전 nginx include 백업·실패 시 실행 차단·기존 승인 무효화 구현. 관련 24개 검사 및 최종 현재 396개 소스 빌드 성공. 실제 ACME+installer native 통합은 아직 수행 전(PARTIAL). docs/certificate-webroot-installer-20261008.md.

## 2026-10-08 현재 cron 표준 입력 저장·복원 원래 GUI

현재 396개 소스 빌드에서 원래 로그인→nginx.conf 예약 메뉴→한글 명령 검토/저장→백업 비교/복원→로그아웃 확인. native runner 원문 정확 일치·브라우저 오류 0·전용 환경 정리. 직전 103번 설치 계정 실제 daemon 실행과 별도 검수이며 단일 GUI→설치 daemon 연결로 확대하지 않음. docs/cron-stdin-original-gui-20261008.md.

## 2026-10-08 cron 긴 경로 저장·복원 수정과 실제 설치 계정 실행

103번 설치 crontab의 긴 파일 경로 잘림을 재현하고 고정 `crontab -` 표준 입력으로 저장·삭제·복원을 수정. 관련 단위 31개 및 native/HTTP 25개 성공. 실제 설치 setgid 바이너리·변경 없는 PAM/cron에서 whitecalvin UID 1000 한글 예약 실행·비활성 미실행·검토 백업 원문 복원 확인. 소스 280개 SHA, 호스트 예약 보존, 전용 환경 정리 기록. 중간 실패는 보존하며 이번 GUI 제출 확인은 별도. docs/cron-installed-account-20261008.md.

## 2026-10-08 Certbot 실제 백업 + 웹 중단 후 원래 GUI 복구 조회

전용 웹 group SIGKILL 뒤 같은 API/브라우저 세션에서 실제 백업 27개·pending 로그·미확정 종료 상태 보존. 동일 실행 재요청 HTTP 409. 원래 GUI 중단 안내/백업 목록/eztoy.app 백업 복원 검토 확인. namespace Certbot shim만 사용해 실제 ACME/운영 Certbot 종료 없음. current helper/397개 소스 및 백업 bytes/해시 대조, 운영 설정·기존 인증서 보존/fixture 정리 완료. docs/certificate-interrupted-original-gui-20261008.md. 실제 ACME 자식 중단/종료 확인·재개와 nginx plugin 신규 배치 통합은 남는다.

## 2026-10-08 nginx 원래 GUI TLS 적용·백업 복원

전용 실제 systemd/private network에서 GUI 코드 편집→현재 helper 적용→시스템 CA/호스트명/peer 인증서 검증 TLS 1.3/HTTP 200 확인. GUI 백업 복원 완료·원본 bytes/undo 백업·HTTPS 포트 ConnectionRefused 확인. 자동 검수 마지막 정리 실패 기록은 유지하고 남은 private stage를 별도 확인 후 정리. 최종 native 종합 proof 유실로 실행 종합은 PARTIAL이며 직접 관찰한 기능 게이트만 PASS. 향후 결과/transport 진단 보존을 보강. docs/nginx-tls-original-gui-20261008.md.

## 2026-10-08 Certbot 신규 발급과 실제 HTTPS 연결

103번 eztoy.app: 기존 staging 계정 복사본/별도 저장소에서 실제 webroot 신규 발급 성공. 인증 API→현재 helper exit 0, 원래 GUI의 명령 검토·저장 로그·신규 인증서 트리 확인. 발급된 인증서로 전용 nginx TLS 1.3/호스트명·peer 인증서·한글 HTTP 응답 검수 성공. 운영 설정/기존 인증서/challenge 파일 보존 및 전용 환경 정리. GUI 최종 발급 버튼 제출 검수는 아니다. nginx plugin 신규 TLS 변경·복원/실행 중단 GUI 복구는 남는다. 증거 docs/certificate-webroot-issuance-20261008.md. 기존 범위 추가 없음.

현재 Node 원래 한국어 GUI→Better Auth/API→일반 Linux 계정 sudo/helper/native lock→전용 실제 systemd 등록·시작/재시작·변경/백업복원·enable/disable·stop 완료. Node 본체 설치/별도 npm 제거 시 IDE 차단 오류 수정, 회귀2개·전송398개SHA·감사8쌍·브라우저오류0·전용 환경정리 확인. 실패/중단 전체 수용은 별도: `docs/node-service-original-gui-20261008.md`.

Node 서비스 제어 GUI의 이전 연결/앱/권한 실행 확인 및 완료 승인 재사용 문제를 재현 후 수정. effect 전 무효화·취소 후 동일 작업 승인 구분·인접 변경/백업 포함32개 성공. 원래 브라우저/API/native 결합은 별도: `docs/node-control-context-20261008.md`.

현재 Node helper·native lock supervisor→103 실제 전용 systemd 등록/제어/변경·자동백업·복원 10개 확인. 다른 UID 거부·실행 PID 유지·정리·146개 소스 SHA 일치. 검수 namespace의 없는 state mount 경로/조회 action 수정, 최초 실패 보존. 설치 패키지 및 GUI/API E2E는 별도: `docs/node-service-systemd-20261008.md`.

103 설치 Node22.23.3에서 현재 native8개 모듈→실제 전용 systemd 서비스 등록/설정 조회/일반계정 한글 HTTP/재시작/enable·disable/변경된 env 재시작 차단·stop6개 확인. 최초 검수 입력 누락 실패를 보존하고 해당게이트 재개, 전용 unit/stage 정리. GUI/API/canonical helper 결합은 별도: `docs/node-service-systemd-20261008.md`.

Node.js 앱 관리의 이전 연결 저장 요청을 실패 재현 후 차단. 단일 진행/확인1회소모·이전 앱/늦은 응답 숨김·권한 해제·같은 정책 미저장 편집 유지, 관련12개 성공. 설치 서비스 E2E는 별도: `docs/node-apps-context-20261008.md`.

현재394개 소스 운영 빌드의 실제 Next HTTP15개 검사 그룹 성공: 보호11페이지·재시작 세션·만료 로그인 이동·로그아웃·데몬 SSR·실제 PTY 한글/이모지/SSE/감사 확인. 임시 서버·계정/폴더 정리 완료: `docs/current-regression-20261008.md`. 운영 ACME/서비스 전체 수용은 별도 남음.

전체1429개 회귀 최초1417성공/12실패. 신규 runtime·SSR·Certbot 진행/JSON 출력 테스트 구성 및 MariaDB 한국어 assertion 수정 후 관련28개 성공, 최초10개 실패 해소. 보류한 일본어·터키어2개 실패는 유지. 현재394개 소스 Next 운영 빌드 성공: `docs/current-regression-20261008.md`. 전체 제품 완료는 아님.

Redis 적용·검수·복구/서비스 조회 영어 안내36곳을 한국어로 변경. 충돌·실패 원복·중단 기록·비밀 진단 차단·검수 정리 관련30개 확인. 오류 상태/code/거부 조건 유지, 설치 GUI 전체 및 한국어 전체 완료는 별도: `docs/redis-korean-errors-20261008.md`.

MariaDB 설정 적용·중단 복구의 영어 오류 안내30곳을 원인/다음 조치가 있는 한국어로 변경. 적용·원복·중단 기록·후보 확인 관련24개 성공, 기존 상태/권한/비밀 진단 차단 유지. 한국어 전체 및 제품 전체 완료는 아님: `docs/mariadb-korean-errors-20261008.md`.

PostgreSQL 현재 데이터 실행기의 실제 복원 오류에서 원본 테이블·뷰·한글 데이터 및 복원 전 백업 보존 확인/전용 환경 정리. GUI 조회 실패의 이전 context 유지 오류 수정, 실패 안내·승인 재사용 차단·재검토 관련4개 성공. 실제 supervisor 중단/GUI 실패 전체 흐름은 별도: `docs/postgresql-data-backup-20261008.md`.

PostgreSQL 데이터 백업·복원 helper/API/한국어 GUI 연결 및 103 전용 PostgreSQL18 실제 GUI 백업→원본 복원→자동 백업 되돌리기 완료. 독립 SQL 조회·로그아웃·브라우저 오류0·전용 환경 정리 확인. 서로 다른 시작 시각의 잘못된 비교를 서버 PID metadata 확인으로 수정, 관련8개 회귀 성공. 실패/중단 수용 및 전체 목표는 남음: `docs/postgresql-data-backup-20261008.md`.

PostgreSQL 실제 데이터 백업/복원 내부 실행기 추가. 103 전용 새 클러스터 native 정상5개·실제 복원 오류 데이터/undo 보존2개·파일/권한/identity 회귀3개 성공, 자체 환경 정리. 기존 설정 백업과 구분하며 helper/API/GUI 연결은 다음 미완료 작업: `docs/postgresql-data-backup-20261008.md`.

103 원본 nginx GUI→실제 helper/systemd 적용 실패 자동 원복 경고까지 완료. 실제 reload 실패/복구·journal 정리·원본 HTTP/bytes·한국어 alert·확인 소모·로그아웃·브라우저 오류0·소스536개 일치·host 보존/전용 환경 정리 확인. 최초 연결 지연 GUI 실패는 보존, 관련 회귀10개 성공. 백업 복원 실패/중단 GUI·신규TLS 등은 남음: `docs/nginx-systemd-rollback-gui-20261008.md`.

103 원본 nginx GUI→Better Auth/인증 API→실제 sudo/canonical helper→전용 실제 systemd 적용·백업 복원 완료. 실제 HTTP before→after-gui→before·원본 bytes·로그아웃·브라우저 오류0·source 일치·host 보존 및 정리 확인. 자동 백업 조회 StrictMode 중복 요청 수정 후 최초 팝업 재검수 및 회귀15개 성공. 실패/중단 GUI·신규TLS 등은 남음: `docs/nginx-systemd-original-gui-20261008.md`.

103 현재 nginx canonical helper/native lock→실제 전용 systemd 적용·백업 복원·실제 reload 실패 자동 원복까지 6개 성공. HTTP before→after→before·원본 bytes·journal 정리·host config/helper 보존·전용 unit/stage 정리 확인. 원본 GUI와 이 실제 서비스의 결합 및 신규 TLS 수용은 별도 남음: `docs/nginx-systemd-helper-20261008.md`.

103 current Redis helper→실제 systemd 기동 실패 자동 원복까지 native5개 완료. socket 경로 실제 기동 실패 후 failed/restored/recovered=true·journal 정리·복구 계획 불필요·원본/maxclients100/AOF 한글 값 보존 확인. source149개 현재 일치·unit/private/설치 helper 보존 및 정리. GUI/인증 HTTP 전체 흐름은 남음: `docs/redis-helper-systemd-apply-20261008.md`.

103 현재 Redis canonical helper/native lock→bwrap 후보→전용 실제 systemd 적용/백업 복원4개 성공. 실제100→123→100·원본/AOF 한글 값 보존·전송149개 현재 소스 일치·unit/private/설치 helper 보존 및 정리. 설정 파일 dir의 조기 chdir 실패를 운영 mount 없이 빈 namespace 디렉터리로 수정, 회귀40개 통과. GUI/HTTP·native 기동 실패 원복 수용은 남음: `docs/redis-helper-systemd-apply-20261008.md`.

103 실제 Redis7.0.15 전용 systemd 서비스의 기본 제목 변경 상태에서 현재 제품 /proc·manager·busctl 시작 기록 식별 성공. 실제 binary/main/PID/UID/starttime 결합, Unix socket 준비·원래 host 설치 보존·unit/전송물 정리 확인. helper/GUI 실제 적용/복원은 다음 단계: `docs/redis-systemd-startup-20261008.md`.

Redis 기본 프로세스 제목 변경 시 설정 적용 거부 보완: systemd 실제 시작 기록의 고정 main/실행 파일·현재 PID·미종료·두 번 안정 조회를 결합, 기존 proc 식별 조건 유지. 관련37개 및 실제103 전용 sleep unit 시작 기록 구조 검수 통과/정리. Redis 실제 GUI/helper 서비스 수용은 별도: `docs/redis-systemd-startup-20261008.md`.

Redis 첫 코드/GUI 설정 적용의 백업 디렉터리 미생성 오류 수정. 두 canonical helper dispatch가 private root 전용 폴더를 준비하며 공개권한/링크/잘못된 소유자는 거부. 실제 임시 transaction 원본/백업 보존 및 관련35개 통과. 실제 원격 서비스·GUI 전체 적용은 남음: `docs/redis-first-apply-20261008.md`.

MariaDB GUI 헤더 확인 전의 검수 환경 원인 수정: systemctl 서비스명 뒤 옵션 허용·정확히 단일 전용 대상 제한. 어댑터 회귀3개 및 103 실제 상태 active/running/loaded·MainPID exe/native6개 확인, 전용 unit/전송물 정리. 새 브라우저 헤더 수용은 별도: `docs/mariadb-status-adapter-20261008.md`.

103번 MariaDB 원래 개발 GUI→인증 API→현재 helper→전용 실제 systemd 서비스 정상 적용/백업 복원 완료. 코드123 검수/영향 확인/적용/복원100·원본 바이트/한글 데이터 보존·PID 변경·브라우저 오류0·로그아웃/정리 확인. 전송 manifest 537개 현재 소스 일치. 이전 준비 실패 기록 보존, 다중 unit 상태 헤더·DB 내용 백업·전체 완료는 별도: `docs/config-code-strictmode-gui-20261008.md`.

실제 MariaDB 개발 GUI에서 발견한 공통 코드 편집기 StrictMode 초기 입력 거부를 수정했다. setup/cleanup/setup 후 연결 참조 복원·코드123 유지·설정 값123 반영·reload 초안 유지·원문 복구/로그아웃 확인, 관련 회귀4개 성공. 실제 GUI 서비스 적용은 private helper 준비 설정으로 미완료이며 runner 시작 환경을 보완했다. 자체 unit/전송물/탭/터널/계정 파일 정리: `docs/config-code-strictmode-gui-20261008.md`.

MariaDB 첫 설정 적용에서 전용 백업 폴더 미생성으로 500이 발생하는 실제 오류를 수정했다. 103번 current canonical helper→전용 실제 systemd 서비스 후보 검수/전체 코드 적용/백업 복원/native 시작 실패 자동 원복 9개 및 관련 회귀 23개 성공. max_connections 100→123→100·한글 데이터·원본/설치 helper 보존·자체 unit/전송물 정리. GUI/API 전체 수용과 구분: `docs/mariadb-systemd-first-apply-20261008.md`.

103번 MariaDB 10.11.14와 현재 canonical helper/native lock supervisor의 실제 격리 후보 검수 5개 성공. 정상 후보·잘못된 옵션·원본 충돌·include 심볼릭 링크·후보 정리 확인, host 설정/설치 helper 보존·자체 namespace/전송물 정리. 실제 서비스 적용/GUI 전체 흐름과 구분: `docs/mariadb-current-helper-native-20261008.md`.

현재 nginx·MariaDB·Redis·Node.js 중단 복구 컴포넌트의 연결 전환 GUI 검수 완료. 이전 검토/열린 확인 제거·새 연결 재조회/확인/완료·이전 연결 변경 요청 0·브라우저 경고/오류 0 확인. fixture API이며 실제 설치 서비스 복구와 구분한다. 자체 서버/폴더/탭 정리 완료: `docs/recovery-context-original-gui-20261008.md`.

103번 현재 helper/runtime/원래 Certbot GUI에서 105개 백업 중 최신 100개 밖의 가장 오래된 ID를 작업 기록으로 조회·선택·실제 include/버전 복원 검토 성공. 모든 백업 해시/eztoy 원본 보존·브라우저 오류 0·자체 정리. 작업 기록 seeded/Certbot 실행·ACME·설정 복원 없음. `docs/nginx-old-backup-original-gui-20261008.md`.

Certbot 작업 백업이 일반 최신 100개 밖으로 밀려나도 UUID 특정 조회로 선택 가능하도록 UI/GET API/helper/catalog 연결. 105개 private 파일의 오래된 백업·33개 회귀 성공, 현재 helper 실제 격리 nginx 7개 회귀/390개 소스 빌드 성공·자체 정리. 변경 후 특정 조회의 원래 GUI/103번 수용은 남음. `docs/nginx-job-backup-lookup-20261008.md`.

현재 빌드/원래 nginx GUI/인증 API/canonical helper/실제 격리 nginx로 변경 파일 적용→생성 백업 GUI 복원 성공. HTTP before→after-gui→before·원본 파일 bytes·apply/restore completed 감사 기록 확인. 브라우저 오류 0/로그아웃/자체 정리. sudo/systemd는 검수 어댑터: 103번 실제 systemd 복원 및 신규 TLS 검수는 남음. `docs/nginx-config-restore-original-gui-20261008.md`.

nginx 적용/복원 검토의 effect 이전 서버·권한·파일 변경 차단과 확인 1회 사용 보완. 관련 14개 검사 성공. 103번 현재 소스 전송/원래 조회 전용 복원 GUI/브라우저 오류 0/로그아웃 확인. 임시 sudo 옵션으로 실제 목록 조회 거절: GUI PARTIAL, 실제 복원 검수는 남음. `docs/nginx-review-scope-20261008.md`.

Certbot 작업 로그에서 해당 작업의 nginx 백업만 조회/검토하는 복원 화면을 연결했다. 실제 목록 교집합·누락 안내·권한 분리·테두리 없는 아이콘 버튼·동일 설정 안내 추가. 관련 10개 검사 및 103번 원래 GUI/현재 helper/실제 27개 백업/eztoy 복원 검토 성공. 실제 진행 기록과 최종 로그 일치·원본 보존·정리 확인, 복원 실행/ACME 요청 없음. 현재 390개 소스 빌드 성공. `docs/certificate-job-restore-20261008.md`. 신규 발급/TLS 변경·실제 복원·전체 목표는 진행 중.

Certbot 백업 ID/진행 로그를 실행 중 private 의도 파일에 원자 저장하도록 보완했다. 직렬 snapshot·완료 전 대기·실패 안내·명령/시작 시각/권한/링크 방어 추가. 전용 프로세스 SIGKILL 후 새 서버 조회에서 백업·한글 로그/종료 미확인/잠금 보존 및 관련 19개 검사 성공. 현재 소스 389개 빌드 성공·임시 정리. `docs/certificate-progress-20261008.md`. 실제 103번 GUI 실행 중 종료 전체 수용·신규 발급/TLS 변경·복원·전체 목표는 진행 중.

현재 긴 Certbot 수집기로 103번 원래 GUI/인증 API/current helper/격리 native 출력 fixture를 연결해 한글 1,600줄(113,637 bytes) 보존 확인. GUI·저장 기록·생성 원문 SHA 일치 및 마지막 줄 실제 스크롤/원본 보존/정리 확인. ACME 요청 없음. `docs/certificate-long-output-gui-20261008.md`. 신규 발급/TLS 변경·실제 복원·전체 목표는 진행 중.

Certbot 긴 helper JSON을 8,000자로 자르기 전에 해석하도록 서버 수집기를 수정했다. UTF-8/escape/분할·저장 검증 및 helper/API/중단 기록 회귀 성공. 500행 초과 시 최초 100행과 최신 399행 및 생략 안내 유지. 현재 388개 소스 빌드 성공/소스 변경 없음/임시 빌드 정리. `docs/certificate-output-20261008.md`. 수정 후 원래 GUI 긴 로그 수용·신규 발급/TLS 변경·복원 및 전체 목표는 진행 중.

Certbot 실패/부분 백업 오류 때 생성 완료된 nginx 백업 ID를 즉시 helper 로그에 기록하도록 수정했다. 관련 28개+helper dispatch 검사 성공. 103번 원래 GUI/인증 API/현재 helper/실제 27개 백업과 격리 Certbot 실패 주입에서 현재·저장 로그 유지/원본 보존/정리 확인. ACME 요청 없음. `docs/certificate-backup-failure-20261008.md`. 실제 신규 발급/TLS 변경·복원·전체 목표는 진행 중.

Certbot 발급 사전 검사에서 서버 블록 안의 include 파일에 있는 server_name 누락을 수정했다. 중첩 include·심볼릭 링크·재사용 문맥·같은 줄의 다른 include 차단을 포함한 16개 검사 및 runtime 검사 성공. 103번 현재 모듈 실제 nginx graph 백업 검사·원본 보존·임시 정리 확인, ACME 요청 없음. `docs/certificate-include-context-20261008.md`. 신규 발급/TLS 변경·실패 복원·전체 목표는 진행 중.

103번 원래 Certbot GUI→인증 API→현재 canonical helper→기존 계정/실제 nginx 플러그인의 eztoy.app·www.eztoy.app 갱신 dry-run 성공(exit 0, 약 23초). 최대 8분 임의 대기 제거·현재/저장 JSON 로그 표시 수정, 관련 43개+5개 검사·GUI 확인·원본 보존/자체 환경 정리. `docs/certificate-native-original-gui-20261008.md`. 신규 발급/변경·복구 및 전체 제품 수용은 별도 남음.

103번 eztoy.app nginx staging 갱신은 비활성 인증 재사용을 로그로 확인한 후 임시 staging 계정으로 성공(exit 0). 기존 nginx graph·갱신 파일·fullchain 보존 및 자체 폴더 정리. ACME 네 가지 오류에 안전한 한국어 안내 추가, 관련 12개 검사·현재 소스 386개 운영 빌드 성공. `docs/certificate-authorization-reuse-20261008.md`. 원래 GUI/current canonical helper 전체 수용·기본 계정 갱신 성공은 별도 남음.

103번 추가 소스 전송·원래 Certbot GUI/인증 API 미리보기·hook 옵션·실패 기록 팝업·로그아웃 확인. 선택한 인증서만 상세 표시하도록 수정하고 관련 10개 회귀 성공·자체 환경 정리. `docs/certificate-original-gui-20261008.md`. 조회/미리보기/기록 표시 범위이며 실제 ACME/canonical helper 전체 수용은 남음.

Certbot 갱신 GUI에 전역 directory hook 옵션 추가, 값 변경 후 미리보기/동의/기존 승인 차단·공통 명령 검증 12개 성공. 103번 eztoy.app 실제 nginx staging dry-run은 ACME authorization 오류로 실패. 설정·기존 인증서·갱신 파일 보존과 임시 경로 정리 확인. `docs/certificate-directory-hooks-20261008.md`. 실제 갱신 성공 및 원래 GUI/helper 전체 수용은 미완료.

103번 eztoy.app 실제 nginx include graph에서 현재 Certbot 백업 모듈의 파일 27개 백업/원본 bytes/hash 일치 확인. 실제 검수로 발견한 표준 MIME/CGI include 경로 누락 수정, 관련 22개 회귀 성공·임시 경로 정리. `docs/certificate-nginx-existing-sites-20261008.md`. ACME·원래 GUI/인증 API/helper 발급·갱신은 별도 남음.

Certbot nginx 발급을 앱 생성 파일에 한정하던 executor를 활성 include graph/기존 server_name 및 전체 nginx 설정 백업 흐름으로 변경했다. 백업 전후 설정 변경 차단·백업 ID 로그·현재 helper/runtime 연결, 관련 18개 검사 성공. `docs/certificate-nginx-existing-sites-20261008.md`. 실제 ACME/운영 nginx 변경·복원 수용은 별도 남음.

PostgreSQL GUI 수정 후 현재 384개 소스 운영 빌드·동일 빌드 HTTP 15개 검사 그룹 성공. 상위 설정 경로 9가지 권한/링크 변조 차단, 관련 22개 회귀 성공. `docs/postgresql-code-original-gui-20261008.md` 후속 증거. 실제 ACME·다른 설치 서비스·OS 입력기는 해당 검사 범위가 아님.

103번 원래 PostgreSQL 전체 코드 GUI→인증 API→현재 helper→실제 systemd 적용/백업 복원 확인. 실행 work_mem 8MB→4MB 및 원본 bytes 복원, Strict Mode 중복 조회/데비안 postgres 소유 상위 경로 조회 오류 수정, 21개 회귀 성공·임시 환경 정리. `docs/postgresql-code-original-gui-20261008.md`. 실패/중단 원래 GUI 전체 연결과 전체 제품 수용은 별도.

PostgreSQL 전체 설정 후보의 host/namespace UID 혼동 버그를 수정했다. 관련 27개 검사와 103번 현재 canonical helper의 코드 계획·실제 systemd 재시작 적용·그래프 백업 복원·원본/실행 값/한글 데이터 확인. fixture undo 잔여 정리 실패는 원본 FAIL로 보존하고 증거 archive 후 별도 정리 완료. `docs/postgresql-code-host-owner-20261008.md`. 전체 코드 GUI/API 수용과 실패/중단 경로는 별도.

103번 PostgreSQL 실패 주입 후 원본 원복/실제 systemd reload와 apply 자식 SIGKILL 후 새 계획 차단·명시 복구·journal 삭제·한글 데이터 보존 확인. 첫 검수 인자 오류와 정리 증거를 보존, 해당 단계만 재개해 성공. `docs/postgresql-systemd-recovery-20261008.md`. 실패/중단 native 경로를 GUI/canonical helper 전체 수용으로 확장하지 않음.

103번 원래 PostgreSQL GUI→인증 API→현재 canonical helper→실제 systemd HBA 적용·GUI 백업 복원 확인. 원본 hash/실제 reload/감사 기록 확인, 자체 서버·클러스터·포워딩 정리. 개발 StrictMode 초기 조회 잠금 충돌 수정 및 12개 검사/새 페이지 최초 검토 확인. `docs/postgresql-original-gui-20261008.md`. 전체 제품 완료는 아님.

103번 전용 systemd 서비스를 실제 중지/시작한 후 이전 canonical helper 확인의 적용 차단(409)과 원본 HBA 보존 확인. 새 검토 적용/복원·한글 데이터·정리까지 후속 11개 성공. `docs/postgresql-systemd-fixture-20261008.md`. 실제 reload 실패 원복/중단 복구 및 원래 GUI/API 수용은 별도 남음.

103번 전용 클러스터의 current canonical root helper→실제 systemd 적용/백업 복원 후속 9개 검사 성공. 백업과 helper mount는 자식 namespace 안에만 연결, 기존 설치 helper·운영 백업 유지. 전용 서비스·클러스터·임시 stage 정리 완료. `docs/postgresql-systemd-fixture-20261008.md`. 원래 GUI/API 전체 연동은 별도.

사용자 승인 후 103번 전용 PostgreSQL 실제 systemd 연동 6개 검사 성공. native 검토/적용·reload/백업 복원/후보 거부/한글 데이터 보존 및 서비스·클러스터·임시 전송물 정리 확인. `docs/postgresql-systemd-fixture-20261008.md`. 설치 helper/원래 IDE 전체 수용은 별도 남음.

현재 소스 384개 운영 빌드와 동일 빌드 HTTP 검사 15개 그룹 성공. 로그인/세션 재시작·만료/SSR 데몬/Certbot 미리보기/실제 PTY 한글·이모지·SSE 확인. 실제 운영 서비스·ACME·OS IME·Tauri·AI 전체 수용은 별도. `docs/current-runtime-check-20261008.md`.

Certbot 입력/동의/정책 변경 후 이전 실행 핸들러를 차단하고, 검토 중 입력 변경 시 늦은 명령 응답을 폐기했다. 관련 검사 8개 성공, 실제 ACME 발급·갱신은 별도 남음. `docs/certbot-review-context-20261008.md`.

실제 8787 PostgreSQL 최초 미선택 화면의 상위 postgresql.service active/exited 표시를 제거하고 클러스터 선택 전 안내로 변경했다. 선택 후에는 선택 클러스터만 표시하며 공통 상태 live region을 추가했다. 공통 IDE/SSR 검사 및 실제 HMR 화면 확인. `docs/postgresql-unselected-status-20261008.md`. Tauri는 두 모드 기존 컴파일 증거를 유지하며 네이티브 창/IME는 별도 남는다.

MariaDB 백업 복원 실패/자동 원복 결과를 경고로 구분하고, MariaDB 일반 적용·백업 복원과 Redis 일반 적용/복원의 journal 정리 미확인 경고를 추가했다. 관련 검사 로그 `database-journal-warning-20261008.log`; 설치 서비스 실행은 미실행. 103번 전용 systemd PostgreSQL 클러스터 생성·검수·정리 추가 승인 요청 대기. `docs/database-journal-warning-20261008.md`.

현재 384개 소스 전체 빌드 성공. Node 서비스 설정 변경·백업 복원 실제 GUI의 API 전환 시 검토/확인 제거·변경 요청 없음·새 연결 재조회/최종 확인/결과를 확인했다. 전체 회귀 재실행 1358개 중 1356 성공·2 실패(일본어·터키어 nginx 설명 누락, 한국어 우선 이후 다국어 작업). 전체 PASS/목표 완료로 처리하지 않음. `docs/service-mutation-context-20261008.md`.

Node.js 서비스 설정 변경·백업 복원의 API/앱/정책 전환 후 이전 검토 실행 차단 및 늦은 결과 폐기를 수정했다. MariaDB·Redis 일반 적용의 실패/원복 결과를 경고로 구분한다. 조회부터 진행하는 지속 refs/effects 회귀 24개 성공. 이번 변경 후 신규 GUI/전체 빌드·설치 helper/systemd 흐름은 별도: `docs/service-mutation-context-20261008.md`.

nginx·MariaDB·Redis·Node.js 복구의 실제 개발 브라우저에서 최종 확인 중 연결 교체→검토/확인 제거·요청 없음→새 조회/확인/복구 결과를 모두 확인했다. 요청 12개와 소스 SHA 보존, 자체 서버·폴더·탭 정리. API는 fixture이므로 설치 helper/systemd 전체 수용은 별도: `docs/recovery-context-20261008.md`.

nginx·MariaDB·Redis·Node.js 중단 복구에서 API/대상/정책 전환 첫 렌더의 이전 확인 제거 및 오래된 조회·복구 콜백의 transport 차단을 수정했다. StrictMode·부분 복구 경고·Node 부모 busy 피드백을 포함한 23개 검사와 최신 384개 소스 전체 빌드 성공. 실제 설치 helper/systemd 전체 연동 및 해당 신규 GUI 수용은 별도: `docs/recovery-context-20261008.md`.

MariaDB·Redis 개발 모드 StrictMode effect 재실행 뒤 검수가 영구 busy로 남는 오류를 수정했다. 관련 33개 검사 및 실제 Next 개발 GUI의 검수→확인→적용 결과를 확인했다. PostgreSQL·MariaDB·Redis 코드 적용과 PostgreSQL 백업 복원의 실패/자동 원복 안내는 경고 역할로 표시한다. API는 fixture 응답이며 설치 helper/systemd 적용 완료 증거는 별도: `docs/code-operation-strictmode-20261008.md`.

실제 임시 DB HBA 적용 자식 SIGKILL 뒤 GUI의 새 적용 차단·명시 복구·원본/native reload/한글 데이터/journal 삭제/감사 1회 확인. 복구 완료 후 남던 중단 경고를 journal 삭제 확인 시에만 숨기도록 수정, 관련 19개 검사와 수정 후 실제 GUI 성공. 자체 DB/서버 정리, 설치 helper/systemd 별도: `docs/postgresql-hba-interrupted-gui-20261008.md`.

HBA 자동 원복 결과를 적용 실패+원본 복구 경고로 명확히 표시하고 role=alert로 수정했다. 관련 16개 검사 및 실제 GUI→인증 API→임시 PostgreSQL reload 실패 주입에서 원본/한글 데이터·복구 reload·journal 제거·rolled-back 감사·중복 적용 차단 확인. 자체 DB/서버 정리, 설치 helper/systemd 별도: `docs/postgresql-hba-rollback-gui-20261008.md`.

현재 HBA GUI의 실제 브라우저 검토·확인·적용·생성 백업 복원을 인증 HTTP API와 PostgreSQL 18.6 전용 임시 DB에 연결했다. Native parser/reload 수락·원본/한글 데이터 보존·commit/감사 각 2회·자체 DB/서버 정리 확인. 설치 helper/systemd·원래 IDE 진입·실패 복구 GUI는 별도: `docs/postgresql-hba-native-gui-20261008.md`.

현재 실제 브라우저→PTY에서 ANSI 화면 지우기/커서 덮어쓰기와 입력 중 명령의 대시보드→터미널 복귀를 확인했다. Enter 한 번 결과 1회·프롬프트·로그아웃·자체 셸/서버 정리 완료. 검수 시나리오와 관찰 증거 분리: `docs/terminal-ansi-route-20261008.md`. OS IME/Tauri는 별도 남는다.

현재 빌드 실제 브라우저→로컬 PTY에서 한글 포함 직접 입력·Enter 실행·Backspace 수정·출력·로그아웃을 확인했다. 본문과 터미널 너비/하단 일치 및 외부 스크롤 없음. 자체 셸/서버/계정/탭 정리. OS 입력기 조합은 미확인: `docs/terminal-browser-input-20261008.md`.

현재 소스 384개 빌드와 동일 소스의 실제 HTTP 검사 15개 그룹 완료. 서버 재시작 세션 유지·시간 만료 로그인 이동·실제 PTY/SSE 한글 입출력 확인. 시작/종료 시 파일 목록·SHA 일치 확인. 운영 변경 비활성, 자체 서버 종료. 설치 서비스 전체 연동·OS 입력기·AI 정상 응답은 별도 남음: `docs/current-production-http-20261008.md`.

현재 인증/보안 HTTP API에서 실제 PostgreSQL HBA coordinator·단일 사용자 파서·임시 Unix 소켓 클러스터로 적용/백업 복원/주입한 reload 실패 원복을 연결했다. 8개 검사 PASS, 실제 pg_conf_load_time 변경으로 reload 수락 확인, 한글 데이터 보존·감사 기록 제한·401/403/400/409 및 원본 보존·자체 종료/정리 확인: `docs/postgresql-hba-api-20261008.md`. 관리자 전송은 fixture adapter이며 설치 helper/systemd/브라우저 전체 연동은 남는다.

현재 PostgreSQL 적용·백업 복원·중단 복구 컴포넌트의 실제 한국어 브라우저에서 최종 확인·대상 전환 시 이전 검토 제거·새 대상 요청·조회 전용 차단을 확인했다. 7개 GUI 결과 항목과 실제 요청 기록 12개 보존, Strict Mode의 정리된 백업 조회는 추가 graph 검토를 시작하지 않음. 자체 서버/폴더 정리 및 제품 소스 SHA 일치: `docs/postgresql-operation-gui-20261008.md`. API 응답은 fixture이므로 native helper/서비스 전체 수용은 남는다.

PostgreSQL 코드 적용·백업 복원·중단 복구에서 이전 파일/API/권한/백업의 확인 콜백을 요청 시작 전에 차단하고, 전환 첫 렌더부터 이전 검토와 확인을 숨겼다. Strict Mode의 정리된 자동 조회 응답도 차단했다. 관련 29개 검사와 현재 384개 소스 Next.js 빌드 통과: `docs/postgresql-operation-context-20261008.md`. 실제 브라우저→helper→systemd 전체 흐름은 남는다.

PostgreSQL HBA 적용·복구 팝업에서 파일/API/권한 전환 및 종료 후 이전 확인 콜백의 요청을 transport 전에 차단하고, 첫 렌더부터 이전 검토·확인·결과를 숨겼다. 관련 14개 검사와 현재 384개 소스 Next.js 빌드 통과. 실제 브라우저→helper→서비스 전체 적용·복원은 남는다: `docs/postgresql-hba-review-context-20261008.md`.

PostgreSQL HBA의 읽기 권한 부족은 트리에 파일과 권한 메타데이터를 유지하고, 노드 선택 전 전체 안전성 오류로 표시하지 않도록 수정했다. 실제 개발 서버 한국어 GUI의 초기 선택 안내 및 선택 후 관리자 실행 비활성 안내를 확인했다. 관련 12개 검사 통과, 운영 권한 무변경. 기록: `docs/postgresql-discovery-permission-20261008.md`. 실제 GUI 적용/복구와 systemd 수용은 남는다.

103번 임시 PostgreSQL 적용·복구 후속 7개 PASS. 실제 apply 자식의 파일 교체 직후 SIGKILL과 journal 보존을 확인하고, 명시 복구에서 원본/native reload/journal 삭제를 확인했다. 한글 데이터 보존·자체 클러스터 종료·임시 정리 완료. systemd/GUI 전체 수용은 별도: `docs/eztoy-validation-20261008.md`.

103번 격리 임시 PostgreSQL 클러스터에서 현재 HBA coordinator 적용/백업 복원/native reload/잘못된 초안 거부/주입된 reload 실패 원복 5개 PASS. 한글 데이터 보존 및 클러스터 종료·자체 임시 폴더 삭제 확인. uidmap 설치 없이 자체 자식 namespace의 root/PostgreSQL 두 계정만 매핑해 해결했고 설치 요청은 철회. 실제 systemd hook·GUI 전체 수용은 별도 남음: `docs/eztoy-validation-20261008.md`.

103번 actual helper 검수 후속 10개 PASS: 정상 규칙에 더해 인증 방식/주소/옵션 오류와 포함 파일 원래 경로·줄 번호를 현재 helper와 native parser로 확인했다. 자체 원본/백업 수 보존 및 임시 정리 확인. GUI 수용과 실제 적용/실패 복구는 별도 남음: `docs/eztoy-validation-20261008.md`.

103번 실제 canonical helper 경로의 구문 검수까지 6개 PASS. 검수 도구에 자체 PID/mount 공간의 전용 procfs를 연결해 중첩 제한을 해결했고, 호스트 /proc·PID 공유 없이 제품의 내부 후보 격리를 유지했다. 기존 설정/설치 helper 보존·자체 임시 폴더 삭제 확인. 직접 함수의 참조 파일 포함 11개 PASS도 유지. GUI 적용/실패 복구 전체 수용은 남음: `docs/eztoy-validation-20261008.md`.

사용자 승인으로 103번 호스트의 helper·런타임·CommonJS 메타데이터 격리 검수 실행. helper 읽기·백업·버전 충돌 거부·복원 미리보기·심볼릭 링크 거부 5개 통과. 검수 도구의 중첩 격리를 제거한 후 현재 HBA 검수 함수의 실제 실행은 참조 파일까지 확장해 11개 통과(정상·인증 방식/주소/옵션 오류·오래된 버전·포함 파일 경로/오류 위치·포함 디렉터리 순서·목록 참조·누락/순환 거부). 실제 파서와 snapshot 사전 거부를 구분해 기록했다. 기존 설정·설치 helper 보존 및 자체 임시 폴더 삭제 확인. GUI→설치 helper→적용/실패 복구 전체 수용은 남는다. 103번·eztoy.app의 ACME 경로와 Certbot staging 갱신 모의 검사도 성공: `docs/eztoy-validation-20261008.md`. 전송 승인 대기와 구문 검수의 중첩 /proc 차단은 해소됐다.

승인 후 최신 한국어 소스 384개 운영 빌드와 동일 빌드의 실제 HTTP 15개 그룹 완료. 인증·SSR·재시작 세션·만료 이동·한글 PTY/SSE·감사·Certbot 미리보기 확인. 설치 운영·ACME·AI 응답·OS 입력기·Tauri 창은 별도 남음: `docs/approved-production-current-20261007.md`.

bwrap 실제 실패 원인을 namespace 생성 권한 거부로 확인하고 시간 초과와 구분하는 한국어 안내를 구현했다. 관련 10개 검사 및 현재 이미지의 실제 helper 안내 확인. 전체 적용/복구는 환경 제한으로 미완료: `docs/postgresql-helper-container-20261007.md`.

현재 helper의 실제 격리 컨테이너 실행으로 HBA 읽기·백업·버전 거부·복원 미리보기·심볼릭 링크 거부 확인. 실패 단계 한국어 안내 수정과 관련 8개 검사 완료. namespace 파서 차단으로 전체 적용/복구는 미완료: `docs/postgresql-helper-container-20261007.md`.

승인 후 helper 파일명을 수정하고 한국어 범위 회귀 및 보안/AI 후속을 확인했다. 원격 격리 이미지 준비 성공, 실제 AI 요청은 HTTP 429로 미완료. 최신 결과와 한계: `docs/approved-followup-20261007.md`. 아래의 helper 파일명/승인 대기 기록은 이전 이력이다.

현재 소스 회귀(AI 의존 검사 3개 제외): 1264개 중 1239개 통과·25개 실패·미실행 없음. 실패는 helper 원본 파일명 불일치·외국어 설명 누락·cron legacy 표시 중복을 포함한다. 기존 예약 호환성은 이후 수정하여 관련 35개와 crontab -n 실제 문법 3개 통과. 현재 새 표시는 LINUX를 유지하고 LINEX는 이전 예약 읽기/변경/삭제에만 허용한다. helper 파일명 변경은 사용자 담당으로 유지. 개발 서버는 npm run dev로 8787에서 재실행하고 한국어 로그인 HTTP 200을 확인했다. 전체 제품 완료를 뜻하지 않음: `docs/current-audit-and-cron-20261007.md`.

계정 화면의 비밀번호 변경 요청에서 세션 만료를 명시적으로 구분하고 공통 로그인 이동으로 연결했다. 현재 비밀번호 오류에는 로그인 이동을 하지 않는다. 관련 11개 실제 인증/컴파일 화면 검사 통과. 공통 기능 회귀 171개 통과·3개 초기 미실행 후 해당 보안 파일의 격리 후속 39개 통과(중복 포함)·미실행 없음. 이번 계정 변경의 브라우저 수용은 별도: `docs/account-session-expiry-20261007.md`.

MariaDB 운영 설정 한국어 설명을 24→67개로 확장하고 새 제안 66개를 연결했다. TLS·바이너리/릴레이 로그·캐시·메모리·InnoDB·잠금 안내, 폐기 옵션 제안 제외 및 클라이언트 그룹 분리 확인. 관련 8개 검사·MariaDB 11.8.6 도움말 이름 대조·384개 소스 빌드·실제 한국어 GUI 검색/설명/제안/코드 보존/로그아웃 통과. 모든 옵션과 운영 적용 완료를 뜻하지 않음: `docs/mariadb-operational-korean-20261007.md`.

현재 개발 순서는 한국어 기능·화면 완성 후 다국어 지원이다. PostgreSQL·Redis·MariaDB 일반 설정 추가 폼 보존의 관련 검사 9개, 최신 소스 빌드 및 세 패키지 실제 한국어 GUI 확인 완료. 화면 전환·파일 전환 입력 복원, MariaDB 그룹별 입력 분리, 추가 전 원문 보존·추가 후 코드 반영·폼 초기화·로그아웃·격리 원본 보존을 확인했다. 실제 운영 적용은 별도 남음: `docs/file-settings-addition-20261007.md`.

접속 규칙 순서 이동 수정의 최신 소스 빌드 및 실제 한국어 화면 확인 완료. 미반영 한글 값 이동·코드 순서 갱신·한 규칙만 반영·다른 규칙 입력 보존·원복/로그아웃/원본 보존 확인: `docs/postgresql-hba-pending-20261007.md`. 실제 관리자 helper 경로 확인은 남음.

접속 규칙 미반영 입력 후속의 검수·백업·중단 복구·삭제 확인 및 관련 복원 화면 갱신 확장 회귀 68개 통과. 전체 로그와 테스트 파일 목록 보존. 운영 helper/실제 인증 접속 및 최신 순서 이동의 브라우저 수용은 별도 남음: `docs/postgresql-hba-pending-20261007.md`.

접속 규칙 순서 이동이 미반영 입력을 지우지 않도록 보완하고 새 줄로 재연결한다. 삭제 확인 포함 관련 검사 18개 통과. 이번 후속의 새 브라우저 확인은 남음. 관리자 helper 소스는 여전히 linex-admin이고 현재 경로는 linux-admin을 기대한다. 명칭 변경은 사용자 직접 처리 범위로 유지: `docs/postgresql-hba-pending-20261007.md`.

새 HBA 규칙 추가 폼 입력도 파일별로 보존했다. 최신 384개 소스 빌드와 실제 한국어 브라우저에서 기존/새 한글 입력·반영 전 코드 보존·파일 전환 보호·입력 복원·새 규칙 추가 후 개별 정리·로그아웃 및 원본 보존 확인: `docs/postgresql-hba-pending-20261007.md`. 관리자 helper/운영 적용은 남음.

PostgreSQL 기존 접속 규칙의 아직 반영하지 않은 한글 입력을 파일별 초안에 보존하고 코드 줄 이동 시 재연결한다. 미반영 입력이 있을 때 검수/적용 검토를 차단하고 한국어 안내 표시. 관련 검사 17개 통과. 새 규칙 추가 폼 보존과 실제 브라우저 확인은 남음: `docs/postgresql-hba-pending-20261007.md`.

공통 GUI 설정의 파일·코드·형식·그룹 변경 뒤 이전 입력/미완성 값/추가 이벤트 전달을 차단했다. 실제 컴파일 컴포넌트 재현 후 관련 검사 8개 통과. 브라우저·운영 적용은 이번 변경에서 미확인: `docs/file-settings-context-20261007.md`.

PostgreSQL 18.6 실제 임시 단일 사용자 파서로 접속 규칙 7개 흐름과 한국어 진단을 확인했다. 인증 방식·주소·옵션·필드 오류 및 포함 파일 누락·순환 거부, 정상 포함 파일 통과·원본 보존·비밀값 제외·임시 정리 확인. 관리자 helper/운영 서비스/실제 인증 접속 확인은 남음: `docs/korean-editor-hba-20261007.md`.

현재 384개 소스 빌드 및 실제 한국어 PostgreSQL 코드 편집·GUI 반영·파일 전환 초안 보존·컨테이너 채움·외부 스크롤 없음·로그아웃 확인. 최초 크기 검사 FAIL과 측정 수정 후 재검사 기록 보존. HBA 실제 운영 검수는 미완료: `docs/korean-editor-hba-20261007.md`.

한국어 우선 개발 후속: 코드 편집기의 이전 파일/연결 이벤트와 권한 변경 후 저장 응답을 차단했다. 관련 검사 7개 통과. PostgreSQL 접속 규칙 검수 결과의 16종 진단 코드를 한국어 원인·확인 방법으로 표시했다. 합산 관련 검사 14개 통과. 브라우저·운영 적용은 이번 변경에서 미확인: `docs/korean-editor-hba-20261007.md`.

> 현재 개발 순서: 한국어로 전체 기능과 화면을 먼저 완성한다. 기존 번역은 보존하되 다국어 확장과 검수는 한국어 완료 이후에 진행한다.

# 현재 요구사항별 점검 (2026-10-06)

관리자 실행 모듈 141개의 명시적 오류 443개를 대조해 사람이 읽는 영어 안내 211개를 추가했다. 기존 한국어 포함 437개에 한국어 안내가 있고 내부 코드 6개는 보존한다. 카탈로그 정확한 메시지 총 400개·접두어 3개. 관련 19개 검사 및 자체 종료 빌드 로그 보존/정리 후 현재 384개 소스 빌드 통과. 동적 오류·외부 명령 출력·실제 GUI/운영 수용은 별도: `docs/runtime-korean-errors-20261007.md`.

공통 설정 변경·복구·잠금 및 주요 패키지 검수 오류 70개를 추가로 한국어 전달에 연결했다(정확한 메시지 총 189개·접두어 3개). 실제 자체 임시 파일의 검수 실패 400/버전 충돌 409 한국어 전달 및 원본·백업 무변경, 공통 복구·잠금 포함 18개 검사 통과. 전체 런타임·이번 빌드·실제 GUI·운영 적용은 별도 남음: `docs/transaction-korean-errors-20261007.md`.

관리자 helper의 알려진 영어 오류 119개와 접두어 3개를 상태 코드/프로토콜 검증 유지 상태로 한국어 안내에 연결했다. 복원 실패 원시 진단은 안내에서 제외한다. 자체 복사본 13개 검사 및 영어 Redis 오류 실제 조각 전달 후속 1개(중복)와 최신 384개 소스 빌드 통과. 원본 helper 변경 없이 복사본 정리. 실제 브라우저 실패 표시/원본 전체 회귀/설치 운영은 별도: `docs/helper-korean-errors-20261007.md`.

코드 줄 이동 후 GUI 미반영 입력 보존의 최신 383개 소스 빌드 및 실제 한국어 PostgreSQL 격리 GUI 확인 완료. port 1→3줄 이동·설정 목록 순서 변경·한글 미완성 값 유지·정상 수정 뒤 pending 안내 해제·코드/나머지 원문 보존·바깥 스크롤 없음·초안 원복/로그아웃/자체 탭·서버 정리를 확인했다. 결과 `.runtime/verification/package-editor-gui-2026-10-06T20-42-19.912Z/result.json`, 빌드 `.runtime/verification/source-build-2026-10-06T20-41-00.669Z/result.json`. Redis/MariaDB 실제 GUI 이동 및 설치 운영 적용은 별도다.

사용자 담당 helper 원본 파일명은 유지한 채 자체 임시 복사본에서 관리자 회귀 58개를 실행해 52개 성공·6개 검사 격리 오류를 확인했다. 두 잠금 fixture의 정렬 허용 치환 및 격리 성공 확인을 추가한 뒤 실제 SIGKILL 잠금·출력/시간 한도 등 7개 통과(이전 1개 중복). 원본 helper SHA 일치·자체 복사본 정리 기록: `.runtime/verification/helper-copy-regression-20261007/result.json`. 원본 전체 회귀·설치 운영 수용을 뜻하지 않는다.

공통 파일 설정에서 같은 행의 줄 이동 후 미반영 GUI 입력을 새 위치로 연결한다. MariaDB 그룹 변경·모호한 중복은 다른 행에 연결하지 않는다. Redis masteruser 입력 가림과 정렬된 관리자 검사 추출식을 보완했다. 관련 17개 및 중복 포함 11개 로컬 검사와 IDE 2개 SWC 변환 통과. 실제 브라우저·전체 빌드·운영 적용은 별도 남음: `.runtime/verification/korean-settings-sync-20261007/result.json`.

Redis 공개 제안 185개 전체의 한국어 설명 누락을 채웠다. 이전 이름 23개와 무시되는 폐기 옵션 4개의 안내까지 총 212개이며 내부 옵션 11개는 제외한다. 관련 19개 검사·현재 383개 소스 빌드·실제 격리 한국어 GUI의 전체 제안 label/설명 검색/단위·폐기 안내/복수 인수 코드 보존/외부 스크롤 없음/로그아웃 확인. 첫 빌드 쓰기 할당량 실패와 자체 임시 복사본 정리 기록도 보존했다. 운영 적용과 전체 제품 완료는 별도 남음: `docs/redis-public-korean-20261007.md`.

Redis 복제·클러스터 공개 옵션 46개와 이전 별칭 13개의 한국어 설명을 추가했다(총 108개). 관련 14개 검사·현재 383개 소스 빌드·실제 격리 GUI의 한국어 검색/이전 이름/비밀번호 가림/복수 인수 편집·코드 원문 보존/외부 스크롤 없음/로그아웃 확인. 나머지 옵션 설명과 설치 환경 실제 복제·클러스터 구성은 남는다: `docs/redis-replication-korean-20261007.md`.

한국어 우선 개발의 회귀 후속: nginx-syntax가 참조하는 nginx-setting-name을 두 관리자 실행 목록에 추가했다(총 141개). 의존성 폐쇄 검사 1개와 nginx 매핑/후보 설정·Redis 백업 화면 검사 9개 통과. 관리자 목록 검사도 소스 정렬의 공백·마지막 쉼표를 허용하도록 수정했다. 사용자 담당 파일명 변경은 하지 않았으며 전체 회귀·설치 운영 완성을 뜻하지 않는다. 결과: `.runtime/verification/korean-runtime-20261007/result.json`.

**현재 진행 순서(사용자 최신 지시): 한국어로 기능·화면 개발을 먼저 끝내고, 그 후 다국어 지원을 진행한다. 기존 번역은 보존하며 추가 번역 작업은 현재 기능 개발 단계에서 진행하지 않는다. 이름 변경은 사용자 담당으로 유지한다.**

Redis 공식 8.0.5 이름 대조로 값 no의 잘못된 등록을 제거하고 새 이름/별칭 21개를 보완했다. 파일 읽기 223개는 이전 표기 호환을 유지하며 새 제안 185개에서 hidden/폐기/중복 별칭을 제외한다. 관련 11개 검사·현재 383개 소스 빌드·실제 격리 GUI의 목록 연결/새 설정 추가/주석 설정 편집/일반 문장 제외/원문 보존/로그아웃 확인. 모든 옵션 서버 검수와 원시 팝업 키보드 선택은 남는다: `docs/redis-catalog-20261007.md`.

보조 cron/Certbot/nginx 화면에서 이전 연결의 API와 툴바 작업을 transport 시작 전 차단했다. effect 이전 호출 거부·이전 진행 응답 거부·새 연결 정상 요청과 예약/인증서/권한 회귀 29개, 현재 383개 소스 빌드 통과. 실제 브라우저 이전 핸들러와 설치 운영 변경은 별도다. 사용자 담당 이름 변경과 legacy 문자열 검사 모순도 재확인하고 보존했다: `docs/server-manager-request-context-20261007.md`.

Node.js IDE 연결/API 교체 첫 렌더에서 이전 앱·디스크 목록·선택 화면·오류를 숨기고 오래된 트리 클릭/자식 갱신을 차단했다. 이전 연결 workspace 합치기를 방지하며 SSR 초기 목록과 미저장 파일은 보존한다. 컴파일 화면/로그 관련 8개 검사와 현재 383개 소스 빌드 통과. 실제 제품 컴포넌트의 격리 브라우저에서도 A/B 목록 교체·선택 숨김·새 앱 선택·연결 해제/재연결 및 오류 없음 확인. API 응답은 fixture이므로 설치 서버 연결/운영 서비스 수용은 미완료: `docs/node-ide-connection-20261007.md`.

공통 파일 설정의 새 항목 이름 제안을 MariaDB 24개 서버 옵션·Redis 기존 203개 이름 카탈로그로 확장했다. 확장 옵션 직접 입력과 기존 PostgreSQL 348개 제안은 유지한다. 컴파일/미반영 입력 검사 5개 및 현재 소스 빌드 통과. 실제 한국어 MariaDB GUI에서 서버/client 목록 구분과 복원, 새 옵션 추가·원본 코드 보존 및 로그아웃 확인. Redis 실제 GUI와 원시 팝업 키보드 선택은 미확인: `docs/package-setting-completion-20261007.md`.

MariaDB 서버 주요 옵션 24개에 한국어 설명·설명 검색을 추가했다. 하이픈/밑줄 별칭을 인식하고 서버 그룹에만 표시한다. 관련 10개 검사와 383개 소스 빌드, 실제 한국어 GUI에서 그룹 구분·비밀번호 가림·중복 행 개별 편집·내용 비우기·코드 보존·로그아웃 확인. 격리 설치 목록/설정 fixture를 사용했으며 운영 적용은 미완료다: `docs/mariadb-korean-help-20261007.md`.

Redis 한국어 GUI 후속에서 설명 검색·중복 행 개별 편집·내용만 비우기·코드 보존 및 비밀번호 가림을 확인했다. 호스트 미설치 때문에 자체 격리 설치 목록 fixture를 사용했다. 앞선 스크롤 FAIL은 비동기 스크롤 완료 전에 측정한 검사 문제로 확인했다. 새 실행에서 본문 1056px 스크롤·탭 고정·외부 스크롤 없음과 로그아웃을 확인하고 PASS 기록을 남겼다. 실제 Redis 설치·운영 적용은 미완료다: `docs/redis-korean-help-20261007.md`.

Redis 접속·인증·메모리·RDB/AOF 주요 설정 29개에 한국어 설명과 설명 검색을 연결했다. 관련 7개 검사와 최신 382개 소스 빌드 통과. 추가 설명의 실제 브라우저 및 나머지 항목 설명은 남는다: `docs/redis-korean-help-20261007.md`.

동일 최신 빌드의 한국어 Certbot 발급 폼에서도 탭·트리 고정과 본문만 280px 스크롤·외부 스크롤 없음, webroot 입력 및 명령 미리보기 생성, standalone 변경 시 이전 미리보기 제거와 로그아웃을 실제 GUI에서 확인했다. 실제 발급·갱신은 미실행이며 `.invalid` 도메인만 사용했다: `docs/package-ide-fixed-tabs-20261007.md`.

패키지 IDE 설정 탭이 본문 스크롤 때 올라가는 문제를 공통 inspector에서 수정했다. 실제 한국어 PostgreSQL 화면에서 본문 1056px 스크롤과 탭·트리 고정, 외부 스크롤 없음·코드 영역 채움 및 로그아웃 확인. 최신 소스 빌드 통과: `docs/package-ide-fixed-tabs-20261007.md`. 다른 패키지 개별 GUI 수용은 남는다.

PostgreSQL 새 항목 추가에 348개 이름 자동완성과 한국어 설명을 연결하고, 설명을 입력 줄 아래 전체 너비로 배치했다. 실제 GUI에서 파일에 없던 설정·사용자 정의 한글 값의 추가와 코드/주석 보존, 최종 32px 입력 및 설명 배치 확인. 관련 검사와 최신 소스 빌드 통과: `docs/postgresql-completion-korean-20261007.md`. 원시 자동완성 팝업의 키보드 선택은 미확인이다.

nginx 설정 추가 오류 안내를 설정·코드 보기 탭 바로 아래로 옮겨 두 화면에서 동일하게 표시한다. 긴 설정 목록 아래로 묻히지 않으며, 관련 회귀 검사 6개 통과. 첫 빌드는 임시 저장소 쓰기 할당량 오류(-122)로 중단됐으며, 자체 오래된 복사본 정리 뒤 최신 381개 소스 빌드가 성공했다. 실제 한국어 브라우저에서 설정·코드 보기 모두 탭 아래 155px 위치에 안내 표시, 코드/원본 보존 및 외부 스크롤 없음과 로그아웃을 확인했다. 자체 서버·계정·탭은 정리했다.

현재 381개 소스 빌드의 실제 한국어 GUI에서 TLS OCSP 선택·핸드셰이크 스위치·세션 캐시 복수 인수 추가와 코드 반영, 업스트림 방식 중복 거부·기존 코드 변경 후 추가 성공·들여쓰기 및 외부 스크롤 없음·로그아웃을 확인했다. 원본 fixture 변경 없음과 자체 탭·서버 정리까지 완료: `docs/nginx-tls-korean-20261007.md`.

공개 nginx 1.28 TLS 설정 29개 중 GUI 제안에 빠진 21개를 추가하고 한국어 설명·스위치·선택 입력을 보완했다. 관련 검사 12개, 자체 임시 CA·키·CRL·DH·OCSP DER·티켓 파일을 사용한 실제 구문 60개 및 최신 381개 소스 빌드 통과. 이후 실제 TLS 1.2/1.3·최소 프로토콜 거부·서버 이름 검증·클라이언트 인증 요구/거부·핸드셰이크 거부·TLS 1.2 세션 재개 10개 그룹 통과: `docs/nginx-tls-korean-20261007.md`. 새 목록의 실제 브라우저 전체 흐름·TLS 1.3 세션 재개·OCSP·운영 적용은 별도 남는다.

GUI에서 서로 다른 업스트림 부하 분산 방식을 중복 추가하면 기존 초안을 보존하고 한국어 안내로 거부하도록 보완했다. 실제 nginx가 충돌을 경고만 남기고 성공 종료하는 특성을 확인한 뒤 관련 검사 12개·실제 구문/경고 관찰 17개 및 최신 380개 소스 빌드 통과: `docs/nginx-upstream-korean-20261007.md`. 코드 직접 편집이나 다른 include 파일에 있는 방식까지 이 추가 제한이 적용되는 것은 아니다.

업스트림 블록의 공개 기준 12개 중 누락된 GUI 제안 10개, server·keepalive 한국어 설명과 인수 없는 부하 분산 항목 입력을 보완했다. 부하 분산 방식은 기존 keepalive 앞에 추가한다. 실제 브라우저 한국어 설명·검색·인수 없는 추가·코드 순서·외부 스크롤 없음 확인과 실제 연결 재사용·가중치·hash·ip_hash·least_conn·random·down·backup 요청 9개 그룹 통과. 브라우저에서 발견한 한 줄 설정의 들여쓰기 수정 후 관련 검사 18개·실제 구문 16개·380개 소스 빌드 통과: `docs/nginx-upstream-korean-20261007.md`. 동적 DNS·시간 만료·서버 장애 복구와 운영 적용·복원은 별도 남는다.

nginx 공개 1.28 계열 프록시 목록 70개를 대조해 빠진 GUI 제안 57개와 한국어 설명·입력 방식을 보완했다. 관련 검사 20개, 실제 임시 nginx 구문 검사 209개 및 최신 379개 소스 빌드 통과. 동일 빌드의 실제 브라우저에서 한국어 재시도 검색·0 값·캐시 스위치·복수 인수 추가, 코드 편집 후 설정 순서 갱신과 외부 스크롤 없음 및 로그아웃 확인. 이후 GUI 코드 생성 함수로 만든 설정의 실제 헤더·본문·쿠키·캐시·재시도·오류 처리·TLS 이름 검증 11개 그룹 통과: `docs/nginx-proxy-catalog-20261007.md`. 모든 항목의 개별 브라우저 흐름과 운영 환경 적용·실패·복원은 별도 남는다.

공통 아이콘 버튼의 기본 SVG 선 색상·두께·모서리 및 채우기 규칙을 추가했다. 별도 SVG 스타일을 생략해도 아이콘 선이 표시되며 명시한 fill/stroke 속성은 유지한다. 기존 32px·무테두리·투명 버튼 규칙은 유지했다. 최신 378개 소스 빌드 `.runtime/verification/source-build-2026-10-06T18-21-59.570Z/result.json` 통과. 이 공통 보완 이후 전체 화면의 새 브라우저 검사는 아직 수행하지 않았다.

인증서 작업 로그의 실제 한국어 팝업에서 발견한 목록 가로 스크롤과 보이지 않는 닫기 SVG를 수정했다. 최종 실제 GUI에서 미완료/완료 기록 선택·안내·로그아웃, 목록 199px 가로 넘침 없음, 헤더 48px·32px 무테두리 아이콘 및 HTTP 재시작 조회 9개 그룹 확인. 최신 378개 소스 빌드 통과: `docs/certificate-interruption-20261007.md`. 운영 발급/설치는 포함하지 않는다.

현재 378개 소스 빌드의 실제 인증서 작업 기록 HTTP 8개 그룹과 보호 페이지·세션·PTY·감사 API HTTP 15개 그룹을 확인했다. 미완료 기록/완료 기록 우선 및 동일 세션으로 프로세스 재시작 뒤 조회, 실제 PTY의 한글·이모지/SSE 종료를 포함한다. 임시 서버와 fixture 정리 완료: `docs/certificate-interruption-20261007.md`. 실제 ACME·운영 서비스·OS 자모 조합 수용 또는 배포 검사가 아니다.

인증서 작업 시작 기록을 실행 전에 비공개 저장소에 내구적으로 저장하고, 재시작 후 종료 결과가 없는 작업을 “실행 상태 확인 필요”로 조회하도록 구현했다. 완료 기록 우선·중복 제거·실행 중 메모리 상태 유지 및 한국어 작업 로그 화면을 연결했다. 관련 고유 22개 검사 및 최신 378개 소스 빌드 통과: `docs/certificate-interruption-20261007.md`. 자동 잠금 해제/재실행은 하지 않으며 실제 ACME 중단 수용과 프로세스 확인은 별도 남음.

Node.js 앱 로그의 API/앱 전환 시 이전 로그·AI 입력 노출 및 늦은 응답/중복 조회를 차단하고 조회 버튼을 공통 아이콘으로 바꿨다. 실제 컴파일 컴포넌트 포함 관련 10개 검사와 현재 378개 소스 빌드 통과: `docs/node-app-log-context-20261007.md`. 운영 앱 journal/외부 AI 호출은 이 확인 범위에 포함되지 않는다.

공통 레이아웃의 활동 기반 세션 갱신과 HTTPS 보안 쿠키 이름 처리 오류를 수정했다. 관련 20개 검사, 같은 실제 브라우저 화면에서 277초 후 갱신·로그아웃, 최신 376개 소스 빌드 및 동일 빌드 HTTP 15개 그룹 통과. 실제 설치 환경 장기 유지와 운영 적용은 별도 남음: `docs/session-maintenance-20261007.md`.

HTTP core 설정 10개를 한국어 설명·지원 조건 및 블록별 제안 목록에 추가했다. 선택 입력/스위치와 원문 값 보존을 포함한 관련 검사 20개, 실제 임시 nginx 구문 30개 및 최신 377개 소스 빌드 통과. 실제 브라우저/운영 적용과 모든 모듈 완성은 별도 남음: `docs/nginx-http-core-korean-20261007.md`.

인수 없는 `internal;`을 location GUI에서 추가하지 못하던 문제를 수정했다. 관련 14개 검사에서 실제 컴포넌트의 추가 클릭·코드 생성·기존 행 유지 및 중복 제안 제거 확인. 실제 nginx 구문 3개와 최신 377개 소스 빌드 통과: `docs/nginx-valueless-settings-20261007.md`.

HTTP 캐시·연결·리다이렉트 관련 누락 25개를 한국어 GUI에 추가했다. 관련 25개 검사와 확장 HTTP 목록 실제 구문 102개 통과. 격리 브라우저의 한국어 캐시 검색·복수 인수 추가·internal 코드 반영 및 외부 스크롤 없음 확인, 로그아웃과 fixture 정리 완료. 빈 예시 표시 보완도 포함: `docs/nginx-http-lifecycle-korean-20261007.md`.

HTTP core 기준 목록 80개에 GUI 진입점과 한국어 설명이 있는지 대조했다. AIO·DNS·MIME·파일 조회 문맥 및 types/limit_except 블록 추가를 보완하고 MIME 이름을 실제 GUI callback으로 코드에 추가하도록 수정했다. 확장 목록 구문 117개, 블록/내부 include/AIO·캐시 실제 구문 11개 통과. 최종 설명 관련 검사 5개 통과: `docs/nginx-http-core-catalog-20261007.md`.

map/geo/split_clients GUI의 매핑 키 입력 및 따옴표 키 편집을 보완했다. 포함 파일 문맥·초안 복원과 앞에 있어야 하는 규칙의 삽입 순서도 반영했다. 관련 25개 검사와 실제 임시 nginx 구문/HTTP 8개 그룹 통과. 첫 HTTP 실패와 Host 전달 검증 도구 수정도 보존: `docs/nginx-mapping-gui-korean-20261007.md`.

후속 수정: 지시어 노드 선택 상태에서 새 항목을 부모 블록 또는 포함 파일 최상위에 추가하도록 보완했다. split_clients의 백분율·나머지 항목별 기존 설명을 복원하고 따옴표 매핑 키의 검색 파싱을 통일했다. 관련 22개 검사 통과. 이 후속 변경은 컴포넌트 callback·문맥·검색 검사 범위이며 운영 파일 적용이나 배포 완료를 뜻하지 않는다.

nginx events 전용 GUI에서 빠진 연결 처리 설정 네 개를 한국어 설명과 함께 추가했다. 관련 26개 검사, 실제 nginx 임시 구문 검사 5개, 개발 브라우저 한국어 설명 검색과 내부 스크롤 확인 완료. 전체 설치/운영 적용 및 이번 변경 이후 운영 빌드는 별도 남음: `docs/nginx-events-korean-20261007.md`.

이후 main 지시어 22개의 최상위 GUI 목록·한국어 설명/지원 조건·스위치/선택 입력 및 검색 빈 안내를 보완했다. 관련 30개 검사, 실제 임시 nginx 구문 15개/모듈·엔진 2개 미실행, 개발 GUI 22개 표시·한국어 검색 확인. events 변경도 포함한 최종 374개 소스 운영 빌드와 동일 빌드 HTTP 15개 그룹 통과. 전체 설치/운영 적용 완료가 아님: `docs/nginx-main-korean-20261007.md`.

nginx 스위치 내용 비우기에서 빈 값이 off처럼 표시되는 문제 수정. 비운 상태는 값 선택 입력으로 표시하고 on/off 선택 후 스위치로 복구한다. 관련 20개 검사·실제 개발 GUI 노드 왕복/원래 값 복구·현재 374개 소스 빌드 통과. 후속 GUI 코드 보기 확인 전 로그인으로 이동해 해당 부분은 미완료: `docs/nginx-cleared-switch-20261007.md`.

전체 목표는 미완료다. 이 문서는 긴 이전 작업 이력과 구분하여 현재 확인 범위와 남은 수용 검사를 표시한다. 파일 존재만으로 기능 완료를 판정하지 않는다.

| 요구사항 | 최신 확인 범위 | 남은 수용 검사 |
|---|---|---|
| Next.js·로그인·세션 | 최신 397개 소스 production 빌드와 동일 빌드 HTTP 16개 그룹 확인. 기존 보호 페이지/재시작 세션·만료 이동 증거, 현재 GUI 로그인/로그아웃 확인 | 설치 환경 장기간 유지 |
| 공통 레이아웃·테마·아이콘 | 공통 헤더·본문 내부 스크롤, 실제 1280/960/640 화면 주·보조 메뉴/로그/nginx/터미널 확인. RTL fixture도 확인 | 설치 앱 전체 IDE 흐름 |
| 설치·데몬·보안 | 실제 데몬 SSR 목록, 정책 차단과 감사 확인. 기존 103 설치 상태 읽기 확인 | 현재 데몬 GUI PostgreSQL 전용 실제 서비스 제어·private 권한 차단 완료. 전용 Docker 원래 GUI nginx·Redis 실제 apt 설치/목록 갱신/감사 완료. sudo GUI NOPASSWD→PASSWD 및 승인된 PASSWD→NOPASSWD nginx-check 변경 확인. native 비밀번호 요구 여부·visudo·원본 백업·감사 확인(2026-10-09) |
| nginx IDE | 원래 GUI→현재 canonical helper/native lock→실제 전용 systemd 적용·백업 복원 및 HTTP 확인. 실패 reload 원복 확인. TLS GUI 적용/복원 직접 확인, 자동 최종 보고 유실은 PARTIAL 유지 | 신규 nginx 인증·GUI 발급 배치 및 실제 SIGTERM 중단 후 GUI 재발급 완료(2026-10-09 후속 증거) |
| PostgreSQL IDE | 원래 Next GUI→인증 API→현재 canonical helper→실제 systemd HBA 적용·백업 복원. native coordinator 실패 원복/SIGKILL 복구도 실제 systemd reload/journal 삭제/원본·한글 데이터 확인. 테스트 환경 정리 | 현재 helper의 전체 코드 재시작·그래프 복원도 확인. 전체 코드 원래 GUI/API 정상 적용·백업 복원도 확인. 적용 재시작 실패 자동 원복의 원래 GUI 연결 확인. 전체 코드 helper SIGKILL 후 원래 GUI 명시 복구·실제 systemd/원본 hash/journal 정리 확인 |
| Certbot | 원래 GUI webroot+nginx installer 최종 발급·배치, 새 계정 nginx 인증 challenge 발급, native SIGTERM 중단 후 원본 설정 복구·같은 GUI 명시 재발급·독립 TLS 확인 완료. 첫 실패 증거 보존 | 이 발급·중단·재발급 범위의 남은 검사 없음. 최종 배포와 전체 설치 GUI 범위는 별도 |
| cron | 긴 경로 저장/복원 수정. 실제 103 설치 setgid·PAM·daemon에서 일반 UID 한글 실행·비활성 차단·백업 복원. 현재 396개 소스 원래 GUI 표준 입력 저장/검토 복원 및 native 원문 확인 | 단일 원래 GUI 세션→실제 설치 daemon 실행·원본 복원 연결 확인 완료 |
| MariaDB·Redis·Node.js | 현재 원래 GUI→인증 API→canonical helper→실제 전용 systemd/native 설정 변경·백업 복원. MariaDB/Redis 실제 값·원문·한글 데이터 보존. Node 등록/시작/재시작/정책/복원/enable/disable/stop·감사 확인 | 정상 흐름의 설치 서비스 연결 확인 완료. Redis 원래 GUI helper SIGKILL 후 같은 팝업 실제 복구 완료. MariaDB 같은 팝업 중단 복구는 직접 GUI/native 증거와 현재 관련 21개 파일 해시 대조로 확인. 자동 wrapper 기록 실패는 보존(acceptance-reconciled-20261009.json 참조). Node 설정 메타데이터 실패 자동 원복·중단 명시 복구 실제 GUI/native 완료(후속 기록 참조) |
| 터미널 | 실제 개발 웹 탭/route 왕복 및 현재 운영 HTTP PTY 한글·이모지/SSE/종료 상태 | 사용자가 Tauri 한글 입력·한영 전환 정상 확인(2026-10-09) |
| 로그·감사·복구 | 완료/실패 감사와 GUI context 보호, PostgreSQL SIGKILL 실제 복구 확인 | 설치 대상별 실제 운영 실패·복구 전체 흐름 |
| AI | 사용자 명시 지시로 AI API 연동 수용 완료. 실제 HTTP 429 기록은 보존하며 추가 호출 없음 | 사용자 수용 범위의 남은 검사 없음 |
| Tauri | 개발 8787/설치 8791 설정과 두 Cargo 모드 컴파일 | 실제 창·설치 GUI·입력기 실사용 |
| 다국어 | 기존 카탈로그·설명 구현. 현재 전체 검사 1446 중 1442 성공, 일본어·터키어 nginx 설명 및 신규 Certbot 항목 번역 검사 4개 실패 | 사용자 지시에 따라 한국어 개발 완료 후 진행 |
| 최종 배포 | 배포 스크립트 존재 | 모든 수용 검사 이후 최종 배포 때만 DEB 검증 |

위 표는 2026-10-08 최신 기록을 대조한 상태이며 전체 완료를 주장하지 않는다. 최신 빌드/HTTP는 `docs/current-runtime-check-20261008.md`, PostgreSQL native GUI는 `docs/postgresql-hba-interrupted-gui-20261008.md`, 좁은 화면은 `docs/narrow-layout-current-20261006.md`, AI는 `docs/approved-followup-20261007.md`가 근거다. 이후 본문은 이전 날짜의 보존된 이력으로 읽는다.

최근 운영 빌드 확인: `.runtime/verification/source-build-2026-10-05T21-34-41.474Z/result.json` (351개 소스), `.runtime/verification/production-http-2026-10-05T21-36-56.325Z/result.json` (13개 검사 그룹). 임시 localhost 서버·계정·작업 폴더를 사용했으며 종료·정리를 완료했다. Certbot은 세 인증 방식의 명령 미리보기까지만 확인했다. 실제 ACME 발급, 운영 서비스 변경, 설치 패키지 검증 및 OS 입력기 조합 검사를 포함하지 않는다.

좁은 화면 공통 CSS 수정·실제 브라우저 확인: `docs/narrow-layout-current-20261006.md`. PostgreSQL 수동 설정 백업 구현·29개 관련 검사: `docs/postgresql-manual-backup-current-20261006.md`. 위 운영 빌드 증거는 이 두 변경 이전 소스이므로 최신 변경의 운영 빌드 확인으로 사용하지 않는다.

추가 확인: 선택 파일 조회 실패/재시도는 `docs/package-ide-source-failure-current-20261006.md`, PostgreSQL 설명 수정은 `docs/postgresql-description-corrections-20261006.md`, 운영 작업 감사 결과 보완은 `docs/operational-audit-outcomes-20261006.md`에 기록했다. 이 변경들을 포함하는 소스 353개 운영 빌드가 `.runtime/verification/source-build-2026-10-05T22-05-57.468Z/result.json`에서 성공했다. 기존 HTTP 수용 검사는 이전 빌드에 대한 증거로 유지하며 최신 빌드의 HTTP 수용 검사로 확대 해석하지 않는다. 비동기 설치·인증서·터미널 작업의 최종 감사 결과 연결은 아직 남아 있다.

이후 설치·인증서 비동기 작업의 최종 감사 결과를 연결했다: `docs/async-operation-audit-20261006.md`. 관련 검사 12개 및 격리 기존 검사 59개 통과, 기존 검사 1개 건너뜀. 실제 설치/ACME 실행은 수행하지 않았으며 위 353개 운영 빌드는 이 비동기 변경 이전 증거다. 터미널의 최종 감사 결과 연결과 실제 운영 수용 검사는 여전히 남아 있다.

터미널 최종 감사 결과도 연결했다: `docs/terminal-audit-20261006.md`. 관련 검사 8개, 기존 터미널 검사 23개, 실제 로컬 셸→감사 파일 검사 1개 통과. 전체 서비스·설치·인증서 운영 수용 검사와 OS 입력기 검사는 이 증거로 완료 판정하지 않는다.

최신 운영 연동 증거: `docs/current-production-integration-20261006.md`. 최근 비동기·터미널 감사 변경까지 포함한 353개 소스 빌드 및 동일 빌드 HTTP 15개 그룹을 확인했다. 빌드 `.runtime/verification/source-build-2026-10-05T22-12-33.203Z/result.json`, HTTP `.runtime/verification/production-http-2026-10-05T22-13-01.979Z/result.json`. 인증서 완료 작업의 프로세스 재시작 후 저장 기록 조회는 추가 남은 구현 항목이다.

인증서 완료 작업의 저장 기록 조회를 이후 구현했다: `docs/certificate-job-restart-20261006.md`. 실제 별도 Node.js 프로세스 조회와 인증된 API의 비동기 응답·오류 전달을 확인했다. 위 운영 빌드·HTTP 증거는 이 변경 이전이며 실제 ACME 작업 실행 및 강제 종료 중인 작업 복구는 포함하지 않는다.

완료 기록 목록과 선택 로그 팝업을 연결했다: `docs/certificate-job-history-ui-20261006.md`. 개발 SSD의 exFAT 권한 한계 때문에 새 완료 기록은 지정된 Linux 인증 저장소 아래 별도 폴더에 저장한다. 실제 브라우저에서 새 조회 경로와 기존 안전하지 않은 저장소 제외 안내를 확인했다. 실제 완료 작업 선택 및 ACME 수용 검사는 여전히 미완료다.

완료 기록 저장을 임시 파일·fsync·배타적 공개 잠금·rename으로 보완했다: `docs/certificate-record-publication-20261006.md`. 관련 검사 12개 통과. 실제 ACME 및 강제 종료 시점별 수용 검사는 포함하지 않는다.

터키어 공통 UI 193개 문구를 부분 번역 카탈로그로 추가했다: `docs/turkish-ui-current-20261006.md`. 언어 관련 검사 16개 통과. 전체 터키어 및 나머지 Linux 언어 번역 완료를 의미하지 않는다.

위 인증서 기록 및 터키어 변경을 포함한 현재 소스 356개 운영 빌드를 확인했다. 인증서 완료 기록은 실제 인증된 Next.js HTTP API에서 목록·선택 상세·손상/권한 오류·서버 재시작 후 조회 5개 그룹을 확인했다: `docs/certificate-history-production-20261006.md`. 실제 인증서 발급이나 GUI 완료 작업 선택을 확인한 증거는 아니다.

현재 개발 브라우저에서도 완성된 한글·영문 명령의 입력 표시와 출력·다음 프롬프트를 확인했다: `docs/terminal-input-current-20261006.md`. OS 입력기 자모 조합 검사는 여전히 미완료이며 코드 수정의 근거가 되는 입력 오류는 이번 화면에서 재현되지 않았다.

설치 완료 기록의 비공개 저장소 및 안전한 읽기를 보완했다: `docs/install-record-storage-20261006.md`. 이전 설치 잠금은 계속 차단하고, 최대 로그 상태의 시간 초과도 최종 기록을 저장한다. 관련 검사 10개 통과이며 실제 apt 실행 및 설치 환경 수용 검사는 포함하지 않는다.

위 설치 기록 변경을 포함한 357개 소스 운영 빌드와 실제 인증된 API 조회·권한 오류·손상·이전 경로·프로세스 재시작 조회를 확인했다: `docs/install-record-production-20261006.md`. 실제 apt 실행은 포함하지 않는다.

PostgreSQL의 실제 임시 DB 기동·설정 적용·실패 후 원본 복구 도구를 준비했지만 현재 Docker Desktop 소켓 부재로 이미지 확인 단계에서 BLOCKED다: `docs/postgresql-lifecycle-current-20261006.md`. 실제 DB 실행 또는 PASS로 확대 해석하지 않는다.

nginx 단일 항목 반영 후 다른 기존 항목의 미반영 입력이 노드 탐색 복귀 때 사라지는 문제를 수정했다. 블록별 입력 scope도 분리했다. 관련 검사 10개와 실제 개발 브라우저의 다중 입력·단일 반영·탐색 복귀를 확인했다: `docs/nginx-pending-setting-preservation-20261006.md`. 운영 파일 적용은 수행하지 않았다.

추가 제안 항목의 미반영 입력도 변경되지 않은 블록 범위에서 보존하도록 보완했다. 최신 관련 검사 12개와 실제 events 블록 multi_accept 스위치의 단일 항목 반영·노드 복귀 보존을 확인했다. 위 문서에 최신 범위를 기록했다.

설치·인증서 작업의 바이트 조각 경계에서 UTF-8 문자가 깨지는 로그 처리를 보완했다. 관련 검사 20개와 worker 종료 파일의 한글·이모지 보존을 확인했다: `docs/operation-log-utf8-20261006.md`. 실제 apt/ACME 실행은 포함하지 않는다.

인증서 로그를 그대로 이어 붙이는 화면의 개행 보존도 보완하고 관련 검사 14개를 확인했다. 터키어 카탈로그는 Certbot 문구 56개를 추가해 249개이며 실제 개발 화면에서 표시를 확인한 뒤 ko-KR로 복원했다: `docs/turkish-ui-current-20261006.md`. 전체 다국어 및 실제 인증서 발급 완료를 의미하지 않는다.

nginx의 실제 인증 API 처리기→패키지 경로 helper→격리 nginx 적용/복원 연결을 확인했다: `docs/nginx-api-isolated-current-20261006.md`, 11개 검사 그룹 및 기존 관련 검사 6개 통과. 설정 적용/복원 정책 차단의 감사 기록 누락도 수정했다. 실제 nginx 응답 변경·복원과 reload 실패 후 원본 복구를 확인했으나 sudo/systemd는 격리 adapter다. Next.js 컴파일 라우트·GUI 및 실제 설치 환경 수용 검사로 확대 해석하지 않는다.

이후 실제 Next.js 컴파일 라우트까지 연결했다: `docs/nginx-next-integration-current-20261006.md`. 최신 358개 소스 빌드 및 nginx 연동 12개·일반 HTTP 15개 검사 그룹을 확인했다. 라우트가 운영 결과를 중복 기록하고 비동기 접수를 조기 완료로 기록하는 문제도 제거했으며 실제 PTY 감사 결과가 요청/완료 각각 한 번임을 확인했다. 운영 sudo/systemd 환경과 브라우저 GUI 전체 흐름은 여전히 별도 남은 범위다.

같은 빌드에서 실제 브라우저로 nginx 코드 편집→검토/적용→백업 선택/복원→검수 팝업 흐름을 확인했다: `docs/nginx-gui-apply-restore-current-20261006.md`. 종료 시 원본 설정 파일과 HTTP 응답 복원도 확인했다. 임시 환경의 서비스 상태 조회 adapter 한계 및 완료 안내가 갱신과 함께 사라지는 UI 개선 항목을 기록했다. 실제 운영 sudo/systemd 및 시작/종료 확인은 남아 있다.

nginx 적용·복원의 완료 안내가 패널 정리/목록 갱신 후에도 유지되도록 수정했다: `docs/nginx-completion-feedback-current-20261006.md`. 관련 검사 9개 및 실제 브라우저 성공 후 안내 유지를 확인했고 최종 표시 조건까지 포함한 358개 소스 빌드도 통과했다. 임시 fixture의 일반 서비스 상태 조회 adapter도 보완했지만 실제 systemd 시작/종료 검증을 뜻하지 않는다.

최신 같은 빌드의 실제 Next.js 라우트와 일반 UID의 native crontab을 연결하여 조회·추가·비활성화/재활성화·삭제·수동 백업/복원·인증/정책/버전 차단·정확한 감사 결과 14개 그룹을 확인했다: `docs/cron-next-integration-current-20261006.md`. 호스트 crontab과 예약 서비스는 변경하지 않았다. 실제 GUI 및 설치 spool/setgid 권한, daemon 예약 실행은 별도 남은 범위다.

PostgreSQL 복원 완료 후 선택 파일의 코드/설정을 다시 읽는 부모 callback 누락을 수정했다. 미저장 편집과 작업 폴더 저장 기준을 보존하고 적용/복원 뒤 조회 실패도 완료 결과와 구분한다. 관련 검사 14개 및 최신 358개 소스 빌드 통과: `docs/postgresql-restore-ui-sync-20261006.md`. 실제 DB coordinator의 로컬 검사와 권한 helper/API/브라우저 수용 검사 범위는 구분하며 후자는 아직 남아 있다.

실제 Better Auth·보안·감사·HTTP API 처리기를 임시 PostgreSQL 18.6에 연결했다. 권한 정책/인증/Origin 차단과 적용·실패 후 복구·백업 그래프 복원 9개 그룹을 확인하고, PostgreSQL 네 코드 action의 정책 차단 감사 누락을 수정했다: `docs/postgresql-http-local-20261006.md`. 관련 검사 4개 및 동일 API 변경의 358개 소스 빌드 통과. privilege/systemd는 fixture adapter이며 실제 helper·Next.js 서버·GUI 전체 흐름은 남아 있다.

실제 PostgreSQL helper 단계의 격리 계정 전환 preflight는 단일 UID 전환 EINVAL 및 subordinate UID 매핑 EPERM으로 BLOCKED다: `docs/postgresql-helper-preflight-20261006.md`. 호스트 권한이나 helper 검사를 변경하지 않았다. 별도 검증 환경을 확인 요청했으며 나머지 개발 목표는 계속 활성이다.

Certbot 성공 상태 렌더링이 진행 중인 인증서/nginx 목록 갱신을 취소할 수 있는 폴링 effect 문제를 수정했다. 목록 실패 시 완료 로그를 유지하고 terminal 작업 재조회도 중단한다. 관련 검사 5개 및 358개 소스 빌드 통과: `docs/certificate-completion-refresh-20261006.md`. 실제 ACME 발급·갱신 수용 검사는 별도 남아 있다.

공유 GUI 검사 44개를 확인한 뒤 HBA 적용/복구의 비동기 갱신 callback 처리 및 빈 파일 목록의 남은 초안 교체 확인을 보완했다. 최신 관련 검사 6개 통과: `docs/hba-completion-refresh-20261006.md`. 실제 helper/reload 검증은 격리 계정 환경 확인 답변을 기다리며 직전 전체 빌드는 이번 변경 이전 증거다.

MariaDB·Redis 코드 적용 뒤 비동기 갱신을 기다리고 완료/복구 결과를 보존하도록 수정했다. 관련 PostgreSQL 회귀를 포함한 15개 검사 통과: `docs/database-completion-refresh-20261006.md`. 실제 DB/helper 수용 검증 또는 최종 배포 완료를 뜻하지 않는다.

Redis·MariaDB 공통 IDE 헤더에 기존 백업 조회/복원 팝업을 연결하고, 복원 뒤 선택 파일의 설정·코드 동기화 및 미저장 편집 보존을 구현했다. 관련 9개 검사 통과: `docs/database-ide-backup-restore-20261006.md`. 새 백업 생성 또는 실제 운영 DB 수용 검증 완료를 뜻하지 않는다.

HBA·MariaDB/Redis 적용 완료 갱신 및 새 DB IDE 백업/복원 연결까지 포함한 최신 358개 소스 Next.js 빌드 성공: `.runtime/verification/source-build-2026-10-05T23-48-22.434Z/result.json`. 실제 서비스·브라우저 수용 검사의 범위는 각 문서와 동일하다.

Redis·MariaDB 수동 선택 파일 백업 API/helper/IDE 팝업을 추가하고 PostgreSQL 수동 백업의 권한 라벨 누락을 보완했다. 관련 46개 검사 및 최신 359개 소스 Next.js 빌드 성공: `docs/database-manual-backup-20261006.md`, `.runtime/verification/source-build-2026-10-05T23-56-17.591Z/result.json`. 실제 설치 helper·DB 운영 수용 검증은 별도 남아 있으며 DEB 검증은 실행하지 않았다.

Redis/MariaDB 수동 파일 백업을 현재 컴파일된 Next.js → 실제 패키지 경로 helper → private 백업/catalog까지 격리 환경에서 연동했다. 10개 검사 그룹 통과: `docs/database-backup-next-isolated-20261006.md`, `.runtime/verification/database-backup-isolated-2026-10-06T00-00-11.755Z/result.json`. sudo transport만 fixture adapter이며 호스트 sudo·DB 재시작·GUI 수용 검증 또는 최종 배포 완료로 확대하지 않는다.

실제 브라우저의 Redis·MariaDB 선택 파일 백업 생성과 완료 안내·목록 증가를 확인했다: `docs/database-backup-gui-current-20261006.md`. 설치 목록/sudo는 fixture adapter이며 자동 검사의 systemctl sentinel 실패는 FAIL로 보존했다. 전체 GUI/서비스 수용 검사 완료로 확대하지 않는다.

Node.js 작업 폴더 환경 파일 복원의 중복 요청·이전 연결 결과 유입을 막고 비동기 갱신 실패를 실제 복원 결과와 분리했다. 관련 13개 검사 통과: `docs/node-env-restore-current-20261006.md`. 직전 전체 빌드 이후 변경이며 실제 설치 환경 수용 확인은 별도 남아 있다.

이 변경을 포함한 현재 359개 소스 빌드와 실제 Next.js Node.js 환경 파일 조회→변경→private 백업→서버 재시작→복원 연동 9개 그룹을 확인했다: `docs/node-env-next-current-20261006.md`. 동일 세션 유지·원문 복원·정책/버전/백업 변조 차단을 임시 작업 폴더에서 확인했으며 서비스 제어·GUI·설치 환경 전체 수용 확인은 남아 있다.

등록 Node.js 앱의 환경 변경·복원·등록 해제 감사 결과 누락을 보완하고 현재 359개 소스 Next.js 서버의 실제 일반 사용자 UID에서 등록/파일 검사/환경 변경·백업/재시작/복원/등록 수정·해제 8개 그룹을 확인했다: `docs/node-app-next-current-20261006.md`. 앱 파일 보존과 비밀 값 미노출을 확인했으며 서비스 제어·GUI·설치 환경 전체 수용 확인은 남아 있다.

현재 빌드의 실제 브라우저에서 등록 Node.js 앱 환경 파일의 포트 변경·저장·백업 조회·비교·복원 및 값 재표시를 확인했다: `docs/node-app-gui-current-20261006.md`. 종료 검사에서 원문 일치와 백업 2개를 확인했다. 설치 목록에만 fixture adapter를 사용했고 실제 패키지 설치·서비스 제어 및 전체 GUI 확인으로 확대하지 않는다.

Node.js 앱 설정의 긴 단일 화면을 등록 정보/환경/서비스/로그 탭으로 구분했다. 관련 7개 검사와 실제 브라우저 입력 보존·키보드 탭 이동·환경 변경/복원을 확인했고, 최종 flex 컨테이너 빌드에서 문서 스크롤 없이 패널만 스크롤하면서 탭이 고정됨을 확인했다: `docs/node-app-tabs-current-20261006.md`. 최종 빌드는 359개 소스 `/tmp/tastedev-current-build-KpfjL6`다.

Node.js 서비스 제어 버튼을 테두리 없는 아이콘으로 변경하고 작업 성공 뒤 선택 앱 상태 갱신을 연결했다. 조회 실패와 실제 작업 결과를 분리하고 이전 API 연결 결과 유입을 차단했다. 관련 JSX 8개 검사 통과: `docs/node-service-feedback-current-20261006.md`. 직전 전체 빌드 이후 변경이며 실제 systemd 제어와 설치 장비 수용 확인은 남아 있다.

현재 빌드의 실제 cron GUI에서 nginx 컨텍스트 메뉴 진입·조회·추가·일정 편집/비활성화·수동 백업·비교/복원을 확인하고 native crontab 원문 복원을 확인했다: `docs/cron-gui-current-20261006.md`. 저장 성공 뒤 검토/확인이 남아 재저장 가능한 문제를 수정했고 관련 JSX 검사 2개 통과. 실제 예약 daemon 실행과 설치 spool/setgid 권한 수용 검사는 남아 있다.

cron 저장 완료 상태 수정까지 포함한 최신 359개 소스 빌드 성공 및 실제 브라우저의 검토문/확인 초기화·저장 비활성·완료 안내/입력 보존을 확인했다: `docs/cron-gui-current-20261006.md`. 임시 작업 삭제 후 native crontab 원문 일치 확인. 예약 daemon 실행과 설치 환경 수용 완료를 의미하지 않는다.

터미널에 Ctrl+Shift+C/V 선택 복사·붙여넣기를 구현했다. 비동기 읽기 후 세션/입력 큐/표시 상태 검증과 붙여넣기 순서 보존을 추가했고 기존 Ctrl+C·IME 처리를 유지했다. 관련 검사 14개·언어 검사 16개 통과: `docs/terminal-clipboard-current-20261006.md`. 실제 브라우저 클립보드 권한과 OS 자모 조합 확인은 남아 있다.

터미널 클립보드 대기 중 Enter/일반 타이핑의 순서를 보완했다. 관련 검사 10개 및 최신 360개 소스 빌드 성공. 실제 임시 브라우저/PT​Y에서 Ctrl+Shift+V→Enter 한 번으로 한글 출력·프롬프트 복귀, 출력 선택 Ctrl+Shift+C의 정확한 클립보드 값 일치를 확인했다: `docs/terminal-clipboard-current-20261006.md`. 임시 셸 종료 확인과 원래 클립보드 복원 완료. OS 자모 조합은 별도 미완료다.

관리 페이지의 헤더/아이콘 패널/메뉴/상태바를 실제 `(console)/layout.jsx`의 지속되는 `ConsoleChrome`으로 옮겼다. 기존 각 페이지의 경로별 인증/SSR 본문은 유지한다. 관련 검사 12개·최신 361개 소스 빌드·실제 인증 HTTP 15개 그룹 및 브라우저의 페이지 전환 뒤 공통 검색 상태 유지, 5개 페이지의 문서 스크롤 없는 1280×720 배치를 확인했다: `docs/console-shared-layout-current-20261006.md`. terminal 복귀 초기 프롬프트 redraw 표시 겹침은 별도 미완료 항목으로 남겼다.

터미널 페이지 복귀 시 xterm/출력 cursor를 메모리에 보존하고 종료·로그아웃 시 정리하도록 수정했다. 관련 25개 검사 및 최신 362개 소스 빌드 성공. 실제 브라우저의 입력 중 명령→대시보드→터미널 복귀 보존, Enter 한 번 출력·정상 프롬프트, 새 탭의 깨끗한 화면을 확인했다: `docs/terminal-route-screen-current-20261006.md`. GUI runner 정리 과정 exit 143으로 마지막 자동 종료 검사는 미완료(PARTIAL)이며 임시 셸/인증 파일은 별도 정리했다. OS 한글 자모 조합과 모든 ANSI/크기 변경 수용 검증은 남아 있다.

터미널 표시 설정(글자 크기·커서 모양/깜박임·출력 보관량)을 추가했다. 실행 중인 emulator 옵션 갱신과 숨겨진 탭 fit 방지, 로그인 작업 공간의 설정 유지·초기화를 연결했다. 관련 25개 검사·363개 소스 빌드 및 실제 브라우저 18px 적용/동일 셸 한글 출력·정상 프롬프트, 임시 셸 종료를 확인했다: `docs/terminal-appearance-current-20261006.md`. 전체 OS 입력기 및 설치 환경 수용 범위는 여전히 남아 있다.

터키어 nginx 설정·블록 설명 216개 문구를 추가해 카탈로그는 479개다. 5개 설명 모듈의 현재 한국어 문자열 195개 전체에 직접 터키어 번역이 있고 런타임 선택 설명·버전/지시어 의미·번역 검색 및 언어/SSR 검사 18개 통과: `docs/turkish-ui-current-20261006.md`. 전체 터키어/Linux 언어 UI 번역 및 원어민·GUI 수용 검사는 여전히 미완료다.

운영 패널(데몬·로그·복구·보안/sudo·감사)의 터키어 문구 93개를 추가해 카탈로그는 572/1452개다. 관련 소스에 등록된 문구의 직접 번역과 정책 설명·UTC·수치 보간, 기존 nginx/언어/SSR 검사 20개 통과: `docs/turkish-ui-current-20261006.md`. 보간 검사에서 언어별 변수 순서 변경을 허용하되 이름과 개수를 계속 확인하도록 수정했다. 전체 Linux 언어 UI 및 GUI/원어민 검수는 미완료다.

로그인·GUI 파일/코드 편집 터키어 문구 64개를 추가해 카탈로그는 636/1452개다. 직접 번역·파일명/공백 보존 및 실제 컴파일 로그인 컴포넌트의 React SSR 저장소 오류 안내, 기존 언어/SSR 검사 18개 통과: `docs/turkish-ui-current-20261006.md`. 독립 렌더용 상위 hook adapter 사용 범위이며 전체 App Router/브라우저 검증이나 원어민·Linux 전체 UI 완료로 확대하지 않는다. AI 구현은 키 사용 결정 답변을 기다린다.

nginx IDE·적용/복원·중단 복구와 패키지 검색/설치 상태 터키어 문구 135개를 추가해 카탈로그는 771/1452개다. 설명·화면 카탈로그 누락, 원본/서비스 복구 범위 구분 및 기존 운영/편집/언어/SSR 검사 23개 통과: `docs/turkish-ui-current-20261006.md`. 실제 GUI/설치/원어민 검수와 전체 Linux 언어 번역은 여전히 미완료다.

패키지별 PostgreSQL/MariaDB/Redis/Node.js GUI·백업/복원·중단 복구·앱 환경/서비스 문구와 실제 필드/Redis 정책 347개를 터키어로 추가했다. 현재 카탈로그 1118/1452개이며 직접 번역/런타임 스키마/정책 조건/기존 언어·SSR 검사 18개 통과: `docs/turkish-ui-current-20261006.md`. 이번 변경은 UI 번역이며 실제 DB/서비스 수용 또는 전체 Linux 언어/원어민 검수 완료를 뜻하지 않는다.

터키어 UI 카탈로그 1452개 전체 키 충족. 관련 설정/운영/편집/스키마/언어·SSR 검사 25개, 최근 다국어 변경 포함 363개 소스 빌드 및 실제 개발 서버 로그인 HTTP 터키어 SSR을 확인했다: `docs/turkish-ui-current-20261006.md`. 모든 Linux 언어 번역·원어민/운영 GUI 수용은 미완료이며 AI 키 사용/다국어 응답 개선은 답변 대기다.

nginx 코드 보기의 반영/초기화 버튼을 32px 테두리 없는 아이콘으로 통일하고 노드별 커서·선택·스크롤 복원을 추가했다. 코드 순서→설정 목록 전달을 포함한 컴포넌트/복구 회귀 13개 확인: `docs/nginx-code-view-state-current-20261006.md`. 실제 브라우저 및 운영 빌드는 이번 변경에 대해 아직 확인하지 않았다.

위 nginx 편집 위치 변경의 실제 브라우저 확인까지 완료했다: 설정/코드 탭 왕복 및 노드 이동 후 선택·가로/세로 스크롤 복원, 32px 무테두리 투명 아이콘, 코드 순서대로 설정 목록 갱신. 최신 363개 소스 빌드 CRoWll과 읽기 전용 임시 설정으로 검사했으며 운영 서비스 변경이나 배포 검사는 포함하지 않는다. 자세한 증거는 `docs/nginx-code-view-state-current-20261006.md`.

Redis 검수 환경 자체의 실패를 설정 오류 및 NOPASSWD 권한 실패와 구분하는 공개 503 안내를 추가했다. 관련 28개 고유 회귀 검사 및 현재 서버의 단독 sandbox 자원/namespace 프로브 성공: `docs/redis-sandbox-errors-current-20261006.md`. 호스트 Redis 실행 파일은 없고 기존 중첩 검증 장비의 기동 BLOCKED는 유지하며 실제 Redis 기동 성공이나 설치 helper HTTP 수용으로 확대하지 않는다.

관리 helper의 오류 상태 전달·UTF-8 stderr 보존·응답 크기 제한을 구현하고 Redis 새 모듈의 설치 runtime 목록 누락을 수정했다. 실제 일반 사용자 helper 거부 및 실제 runHelper 코드/자식 프로세스 fixture 전달을 포함한 27개 고유 검사 성공: `docs/helper-error-protocol-current-20261006.md`. 설치 helper/sudo/HTTP 전체 수용 및 배포 검사는 포함하지 않는다.

최신 365개 소스 빌드에서 실제 Next.js→패키지 경로 helper 연동을 확인했다. Redis 원본 충돌 409, 실행 파일 부재 400, 실제 중첩 sandbox 환경 거부 503; Redis/MariaDB 백업·정책·감사도 유지됨을 확인했다. 설치 소스 runtime 목록의 두 번째 누락을 수정하고 두 목록 일치 검사를 추가했다: `docs/helper-error-api-isolated-current-20261006.md`. sudo는 fixture adapter이며 실제 운영 Redis 기동·서비스 제어 및 배포 검사는 여전히 미완료다.

공통 PostgreSQL·Certbot 등 패키지 코드 편집의 파일별 커서/선택/가로·세로 스크롤 복원을 추가했다: `docs/package-code-position-current-20261006.md`. 관련 6개 검사 및 동일 최종 소스 366개 Next.js 빌드 성공. 실제 패키지 화면의 브라우저 위치 복원 및 OS 입력기 수용 검사로 확대 해석하지 않는다.

공통 코드 편집기의 실제 PostgreSQL GUI에서 설정/코드 탭 및 두 클러스터 파일 왕복 후 커서·선택 방향·양방향 스크롤과 구문 강조/줄 번호 동기화를 확인했다. 읽기 전용 fixture 원본 보존 및 임시 서버·계정·탭 정리 PASS: `.runtime/verification/package-editor-gui-2026-10-06T01-58-27.265Z/result.json`. Certbot 실제 업무나 운영 DB 수용 검사는 포함하지 않는다.

실제 Certbot GUI에서 nginx/webroot/standalone 전환에 맞는 API 명령·웹 루트 필드의 표시 전환·이전 미리보기 무효화·코드 탭 선택/스크롤 복원을 확인했다: `docs/certbot-method-gui-current-20261006.md`. 임시 fixture 정리 PASS, 실제 ACME 발급/갱신은 포함하지 않는다.

공통 패키지 IDE의 `packageIdeCodeRecords`가 미저장 파일 검사에서 누락된 문제를 수정했다: `docs/package-ide-unsaved-current-20261006.md`. 관련 12개 검사와 현재 366개 소스 빌드 PASS. 브라우저 reload 시도 후 초안은 유지됐지만 이탈 확인창은 도구에서 관측되지 않아 GUI 게이트 FAIL/PARTIAL로 보존했다. 확인창 표시/취소 전체 확인은 남아 있다.

지정된 103 장비의 설치 서비스가 whitecalvin 계정으로 실행됨을 재확인하고 별도 공식 PostgreSQL 18.6 Docker 컨테이너에서 실제 root→postgres UID/GID 전환을 확인했다. 기본 보안 설정의 user namespace 생성은 거부되어 helper 검수는 여전히 미완료다. 최신 helper와 설치 helper 해시도 달랐다. `docs/remote-container-preflight-current-20261006.md`, 운영 서비스/DB/sudo 및 DEB 검증 변경 없음.

103 장비의 격리 컨테이너에서 기본 allowlist에 정확한 CLONE_NEWUSER만 추가한 프로필로 postgres UID999의 user namespace 생성이 성공했고, SETFCAP만 추가한 root 경로도 성공했다. AppArmor enforce·네트워크 차단·호스트 mount 없음 유지 및 정리 확인. `docs/remote-namespace-policy-current-20261006.md`. 실제 bwrap 전체 격리와 helper 수용 검사는 별도 남아 있다.

현재 helper 및 런타임 137개를 포함한 전용 PostgreSQL 검증 이미지 계획/Dockerfile/해시를 로컬 준비했다. 원격 소스 전송은 명시적 승인 부재로 자동 승인 검토에서 거부되어 실행되지 않았고 사용자 승인 요청 대기 중이다. `docs/remote-postgresql-image-current-20261006.md`. 공개 Node 이미지 준비만 완료했으며 helper 이미지 빌드/실행은 미완료다.

현재 8787 개발 서버의 실제 로그인/Flight 클라이언트 청크에서 최신 패키지 IDE 미저장 보호 코드 제공을 확인했다. `.runtime/verification/live-dev-unsaved-flight-20261006/result.json` PASS; 재시작 없음. 원격 검증 이미지 소스 전송 승인은 계속 대기 중이며 승인 없이 실행하지 않았다.

GUI 검증 실패로 코드에 반영되지 못한 pending 입력도 미저장 guard 및 새 파일 초안 교체 확인에 포함했다. 한 항목 수정 시 다른 pending 항목도 보존한다. 실제 컴파일 컴포넌트 포함 12개 검사 및 현재 366개 소스 Next.js 빌드 PASS: `docs/package-ide-pending-gui-current-20261006.md`. 실제 브라우저 확인은 별도 남아 있다.

실제 PostgreSQL GUI에서 여러 pending 입력의 그룹 전환 보존·한 항목 교정 후 다른 pending 유지·원문과 같은 코드에서 pending만으로 파일 교체 확인·편집 유지 후 값 보존·로그아웃 로그인 이동을 확인했다. 읽기 전용 fixture 및 정리 PASS: `.runtime/verification/package-editor-gui-2026-10-06T02-23-43.610Z/result.json`. beforeunload 팝업 수용 검사와는 구분한다.

선택 파일 IDE의 불필요한 운영 설정 재불러오기 확인창을 제거하고 실제 PostgreSQL 메모리 그룹 편집→코드 반영을 확인했다: docs/package-ide-source-import-current-20261006.md. 이후 그룹의 5개 설정 설명을 기존 17개 언어 카탈로그에 연결하고 본문 중복 백업/조회 전용/독립 생성기 저장 안내를 제거했다: docs/postgresql-grouped-descriptions-current-20261006.md. 9개 관련 검사 및 현재 366개 소스 빌드·한국어 메모리 그룹 브라우저 확인 완료. 전체 앱·운영 장비 수용 검사 또는 최종 배포 완료를 의미하지 않는다.

전체 파일 설정 화면의 미반영 입력도 보존하도록 보완했다: docs/file-setting-pending-inputs-current-20261006.md. 17개 관련 검사와 현재 367개 소스 빌드, 실제 PostgreSQL GUI의 입력→코드 탭→설정 복귀·개별 수정·동일 내용 파일 교체 확인·유지 후 복귀를 확인했다. Redis/MariaDB는 해당 모델/컴파일 컴포넌트 검사 범위이며 실제 설치 운영 GUI를 완료했다고 주장하지 않는다.

미반영 GUI 입력이 남은 상태의 이전 코드 검수/적용 검토를 차단하고 복원 후 pending-only 초안도 보존했다: docs/pending-input-operation-guard-current-20261006.md. 관련 검사 15개, 번역 검사 및 현재 367개 소스 빌드 통과. 안내/서비스 오류 2개 문구의 기존 11개 외국어 카탈로그 번역을 추가했다. 실제 설치 운영 장비 수용 검사와 전체 Linux 언어 번역 완료로 확대하지 않는다.

우크라이나어 UI의 공통/로그인/편집/일부 터미널 문구 171개를 추가하고 기존 PostgreSQL 설명과 연결했다: docs/ukrainian-ui-current-20261006.md. 14개 언어 검사, 카탈로그 검사, 현재 소스 368개 빌드와 실제 로그인 페이지의 선택·새로고침 언어 유지·부분 번역 표시를 확인했다. 기준 1456개 중 1285개는 아직 영어 fallback이다. 우크라이나어 또는 전체 Linux 언어 UI 완료로 판정하지 않는다.

우크라이나어 운영 화면 번역을 추가해 총 314/1456개가 되었다. sudo 정책/보안 스위치/데몬·로그·복구/터미널 화면의 고정 문구 143개 추가, 언어 검사 14개 및 카탈로그 검사 통과. 1142개와 그 밖의 Linux 언어는 미완료이며 이번 추가분은 실제 GUI 검수 전이다. docs/ukrainian-ui-current-20261006.md 참조.

nginx 헤더 복원 팝업의 오래된 일반 복원 화면을 제거하고 nginx 전용 검수/적용 흐름 하나로 정리했다. 컴파일 컴포넌트 및 적용·복원 회귀 12개 통과: docs/nginx-restore-popup-current-20261006.md. 이번 변경의 실제 브라우저와 설치 환경 수용은 별도 남아 있다.

nginx 복원 팝업 정리의 현재 368개 소스 빌드와 별도 읽기 전용 브라우저 화면 확인 완료. 백업 선택 1개/전용 복구 검토/중단 복구 유지, 임시 계정 로그아웃과 탭 종료 확인. 실제 운영 복원 실행 검사는 아님: docs/nginx-restore-popup-current-20261006.md.

nginx 기존 설정 행과 코드 버퍼 미반영 상태에서 이전 초안 검수/적용을 차단했다. 관련 19개 검사·현재 368개 소스 빌드·읽기 전용 실제 GUI의 pending 안내/값 되돌리기/코드 탭 복귀 확인과 fixture 정리 완료. 사용자 지정 지시어/블록 인수와 운영 권한 수용은 미완료: docs/nginx-pending-apply-current-20261006.md.

nginx 사용자 지정 지시어/새 블록/기존 블록 인수도 미반영 cache와 검수 guard에 연결했다. 노드 이동 복원·실패 입력 유지·성공 입력만 삭제·다른 pending 입력 보존 관련 컴파일/모델 검사 15개 통과. 추가분 실제 브라우저/운영 환경 수용은 별도 남아 있다: docs/nginx-pending-apply-current-20261006.md.

위 nginx 보조 입력 보호와 원본 갱신 시 화면 동기화까지 포함한 최종 소스 368개 빌드 /tmp/tastedev-current-build-SjipqK 성공. 실제 브라우저 보조 입력 확인은 미완료이며 이전 pending GUI 증거와 구분한다.

nginx 보조 입력의 실제 GUI 확인 완료: 사용자 지정 지시어·블록 인수·새 블록 입력의 노드 왕복 보존, 초안 반영 후 목록/노드명 갱신과 미반영 안내 해제, 임시 초안·계정·탭·fixture 정리 PASS. 운영 서비스/설정 적용 범위는 아님: docs/nginx-pending-apply-current-20261006.md.

nginx 미반영 설정 입력을 공통 메모리 초안 상태에 연결해 페이지 재진입 보존과 이탈 경고 대상으로 포함했다. generation 초기화로 로그아웃 후 이전 입력 재등록을 방지하며 임시 연결 끊김만으로 입력을 지우지 않는다. 관련 모델/컴파일/SSR 검사 25개 통과. 실제 페이지 왕복 GUI·native 이탈 팝업과 운영 수용은 별도 남아 있다: docs/nginx-pending-route-current-20261006.md.

nginx 미반영 입력의 실제 현황 페이지 왕복 복원과 로그아웃 후 재로그인 초기화 확인 완료. 368개 현재 소스 빌드, 읽기 전용 fixture 원본 보존 및 계정/탭/서버 정리 PASS. native 브라우저 이탈 팝업과 운영 권한 수용은 별도 미완료: docs/nginx-pending-route-current-20261006.md.

nginx-toggle의 조회 원본 버전 필수 검사/API 구조 검사를 추가했다. 관련 16개 검사 및 실제 격리 nginx의 오래된 전환 요청 무변경 거부·정상 비활성화/활성화·구문/reload 실패 복구 확인. sites-enabled 링크 관리 GUI 및 설치 sudo/systemd 수용은 여전히 미완료: docs/nginx-toggle-version-current-20261006.md.

nginx sites-available/sites-enabled 연결 관리 GUI 및 helper/API 구현. 파일 노드의 컨텍스트 메뉴 → 사이트 연결 팝업에서 활성화·비활성화 검토/실행, 실제 include 구분, 원본/목록/서비스 버전 검사, 변경 기록·구문/reload 실패 원복, 충돌 보존과 중단 기록 복구 API를 제공한다. 실제 격리 nginx API의 6개 검사 그룹 및 최종 372개 소스 빌드/브라우저 활성화·비활성화/실제 링크와 HTTP·포트·원본 보존/로그아웃·정리 확인. 최초 GUI 조회 잠금 충돌은 기록을 보존하고 단일 요청으로 수정 후 확인했다. 설치 sudo/systemd·강제 종료 중단 복구 GUI·전체 시스템 완료로 확대하지 않는다: docs/nginx-site-operation-current-20261006.md.

nginx 사이트 연결의 준비/링크 변경/reload 직전/reload 완료 단계에서 활성화·비활성화 각각 실제 helper SIGKILL 후 기록 기반 복구·원본 링크/HTTP/설정 보존·기록 정리 8가지 확인. namespace 복사본만 checkpoint 계측하며 원본/계측 SHA를 기록했다. 복구 팝업의 성공 안내와 실패 후 최신 상태 재조회 수정, 컴포넌트 2개/372개 현재 소스 빌드/실제 중단 복구 GUI 및 정리 확인. 설치 sudo/systemd와 다른 nginx 변경의 중단 기록 차단 검토는 별도 남음: docs/nginx-site-interruption-current-20261006.md.

nginx 중단 기록의 교차 변경 차단 구현 완료. 사이트 실제 SIGKILL 기록에서 관련 변경 19개 거부와 원본/링크/PID/HTTP 보존, 명시적 복구 및 정상 변경 재개 확인. 설정 transaction은 존재 검사 fixture로 차단 확인. 관련 26개 회귀 통과. 실제 설치 sudo/systemd 및 전체 제품 완료는 별도 남음: docs/nginx-mutation-guard-current-20261006.md.

nginx 사이트 연결 팝업 및 중단 복구 안내 9개 문구를 12개 언어 목록에 추가. 동적 nginx 설명 195개도 번역 누락 검사에 포함. 관련 27개 검사/372개 현재 소스 빌드 확인. 전체 Linux 언어 완료 및 이번 변경의 실제 브라우저 검증은 미완료: docs/nginx-site-localization-current-20261006.md.

cron 실제 예약 daemon 실행 미완료 항목을 보완. 103의 네트워크/호스트 마운트 없는 임시 컨테이너에서 앱 생성 예약 2번의 실제 분 경계 실행·환경 범위·편집 반영·비활성화 미실행 6개 확인. cron/crontab 버전/SHA 및 소스/예약 SHA 기록, 관련 33개 회귀 통과, 자체 컨테이너/이미지 정리 완료. 로컬 namespace 실패 증거는 보존하며 설치 앱 계정의 전체 연동 수용은 별도 남음: docs/cron-scheduler-isolated-current-20261006.md.

터미널 탭 숨김과 xterm 지연 compositionend 확정 사이의 마지막 한글 누락을 재현하고 수정. 원래 입력 가능한 세션의 종료 직후 확정만 보존하며 숨겨진 일반 입력/종료된 세션은 차단. 최종 조합/컴파일된 화면 13개 및 키/클립보드 회귀 9개 확인, 최종 373개 소스 빌드 PASS. 실제 OS 입력기 브라우저 확인은 별도 남음: docs/terminal-composition-tab-current-20261006.md.

nginx 사이트 연결 backend 오류 24개를 12개 언어 목록에 추가하고 runtime 오류도 번역 누락 검사에 포함. 실제 요청 검증 오류의 컴파일된 팝업 표시/이전 확인 초기화 및 관련 19개 확인, 최종 373개 소스 빌드 PASS. 전체 Linux 언어 및 실제 브라우저 검증은 별도 남음: docs/nginx-site-error-localization-current-20261006.md.

AI 로그 분석 화면의 연결/API/로그 변경 시 결과 소유권과 단일 제출 보호 보완. 소스 편집 후 이전 결과/동의 제거, 초기화 전 이전 로그 전송 거부, 늦은 응답 무시 등 실제 컴파일된 화면 5개 확인. 외부 AI 호출·키 읽기 없이 수행, 현재 373개 소스 빌드 PASS. 실제 AI API/응답 언어 및 브라우저 수용은 별도 남음: docs/ai-ui-context-current-20261006.md.

백업·복구 화면의 중복 변경 요청 및 이전 연결 응답 차단 보완. 복원 도중 새 선택 보존, 이전 검토의 연결 변경 후 제출 거부, 늦은 오류 무시 등 신규 4개와 기존 6개 검사 통과. 현재 373개 소스 빌드 성공. 실제 브라우저/설치 계정 운영 수용은 별도 남음: docs/operations-backup-ownership-current-20261006.md.

현재 소스 전체 회귀 1197개 통과(실패/취소/건너뜀 0). 최초 15개 실패 원인을 보존하고 fixture/실행 격리 및 누락된 nginx 사이트 권한 설명 4개·12개 언어 번역 수정. 최신 373개 소스 빌드 성공: docs/current-regression-20261006.md. 실제 운영 설치 및 전체 다국어 완료를 뜻하지 않는다.

위 최신 빌드의 실제 Next.js HTTP 15개 그룹 확인 완료: .runtime/verification/production-http-2026-10-06T08-07-59.396Z/result.json. 임시 서버 종료·계정/작업 폴더 정리 완료. 실제 apt/ACME/운영 DB 변경은 포함하지 않는다.

공통 RTL 구분선·텍스트 정렬·스위치 손잡이와 아랍어 트리 선택 위치 안내 수정. 실제 공통 컴포넌트 SSR fixture의 RTL 1280/640 및 LTR 640 화면·스위치 토글을 확인하고 소스 hash/측정/이미지를 보존했다. 운영 API 및 설치 앱 전체 RTL 흐름은 미완료: docs/rtl-layout-current-20261006.md.

백업 목록에서 선택한 기록의 삭제/교체 때 이전 복구 검토 숨김과 오래된 제출/응답 차단을 추가했다. 컴파일된 운영 화면 16개 회귀 통과. 실제 브라우저/운영 복원은 별도 남음: docs/operations-catalog-review-20261006.md.

로그 수동/주기 조회 응답과 표시된 로그·다운로드·AI snapshot을 시작한 API 연결에 연결했다. effect 정리 전 연결 교체에도 이전 로그/팝업을 숨긴다. 신규 3개 및 기존 운영 화면 19개 검사 통과. 외부 AI/운영 로그/실제 브라우저 수용은 별도 남음: docs/operations-log-connection-20261006.md.

현재 전체 runner는 1147 통과/24 실패(보고된 1171개)다. 사용자 이름 변경 중 linux-admin 참조와 실제 linex-admin 파일 불일치, legacy cron assertion 충돌을 보존했다. 이름을 대신 수정하지 않았다. 최신 빌드 HTTP 15개 그룹은 별도로 통과, 자체 서버/계정 정리 완료. 전체 회귀 완료로 판정하지 않는다: docs/current-regression-after-rename-20261006.md.

현재 사용자 cron 백업의 원자적 공개 및 저장 전 크기 검증 추가. 실제 자체 임시 파일 동시 쓰기/읽기와 계측 복사본 publisher SIGKILL, 기존 목록/GUI 총 12개 검사 통과. 운영 crontab/서비스 변경 없음. 이전 빌드/HTTP는 이번 변경 이전임: docs/local-backup-publication-20261006.md.

우크라이나어 패키지/파일 IDE/AI 안내 90개 추가, 총 441/1493개·1052개 영어 fallback. 언어 회귀 29개 통과; 원어민/실제 브라우저는 미완료. docs/ukrainian-ui-current-20261006.md 참조.

우크라이나어 nginx/Certbot/cron/설정·오류 145개 추가로 586/1493개, 907개 누락. 언어·SSR·카탈로그 27개/checker 통과. 원어민/추가분 실제 화면 검수는 미완료: docs/ukrainian-ui-current-20261006.md.

우크라이나어 설정/감사/DB 복구·메모리 정책 185개 추가, 총 771/1493개·722개 누락. checker 통과. 원어민/실제 화면 추가 검수는 미완료: docs/ukrainian-ui-current-20261006.md.

우크라이나어 앱/서비스/인증서·cron·권한 145개 추가, 총 916/1493개·577개 누락. checker 통과. 원어민/실제 화면 추가 검수는 미완료: docs/ukrainian-ui-current-20261006.md.

우크라이나어 검토/복구/nginx 지시어 설명 145개 추가, 총 1061/1493개·432개 누락. checker 통과, 실제 화면/원어민 검수는 별도: docs/ukrainian-ui-current-20261006.md.

MariaDB 적용 GUI의 중복 실행·이전 계획/연결/권한 확인 제출과 늦은 결과 차단. 컴파일 컴포넌트 및 기존 적용/복원 모델 15개 통과. 실제 DB/서비스/브라우저 수용은 별도: docs/mariadb-apply-ui-20261006.md.

MariaDB 11.8.6 자체 임시 Unix 소켓 서버로 현재 적용 coordinator의 실제 후보 검수·최대 연결 수 변경·설정 백업 복원·잘못된 설정 적용 전 차단·실제 기동 실패 원복과 한글 데이터 보존 5개 통과. 서버 및 임시 데이터를 정리했으며 host 서비스/DB는 변경하지 않았다. 설치 권한 helper/GUI 및 DB 내용 백업은 별도 남음: docs/mariadb-native-lifecycle-20261006.md.

MariaDB 백업/복원 GUI의 연결·main·권한 변경 전후 이전 확인/목록/결과 차단과 확인 재사용 방지 추가. 부모 disabled 전환은 동일 연결 실행의 완료를 유지한다. JSX 및 기존 설정 적용 관련 21개 통과. DB 내용 백업 기능은 이번 변경에 포함하지 않음: docs/mariadb-backup-context-20261006.md.

터미널 높이에서 상태바 26px 누락 수정. 실제 개발 GUI 1280×720 및 640×640에서 본문/상태바 경계 일치·바깥 스크롤 없음·한글 40줄 출력과 마지막 프롬프트 확인. OS IME 조합은 여전히 별도 남음: docs/terminal-height-20261007.md.

Redis 백업 목록/복원 검토/적용 화면의 이전 연결·선택·권한 확인 및 늦은 응답 차단, 확인 소비 및 중복 요청 보호 보완. 내용이 동일한 보안 객체 갱신은 목록을 불필요하게 초기화하지 않는다. 컴파일 화면·코드·복구 20개 통과. 설치 helper/native GUI 수용은 별도 남음: docs/redis-backup-context-20261007.md.

Redis 8.0.5 자체 임시 Unix 소켓 서버에서 현재 적용 coordinator의 실제 검수·maxclients 변경·설정 백업 파일 복원·잘못된 후보 적용 전 거부·실제 기동 실패 원복 및 AOF 한글 값 보존 5개 통과. 자체 서버/데이터 정리 완료. namespace/helper 격리 검사 및 전체 GUI 수용을 증명하지 않음: docs/redis-native-lifecycle-20261007.md.

한국어 우선 후속: PostgreSQL·MariaDB·Redis 설정 파서의 영어 오류를 한국어로 교체하고 잘못된 파일 내용과 UTF-8 256 KiB 초과를 구분했다. Redis 기존 행 및 새 항목의 TLS 키 비밀번호·ACL user 값도 가린다. 세 패키지 설정 파서와 실제 컴파일된 Redis 편집 컴포넌트 관련 18개 검사 통과. 코드 보기의 원문은 편집을 위해 유지하며, 이번 결과는 운영 적용 또는 전체 GUI 완료 증거가 아니다.

위 한국어 오류/Redis 입력 가림 변경을 포함한 최신 383개 소스 빌드 성공: `.runtime/verification/source-build-2026-10-06T19-55-18.888Z/result.json`. 실제 한국어 Redis GUI 격리 실행에서 기존 requirepass·TLS 키/클라이언트 키 비밀번호·ACL user 입력 가림, 새 비밀번호/일반 항목의 입력 형식 전환, 편집 코드 반영, 내용만 비우기 및 로그아웃 확인. 화면 `.runtime/verification/redis-secret-input-gui-20261007.png`. 원본 설정은 읽기 전용 fixture이며 실제 Redis 인증/운영 적용 검사가 아니다.

Redis TLS 설정 20개 전부에 한국어 설명 추가(총 49개): `docs/redis-tls-korean-help-20261007.md`. 공식 Redis 8.0.5 설정/TLS 문서에 따라 접속 방향·인증·버전·캐시 단위를 구분한다. 설명 카탈로그·컴파일 GUI·파서 9개 검사 통과. 직전 GUI/383개 빌드 증거는 이번 설명 추가 이전이며 전체 Redis 설명 완료나 TLS 기동으로 확대하지 않는다.

터미널 연결/API 교체 직후 보관된 입력·크기 조정 콜백의 이전 API 전송을 실패 검사로 재현하고 수정했다. 요청 시 현재 연결/계정·정책 허용/살아 있는 PTY 셸 상태를 확인한다. `docs/terminal-request-context-20261007.md`. 실제 OS 한글 입력기 및 연결 교체 GUI 수용 검사로 확대하지 않는다.

터미널 새 탭·시작·중지·닫기·재연결의 보관 콜백도 이전 연결 전송을 재현 후 차단했다. 연결 변경 첫 렌더에서 다른 연결의 계정 정보를 숨긴다. 정상 도구/입력 회귀 20개와 계정 표시 후속 검사 통과. Redis TLS 설명까지 포함한 현재 383개 소스 빌드 성공: `.runtime/verification/source-build-2026-10-06T20-03-17.173Z/result.json`. 실제 OS 입력기 및 연결 교체 GUI 검사는 남는다: `docs/terminal-request-context-20261007.md`.

현재 터미널 수정 포함 383개 빌드의 실제 한국어 GUI에서 기본 계정/셸·두 실제 PTY의 한글 출력 분리·탭 왕복 보존·설정 팝업·전체 너비와 외부 스크롤 없음·로그아웃 확인: `docs/terminal-controls-gui-20261007.md`. OS 입력기의 한영 전환/자모 조합 및 연결 교체 GUI는 별도 남음.

미저장 이탈 보호의 현재 빌드 IAB/Chrome 후속은 PARTIAL이다. IAB API reload 초안 보존, Chrome API reload 초안 초기화를 각각 관측했지만 양쪽 확인창은 보이지 않았다. 원인을 제품/브라우저 자동 제어 중 어느 쪽으로도 확정하지 않았다. 두 탭 원래 값 복구·로그아웃·정리 완료: `docs/package-ide-unsaved-current-20261006.md`.

미저장 보호 listener의 이전 dirty 상태 참조를 컴파일 검사로 실패 재현 후 수정했다. 현재 렌더의 상태/generation을 읽어 편집·저장 직후와 로그아웃/다음 세션을 보호한다. 관련 17개 검사 통과. Chrome 확인창 미관측 원인의 해결 증거로 확대하지 않으며 실제 이탈 확인창 검증은 남음: `docs/package-ide-unsaved-current-20261006.md`.

운영 연동 전 로컬 preflight 재확인: 현재 runtime 140개와 이전 137개 원격 이미지 계획이 다르며 예상 linux-admin 파일이 없고 linex-admin만 있다. 사용자의 직접 이름 변경 방침 때문에 자동 rename하지 않고 helper 파일명만 변경할지 질문했다. 이전 자동 검토의 원격 전송 거부/승인 대기도 유지: `docs/remote-postgresql-image-current-20261006.md`. 최근 화면 빌드는 이 확인과 독립적으로 진행한다.
# 2026-10-08 실제 PostgreSQL 서비스 경로 확인

Redis 실행 파일 신뢰 오류를 설정 기준 버전 충돌과 구분했다. 관련 private 파일/후보/정리 및 PostgreSQL 회귀 15개, 최신 runtime의 103 canonical helper native 5개, 실제 인증 HTTP 진단 전달 4개 그룹 통과. helper 전용 상태 tmpfs와 임시 fixture만 사용했으며 운영 적용은 미확인: `docs/redis-executable-error-20261008.md`.

Redis 후속은 현재 canonical root helper의 redis-code-plan 및 native lock supervisor 실제 경로에서도 5개 PASS다. 상태 경로를 전용 tmpfs로 확인한 preflight와 실행 전 강제 조건을 포함한다. 기존 설치 helper/운영 서비스 변경 없음. 실제 HTTP/GUI→helper→systemd 적용·복구 전체 검수와 구분한다: `docs/redis-remote-namespace-20261008.md`.

Redis 중첩 격리 검수 분기는 103번 전용 namespace/procfs 및 사설 실행 파일 환경에서 현재 제품 검수 경로 5개 PASS로 진전했다. Redis 7.0.15 기동·오류·인증 후보·기준 버전 충돌·정리 확인. 호스트 패키지 설치나 서비스 변경 없음. 기존 8.0.5 사설 적용/복구 증거와 구분하며 설치 GUI/systemd 수용은 여전히 남음: `docs/redis-remote-namespace-20261008.md`.

HBA 실패 검토에 테두리 없는 재검토 아이콘을 추가했다. 중단 기록부터 재조회하며 이전 입력·권한·종료된 화면과 중복 클릭을 차단한다. JSX/서비스/helper 오류 규약 19개 및 실제 인증 HTTP API 오류 전달 4개 그룹 통과. HTTP 검사의 OS 메타데이터·privileged transport는 fixture이며 운영 적용 증거가 아니다: `docs/postgresql-service-path-20261008.md`.

호스트 PID 및 /proc 읽기 승인 범위의 읽기 전용 검사에서 `/media/whitecalvin/data`가 다른 계정 소유라 서비스 식별이 거부됨을 확인했다. 거부된 경로와 소유권·권한 조건을 한국어로 표시하도록 보완했고 관련 실제 Node 검사 4개가 통과했다. 신뢰 조건이나 호스트 소유권·권한은 변경하지 않았다. 기존 서비스 검수는 미완료이며 임시 전송물은 삭제했다: `docs/postgresql-service-path-20261008.md`.


2026-10-08 추가: Redis 원본 GUI 로그인·코드 편집·검수·실제 적용·백업 복원·로그아웃 완료. 실제 서비스 100→123→100, 원본 설정 바이트 및 한글 AOF 데이터 보존. 복원 검토 Strict Mode 중복 요청 수정 및 관련 4개 회귀 검사 파일 통과. 패키지 inventory는 fixture이며 호스트 설치 검증은 아님. 상세: docs/redis-original-gui-20261008.md. 전체 상태 PARTIAL.

### 2026-10-09 사용자 Tauri 입력 확인

사용자가 Tauri 터미널의 한글 입력과 한영 전환이 정상이라고 직접 확인했다. 입력기 실사용 확인은 사용자 수동 PASS이며, 기존 표의 해당 입력 대기 항목을 해소한다. 설치 GUI 전체 수용 판정은 별도다.

### 2026-10-09 Certbot 원래 GUI 최종 발급·nginx 연동

ACME 약관과 최종 제출 승인 후 103번 eztoy.app staging의 원래 GUI에서 webroot 인증 + nginx installer 발급을 완료했다. 실제 백업 두 개·발급/배치 완료·독립 TLSv1.3 호스트명/인증서 검증과 한글 HTTP 200, 로그아웃 및 전용 자원 정리를 확인했다. nginx authenticator 새 challenge 및 실제 ACME 자식 중단/재개는 별도로 남는다. `docs/certificate-installer-original-gui-20261009.md`.

### 2026-10-09 nginx 인증 플러그인 신규 GUI 발급

전용 실제 nginx challenge 응답을 기존 공개 테스트 webroot로 전달하여 원래 GUI의 nginx 인증 플러그인 신규 staging 발급/배치를 확인했다. 새 ACME 계정·실제 challenge 1개·백업 2개·독립 TLSv1.3 검증/한글 HTTP 200·운영 파일 보존·검수 자원 정리 성공. 실제 ACME 자식 중단/재개는 별도로 남는다. `docs/certificate-nginx-auth-original-gui-20261009.md`.

### 2026-10-09 실제 ACME 중단과 GUI 재발급

전용 실제 Certbot의 challenge 생성 중 SIGTERM 정리와 자식 종료, 실패 GUI/백업 보존 및 설정 원본 hash 복구를 확인했다. 같은 GUI의 명시 재발급이 성공했고 독립 TLSv1.3·한글 HTTP 200과 운영 파일 보존/검수 자원 정리를 확인했다. 첫 전달기/SIGINT 실패 증거는 보존한다. `docs/certificate-acme-interrupted-original-gui-20261009.md`.

### 2026-10-09 설치 모드 GUI 세션 갱신

103번 자체 Docker의 현재 399개 소스 원래 GUI에서 테스트 세션을 25시간 경과 상태로 조정하고 페이지 이동 없이 만료 시간이 7일 뒤로 갱신됨을 native DB에서 확인했다. 같은 로그인·sudo 미리보기 유지, 브라우저 오류 0. 날짜 형식 관찰 오류는 별도 보존하고 세션을 다시 조정하지 않은 독립 읽기로 확인했다. 실제 며칠 경과 실사용 증거는 아니며 sudo 규칙은 미적용 상태다. `docs/installed-session-renewal-20261009.md`.

### 2026-10-09 데몬 한국어 안내·설치 모드 레이아웃

데몬 상태 한국어 표시/조회 실패 설명/접힌 원본 진단 보존. 관련 5개 검사 파일·실제 설치 모드 원래 GUI 확인, 8개 route 공통 상단 56px/바깥 스크롤 없음. 실제 서비스 제어·전체 Tauri 범위는 별도이며 최종 배포 검사 없음. `docs/daemon-korean-installed-20261009.md`.

### 2026-10-09 현재 소스 운영 빌드·HTTP

헤더 높이 통일과 데몬 한국어 안내까지 포함한 397개 소스 운영 빌드/동일 빌드 HTTP 16개 그룹 성공. 첫 종료 1/빈 로그 및 이후 quota 오류 기록 보존. 사용하지 않는 자체 이전 빌드 로그·snapshot 보존 후 폴더 정리, 새 빌드 성공. 자체 HTTP 서버·계정 정리, 배포 패키지 작업 없음. `docs/current-build-http-20261009.md`.

2026-10-09 시스템 설정: `/settings`에 AI 업체·API 방식·주소·키·모델 목록 갱신·처리 우선순위와 로그 줄 수·주기, 터미널 표시·실행 시간, 기존 보안 설정 연결을 추가했다. 로그 300줄 저장 후150줄 원복·재로딩 유지·본문 스크롤 확인. 터미널14px 새로고침 복원·실제 xterm14px·기존 팝업과 동기화 및13px 원복을 확인했다. 표시 옵션만 로컬 저장하고 명령·계정·세션·편집 파일은 제외한다. 404개 현재 소스 빌드 확인. 실제 AI 분석 사용량 해소와 설치 앱 전체 수용은 별도 미완료. `docs/system-settings.md` 및 `.runtime/verification/terminal-preferences-20261009/result.json` 참조.

## 2026-10-09 최신 디자인 운영 빌드·HTTP 확인

407개 현재 소스의 별도 운영 빌드 성공. 빌드 중 소스 변경 없음. 동일 소스 snapshot의 실제 HTTP 검수 16개 그룹 성공: 보호 페이지 11개 로그인 이동/인증 렌더링, 데몬 SSR 목록, Certbot 선택 방식과 webroot nginx 연계 미리보기, PTY 요청·완료 감사, 실제 한글·이모지 PTY/SSE 출력·종료, 생산 프로세스 재시작 세션 유지, Origin 거부, 만료 세션 로그인 이동·복귀와 로그아웃 무효화.

컴파일 증거: `.runtime/verification/source-build-2026-10-09T01-52-49.052Z/result.json`. HTTP 증거: `.runtime/verification/production-http-2026-10-09T01-53-54.755Z/result.json`. 검사용 서버는 종료했고 임시 계정/작업 폴더를 정리했습니다. 운영 변경·AI 호출·패키지 생성은 수행하지 않았습니다. 설치 Tauri 전체 GUI 직접 확인 및 실제 여러 날 경과 관측을 뜻하지 않습니다.


### 2026-10-10 최신 재설치 및 실제 설치 GUI 확인

현재 419개 소스 빌드 `5scBQAtyPE8oipQ4maEp7`, 회귀 검사 1,618개 및 HTTP 17개 그룹을 확인했다. 최신 DEB SHA-256 `7657e923af73c4355f516c4653cc008c09af55c0e87c49a4515fc735606aefdd`를 103번에 재설치했고 기존 계정·설정이 보존됐다. 서비스 active, 로그인 HTTP 200, 미인증 API 401이다.

재설치 후 실제 Tauri 창에서 로그인 유지, nginx 초기 트리/빈 설정 화면, Certbot 인증서 공개 정보 권한 부족 안내, PostgreSQL 18 설정 노드 선택 및 한국어 설명을 확인했다. 터미널은 설치 계정 whitecalvin으로 재연결됐고 실제 키 입력 `echo reinstall-ok`의 출력과 다음 프롬프트를 확인했다. 운영 설정을 변경하거나 AI 업체에 요청하지 않았다. 증거: `.runtime/verification/reinstalled-gui-20261010/result.json`. 이는 확인한 설치 GUI 흐름의 증거이며 전체 기능·전체 다국어 완료 판정은 아니다.


### 2026-10-10 공통 페이지 설명 번역 누락 수정

실제 일본어 패키지 화면에서 한국어로 남던 설명의 원인은 `pageDescriptions` 동적 목록이 번역 검사 대상에서 제외돼 있었기 때문이다. 대시보드·패키지·데몬·로그·복구·보안·감사 설명 7개를 기존 12개 카탈로그에 추가했다(각 2,216개 키). 동적 목록의 누락을 감지하는 fixture 검사를 추가했고 관련 검사 7개 및 번역 검사가 통과했다. 실제 개발 브라우저에서 일본어 대시보드와 패키지 설명 표시를 확인하고 한국어 ko-KR로 복원했다. 증거: `.runtime/verification/page-descriptions-gui-20261010/result.json`. 디자인·운영 설정 변경 및 외부 API 요청은 없으며 103번 재설치본에는 아직 이 번역 추가가 포함되지 않는다.
