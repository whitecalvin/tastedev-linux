# nginx 원본 GUI 및 실제 systemd 검수 — 2026-10-08

103번에서 현재 원본 Next 개발 GUI, Better Auth, 인증 API, 실제 sudo 및 canonical helper/native lock을 실제 전용 nginx systemd 서비스에 연결했다. 설치 패키지 inventory는 호스트의 읽기 전용 실제 dpkg status를 사용했다. nginx.service 이름만 전용 unit으로 매핑하며 PID·상태·reload는 실제 manager 동작이다.

로그인 → reviewed.conf 선택 → 코드 before를 after-gui로 편집 → 초안 반영 → nginx -t shell log 확인 → 설정·서비스 검토 → locale C 확인 → 적용을 실제 브라우저에서 실행했다. private network의 실제 HTTP 응답 after-gui를 native 별도 프로세스가 관찰했다. 생성 백업을 원본 GUI 복원 팝업에서 조회·선택·include 검사·서비스 검토·최종 확인·적용했다. 복원 완료와 HTTP before 복귀, 원본 bytes 일치를 확인했다. 로그아웃 후 로그인 경로 이동, 브라우저 경고/오류 0건을 확인했다.

복원 팝업 최초 자동 조회가 Strict Mode effect 재실행으로 두 API를 보내 kernel lock 충돌을 표시하는 오류를 발견했다. 같은 scope의 초기 조회 Promise를 공유하고 수동 갱신은 새 요청을 하도록 수정했다. 이전 연결의 응답은 계속 폐기한다. 수정본 전송 후 팝업을 새로 열어 자동 목록 조회 성공을 확인했다. 단일 초기 요청·수동 신규 요청·연결 변경의 과거 응답 폐기 및 기존 백업/복원/검토 회귀 총 15개 성공.

초기 테스트의 config restore 거부는 sandbox /tmp가 UID 65534로 보이는 권한 조건이었다. 제품 신뢰 규칙은 유지하고 같은 검사를 실제 호스트 /tmp에서 실행하여 성공했다. 최초 실패를 전체 성공으로 숨기지 않는다.

증거: `.runtime/verification/nginx-systemd-helper-20261008T105330Z/result.json`, `.runtime/verification/nginx-systemd-original-gui-20261008/final-source.json`, `applied-restored.png`. 초기 소스 해시를 보존하고 검수 중 전송한 nginx-backups-panel.jsx의 최종 해시를 별도 기록했다. 전체 전송 소스와 최종 수정본이 현재 소스와 일치한다.

기존 호스트 nginx 설정과 설치 helper 해시 유지, 전용 unit 종료, private stage/서버/계정 파일/포워딩/검수 탭 정리를 확인했다. 앞선 native 실제 reload 실패 자동 원복 증거는 docs/nginx-systemd-helper-20261008.md에 별도 있다. 이번 GUI는 정상 적용/복원 경로이며 실패/중단 GUI까지 확대하지 않는다. 신규 Certbot 발급/TLS 변경·Node/cron 전체 GUI 등 남은 요구사항은 미완료이고 목표는 PARTIAL이다. 최종 배포 패키지 검수는 수행하지 않았다.
