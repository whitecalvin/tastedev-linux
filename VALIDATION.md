# 개발 검증 — 2026-10-02 (Asia/Seoul)

상태: PARTIAL. Next.js 개발 검증이며 기존 제품의 설치 패키지 QA PASS가 아닙니다.

- Next.js 16.3.3 / React 19.2.8 / 실행 Node.js v24.21.0
- npm 의존성 설치 완료. 디스크 심볼릭 링크 제한으로 `.npmrc`의 bin-links=false 및 직접 실행 스크립트 사용.
- production build PASS (`npm run build`, webpack).
- 보안 테스트 PASS: 인증 필수, 고정 패키지 목록, 중복/명령 주입 차단, JSON 크기 제한, 외부 출처 차단, 정상 Host/Origin 허용, 조회 모드 설치 차단.
- IAB 브라우저 http://127.0.0.1:8791 에서 연결 → 실제 상태 조회 → Node.js 선택 → 명령 검토 → 영향 확인 후에도 조회 모드 설치 버튼 비활성 → 취소 흐름 확인.
- 최종 브라우저 error/warn 로그: 없음.
- 화면 증거: preview.jpg. 장비명과 설치 버전이 포함된 로컬 자료이며 외부 게시하지 않음.
- 실제 apt 설치 및 root 실행, 설치 진행/실패/복구 E2E는 미수행. 승인된 격리 장비와 관리자 실행 환경 필요.
- 인증서 발급, nginx 설정, 원격 접속, 자동 갱신, 전체 시스템 upgrade, sudo/운영 서비스 변경은 미수행.
- source commit 및 배포 패키지 hash는 미확인. 추정하지 않음.

참고: 기본 포트 8787은 사용 중이므로 검증 서버만 8791로 실행. 검증 토큰은 테스트 전용이며 설치 모드는 비활성.

## 운영환경 기능 추가 검증

- 사용자 UI 컴포넌트, 체크박스/라벨 중앙 정렬, 테마, 터미널/코드 작성기, nginx·Certbot·cron·서비스·로그·백업/복구·보안 화면 구현.
- Next.js production build PASS.
- 보안/입력 검증 테스트 15개 PASS. 전용 sudo helper의 독립 입력 검증, 임의 액션/명령 차단, 기본 조회 모드의 모든 운영 변경 API 차단 포함.
- Tauri cargo check PASS (Cargo.lock 고정, /tmp/linux-tauri-target). 작업 디스크의 실행 파일 잠금과 아이콘 누락을 수정한 후 검사 완료. GUI 실제 실행/배포 패키지 빌드는 미수행.
- 최종 브라우저 신규 탭에서 관리자 연결, 보안 설정 조회, nginx server 블록 명령 검토, 밝은 테마 변경, 서비스 실제 상태 조회, Certbot staging 명령 검토 확인.
- 서비스 조회 시 nginx.service active/running, cron.service active/running, certbot.timer active/waiting 상태를 관찰했다. 기존 장비 상태이며 이 작업에서 활성화하거나 변경하지 않았다.
- sudo helper 설치/NOPASSWD 등록, 운영 설정 적용/복구, 실제 인증서 발급, cron 변경, 서비스 제어, apt 설치는 미수행. 실제 운영 변경 검증은 BLOCKED(승인된 격리 장비 및 OS 권한 설정 필요).
- OS 비밀번호 입력, sudo 인증 캐시 설정, polkit 인증 통합은 미구현 옵션으로 docs/security-options.md에 구분.
- overall PARTIAL 유지.
- 최종 cron GUI에서 비활성 작업 시간식/명령 미리보기 PASS. crontab 저장은 하지 않음.
- 실제 렌더링 체크박스/라벨 중심선 차이: 모두 0px. 카드 3개, cron 영향 확인, 서비스 영향 확인, 설치 영향 확인 포함.
- 최종 브라우저 warn/error 로그 없음. 화면 증거 preview-operations.jpg(조회 모드, 밝은 테마).

## 운영 옵션 연계 추가 검증

- UI와 API의 보안 정책 판단 통합, 조회 전용에서 운영 변경 버튼 비활성화.
- nginx 관리 설정 조회/활성 전환 및 공개 인증서 기간 조회 구현.
- helper 활성 전환 입력 검증 포함 테스트 17개 PASS, Next.js production build PASS.
- 실제 nginx 전환/reload 및 인증서 발급은 미수행이며 전체 상태는 PARTIAL 유지.

## GUI IDE·데이터베이스·AI 연계 (2026-10-02)

- 6개 패키지 설치 카드, 패키지별 설정 폼→IDE 초안 생성, 여러 파일 탭/검색/Ctrl+S/미저장 표시, 도구 전환 시 편집 내용 유지 구현.
- DB 데몬 상태/로그 및 enable/disable 포함 고정 systemd 작업 구현. OS 변경은 미수행.
- 인증 API에 AI 상태/마스킹 미리보기/분석을 연결. 서버 키만 사용, 로그 전송 동의·요청 제한·타임아웃 적용. 제안 자동 실행 없음.
- 테스트 25개 PASS 및 production build PASS. 실제 파일 fixture 저장/재열기·외부 변경 충돌 차단 검사 포함. fixture는 새 /tmp/linux-editor-check-\* 폴더이며 기존 파일 변경 없음.
- 브라우저에서 PostgreSQL/Redis 초안 생성, 여러 탭 및 도구 전환 후 코드 유지, 조회 전용 저장 차단을 확인.
- 실제 OpenAI 연결은 테스트용 합성 오류 로그 1건으로 시도했으며 429 응답. 화면의 한도·크레딧 안내 확인. 모델 분석 성공은 BLOCKED(제공자 크레딧/요청 제한 확인 필요). 운영 로그는 전송하지 않음.
- Tauri 컴파일은 이전 PASS 유지, GUI 실행/배포 패키지 및 운영 설정 적용 E2E는 미검증. 전체 상태 PARTIAL.

- 최종 브라우저 검증: 패키지 카드→해당 환경 설정 IDE 선택, PostgreSQL/MariaDB 초안 생성 PASS. 브라우저 warn/error 0건. 390px viewport에서 가로 넘침 없음(문서/뷰포트 375px 동일). 최종 클라이언트 번들 API 키 포함 검사 PASS.

## 실제 관리자 화면 참고 구조 변경

- 인증된 admin.tastedev.net 대시보드의 상단 바·아이콘 레일·메뉴 트리·요약 지표·표·하단 상태 바를 직접 확인하고 LINUX 작업 화면에 반영. 참고 사이트의 운영 데이터 변경 없음.
- 메뉴별 화면 표시와 검색 다이얼로그, Ctrl+K 단축키 구현. 각 작업 컴포넌트는 유지하여 메뉴 전환 시 IDE 편집 탭 보존.
- production build PASS. 브라우저에서 대시보드→IDE→대시보드→화면 검색→IDE 이동 후 PostgreSQL 초안 유지 확인. warn/error 0건.

## 패키지 전용 GUI·터미널 메뉴

- GUI IDE에 패키지별 설정 메뉴와 독립 입력 상태 추가. nginx 제공 방식, Certbot 갱신 테스트, Node 환경·메모리, PostgreSQL 메모리·로그, MariaDB 버퍼 풀·느린 쿼리, Redis 제거 정책·AOF 설정 생성. 운영 자동 적용 없음.
- 왼쪽 터미널 메뉴에서 명령 실행 화면으로 직접 진입 PASS. 보안 정책에 따른 실행 차단 설명 제공.
- PostgreSQL 공유 버퍼 256MB 설정 생성과 패키지 전환 후 입력 유지 브라우저 검증 PASS. 테스트 26개 PASS, production build PASS.

## 필수 로그인

- 사용자명과 scrypt 비밀번호 해시 기반 로그인. 관리 API 전체 쿠키 세션 필수, 기존 Bearer 인증 차단. 로그인 전 관리 화면 숨김.
- HttpOnly / SameSite=Strict, HTTPS Secure 옵션, 30분 미사용·8시간 절대 만료, 서버 메모리 세션·로그아웃 폐기, 로그인 10회/분 제한.
- 테스트 27개 PASS, production build PASS. 임시 localhost:8792 테스트 계정 HTTP 검증: 익명 401, 잘못된 비밀번호 401, 다른 Origin 403, 로그인 200, 인증 상태 조회 200, 로그아웃 200, 폐기된 쿠키 401.
- 테스트 서버 종료. 실제 관리자 비밀번호 임의 설정 없음. .env.local의 사용자명·비밀번호 해시 설정 전에는 관리 기능 사용 불가.
- 운영 서비스 변경 및 실제 설치 검증 없음. 기존 전체 상태 PARTIAL 유지.

## 계정·운영·IDE 완성도 보완 (2026-10-02)

- 최초 관리자 계정 설정 CLI 추가: npm run account:setup. 비밀번호 입력 숨김, scrypt 해시만 .runtime/auth.json에 0600 저장, 기존 API 키 파일 보존. 계정 파일이 환경 변수보다 우선.
- 보안 화면 비밀번호 변경 폼, 현재 비밀번호 검증, 변경 직렬화·충돌 확인, 모든 세션 폐기. 다른 세션에서 API 요청 시 로그인 화면 복귀 브라우저 PASS.
- 임시 localhost:8792 계정 HTTP 검증 PASS: 현재 비밀번호 오입력 401, 변경 200, 이전 쿠키 401, 이전 비밀번호 401, 새 비밀번호 로그인 및 상태 조회 200. 실제 계정 변경 없음.
- 데몬 화면 진입 시 자동 상태 조회, 서비스별 로그 바로 열기, 로그 다운로드. 메뉴를 벗어나면 로그 자동 조회 중단. 실제 상태 조회 및 nginx journal 열기 브라우저 PASS, 서비스 변경 없음.
- cron 관리 블록 목록·폼 편집 연결. 중복·손상 블록 제외 및 덮어쓰기 방지. 기존 환경 변수·명령 문자열 보존 parser 검증 PASS. 실제 crontab 변경 없음.
- IDE 확장자별 기본 구문 강조, 밝은/어두운 테마, 줄 번호·강조층·입력 스크롤 동기화. 37줄 JS 테스트 초안으로 input/gutter/syntax scrollTop=440 일치, 원문과 표시 텍스트 일치 브라우저 PASS. warn/error 0건. 테스트 코드는 메모리 초안만, 디스크 저장 없음.
- 터미널 실제 무해 fixture 명령으로 stdout/stderr/exit, 중복 실행 차단, 프로세스 그룹 중지 PASS. API_KEY 환경 변수 전달 차단 보완.
- 테스트 31개 PASS, production build PASS, 이름 변경 이후 cargo check --offline --locked PASS.
- 실제 관리자 계정은 사용자 지정 필요. 실제 패키지 설치·nginx 적용·인증서 발급·cron 변경·서비스 제어·복구는 권한/운영 영향 제약으로 미실행. AI 실제 응답은 기존 429 제약 유지. Tauri GUI 실행/배포 패키지 미검증. 전체 운영 E2E 상태 PARTIAL 유지.
- 최초 계정 설정 CLI를 실제 PTY로 임시 계정 입력하여 확인: 비밀번호가 터미널 출력에 노출되지 않음, scrypt 해시 저장, 파일 권한 0600 PASS. 기존 계정은 --replace 없이 교체하지 않도록 보호.

## 기능별 완료 점검 및 보완

- 기능별 소스·검증·운영 제한을 docs/implementation-audit.md에 기록.
- HTTPS 관리에서 발급/staging와 기존 전체 인증서 갱신 dry-run 선택·명령 검토·확인·실행 경로 연결. API 및 독립 root helper에서 작업 유형을 검증. 실제 Certbot 실행 없음.
- nginx 적용/토글 실패 복원, 정상 백업 복구 및 stale 버전 거부, 설치·데몬 고정 argv를 in-memory 파일/프로세스 fixture로 검증. 실제 /etc 및 systemctl 변경 없음.
- cron 변경 시 활성 옵션 불리언 검증, 기존 작업·환경 보존, 손상 블록 교체 거부.
- 로컬 백업은 current-user cron만 허용, id/hash/시각/크기/regular file/symlink 확인. 임의 파일 경로 및 privileged 위장 거부. 손상 항목과 helper 조회 실패가 정상 로컬 목록을 막지 않음.
- helper root 소유권·부모 경로·실행 비트·앱 source SHA-256 일치를 확인. 미설치·구버전 helper면 관리자 작업 차단, sudo 허용은 미확인으로 명시.
- 설치/인증서/터미널 출력에 AI 로그 분석 연결. 자동 전송 없음.
- 최종 테스트 40개 PASS, production build PASS. 최종 임시 production HTTP: 로그인·회전·로그아웃, 관리 조회 9개 status/security/operations/nginx/nginx-live/certificates/cron/backups/files 200, 비로그인·폐기 쿠키 401, Origin 위반 403, 갱신 명령 검토 200·조회 전용 실행 403 PASS.
- 브라우저 갱신 dry-run 검토, 실행 차단, helper 미설치 안내 확인. warn/error 0건. 증거 preview-certbot-renewal.jpg / preview-helper-readiness.jpg.
- 운영 변경 검증은 AGENTS.md의 sudo/운영 서비스 변경 금지 및 helper 미설치로 BLOCKED. 전체 운영 E2E PARTIAL 유지.
- 최종 클라이언트 정적 번들 21개 자산에서 실제 API 키 포함 여부 내부 검사 PASS. 키 값 출력 없음. 임시 계정 서버 종료, 최종 미리보기 localhost:8791 재시작 완료.

- 추가 점검: Certbot HTTPS 적용 후 GUI 편집이 SSL 설정을 덮어쓰던 위험 수정. 운영 블록을 폼으로 불러오고 version 필수 검사. HTTPS는 location의 proxy/static 설정만 변경하며 인증서 경로·redirect·listen 보존. API 전체 설정 검토와 root helper 독립 검사 일치, stale 버전·HTTPS 포트 변경·중첩 location 거부 테스트 PASS. 실제 운영 파일 변경 없음. 최신 테스트 42개 PASS.

## 실제 nginx 격리 검증 (2026-10-02)

`node scripts/verification/nginx-isolated.mjs` PASS: 실제 nginx를 사용자·PID·네트워크 namespace에서 실행하여 설정 적용/재로드, 버전 확인 편집, 백업 복원, 비활성/활성 전환, 문법 오류 복원, HTTPS 인증서·리다이렉트 보존, 오래된 HTTPS 편집 거부, 재로드 실패 복원을 확인했다. namespace UID 0은 호스트 UID 1000에만 매핑된다. 호스트 운영 경로는 읽기 전용이고 설정·인증서는 임시 fixture이며 검증 후 제거된다. 증거: `.runtime/verification/nginx-isolated-2026-10-02T02-23-59.952Z/result.json` (실행 바이너리/helper SHA-256 포함). 이 결과는 실제 운영 서버 변경이나 Certbot 발급 검증을 의미하지 않는다. 시스템 `/usr/bin/node`가 없는 현재 장비에서는 관리자 helper 실행을 차단하고 선행 설치 안내를 표시한다.

## 경로 페이지 및 로그인 화면 분리 (2026-10-02)

Next.js App Router의 `/overview`, `/packages`, `/server-settings`, `/daemon`, `/ide`, `/terminal`, `/security`로 분리했다. `/`는 `/overview`로 이동하고, 보호된 route group layout은 세션이 없으면 `/login`으로 이동시킨다. `/login`은 관리 메뉴 없이 별도로 렌더링하며 성공 시 관리 화면으로 이동한다. API 401·로그아웃·비밀번호 변경 이후에도 `/login`으로 이동한다. 카드의 패키지 설정 링크는 `/ide?package=…`를 사용한다. hashchange·location.hash·`href="#…"` 화면 전환을 제거했다. 선택된 기능만 마운트한다.

