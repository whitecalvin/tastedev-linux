# 실제 ACME 중단 후 원래 GUI 재발급

103번 전용 nginx와 일회용 인증서 저장소에서 원래 GUI의 nginx staging 발급을 실행했다. 실제 Certbot이 challenge 설정을 생성한 시점에 해당 PID 1174857/시작 tick 118800588/mount namespace를 검증하고 정지 상태를 확인한 뒤 SIGTERM/SIGCONT를 전달했다. 설치된 Certbot의 신호 정리 처리를 사용했으며 가짜 Certbot 실행은 없다. native 로그의 Calling signal 15, 자식 종료, 실패 작업 9496d538-520d-401c-b972-0fb9b4c1172a를 확인했다.

GUI의 실패 결과와 백업 두 개를 확인하고, 전용 nginx 설정 두 파일의 현재 hash가 백업 원본과 일치함을 독립 검사했다. 발급된 인증서는 없었다. 같은 GUI에서 명시적으로 재발급하여 작업 3bd58f12-c0a1-47ea-8885-5ae2de7d6dd1의 성공/exit 0과 HTTPS 배치를 확인했다. 이는 취소된 ACME 주문 자체를 이어 쓰는 것이 아니라 Certbot을 다시 실행해 발급을 재시도한 결과다.

독립 TLSv1.3 인증서/호스트명 검증과 한글 HTTP 200, authenticator=nginx/installer=nginx, 백업 네 개 보존을 확인했다. 운영 설정·인증서와 공개 challenge 기존 파일 hash는 보존됐고 생성한 challenge·전용 unit·임시 저장소·계정·탭·포워딩은 정리했다. 실제 SIGKILL 웹 종료의 저장 기록 보존 증거와 이번 native SIGTERM 검수는 서로 별도 범위로 유지한다.

첫 SIGINT 검수와 전달기 오류의 FAIL/PARTIAL 기록은 그대로 보존했다. 후속 수정은 재시도마다 현재 작업 ID를 확인하여 같은 challenge 토큰도 전달하고 Certbot이 실제 처리하는 SIGTERM을 사용했다.

증거 `.runtime/verification/certificate-acme-interrupted-original-gui-20261008T171933Z/result.json`, `gui-observation.json`, `.runtime/verification/acme-sigterm-original-proof-20261009.json`, `.runtime/verification/certbot-native-acme-retry-success-20261009.png`. DEB 검증을 수행하지 않았다. 전체 제품 완료를 뜻하지 않는다.
