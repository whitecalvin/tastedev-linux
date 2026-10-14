# nginx 인수 없는 설정 GUI (2026-10-07)

`internal;`은 인수 없이 사용하는 location 설정이다. 기존 GUI는 제안 값이 비어 있으면 추가 버튼을 비활성화하므로 해당 설정을 추가할 수 없었다. [공식 문서](https://nginx.org/en/docs/http/ngx_http_core_module.html#internal)에 맞춰 location 제안 목록과 인수 없는 입력 형식을 추가했다.

제안 항목에는 “인수 없는 설정” 안내와 활성화된 추가 아이콘을 표시한다. 추가 후에는 기존 설정 행을 유지하며 빈 입력란·값 저장·내용 비우기 버튼은 표시하지 않는다. 블록·코드의 구조 편집으로 제거할 수 있다. 일반 항목의 내용 비우기 동작은 유지한다. map의 동일 이름 키와 기존 잘못된 원문 인수는 원문 입력을 유지하며 운영 적용 전 검수가 필요하다.

- 관련 검사 14개 통과: 실제 컴파일된 컴포넌트의 추가 버튼 클릭 → `internal;` 코드 생성 → 기존 행 유지 및 중복 제안 제거, 한국어 HTTP 도움말, 기존 내용 비우기·스위치 회귀 포함.
- 실제 임시 nginx `-t` 3개 통과: GUI 생성 코드 허용, `internal on;` 인수 거부, server 블록의 internal 거부. 증거 `.runtime/verification/nginx-valueless-2026-10-06T17-38-13.155Z/result.json`에 버전·실행 파일 SHA-256·출력 보존.
- 최신 377개 소스 Next.js 빌드 통과: `.runtime/verification/source-build-2026-10-06T17-38-41.333Z/result.json`.

임시 파일은 정리했다. 운영 파일·서비스는 변경하지 않았으며 실제 브라우저 E2E나 운영 적용 완료로 확대하지 않는다. 한국어 개발을 우선하며 다국어·이름 변경·DEB 검증은 수행하지 않았다.