Production build PASS. 임시 계정 서버에서 7개 경로의 익명 307→/login, 로그인 후 200, hash 링크 없음, 로그아웃 후 보호 경로 307을 검증했다. 실제 계정은 생성·변경하지 않았다. 로그인 화면 브라우저 확인 및 캡처: `.runtime/verification/login-routes-redesign.png`.

## 테마·언어·Debian 배포 구성 (2026-10-02)

테마를 해/달 아이콘 toggle로 변경했고 브라우저에서 dark/light 전환을 확인했다. 언어 context, 번역 JSON, 브라우저 언어 감지, 저장·복원, glibc SUPPORTED 기반 321개 locale 목록, RTL 방향과 Intl 유틸리티를 추가했다. 영어 로그인 화면과 일본어 선택·새로고침 유지 확인. 영어 리소스는 UI 문구 및 주요 오류를 포함하고 일본어·중국어는 주요 화면·공통 문구를 포함한다. 나머지는 영어 fallback이다. 모든 Linux 언어의 전체 번역 완료가 아니며 미번역 오류/프로필 문구가 남을 수 있다. 테스트 43개 PASS 및 production build PASS.

`dist/tastedev-linux_0.1.0_amd64.deb` 생성: SHA-256 `88bb2eb421ffef9835c02ef6b7e9800d21aab642cf790cfac0820541319241fd`. native sharp/libvips가 포함되므로 amd64 전용이다. 패키지 내용 2135개 파일 검증, .env 및 .runtime 미포함, 설정된 API 키 문자열이 패키지 파일에 없는지 확인 PASS. 계정 CLI·systemd 서비스는 같은 `/var/lib/tastedev-linux`를 사용하며 서비스는 localhost에만 bind한다. 실제 설치·postinst·사용자 생성·systemd 변경은 실행하지 않았다. 패키지를 임시 폴더에 추출한 standalone 서버에서 `/login` 200과 `sudo tastedev-linux account setup` 안내를 확인했다. 포함된 setup 스크립트는 임시 PTY에서 synthetic 계정 생성, 비밀번호 출력 없음, 해시 저장 및 파일 0600을 확인했다. runuser wrapper의 실제 설치 환경 E2E는 미검증이다. 임시 서버·계정·추출 파일은 제거했다. APT 저장소 게시와 apt install 운영 검증은 미실행이다.

화면 증거: `.runtime/verification/package-login-theme-language.png`.

## 후속 보완 (2026-10-02)

언어 선택은 검색 가능한 dialog로 변경했다. en-GB 등 지역 locale이 유지되고 번역은 기본 언어 리소스를 재사용한다. 브라우저에서 en-GB 검색·선택·새로고침 후 유지와 영어 로그인 화면을 확인했다. 패키지 설정 설명·필드·옵션의 영어 리소스를 추가하고 날짜와 새 콘솔 이벤트의 표시 locale을 적용했다. 브라우저 확인 후 원래 한국어/밝은 테마를 복원했다. 화면: `.runtime/verification/language-search-regions.png`.

Debian 설치 helper는 root 소유 `/usr/lib/tastedev-linux/scripts/admin/linux-admin`과 root 소유 `admin-helper.sha256`을 검사한다. source 모드 기존 경로는 유지한다. manifest 불일치/쓰기 권한 위반 거부 테스트를 추가했다. 패키지 모든 일반 파일은 0644, 디렉터리는 0755, CLI/helper/maintainer scripts만 0755로 정규화했다. 추출 파일 2137개의 group/world 쓰기 차단·helper 실행 비트·manifest 일치 검증 PASS. 테스트 44개 PASS, production build PASS. 실제 설치와 sudoers 변경은 실행하지 않았다. 최신 .deb SHA-256: `d18ec47f386dcd4910594a8665171461c22e64465d7ba64af6bb0dca7c17dfa4`. 앞선 패키지 SHA는 이전 빌드의 기록이다. 전 언어 완전 번역·실제 설치 E2E는 여전히 미완료다.

## 국기·추가 번역·재현 가능한 패키지 검사 (2026-10-02)

언어 버튼과 검색 목록에 지역 기반 Unicode 국기를 추가했다. Intl.Locale의 명시적 지역 또는 기본 지역을 사용하며 지역 코드가 없거나 잘못되면 지구 아이콘으로 대체한다. ko-KR/en-GB/en-US/ja/world/invalid 테스트 PASS. 브라우저에서 영국 국기 표시, 스페인어 로그인 제목·스페인 국기 전환을 확인하고 기존 한국어 선택을 복원했다. 화면 `.runtime/verification/language-flags.png`. 스페인어·프랑스어·독일어 각각 주요 로그인/메뉴/공통 문구 74개를 추가했으며 나머지 문구는 영어 fallback이다. 전 언어 완전 번역은 미완료다.

`npm run package:verify`를 추가하고 실제 생성한 .deb에 대해 metadata, private development artifacts 제외, 파일 권한, symlink 경계, helper hash, CLI/service 계정 경로 일치, localhost bind, checksum을 검사했다. 2137 파일 PASS. 테스트 46개 PASS, production build PASS. 최신 패키지 SHA-256 `ab936d1653137086abf79d22add0669314a3d9d5dac2490118f96b047c73a48c`. 실제 설치·운영 서비스·sudo 설정은 변경하지 않았다.

## IDE 세션 초안과 로그인 복귀 (2026-10-02)

루트 DraftProvider에서 editor 탭·현재 탭·패키지 종류·패키지별 값·초안 번호를 브라우저 메모리로 유지한다. 페이지 이동에서 유지하지만 localStorage/sessionStorage에는 파일 내용을 기록하지 않는다. 새로고침 시 소멸하며 미저장 파일이 있으면 beforeunload 경고를 표시한다. 로그아웃·비밀번호 변경·API 401·로그인 페이지 진입 시 초기화한다. 세션 generation이 바뀌면 이전 세션의 늦은 async setter를 무시한다.

각 보호 페이지가 서버 세션을 검사하고 next 경로를 보존해 로그인으로 이동한다. IDE의 허용된 package 선택을 보존하며 외부 URL, protocol-relative URL, 허용되지 않은 경로는 /overview로 제한한다.

브라우저 synthetic 계정: /ide?package=redis → 로그인 → 원래 Redis IDE 복귀 확인; Redis 포트 6381 및 synthetic 코드 초안 작성 → /packages → /ide 이동 후 값·파일 내용·미저장 표시 유지 확인; 로그아웃·재로그인 후 tab 없음/기본 nginx 확인. 실제 파일·운영 설정은 저장하지 않았다. 임시 계정 서버를 종료·정리했다. 증거 `.runtime/verification/ide-retained-route-draft.png`. 테스트 48개 PASS, production build PASS.

## 터미널 세션과 동시 파일 저장 (2026-10-02)

터미널 명령 입력·이력·작업·콘솔 이벤트를 기존 메모리 DraftProvider로 이동했다. 라우트 이동에서 유지하며 로그인/로그아웃 등 세션 초기화 시 삭제한다. 실제 브라우저 터미널 실행 검사는 이번 변경에서 수행하지 않았다.

동일 파일의 서버 내 동시 저장을 잠금으로 거부한다. 열린 descriptor로 기존 내용을 읽고 경로 inode를 검사하며, 읽기 후 쓰기 위치를 0으로 지정해 짧은 내용 저장 시 앞부분 공백이나 이전 내용 잔여가 생기지 않게 했다. Ctrl+S 저장 중복 요청과 파일 열기 중복 탭을 방지했다. 외부 프로세스의 모든 파일 변경을 원자적으로 차단하는 OS 잠금은 아니다. 임시 파일에서 서로 다른 대용량 내용의 동시 저장: 완전한 한 요청만 성공, 다른 요청 409, 후속 짧은 내용 저장 일치 확인 PASS.

테스트 49개 PASS, production build PASS, package:verify 2137개 파일 PASS. 최신 .deb SHA-256: a2629369a79d1631f6835f3f4b0d27c5f8665891c6b565daa84e7c6747568b58. localhost 8791 미리보기 재시작. 실제 패키지 설치·sudo·운영 서비스 변경은 수행하지 않았으며 전체 운영 E2E는 PARTIAL이다.

## nginx 설정 트리 GUI (2026-10-02)

로그인 후 GET nginx-tree는 고정 /etc/nginx/nginx.conf와 conf.d의 .conf/.conf.disabled 파일만 조회한다. 숨김·심볼릭 링크·256KB 초과 파일을 제외하며 파일별 오류를 표시한다. include 경로를 임의로 따라가지 않는다. 표시용 파서는 주석·따옴표·이스케이프를 보존하고 events/http/server/location 등 중첩 블록과 directive 노드를 제공한다. 실제 문법 검증은 기존 적용 단계 nginx -t를 유지한다.

왼쪽 파일/블록 트리를 펼치고 노드를 선택하면 오른쪽 속성·행 번호·원문 조회를 제공한다. 활성 관리 server 파일은 기존 안전한 GUI 편집을 오른쪽에 연결했다. nginx.conf 및 외부 설정의 변경 GUI는 아직 읽기 전용이다. 운영 설정을 변경하지 않고 실제 서버 파일 조회, http 선택·속성 표시·접기 동작을 임시 로그인 브라우저에서 확인했다. 화면 .runtime/verification/nginx-config-tree.png. 테스트 50개 PASS, production build PASS.

최종 패키지 검증 PASS (2137 파일), SHA-256 c2e35ac12645b64bba057da28179a6f9cc1310a39a63d6ea920abd3790742029. localhost 8791에 최신 빌드를 반영했다. 임시 계정 서버와 브라우저 탭은 종료했다.

## nginx 노드 초안 편집 (2026-10-02)

트리 directive 선택 → GUI 값 수정 → 초안 반영 → 원문 검토/다운로드를 연결했다. 원문 offset으로 한 항목만 교체하며 주변 주석과 블록을 보존한다. 구조 문자·줄바꿈과 미완료 따옴표 입력은 거부한다. 이 파서는 표시/초안용이며 실제 nginx 문법 검증을 대체하지 않는다. 운영 파일은 쓰지 않는다. 새로고침 시 소멸하는 메모리 초안으로 페이지 이동 후 유지하고 로그아웃 시 초기화한다. 미저장 초안은 beforeunload 경고 대상이며 재조회 시 원본 변경을 알린다. 기존 관리 server GUI 적용은 별도 흐름이며 이 일반 directive 초안을 직접 적용하지 않는다.

브라우저 임시 계정에서 worker_connections 768 → 초안 1024 → 패키지 화면 → 설정 화면 재조회 후 1024 유지 확인. 호스트 nginx.conf 값은 768 그대로 확인했다. 증거 .runtime/verification/nginx-directive-draft.png. 전체 테스트 51개 PASS, 파서/초안 관련 4개 재검사 PASS, production build PASS. 패키지 SHA-256 3f4792bf2756aa0c2540f32c8a572df1af21aba839ce67570ae1bf9c90008729. 임시 로그인 서버/탭 종료, localhost 8791 최신 빌드 반영. 실제 설치·운영 변경은 수행하지 않았다.

## nginx 설정별 컨트롤과 변경 비교 (2026-10-02)

on/off directive를 Switch로, server_tokens를 Dropdown으로, worker_connections를 범위 검증하는 숫자 입력으로 제공한다. access_log의 off/파일 경로는 텍스트로 유지한다. 원본과 초안의 공통 앞/뒤 줄을 제외한 변경 구간을 나란히 보여준다. 실제 nginx 문법 검증이나 운영 반영을 대체하지 않는다.

브라우저 임시 로그인에서 gzip on → 스위치 off → 초안 반영 후 gzip off 트리/제목 및 원본 on/초안 off 비교를 확인했다. 운영 파일 변경은 수행하지 않았다. 증거 .runtime/verification/nginx-switch-comparison.png. 전체 테스트 53개 PASS, 최종 컨트롤/비교 관련 2개 재검사 PASS, production build PASS, .deb 2137 파일 검증 PASS. 최신 SHA-256 dfee39c7a9e6e30375a21a65a28cdb347f5df98f780856938c231ae869f8eb64. 임시 서버/탭 종료. 등록된 실제 사용자 계정은 없음(사용자명과 configured 여부만 조회; 비밀번호/해시 출력 없음).

## nginx 트리 검색 (2026-10-02)

파일명·블록·directive 값 검색을 추가했다. 일치하는 하위 노드와 상위 블록을 보존하며 원문과 노드 ID를 변경하지 않는다. 검색어는 메모리에서 페이지 이동 동안 유지한다. 전체 테스트 54개 PASS, production build PASS, .deb 2137 파일 검증 PASS. 최신 SHA-256 dee67361ff2946b491e69dd436fe5d7e7316c64e1ac7ed4dca3c3ef3414e17bb. 이번 검색 UI의 브라우저 검증은 미실시. localhost 8791 반영. 실제 계정 생성이나 운영 변경 없음.

## 패키지 검색·필터와 테스트 격리 (2026-10-02)

패키지 이름·ID·apt 패키지명 검색 및 전체/설치/미설치/선택 필터를 추가했다. 상태 미확인 항목을 미설치로 추정하지 않고 필터 변경 시 기존 선택을 유지한다. 등록된 실제 계정이 테스트 로그인보다 우선되어 전체 beforeEach가 실패하는 문제를 발견했다. run-tests.mjs에서 계정·설정·workspace를 실행별 임시 디렉터리로 격리하고 종료 후 정리하도록 수정했다. 백업 catalog subprocess도 자체 fixture state 경로를 명시했다. 실제 사용자 계정은 변경하지 않았다. 최종 테스트 55개 PASS, production build PASS. localhost 8791 최신 빌드 반영. 이번 검색/필터 UI는 브라우저 검증 미실시. .deb는 이번 변경 후 재생성하지 않았다.

## 운영 화면 입력 유지 (2026-10-02)

운영 탭·nginx 폼·Certbot 작업 유형/이메일/staging/작업 기록·cron 입력을 세션 메모리 DraftProvider에 연결했다. 페이지 이동 후 입력과 실행 중 작업을 다시 확인할 수 있다. 검토 preview·적용 확인·ACME 동의·상태 조회 결과는 유지하지 않아 돌아온 뒤 다시 검토해야 한다. 로그아웃/세션 만료 시 기존 clear 동작으로 초기화된다. 브라우저 임시 계정에서 cron 이름 route-draft-check와 /usr/bin/true 입력 → 확인 체크 → packages → server-settings: 입력 유지, cron 탭 유지, 확인 체크 해제 확인 PASS. 실제 crontab/운영 파일/인증서 변경 없음. 증거 .runtime/verification/operations-retained-draft.png. 실제 Certbot 작업의 페이지 복귀 폴링 E2E는 미실시.

테스트 55개 PASS, production build PASS, 최신 .deb 2137 파일 검증 PASS. SHA-256 2b6d0f01884243b3c160f15dc1842c06b8e03864c132146a4b21ea205c78faa7. 최신 패키지는 앞선 IDE/터미널 전체 영역 및 패키지 필터 변경을 포함한다. localhost 8791 미리보기 반영. 전체 운영 E2E는 PARTIAL이다.

