# PostgreSQL 중단 안내 및 동일 팝업 복구 실제 GUI

현재 398개 소스 SHA 확인 후 103번 전용 18/linuxverify20261008 클러스터와 원래 Next.js GUI/인증 API/canonical helper/설치 systemd로 검수했다. 원본 한글 표식 데이터와 SQL work_mem 4MB를 기록했다. 전체 코드 GUI에서 8MB 후보 검수·적용을 시작하고 파일 교체와 journal 저장 뒤 자체 ExecStartPre 대기 중 정확한 명령/PID 시작 시각/mount namespace로 식별한 적용 helper 하나만 SIGKILL했다. native lock supervisor는 보존하고 자체 대기를 해제했다. 실제 8MB 실행·한글 데이터·journal 1개를 확인했다.

같은 ‘PostgreSQL 코드 검수 및 적용 검토’ 팝업에 권한 실패 대신 한국어 결과 미확정 안내와 정확한 파일의 중단 조회/복구가 표시됐다. 팝업이나 페이지 이동 없이 조회→원본 복구 확인을 실행했다. ‘원본 설정 복원 및 서비스 복구 완료’와 백업 ID 2a8867c8-87a7-4430-9bba-4486b5a444ea가 유지되고 이전 검수 버튼이 비활성화됐다. 실제 원본 해시 일치·4MB·한글 데이터·systemd active/running·journal 0개를 확인했다.

PostgreSQL 18.6-1.pgdg24.04+2, 바이너리 SHA 492c356851c073d65e77b8cc5d22d10e05a07d54699c6427dcb01d36567af7d5. 브라우저 오류 0개, 초안 정리·로그아웃 화면 이동·탭 종료 확인. 자체 서버/클러스터/runtime drop-in/private stage/터널/임시 로그인 정보 정리 완료. 설치 helper 원본은 교체하지 않았다.

증거: .runtime/verification/postgresql-inline-recovery-original-gui-20261008/. 이 검수는 수정 팝업과 해당 실제 중단 복구 경로를 증명하며 전체 제품/다국어/최종 배포 완료로 확대하지 않는다.
