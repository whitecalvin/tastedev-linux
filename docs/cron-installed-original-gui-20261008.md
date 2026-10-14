# cron 원래 GUI와 설치 데몬 연결 — 2026-10-08

103번 전용 마운트 공간에서 현재 소스 396개 SHA-256 일치를 확인하고 일반 계정 whitecalvin으로 Next.js 원래 GUI를 실행했다. Better Auth 로그인 후 nginx 노드 컨텍스트 메뉴의 예약 작업에서 한글 활성 예약과 비활성 예약을 검토·저장·조회했다. 실제 설치된 setgid crontab(mode 2755), 변경하지 않은 호스트 PAM, 설치된 cron 데몬이 같은 마운트 공간에서 GUI 저장 예약을 실행했다. UID 1000과 `한국어 예약 실행` 출력, 비활성 예약 미실행을 확인했다.

같은 로그인 세션에서 복구 페이지의 원본 백업을 비교·복원하고 GUI 완료 상태를 관찰했다. 실제 설치 crontab -l 결과는 원본 빈 바이트와 정확히 일치했다. 로그아웃 후 로그인 화면, 브라우저 오류 0, 전용 서버/cron 종료 및 임시 폴더 삭제, 호스트 원래 예약 hash 보존을 확인했다. 임시 계정 파일/탭/터널을 정리했다.

설치 cron 버전 3.0pl1-184ubuntu2. 패키지 버전과 cron/crontab 바이너리 SHA-256, 현재 전송 소스 manifest는 `.runtime/verification/cron-installed-account-20261008T142002Z/`에 기록했다. GUI 캡처 및 결과는 `.runtime/verification/cron-installed-original-gui-20261008/`. source commit이나 배포 패키지 hash는 추정하지 않았다.

이 결과는 원래 GUI→인증 API→일반 설치 계정 crontab→실제 설치 daemon 실행→GUI 백업 복원의 연결 수용 검사다. 전체 제품 완료나 최종 배포 검증은 아니다.