## nginx 초안 항목 추가·삭제 (2026-10-03 KST)

파일 또는 블록 선택 후 directive 이름/값을 입력해 초안에 추가하고 개별 directive를 초안에서 제거할 수 있다. 파서가 중첩 블록 닫는 위치를 기록해 선택한 블록에 삽입한다. 구조 문자 삽입과 블록 삭제 요청을 거부하고 주석을 보존한다. context 유효성·실제 nginx 문법은 별도 검증이 필요하며 운영 파일에는 쓰지 않는다. 브라우저 임시 계정에서 http에 client_max_body_size 10m 추가 → 검색 → 비교 → 해당 directive 삭제 후 검색 결과 없음 확인 PASS. 증거 .runtime/verification/nginx-added-directive.png. 실제 nginx 파일·운영 서비스 변경 없음. 전체 테스트 56개 PASS, production build PASS, .deb 2137 파일 검증 PASS. 최신 SHA-256 fa595802e8c99702f3bff327c20b9286e46861bb3b6bc279320a7cff06f8bc46. localhost 8791 최신 빌드 반영. 임시 계정 서버/탭 종료. 전체 운영 E2E는 PARTIAL이다.

## nginx 초안 실행 취소·다시 실행 (2026-10-03 KST)

값 편집과 directive 추가·삭제에 파일별 실행 취소/다시 실행을 연결했다. 최근 20개 상태를 세션 메모리에 유지하며 실행 취소 후 새 편집 시 다시 실행 기록을 비운다. 원본 baseline을 보존하고 이동 후 노드 선택을 초기화해 구조 변경 이전 ID를 사용하지 않도록 했다. 테스트 57개 PASS, production build PASS, .deb 2137 파일 검증 PASS. SHA-256 688364a4140436303e1e551c231ec9e887f3751ddaa600dce944f20128b86d5e. 이번 Undo/Redo UI의 브라우저 검증은 미실시. 운영 설정 변경 및 패키지 설치 없음. 전체 운영 E2E는 PARTIAL이다.

## nginx 블록 노드 초안 생성 (2026-10-03 KST)

트리에서 파일/블록을 선택한 뒤 노드 종류를 설정 항목 또는 설정 블록으로 선택할 수 있다. server와 location /api 같은 중첩 블록을 빈 블록으로 생성하고 기존 편집 이력에 포함한다. 이름과 인자에 구조 문자 삽입을 거부하며 기존 주석을 보존한다. 실행 이력의 없는 상태/알 수 없는 방향 요청은 변경하지 않도록 보완했다. 테스트 58개 PASS. 실제 nginx context 검증/운영 적용은 별도이며 브라우저 검증은 미실시. 이번 변경 이후 .deb는 재생성하지 않았다.

## nginx 블록 인자 편집 (2026-10-03 KST)

블록 선택 시 설정 값 입력란에서 location 경로/정규식 등 인자를 수정할 수 있도록 확장했다. 블록의 여는 중괄호 위치를 파서에서 기록하며 자식 설정과 뒤에 오는 블록을 보존한다. 수정은 기존 초안 이력에 기록한다. 임의 구조 문자 삽입 및 directive를 블록으로 수정하는 요청을 거부한다. 테스트 59개 PASS. 이번 UI 브라우저 검증은 미실시이며 실제 nginx context 검사와 운영 적용은 별도다. .deb는 이번 변경 후 재생성하지 않았다.

## 블록 편집 브라우저 검증 및 들여쓰기 수정 (2026-10-03 KST)

운영 변경 비활성 임시 계정 서버에서 nginx.conf → http에 server 블록 추가 → server에 location /draft-api 추가 → location ~ ^/draft-api로 수정 → 실행 취소로 원래 경로 복원 → 다시 실행으로 정규식 복원 확인 PASS. 로그아웃 및 임시 탭/서버 종료. 증거 .runtime/verification/nginx-block-history.png. 검증 중 중첩 추가 시 닫는 중괄호 들여쓰기 및 불필요한 빈 줄 문제를 발견해 삽입 위치를 닫는 줄의 시작으로 보정했다. 들여쓰기 회귀 테스트 포함 60개 PASS. 사진은 들여쓰기 수정 전 UI 흐름의 증거다. 실제 운영 설정 변경 없음. 패키지는 재생성하지 않았다.

## nginx 블록 초안 삭제 (2026-10-03 KST)

블록 선택 시 하위 항목도 제거됨을 안내하고 확인 후 초안에서 블록 전체를 삭제한다. 원본 운영 파일에는 쓰지 않으며 기존 실행 취소로 모든 자식 설정을 복원한다. 형제 블록과 주변 주석 보존/잘못된 노드 거부/복원 테스트 포함 61개 PASS, production build PASS. 새 삭제 버튼 브라우저 검증은 미실시. 최신 .deb 2137 파일 검증 PASS, SHA-256 84d53e36ed95659e8797cbe40cca602ada43dcc2fa97997400b83ed4dfad3249. 이번 패키지는 블록 추가·인자 수정·들여쓰기 수정·블록 삭제를 포함한다. localhost 8791 반영. 실제 패키지 설치나 운영 변경 없음. 전체 운영 E2E는 PARTIAL이다.

## nginx 노드 복제 (2026-10-03 KST)

선택한 directive 또는 블록을 초안에서 바로 뒤에 복제하는 기능을 추가했다. 블록의 자식 설정과 내부 주석 및 줄 들여쓰기를 보존하며 기존 실행 취소 기록에 포함한다. 구조 변경 후 선택을 초기화해 변경 이전 노드 ID를 재사용하지 않는다. 중복 location 및 singleton directive는 인자 수정과 실제 nginx 문법 검증이 필요하다. 테스트 62개 PASS. 이번 복제 버튼 브라우저 검증 및 .deb 재생성은 미실시. 실제 운영 파일 변경 없음.

## nginx 노드 순서 이동 (2026-10-03 KST)

설정 항목/블록 선택 후 위·아래 이동을 제공한다. 같은 부모의 인접 노드만 교환하며 자식 설정을 그대로 보존하고 실행 취소 기록에 포함한다. 첫/마지막 경계 이동은 원본을 유지한다. 노드 사이 주석의 귀속을 변경하지 않도록 주석을 가로지르는 이동은 거부하고 안내한다. 테스트 63개 PASS. 새 이동 버튼의 브라우저 검증 및 이번 변경 이후 .deb 재생성은 미실시. 실제 운영 설정 변경 없음.

## 그룹별 아이콘 메뉴와 설치 패키지 도구 (2026-10-03 KST)

현황 그룹은 대시보드/데몬/로그/복구/보안/감사를 표시한다. 로그·복구·감사에 인증 필수 App Router 페이지를 추가했다. 도구 그룹은 서버 상태에서 installed=true인 관리 대상 패키지만 표시하고 nginx는 설정 트리 화면, 나머지는 해당 package 인자의 GUI IDE를 연다. 패키지 설치/터미널은 하위 메뉴 패널 없이 48px 아이콘 패널 옆 영역을 사용한다. 하단 터미널 버튼은 제거했다. 새 그룹 내비게이션의 브라우저 검증은 미실시. .deb 재생성 미실시.

## 설치 도구 GUI 전환 검증 (2026-10-03 KST)

실제 계정은 변경하지 않고 임시 로그인 fixture로 검증했다. 설치 목록 nginx/Certbot/PostgreSQL만 표시됨 확인. PostgreSQL 전용 DB 포트·메모리 폼 표시 → Certbot 선택 후 인증서 도메인/이메일/작업 유형 폼 표시 → 브라우저 뒤로 가기로 PostgreSQL 폼 복원 PASS. 중복 내부 패키지 메뉴 없음. 증거 .runtime/verification/installed-tools-navigation.png. 임시 계정 로그아웃, 탭과 서버 종료. 처음 실제 미리보기의 연결 거부를 확인하여 localhost 8791 서버를 재시작했다. 이번 검증은 코드 변경 없이 최근 패키지 선택/URL 동기화 구현을 확인했다.

## 패키지 설정 초안 직접 다운로드 (2026-10-03 KST)

패키지 설정 GUI에 설정 초안 다운로드 버튼을 추가했다. 기존 인증된 config-plan API로 입력 검증/설정 생성을 수행하며 Node.js .env, MariaDB .cnf, Certbot .txt, 기타 .conf 파일을 브라우저에서 내려받는다. 코드 탭 생성 없이 다운로드할 수 있고 오류는 기존 상태 메시지에 표시한다. 실제 시스템 설정은 변경하지 않는다. 다운로드 브라우저 검증 및 .deb 재생성은 미실시.

## 패키지 GUI 변경 상태와 초기화 확인 (2026-10-03 KST)

패키지 기본값과 다른 필드 수를 배지로 표시한다. 기본값과 같은 상태에서는 기본값 배지를 표시한다. 변경된 값이 있을 때 패키지 기본값 복원 전 확인 대화상자를 제공하고 취소 시 편집 값을 유지한다. 브라우저 검증 및 .deb 재생성은 미실시. 이 배지는 디스크 저장 여부가 아닌 기본값과의 차이를 나타낸다.

## 패키지 GUI 최종 검증 (2026-10-03 KST)

설치된 패키지 전용 GUI 검증 범위를 완료했다. PostgreSQL 포트 5432 → 5433 입력 시 변경한 항목 1 표시. 내장 브라우저와 Chrome 다운로드 이벤트 감시는 timeout이었으나 실제 다운로드 폴더에 생성된 postgresql-draft.conf 및 postgresql-draft (1).conf(각 168 bytes)의 시간·내용을 확인했고 port = 5433 및 localhost 바인딩을 확인했다. 증거 복사 .runtime/verification/postgresql-download-proof.conf. 사용자 다운로드 파일은 삭제/변경하지 않았다.

브라우저 기본 confirm이 자동 제어를 방해하여 앱 내부 비모달 alertdialog로 교체했다. Chrome에서 복원 확인 → 취소 시 5433 유지 → 다시 확인/기본값으로 복원 시 5432 및 기본값 배지 복원 PASS. 증거 .runtime/verification/package-reset-final.png. 최신 빌드에서 Certbot 전용 폼 전환 및 뒤로 가기 PostgreSQL 복귀 PASS. 패키지 설치·터미널 화면 .admin-sidebar count=0 PASS. 임시 계정 로그아웃/정상 검증 탭 종료/임시 서버 종료. 이전 브라우저 기본 confirm으로 멈춘 검사 탭의 자동 닫기는 실패했으며 서버와 임시 계정 데이터는 제거했다.

전체 테스트 63개 PASS, production build PASS, .deb 2150 파일 검증 PASS. SHA-256 c9cab7f726dfeee886cf017f5257ee92209fabae7f84552004acdf56956c578a. 실제 설치 패키지/운영 서비스/OS 권한은 변경하지 않았다.

운영 검증 잔여: 실제 apt 설치 및 업그레이드, nginx/DB 시스템 설정 적용, Certbot 실제 발급·갱신, cron 적용, 데몬 제어·복구, root helper/NOPASSWD 권한 설정, Tauri 실행 패키지 E2E. 해당 작업은 안전한 운영 검증 환경과 권한 확인이 필요하다. 이번 GUI 검증 완료는 전체 운영 E2E 완료를 의미하지 않는다. 전체 운영 E2E 상태 PARTIAL.

## standalone 소스 실행 스크립트 (2026-10-03 KST)

npm start를 scripts/start-server.mjs로 변경했다. Next standalone server.js와 정적 파일/public, 관리자 helper 검증 원본을 준비하고 실행한다. .env 로딩은 Next의 env loader를 사용하며 내용을 출력하지 않는다. STATE_ROOT와 AUTH_ROOT를 원래 프로젝트 경로 기준으로 고정해 standalone의 cwd 변경으로 실제 계정/작업 폴더 경로가 바뀌지 않도록 했다. PORT 숫자/범위 검증, 기본 loopback 및 자식 종료 신호 전달을 구현했다. 별도 포트 18791에서 standalone 경고 없이 기동, 로그인 HTML HTTP 200과 관리자 로그인 문구, 정적 JavaScript HTTP 200 확인 PASS. 8793은 기존 프로세스가 점유해 변경하지 않았다. 임시 서버 종료. 이번 startup 변경의 .deb 재생성은 미실시; Debian 서비스는 기존 자체 standalone 실행 경로를 사용한다.

## 패키지 경로와 전용 GUI 정리 (2026-10-03 KST)

사용자 지시에 따라 /ide/packages/[package] App Router 페이지를 추가했다. nginx/Certbot/PostgreSQL 등 허용된 패키지만 라우팅하며 인증 후 해당 전용 화면을 표시한다. 기존 /server-settings는 /ide/packages/nginx로, 기존 /ide?package=...는 새 경로로 이동한다. 설치 목록/대시보드/설치 카드 링크를 새 경로로 수정했다. 패키지 GUI에서 공통 파일 탐색기/터미널/코드 탭을 제거하고 요청 시에만 생성한 설정 미리보기를 표시한다. nginx 화면에서 Certbot·cron은 보조 기능 메뉴로 분리했다. 신규 경로 브라우저 검증 및 .deb 재생성은 미실시.

## 2026-10-03 일반 Next.js 실행 전환

- standalone 출력 제거. 일반 next start 실행과 systemd 패키지 실행 경로 통일.
- 배포본은 설치된 production 의존성 그래프만 포함하며 .next/cache, standalone, 환경 파일과 런타임 계정 데이터를 제외.
- npm run build 성공, npm test 63/63 통과, package:deb 및 package:verify 통과(10361 파일).
- 소스 서버 18791과 설치 없이 추출한 배포 서버 18792 모두 /login 및 실제 /\_next/static JavaScript HTTP 200 확인. 임시 서버 종료. 8791 미리보기 재시작.
- 시스템 패키지 설치 및 운영 서비스 변경은 수행하지 않음.
- deb SHA-256: 5147f2458afdb7fb69c949eb8b50f3038f3aaf341fd07a886126ae052f446442

## 2026-10-03 cron 관리 작업 삭제

앱이 등록한 `# LINUX:` 작업만 삭제하는 cron-delete API와 목록의 삭제 확인 UI를 추가했다. 확인 화면에 작업 이름·시간식·명령을 표시한다. 기존 변경 잠금·최신 버전 검사·변경 전 백업·보안 옵션·감사 기록을 삭제에도 적용한다. 중복/잘못된 관리 블록과 미등록 작업을 거부하고 다른 작업과 환경 변수 원문을 보존한다. 영어·일본어·중국어·스페인어·프랑스어·독일어 문구 추가. 테스트 64개 PASS. 실제 사용자 crontab 삭제/변경은 수행하지 않았다. 운영 E2E는 PARTIAL 유지.

최종 UI 및 번역을 포함한 production build PASS. /server-settings → /ide/packages/nginx HTTP 307 확인. 8791 미리보기 반영. 최신 deb SHA-256: 2a71c18bfdccfd2c1b77b0d977157acbef65e080e031c6499b423a3522211898.

## 2026-10-03 패키지 GUI 설정 초안 저장

패키지별 폼에서 서버 작업 폴더에 설정 초안을 저장하는 config-save API와 버튼을 추가했다. 서버가 생성한 UUID 파일명을 사용하며 사용자 파일 경로는 입력받지 않는다. 공통 설정 검증과 workspace 저장 보호, fileEditing 보안 옵션, 감사 기록을 적용했다. 입력 또는 기본값 복원 시 이전 설정 미리보기와 저장 표시를 초기화한다. 새 문구는 지원 중인 6개 번역 리소스에 추가했다.

