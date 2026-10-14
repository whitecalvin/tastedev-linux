# PostgreSQL 전체 코드 강제 종료 후 원래 GUI 복구

103번 전용 18/linuxverify20261008 클러스터에서 398개 현재 소스 SHA를 확인한 원래 Next.js GUI와 canonical helper를 사용했다. GUI에서 work_mem 8MB 후보 검수와 적용을 실행하고, 파일 교체·중단 기록 저장 뒤 자체 systemd ExecStartPre가 대기하는 동안 명령·PID 시작 시각·mount namespace를 확인한 postgresql-code-apply helper 하나만 SIGKILL했다. native lock supervisor는 종료하지 않았고 자체 대기를 해제했다. 실제 DB는 8MB로 실행됐으며 journal 1개가 남았다.

같은 인증 GUI의 복구 페이지에서 전용 설정을 선택하고 중단 작업 조회→복구 확인을 실행했다. 한국어 ‘원본 설정 복원 및 서비스 복구 완료’를 관찰했다. 실제 systemd active/running, SQL 4MB, 원본 파일 SHA 4baec07bb611b9a8af0a677969907d81cc264e1edecc11d2dc587c81b8b490da 일치, journal 0개를 확인했다. 백업 ID는 444b288e-0ffa-41da-b920-aeb9a419b38f다.

이번 fixture에는 데이터 표식을 넣지 않았으므로 데이터 보존 검수로 확대하지 않는다. 최초 관찰에서 존재하지 않는 표식을 조회한 SQL 오류를 보존했으며 8MB 조회 자체는 성공했다. 로그아웃은 제출했으나 완료 이동을 기다리기 전에 탭을 닫았으므로 완료 관찰로 기록하지 않는다. 브라우저 오류 수는 result.json에 기록했다.

테스트 전용 서버·클러스터·runtime drop-in·private stage·터널·임시 로그인 파일을 정리했다. 설치 helper 원본은 교체하지 않았다. 증거: .runtime/verification/postgresql-code-interrupted-original-gui-20261008/. 전체 제품 완료 및 최종 배포 검증을 의미하지 않는다.
