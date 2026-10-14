# 설치 경로 helper의 격리 실행 검사

명령: npm run verify:nginx:helper

현재 소스의 helper를 /usr/lib/tastedev-linux/scripts/admin/linux-admin 경로에, adminRuntimeFiles 전체와 SHA-256 manifest를 runtime 경로에 복사한 임시 namespace에서 검사했다. DEB 생성/설치 검사는 수행하지 않았다.

실제 nginx와 프로세스 조회를 사용하여 7개 시나리오 완료: 이전 서비스 시작 시각 거부, include 파일 적용과 HTTP 응답 변경, 이전 graph 버전 거부, 백업 복원과 HTTP 응답 원복, 실제 구문 오류 거부, 재로드 실패 시 파일·서비스 복구와 journal 정리, runtime 체크섬 불일치 거부. helper는 실제 flock 잠금·상속 FD supervisor·root 소유권·manifest 검사를 수행했다. 운영 소스의 검사 조건은 변경하지 않았다.

근거: .runtime/verification/nginx-helper-isolated-2026-10-05T19-55-23.347Z/result.json

전체 장비의 /usr, /etc/nginx, /var/lib는 변경하지 않았다. namespace의 systemctl 실행 파일만 어댑터이며 show는 격리 nginx PID, reload는 해당 프로세스의 nginx -s reload로 연결했다. 실제 systemd 관리자·sudo 호출·설치된 DEB·브라우저 API 전체 연결은 아직 검사하지 않았다.
