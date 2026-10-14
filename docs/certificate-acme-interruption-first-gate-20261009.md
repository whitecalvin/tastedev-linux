# 실제 ACME 중단 검수의 첫 실패 게이트

실제 Certbot PID/시작 시각/전용 mount namespace를 확인하여 SIGINT를 전송했다. GUI의 실패와 백업 두 개, 원본 설정 hash 복구 및 자식 종료는 확인했지만 Certbot 로그는 AuthorizationError를 기록했으므로 신호로 인한 종료로 판정하지 않았다. 재발급도 검수 전달기의 중단 토큰 제외 로직 때문에 HTTP 인증에 실패했다.

원래 FAIL 결과와 PARTIAL 직접 관찰을 보존하고 전용 unit·challenge·임시 계정/저장소·탭·터널을 정리했다. 설치된 Certbot error_handler는 SIGTERM 정리 처리를 제공한다. 후속 검수는 실제 challenge 설정 생성 직후 전용 native PID를 정지 상태로 확인한 뒤 SIGTERM/SIGCONT로 중단하며, 재발급은 토큰만이 아닌 현재 작업 ID로 구분한다. 후속 검수 결과는 아직 미완료다.

증거 `.runtime/verification/acme-interruption-first-gate-20261009.json`, `.runtime/verification/certificate-acme-interrupted-original-gui-20261008T171301Z/result.json`.
