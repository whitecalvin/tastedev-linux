# 현재 Next.js cron 변경·복원 연동 (2026-10-06)

`scripts/verification/cron-user-isolated.mjs --next-build /tmp/tastedev-current-build-UsgXsE`로 최신 358개 소스 빌드의 실제 Next.js 인증/API 라우트와 native crontab을 연결했다. 빌드 snapshot과 현재 소스 hash를 검사하며 기존 함수 직접 검사와 HTTP bridge 대신 Next.js 모드를 선택할 수 있게 했다.

실행 결과: `.runtime/verification/cron-next-isolated-2026-10-05T23-16-50.396Z/result.json`, 14개 검사 그룹 PASS.

실제 확인 범위:

- 실제 Next.js 로그인 라우트의 Better Auth 세션
- 인증된 cron 조회의 OS 계정/UID 및 native spool 내용 일치
- 인증 없음·외부 Origin·조회 전용·확인 없는 변경 차단
- 확인된 추가와 오래된 버전의 재요청 차단
- 비활성화/재활성화 및 기존 PATH·관리하지 않는 예약 작업 보존
- 수동 백업, 삭제, 복구 계획 조회, 검토한 백업의 복원
- 복원 후 추가 항목 정리와 원본 crontab 내용 일치
- 실제 변경 요청/완료/실패/차단 감사 결과가 중복 없이 기록되고 cron 명령 내용을 포함하지 않음

일반 OS 계정의 실제 UID/GID를 유지한 user/pid/network namespace와 별도 spool을 사용한다. `/usr/bin/crontab`은 원본과 같은 바이트의 fixture 복사본이다. fixture에서 해당 계정 소유 0755로 실행되므로 실제 설치 환경의 root:crontab setgid 및 spool 권한 검증을 뜻하지 않는다. 호스트 crontab·예약 서비스·시스템 권한을 변경하지 않았다. 임시 Next.js·계정·spool·fixture는 종료/정리했다.

브라우저 GUI 저장/복원과 cron daemon의 실제 예약 실행은 이 증거에 포함되지 않는다. 최초 Next.js 모드 실행은 기존 함수 검사에서 만들어지던 상태 폴더가 초기화되지 않아 준비 단계에서 실패했다. 별도 초기화를 추가한 뒤 최종 위 검사를 통과했다. DEB 검증은 수행하지 않았다.