테스트 65개 PASS, production build PASS. 임시 계정·state·workspace·18793 서버로 HTTP 검증: 미로그인 401, 조회 전용 403, 설정 저장 200 및 파일 내용 확인, 잘못된 설정 400, 감사 completed 기록 PASS. 증거 .runtime/verification/config-save-http.json. 임시 서버와 fixture 정리 완료. 실제 운영 설정과 계정 변경 없음. 이번 UI의 브라우저 조작 검증은 미실시이며 전체 운영 E2E 상태는 PARTIAL.

설정 초안 저장 최종 빌드의 .deb 생성 및 package:verify PASS(10361 파일). SHA-256: c25dcbd023c9a8982b8a70d85e6bff9151e5de36625935bb92ae696e41962b39. 8791 미리보기 재시작 완료.

## 2026-10-03 인증된 로그인 페이지 이동

/login 서버 페이지에서 세션을 검사하고 로그인된 사용자를 검증된 next 경로 또는 /overview로 이동하도록 변경했다. async headers/searchParams를 사용한다. 임시 계정·state·workspace·18793 HTTP fixture에서 정상 내부 경로 307 이동, 외부 next의 /overview 대체, 미로그인 상태, 초안 저장 권한 및 감사 기록 검증 PASS. production build PASS. 증거 .runtime/verification/login-redirect-http.json. 실제 계정과 운영 설정 변경 없음.

브라우저 UI 검증은 도구의 URL 보안 정책이 현재 사용자 탭 접근을 거부하여 BLOCKED. 다른 브라우저나 우회 수단으로 재시도하지 않았다. 8791 /login의 HTTP 200은 별도로 확인했으며 이를 UI PASS로 취급하지 않는다. 전체 운영 검증은 PARTIAL 유지.

로그인 이동 수정 최종 .deb 검증 PASS(10362 파일). SHA-256: 0780ae6bd3e1978b3f6480fa955d5e3eb573979f9aa722a3f7ed6fd963abf0f3. 8791 미리보기 재시작 완료.

## 2026-10-03 AI 로그 도우미 렌더링과 분석 문맥

기본 source 파라미터에서 초기화 전 번역 함수 t를 호출하는 ReferenceError를 수정했다. 로그/source 변경 시 이전 초안·동의·결과를 초기화하고 요청 revision으로 늦게 도착한 이전 분석/로그 미리보기 응답을 폐기한다. 분석 중 직접 입력을 잠근다. 실제 React 서버 렌더링 회귀 검사에서 source 생략과 API 호출 없는 렌더링 PASS. SWC binding 초기화가 누락된 첫 테스트 실행은 실패했으며 테스트 준비 코드를 수정해 최종 전체 66개 PASS. production build PASS. 실제 유료 OpenAI 호출은 수행하지 않았다. 브라우저 UI와 실제 운영 E2E는 아직 미완료.

AI 도우미 최종 .deb 생성 및 package:verify PASS. SHA-256: b0f9b1c6d43d7406083fc295917a1d04ec6227102322eebb682be83d8b4f3e51. 8791 미리보기 반영.

## 2026-10-03 패키지 업그레이드 서비스 재시작

postinst configure에서 deb-systemd-invoke restart를 사용해 설치된 새 코드가 실행되도록 수정했다. 서비스 정책 invoker를 유지한다. 모든 OS 명령을 임시 PATH fixture로 바꿔 configure의 daemon-reload→enable→restart 순서와 abort-upgrade 무동작을 검사했다. 전체 테스트 67개 PASS. 실제 운영 서비스 변경·패키지 설치 없음. 패키지 검증기에 maintainer scripts의 실행 권한·sh 문법·업그레이드 재시작 경로 검사를 추가했다. 전체 요구사항 점검은 docs/completion-audit.md에 기록했으며 완료되지 않은 요구를 유지한다.

업그레이드 재시작을 포함한 최종 .deb 및 강화된 package:verify PASS. SHA-256: e6af96d3a22c59d412f7d85cc9ee1f18827489db9678f0d50481c32d5523a7e5.

## 2026-10-03 패키지 운영 설정 조회와 폼 가져오기

PostgreSQL 클러스터별 postgresql.conf, MariaDB의 지정 기본 파일 및 conf.d/\*.cnf, Redis redis.conf에서 GUI가 지원하는 항목만 읽는 config-live API를 추가했다. 경로는 서버가 제한하고 사용자가 임의 파일을 지정하지 못한다. 심볼릭 링크와 256KB 초과 파일은 거부하며 비밀번호 등 무관한 지시문을 반환하지 않는다. 기존 검증기로 단위·범위·선택지를 확인하고 지원하지 않는 값은 경고로 표시한다. 파일 선택 후 확인으로 읽은 항목만 폼에 반영하며 미리보기와 저장 표시를 초기화한다. 패키지 이동 시 뒤늦게 도착한 다른 패키지 조회 결과는 표시하지 않는다. include 파일과 실행 중 최종 설정을 완전히 해석하는 기능은 아니다.

단위·비밀번호 미반환·클라이언트 섹션 제외·중복 항목·잘못된 값·다중 PostgreSQL 클러스터·심볼릭 링크 fixture를 포함해 69개 테스트 PASS. 새 조회 버튼의 JSX 닫는 괄호 누락으로 초기 build가 실패했으며 수정 후 최종 production build PASS. 임시 계정 HTTP 검사에서 미로그인 조회 401, 로그인 조회 200, 잘못된 패키지 400 PASS. .runtime/verification/config-live-http.json. 실제 운영 설정 쓰기/서비스 재시작 없음. 브라우저 폼 조작과 운영 적용 검증은 미완료.

운영 설정 조회 최종 .deb 생성 및 package:verify PASS. SHA-256: 7fb40a85b52d308e1cf055ffcd3de34b2bb1ace29274d1238c72eba6739efa8a. 8791 미리보기 반영.

## 2026-10-03 Tauri 릴리스·데스크톱 배포 패키지

Tauri bundle을 활성화하고 잠금 파일/offline Cargo release 빌드로 Linux 네이티브 실행 파일을 생성했다. 별도 tastedev-linux-desktop .deb 생성 및 검증 스크립트, 데스크톱 메뉴 항목, 기존 64×64 아이콘을 추가했다. 같은 버전의 tastedev-linux 서버 패키지에 의존하며 공유 라이브러리의 실제 Debian 소유 패키지를 의존성으로 기록한다. 첫 패키징 시 libc 로더 diversion 출력 때문에 소유 패키지 파싱이 실패했고 realpath 및 정식 패키지 행 확인으로 수정했다.

cargo release 성공, desktop-file-validate PASS, .deb 생성 및 package:desktop:verify PASS. ELF x86-64, 서버 의존성, 현재 장비의 모든 공유 라이브러리 해석, 실행 파일/메뉴 권한, 아이콘, checksum 확인. SHA-256: 6cdcd2ba473dfee45317defdc7d2c0b888810c085c98033dc36c4584492feb44. 증거 .runtime/verification/desktop-package.json. 패키지 설치·네이티브 GUI 실행·로그인/화면 조작은 수행하지 않았으며 다른 배포판 호환성은 미검증. 현재 로컬 서버 8791과 실제 운영 서비스는 변경하지 않았다. 전체 목표 PARTIAL 유지.

## 2026-10-03 패키지 GUI 운영 값 비교

운영 파일에서 불러온 항목을 패키지별 비교 기준으로 보존하고 기존 값·편집 값·변경 여부·조회되지 않은 항목을 표시한다. 불러온 항목이 바뀌지 않았다고 해서 미조회 항목도 운영 값과 일치하는 것으로 표시하지 않는다. 숫자 입력의 문자열/숫자 타입 차이만으로 변경 배지를 만들지 않는다. 앱 기본값 복원 확인은 비교 기준과 독립적으로 판단하며 기준 해제도 제공한다. 신규 문구를 기존 6개 언어 리소스에 추가했다. 회귀 검사 포함 전체 테스트 70개 PASS. 실제 설정 적용·브라우저 UI 검증은 수행하지 않았다.

운영 값 비교 최종 production build, .deb 생성 및 package:verify PASS. SHA-256: b74c9404f7f585f196f1e7654244d95a1838625687b725568c86c7c2e7bdb251. 8791 미리보기 반영. 전체 완료 상태는 PARTIAL 유지.

## 2026-10-03 감사 기록 필터와 내보내기

감사 화면을 시간·작업·결과 표로 구성하고 결과 상태, 검색어, UTC 시작/종료 날짜, 필터 초기화를 추가했다. 화면의 선택 기록을 JSON으로 내보내며 최신 bounded 응답(최대 100건)에서 선택된 기록이라는 범위를 파일에도 표시한다. 날짜 역전 경고를 제공한다. 원본 배열 보존, UTC 하루 경계, 잘못된 날짜, 선택 기록 내보내기 검사 포함 전체 테스트 71개 PASS. 브라우저 파일 다운로드 조작은 미검증이며 전체 과거 이력 내보내기 기능은 아니다.

감사 기록 최종 production build, .deb 생성 및 package:verify PASS. SHA-256: c860f72c4f53e4a707cd72e8b4fd6587385e57c79b972e80626ebb43e48e824b. 8791 미리보기 반영. 실제 설치/운영 적용 검증에 필요한 격리 DEV/VM 환경 정보를 사용자에게 요청했으며 해당 단계는 답변 전 진행하지 않는다. 전체 목표 PARTIAL 유지.

## 2026-10-03 연결 해제·로그 소스 변경 시 이전 응답 차단

감사 화면은 연결 해제 시 기록·오류·진행 상태를 초기화하고 연결되지 않은 렌더에서는 기록을 표시하지 않는다. 요청 세대와 현재 연결 상태를 확인해 뒤늦은 조회 응답이 이전 기록을 복원하지 못하도록 변경했다. 로그 수동 조회와 서비스에서 로그 열기에도 현재 소스·검색 조건·연결 상태 일치 검사를 적용했다. 연결 해제 시 로그 다운로드를 차단하고 로그 표시를 숨긴다. 실제 브라우저에서 응답 지연/로그아웃 조작 검증은 도구 정책 차단으로 미수행이며 코드·production build 검사만 수행한다. 이 UI 변경을 서버 인증 검증이나 전체 E2E PASS로 취급하지 않는다.

최종 production build 및 .deb 검증 PASS. SHA-256: a358b89596b9f042ea9548e1189336da62e0643123f3d3173f30eef8a308996b. 8791 미리보기 반영. 기존 테스트 71개 결과를 이번 비동기 UI 조작 검사 PASS로 확대하지 않는다. 격리 DEV/VM 정보 요청은 아직 미응답이며 전체 목표 PARTIAL 유지.

## 2026-10-03 패키지 GUI 스키마 번역

기존 영어 fallback으로 표시되던 패키지 설정 스키마의 설명·경로 자리표시·입력 라벨·작업 유형 44개를 일본어·중국어·스페인어·프랑스어·독일어에 추가했다. 현재 6개 카탈로그의 모든 한국어 스키마 항목에 명시 번역이 있는지 검사하는 회귀 검사를 추가했다. 전체 테스트 72개 PASS. 이 검사는 키 누락·빈 값·원문 복사를 검출하며 번역 자연스러움이나 전체 UI·모든 Linux 로케일 번역 완료를 증명하지 않는다. 주요 6개 언어와 전체 지역 로케일 범위의 나머지 미번역 작업을 유지한다.

패키지 스키마 번역 최종 production build 및 .deb 검증 PASS. SHA-256: a644c3c9ad60a2c5811f26236a112529ca8c3cdf9941d5ca4f88e9e50f569f03. 8791 미리보기 반영. 전체 목표는 미완료로 유지한다.

## 2026-10-03 패키지 설정 코드 작성기 연결

패키지 GUI의 생성 설정을 읽기 전용 미리보기 대신 편집 가능한 코드 초안으로 연결했다. 다운로드, Ctrl+S/작업 폴더 저장, 저장 버전 검사를 지원한다. GUI 저장으로 생성된 파일은 반환 버전을 유지해 후속 코드 저장의 충돌 검사를 적용한다. 코드 수정은 폼 값으로 역반영하지 않고 운영 파일/서비스를 변경하지 않는다.

패키지별 코드 초안을 세션 메모리에 보존하며 숨기기/다시 열기를 지원한다. GUI 값 변경은 코드 초안을 지우지 않고 오래된 GUI 초안임을 표시한다. 편집된 코드 교체는 확인 UI를 거치며 GUI를 다시 변경하면 대기 중 교체를 취소한다. 숨기거나 다른 패키지로 이동한 코드 변경도 DraftProvider의 새로고침 경고에 포함하고 로그아웃 시 기존 초안 초기화 범위를 따른다. 전체 테스트 73개 PASS(숨긴 코드 초안 보호 포함). 실제 브라우저 편집/교체/다운로드/저장 조작은 미검증. 기존 파일 API의 보호를 재사용하며 시스템 설정 적용 기능으로 표시하지 않는다.

패키지 코드 작성기 최종 production build 및 .deb 검증 PASS. SHA-256: 3a575faf442e7d6a0aba4aeab14175e43a551e38792dbe46700e05aec3d4684d. 8791 미리보기 반영. 전체 목표 PARTIAL 유지.

## 2026-10-03 패키지 URL과 GUI 선택 일치

명시된 패키지가 설치되지 않았을 때 첫 설치 패키지로 대체하던 동작을 제거했다. /ide/packages/<package>는 해당 패키지가 설치된 경우에만 설정 GUI를 표시하며 미설치 안내와 설치 화면 링크를 제공한다. nginx 전용 화면에도 동일한 조건을 적용한다. /ide는 서버에서 설치 상태를 조회해 첫 지원 패키지의 전용 라우트로 이동한다. 상태 재조회마다 프로필 ID를 새로 만들어 기존 폼을 불필요하게 초기화하던 효과도 제거했다.

전체 테스트 74개 PASS. 명시적 미설치/알 수 없는 패키지 대체 금지·설치 상태 엄격 검사·기본 선택 검사 포함. production build PASS. 임시 계정 HTTP 검사에서 /ide 이동 대상이 실제 설치 상태와 일치하는지 PASS. .runtime/verification/package-route-http.json. 실제 미설치 안내의 브라우저 표시/클릭은 미검증이며 서버 패키지 설치와 운영 설정 변경 없음.

패키지 라우트 선택 최종 .deb 검증 PASS. SHA-256: cf9e350202c322eb0263b95bf6cf718eb26f329de0707949cd29785ff6efd534. 8791 미리보기 반영. 전체 목표 PARTIAL 유지.

## 2026-10-03 패키지 코드 저장 충돌 비교

패키지 설정 코드 작성기에 디스크 파일 조회·비교를 추가했다. 비교 화면은 현재 편집 내용을 그대로 표시하며 명시적으로 디스크 버전을 저장 기준으로 선택할 수 있다. 기준 선택은 파일을 저장하거나 편집 내용을 교체하지 않는다. 후속 저장은 기존 파일 API의 버전 검사를 다시 수행한다. 화면에 후속 저장이 비교한 파일 내용을 교체한다는 안내를 추가하고 6개 번역 카탈로그에 안내를 제공한다.

전체 테스트 75개 PASS, production build PASS. 새 fixture 검사는 비교 후 추가 외부 변경의 저장 거부 및 최신 버전 재조회 후 저장을 확인했다. 실제 브라우저 비교·기준 선택 조작은 URL 정책 제한으로 미검증. 운영 파일·서비스 변경 없음. 전체 목표 PARTIAL 유지.

