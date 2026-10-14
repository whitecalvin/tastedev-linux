# 192.168.0.103 설치 환경 조회

2026-10-06. 사용자가 지정한 SSH 장비에 기존 id_ed25519 키로 접속해 읽기 전용으로 확인했다.

tastedev-linux 0.1.0 서비스는 whitecalvin UID/GID 1000으로 실행 중이다. systemd의 NoNewPrivileges=no이며 실제 /usr/bin/crontab -l 조회가 성공했다. 예약 내용은 출력하거나 변경하지 않고 크기와 SHA-256만 기록했다.

nginx·cron 서비스는 active/running, Certbot timer는 active/waiting이다. postgresql.service는 active/exited인 상위 서비스이므로 실제 클러스터 실행 여부까지 입증하지 않는다. 패키지 버전과 관찰 상태는 JSON에 기록했다.

설치 앱 8791 포트의 overview·terminal·nginx IDE는 미인증 요청을 각각 로그인으로 이동한다. auth status는 authenticated=false, cron API는 401이다. 로그인 계정 생성/변경이나 인증된 운영 변경은 수행하지 않았다.

설치된 root helper SHA-256은 현재 개발 helper와 다르다. 따라서 이 설치 환경 조회는 현재 소스의 적용/복원 수용 검사로 사용할 수 없다. auth.ts 해시는 현재와 같지만 전체 설치 빌드의 동일성을 의미하지 않는다. 배포 패키지 hash와 source commit은 확인하지 않아 기록하지 않았다. 설치 파일·서비스·권한·예약 목록은 변경하지 않았고 DEB 검증도 수행하지 않았다.
