# Redis 한국어 설정 설명

Redis 8.0 공개 설정을 기준으로 접속·인증·메모리·RDB/AOF 주요 항목 29개에 한국어 도움말을 추가했다. 실제 파일의 알려진 설정 행과 새 항목 추가 이름에 설명을 표시하며, 한국어 설명도 설정 검색 대상이다. 기존 값·중복 행 순서·비밀번호 입력 보호 및 여러 인수/따옴표 편집을 유지한다. 설명은 설치된 Redis의 실제 검수나 운영 적용을 대신하지 않는다.

공식 근거:
- https://raw.githubusercontent.com/redis/redis/8.0/redis.conf
- https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/
- https://redis.io/docs/latest/develop/reference/eviction/
- https://redis.io/docs/latest/operate/oss_and_stack/management/security/acl/

한국어 도움말만 추가하며 다른 언어는 기존 동작을 유지한다. 알려지지 않은 확장 설정에는 추측 설명을 붙이지 않는다. 번역 카탈로그 확장은 사용자 방침에 따라 후순위다.

관련 검사 7개 통과: 전체 29개 이름·한국어/알 수 없는 항목 처리, ACL 호환과 TCP/RDB/AOF 의미, 실제 컴파일 컴포넌트 한국어 설명·검색, 기존 편집/내용 비우기·비밀번호·미완성 입력 보존과 PostgreSQL/MariaDB 회귀. 새 설명의 실제 브라우저 수용과 나머지 Redis 항목의 설명 보완, 실제 서버 적용은 남는다.

ACL 보완 이후 첫 빌드는 임시 저장소 쓰기 할당량 오류(-122)로 실패했다. 소유·실행 중 여부를 확인한 자체 이전 빌드 6개를 로그/해시 보존 후 정리했다: `.runtime/verification/temporary-build-cleanup-20261007-3/result.json`.

정리 후 최신 382개 소스 빌드 성공: `.runtime/verification/source-build-2026-10-06T19-18-14.703Z/result.json`.

## 실제 GUI 후속 확인

현재 호스트에 Redis 패키지가 없어 첫 라우트 접근은 설치 대상 보호에 의해 차단됐다. 자체 격리 서버 안에서만 임시 dpkg 설치 목록과 읽기 전용 Redis 설정을 사용했다. 실제 호스트 설치·Redis 프로세스 실행·서비스 작업은 하지 않았다. 첫 차단 및 바이너리 연결 실패 결과를 보존했다.

실제 한국어 GUI에서 설명 검색으로 save 두 행만 표시, 두 번째 행 개별 편집, 내용 비우기 후 행 보존과 주석 코드 반영, 다른 값·비밀번호 코드 보존과 password 입력 마스킹 및 로그아웃을 확인했다. 그러나 코드 탭 왕복 후 스크롤 검사에서 panel.scrollTop=0이어서 해당 그룹은 미통과다. 탭 위치는 128px로 유지됐지만 본문 스크롤 성공의 증거는 아니다. 원인 확인과 반복 수용이 필요하다.

최종 결과 FAIL: `.runtime/verification/package-editor-gui-2026-10-06T19-22-19.605Z/result.json`. 자체 탭·계정·fixture·서버 정리 및 원본 설정 보존 완료. 29개 전체 개별 GUI 완료나 설치 환경 성공으로 확대하지 않는다.

## 스크롤 실패 원인 확인

동일 최신 빌드와 새 자체 fixture에서 코드 탭 왕복·검색 해제 후 실제 스크롤을 재현했다. 스크롤 요청 직후의 측정은 0이었지만 이어서 얻은 화면과 표시 중인 설정 패널의 측정은 1056px이었다. 즉 앞선 검사는 비동기 스크롤 완료 전에 판정했다. 제품 CSS를 추가 변경하지 않았다.

표시 패널 높이 528px/본문 높이 1654px, 스크롤 1056px, 탭 상단 128px 및 inspector 스크롤 0을 확인했다. 외부 본문 높이 720px과 화면 너비 1280px을 유지했다. 한국어 설명 검색·비밀번호 가림·중복 행 편집·내용 비우기·코드 반영·로그아웃도 다시 확인했다.

후속 결과 PASS: `.runtime/verification/package-editor-gui-2026-10-06T19-27-24.967Z/result.json`. 이전 FAIL 기록은 보존한다. 화면 증거: `.runtime/verification/redis-fixed-tabs-gui-20261007.png`. 자체 서버·fixture·탭 정리와 원본 파일 보존 확인 완료. 임시 설치 목록을 사용했으므로 실제 Redis 설치·운영 적용 검증은 여전히 미완료다.
