# PostgreSQL 전체 코드 실패 원복 GUI 연결 — 2026-10-08

현재 소스 398개 파일 SHA 일치를 확인한 원래 GUI→Better Auth 인증 API→canonical helper→실제 전용 systemd 클러스터에서 수행했다. 전용 runtime drop-in은 `work_mem=8MB` 후보만 실제 ExecStartPre 실패로 거부하고 원본으로는 시작을 허용했다. 검수 명령이나 PostgreSQL 바이너리 응답은 대체하지 않았다.

GUI 코드 보기에서 8MB 편집→격리 검수 성공→변경 확인→적용 후 실제 가드 기록은 REJECT_8MB/ALLOW_ORIGINAL 순서였다. GUI에 원본 설정·서비스 복구 안내와 실제 백업 UUID가 표시됐고, 이전 검수/확인/적용은 비활성화됐다. 원본 설정 SHA-256, 실제 SQL work_mem=4MB, 한글 테스트 행 보존, active/running 상태를 독립 대조했다. 실패한 편집 초안은 유지됐으며 정리 전 원본 텍스트로 되돌렸다.

로그아웃 확인, 브라우저 오류 0. 전용 서버/클러스터/가드 drop-in/원격 소스·계정·자체 터널·탭을 정리했다. 원래 설치 helper는 private mount로만 사용했다. 검사 대상은 새 일회용 linuxverify20261008 클러스터이며 기존 클러스터 설정을 변경하지 않았다.

증거: `.runtime/verification/postgresql-code-failure-original-gui-20261008/`의 result.json/native-result.json/cleanup.json/rolled-back.png/test-evidence.tar.gz. 압축 증거에는 설정 백업·웹 실행 로그·가드/SQL 기록만 넣었으며 인증 DB·비밀키·로그인 파일은 제외했다. PostgreSQL 설치 버전과 실행 바이너리 SHA는 native-result.json에 기록했다. 소스 commit과 배포 패키지 hash는 추정하지 않았다.

이 결과는 전체 코드 적용의 재시작 실패→자동 원복 경로다. SIGKILL 중단 및 수동 복구 GUI 연결은 별도 남으며 전체 제품 완료나 배포 검증으로 확대하지 않는다.
