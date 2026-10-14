승인 후 실행 완료: `docs/postgresql-systemd-fixture-20261008.md`. 아래는 실행 전 보존 계획이다.

# 103번 systemd 클러스터 검수 준비

상태: 실행 준비, 호스트 변경 미실행. 사용자의 호스트 PID/procfs 및 namespace 임시 검수 승인을 신규 호스트 클러스터 생성 승인으로 확대하지 않았다.

읽기 전용으로 103번의 pg_createcluster/pg_dropcluster/pg_ctlcluster, PostgreSQL 18 initdb와 systemd template의 root 소유·실행 경로를 확인했다. `/etc/postgresql/18` 및 `/var/lib/postgresql`은 PostgreSQL 계정 소유다. 기존 template이 cluster별 start/stop/reload와 PIDFile을 제공한다.

준비한 도구: `scripts/verification/postgresql-systemd-fixture.mjs`. `--plan`은 범위만 출력하며 systemd 조회나 파일 생성을 하지 않는다. Node 구문 및 plan 출력 확인 완료. 실제 호스트 실행은 root, 명시적인 실행 인수, `TASTEDEV_SYSTEMD_VERIFY_CONFIRM=linuxverify20261008`, root 소유 staging runtime과 manifest 일치를 요구한다.

정확한 변경 범위:

- 신규 클러스터: `18/linuxverify20261008`.
- systemd 유닛: `postgresql@18-linuxverify20261008.service`만 시작·reload·종료.
- 설정: `/etc/postgresql/18/linuxverify20261008`.
- 데이터: `/var/lib/postgresql/18/linuxverify20261008`.
- 새 로그: `/var/log/postgresql/postgresql-18-linuxverify20261008.log`.
- Unix socket 포트 식별자: 55432. listen_addresses를 비워 TCP 수신을 하지 않는다.
- 시작 정책 manual. 자동 시작 활성화와 기존 클러스터 변경 없음.
- 백업은 root 소유의 자체 전송 staging 폴더 아래 `verification-backups`.

예정 검사는 실제 systemd/프로세스/실행 중 설정 식별, native HBA 검토, 적용·백업·실제 reload 수용, 백업 복원, 잘못된 후보 거부, 자체 한글 데이터 보존이다. 현재 coordinator와 기본 systemd service hooks를 사용한다. 현재 설치 helper 교체나 GUI 전체 경로를 검증하는 것은 아니다.

동명의 설정·데이터·로그·socket이 이미 있으면 변경 전에 거부한다. 정리 전에 자체 marker, 설정/데이터 디렉터리 inode·dev, 비-HBA 설정 hash를 확인하며 같을 때만 신규 클러스터를 중지·삭제한다. 확인이 실패하면 임의 삭제하지 않고 cleanupRequired를 기록하고 복구용 전송 staging/백업을 보존한다. 생성 도중 불완전 상태도 cleanupRequired로 기록한다.

원격 도구의 실행 모드는 `--host-systemd-fixture`다. 아직 실행하지 않았다. 신규 호스트 systemd 클러스터 제어에 대한 사용자 승인 후에만 실행한다. 최종 배포 패키지 검증은 포함하지 않는다.
