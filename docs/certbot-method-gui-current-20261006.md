# Certbot 동적 인증 방식 실제 GUI (2026-10-06)

현재 소스 366개 빌드 `/tmp/tastedev-current-build-vLliUj`의 별도 localhost Next.js 서버를 임시 Better Auth 계정과 읽기 전용 빈 인증서 경로에 연결했다. 기존 사용자 화면이나 계정·nginx·Certbot 설정을 변경하지 않았다.

실제 브라우저의 발급 노드를 선택하고 fixture.example.invalid / fixture@example.invalid 입력 후 API가 생성한 명령을 코드 탭에서 확인했다.

- nginx: `--nginx`, `--redirect`, `--staging`.
- webroot: 선택 즉시 이전 명령을 제거하고 웹 루트 경로 입력 표시. `/var/www/fixture` 입력 후 `certonly --webroot --webroot-path /var/www/fixture --staging`, nginx 플래그 없음.
- standalone: 웹 루트 입력 제거, `certonly --standalone --staging`, webroot 플래그 없음.

nginx 명령에서 실제 키보드로 선택 126–134(backward), 가로 스크롤 197을 만든 뒤 설정/코드 탭 왕복 후 모두 일치했다. 잘못된 이전 명령이 코드 화면에 남아 있지 않음도 확인했다.

증거 `.runtime/verification/package-editor-gui-2026-10-06T02-00-28.486Z/result.json` PASS. 스크린샷 `/tmp/tastedev-certbot-methods-verified-20261006.png`. 임시 서버·계정·파일·탭 67 정리 완료. 실제 ACME 요청, 약관 동의 제출, 인증서 발급/갱신 또는 서비스 제어를 수행하지 않았다. 따라서 운영 도메인 발급·갱신 수용 검사는 계속 미완료다.
