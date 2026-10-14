# Certbot 신규 발급과 실제 HTTPS 연결 · 2026-10-08

103번의 실제 Certbot 2.9.0-1로 `eztoy.app` staging 인증서를 새로 발급했다. 운영 계정/인증서를 덮어쓰지 않고, 기존 staging 계정의 private 복사본과 별도 `/etc/letsencrypt`, 로그 및 작업 저장소를 자식 mount namespace에 연결했다. 기존 공개 `/var/www/letsencrypt`에서 ACME 검증 파일만 일시 제공했다. 새 ACME 계정은 등록하지 않았다.

원래 Certbot GUI에서 신규 발급 노드를 선택해 webroot 명령을 검토했다. 같은 입력은 전용 계정으로 로그인한 인증 API를 통해 1회 제출했고 현재 canonical helper에서 실제 실행했다. GUI의 최종 발급 버튼을 클릭한 검사는 아니다. job `dd345512-e2ea-4e77-9d8d-af07c021e0c3`은 성공/exit 0으로 완료됐다. 원래 GUI 저장 기록 팝업에서 실제 발급 성공 로그를 열었고, 새로고침 후 인증서 노드 및 만료 정보 표시를 확인했다. 브라우저 오류/경고 0건, 로그아웃의 로그인 경로 이동 확인.

신규 발급된 인증서로 전용 루프백 nginx HTTPS 서버를 실행했다. 인증서 체인을 해당 테스트 저장소로 신뢰한 TLS 클라이언트에서 `eztoy.app` 호스트명과 실제 peer 인증서 SHA-256을 검증했다. TLS 1.3, HTTP 200, `한글 신규 인증서 HTTPS 검수` 응답 성공. 검증 비활성 옵션을 사용하지 않았다. 전용 nginx는 즉시 종료했다.

397개 전송 소스·현재 helper 해시 일치 확인. 운영 nginx graph·기존 갱신 파일/fullchain SHA 전후 동일. 공개 challenge 디렉터리 기존 파일/hash 동일. 자체 서버·private 인증서/계정 복사본·SSH 포워딩·브라우저 탭·로컬 로그인 파일을 정리했다.

증거: `.runtime/verification/certificate-webroot-original-gui-20261008/`의 `result.json`, `job.json`, `tls-proof.json`, `runtime-proof.json`, `source-manifest.json`, `cleanup.json`, `issued-history.png`. 이번 결과는 webroot 신규 발급/실제 TLS 및 GUI 기록 조회에 한정한다. nginx plugin 신규 발급에 따른 설정 변경·검토된 복원, 원래 GUI의 실행 중단 복구는 아직 남아 있다. 성공한 갱신 dry-run을 다시 실행하지 않았다.
