## 2026-10-04 nginx 중복 입력·블록 추가 UI 정리 및103 반영

지시어 추가는 NginxBlockSettings의 설정 목록/사용자 지정 폼으로 통일하고 기존 중복 추가 폼은 블록 추가만 처리합니다. http/events/server/types/stream/mail처럼 인수가 없는 블록의 빈 값 편집기를 제거하며 location 등 인수 있는 블록의 편집기를 유지합니다. events/types/upstream의 자식 블록 추가 폼은 표시하지 않으며 다른 노드로 이동할 때 추가 폼의 접힘 상태를 분리합니다. location 인수 편집 유지/새 location 블록 구조/원본 파일 보존을 포함한 관련16 검사와 i18n/build/deb --terminal 검사 PASS. 직전 전체636 PASS는 이전 소스 기준이며 이번 전체 검사를 반복했다고 주장하지 않습니다.

개발 인증 브라우저에서 http의 추가 폼으로 server 블록을 추가해 트리 server5개를 확인하고, 실행 취소 후 전체 코드가 검증 전 원본과 정확히 동일한 것을 확인했습니다. 최종 events DOM에 빈 인수/자식 블록 추가 폼이 없음을 확인했습니다. QA 기록 정리를 위해 원본 일치 확인 뒤 끝 newline만 초안에 반영하고 초안 초기화를 클릭했으나 확인창에서 CDP mouse/focus 명령이 응답하지 않았습니다. getJsDialog도 실패했고 최종 screenshot timeout으로 CUA kernel이 reset됐습니다. 사용자에게 확인창 직접 처리를 요청했으며 완료했다고 주장하지 않습니다. 운영 /etc/nginx/nginx.conf SHA `d7be180d12cb332090cf4a0e8de780bd30e7f59fd0ffa4ad42be0e70e6bc6348`가 검증 전과 동일합니다. 운영 적용 버튼/API는 실행하지 않았습니다.

최종 deb `dist/tastedev-linux_0.1.0_amd64-nginx-clean-settings.deb` SHA `a6a583a1e81b23aafd4a81564518b8f08c7c25d2da54d8c9144dc38b813b3cc9`, package evidence `package-2026-10-04T14-50-01.926Z.json`를 승인된103 앱에 설치했습니다. 작업 없음/기존 설정4개 checksum 동일/active whitecalvin/login200/미인증 복구8건401/helper와91 runtime·manifest·BUILD_ID·root ownership 일치 검사 PASS. 설치된 GUI assets6개와 HTTP 응답4개가 검증 빌드와 일치합니다. 최초 중간 패키지 ad21e818…는 보존했으며 설치하지 않았습니다. 최종 화면 screenshot과 원격 브라우저 실제 조작은 미검증입니다.

증거 `nginx-clean-settings-delivery-20261004.json`, `nginx-clean-settings-preflight-20261004.json`, `nginx-clean-settings-install-result-20261004.json`, `nginx-clean-settings-installed-20261004.json`, `nginx-clean-settings-bundles-20261004.json`. 전체 목표 PARTIAL. 아래는 이전 단계 이력입니다.

## 2026-10-04 nginx 설정 설명·선택 컴포넌트 103 배포

개발 브라우저에서 검증한 설정 설명/블록 문맥 도움말 및32px 선택 화살표 정렬을 deb에 반영했습니다. 상태가 분리된 전체636 tests와 deb --terminal 검증 PASS. 새 패키지 `dist/tastedev-linux_0.1.0_amd64-nginx-help-ui.deb` SHA `aeb979de5acdad56be032feccabb2be6732dc8b77545758fcf3367b7bf738fa5`, package evidence `package-2026-10-04T14-35-35.594Z.json`.

