# 패키지 설정 이름 제안

공통 파일 설정의 새 항목 이름 입력에 패키지별 datalist를 연결했다. PostgreSQL 기존 348개, Redis 기존 이름 카탈로그 203개, MariaDB 한국어 설명이 있는 서버 주요 옵션 24개를 제안한다. 한국어 설명이 있으면 제안 label에도 연결한다. 없는 설명을 만들지 않고 옵션 이름을 표시한다. 목록 외 확장 옵션도 직접 입력할 수 있다.

MariaDB는 선택한 서버 그룹에만 서버 옵션을 제안하며 client 그룹에서는 목록 연결을 해제한다. 다시 서버 그룹을 선택하면 복원한다. 하이픈 표기는 직접 입력 가능하며 도움말에서는 밑줄 별칭과 동등하게 처리한다. Redis 목록은 기존 Redis 7.0 이름/별칭 카탈로그를 재사용한 것이므로 설치 버전의 전체 지원 목록이나 실제 후보 검수를 대신하지 않는다.

컴파일된 공통 화면과 미반영 입력 관련 5개 검사 통과. 별도 최신 383개 소스 빌드 성공: `.runtime/verification/source-build-2026-10-06T19-32-59.622Z/result.json`.

MariaDB 실제 격리 한국어 GUI에서 input.list와 24개 목록/한국어 label 연결, long_query_time=2.5 추가 및 다른 코드 전부 보존, client 선택 시 서버 목록 없음·server 복귀 시 목록 복원, 로그아웃을 확인했다. UI 자동완성 팝업의 키보드 선택은 이번 증거에 포함하지 않는다. Redis의 추가 제안 목록은 컴파일 컴포넌트 범위이며 실제 브라우저 확인은 남아 있다. 운영 설정/서비스 변경 및 배포 검사는 하지 않았다.

화면: `.runtime/verification/mariadb-setting-completion-gui-20261007.png`.

실제 GUI 결과 PASS: `.runtime/verification/package-editor-gui-2026-10-06T19-34-06.977Z/result.json`. 자체 서버·계정·탭·fixture 정리와 읽기 전용 원본 보존 확인 완료.
