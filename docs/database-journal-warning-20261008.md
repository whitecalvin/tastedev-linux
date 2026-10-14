# DB 적용·복원 결과 안내 — 2026-10-08

MariaDB 백업 복원의 적용 실패 후 자동 원복 메시지를 백업 복원 실패로 명시하고 role=alert로 구분한다. MariaDB 일반 설정 적용·백업 복원과 Redis 일반 적용/복원에서 journalCleanupVerified=false이면 파일 작업이 끝났어도 중단 기록 정리 미확인 경고를 표시한다. 운영 작업의 중단 기록을 임의 삭제하거나 자동 재실행하지 않는다.

관련 회귀 검사: `.runtime/verification/database-journal-warning-20261008.log`. API 조회→검토→확인→복원 및 비동기 목록 갱신 실패 후 원래 결과 보존, 기록 정리 미확인 경고, API 연결 교체의 첫 렌더부터 이전 경고 제거를 포함한다. 실제 제품 컴포넌트를 SWC로 컴파일했다. 운영 helper/서비스 실행과 새로운 브라우저/전체 빌드는 이번 검사에 포함되지 않는다.

103번 systemd 실제 연동의 전용 `18/linuxverify20261008` 클러스터 생성·시작·reload·중지·삭제 승인을 요청했다. 사용자의 /proc·호스트 PID 승인과 구분하며 아직 생성하지 않았다. 준비된 도구는 `scripts/verification/postgresql-systemd-fixture.mjs` 및 원격 전송 실행 도구의 `--host-systemd-fixture`이다. TCP listener 없음·start-conf manual, 기존 클러스터 및 설치 helper 무변경·검수 후 정리를 계획한다.