승인된103 앱에 대해 서비스 active/실행 계정 whitecalvin, 진행 중 child/helper 작업 없음, 보안·service-user·systemd user override·환경 파일4개 checksum을 설치 직전 재확인했습니다. 업데이트 후4개 checksum 동일/서비스 active/login200/미인증 복구8건401/helper 및91 runtime/manifest/BUILD_ID 일치와 root ownership 검사가 통과했습니다. 새 nginx 도움말/선택 컴포넌트 JS·CSS6개 설치 hash와4개 HTTP 응답 hash가 검증 빌드와 동일합니다. 원격 readOnly=false/terminal=true를 유지했고 로컬 fileEditing 변경을 원격에 복제하지 않았습니다. 이전 deb와 증거를 보존합니다.

증거 `nginx-help-ui-delivery-20261004.json`, `nginx-help-ui-preflight-20261004.json`, `nginx-help-ui-install-result-20261004.json`, `nginx-help-ui-installed-20261004.json`, `nginx-help-ui-bundles-20261004.json`. 전체 목표 PARTIAL. 원격의 실제 로그인 브라우저 조작/운영 nginx 적용·복원/다른 패키지 운영 E2E는 이 배포 검사의 증거로 대체하지 않습니다. 아래는 이전 단계 이력입니다.

## 2026-10-04 개발 nginx 설정 설명·블록 문맥·브라우저 동기화 검증

개발8787의 기본 제공79개 지시어에 설명/공식 링크를 제공하고 FastCGI·TLS 도움말을 보완했습니다. 이후 실제 개발 /etc/nginx 파일7개를 읽어 이름만 점검하니 worker_cpu_affinity/proxy_ssl_name/allow/deny가 일반 fallback 상태여서 전용 설명을 추가했습니다. 재검사에서 활성 지시어36종의 설명 누락0/읽기 오류0을 확인했습니다. 설치된 모든 외부 모듈·다른 서버의 모든 설정을 포괄하는 증거는 아닙니다. 외부/사용자 지정 지시어는 알 수 없는 의미/기본값을 만들지 않고 모듈 문서 확인 안내를 표시합니다.

선택 블록 문맥을 도움말과 검색에 전달합니다. upstream의 keepalive_requests/time/timeout 및 resolver_timeout은 해당 모듈의 설명/링크를 사용하며 types 블록의 MIME 행에는 확장자 매핑 설명을 제공합니다. 관련20 tests, i18n check, production build PASS. 실제 로그인된 개발 브라우저에서 nginx.conf 코드에 multi_accept off를 worker_connections 앞에 추가하고768→769를 편집해 초안에 반영한 뒤 events 설정 화면의 순서/값/설명 갱신을 확인했습니다. 실행 취소 후 코드 전체가 검증 전과 정확히 동일함을 확인했습니다. 운영 적용은 실행하지 않았습니다. 증거 `.runtime/verification/nginx-help-installed-files-20261004.json`, 화면 `/tmp/tastedev-nginx-context-help.jpg`.

직전 개발 보안 변경은 readOnly=false 유지/fileEditing=true이며 다른 권한 옵션을 유지했습니다. 선택 컴포넌트는 실제32px 높이/16px 화살표/중앙 오차0 및 펼침·접힘 확인: `nginx-help-select-dev-20261004.json`. 이번 변경은 개발 소스/8787에 반영됐으며103 설치 앱은 이전 pg-all-settings deb를 유지합니다. 전체 목표 PARTIAL. 아래는 이전 단계 이력입니다.

## 2026-10-04 PostgreSQL 파일 전체 항목 GUI

현재 설치 deb SHA `fba2ae049b727dced8c9bf165d80b6d84958cc8bc16e835f03ff6e2adc5338d0`. 선택 파일의 항목과 유효한 주석 처리 항목을 순서대로 검색/편집/주석 전환/값 비우기/추가할 수 있습니다. 기존 그룹 폼과 전체 코드 초안 연결 유지. PostgreSQL18.6 공개 sample353개 및 native -C3종, 전체633 tests, build/deb PASS. 103 설정 보존 및 새 GUI 번들 SHA 일치 확인. 운영 effective settings/전체 의미 검증/자동 적용/로그인 브라우저 상호작용의 완료 증거는 아닙니다. 전체 PARTIAL. 최신 상세는 current-delivery-status.md와 pg-all-settings-delivery-20261004.json입니다. 아래는 이전 이력입니다.

