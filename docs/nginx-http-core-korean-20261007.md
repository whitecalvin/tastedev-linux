# nginx HTTP 설정 한국어 보완 (2026-10-07)

HTTP 공통 설정에서 빠진 항목 10개를 GUI 제안 목록에 추가했다: `auth_delay`, `client_body_temp_path`, `connection_pool_size`, `directio`, `directio_alignment`, `disable_symlinks`, `if_modified_since`, `ignore_invalid_headers`, `keepalive_disable`, `keepalive_min_timeout`.

각 항목에 한국어 설명, 기본값과 공식 문서 링크를 연결했다. 기본값은 설치별 경로·플랫폼에 따라 달라질 수 있고 제안 값은 사용자가 편집하는 예시다. 새 설정을 자동 적용하지 않는다. 신규 버전이 필요한 항목은 설명에 지원 조건을 표시한다. 기준: [nginx HTTP core 공식 문서](https://nginx.org/en/docs/http/ngx_http_core_module.html).

`if_modified_since`는 선택 입력, `ignore_invalid_headers`는 스위치로 제공한다. 여러 인수·변수·경로를 받는 항목과 예외 값은 원문 입력을 유지한다. `connection_pool_size`와 `ignore_invalid_headers`는 http/server에서만 제안한다. 기존 map·MIME 키 입력도 유지한다.

## 검증 범위

- 관련 검사 20개 통과, 실패 0개. 블록별 제안 제한, 한국어 도움말 검색, 복수 인수/변수 보존, 코드 추가 순서, 실제 JSX 컴파일 후 렌더링의 선택 입력·스위치 및 기존 main/events/내용 비우기 회귀를 확인했다. 브라우저 E2E와는 구분한다.
- 실제 설치 nginx의 임시 `-t` 검사 30개 통과. http/server/location의 허용 설정 28개 조합과 location에서의 잘못된 설정 2개 거부를 확인했다. 실행 파일 버전·SHA-256과 각 구문 출력은 `.runtime/verification/nginx-http-core-2026-10-06T17-35-20.207Z/result.json`에 보존했다.
- 임시 파일은 정리했으며 nginx 서버를 시작하거나 운영 설정을 변경하지 않았다. 전체 운영 적용·복구 검증을 뜻하지 않는다.
- 최신 377개 소스 Next.js 운영 빌드 통과: `.runtime/verification/source-build-2026-10-06T17-35-45.246Z/result.json`.

추가 다국어 개발, 사용자 담당 이름 변경, DEB 검증은 수행하지 않았다. 모든 nginx 외부 모듈 설정을 완성했다는 의미는 아니며 전체 목표는 계속 진행 중이다.
