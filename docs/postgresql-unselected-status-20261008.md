# PostgreSQL 클러스터 선택 전 상태 표시 — 2026-10-08

현재 개발 서버의 실제 화면에서 최초 노드 미선택 상태에 상위 postgresql.service의 active/exited가 표시되어 DB 실행 상태로 오해할 수 있었다. PostgreSQL 헤더는 선택한 파일의 클러스터 service만 사용한다. 선택 전에는 클러스터 선택 전, 선택 후 서비스 정보가 없으면 확인 전, exited 서비스이면 프로세스 종료라는 한국어 안내를 사용한다. 시작/종료는 기존처럼 선택된 클러스터 unit만 대상으로 한다.

공통 패키지 상태 표시에 role=status·aria-live=polite를 추가했다. 실제 8787 개발 화면의 HMR 반영으로 클러스터 선택 전 표시와 시작/종료 비활성·왼쪽 노드를 선택하세요 안내 유지 확인. 사용자 원래 탭/선택/편집은 변경하지 않았다. 화면 `/tmp/tastedev-postgresql-unselected-status-20261008.png`.

관련 검사: `.runtime/verification/postgresql-unselected-status-20261008.log`. 공통 IDE 선택·초안·확인 흐름 및 SSR 초기 데이터 검사를 포함한다. 운영 서비스 상태/설정이나 배포 패키지는 변경하지 않았다.

Tauri 설정은 현재 개발 8787·설치 8791이며 두 모드 컴파일 증거가 이미 있다. 동일 입력의 Cargo 검사를 반복하지 않았다. 실제 네이티브 창과 OS 입력기 조합은 현재 컴퓨터 제어 도구에서 네이티브 API가 비활성이므로 별도 수용이 남는다.
