# nginx events 설정 보완 (2026-10-07)

한국어 기능 우선 지시에 따라 다국어 카탈로그는 변경하지 않았다.

- `events` 설정 추가 목록에 `accept_mutex_delay`, `debug_connection`, `use`, `worker_aio_requests`를 제공한다. 기존 세 항목과 합쳐 오픈소스 core의 events 전용 지시어 일곱 개를 GUI로 작성할 수 있다. 모든 문맥에 유효한 `include`는 사용자 지정 항목으로 작성한다.
- 각 신규 항목에 한국어 의미·지원 조건·공식 문서 링크를 제공한다. `use epoll`은 Linux용 예시이며 기본값으로 표시하지 않는다. nginx는 생략 시 자동 선택한다. `debug_connection`은 `--with-debug` 조건을 설명한다.
- 상용 기능 `stall_threshold`는 직접 작성된 설정을 조회할 때 버전·구독 조건을 설명하며 오픈소스 기본 추가 목록에는 넣지 않는다.
- `worker_aio_requests`는 0을 포함하는 숫자 입력을 제공한다. 실제 nginx가 0을 구문 검사에서 허용함을 확인했다.

공식 기준: https://nginx.org/en/docs/ngx_core_module.html (2026-10-07 확인).

## 확인 범위

26개 관련 테스트 통과: 신규 events 문맥·초안 순서·기존 HTTP 블록 보존·한국어 검색·기본값/예시 구분·숫자 범위 및 기존 설정 JSX 렌더링/편집 검사.

실제 `/usr/sbin/nginx` 1.28.3의 자체 임시 설정 `nginx -t` 5개 통과. 신규 네 지시어와 AIO 요청 수 0을 확인했다. 서버를 시작하지 않았으며 운영 파일·서비스는 변경하지 않았다. 임시 폴더를 정리했다. 실행 파일 SHA와 결과는 `.runtime/verification/nginx-events-2026-10-06T17-04-43.811Z/result.json`에 기록했다. 최초 네 항목 검수 결과도 별도 이전 실행 폴더에 보존했다.

실제 개발 브라우저에서 events 선택→추가 목록의 한국어 설명→`비동기` 검색 시 `worker_aio_requests`만 표시→숫자 입력 min=0을 확인했다. 바깥 스크롤 없이 설정 패널 내부 스크롤을 유지했다. `gui.json`과 `gui.jpg`를 위 최종 증거 폴더에 저장했고 자체 검사 탭을 닫았다. 운영 적용은 수행하지 않았다.

현재 소스의 전체 목표 완료, 전체 다국어, 설치 환경 적용을 증명하지 않는다. 이름 변경으로 인한 기존 전체 runner 실패는 별도 남아 있다. 이번 변경 이후 운영 빌드 검사는 아직 수행하지 않았다.
