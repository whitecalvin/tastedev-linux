# 데몬 페이지 실제 PostgreSQL 서비스 제어

103번 현재 398개 소스 SHA 확인한 원래 Next.js /daemon GUI·인증 API·canonical helper·설치 pg_ctlcluster/systemd로 전용 18/linuxverify20261008 클러스터만 검수했다. 검수용 private 정책에서 서비스 제어를 허용하고 기존 운영 정책과 sudo 설정은 변경하지 않았다.

GUI 중지→시작→재시작→재로드 네 작업을 각각 확인 체크 후 실행했다. 실제 PID는 중지 0, 시작 671061, 재시작 672990, 재로드 672990으로 확인했다. 매 작업 뒤 목록 상태 갱신, 확인 체크 소모, 재실행 비활성화를 확인했다. 원본 설정 해시는 유지했다.

CLI로 자체 private 정책의 serviceChanges만 끄고 GUI를 새로 로드했다. 확인 체크를 해도 실행 버튼은 비활성이다. 별도 동일 계정 인증 API의 정확한 전용 클러스터 재시작 요청도 403 차단, PID 유지, 감사 blocked 1건을 확인했다. 정상 작업 감사 요청/완료 4쌍과 차단 1건 총 9건이다. 보안 GUI 자체 토글/실제 sudo 정책 전환 수용으로 확대하지 않는다.

설치 PostgreSQL 18.6-1.pgdg24.04+2, 바이너리 SHA는 installed-version.json에 기록했다. 브라우저 오류 0, GUI 로그아웃·탭 종료·터널 종료·임시 로그인 파일 삭제·전용 서버/클러스터/private stage 정리 완료. 설치 helper는 교체하지 않았다.

증거: .runtime/verification/daemon-postgresql-original-gui-20261009/. 실제 패키지 설치, 다른 고정 서비스의 제어, sudo 정책 GUI 및 전체 목표 완료는 포함하지 않는다.
