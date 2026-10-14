# MariaDB 현재 helper 실제 격리 검수 — 2026-10-08

승인된 103번 장비에 현재 canonical helper와 runtime 143개를 root 전용 임시 폴더로 전송했다. 원격 MariaDB 10.11.14, bubblewrap 0.9.0을 사용했다. 자식 mount namespace 안에서만 helper/runtime·검수용 /etc/mysql·전용 /var/lib/linux 상태를 연결했다. 호스트 PID 공간을 사용하며 제품의 내부 bubblewrap 격리는 그대로 실행했다.

현재 helper의 mariadb-code-plan 및 native lock supervisor 경로에서 다섯 항목을 확인했다.

- 정상 max_connections 후보의 실제 private-options-validation 성공.
- 알 수 없는 옵션은 native 검수에서 거부하고 원본 설정 유지.
- 원본 버전 변경 시 후보 적용 검토 거부.
- include 폴더의 심볼릭 링크 거부.
- 원본 fixture 유지 및 임시 candidate 정리.

호스트 /etc/mysql 설정 파일 해시 및 설치 helper의 존재/해시를 전후 대조해 동일함을 확인했다. 실제 DB 시작, SQL 접속, systemd 명령은 실행하지 않았다. 자체 namespace 실행 종료와 임시 전송 폴더 정리를 확인했다. 현재 helper SHA-256은 증거에 기록했으며 로컬 원본과 일치한다.

첫 준비 시 설치 helper가 linux-admin 이름으로 존재한다고 가정해 FileNotFoundError가 발생했다. 장비의 설치본 이전 linex-admin 이름도 존재/해시 보존 검사에 포함하도록 검수 스크립트를 수정했다. 설치본 이름은 변경하지 않았다. 최종 verifier에는 자식 mount namespace 식별, process group 종료, 원본 보존 실패 시 임시 증거 유지 조건이 있다.

최종 증거: `.runtime/verification/mariadb-helper-remote-20261008T092520Z/result.json`. 앞선 실행은 `.runtime/verification/mariadb-helper-remote-20261008T092432Z/result.json`에 보존했다. 재검사는 verifier 종료/격리 조건 수정에 따른 것이다.

이번 결과는 현재 helper의 실제 설치 바이너리 후보 검수다. 실제 GUI→API→helper→systemd 설정 적용·실패 원복 및 데이터 내용 백업/복원은 별도 남는다. 제품 코드는 변경하지 않았으며 배포 패키지 검증은 실행하지 않았다.
