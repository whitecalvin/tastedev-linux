# nginx 프록시 설정 한국어 보완 (2026-10-07)

한국어 기능 완성을 우선해 nginx 공개 1.28 계열 프록시 지시어 70개와 GUI 제안 목록을 대조했다. 기존 13개 제안에서 빠진 57개 진입점을 추가했다. 캐시·헤더·쿠키·재시도·TLS·임시 파일 설정을 선택한 http/server/location 문맥에서 제안한다. proxy_cache_path는 http, proxy_pass는 location에 제안한다. [공식 프록시 문서](https://nginx.org/en/docs/http/ngx_http_proxy_module.html).

기존 설명과 번역은 보존하고 설명이 없던 항목에 한국어 설명과 버전 조건을 추가했다. 스위치, HTTP 버전 선택, 숫자 입력을 연결하고 복수 인수는 원문 텍스트로 보존한다. 예시는 설치된 서버의 기본값을 뜻하지 않는다. 새 버전 전용·상용 기능은 이 기준 목록에 포함하지 않는다.

실제 nginx 구문 검사에서 허용된 proxy_cache_min_uses, proxy_ssl_verify_depth, proxy_next_upstream_tries의 0 값을 GUI에서도 허용한다. 매핑 블록의 키는 같은 이름이어도 일반 프록시 입력으로 바꾸지 않는다.

## 확인 결과

- 목록·설명·검색·매핑·HTTP core 관련 검사 20개 통과.
- 자체 임시 CA·키·폐기 목록과 파일을 사용한 실제 nginx 구문 검사 209개 통과: `.runtime/verification/nginx-proxy-2026-10-06T18-26-48.305Z/result.json`.
- 최신 379개 소스 Next.js 빌드 통과: `.runtime/verification/source-build-2026-10-06T18-27-49.817Z/result.json`.
- 임시 구문 검사 파일 정리 완료. nginx 서버 기동, 운영 설정 변경 및 DEB 검사는 수행하지 않았다.

실제 격리 Next.js 브라우저에서도 한국어 재시도 검색, 제한 값 0 추가, 캐시 잠금 스위치 켜기, 쿠키 플래그 복수 인수 추가, 코드 편집 후 설정 행 순서 갱신을 확인했다. 1280×720에서 body와 문서 크기가 모두 뷰포트와 일치해 외부 스크롤이 없었다. 로그아웃 뒤 자체 탭·서버·fixture를 정리했고 원본 fixture 설정이 변경되지 않았음을 검사했다.

- 브라우저 증거: `.runtime/verification/nginx-editor-gui-2026-10-06T18-32-39.022Z/result.json`.
- 화면: `.runtime/verification/nginx-proxy-gui-20261007.png`.
- 재현 시나리오: `scripts/verification/nginx-editor-gui.mjs <현재 소스 빌드 절대 경로> proxy-settings`.

## 실제 프록시 요청 확인

GUI가 사용하는 addNginxDirective로 생성한 설정을 자체 loopback nginx와 HTTP/HTTPS 업스트림에서 실행했다. 다음 11개 그룹이 통과했다.

- 생성 설정 구문 검사.
- 한국어 POST 본문과 명시한 Host·사용자 헤더 전달, 숨긴 응답 헤더 제외.
- 쿠키 Domain·Path·secure·httponly·samesite 변경.
- 업스트림 리다이렉트 주소 변경.
- 최초 캐시 MISS 다음 HIT와 업스트림 1회 요청.
- 인증 요청 2회의 BYPASS·저장 제외 후 일반 요청 MISS/HIT.
- 동시 요청 4개에서 캐시 잠금으로 업스트림 1회 요청.
- 첫 업스트림 502 후 다음 업스트림 성공 및 재시도 2회 제한.
- 업스트림 오류를 한국어 오류 처리 location으로 전달.
- 임시 신뢰 인증서와 일치하는 TLS 이름 연결 성공.
- TLS 이름이 다를 때 502로 연결 거부.

증거: `.runtime/verification/nginx-proxy-http-2026-10-06T18-34-50.421Z/result.json`. 생성 설정·nginx 로그·실행 바이너리 SHA-256을 같은 디렉터리에 보존했다. 자체 서버와 임시 인증서·키·캐시 폴더를 정리했다. 운영 서비스나 설정 파일은 변경하지 않았다.

모든 프록시 항목의 개별 브라우저 흐름과 실제 운영 환경의 적용·실패·복원은 별도 남는다. 전체 제품 완료로 판정하지 않는다. 다국어 추가 개발은 한국어 기능 완성 이후 진행한다.