최종 .deb 추출 검증 PASS. SHA-256: 48552866386334a5fe9ab19d5a525560ac3a8b043706bf9472df243ecfb788bd. 새 production 빌드를 8791 미리보기에 반영했다. 패키지 실제 설치 및 브라우저 조작 검증은 수행하지 않았다.

## 2026-10-03 운영 설정 부분 변경 기반

lib/config-patch.mjs에 PostgreSQL·MariaDB·Redis의 선택 항목만 변경하는 서버 내부 함수를 추가했다. 기존 프로필 검증을 사용하며 허용되지 않은 항목·명령 주입·NUL·크기 초과를 거부한다. 기존 인증·바인딩·include·지원 외 항목을 보존하며 MariaDB 클라이언트 그룹을 변경하지 않는다. 동일 파일의 중복된 지원 항목은 선택 값으로 일치시키며 미존재 항목은 추가한다. Redis include 파일의 최종 유효 값이나 실행 중 서버 값까지 검증하는 함수는 아니다. 전체 운영 파일에 비밀이 있을 수 있으므로 이를 클라이언트 응답으로 보내지 않도록 명시했다.

전체 테스트 78개 PASS. 신규 fixture는 Redis CRLF·중복 포트·인증/include 보존, MariaDB 클라이언트·서버 그룹·주석 보존, PostgreSQL 선택 항목 추가, 입력 주입 거부를 확인했다. 아직 API/GUI 적용 버튼·권한 helper·패키지별 검사·백업/롤백과 연결하지 않은 기반 구현이다. 따라서 운영 설정 적용 완료로 판정하지 않는다. 이 변경은 미리보기 동작이나 .deb 런타임 그래프를 변경하지 않는다. 실제 장비 설정·데몬 변경 없음.

## 2026-10-03 운영 설정 변경 계획 API와 GUI

운영 설정 조회에 파일 SHA-256 버전을 포함하고, config-operation-plan 인증 API를 추가했다. 정해진 DB/Redis 설정 경로만 읽으며 심볼릭 링크·파일 크기를 검사하고 조회 버전과 현재 버전이 다르면 409를 반환한다. 서버 내부 부분 변경 함수를 사용해 결과를 파싱하지만 원본·완성 설정 텍스트를 응답하지 않는다. 지원 항목의 변경 전후 값만 반환하므로 인증 비밀을 포함하는 전체 설정 파일을 화면으로 보내지 않는다.

GUI에서 불러온 운영 설정과의 비교에 변경 계획 검토 버튼을 연결했다. 실제 변경된 지원 항목만 계획에 포함하며 파일 버전 없는 과거 비교 기준은 다시 조회해야 한다. 폼·패키지·비교 기준·연결 상태가 바뀌면 계획을 지우고 이전 입력의 비동기 응답을 표시하지 않는다. 실제 운영 파일 저장 또는 데몬 변경은 아직 연결하지 않았다.

전체 테스트 79개 PASS, production build PASS. 새 격리 fixture는 버전 충돌·허용 경로·심볼릭 링크 거부, 비밀 값 응답 제외, 파일 비변경 및 변경 전후 값을 확인했다. 브라우저 조작은 URL 정책 제한으로 미검증. 전체 목표 PARTIAL 유지.

임시 계정 HTTP 검사 PASS: 새 계획 API의 미로그인 401·허용 외 경로 400. .runtime/verification/config-operation-plan-http.json. 최종 .deb 추출 검증 PASS, SHA-256 b2c222a9db6a2ea3322a91786e710acf100cb07848eec222eb31f5ac493372ca. 8791 미리보기에 새 빌드 반영. 운영 적용·실제 패키지 설치·브라우저 조작 PASS를 의미하지 않는다.

## 2026-10-03 운영 설정 파일 트랜잭션

lib/config-transaction.mjs에 운영 적용의 공통 기반을 추가했다. 후보 검증 전 원본 변경 없음, 원본 버전·inode 재검사, 잠금 디렉터리로 중복 작업 거부, 0600 비공개 백업, 소유권·권한 유지, 원자적 교체 및 fsync를 구현했다. 반영 실패 시 원본 복원 후 서비스 복구 콜백을 수행하며 복원/복구 결과를 구분한다. 반영 중 외부 파일 변경은 복원으로 덮어쓰지 않고 수동 검토 필요 상태를 반환한다. 원본 텍스트·검사 명령의 민감한 진단은 결과에 반환하지 않는다.

임시 파일 검사: 검증→교체→반영 순서, 권한 및 백업 내용, 검증 실패와 오래된 버전의 비변경, 반영 실패 복원과 복구 실패 구분, 외부 변경 보존, 동시 작업 잠금 거부를 포함했다. 관리자 helper·HTTP 적용 API·실제 DB 검증/재시작에는 아직 연결하지 않았다. 운영 파일·서비스 변경 없음. 따라서 실제 적용 완료로 판정하지 않는다. 런타임 import 경로가 없는 기반 모듈이므로 현재 미리보기/.deb의 기능 변화는 없다.

최종 전체 테스트 84개 PASS(동시 파일 트랜잭션 거부 포함). 실제 장비 적용과 브라우저 검증은 미완료이며 전체 목표 PARTIAL 유지.

## 2026-10-03 PostgreSQL 설정 검사·클러스터 반영 콜백

PostgreSQL 설정 파일 경로에서 Debian 버전/클러스터를 제한적으로 식별하는 서버 내부 콜백을 추가했다. 지원 필드와 프로필 값을 검증하고 후보 파일은 동일 설정 폴더의 내부 임시 파일만 허용한다. postgres -C를 postgres 계정으로 실행해 선택 필드의 실제 파싱 값을 읽고 단위/불리언 값을 비교한다. 파일 include 우선순위 등에 의해 요청 값과 다르면 검사를 거부한다. pg_ctlcluster status 사전 검사, 정확한 클러스터 restart 및 status 확인, 원본 복구 뒤 restart 콜백을 제공한다.

전체 테스트 86개 PASS. 실행 대체 fixture에서 클러스터·고정 argv·후보 설정 검사·단위 비교·재시작 이후 상태 확인·잘못된 경로/필드/값·중단 클러스터·설정 값 불일치를 검사했다. 실제 postgres/pg_ctlcluster를 실행하거나 운영 DB에 접속하지 않았다. 기본 PostgreSQL 계정 및 권한 조건의 실제 검증, 공통 파일 트랜잭션/helper/API/GUI 연결은 남아 있다. 런타임 그래프에 연결되지 않아 미리보기 동작 변화 없음. 전체 목표 PARTIAL 유지.

## 2026-10-03 PostgreSQL 적용 GUI·API·전용 helper 연결

PostgreSQL 변경 계획에서 적용 확인 화면을 연결했다. databaseChanges 보안 옵션과 관리자 환경 플래그/sudo/helper 검사, 로그인, 원본 파일 버전 검사를 거쳐 전용 helper의 postgresql-apply만 실행한다. 기존 보안 파일에서 새 databaseChanges 항목이 없으면 false로 읽어 이전 권한을 확대하지 않는다. 적용은 root 소유·단일 링크·비쓰기공유 설정 파일과 root 소유 설정 디렉터리에 제한되며 PostgreSQL 계정이 후보 파일을 읽을 수 있어야 한다. 해당 조건을 만족하지 않는 일반 설치 파일은 거부하며 권한을 자동 변경하지 않는다.

helper는 고정 PostgreSQL 경로/필드/범위/확인을 독립 검증하고 status→후보 설정 검사→0600 백업→버전·inode 재검사→원자적 교체→정확한 클러스터 restart/status 순서로 동작한다. 후보 검사는 -C 값의 단위/불리언 값 일치를 확인한다. 실패 시 원본 복원 및 재시작 복구 결과를 구분하며 외부 변경은 보존한다. 백업은 별도 private PostgreSQL 디렉터리에 기록하고 파일/디렉터리 fsync를 수행한다. 성공·실패·롤백·수동 복구 필요 상태를 감사 기록에 남긴다. 적용 UI는 재시작 영향 확인, 결과와 백업 ID, 재검토 전 중복 적용 방지 및 요청 중 폼 편집 차단을 제공한다.

전체 테스트 90개 PASS. 실제 파일을 사용하는 VM helper fixture에서 고정 명령 대체를 통해 적용·검증 실패·버전/입력 거부·복원·외부 변경 보존을 검사했다. helper 내 fsync 추가 후 관련 9개 검사 재확인 PASS. API 인증/DB 적용 권한 거부도 검사했다. 실제 postgres/pg_ctlcluster/sudo는 실행하지 않았다. 실제 설치 환경 권한, DB 재시작 및 전체 브라우저 조작 검증은 남아 있다. 별도 PostgreSQL 백업의 GUI 조회/사용자 복원과 MariaDB·Redis 적용은 미완료다. 전체 목표 PARTIAL 유지.

최종 전체 테스트 91개 PASS. 기존 보안 설정에 databaseChanges가 없는 경우 false로 마이그레이션하고 기존 다른 권한을 유지하는 격리 검사도 PASS. 적용 요청의 확인·파일 계획 단계 오류까지 failed 감사 기록 범위에 포함했다.

최종 production build PASS. 임시 계정 HTTP 검사에서 PostgreSQL 적용 API의 미로그인 401·관리 권한 차단 403 확인 PASS(.runtime/verification/postgresql-apply-http.json). 실제 적용 성공/재시작/복구 HTTP E2E는 격리 DB 환경 미확보로 미검증이다.

최종 .deb 검증 PASS. SHA-256 06ede4ddc8d90fc423e1997612cd969962c6e7a4048e59ee8e7c1571ac857758. 새 production 빌드를 8791 미리보기에 반영했다. 실제 관리자 작업 환경 플래그는 계속 비활성이다. sudo 설정·운영 서비스 변경·패키지 실제 설치 없음.

## 2026-10-03 PostgreSQL 설정 백업 목록

전용 helper의 postgresql-backups 읽기 작업과 인증 API, PostgreSQL GUI 목록을 추가했다. root 소유 private 백업 디렉터리와 단일 링크 파일·크기·내용 해시·ID/대상/생성 시각을 검증하고 메타데이터만 반환한다. 손상/심볼릭 링크 기록은 제외 개수로 표시한다. 1000개 검사·100개 표시 한도와 부분 목록 표시를 제공한다. 설정 원문은 반환하지 않으며 DB 데이터 백업과 구분한다. sudo 옵션과 관리자 환경/helper 준비가 필요하되 조회 전용 보안 모드에서도 목록 조회가 가능하다.

전체 테스트 92개 PASS. 실제 임시 파일 기반 helper fixture에서 정상 백업 메타데이터·비밀 원문 제외·손상 JSON·심볼릭 링크 제외를 검사했다. 운영 helper 및 실제 sudo는 실행하지 않았다. 브라우저 표시·실제 root 백업 조회와 사용자 선택 복원은 아직 미검증/미완료다. 전체 목표 PARTIAL 유지.

초기 빌드에서 백업 조회 버튼 JSX 닫는 괄호 누락을 발견해 수정했다. 수정 후 production build 재검증 결과를 아래 기록한다. 단위 테스트 통과를 화면 빌드 통과로 확대하지 않는다.

수정 후 production build PASS. PostgreSQL GUI 자체 SWC 컴파일·서버 렌더링 검사(API 호출 없이 백업/운영 조회 컨트롤 렌더링)를 추가했고 최종 전체 테스트 93개 PASS. 최종 .deb 검증 PASS, SHA-256 409964479e491c13a197f13d0062a9eecc94cfd6cdcce712942d3e7e267aad32. 8791 미리보기에 반영. 브라우저 조작·운영 백업 조회·실제 설치/적용을 확인한 결과는 아니다.

## 2026-10-03 PostgreSQL 선택 백업 복원

postgresql-restore-plan 읽기 API와 PostgreSQL GUI의 복원 검토 화면을 추가했다. root private 백업 파일의 ID·형식·크기·해시·대상을 검사하고 현재 설정과 백업의 지원 항목만 표시한다. 설정 원문·민감한 지원 외 항목은 반환하지 않는다. 지원 항목 표시만으로 전체 차이가 드러나는 것은 아니므로 실제 복원이 백업의 전체 설정 파일을 교체함을 명시했다.

postgresql-restore API는 databaseChanges/admin/sudo/helper 권한과 명시적 확인을 요구한다. helper가 ID로 직접 백업 파일을 선택하고 백업 및 현재 파일 버전을 재검사한다. 전체 후보 검사, 복원 직전 현재 설정의 새 백업, 파일 교체, 정확한 클러스터 restart/status 및 실패 시 복원 직전 설정으로 되돌리기를 적용한다. 성공·실패·롤백·수동 복구 상태를 감사에 남긴다. GUI는 재시작 영향 확인과 복원 결과/복원 직전 설정의 백업 ID를 표시한다.

임시 파일 helper fixture에서 지원 항목 미리보기·비밀 제외·선택 백업 전체 복원·현재 설정 백업 생성·확인 누락·버전 충돌·백업 변조 거부·복원 실패 시 직전 설정 복구를 확인했다. 실제 sudo/DB/클러스터 명령은 실행하지 않았다. 전체 운영 E2E·브라우저 조작은 미검증이며 전체 목표 PARTIAL 유지.

전체 테스트 96개 PASS, production build PASS. 임시 계정 HTTP 검사에서 복원 API 미로그인 401, 적용/복원·복원 계획 권한 부족 403 확인 PASS(.runtime/verification/postgresql-restore-http.json). 실제 DB 복원 성공·실패/롤백 HTTP E2E는 미검증이다.

최종 .deb 검증 PASS. SHA-256 c4bea08495e2e01fff3bcd49a9f0bde12f4e18da1ff85f8869e8e90cb5e5fc15. 새 빌드를 8791 미리보기에 반영했다. 실제 관리자 작업은 계속 비활성으로 유지했으며 운영 DB·sudo 설정·운영 서비스·실제 설치 변경 없음.

## 2026-10-03 MariaDB 버전별 설정 검사 기반

MariaDB 내부 콜백 모듈에 고정 설정 경로/필드/값 검사와 설치 바이너리 도움말의 validate-config 기능 탐지를 추가했다. 지원 버전은 전용 설정 검사, 미지원 버전은 별도 options-help 모드로 후보의 옵션 파싱을 수행한다. my_print_defaults의 지원 항목만 필터링·단위/불리언 비교하며 원본 출력과 비밀번호를 반환하지 않는다. mariadb.service 사전 상태, 재시작 이후 상태 확인 및 복구 콜백을 제공한다.

명령 대체 fixture에서 검사 방식 동적 선택·고정 argv·기본 옵션 출력 필터링·지원 값 확인·값 불일치·임의 경로/주입 입력·사전 검사 누락 거부를 검사했다. 실제 MariaDB/서비스 명령은 실행하지 않았다. 후보 단일 파일 검사이며 운영 include 전체와 서비스 시작 옵션에 대한 검증은 아직 없다. root helper/API/GUI 적용 및 백업/복구 연결도 남아 있다. 이 기반 모듈은 현재 런타임 그래프에 없으므로 미리보기/배포 기능 변화 없음. 전체 목표 PARTIAL 유지.

최종 전체 테스트 99개 PASS. 실제 운영 적용과 전체 목표 완료를 의미하지 않는다.

## 2026-10-03 MariaDB main/include 연결 조회

