# PostgreSQL 그룹 설명·본문 정리 — 2026-10-06

연결·메모리·로그 그룹의 기존 간단한 폼에는 파일 전체 설정 화면과 달리 항목별 설명이 없었다. 선택 파일 편집 모드에서 port, max_connections, shared_buffers, work_mem, logging_collector의 기존 PostgreSQL 설명 카탈로그를 연결했다. 언어 변경 시 해당 언어의 설명을 표시하고 미번역 언어는 기존 보충 설명 표시 정책을 따른다.

본문의 PostgreSQL 백업 조회를 제거하고 기존 상단 백업/복원 팝업을 유지했다. 공통 헤더에서 표시하는 조회 전용 안내와 독립 설정 생성기의 저장 안내도 선택 파일 본문에서 제거했다. 독립 설정 생성기의 백업·저장 안내는 유지했다.

검사: package-config-render, package-config-ide-render, package-config-draft-response, package-ide-source-failure 9개 통과. 그룹 5개 항목의 설명이 17개 언어(ko/en/ja/zh/es/fr/de/ru/pt/ar/id/it/ka/pl/sv/tr/uk) 모두 렌더되는지 확인했다. 운영 설정/서비스/DB 또는 배포 패키지를 변경하지 않았다. 실제 브라우저 확인은 별도로 기록하며 전체 Linux 언어 번역 완료를 의미하지 않는다.

현재 소스 366개 빌드 /tmp/tastedev-current-build-gHMkWq에서 실제 브라우저 메모리 그룹 확인: 공유 버퍼·작업 메모리 설명이 표시되고 본문에는 백업 버튼/중복 조회 전용 안내가 없으며 상단 백업 버튼 1개가 유지됨을 확인했다. 읽기 전용 운영 fixture를 유지하고 로그아웃·임시 탭/서버 정리를 완료했다. 스크린샷 /tmp/tastedev-postgresql-groups-20261006.png. 이번 실제 GUI는 한국어 메모리 그룹에 한정하며 17개 언어 모두의 실제 브라우저 검수로 확대하지 않는다.
