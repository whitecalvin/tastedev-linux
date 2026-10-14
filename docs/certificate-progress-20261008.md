# Certbot 중단 시 진행 로그 보존

2026-10-08. 이전 구현은 최초 작업 의도와 완료 기록만 디스크에 저장했다. 실행 중 웹 프로세스가 종료되면 생성된 nginx 백업 ID가 메모리 로그와 함께 사라질 수 있었다.

현재는 실제 certificate stdout/stderr 수집과 spawn 오류마다 running snapshot을 복제해 직렬 저장한다. `savePendingAdminJobProgress`는 기존 private 의도 파일의 작업 ID·시작 시각·명령을 확인한 뒤 임시 파일 write/sync, atomic rename, directory sync로 갱신한다. 최초 의도가 없거나 완료 기록이 있으면 갱신하지 않는다. 다른 명령·시작 시각·잘못된 상태·권한·심볼릭 링크를 허용하지 않는다. 종료 결과 기록 전에 진행 저장 대기열을 마쳐 늦은 업데이트가 완료 기록 뒤에 발행되지 않게 한다.

저장 오류는 raw 오류/경로를 노출하지 않고 최종 로그에 고정된 한국어 주의 안내를 추가한다. 조회 시 종료 결과를 모르면 기존 `recovery-required` 상태와 잠금을 유지하며 자동 재실행하거나 성공/실패로 추정하지 않는다.

수정: `lib/admin-job-record.ts`, 신규 `lib/admin-job-progress.ts`, `lib/server-tools.ts`.

검증:

- 최신 관련 19개 검사 성공. 실제 private 파일 갱신·한글/백업 ID·새 서버 프로세스 조회·직렬 snapshot/실패·완료 후 갱신 차단·명령/시작 시각/권한/링크 방어·기존 API/기록/긴 출력 회귀 포함.
- 전용 자식 프로세스에서 현재 writer로 진행 기록을 저장한 후 해당 프로세스만 SIGKILL했다. 새 프로세스의 실제 `operationJob`가 백업 ID와 한글 로그, recovery-required, exitCode null을 읽으며 자체 테스트 잠금이 유지됨을 확인했다.
- 운영 서버나 실제 Certbot을 종료하지 않았다. 전용 child와 private fixture는 정리했다. 이 검사는 저장 완료 후 프로세스 종료 시 보존 범위이며 전원 장애·동기화 전 강제 종료·실제 103번 원래 GUI/실행 중 helper 종료 전체 수용을 대신하지 않는다.
- 증거: `.runtime/verification/certificate-progress-20261008/{regression.log,regression.json}`.

실제 신규 발급/TLS 변경·복원 및 전체 제품 목표는 진행 중이다. DEB 빌드/검증은 실행하지 않았다.

현재 소스 389개 Next.js 빌드 성공 및 빌드 중 변경 없음. `.runtime/verification/source-build-2026-10-08T08-33-39.970Z/{result.json,build.log,source-snapshot.json,cleanup.json}`에 보존하고 자체 빌드 경로를 정리했다.
