# PostgreSQL 원래 GUI 적용·복원 검수 (2026-10-08)

사용자의 추가 전송·GUI 검수 승인으로 103번 새 private /tmp 경로에서 원래 Next IDE와 인증 API, 현재 canonical helper, 실제 systemd 클러스터를 연결했다. 대상은 승인된 disposable 18/linuxverify20261008 (55432, TCP 비활성)만이다. 기존 설치 앱·helper·운영 DB는 변경하지 않았다.

원래 GUI에서 HBA 코드에 접속 권한을 늘리지 않는 테스트 reject 규칙을 추가하고, 적용 검토→최종 확인→적용 및 reload를 실행했다. 실제 pg_conf_load_time 변경과 pg_hba_file_rules 규칙 1개를 확인했다. GUI 백업 목록에서 적용 직전 원본을 복원하고 reload 후 테스트 규칙 0개와 원본 SHA-256 일치를 확인했다. 적용·복원 감사 기록은 각각 requested/completed 한 쌍이다.

원본/복원 SHA-256: d4adacc88d72a45f189e82d21bf0c6ecc4ce8256eeeecbf7caa55658dbe3e616. 설정 로드 시간은 15:23:24→15:31:16→15:32:26 (KST).

검수 중 개발 StrictMode의 중복 초기 조회가 helper 잠금과 충돌했다. HBA 검토 컴포넌트가 같은 scope의 초기 조회 Promise를 재사용하도록 수정했다. 관련 12개 검사 성공. 변경 파일 하나를 승인된 임시 source에 전송해 새 페이지에서 최초 검토가 단일 status/plan 요청으로 완료되고 잠금 오류 없이 변경 없음 화면을 표시하는 것까지 확인했다. 다른 파일/API/권한/재시도 scope는 새 검토를 수행한다.

초기 namespace에서 /var/lib/dpkg를 가려 PostgreSQL 미설치로 보인 fixture 문제도 해결했다. 기존 dpkg 정보만 namespace에 읽기 전용으로 연결했다. 실패 시도는 성공으로 계산하지 않는다.

증거: .runtime/verification/postgresql-original-gui-20261008/{result.json,native-result.json,final-logs.json,cleanup.json,applied.png,restored.png,single-review.png}. 전송 최초 목록은 postgresql-gui-transfer-plan-20261008/plan.json, 최종 source SHA 목록은 final-logs.json에 보존했다. 전체 제품 완료 증거는 아니다.

자체 임시 서버·전용 클러스터·private stage·SSH 포워딩·임시 계정 파일 정리 완료. 실제 systemd reload 실패 원복/작업 중단 복구, Certbot GUI 실제 ACME 흐름, 기타 패키지 전체 수용, OS IME/Tauri 창, AI 429 해결은 별도 남는다. DEB 생성·검증은 실행하지 않았다.
