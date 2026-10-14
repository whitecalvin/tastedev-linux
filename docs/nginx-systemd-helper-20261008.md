# nginx 실제 systemd helper 검수 — 2026-10-08

103번 사설 네트워크와 전용 설정의 임시 systemd unit에서 현재 canonical root helper 및 native lock supervisor를 실행했다. 서비스 이름 어댑터는 nginx.service를 전용 unit으로 매핑할 뿐이며 상태·PID·reload 결과는 실제 systemd에서 읽고 실행했다. 실제 /proc 실행 파일과 master process 제목·시작 시각을 제품 검사로 확인했다. sudo 응답이나 서비스 상태를 만들어 반환하지 않았다.

6개 실제 검사 성공:

- 오래된 실제 프로세스 시작 시각을 담은 적용 거부, 원본 보존.
- 현재 helper의 후보 검수·전체 설정 적용 및 실제 systemd reload, HTTP before → after.
- 이전 include 그래프의 재사용 거부.
- 생성된 백업의 helper 복원 및 실제 reload, HTTP before 복귀·원본 바이트 일치.
- 잘못된 native nginx 지시어를 운영 파일 변경 전에 거부.
- 전용 ExecReload를 한 번 실패시켜 helper가 원본 설정을 복원하고 다음 실제 reload로 서비스 복구. journalCleanupVerified 확인·HTTP before 유지.

nginx 실제 실행 버전 1.31.6, 패키지 nginx 1.31.6-1~noble 및 nginx-common 1.24.0-2ubuntu7.8. nginx-core 조회 버전은 비어 있어 설치로 추정하지 않는다. 실행 파일 SHA-256 8a27bd4b1960fafff9fa7a47828f1042fd968e3e682772ac0d5a5254e0cb0e30. 제품 runtime/helper 전송 해시는 현재 소스와 일치한다.

첫 두 준비 실패는 private /etc의 root 사용자 이름 정보 누락이었다. 실패 기록을 보존하고 계정 이름 정보만 전용 namespace에 연결했다. 호스트 nginx.conf/설치 helper의 해시 보존, 전용 unit 종료·private stage 삭제 확인. 사설 네트워크의 HTTP만 사용했다.

증거: `.runtime/verification/nginx-systemd-helper-20261008T104641Z/result.json` 및 `source-package-check.json`. 앞선 정상 적용 5개 결과는 `nginx-systemd-helper-20261008T104536Z`이며 추가 실패 복구 검사는 최신 6개 결과에 있다.

범위는 native helper/systemd 적용·복원·실패 복구다. 이 전용 서비스를 원본 브라우저 GUI에 연결한 수용 검사와 신규 Certbot 발급/TLS 변경은 아직 남는다. 전체 목표 상태 PARTIAL. 최종 배포 패키지 검수는 수행하지 않았다.
