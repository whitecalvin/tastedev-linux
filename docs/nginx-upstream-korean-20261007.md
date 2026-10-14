# nginx 업스트림 한국어 GUI 보완 (2026-10-07)

공개 nginx 1.28 계열 upstream 지시어 12개 중 기존 GUI 제안에 있던 server·keepalive 외 10개를 추가했다. zone, hash, ip_hash, keepalive_requests, keepalive_time, keepalive_timeout, least_conn, random, resolver, resolver_timeout을 포함한다. 공개 기준에서 제외되는 state·ntlm·least_time·queue·sticky는 제안하지 않는다. [공식 업스트림 문서](https://nginx.org/en/docs/http/ngx_http_upstream_module.html).

기존 한국어 설명을 보존하고 server의 가중치·연결 한도·실패 제외·예비 서버·동적 DNS 인수를 설명했다. keepalive의 유휴 연결 수와 HTTP 연결 재사용 조건도 보완했다. 값은 편집 가능한 예시이며 설치 서버에서 읽은 기본값으로 표시하지 않는다.

인수 없는 ip_hash·least_conn은 입력칸 없이 GUI에서 추가한다. keepalive의 단일 숫자는 1 이상의 입력을 사용하고 미래 버전 복수 인수는 원문 텍스트로 보존한다. GUI에서 부하 분산 방식을 추가할 때 기존 keepalive보다 앞에 삽입한다. 기존 주석과 뒤의 연결 설정을 유지한다. 사용자가 코드에서 작성한 여러 부하 분산 방식 또는 지원되지 않는 조합을 자동 제거하지 않는다. 적용 전 실제 검수는 계속 필요하다.

## 증거

- 관련 고유 검사 18개 통과. 목록·문맥·설명·입력 범위·삽입 순서와 컴파일된 실제 설정 컴포넌트의 인수 없는 항목 추가 callback을 포함한다.
- 실제 nginx 자체 임시 구문 16개 통과: `.runtime/verification/nginx-upstream-2026-10-06T18-37-45.060Z/result.json`. 12개 항목별 생성 설정과 4개 부하 분산 방식의 keepalive 앞 삽입을 검사했다. 버전·바이너리 SHA-256·출력 보존, fixture 정리 완료. nginx 서버를 기동하지 않았다.
- 최초 fixture 검사는 기본 access_log 권한 오류로 실패했다. fixture에 access_log off를 추가한 뒤 잘못된 첫 자식 선택도 이름 기반 블록 조회로 수정했다. 실패 기록 `.runtime/verification/nginx-upstream-2026-10-06T18-37-11.011Z`와 `.runtime/verification/nginx-upstream-2026-10-06T18-37-28.317Z`는 보존했다.
- 현재 380개 소스 Next.js 빌드 통과: `.runtime/verification/source-build-2026-10-06T18-37-44.144Z/result.json`.

## 실제 요청 및 브라우저 후속 확인

자체 HTTP 업스트림 두 개와 loopback nginx로 생성 설정을 실행했다. 실제 요청 9개 그룹 통과: `.runtime/verification/nginx-upstream-http-2026-10-06T18-40-07.700Z/result.json`.

- 생성 설정 구문 확인.
- 요청 8개를 업스트림 소켓 2개로 처리해 유휴 연결 재사용 확인.
- 가중치 2:1에 따라 요청 6개가 4개/2개로 분산.
- 같은 한국어 query 키와 클라이언트 IP의 반복 요청이 동일 서버로 유지.
- 첫 요청을 열린 상태로 유지하면 least_conn이 다른 유휴 서버를 선택.
- random two의 응답이 설정한 서버 중 하나에서 반환. 확률 분포의 통계 검증은 아님.
- down 서버 제외와 주 서버가 down일 때 backup 서버 선택.

첫 실행은 Node HTTP API에 한글 query를 그대로 넣어 요청 경로 인코딩 오류가 발생했다. 이 도구 오류와 앞서 성공한 구문·연결 재사용·가중치 결과는 `.runtime/verification/nginx-upstream-http-2026-10-06T18-39-53.092Z`에 보존했다. URL 인코딩 후 전체 시나리오를 완료했다. 서버·연결·fixture 모두 정리했다.

현재 380개 소스 빌드의 실제 브라우저에서 한국어 server 인수 설명과 keepalive 숫자 입력, “활성 연결” 설명 검색 및 인수 없는 least_conn 추가, keepalive 앞 코드 순서와 1280×720 외부 스크롤 없음·로그아웃을 확인했다. 증거 `.runtime/verification/nginx-editor-gui-2026-10-06T18-41-50.441Z/result.json`, 화면 `.runtime/verification/nginx-upstream-gui-20261007.png`. 원본 fixture 변경 없음과 탭·서버 정리 확인.

이 브라우저 확인 중 한 줄로 된 기존 keepalive 앞에 삽입하면 들여쓰기가 빠지는 점을 발견해 수정했다. 수정 이후 관련 18개 검사, 실제 구문 16개 `.runtime/verification/nginx-upstream-2026-10-06T18-42-23.940Z/result.json`, 최신 380개 소스 빌드 `.runtime/verification/source-build-2026-10-06T18-42-24.839Z/result.json` 통과. 들여쓰기 수정 이후 별도 새 브라우저 확인은 아직 수행하지 않았다.

## 부하 분산 방식 중복 방지

실제 nginx는 ip_hash와 least_conn을 같이 작성해도 `load balancing method redefined` 경고와 성공 종료 코드를 반환했다. 경고만 보고 성공으로 오해해 기존 방식이 달라지는 일을 줄이도록 GUI 추가 함수에서 이미 부하 분산 방식이 있으면 두 번째 방식 추가를 거부한다. “이 업스트림에 부하 분산 방식이 이미 있습니다. 코드 보기에서 기존 방식을 변경한 뒤 추가하세요.” 한국어 안내를 표시하고 기존 초안은 유지한다.

hash·ip_hash·least_conn·least_time·random·sticky의 기존 항목을 대조한다. 공개 기준에 없는 기존 사용자 항목도 무시하지 않지만 새 GUI 제안에 상용 항목을 추가하지 않는다. 일반 server 지시어의 반복 추가, 다른 upstream 그룹, 매핑 키에는 이 제한을 적용하지 않는다. 같은 파일에서 확인되는 upstream 포함 파일 문맥도 검사한다. 다른 include 파일에 숨겨진 방식까지 탐색하거나 코드 직접 편집·운영 검수 경로를 변경한 것은 아니다.

- 관련 검사 12개 통과. 실제 컴파일된 트리의 onAdd가 false를 반환하고 초안 미변경·한국어 안내를 유지하며 server 추가는 성공하는지 포함한다.
- 실제 구문과 중복 경고 관찰 17개 그룹 통과: `.runtime/verification/nginx-upstream-2026-10-06T18-45-01.167Z/result.json`. 마지막 그룹은 충돌 설정을 안전하다고 판정한 것이 아니라 nginx의 경고·성공 종료 특성을 관찰한 증거다.
- 처음 빌드는 임시 저장 공간 할당량 오류로 종료했다. 자체 이전 임시 빌드 3개의 소스 해시·로그를 `.runtime/verification/temporary-build-cleanup-20261007`에 보존하고 사본만 정리했다. 프로젝트 원본은 변경하지 않았다.
- 재실행한 현재 380개 소스 빌드 통과: `.runtime/verification/source-build-2026-10-06T18-46-56.573Z/result.json`.
- 이후 381개 소스 빌드의 실제 브라우저에서 중복 추가 한국어 안내와 원문 보존, 코드에서 기존 방식 변경 후 GUI 추가 성공 및 들여쓰기 보존을 확인했다: `.runtime/verification/nginx-editor-gui-2026-10-06T18-56-30.729Z/result.json`. TLS 입력 검사와 함께 실행했으며 원본 fixture 변경 없이 로그아웃·탭·서버 정리까지 완료했다.

모든 항목의 개별 브라우저 흐름, 동적 DNS·시간 만료·서버 장애 복구 및 운영 적용·복원은 별도 남는다. 다국어 확장과 사용자 담당 이름 변경 및 DEB 검사는 수행하지 않았다.
