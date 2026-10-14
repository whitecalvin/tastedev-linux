# nginx HTTP 기본 목록과 MIME GUI (2026-10-07)

한국어 기능 개발을 우선해 HTTP core의 AIO·DNS·MIME·파일 조회 제안 위치를 보완했다. `aio`, `aio_write`, `resolver`, `server_names_hash_bucket_size`를 추가하고 `default_type`의 server/location 및 `try_files`의 server 제안을 보완했다. `types`는 http/server/location, `limit_except`는 location의 블록 추가 목록에 연결했다. [공식 HTTP core 문서](https://nginx.org/en/docs/http/ngx_http_core_module.html).

GUI 목록 대조의 기준은 설치 nginx 1.28 계열에서 제공되는 core 항목 80개다. 각 이름에 적어도 하나의 지원 GUI 문맥과 한국어 설명·문서 링크가 있음을 확인했다. 새 버전 전용 및 상용 항목, 모든 외부 모듈, 모든 항목의 실제 실행 동작 또는 설치별 capability 자동 판정까지 완료했다는 의미는 아니다.

`types` 사용자 지정 입력은 “MIME 유형 / 확장자”로 표시한다. 실제 GUI callback에서 `application/vnd.api+json` 같은 이름을 코드로 추가할 수 있다. MIME 이름은 선택된 실제 types 블록 안의 지시어에만 허용하고 일반 설정 이름·블록 이름에는 허용하지 않는다. 공백·주석·구분자 삽입은 거부한다. 기존 include도 types에서 허용한다.

types 내부 include는 MIME 항목만 담은 파일을 대상으로 한다. `types { }`를 감싼 일반 mime.types를 내부에 중첩하도록 유도하지 않도록 예시 경로와 한국어 설명을 구분했다.

## 증거

- 기본 목록 80개 대조, 블록·AIO 입력 및 기존 HTTP/main/events/GUI 회귀 검사 26개 통과.
- MIME GUI·이름 제한·코드 생성과 기존 블록 GUI 검사 11개 통과. 마지막 내부 include 예시·설명 보완 후 해당 목록/MIME 검사 5개 통과.
- 확장 HTTP 제안 목록의 임시 실제 nginx `-t` 117개 통과: `.runtime/verification/nginx-http-core-2026-10-06T17-47-05.526Z/result.json`.
- 실제 GUI 코드 생성 함수의 MIME 블록 3개 문맥, types 내부 include, limit_except 및 잘못된 위치, AIO 스레드·쓰기·캐시 복수 인수/0 값 검사 11개 통과: `.runtime/verification/nginx-core-blocks-2026-10-06T17-50-32.052Z/result.json`. 버전·바이너리 SHA-256·각 출력 보존. 임시 파일 정리 완료, nginx 서버/운영 파일 변경 없음.
- 내부 include 예시·설명까지 포함한 최종 378개 소스 Next.js 빌드 통과: `.runtime/verification/source-build-2026-10-06T17-51-40.716Z/result.json`.

새 GUI의 실제 브라우저 E2E와 운영 적용은 별도 남는다. 추가 다국어와 사용자 담당 이름 변경, DEB 검증은 수행하지 않았다. 관리자 파일명은 여전히 linex-admin으로 확인되어 해당 이름 전환의 차단 상태는 해소되지 않았다.
