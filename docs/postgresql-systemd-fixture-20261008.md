# 103번 실제 PostgreSQL systemd 연동 검수

사용자 승인 후 전용 클러스터 `18/linuxverify20261008` 및 해당 systemd 유닛만 생성·시작·reload·중지·삭제했다. 현재 runtime 141개와 HBA coordinator의 기본 systemd hooks를 사용했다. 설치 helper를 교체하지 않았다.

최종 증거: `.runtime/verification/remote-postgresql-host-jail-20261008T055347Z/result.json` — 6개 검사 성공.

- 실제 systemd MainPID·PostgreSQL 프로세스·설정/데이터 경로 식별 및 TCP 비활성 확인.
- native HBA 검토 시 원본 보존.
- 설정 교체·원본 백업·실제 systemd reload 후 pg_conf_load_time 변경 확인.
- 백업 복원 및 실제 systemd reload.
- 잘못된 native 후보를 원본 교체 전에 거부.
- 자체 DB의 한글 데이터 및 HBA 외 설정 보존.

전용 서비스 중지·클러스터/임시 전송 폴더 삭제를 결과에서 확인했다. 마지막 별도 읽기 전용 검사에서도 설정·데이터·로그·PID·소켓 경로가 없고 MainPID=0, inactive/dead임을 확인했다. 기존 클러스터 설정과 설치 helper를 바꾸지 않았다.

첫 실행 `055134Z`는 pg_createcluster에 빈 옵션을 전달해 기본 localhost가 적용되어 실패했다. 서비스는 중지했고, pg_dropcluster 뒤 자체 마커만 남은 폴더와 전송 폴더를 검증해 정리했다. 후속 정리는 해당 증거 폴더의 cleanup-followup.json에 기록했다. 두 번째 `055255Z`는 인용된 빈 값을 호스트 이름으로 해석해 기동 실패했으며 정리는 성공했다. 실패 기록을 보존했다.

검수 도구는 새 전용 설정 파일에 listen_addresses = ''를 명시하고, 삭제 후 자체 마커의 목록·내용·폴더 inode 확인을 거쳐 잔여 폴더를 제거하도록 수정했다. 제품의 정책 또는 기존 DB 설정은 변경하지 않았다.

이는 실제 host systemd와 현재 coordinator의 적용·복원 수용 증거다. 원래 설치 IDE에서 현재 installed helper를 통한 전체 GUI 수용과 실제 서비스 실패·중단 복구 전체 흐름까지 확대하지 않는다. DEB 검증은 수행하지 않았다.

## 현재 canonical helper 후속

`.runtime/verification/remote-postgresql-host-jail-20261008T060535Z/result.json`의 후속은 9개 검사 성공이다. 기존 native coordinator 6개에 더해 현재 root helper를 canonical 경로로 실행해 HBA 검토→적용→실제 systemd reload와 자체 백업→복원→reload를 확인했다. 이후 한글 데이터와 Unix 소켓 전용 설정이 유지된다.

현재 helper와 manifest 검증 runtime은 자식 mount namespace에만 canonical 경로로 연결했다. 백업은 임시 stage/helper-state로 분리하고 /var/lib는 그 자식 안의 tmpfs를 사용했다. 전용 PostgreSQL 실제 경로는 bind로 유지했다. 기존 installed helper와 운영 백업 경로는 교체하지 않았다. 서비스·클러스터·임시 stage 정리가 성공했다.

이전 `060403Z`에서는 호스트에 /var/lib/linux mount target이 없어 helper 진입 전에 실패했다. 기본 native 검사 6개와 클러스터 정리는 성공했으며 실패 기록을 보존했다. 대상 경로를 호스트에 생성하지 않고 자식 namespace 내부에서 생성해 후속을 완료했다.

후속은 canonical current helper→actual systemd 연동을 증명한다. 원래 설치 IDE/인증 API에서 해당 helper까지 연결하는 GUI 전체 흐름과 실제 systemd 실패·중단 복구는 별도로 남는다.

## 실제 서비스 상태 변경 후 이전 검토 거부

`.runtime/verification/remote-postgresql-host-jail-20261008T060731Z/result.json`: 후속 11개 검사 성공. 새 검사는 실제 전용 systemd 서비스를 검토 이후 중지한 경우와 다시 시작해 postmaster PID/시작 식별자가 변경된 경우다. 두 경우 모두 canonical helper가 이전 reviewVersion/확인을 HTTP 의미 409 오류로 거부하고 원본 HBA를 보존했다. 새 프로세스에 대해 다시 검토한 후 적용·실제 reload·백업 복원은 성공했다. 한글 데이터·TCP 비활성 유지, 서비스 중지·클러스터와 임시 stage 삭제도 성공했다.

서비스 상태 변경은 fixture unit만의 systemctl stop/start이며 검수 hook 주입으로 오류를 흉내 낸 결과가 아니다. reload 실패 후 자동 원복 또는 SIGKILL 복구를 실제 systemd 경로에서 검증했다고 확대하지 않는다.
