# nginx HTTP 캐시·연결 설정 한국어 보완 (2026-10-07)

HTTP core GUI의 누락 항목 25개를 추가했다. 한국어 설명·기본값·공식 링크를 연결하고, 블록별 제안 제한 및 스위치·선택·숫자 입력을 제공한다. 복수 인수와 예외 값은 원문 입력으로 유지한다. [공식 기준](https://nginx.org/en/docs/http/ngx_http_core_module.html).

대상: lingering_close, lingering_time, lingering_timeout, log_subrequest, max_ranges, merge_slashes, msie_padding, msie_refresh, open_file_cache, open_file_cache_errors, open_file_cache_min_uses, open_file_cache_valid, output_buffers, port_in_redirect, postpone_output, read_ahead, recursive_error_pages, request_pool_size, reset_timedout_connection, satisfy, send_lowat, sendfile_max_chunk, server_name_in_redirect, subrequest_output_buffer_size, server_names_hash_max_size.

## 확인 결과

- 관련 검사 25개 통과: HTTP 문맥/한국어 설명 검색, 입력 허용 범위, 복수 인수와 코드 순서 보존, main/events/인수 없는 설정 및 기존 내용 비우기 회귀 포함.
- 확장 HTTP 목록 전체의 실제 임시 nginx `-t` 102개 통과. 실행 파일 버전·SHA-256·각 출력 보존: `.runtime/verification/nginx-http-core-2026-10-06T17-41-00.705Z/result.json`. 서버 시작·운영 파일 변경 없음, fixture 정리 완료. 이 수치는 이번 추가 25개만의 수치가 아니라 기존 HTTP 확장 설정과 internal도 포함한다.
- 최신 빌드의 읽기 전용 격리 nginx 브라우저에서 “캐시” 검색 → 관련 5개 제안, `open_file_cache max=1000 inactive=20s` 초안 추가와 값 유지 확인. location에서 internal 제안 → 인수 없이 추가 → 행 유지 → 코드 보기의 `internal;` 반영 확인. 문서 전체 스크롤 없음. 로그아웃 후 로그인 이동, fixture 운영 파일 불변 및 서버/fixture 정리 확인: `.runtime/verification/nginx-editor-gui-2026-10-06T17-44-00.830Z/result.json`.
- 실제 검증 화면: `.runtime/verification/nginx-http-lifecycle-20261007/gui.jpg`. 설치 상태·서비스는 격리 환경이며 실제 호스트 제어 완료를 의미하지 않는다.
- 브라우저 확인 중 발견한 인수 없는 항목의 빈 예시 안내를 추가로 제거했다. 해당 컴파일 렌더링 검사 2개 통과. 위 브라우저 증거는 빈 예시 안내 제거 이전 빌드이며 기능 검증 범위는 동일하다.
- 빈 예시 안내 수정까지 포함한 최종 377개 소스 Next.js 빌드 통과: `.runtime/verification/source-build-2026-10-06T17-44-32.843Z/result.json`.

전체 nginx 외부 모듈·운영 적용·최종 배포 완료를 뜻하지 않는다. 추가 다국어·사용자 담당 이름 변경·DEB 검증은 수행하지 않았다.
