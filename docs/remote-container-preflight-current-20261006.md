# 지정 장비의 격리 검증 준비 (2026-10-06)

사용자가 지정한 SSH 192.168.0.103 / whitecalvin / id_ed25519로 읽기 전용 상태를 확인했다. tastedev-linux 0.1.0 서비스는 whitecalvin 계정, active/running이다. 설치 helper는 root:root 755이나 SHA-256이 현재 개발 소스와 달라 설치 환경 상태를 최신 helper 통과 증거로 사용할 수 없다. 설치 nginx는 active/running, PostgreSQL 총괄 unit은 active/exited, certbot.timer는 active/waiting이다. 총괄 unit의 active/exited를 DB cluster 실행 확인으로 해석하지 않는다. redis-server 경로는 조회되지 않았다.

기존 Docker 29.1.3에 공식 postgres:18 이미지를 준비하고 digest로 고정했다. 네트워크 none, root filesystem 읽기 전용, 호스트 mount/port 없음, 모든 capability 제거 후 SETUID/SETGID만 허용한 임시 컨테이너를 --rm으로 실행했다. DB를 시작하거나 호스트 DB에 접속하지 않았다.

root UID0 → 실제 postgres UID/GID999 전환과 PostgreSQL 18.6 실행 파일 버전 확인은 성공했다. 이전 개발 장비의 단일 UID mapping 제약을 피해 실제 계정 전환이 가능한 환경을 확보했다. 그러나 unshare --user --map-root-user /bin/true는 Operation not permitted로 실패했다. namespace 검수 단계는 미해결이며 PostgreSQL helper 전체 성공으로 주장하지 않는다. 기본 seccomp/AppArmor 등 어느 정책이 거부했는지는 아직 판별하지 않았다. privileged 또는 unconfined 실행으로 우회하지 않았다.

증거 `.runtime/verification/remote-container-preflight-20261006/result.json` PARTIAL. 컨테이너는 즉시 제거됐으며 공식 이미지는 후속 격리 검증에 사용할 수 있도록 남겼다. 운영 앱/DB/service/sudo 설정을 변경하지 않았고 DEB 배포 검증을 수행하지 않았다.
