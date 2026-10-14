# MariaDB 최초 적용 수정 및 실제 systemd 적용·복원 — 2026-10-08

승인된 103번에서 현재 helper/native 검수를 전용 MariaDB 10.11.14 systemd 서비스까지 연결했다. private 데이터/Unix 소켓만 사용하고 TCP를 비활성화했다. systemctl 어댑터는 고정된 mariadb.service 인수를 자체 고유 transient unit으로만 연결하며, 실제 systemctl로 그 unit을 조회/재시작한다. 서비스 프로세스·실행 파일·main·UID·PID 검사는 현재 제품 코드 그대로 수행한다. 기존 운영 unit과 DB에는 접속/재시작하지 않았다.

처음 current helper의 mariadb-code-apply는 500으로 실패했다. 임시 helper 복사본의 errno/고정 경로만 계측하여 /var/lib/linux/admin/mariadb 폴더 ENOENT를 확인했다. 처음 적용 시 전용 백업 폴더를 만들지 않는 제품 오류였다. scripts/admin/linux-admin에 mariaBackupRoot를 추가하고 일반 설정 적용/전체 코드 적용에서 사용한다. 0700으로 생성하고 root 소유·디렉터리·심볼릭 링크·기존 공개 권한 거부는 유지한다. 기존 폴더 권한을 자동 변경하거나 자료를 지우지 않는다.

현재 helper의 실제 확인 9개: 후보 검수·오류 옵션·버전 충돌·symlink include·후보 정리 5개, 자체 systemd/Unix 소켓 및 한글 데이터, 전체 코드 적용 후 실제 PID 재시작과 max_connections 100→123, 백업 복원 후 원본 바이트와 값 100, native 시작 실패 뒤 자동 원복/서비스 재기동과 한글 데이터 보존이다. 잘못된 socket 경로는 후보 옵션 검사에는 통과하지만 서비스 시작에서 실패하도록 만들어 실제 원복 경로를 실행했다.

최종 증거 `.runtime/verification/mariadb-helper-remote-20261008T093719Z/result.json`. helper SHA는 현재 소스와 일치한다. host 설정/설치 helper 해시 유지·자체 unit 종료·전송물/데이터 제거를 확인했다. 관련 회귀 23개 통과: `.runtime/verification/mariadb-first-apply-20261008/`. 최초 제한 실행의 두 파일 실패 후 동일 두 파일 18개를 격리 실행 권한으로 확인했고 최종 관련 23개를 기록했다.

초기 Type=exec fixture는 준비 완료 전에 active를 반환해 실패 검수 조건이 맞지 않았다. 실제 MariaDB와 같은 Type=notify로 바꾸고 namespace의 /run tmpfs 때문에 감춰진 systemd 준비 소켓을 읽기 전용 연결했다. 첫 notify 제어 오류의 보존 stage /tmp/tastedev-maria-helper-7g4e5pn6은 unit inactive를 재확인한 뒤 정리했다. 이전 실패 결과(092940, 093016, 093122, 093230, 093343)는 보존한다.

이번 결과는 원래 GUI/API 전체 수용을 의미하지 않는다. 실제 helper→systemd 서비스 적용/복원/실패 원복은 확인했으며 GUI 연결 검수와 DB 내용 백업/복원은 별도 남는다. 배포 패키지 검증은 실행하지 않았다.
