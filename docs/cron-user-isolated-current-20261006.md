# 일반 사용자 cron 변경·복구 수용 검사 — 2026-10-06

실행 명령: `npm run verify:cron:user:isolated`

증거: `.runtime/verification/cron-user-isolated-2026-10-05T20-32-28.245Z/result.json`

## 실제 확인

일반 OS 계정의 UID/GID를 유지한 user/pid/network namespace에서 실제 앱 함수와 native crontab을 실행했다. 운영 함수의 exec 경로를 가짜 함수로 교체하지 않았다.

13개 검사: 계정/목록 조회, 확인 없는 변경 거부, 저장, 변경 전 백업, 오래된 버전 저장 거부, 비활성화, 삭제, 오래된 버전 복구 거부, 원본 복구, 동시 저장 중 한 작업만 성공, 잠금/임시 파일 정리, 검토 후 변경된 백업 거부, backupVersion 누락 거부.

binary 바이트 동일성과 원본 소스 SHA-256, uid mapping을 결과에 기록했다. fixture의 crontab 복사본은 실행 사용자 소유이며 0755로 배치했다. 별도 `/var/spool`이 해당 계정 소유이므로 배포 장비의 setgid 소유권·권한 검사를 증명하지 않는다.

## 남은 범위

HTTP 인증/정책 API와 GUI의 실제 저장 전체 연동, 호스트 crontab 권한, cron daemon의 예약 실행은 미검증이다. 호스트 crontab과 시스템 권한은 변경하지 않았다.

개발 프로세스 `/proc/2560539/status`에서 UID/GID 1000, NoNewPrivs=1을 확인했다. 호스트 `/usr/bin/crontab`은 root:crontab 및 setgid mode이다. 해당 프로세스 경계에서는 setgid를 통한 crontab 그룹 전환이 제한되므로 Permission denied가 발생한다. 시스템 파일 권한 및 실행 보호 옵션을 변경하지 않았다. 설치 서비스 unit에는 NoNewPrivileges 옵션이 없으며 실제 설치 서비스의 동작은 별도 수용 검사 대상이다.

잠금 파일은 cron.flock으로 바뀌었으며 release 검사를 재실행했다. 상세: `cron-lock-current-20261006.md`.