MariaDB GUI에 main 선택과 include 연결 조회를 추가했다. 인증 API는 my.cnf/mariadb.cnf 두 main만 허용하고 /etc/mysql 안의 cnf/디렉터리 연결을 읽는다. include/includedir/optional includedir 연결·행 위치·정렬된 디렉터리 파일 목록, 파일별 버전/크기 및 전체 연결 버전을 반환한다. 설정 원문·옵션 값은 응답하지 않는다. 순환·심볼릭 링크·범위 밖 경로·지원 외 구문·읽기 실패를 미해결 경고로 표시한다. 방문/연결 300, 깊이 16, 고유 파일 100, 파일 256KB/전체 1MB 한도를 둔다. 반복 include 한도 도달 시 루프를 중단해 응답이 무제한 커지지 않도록 했다.

이 조회는 지정 main의 구조이며 서버가 실제로 선택한 main, 버전별 그룹, 시작 인수와 최종 값을 확인한 결과가 아니다. 심볼릭 링크 main은 현재 지원하지 않고 미해결 상태로 표시한다. 서버 파일은 변경하지 않는다. include 연결을 새 후보 전체 검증/적용에 사용하는 단계와 MariaDB 실제 운영 적용은 아직 남아 있다. 전체 목표 PARTIAL 유지.

최종 전체 테스트 102개 PASS, production build PASS. 임시 계정 HTTP 검사에서 미로그인 조회 401·범위 밖 main 400·메타데이터 응답 형식 확인 PASS(.runtime/verification/mariadb-topology-http.json). 실제 include 전체 후보 적용·브라우저 조작은 미검증이다.

최종 .deb 검증 PASS, SHA-256 06e6d675a8b301597c3fb3a021c7df1bc5a31a06e5978898af1c506b536ec567. 8791 미리보기에 반영했다. 실제 관리자 작업·설치·DB 접속·운영 파일 변경은 수행하지 않았다.

## 2026-10-03 MariaDB include 전체 후보 묶음 생성 기반

서버 내부 mariadbCandidate 함수를 추가했다. 미해결 include·이전 전체 버전·main에 포함되지 않은 선택 파일을 거부한다. 파일별 내용을 다시 읽고 hash를 검사한 뒤 지원 항목만 변경하며, include 파일/디렉터리 연결을 별도 private 후보 폴더로 재연결한다. 후보 생성 종료 시 원본 전체 연결 버전도 재검사하고 오류 시 임시 폴더를 정리한다. 정상 결과의 cleanup은 이 함수가 만든 폴더만 삭제한다. 인증 값을 포함할 수 있는 후보 파일을 0600, 폴더를 0700으로 제한한다. UTF-8 오류는 원본 바이트를 조용히 변경하지 않고 거부하며 줄바꿈은 유지한다.

임시 파일 fixture는 include 재연결·선택 파일 변경·지원 외 값 및 원본 보존·권한·cleanup·이전 버전/미포함 대상/미해결 연결 거부·CRLF 보존·잘못된 UTF-8 거부를 검사했다. 검사 명령, 권한 helper, 실제 MariaDB 적용·백업·복구에는 아직 연결하지 않았다. 현재 런타임 그래프/미리보기/.deb 변화 없음. 운영 파일·서비스 변경 없음. 전체 목표 PARTIAL 유지.

최종 전체 테스트 105개 PASS. 실제 DB 검사/재시작·전체 브라우저 검증은 미완료다.

## 2026-10-03 MariaDB include 후보 묶음과 검사 연결

mariadbConfigHooks에 validatePrepared를 추가해 생성된 후보 전체 main을 검사 명령과 연결했다. 동결 후보 객체를 프로세스 내 등록으로 식별하며 원본 대상·변경 키/값을 요청과 대조한다. 객체 복제/수정·다른 대상/변경·cleanup 뒤 재사용을 거부하고 검사 종료 시에도 후보 유효성을 확인한다. my_print_defaults의 전체 결과에서 지원 항목만 파싱해 include 뒤쪽 값이 요청 값을 덮어쓰면 거부한다. 설정 검사/옵션 출력 실패의 민감한 원문 진단을 일반 오류로 치환한다.

임시 include 묶음 및 실행 대체 fixture에서 실제 생성 main 경로가 검사에 전달됨, 뒤쪽 include 불일치, 미복원 원문 비노출, 후보 식별·변경 바인딩·정리 뒤 거부·민감한 실패 진단 제외를 검사했다. 실제 MariaDB 명령과 root helper/API/GUI 적용에는 아직 연결하지 않았다. 현재 런타임 그래프/미리보기/.deb 기능 변화 없음. 실제 운영 파일·서비스 변경 없음. 전체 목표 PARTIAL 유지.

최종 전체 테스트 108개 PASS. 실제 DB include 해석·검사·적용 E2E와 브라우저 조작은 미완료다.

## 2026-10-03 MariaDB 전체 후보 검증과 적용 트랜잭션 조합

내부 applyMariaDBConfig 실행기를 추가했다. 명시적 재시작 확인, 현재 전체 include 버전, 포함된 대상 파일을 검사하고 전체 그래프 잠금을 잡는다. 사전 서비스 검사·private 후보 전체 main 검증·지원 값 대조 후 private 백업과 대상 파일 교체를 수행한다. 후보 검사 뒤, 파일 교체 직전, 재시작 직전에도 전체 파일/연결을 대조한다. 검증 중 충돌은 409로 보존한다. 공통 트랜잭션은 backup 파일뿐 아니라 backup 디렉터리도 fsync하고 교체 직전 콜백을 제공한다.

임시 파일과 대체 실행 명령으로 정상 적용 순서·원문 비노출·검증 중 다른 include 변경 거부·재시작 실패 시 원본 복원 및 서비스 복구·재시작 중 다른 include 변경 시 외부 파일 보존과 복구 미완료 표시를 검사했다. 최종 전체 테스트 112개 PASS. 실제 MariaDB 명령·sudo·운영 파일·서비스는 변경하지 않았다.

이 실행기는 내부 기반이며 root helper/API/GUI에 아직 연결하지 않았다. 현재 런타임 그래프/미리보기/.deb 기능 변화 없음. 실제 서버의 main 선택·시작 옵션·심볼릭 링크 및 후보 실행 계정 권한 확인과 격리 환경 E2E가 남아 있다. 전체 목표 PARTIAL 유지.

## 2026-10-03 MariaDB GUI 변경 계획과 include 연결 버전 결합

MariaDB include 조회 컴포넌트가 부모 폼에 조회 결과를 전달한다. root/접속 상태 변경 시 조회와 계획을 무효화한다. 완전한 연결과 포함 대상이 없으면 변경 계획 버튼을 비활성화한다. 서버 configOperationPlan은 MariaDB에 한해 선택 main·전체 graphVersion을 필수 대조하고 대상 포함 여부를 확인하며 파일 비교 후 전체 그래프를 다시 조회한다. 응답은 root/graphVersion과 지원 항목 비교만 포함한다. 전체 연결 검사는 실행 중 최종 값 검증을 대체하지 않으며 운영 적용 helper 연결은 여전히 남아 있다.

전체 테스트 113개 PASS. 새 fixture로 정상 graph 결합·민감한 원문 비노출·누락 버전/추가 include 충돌을 검사했다. production build PASS. 임시 계정 HTTP 회귀 PASS(.runtime/verification/mariadb-topology-http.json): 인증·조회·권한 차단·초안 저장·경로 이동 검사이며 실제 MariaDB 적용 또는 브라우저 조작 증거는 아니다. 새 빌드를 8791에 반영했다. 운영 관리자 변경은 비활성으로 유지한다.

로컬 .deb 생성 SHA-256 ca6d05439decefcb73ee1edc3d857d9091bf942bc748a803ac994af8e721601f, 실제 설치 없음. 전체 목표 PARTIAL 유지.

최종 .deb 추출/메타데이터/권한/비밀 파일 제외 검증 PASS(10362개 파일). 패키지 설치 및 서비스 실행 검증을 의미하지 않는다.

## 2026-10-03 root 실행용 DB 설정 검증 의존성 분리

DB 설정 생성·값 검사를 database-config-profile.mjs로 분리했다. configProfile의 DB 경로는 이 함수를 재사용하고 patch/live/MariaDB 검사 모듈은 순수 DB 함수만 가져온다. root 실행기에서 작업 폴더 저장·웹 server-tools·보안 상태 모듈을 간접 로딩하지 않도록 했다. scripts/admin/runtime-files.mjs에 MariaDB 적용기의 9개 파일 의존성 목록을 선언했다. 의존성 검사 fixture는 모든 지역 import가 이 목록에 속하고 나머지는 Node builtin이며 간접 import/require/eval이 없고 목록과 실제 도달 모듈이 일치하는지 검사한다. 이는 패키지 설치 파일의 root 소유권/무결성 검사나 실제 helper 실행을 대체하지 않는다.

기존 전체 테스트 113개 PASS, 추가 의존성 검사 1개 PASS. production build PASS. 관리자 helper의 실제 로딩·패키징·API 연결은 아직 미완료다. 운영 파일/서비스 변경 없음. 전체 목표 PARTIAL 유지.

임시 계정 HTTP 회귀 PASS. 8791 미리보기 반영. 로컬 .deb 생성·추출 검증 PASS(10362개 파일), SHA-256 9c8d42c0cb5b3104077b9219cdd458c2f4b0ddf9223608cffa61e64bc79d8aa9. 실제 설치 및 운영 서비스 변경 없음.

## 2026-10-03 MariaDB 패키지 helper/API/GUI 적용 연결

패키지에 root 실행용 9개 모듈과 manifest.json SHA-256 목록을 포함했다. MariaDB helper 작업은 /usr/lib/tastedev-linux/scripts/admin 위치에서만 허용한다. 전체 부모/런타임 경로 root 소유권·쓰기 권한·symlink를 검사하고 manifest의 정확한 파일 집합과 각 파일의 소유권·nlink·크기·hash를 확인한 뒤 import한다. include 그래프에 포함된 운영 파일/부모도 root 소유 여부를 검사한다. 입력으로 코드 위치/명령/백업 경로를 받지 않는다. 고정 명령 argv·60초 단위 timeout·2MB 출력 제한·고정 환경을 사용하며 명령 실패 원문을 노출하지 않는다. main은 async dispatch를 기다리는 동안 기존 관리자 잠금을 유지한다.

인증 API mariadb-apply는 DB 변경/sudo 권한과 명시적 재시작 확인을 요구한다. 단일 파일/전체 연결 계획을 재검사하고 고정 helper payload로 변환한다. 요청·완료·롤백·수동 복구 필요·실패를 감사 기록한다. GUI는 변경 계획에서 적용 확인을 제공하고 작업 중 폼/include 선택을 잠그며 결과·검사 방식·백업 ID를 표시한다.

전체 테스트 116개 PASS: 기존 파일/실행 대체 fixture 외에 checkout 실행·쓰기 가능 runtime·잘못된 manifest·checksum 변조 거부 및 적용 API 로그인/권한 차단 검사 추가. 렌더 fixture에 새 컴포넌트 모듈 stub을 추가했다. production build PASS. 임시 계정 HTTP에서 MariaDB apply 401/403 포함 회귀 PASS. 실제 sudo helper 성공 실행·MariaDB 바이너리 검사·DB 재시작·브라우저 버튼 조작은 미검증이다. 운영 파일·서비스·sudo 설정 변경 없음. 전체 목표 PARTIAL 유지.

직접 일반 사용자 helper 실행 검사에서 앱의 type: module 아래 확장자 없는 CJS helper가 require 오류로 종료되는 기존 문제를 발견했다. scripts/admin/package.json에 type: commonjs를 명시하고 패키지에 포함했다. 수정 후 직접 실행은 기대한 Root required로 종료한다. 패키지 verifier는 추출 helper를 일반 사용자 getuid 대체로 로드해 Root required만 반환하는지 검사한다(관리 작업/운영 파일 접근 없음).

최종 전체 테스트 117개 PASS. 패키지 helper allowlist/9개 모듈 목록 일치와 CommonJS 메타데이터 회귀 검사를 추가했다. 기본 샌드박스의 자식 프로세스 stderr 전달 제한 때문에 새 helper 실행 검사가 빈 stderr로 실패했으며, 운영 변경 없는 동일 verifier를 승인된 실행 환경에서 재검사해 PASS를 확인했다. 추출된 runtime 전체 hash 및 import와 helper 일반 사용자 거부를 확인했다. 최종 .deb SHA-256 5467721ea6b305624c27c51a183a72b3c19f6e84b001aa7ceb063a89671a18fe, 10373개 파일, 실제 설치 없음. 8791 미리보기 반영. root 실제 적용 및 MariaDB 재시작 성공 검증은 미완료다.

## 2026-10-03 MariaDB 설정 백업 메타데이터 조회

root helper에 mariadb-backups 작업을 추가했다. /var/lib/linux/admin/mariadb private 디렉터리의 UUID JSON만 최대 1000개 검사하며 최신 100개 메타데이터를 반환한다. 파일 descriptor를 O_NOFOLLOW로 열어 root 소유권·nlink·private 권한·크기를 검사하고 ID/대상 허용 경로/시각/내용 크기/NUL/hash를 대조한다. 손상·심볼릭 링크·공개 권한 기록은 제외한다. 원문은 서버 내부에서만 검사하고 응답에 포함하지 않는다.

인증 GET API는 sudo 옵션과 관리자 helper 실행 조건을 요구한다. MariaDB 폼에 수동 백업 조회 버튼과 메타데이터 표를 연결했다. 접속 변경·unmount 뒤 늦은 응답을 무효화하고 접속 변경 시 busy를 초기화한다. 수동 복원 기능·실제 root 백업 조회 성공 E2E는 아직 남아 있다.

전체 테스트 118개 PASS, production build PASS. 임시 파일/root 소유권 대체 fixture에서 유효 기록만 반환·hash 손상/공개 권한/symlink 제외·원문 비노출·공개 디렉터리 거부를 검사했다. 운영 파일/서비스 변경 없음. 전체 목표 PARTIAL 유지.

임시 계정 HTTP 회귀 PASS: MariaDB 백업 조회 미로그인 401·sudo 옵션 비활성 403 확인. 최종 .deb 추출/권한/hash/runtime import/helper 일반 사용자 거부 검증 PASS, 10373개 파일, SHA-256 08dd8c07eadf5d8a24387fcb7faaff4013435ccfbbe668235c0eb1c355568f95. 8791 미리보기 반영. 실제 패키지 설치·root 백업 조회·브라우저 조작은 미검증이다.

## 2026-10-03 MariaDB 백업 복원 검토 연결

MariaDB root runtime 소유권/권한/hash 로딩 검사를 공통 함수로 분리하고 운영 include 파일 읽기도 공통 검사로 묶었다. 각 파일/부모 root 소유권·쓰기 권한·hash를 대조하며 UTF-8 오류를 거부한다. mariadb-restore-plan 작업은 private 백업 검증 후 선택 main의 완전한 그래프에 백업 대상이 포함되는지 확인하고 현재/백업 지원 설정만 비교한다. 마지막에 전체 그래프 버전을 다시 검사한다. 응답에 파일/전체 버전과 백업 버전을 포함하며 원문을 반환하지 않는다. 복원 실행은 제공하지 않는다.

인증 GET API는 sudo 옵션/helper 조건을 요구한다. 백업 표에 main 선택과 복원 검토 버튼을 추가하고 지원 값 비교·경고·전체 파일 복원 영향 안내를 표시한다. main/접속 변경 시 계획·늦은 응답을 무효화하며 main 변경에도 백업 목록은 유지한다.

