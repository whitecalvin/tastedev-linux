# nginx 검토 적용 경로의 실제 프로세스 검사

실행: npm run verify:nginx:reviewed

임시 user/PID/network namespace와 설정 파일로 현재 applyReviewedNginx / restoreNginxConfiguration을 실행했다. 실제 nginx 바이너리의 전체 설정 검수, /proc 프로세스 신원 조회와 HTTP 응답을 확인했다. 6개 시나리오 통과:

- 다른 시작 시각으로 검토된 요청 거부
- include된 설정 파일 적용 뒤 HTTP 응답 before → after
- 이전 include graph 버전으로 재적용 거부
- 생성된 백업 복원 뒤 HTTP 응답 after → before
- 실제 nginx가 잘못된 지시어 거부, 운영 파일 유지
- 재로드 실패 주입 시 원래 파일 복구·실제 검수·재로드 및 journal 정리

systemctl show는 시험 프로세스 PID를 제공하는 어댑터이며 reload는 해당 격리 nginx의 -s reload로 연결한다. 따라서 실제 systemd 관리자·설치 root helper·브라우저 전체 적용 흐름을 증명하지 않는다. 호스트 운영 설정은 변경하지 않았다.

현재 증거: .runtime/verification/nginx-reviewed-isolated-2026-10-05T19-53-37.521Z/result.json
nginx와 검사한 핵심 소스 모듈의 SHA-256을 결과에 기록한다.
