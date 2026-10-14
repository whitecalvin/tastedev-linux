# cron 인증 HTTP와 실제 crontab 연동

2026-10-06

일반 사용자 UID/GID를 유지한 bubblewrap 내부에서 실제 /usr/bin/crontab 실행 파일과 격리된 spool을 사용했다. 기존 13개 native 변경/복원 검사에 TCP HTTP 검사 8개를 추가하여 21개 모두 성공했다.

HTTP 검사는 Node HTTP fixture가 실제 lib/api.ts의 handle을 호출한다. Better Auth의 실제 세션 쿠키를 사용하며 로그인 정보는 임시 인증 디렉터리에만 존재하고 출력하지 않는다. Next.js 라우터 및 GUI 검사를 대신하지 않는다.

확인 항목: 미인증 요청 거부, OS 계정·실제 spool 조회, 외부 Origin 거부, 조회 전용일 때 변경·백업 차단, 확인된 작업 설치, 수동 백업의 실제 내용 SHA-256, 삭제 후 검토된 백업 복원, 완료 감사 기록. 마지막에는 fixture의 원래 예약 목록으로 되돌리고 HTTP 서버와 임시 인증/작업 디렉터리를 정리한다.

호스트 crontab, 서비스, 예약 실행 daemon은 변경하지 않았다. 예약 시각에 명령이 실행되는 검사와 실제 Next.js/브라우저 수용 검사는 남아 있다.

증거: .runtime/verification/cron-user-isolated-2026-10-05T20-44-42.986Z/result.json
