# 터키어 UI 진행 상태 (2026-10-06)

현재 상태: 터키어 UI 카탈로그 1452/1452개. 아래 부분 번역 기록은 이전 단계의 이력이다. 전체 카탈로그 충족은 자동 키/문구 범위 판정이며 원어민 검수·모든 Linux 언어 및 실제 운영 환경 전체 수용 완료는 아니다.

`lib/locales/tr.json`의 249개 문구를 공통 UI 카탈로그에 연결했다. 기존 193개에 Certbot 및 인증서 공통 문구 56개를 추가했다. 로그인, 메뉴, 테마, 기본 작업 버튼, 보안 옵션, 인증서 발급/갱신·인증 방식·작업 안내가 포함된다. 미번역 문구는 기존 영어 fallback을 유지하며 언어 선택에서는 부분 번역으로 표시한다. 전체 터키어 번역 완료로 판정하지 않는다.

`node --test --test-isolation=none tests/i18n.test.mjs tests/language-preference.test.mjs`: 최신 변경에서 16개 통과. 번역 키, 비어 있지 않은 값, 보간 변수 보존, 부분 번역 표시, 지역 언어 해석 및 기존 SSR 언어 설정을 확인했다.

실제 개발 브라우저에서 tr-TR을 선택하고 Certbot 발급 폼의 인증 방식·staging 안내·동의 항목·버튼 표시를 확인했다. 일부 영어 fallback도 남아 있다. 스크린샷: `/tmp/tastedev-certbot-turkish-20261006.png`. 확인 후 원래 ko-KR로 복원하고 검수 탭을 닫았다. ACME 동의/발급은 실행하지 않았다. 원어민 검수 및 이번 변경의 운영 빌드는 수행하지 않았다.

## nginx 설정 설명 추가

터미널 표시 설정까지 반영된 263개 카탈로그에서 nginx 관련 216개 문구를 추가해 현재 터키어 카탈로그는 479개다. 기본 설정, HTTP 프록시/TLS/FastCGI, stream/mail, map/geo, 캐시·속도 제한 및 블록 설명을 포함한다. 기술 지시어와 제한 조건(예: HTTP URL 미사용, geo delete는 파일 삭제가 아님, nginx 지원 버전)을 번역에 보존했다.

설명 원본 5개 모듈의 현재 한국어 문자열 195개에 직접 터키어 값이 모두 존재하는지 검사했다. 실제 nginxSettingInfo/nginxBlockInfo 함수의 선택 노드 설명 및 터키어 설명 검색을 검사했고 기존 언어/SSR 언어 처리까지 18개 검사 통과. `tests/nginx-turkish-descriptions.test.mjs`. UI 전체 1452개 키 중 479개이므로 언어 선택의 부분 번역 표시를 유지한다. 원어민 검수·실제 GUI·새 전체 빌드 완료를 주장하지 않는다. 직전 363개 소스 빌드는 이번 번역 변경 이전이다.

## 운영 패널 번역 추가

데몬·로그·백업/복구·보안/sudo 규칙·감사 패널 문구 93개를 추가했다. 터키어 전체 카탈로그는 572/1452개다. 5개 관련 소스의 영문 카탈로그 등록 문자열 143개는 모두 직접 터키어 값을 갖는다. nginx -t, sudo -n, PASSWD 및 복구 작업의 영향 설명과 UTC·보간 변수를 유지했다.

기존 터키어 검사가 보간 변수의 영어 등장 순서까지 강제하여 자연스러운 터키어 어순을 실패 처리했다. 변수 이름과 등장 횟수의 다중 집합을 비교하도록 수정했고, 실제 수치 보간을 별도로 검사했다. 최신 운영/설명/언어/SSR 검사 20개 통과: `tests/operations-turkish-ui.test.mjs`, `tests/nginx-turkish-descriptions.test.mjs`, `tests/i18n.test.mjs`, `tests/language-preference.test.mjs`. 실제 GUI·원어민 검수와 전체 UI 번역 완료는 아니다. 이번 변경은 카탈로그/검사이며 직전 빌드 이후 변경 상태다.

## 로그인·GUI 코드 편집 문구

로그인·일반 파일 IDE·패키지 코드 편집·nginx 코드 편집의 터키어 문구 64개를 추가했다. 카탈로그는 636/1452개다. 현재 4개 소스의 등록 문자열 73개에 직접 번역이 존재한다. 뒤에 공백이 있는 파일 작업 라벨도 translate의 trim 처리에 맞춰 검사한다. 파일명 보간과 LINUX_AUTH_ROOT·0700·0600·exFAT 안내를 보존했다.