전체 테스트 118개 PASS(백업 fixture에 복원 검토 assertion 추가), production build PASS. 임시 파일·root 소유권/runtime 대체 fixture로 현재/백업 port 비교·원문 비노출·graphVersion 반환·검토 중 그래프 변경 거부·미포함 대상 거부를 검사했다. 실제 root runtime의 복원 검토 성공·브라우저 조작·복원 실행은 미검증/미완료다. 운영 파일/서비스 변경 없음. 전체 목표 PARTIAL 유지.

임시 계정 HTTP 회귀 PASS: MariaDB 복원 검토 미로그인 401/sudo 옵션 비활성 403 확인. 최종 .deb 검증 PASS(10373개 파일), SHA-256 959d6f735332f5cd255291d6b7ccb3db989ab0d3ceb4a83a1bf8282fe1889d00. 8791 미리보기 반영. 실제 설치·root 복원 성공·브라우저 조작을 의미하지 않는다.

## 2026-10-03 MariaDB 전체 파일 복원 실행 연결

구조 조회의 내부 override Map으로 백업 대상 파일의 내용을 가상 대체해 복원 후 include 연결을 해석한다. 운영 파일에 먼저 쓰지 않는다. 후보 생성은 복원 전체 파일 및 새로 참조되는 include 파일을 private 후보로 복사·재연결하고 원본과 복원 그래프를 재대조한다. 생성 후보의 restoreVersion을 등록 객체와 검사 콜백에 결합한다. 복원 검사에는 패치 요청 필드가 없으며 native 설정 검사 또는 옵션 파싱 검사와 고정 my_print_defaults 검사를 수행한다. 옵션 파싱은 서버 시작 성공 검증을 대체하지 않는다.

내부 트랜잭션은 복원 전/후 전체 연결과 새 참조 파일 변경을 확인한다. 기존 파일을 private 백업한 뒤 전체 백업 내용으로 교체하고 재시작한다. 실패 복원은 선택 백업이 아니라 실행 직전 파일로 돌아가며 원래 그래프를 대조한 뒤 서비스 복구를 시도한다. helper는 private 백업 hash와 현재 파일/그래프 버전, 복원 그래프의 모든 파일/부모 root 소유권을 확인한다. 백업 원문은 클라이언트 입력으로 받지 않는다.

인증 POST는 DB 변경/sudo 권한을 요구하며 요청/완료/롤백/수동 복구 필요/실패를 기록한다. GUI는 전체 파일·인증/include/지원 외 설정·재시작 영향을 명시해 확인을 받고 작업 중 폼과 main 선택을 잠근다. 결과와 새 백업 ID를 표시한다.

전체 테스트 123개 PASS, production build PASS. 임시 파일/대체 명령으로 전체 파일 복원·새 include 연결·직전 파일 백업·원문 비노출·새 참조 파일의 검증 중 변경 거부·재시작 실패 시 직전 파일 복원 및 서비스 복구·허용 밖 include 거부를 검사했다. 백업 fixture에 확인 누락·백업 hash 불일치 거부를 추가했고 API 로그인/DB 권한 차단도 검사했다. 실제 root helper 복원 성공·MariaDB 명령·서비스 재시작·브라우저 버튼 조작은 미검증이다. 운영 파일/서비스 변경 없음. 전체 목표 PARTIAL 유지.

임시 계정 HTTP 회귀 PASS: MariaDB 복원 미로그인 401·DB 변경 권한 비활성 403 확인. 최종 .deb 추출/권한/hash/runtime import/helper 일반 사용자 거부 검증 PASS(10373개 파일), SHA-256 bf6817e5e179e403c07046f704eb30581a0f4f94f2d4511fca7bad14ebe064e3. 8791 미리보기 반영. 실제 설치·root 복원 성공·MariaDB 재시작은 미검증이다.

## 2026-10-03 MariaDB 실행 서비스 main/시작 범위 검사

root helper가 고정 mariadb.service MainPID를 읽고 숫자/크기를 검사한다. /proc/<PID>/exe가 검사 바이너리 /usr/sbin/mariadbd의 canonical 파일과 일치하고 바이너리/부모가 root 소유·쓰기 금지인지 확인한다. cmdline을 O_NOFOLLOW descriptor로 최대 16KB 읽고 PID를 재대조한다. main alias는 /etc 안의 root 소유 symlink/쓰기 금지 부모를 최대 16단계 따라가며 최종 허용 main만 인정한다.

순수 내부 parser는 명시적 defaults-file과 선택 main의 canonical 경로를 대조한다. 다른 main·추가 defaults·no-defaults·그룹 suffix·포트 등 덮어쓰기·지원 외 플래그를 거부하고 원문 argv를 반환하지 않는다. mysql user와 제한된 wsrep start position만 부가 인수로 허용한다. 명시적 main과 기본 main 경로 가정을 구분하며 기본 검색 파일/실행 환경의 나머지 영향은 미확인 안내를 제공한다. 즉 default-main-assumed를 전체 실행 설정 검증 PASS로 확대하지 않는다.

적용/복원 트랜잭션은 사전·파일 교체 직전·재시작 전후에 이 검사를 수행하고 실패 복구 후에도 재검사한다. GET 인증 API와 GUI 서비스 main 확인 버튼을 추가하며 결과/복원 결과에도 원문 없는 범위 안내를 표시한다. 패키지 root runtime 의존성은 10개 모듈이다. 실제 서비스가 중단되어 MainPID가 없거나 지원 외 시작 옵션을 쓰면 작업이 차단된다. 중단 서비스 복원/다른 시작 옵션 지원과 전체 기본 검색·환경 검증은 남아 있다.

전체 테스트 128개 PASS, production build PASS. 대체 proc/fs/systemctl fixture에서 PID/크기/실행파일/alias 소유권과 부모 쓰기 권한 검사를 확인했다. 순수 parser는 명시/기본 main 구분·원문 비노출·부가 defaults/그룹/설정 덮어쓰기/비밀 인수 거부를 검사했다. 파일 fixture는 초기 main 불일치 시 명령/백업 없음과 교체 직전 범위 변경 시 파일/서비스 보존을 확인했다. 임시 계정 HTTP 회귀에서 서비스 main 확인 미로그인 401/sudo 옵션 비활성 403 검사 PASS. 실제 root/proc 서비스 검사 성공·MariaDB 적용·브라우저 조작은 미검증이다. 운영 파일/서비스 변경 없음. 전체 목표 PARTIAL 유지.

최종 .deb 추출/권한/hash/runtime import/helper 일반 사용자 거부 검증 PASS(10374개 파일), SHA-256 7619dc4da50dd2382cf7be63a43f152da87883725ce893df2a7bad9ab03611a3. 8791 미리보기 반영. 실제 패키지 설치·root 서비스 범위 검사 성공·MariaDB 적용/복원·브라우저 조작은 미검증이다.

## 2026-10-03 실제 MariaDB 바이너리 옵션/후보 진단

선택 실행형 scripts/verify-mariadb-native.mjs와 npm run verify:mariadb:native를 추가했다. Docker Desktop context의 endpoint가 현재 사용자 로컬 Unix socket인지 대조하고 cached 공식 이미지의 현재 ID를 고정한다. 네트워크 none·read-only root·cap-drop ALL·no-new-privileges·PID 64/메모리 512MB/CPU 1 제한을 사용한다. 생성한 private 후보만 tar stdin으로 container /tmp tmpfs에 복사하며 host bind mount는 없다. 생성 사용자 UID/GID로 진단하며 별도 datadir=/tmp를 적용한다. raw 옵션/진단은 출력하지 않고 허용된 오류 분류만 수집한다. own UUID container의 제거 확인 후에만 PASS 증거를 기록한다.

처음 host /tmp bind 전달 시 Docker Desktop mount 오류(exit 125)가 발생했다. 초기 후보 진단 실패를 실제 MariaDB 설정 오류나 PASS로 확대하지 않았다. stdin tar 전달로 수정한 뒤 정상 후보·뒤쪽 include 덮어쓰기·잘못된 실제 옵션·전체 복원 후보와 새 include 파일 검사를 실행했다. systemctl은 mock이며 DB daemon/접속/서비스는 시작하지 않았다. 호스트 운영 패키지·sudo·서비스 설정은 변경하지 않았고 Docker Desktop 공식 이미지 cache와 ephemeral 검사 container만 사용했다.

실제 이미지 MariaDB 11.4.13(amd64), image digest sha256:1292844148b311e4ed4300022a996d39083f415a963e970cf47cad1b3b18e3a6, 실행 바이너리 SHA-256 3b704c5022132a89d61885127bdabdf39f4ffbce618355aeebca1a6c096113fc. 검사 방식 options-help이며 전용 validate-config 모드 PASS가 아니다. 실제 native 후보/지원 값 검사, 나중 include 충돌 거부, unknown option의 실제 invalid-option 분류 및 민감 진단 제외, 전체 복원 private 후보/새 include 진단이 통과했다. 실행 중 값·운영 datadir·root helper/systemd 성공·DB 재시작·실제 API 적용·브라우저 GUI는 이 검사 범위가 아니다. 전체 목표 PARTIAL 유지.

최종 증거: .runtime/verification/mariadb-native-2026-10-03T01-44-10.057Z.json(PASS). 이번 변경은 개발 검증기·증거·문서이며 앱 runtime/화면 변화가 없어 production build/.deb/미리보기를 반복 갱신하지 않았다. 일반 단위 테스트 마지막 확인은 128개 PASS이며 native fixture 4개와 구분한다. 옵션 그룹 자료: https://mariadb.com/docs/server/clients-and-utilities/administrative-tools/my_print_defaults , https://mariadb.com/docs/server/server-management/install-and-upgrade-mariadb/configuring-mariadb/configuring-mariadb-with-option-files .

## 2026-10-03 실제 PostgreSQL 설정 파서 및 공통 격리 진단

개발용 scripts/verify-postgresql-native.mjs와 npm run verify:postgresql:native를 추가했다. 격리 실행·private 파일 검사·stdin tar 전달·민감 진단 제외·UUID/label 기반 자신의 컨테이너 정리를 scripts/native-diagnostics.mjs로 분리하고 MariaDB 검증기도 사용하도록 변경했다. 두 검증기를 실제로 실행했고 각각 네 가지 native 사례가 PASS다. 호스트 bind mount, DB 기동/접속, 호스트 패키지/서비스/sudo 변경은 없다.

PostgreSQL 16.15 (Debian 16.15-1.pgdg13+2), amd64. 이미지 digest sha256:1a6ab3f5345eb6dbe04a1349529caabdb0ab09293a09590fad07b2246bfa4b54, postgres 실행 바이너리 SHA-256 ea528a9f858bce5eef557522820c945a3d3b9fd260a15d6d0313d6350574229d. 실제 postgres -C 결과로 port/max_connections/shared_buffers/work_mem/logging_collector를 검사했다. 256MB shared_buffers는 32768, 8MB work_mem은 8192로 조회됨을 확인했다. 뒤쪽 include의 port 덮어쓰기를 확인하고 잘못된 옵션을 invalid-option으로 분류하며 전체 복구 텍스트/include 파싱을 검사했다. 기존 원본 fixture는 보존됐다.

PostgreSQL 증거 .runtime/verification/postgresql-native-2026-10-03T01-56-12.412Z.json. 공통 실행기 변경 후 MariaDB 회귀 증거 .runtime/verification/mariadb-native-2026-10-03T01-56-16.597Z.json. 두 스크립트 구문 검사 PASS. PostgreSQL은 공통 patchConfig 생성 후보와 실제 파서/단위를 검증하며 CJS root helper 자체, runuser 권한, pg_ctlcluster, 서비스 재시작/복구/API/GUI 성공은 미검증이다. 개발 검증 도구 변경이므로 기존 production build/.deb/미리보기는 유지했다. 전체 목표 PARTIAL 유지.

## Redis 실행 범위 검사 준비

lib/redis-service-scope.mjs에 명시적 /etc/redis/redis.conf 및 고정 foreground/systemd 옵션만 허용하는 내부 검사를 추가했다. 다른 main/port/include/인증 옵션/중복 옵션/누락 값/긴 입력은 원문 없는 409로 거부한다. PID·실행파일·root 소유권 검사는 호출자 책임이며 아직 helper/API/GUI에 연결하지 않았다. Redis가 process title을 다시 쓰는 경우 원래 argv를 증명할 수 없으므로 이 parser는 차단한다. 실제 서비스 조회·Redis 설정 적용/백업/복구는 미완료다. include 및 실행 중 값의 일치도 이 parser가 증명하지 않는다. Redis 설정 자료: https://redis.io/docs/latest/operate/oss_and_stack/management/config/ .

## Redis include 그래프 내부 구현

lib/redis-topology.mjs에 /etc/redis/redis.conf에서 시작하는 literal 절대 include 파일 순서·SHA-256·크기·그래프 버전 수집을 추가했다. 파일 원문/인증값은 반환하지 않는다. 순환·검사 한도·symlink·hardlink·잘못된 UTF-8·범위 밖 경로·glob/지원 외 구문은 complete:false다. glob 지원과 원자적 적용 시 그래프 재검사, root 소유권 검증, helper/API/GUI 연결은 아직 남아 있다. 두 fixture에서 연결 순서/버전 변경/비밀 비노출 및 불완전 그래프 거부를 검증했다. 운영 Redis 프로세스·설정·접속을 변경하지 않았다.

Redis include의 directory/\*.conf 패턴을 추가 지원한다. 숨김 파일 제외·파일 목록 SHA-256·빈 디렉터리·파일 추가/변경·symlink 거부 fixture를 검증한다. 다른 glob 패턴/escape는 아직 불완전 상태다. 목록의 ASCII 정렬은 구조 검사 용도이며 실제 Redis/libc locale의 최종 옵션 적용 순서를 증명하지 않는다. Redis 7.2 upstream config.c의 glob(0) 및 no-match 허용 동작을 확인했다: https://github.com/redis/redis/blob/7.2/src/config.c . helper/API/GUI 및 실제 native/운영 적용 검증은 미완료다.

Redis 그래프 순회 후 wildcard 디렉터리 목록을 다시 대조하고 내부 assertRedisGraphVersion precommit 검사를 추가했다. 최초 검사 이후 include 파일 추가/내용 변경을 409로 거부하며 잘못된 버전은 400이다. 파일 시스템 전체의 원자적 snapshot은 아니며 실제 트랜잭션/helper 연결과 변경 직전·서비스 활성화 전후 호출은 아직 필요하다. 운영 서비스 변경 없음.

Redis include 조회를 인증 GET redis-topology API와 패키지 GUI에 연결했다. 수동 조회·파일/연결/경고/버전 표시, 연결 해제 및 늦은 응답 제외를 구현했다. 원문/인증값은 응답에 포함하지 않으며 root 명령은 실행하지 않는다. production build PASS. 기존 package-config 렌더 테스트에 새 자식 컴포넌트 mock을 추가했다. 실제 브라우저 조작·운영 적용/복구와 새 .deb 갱신은 미완료다.

Redis GUI 수동 조회 버튼의 연결/비연결 렌더와 render 중 API 호출 없음 회귀를 추가해 전체 135개 테스트 PASS. 8791 실제 HTTP 미로그인 GET /api/redis-topology는 401. 인증 성공 후 실제 GUI 클릭/파일 조회는 아직 미검증이다. 신규 서버 deb 생성 SHA-256 1e7bd42b4face2798007ba6574f8e0eb75e41ef2ded270619234efda185ec102, 설치하지 않았다.

