# MariaDB 실제 중단 및 같은 팝업 복구

103번 전용 MariaDB systemd 서비스에서 현재 원래 Next.js GUI/인증 API/canonical helper를 사용했다. 398개 앱 파일 SHA-256을 읽어 대조했다. 기존 호스트 설정과 설치 helper는 보존했다.

웹에서 conf.d/fixture.cnf의 max_connections=100을 123으로 편집하고 실제 격리 후보 검수와 재시작 영향 확인 후 적용했다. 파일 교체·백업·journal 생성 이후 전용 restart 장벽에서 정확한 argv/mount namespace/시작 시각을 확인한 helper PID 842778만 SIGKILL했다. 대기 restart는 자체 abort 장벽으로 해제했으며 runtime 123 성공으로 기록하지 않는다.

한국어 알 수 없는 결과 안내, 선택 main/대상 파일 유지와 실제 journal 조회를 확인했다. 같은 팝업에서 별도 복구 확인 후 원본 설정 복원 및 서비스 복구 완료와 백업 ID 335c9036-93af-4e9b-914e-2acb860ff5ad가 유지됐다. 이전 검수 비활성화, 브라우저 오류 0, 로그아웃을 관찰했다.

실제 SQL max_connections=100, 한글 데이터 `한글 GUI 적용 복구`, 원본 설정 바이트 SHA-256 74e52bfb2d13ce72a1c3c21310a0ad7d8b7d16af3f3ba6142d072b14ed6e61c6, journal 삭제, active systemd의 새 PID 846796을 확인했다. 자체 탭과 터널을 닫고 임시 계정 파일을 삭제했다. wrapper가 전용 서비스 중지·stage 제거·호스트 snapshot 보존을 확인했다.

검수 wrapper의 최종 JSON 기록이 interruption-only 모드에서 제거된 planned 변수를 참조하여 실패했다. 첫 실패 결과는 `.runtime/verification/mariadb-helper-remote-20261008T155358Z/result.json`에 그대로 보존했다. 변수 참조를 수정하고 Python 구문을 확인했다. 이미 성공한 실제 GUI/native 흐름은 다시 실행하지 않았다. 따라서 통합 자동 결과는 PARTIAL이며 제품 전체 완료가 아니다.

직접 GUI/native 증거와 화면은 `.runtime/verification/mariadb-interrupted-original-gui-20261009/`에 있다. helper SHA-256은 7bb22d462cc920c8bb442e148157ff117cd2f8ac17a6ac36383e675712597053이며 서비스 정상/실패/백업 원복의 기존 성공 검사를 이번에 반복하지 않았다. Node 실패/중단 GUI, 약관 확인이 필요한 Certbot 최종 발급 등 기존 남은 범위는 그대로다.

## 2026-10-09 증거 대조

기존 GUI·native·wrapper 기록의 동일 백업 ID, SIGKILL 및 같은 팝업 복구, 원본 바이트와 SQL 값 100, 한글 데이터, 활성 서비스, journal 정리, 감사 결과와 환경 정리를 대조했다. 현재 MariaDB 관련 파일 및 helper/runtime 21개 SHA-256이 당시 manifest와 일치한다. 이 중단 복구 요구사항은 직접 증거로 확인되며 `acceptance-reconciled-20261009.json`에 기록했다. 원래 wrapper FAIL 및 통합 PARTIAL 기록을 덮어쓰지 않았다. 실제 성공 검사를 다시 실행하지 않았고 다른 설치 GUI 또는 전체 제품 완료를 주장하지 않는다.
