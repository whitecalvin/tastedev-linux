# 패키지 IDE 선택 파일 조회 실패 처리 — 2026-10-06

선택 파일을 읽지 못했을 때 설정 패널이 로딩 상태에 머물거나 일반 안내만 표시하던 동작을 수정했다. 파일 경로, 실제 조회 실패 이유, 테두리 없는 재시도 아이콘을 표시한다.

선택 및 연결 범위가 달라진 뒤 도착하는 이전 요청의 오류는 무시한다. 재시도는 선택한 파일만 조회하며, 다른 파일의 편집 초안을 자동 교체하지 않고 기존 교체 검토 흐름을 유지한다. 파일 권한과 관리 작업 허용 정책은 변경하지 않았다.

## 검증

`node --test --test-isolation=none tests/package-ide-source-failure.test.mjs tests/package-config-ide-render.test.mjs tests/package-ide-popup.test.mjs tests/package-ide-initial-ssr.test.mjs tests/config-source.test.mjs`

14개 통과. 선택 파일 실패 표시, 파일별 재시도, 이전 선택 요청의 늦은 오류 무시, 재시도 성공 시 다른 파일 초안 보존 및 교체 검토를 포함한다.

실제 개발 서버의 PostgreSQL `/etc/postgresql/18/main/pg_hba.conf` 노드를 선택하고 패널의 재시도 버튼을 클릭했다. 두 조회 모두 현재 관리 helper 비활성 사유가 파일 경로와 함께 표시되었다. 권한을 변경하거나 설정 파일을 저장하지 않았다. 실제 권한 확보 후 성공 조회는 이 GUI 검사에서 확인하지 않았다.

화면 증거: `/tmp/tastedev-package-source-failure-20261006.png`.

이 검증은 해당 조회 실패 처리에 한정한다. 전체 제품 완료나 최종 배포 검증을 뜻하지 않는다.