## 2026-10-04 실행 계정 기본 셸 반영

현재 설치 deb SHA `46c60d207997fb84013da4565d328bd619dfaaa74126d120aaf759d8414aef11`. terminal-context/default preset/SHELL이 실제 OS 실행 계정의 셸을 따릅니다. 실제 개발 계정 PTY 재검사 및 최종 deb --terminal PASS; 최초 시작 직후 검사 실패는 원인 미분리로 기록했습니다. 기존 설정 보존/103 서비스 active와 변경된 번들 SHA 일치 확인. 전체 목표 PARTIAL. 최신 증거와 제한은 current-delivery-status.md 및 account-shell-delivery-20261004.json을 참조합니다. 추가 번역보다 목표 시스템 기능 동작을 우선합니다. 아래는 역사적 점검입니다.

# 현재 구현·검증 상태 참조 (2026-10-04)

현재 설치본·소스 변경·검증 범위는 [current-delivery-status.md](current-delivery-status.md)와 [completion-audit.md](completion-audit.md)의 최신 날짜 항목을 기준으로 확인합니다. 최신103 설치 패키지는 PostgreSQL 파일 전체 항목 GUI deb SHA `fba2ae049b727dced8c9bf165d80b6d84958cc8bc16e835f03ff6e2adc5338d0`입니다. Better Auth 세션, PTY 입력/탭 터미널, root helper 설치 및 패키지별 IDE는 아래10월2일 기록 이후 구현·검증이 진행됐습니다. 아래 표의 이전 미지원/미설치 상태를 현재 상태로 해석하지 않습니다. 전체 GUI/E2E·운영 복구 및 전체 언어 번역의 완료는 아직 입증되지 않았습니다.

다음 내용은 2026-10-02 점검 이력입니다.

# 운영 GUI 구현·검증 점검

점검일: 2026-10-02. 대상: tastedev-linux의 Next.js 운영 GUI. 기존 7개 제품의 설치 패키지 QA 합격과 별개인 개발 검증이다.

