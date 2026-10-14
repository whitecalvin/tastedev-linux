# 수동 백업의 입력·권한 일치

2026-10-06

- 복구 화면의 수동 백업은 연결 상태, 진행 중 작업, 백업 대상 입력, 대상별 보안 정책을 모두 검사한다.
- nginx: 유효한 도메인, nginxChanges, sudoWithoutPrompt 및 관리자 helper 준비 상태가 필요하다.
- cron: cronChanges 및 서버 기능 허용이 필요하며 sudo는 요구하지 않는다.
- 서버 manualBackup에서도 동일한 입력 검증과 대상별 assertFeature 검사를 수행한다. 권한 검사는 crontab 조회나 helper 실행 전에 이루어진다. 요청/완료/실패를 감사 로그에 기록한다.
- 임시 인증·상태 디렉터리에서 operations-restore-selection, security, backup-catalog 테스트: 38 성공, 1 기존 조건부 검사 생략, 실패 0.
- 실제 브라우저 복구 화면: 빈 도메인 및 유효한 도메인 입력 후 관리자 준비가 안 된 상태에서 지금 백업 버튼이 비활성인 것을 확인했다. 실제 백업 작업은 실행하지 않았다.
- 이 변경 이후 전체 회귀 검사 1,011개 성공을 확인했다. production build는 아직 갱신하지 않았으며 이전 생산 빌드 증거는 이 변경 이전 소스에 한정된다.
