# 우크라이나어 UI 확장 — 2026-10-06

기존 우크라이나어 PostgreSQL 설명과 함께 공통 UI를 이용할 수 있도록 uk 카탈로그를 등록했다. 로그인/계정·메뉴·설정·그룹·코드 편집·상태·일부 터미널 문구 171개를 번역했다. 기존 전체 UI 기준 1456개 중 1285개는 아직 영어 fallback이며 언어 선택창은 부분 번역으로 표시한다. 모든 Linux 언어 지원 완료나 우크라이나어 전체 번역 완료로 표시하지 않는다.

검사: i18n 관련 14개 검사와 번역 카탈로그 검사 PASS. uk_UA.UTF-8 → uk-UA, 국기, 지역 카탈로그, 부분 coverage, 영어 fallback 및 placeholder 일치를 검사했다. 현재 소스 368개 빌드 /tmp/tastedev-current-build-vlvjo7 PASS.

실제 브라우저의 별도 읽기 전용 fixture 로그인 페이지에서 우크라이나어 선택·171개 카탈로그의 로그인 문구 표시·새로고침 후 언어 유지·언어 선택창의 부분 번역 표시를 확인했다. 인증서/API 키/운영 장비 변경이나 로그인 실행은 없었다. 검증 origin의 언어를 한국어로 되돌리고 임시 탭/서버를 종료했다. 스크린샷 /tmp/tastedev-ukrainian-login-20261006.png. 원어민 검수와 나머지 UI 번역은 남아 있다.

추가 번역: security-panel, sudo-policy-panel, operations-panel, tabbed-terminal, terminal-screen의 인식 가능한 고정 문구 143개를 추가했다. sudo PASSWD/NOPASSWD 및 OS 권한 안내, 스위치별 설명, 데몬 제어/자동 시작/복구 영향 확인, 터미널 설정·입력/클립보드 오류·감사 기록 변수 문구를 포함한다. 총 314/1456개이며 1142개는 영어 fallback이다. 14개 i18n 검사와 카탈로그 검사 PASS. 대상 5개 파일의 한국어 문자열 중 en 카탈로그에 등록된 고정 문구가 uk에서 빠진 수는 0이지만 동적 서버 메시지 전체 번역을 뜻하지 않는다. 이 추가분의 별도 빌드/실제 GUI 검사는 수행하지 않았으며 앞선 로그인 스크린샷과 빌드는 171개 단계의 증거다.

현재 패키지 설치/파일 IDE/비교/AI 로그·전송 동의/설정 생성 안내 90개 추가. 총 441/1493개 번역, 1052개 누락. 기존 카탈로그·언어 선택·SSR·checker 29개 통과와 고정 UI/설명/runtime 누락 검사 통과. `.runtime/verification/ukrainian-package-ui-20261006/result.json`. 원어민 검수·이번 추가의 실제 브라우저 확인 및 전체 언어 완료는 아니다.

nginx server 블록/Certbot 발급·갱신 영향/cron 예약 및 환경 설정·권한 오류 145개 추가. 총 586/1493개, 907개 누락. 언어/SSR/카탈로그 27개 및 checker 통과. 명령·설정 키는 유지했다. 기존 웹 명령 실행기 문구 번역은 해당 실행기의 안내이며 대화형 PTY 기능 제한을 새로 도입한 것이 아니다. `.runtime/verification/ukrainian-settings-ui-20261006/`. 원어민/추가분 실제 화면 검수는 미완료.

설정 단위/트리 편집/감사 결과, PostgreSQL 복원·재시작 영향, MariaDB/Redis include·Redis 제거 정책·Node 환경 변수 안내 185개 추가. 총 771/1493개, 722개 누락. checker 통과. 이번 변경은 카탈로그 데이터 추가이며 직전 27개 회귀를 이번 소스의 재실행으로 주장하지 않는다. `.runtime/verification/ukrainian-db-ui-20261006/`. 원어민/실제 화면 추가 검수는 미완료.

Node 앱/서비스 등록·복원, nginx 검수 오류/인증서 선택/cron 시간대 및 권한 작업 145개 추가. 총 916/1493개, 577개 누락. checker 통과. 이전 단일 명령/PTy 실행기 안내도 원문에 맞춰 번역했으며 현재 탭 셸 터미널 동작을 변경한 것은 아니다. `.runtime/verification/ukrainian-service-ui-20261006/`. 원어민/실제 화면 추가 검수는 미완료.

설정·서비스 검토/격리 Redis/복구 안내와 nginx 요청·프록시·gzip·TLS 지시어 설명 145개 추가. 총 1061/1493개, 432개 누락. checker 통과, {name} 변수 보존. `.runtime/verification/ukrainian-nginx-ui-20261006/`. 원어민/실제 화면 추가 검수는 미완료.