`tests/editor-turkish-ui.test.mjs`에서 실제 login-screen.jsx를 컴파일하고 React 서버 렌더링에 실제 translate('tr-TR')를 연결해 터키어 로그인·저장소 오류 안내, 권한 숫자, 한국어 미잔존 및 API 호출 부재를 확인했다. Next router·공통 UI·상위 language hook은 독립 렌더용 adapter다. 로그인 HTTP/전체 GUI 또는 원어민 검수로 확대하지 않는다. 관련 언어/SSR 검사 18개 통과. 이번 변경도 카탈로그/검사이며 전체 번역 완료로 표시하지 않는다.

## nginx IDE·패키지 설치 안내

nginx 트리/설정/검수/적용/백업/복원/중단 복구 문구 126개와 패키지 검색·설치 상태 안내 9개를 추가했다. 카탈로그는 771/1452개다. 검토/확인 문구는 실제 운영 파일 변경, 재로드 영향, 원본 복원과 서비스 복구의 성공 범위를 구분한다. 원본 복원 성공 후 서비스 복구 미완료 안내도 그대로 구분했다.

`tests/nginx-turkish-descriptions.test.mjs`에서 현재 nginx-\*.jsx와 console-workspace/chrome의 카탈로그 등록 문구에 직접 번역이 있는지 확인했다. 설명·운영·편집·언어/SSR까지 최신 23개 검사 통과. 실제 패키지 설치/서비스 조작/브라우저 번역 화면·원어민 검수는 수행하지 않았다. 전체 터키어/UI/배포 완료로 판정하지 않는다.

## 패키지 전용 GUI·스키마

PostgreSQL/MariaDB/Redis/Node.js 패널·백업/복원·중단 복구·Node 앱 환경/서비스 문구 303개와 실제 config-schema의 설명/필드/Redis 메모리 정책 문구 44개를 추가했다. 현재 터키어 카탈로그는 1118/1452개다. 작업 폴더 저장과 운영 적용, 클러스터 재시작과 reload 요청 완료, 파일 복원과 서비스 복구의 성공 범위를 그대로 구분했다.

`tests/package-turkish-ui.test.mjs`에서 현재 패키지별 컴포넌트의 카탈로그 등록 문구와 실제 configSchemas/configLabels/redisEvictionDescriptions를 검사한다. 직접 터키어 번역, 기술 식별자(TTL/LFU/systemd/reload) 및 재시작 미수행 안내를 확인했다. 기존 언어/SSR 검사 포함 최신 18개 통과. 실제 운영 DB·서비스 변경이나 전체 GUI/원어민 검수는 수행하지 않았다. 전체 카탈로그가 아직 미완료이므로 partial 표시를 유지한다.

## 현재 카탈로그 충족 확인

나머지 인증/설치/cron/터미널/구문·권한·시간 초과/복구 오류 안내 333개와 기존 정적 작업 라벨 1개를 추가해 터키어 카탈로그의 모든 1452개 키를 채웠다. 기존 languageCoverage에 따라 UI 부분 번역 표시가 해제된다. AI 연결 코드나 키 사용 설정은 변경하지 않았다.

현재 전체 키 일치·값 비어 있음/한국어 잔존·보간 변수 이름/횟수, 설정 설명·운영·편집·스키마/Redis 정책 및 언어/SSR 검사 25개 통과. 모든 외국어 UI 카탈로그 11개의 현재 키 수는 1452개다. 원어민 검수를 의미하지 않는다.

최근 번역을 포함한 363개 소스 빌드 성공: `.runtime/verification/source-build-2026-10-06T01-23-37.021Z/result.json`, snapshot `/tmp/tastedev-current-build-7hm3td`. 실제 현재 개발 서버 `127.0.0.1:8787/login`에 명시적인 linux-language=tr-TR 쿠키와 한국어 Accept-Language를 전달하고 HTTP200, html lang=tr-TR, 터키어 로그인/소개 문구를 확인했다: `.runtime/verification/turkish-login-ssr-20261006/result.json`. 사용자 브라우저 쿠키를 변경하지 않았다. 인증된 관리 화면 GUI 및 운영 서비스·패키지 설치·DEB 검증은 이 범위에 포함하지 않는다.