Redis private 전체 후보 생성기를 추가했다. main만 GUI 지원 값으로 patch하고 literal/include wildcard를 private 경로로 바꾸며 연결 파일과 빈 wildcard 디렉터리를 복사한다. source 파일을 변경하지 않는다. 생성 전후 graph 버전 및 복사할 파일 hash를 대조하고 디렉터리 700/파일 600, WeakSet 후보 등록 및 cleanup 등록 해제를 검사했다. 실제 Redis native 파서/최종 값 진단, full restore 후보, root helper/트랜잭션/API/GUI 적용 연결은 아직 남아 있다. 비공개 후보에는 인증값이 포함될 수 있으므로 HTTP 응답에 노출하지 않는다.

Redis 전체 복구 후보에 trusted restoreText 가상 main을 지원했다. 원본 graph 버전을 보존해 대조하고 복구 텍스트의 include 그래프를 별도로 생성해 새 참조 파일을 private 후보에 포함한다. 복구 텍스트 hash와 후보 graph 버전을 등록하고 생성 후 두 그래프를 다시 검사한다. 복구와 GUI 변경 동시 입력 및 미해결 복구 include는 거부한다. fixture에서 인증값을 포함한 전체 텍스트/새 include 복사와 원본 보존을 확인했다. 실제 백업 record의 root 검증/복구 실행/Redis native 검증/GUI 적용 연결은 미완료다. 새 internal 코드의 배포 빌드 갱신은 다음 연결 작업과 함께 필요하다.

Redis private 백업 record reader/catalog을 추가했다. UUID/고정 target/텍스트 hash/날짜/크기/UTF-8 및 fd O_NOFOLLOW·소유권·private 권한·nlink를 검사하고 목록에서는 text를 제외한다. opendir 전체 1000개 scan·목록 100개 한도를 둔다. private 임시 fixture로 정상 전체 record/민감값 없는 목록/공개 권한·잘못된 target·symlink 거부를 검증했다. root helper/API/GUI 연결과 실제 백업 생성·복구 실행은 미완료다. Redis 실제 native 후보 진단에 필요한 격리 서버 실행 승인 질문은 답변 대기 중이며 승인 전 서버를 시작하지 않는다.

Redis 백업 목록을 packaged runtime hash 확인 후 helper redis-backups, sudo 옵션/관리 모드 인증 GET API, 패키지 GUI의 메타데이터 표에 연결했다. root runtime closure는 11개 모듈이며 Redis 백업 reader의 dependency 검사도 추가했다. 서비스/설정 변경 명령은 없다. 실제 root 조회 성공·브라우저 조작·복원 GUI/실행은 미검증이다. 기존 .deb는 새 helper 연결을 아직 포함하지 않으며 다음 패키지 갱신이 필요하다.

Redis 복구 검토 helper redis-restore-plan 및 인증 GET을 추가했다. private backup record/root 부모/file hash 확인 후 main 지원 값만 비교하며 현재/복구 include 그래프 버전을 재대조한다. 원문과 인증값은 응답에서 제외한다. packaged runtime closure는 12개 모듈이다. VM 대체 root/runtime fixture로 값 비교·민감값 제외·graph 변경 거부를 검사했다. 실제 root 조회 성공·복구 GUI/실행·최종 native 후보 진단은 미검증이며 배포 빌드와 패키지 갱신도 남아 있다.

Redis 백업 목록에 복원 검토 선택과 지원 값 비교·전체 파일 영향 안내·경고 GUI를 연결했다. 연결/권한 변경 시 선택을 해제하고 늦은 조회 응답은 제외한다. 139개 테스트와 production build PASS, 8791 preview 반영. 실제 복원 실행은 연결 전이고 root/API 성공 및 GUI 조작은 미검증이다. 새 배포 패키지는 생성 진행 중이며 추출 검증이 남아 있다.

Redis 조회/복원 검토 포함 .deb 추출 검증 PASS(10376파일), SHA-256 79b59e06b32e0e8257daffb042ae52a08fc5b8edec46b40cfa8308ae93dc6e90, 설치 없음. 이어서 internal applyRedisConfig를 추가해 mandatory native validator/service inspection·private 후보·원본/후보 graph 재대조·백업/원자 교체·활성화 실패 rollback을 조합했다. 현재 validator/서비스 함수는 테스트 대체 함수만이며 실제 root dispatch/API/GUI 적용 연결은 하지 않았다. 임시 파일 fixture의 재시작 실패 복구 및 검증기 없는 요청 차단을 검사한다. 실제 Redis/서비스 실행은 없음.

Redis transaction fixture를 확대했다. 후보 검사 중 기존 include 변경은 409로 중단하며 백업/활성화가 없다. 활성화 중 main 외부 편집은 보존하고 자동 복원/서비스 recovery를 실행하지 않는다. 전체 복구가 새로 참조하는 include의 검사 후 변경도 precommit 409로 막고 main을 보존한다(직전 원본 백업은 검토용으로 유지). 실제 native Redis/서비스 실행이 아닌 대체 hook/임시 파일 검사다. root/helper/API/GUI 적용과 실제 E2E는 여전히 미완료다.

Redis 메모리 제거 정책을 공식 8개 정책으로 확장했다: noeviction, allkeys-lru/lfu/random, volatile-lru/lfu/random/ttl. schema와 생성기 선택값을 하나의 상수로 공유해 GUI/초안/live import에서 동일하게 허용한다. 모든 정책 왕복 및 알 수 없는 값/명령 주입 거부 fixture를 추가했다. 공식 자료 https://redis.io/docs/latest/develop/reference/eviction/ . 실제 Redis 설정 적용/동작 검증은 여전히 미완료다.

Redis GUI 운영 변경 계획에 complete include graph 버전을 연결했다. 계획 생성 전후 topology를 대조하고 main 파일 snapshot과 graph 파일 hash를 맞춘다. graphVersion이 주어지면 stale include를 409로 거부한다. 지원 값만 비교하며 최종 native 설정값을 증명하지 않는다. source/include fixture 검사 포함 전체 145개 PASS. 실제 적용/복구와 native Redis 검증은 미완료다. 배포 .deb는 최근 schema/plan 변경을 아직 포함하지 않는다.

임시 계정/18793 검증 서버의 실제 HTTP 회귀 PASS. Redis topology/backups/restore-plan 미로그인 401, topology 로그인 후 200(metadata only), backups/restore-plan sudo 비활성 403을 확인했다. Redis 허용 대상 경로를 graph 조회 전에 검사해 잘못된 경로는 400을 유지한다. 전체 테스트 145개 및 build PASS. 증거 .runtime/verification/redis-topology-http.json. 관리자 기능 전부 false, 임시 workspace/state/auth 사용 후 검증 서버 종료 및 fixture 삭제, 운영 OS 변경 없음. 실제 root 조회 성공과 GUI 클릭/Redis 적용/복구는 미검증이다.

Redis include/백업/복구 검토의 제목·graph 안내·복구 미연결 안내·디렉터리 변경 경고·재조회/대상 오류 등 8개 문구를 영어·일본어·중국어·독일어·프랑스어·스페인어에 추가했다. 전체 테스트 145개 PASS. 전체 Linux locale 완전 번역이나 주요 언어 전체 UI 완전 번역 완료를 뜻하지 않으며 나머지 누락 문구 및 브라우저 언어 전환 검증이 남아 있다.

Redis topology/candidate/backup reader는 open 전에 일반 파일 여부를 검사하고 O_NONBLOCK|O_NOFOLLOW로 열어 FIFO 교체에도 writer를 기다리지 않도록 보완했다. 실제 mkfifo 임시 fixture의 include/백업 거부 검사 포함 전체 146개 PASS. 특수 파일 조회로 무한 대기하는 경로를 수정했으며 운영 파일/서비스 변경 없음. 실제 root/native/GUI 전체 E2E는 여전히 미완료다.

최근 Redis 8개 제거 정책/계획 graph 검사/6개 언어 문구/특수 파일 거부를 반영한 .deb 생성·추출 검증 PASS(10376파일). SHA-256 fcec5f55fdfc14242ee3a9eef6021cfc1bf9dd319bb525e9650261cc4b9a5ab3. Redis topology/backups runtime의 hash와 실제 module export import까지 추가 확인했다. 증거 .runtime/verification/package-2026-10-03T02-29-14.782Z.json. installed:false. 실제 설치/업데이트·root/Redis 적용/복구·GUI E2E와 전체 locale 번역은 미완료다.

Redis 폼에서 선택한 제거 정책의 설명을 표시한다. 전체 키/TTL 대상, 근사 LRU/LFU/무작위/TTL 우선, noeviction 쓰기 거부를 구분하며 TTL 대상 없음 및 maxmemory=0의 영향도 안내한다. 한국어/영어 리소스를 추가했고 기타 언어는 영어 fallback이다. 전체 테스트 146개 PASS. 설명 기준 https://redis.io/docs/latest/develop/reference/eviction/ . 실제 정책 실행/브라우저 선택 E2E와 전체 요구사항은 미완료다.

테마 버튼의 localStorage 예외 경로를 수정했다. 화면/메모리 선택을 먼저 적용하고 저장 실패는 색상 변경을 막지 않는다. media 변경 시 수동 선택을 우선하며 storage event로 다른 탭의 테마 변경을 반영한다. 기존 회귀 146개 PASS. 실제 저장소 차단/탭 간 동기화 브라우저 E2E는 접근 제한으로 미검증이고 전체 목표 PARTIAL이다.

테마 버튼 SWC 컴파일 후 대체 React hooks/storage/media/window fixture로 저장 실패와 읽기 실패에도 DOM 테마 적용, media 이벤트 뒤 수동 선택 유지, 관련 storage 이벤트 동기화, 무관한 key 무시, 이벤트 cleanup을 검사했다. 이는 로직 단위 검사이며 실제 브라우저 로그인/페이지 이동/초기 paint 확인을 대체하지 않는다. 화면 runtime 변경 없이 회귀 증거만 추가했다.

초기 테마 script를 theme-init.mjs로 분리하고 storage 오류와 matchMedia 오류를 독립적으로 처리한다. 저장소가 차단돼도 OS dark 선호를 유지하며 명시적 light/dark는 시스템값보다 우선한다. VM에서 저장/차단/잘못된 값/환경 API 없음 초기 결정 검사를 추가했다. 실제 browser first-paint/페이지 이동 E2E는 미검증이다.

웹 터미널 stdout/stderr를 별도 StringDecoder UTF-8 스트림으로 해석하도록 변경했다. 실제 일반 사용자 shell fixture에서 한글/emoji 바이트를 시간차로 나눠 출력해 원래 문자열로 결합되는지 검사한다. 운영 서비스 명령/원격 접속은 실행하지 않는다. 현재 터미널은 비대화형 120초 job이며 PTY/대화형 입력 및 실제 브라우저 E2E는 미완료다.

웹 터미널 pipe stdin 전송과 EOF를 추가했다. terminal-input 인증/동일 출처/terminal 권한 API, 4096바이트 입력 제한·대기 버퍼 한도·종료 작업 거부를 적용한다. GUI 입력은 useState만 사용하고 draft/history/job metadata에 입력 원문을 저장하지 않는다. child 자체가 출력하는 입력은 stdout로 보일 수 있다. 실제 read/cat 일반 사용자 임시 shell fixture 및 종료 뒤 입력 거부 검사 PASS, 전체 148개 PASS. PTY/대화형 SSH·sudo·브라우저 조작 E2E는 미완료다.

terminal-input의 완료/차단/실패를 route 감사 기록에 포함했다. 임시 계정/18793 서버에서 미로그인 401, 로그인 후 terminal 권한 비활성 403, blocked 감사 event, 입력 원문 비포함 실제 HTTP PASS. 증거 .runtime/verification/terminal-input-http.json. build PASS. 실행 terminal/admin flags false였고 OS 서비스 변경 없음. PTY/실제 GUI 입력 E2E와 전체 목표는 미완료다.

러시아어/아랍어 로그인·기본 탐색 24개 문구 catalog를 추가했다. 지역 locale도 공유 catalog를 사용하며 나머지는 기존 영어 fallback이다. 영어 기준 catalog 항목 coverage를 계산해 목록의 부분 번역은 Partial UI, catalog 없는 언어는 English UI로 표시한다. coverage는 실제 모든 동적 UI 문구의 완전 번역을 증명하지 않는다. 전체 149개 테스트 PASS. RTL 실제 레이아웃/브라우저 전환 및 전체 locale 완전 번역은 미완료다.

nginx 네이티브 문법 검증: `npm run verify:nginx:native`. `/usr/sbin/nginx`와 `/usr/bin/openssl`이 필요하며 임시 prefix/config와 자체 서명 테스트 인증서만 검사합니다. `nginx -t`만 실행하며 서비스 시작·재로드·운영 파일 변경은 하지 않습니다. 생성 설정 4종과 잘못된 directive 거부를 검사하고 바이너리 SHA-256 증거를 기록합니다. 소켓 생성이 차단된 샌드박스에서는 검사 실패로 기록하며 PASS로 간주하지 않습니다.

패키지 HTTP 검증은 nginx-validate 성공 경로를 실제 /usr/sbin/nginx로 확인하므로 해당 실행 파일과 일반 사용자 실행/임시 socket 검사 권한이 필요합니다. 없는 경우 검증 실패를 PASS로 간주하지 않습니다. 운영 nginx 설정을 적용하거나 재로드하지 않습니다.

PTY terminal verification: `npm run verify:terminal:pty` runs fixed fixture-only commands in a temporary workspace and records private evidence under `.runtime/verification`. It requires local PTY permission and verifies app launch, stdin/stdout TTY, secret environment removal, non-echoed line input, one active command, stop and Ctrl+C. It does not connect SSH, run sudo, modify services or prove browser terminal-emulator behavior.

`npm run package:verify -- --terminal` additionally enables terminal execution only on the extracted package's temporary verification server and fixture security settings. It runs a fixed TTY/read/length-print command, checks authentication/origin/mode validation and late input rejection, and removes the fixture state. Default package verification leaves terminal disabled.

### Local apt repository validation

After a successful production build and `npm run package:deb`, run `npm run package:apt`. Use the newly returned repository directory rather than an older repository, which retains its original package bytes.

Run `node scripts/verify-apt-repository.mjs dist/apt-repository-<generated-id>` to check index identity, package SHA-256, gzip roundtrip and Release checksums. This does not verify a production signature.

Run `node scripts/verify-apt-signing.mjs dist/apt-repository-<generated-id>` against an unsigned repository for isolated synthetic-key testing. It clones the repository, creates a temporary key and separate apt configuration/state, authenticates the file repository, checks the candidate and downloaded package hash, and rejects tampered metadata. It installs no package and cleans its fixtures. GPG agent socket creation may require approved execution outside the sandbox.

Production signing requires the user's full public key fingerprint and publication destination. Isolated verification does not prove HTTPS publication, real installation, upgrades or service operation.

### Node service unit native validation

`node scripts/verify-node-unit-native.mjs` creates private temporary app/unit files and uses the root-owned `/usr/bin/systemd-analyze --man=no verify` parser. It never registers units, reloads the manager, starts apps or enables services. PASS requires all generated restart policies to validate and a missing executable to be rejected. Native rejection is recorded as BLOCKED with a nonzero exit; missing `/usr/bin/node` is not treated as success. The current app can run through another Node runtime while its generated service still requires `/usr/bin/node`.