| 요구 기능 | 현재 구현 | 확인한 증거 | 운영 장비 검증 |
|---|---|---|---|
| 필수 로그인 | 사용자명/scrypt 해시, HttpOnly 쿠키, 로그인 전 화면/API 차단 | auth.test.mjs 및 최종 production 서버 HTTP: 익명 401, 로그인 200, Origin 위반 403 | 실제 사용자 계정은 지정 필요 |
| 최초 계정 설정 | account:setup CLI, 숨김 입력, 0600 해시 파일, 기존 계정 교체 보호 | 임시 PTY에서 비밀번호 출력 없음·해시 저장·0600 확인 | 실제 계정 임의 생성 없음 |
| 비밀번호 변경·세션 폐기 | 현재 비밀번호 검증, 원자적 저장, 충돌 검사, 전체 세션 폐기, 재로그인 | auth.test.mjs, 임시 계정 HTTP 변경 200/이전 쿠키 401/새 비밀번호 로그인 200, 브라우저 로그인 복귀 | 사용자 지정 비밀번호로 운영 확인 필요 |
| nginx server 블록 GUI | 프록시/정적 폼, 초안, 운영 폼 불러오기, 버전 검토, HTTPS 보존 적용, 활성 전환, 백업/복구, 검사·재로드 | server-tools 및 admin-transactions: 입력 검증, 적용 성공, 검사·reload 실패 복원, 토글 복원, stale 복구 거부 및 정상 복구, TLS 경로·redirect 보존 및 stale 편집 거부; 실제 nginx 격리 실행 8개 시나리오 PASS | helper 미설치·OS 변경 금지로 실제 적용 BLOCKED |
| Certbot·nginx 연계 | 발급, staging, 갱신 dry-run 선택, 약관/영향 확인, 작업 로그, 공개 인증서 기간 조회 | 고정 argv helper 검증, 브라우저 갱신 명령 검토, HTTP 정책 차단 | DNS/권한/운영 영향 확인 전 실제 발급·갱신 BLOCKED |
| cron GUI | 프리셋/직접 시간식, 관리 작업 목록·폼 편집, 활성/비활성, 버전 확인, 백업·복구 | cron 범위·불리언·중복·손상 블록 거부, 환경 변수·기존 작업 보존, 현재 crontab HTTP 조회 200 | 실제 crontab 변경 미실행 |
| 데몬 관리 | 고정 6개 unit, 시작/중지/재시작/reload/자동 시작, 상태 자동 조회, 로그 연결 | 고정 명령/허용 목록/정책 검사, 실제 systemctl show 조회·nginx journal 열기, HTTP operations 200 | 실제 서비스 변경 BLOCKED |
| 로그·AI 해결 도우미 | 서비스/access/error 조회·검색·자동 조회·다운로드, 설치/Certbot/터미널/콘솔 분석 | 실제 로그 조회, 마스킹·동의/서버 flag·고정 API·store:false 테스트, 클라이언트 오류 0건 | 실제 AI 응답은 기존 계정 429 제약, 운영 로그 미전송 |
| 백업/복구 | root 소유 nginx 백업, 현재 사용자 cron 백업, SHA-256·버전 비교, 복구 전 백업 | helper 복구 성공/복원/stale 검사, 로컬 경로·권한 위장 거부, 손상·symlink 파일 격리, HTTP backups 200 | 실제 운영 설정 복구 BLOCKED |
| 패키지 설치 | nginx/Certbot/Node/PostgreSQL/MariaDB/Redis 카드·검토·작업 로그 | 앱/독립 helper 고정 apt argv, 허용 목록, --no-remove/--no-upgrade, 정책 차단 | 실제 apt 설치 BLOCKED |
| 패키지 설정 IDE | 패키지별 독립 GUI, 초안 생성, 탭/탐색/검색/폴더/저장/디스크 비교, 구문 강조 | 모든 schema 필드 검증, 브라우저 PostgreSQL/MariaDB 초안 유지, 실제 격리 파일 저장·stale 거부, 테마·스크롤 정렬 | DB 조각의 시스템 자동 배포는 포함하지 않음 |
| 전체 작업 영역 터미널 | 왼쪽 패널 유지, 나머지 영역 터미널, stdout/stderr/exit/중지/이력/다운로드 | 브라우저 main 영역 x=280·뷰포트 끝까지, 실제 무해 fixture 실행/출력/종료/중복 차단/그룹 중지 | 비대화형 shell, PTY·sudo 입력 미지원 |
| 보안 옵션 | 조회 전용·기능별 허용·환경 상한·감사·sudo 생략 선택, 시스템 Node.js·helper 설치/소유권/앱 hash 확인 | UI/API 공통 capabilities, HTTP security 200·helper 미설치 표시·관리 작업 차단 | sudo 허용 여부 미확인, 설정 자동 변경 없음 |

최종 검사: 테스트 42개 PASS, Next.js production build PASS. 프로젝트명 변경 이후 Tauri cargo check PASS. Tauri 실제 GUI/배포 패키지는 미검증이다.

이 점검은 구현 및 허용된 안전 범위의 검증을 증명한다. root 파일·sudo 설정·운영 서비스·apt는 변경하지 않았다. 운영 배포 및 전체 운영 E2E는 PARTIAL이며, 실제 계정 설정과 승인된 장비에서의 helper 등록·운영 작업 검증이 필요하다. 실제 운영 영향 검사를 기능 테스트 통과로 대체하지 않는다.
