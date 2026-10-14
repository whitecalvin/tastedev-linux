# nginx TLS 설정 한국어 GUI (2026-10-07)

공개 nginx 1.28 HTTP SSL 모듈의 지시어 29개를 GUI 목록과 대조했다. 기존 8개 외에 빠진 21개 진입점을 추가했다. 모든 항목을 허용된 http·server 문맥에서 제안한다. 제거된 ssl 지시어와 새 버전의 인증서 압축·ECH 및 상용 키 로그 기능은 이 기준 목록에 넣지 않는다. [공식 HTTP SSL 문서](https://nginx.org/en/docs/http/ngx_http_ssl_module.html).

인증서 캐시, OpenSSL 명령, CRL, DH, 0-RTT, 곡선, 클라이언트 OCSP, 암호 파일, 핸드셰이크 거부, 티켓 키, 서버 OCSP 파일·응답 서버를 추가했다. 기존 설명과 번역은 보존하고 설명이 없던 항목에 한국어 의미·버전·관련 설정 조건을 연결했다. 특히 클라이언트 OCSP 검증과 서버 인증서 OCSP 첨부를 구분하며 인증서·키·암호 파일의 내용을 GUI 제안 생성 과정에서 읽지 않는다.

on/off 설정은 스위치, ssl_ocsp는 off/on/leaf 선택, ssl_verify_depth는 0 이상 정수 입력으로 표시한다. 비운 값과 미래 버전 값, 복수 인수·파일 경로는 원문 입력으로 보존한다. 표기한 값은 편집 가능한 예시이며 서버에서 읽은 기본값이 아니다. 새 제안은 운영 설정에 자동 추가되지 않는다.

## 확인 범위

- 목록 29개·설명 링크·한국어 검색·문맥·스위치·선택 입력·복수 인수 코드 추가 및 기존 GUI 회귀 검사 12개 통과.
- 실제 설치 nginx의 임시 TLS 구문 검사 60개 통과: `.runtime/verification/nginx-tls-2026-10-06T18-50-00.011Z/result.json`. 29개 제안의 http/server 문맥 각각과 ssl_verify_depth=0 두 문맥을 확인했다.
- 검사에 자체 임시 CA·개인 키·폐기 목록·DH·OCSP DER·암호 파일·80바이트 티켓 키를 사용했다. 명령 출력·버전·바이너리 SHA-256 보존, 임시 파일 정리 완료. 서버를 기동하거나 운영 인증서를 읽고 변경하지 않았다. 생성한 OCSP 응답의 구문 수용을 실제 인증서 상태 확인으로 확대 해석하지 않는다.
- 최신 381개 소스 Next.js 빌드 통과: `.runtime/verification/source-build-2026-10-06T18-50-14.293Z/result.json`.

## 실제 TLS 연결 후속 검사

GUI 코드 생성 함수로 설정한 자체 loopback HTTPS 서버와 임시 CA·서버/클라이언트 인증서를 사용한 실제 연결 검사 10개 그룹이 통과했다: `.runtime/verification/nginx-tls-http-2026-10-06T18-52-42.530Z/result.json`.

- 생성 설정 구문 확인.
- 신뢰한 CA의 TLS 1.2 연결과 한국어 응답.
- OpenSSL MinProtocol TLSv1.3 설정에서 TLS 1.3 연결 성공, TLS 1.2 클라이언트 거부.
- 서버 인증서 이름 불일치 시 클라이언트 검증 거부.
- 신뢰한 클라이언트 인증서가 있으면 HTTP 200과 nginx의 SUCCESS 검증 결과.
- 요구된 클라이언트 인증서가 없거나 신뢰하지 않는 인증서면 HTTP 400으로 거부하고 정상 본문을 반환하지 않음.
- ssl_reject_handshake가 켜진 서버의 실제 TLS unrecognized name 거부.
- 별도 새 연결에 TLS 1.2 세션을 전달하면 실제 isSessionReused=true와 HTTP 200.

최초 실행에서는 이미 8개 그룹이 통과했고, 실제 OpenSSL 거부 메시지와 검사 도구의 정규식이 맞지 않아 실패했다. `.runtime/verification/nginx-tls-http-2026-10-06T18-52-27.325Z`에 보존했다. 오류 코드 EPROTO와 실제 unrecognized name 메시지로 확인을 수정한 뒤 완료했다. 인증 검증을 끄거나 우회하지 않았다.

실행 바이너리 SHA-256, 생성 설정, nginx 로그와 각 결과를 보존했다. 임시 서버·CA·키·인증서를 모두 정리했으며 세션 바이트와 개인 키 내용은 증거 파일에 저장하지 않았다. 운영 서비스와 인증서는 변경하지 않았다.

## 한국어 GUI 후속 확인

현재 381개 소스 빌드의 실제 격리 브라우저에서 서버 블록을 선택해 ssl_ocsp=leaf 선택, ssl_reject_handshake 스위치 켜기, ssl_session_cache shared:TLS:10m 원문 입력을 초안에 추가했다. 코드 보기에서 세 값이 생성된 것을 확인했다. 원본 운영 fixture는 변경하지 않았다.

같은 화면에서 ip_hash가 있는 업스트림에 least_conn을 추가하면 한국어 안내를 표시하고 기존 코드를 보존했다. 코드 보기에서 기존 방식만 제거해 초안에 반영한 뒤 GUI 추가가 성공했다. keepalive 앞 순서와 두 항목의 들여쓰기도 실제 화면에서 확인했다.

1280×720에서 body와 문서의 너비·높이가 뷰포트와 일치해 외부 스크롤이 없었다. 로그아웃 후 자체 탭·서버·fixture 정리 및 원본 설정 유지까지 확인했다. 결과 `.runtime/verification/nginx-editor-gui-2026-10-06T18-56-30.729Z/result.json`, TLS 화면 `.runtime/verification/nginx-tls-gui-20261007.png`, 코드 화면 `.runtime/verification/nginx-balancer-code-gui-20261007.png`. 재현 시나리오는 `nginx-editor-gui.mjs <빌드 절대 경로> tls-settings`다.

모든 TLS 항목의 개별 브라우저 흐름, TLS 1.3 세션 재개·시간 만료·클라이언트 폐기 목록·OCSP 검증·운영 적용·복원은 별도 남는다. 추가 다국어와 사용자 담당 이름 변경 및 DEB 검사는 수행하지 않았다.
