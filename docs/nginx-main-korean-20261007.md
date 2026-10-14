# nginx 최상위 설정 GUI 보완 (2026-10-07)

한국어 기능을 먼저 완성한다는 현재 지시에 맞춰 최상위 core 설정 목록을 보완했다. 다국어 카탈로그와 사용자 담당 이름 변경은 수정하지 않았다.

## 변경

`nginx.conf` 최상위에서 공식 core 문서의 main 지시어 22개를 GUI로 추가할 수 있다. 기존 user·pid·worker_processes·로그·include 외에 환경 변수, 동적 모듈, 워커 파일/코어 한도, 우선순위, 정상 종료 제한, 스레드 풀, 타이머, 작업 디렉터리 등 누락 항목을 제공한다. 새 항목은 한국어 설명과 공식 링크를 연결했다. 최상위 항목은 events/HTTP/서버/location 목록에 잘못 추가되지 않는다.

daemon·master_process·pcre_jit·ssl_object_cache_inheritable은 스위치, debug_points는 선택 입력이다. 예상하지 못한 기존 값과 map의 동일 이름 키는 일반 텍스트 편집을 유지한다. 환경 변수의 반복 추가와 설정 순서는 코드 모델에서 보존한다.

지원 빌드·버전·실제 경로가 필요한 설정에 조건을 설명한다. 예시 값을 nginx 기본값으로 표시하지 않는다. 선택하지 않은 항목은 운영 파일에 추가되지 않는다.

검색 결과에 추가 가능한 항목이 있으면 “설정 항목이 없습니다.”를 함께 표시하지 않도록 수정했다. 읽기 전용에서 추가 항목이 숨겨지거나 실제 검색 결과가 없으면 빈 안내를 유지한다.

공식 기준: https://nginx.org/en/docs/ngx_core_module.html (2026-10-07 확인).

## 증거

- 관련 Node/컴파일 JSX 검사 30개 통과: main/events 목록·문맥·설정 순서·반복 env·스위치/선택 입력·검색 빈 안내 및 기존 nginx 설정 회귀.
- nginx 1.28.3의 자체 임시 설정 15개 `nginx -t` 통과. 동적 모듈과 SSL 엔진은 실제 대상이 필요해 실행하지 않았다. native 전체 상태는 PARTIAL이며 `.runtime/verification/nginx-main-2026-10-06T17-08-32.127Z/result.json`에 정확한 범위와 binary SHA를 기록했다. 서버 시작/운영 설정 변경은 없고 임시 파일을 정리했다.
- 실제 개발 브라우저의 nginx.conf 선택에서 22개 설정·스위치 4개 표시, 한국어 `스레드` 검색 시 thread_pool만 표시, 잘못된 빈 안내 없음, 바깥 스크롤 없음을 확인했다. 같은 증거 폴더의 gui.json/gui.jpg에 저장했고 자체 검사 탭을 닫았다.
- 최종 현재 소스 374개 운영 빌드 PASS: `/tmp/tastedev-current-build-6IXnk6`, `.runtime/verification/source-build-2026-10-06T17-10-08.293Z/result.json`. 이전 `/tmp/tastedev-current-build-MSzCtM`은 검색 빈 안내 수정 이전 빌드로 구분한다.
- 최종 동일 빌드의 실제 Next.js HTTP 검사 15개 그룹 PASS: `.runtime/verification/production-http-2026-10-06T17-10-30.485Z/result.json`. 임시 계정/서버/워크스페이스에서 로그인, 보호 화면, 세션 재시작/만료, 실제 PTY 한글·이모지 SSE, 감사 연결 등을 확인했고 정리를 완료했다. 외부 AI·실제 인증서 발급·운영 변경은 포함하지 않는다.

설치 계정 helper·운영 적용·모든 nginx 모듈 설정 및 전체 제품 완료를 이 검사로 판정하지 않는다. 사용자 이름 변경과 관련된 기존 전체 runner 실패 및 최종 설치 수용 검사는 별도 남아 있다.
