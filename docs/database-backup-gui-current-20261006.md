# Redis·MariaDB 수동 백업 GUI 확인

현재 359개 소스 빌드(`/tmp/tastedev-current-build-sqaVje`)의 실제 브라우저에서 각각 설정 파일 선택 → 헤더 백업 팝업 → 현재 파일 백업 → 완료 안내와 목록 증가를 확인했다. Redis 및 MariaDB 모두 기존 2개에서 3개로 증가했다. 초안이 아닌 선택된 운영 fixture 파일을 백업했다.

이 검사는 임시 namespace와 loopback 서버, 실제 Next.js/API/helper를 사용했다. 설치 목록은 두 패키지의 fixture adapter, sudo 전달도 fixture adapter다. 실제 DB 패키지 설치·서비스 시작/종료·DB 데이터 복구를 확인한 결과가 아니다.

화면 증거: `/tmp/tastedev-redis-backup-gui-20261006.png`, `/tmp/tastedev-mariadb-backup-gui-20261006.png`.

전체 자동 검사 결과는 FAIL로 보존한다: `.runtime/verification/database-backup-isolated-2026-10-06T00-02-09.841Z/result.json`. GUI의 상태 조회를 포함한 모든 systemctl 호출을 서비스 제어로 간주하는 sentinel에서 실패했다. 호출 인자를 기록하지 않아 조회/제어 여부를 이 실행의 로그만으로 확정할 수 없다. GUI 생성 결과만 확인 범위로 인정하며 전체 검사 PASS로 승격하지 않는다. 향후 검증기는 호출 인자 기록으로 읽기와 변경 명령을 구분해야 한다.

검사 종료 후 자체 생성 탭, 임시 서버 및 fixture를 정리했다. 호스트 서비스와 설정은 변경하지 않았고 DEB 검증은 실행하지 않았다.
