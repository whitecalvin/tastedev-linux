# MariaDB 한국어 설정 설명

한국어 기능 완성 우선 방침에 따라 서버 주요 옵션 24개에 설명을 추가했다. 파일 설정 행과 새 항목 입력에 표시하며 설명 문장으로 검색할 수 있다. 옵션 이름의 하이픈/밑줄 표기를 모두 인식한다. 서버 그룹(server, mysqld, mariadb, mariadbd 및 숫자 버전 그룹)에만 표시한다. client 등 다른 그룹과 알려지지 않은 플러그인 옵션에는 서버 설명을 붙이지 않는다. 기존 번역 자료는 유지하며 새 번역은 추가하지 않았다.

공식 근거:
- https://mariadb.com/docs/server/server-management/variables-and-modes/server-system-variables
- https://mariadb.com/docs/server/server-usage/storage-engines/innodb/innodb-system-variables

관련 검사 10개 통과: 이름 별칭·그룹 구분·한국어 설명 검색, 클라이언트 비밀번호 가림, 그룹 필터, 중복 행 개별 편집, 값 없는 옵션, 내용 비우기 후 행 보존, 추가 대상 그룹, 미완성 입력, PostgreSQL/Redis 편집 회귀.

현재 383개 소스의 별도 빌드 성공: `.runtime/verification/source-build-2026-10-06T19-29-38.518Z/result.json`.

실제 브라우저 검사 PASS: `.runtime/verification/package-editor-gui-2026-10-06T19-31-14.732Z/result.json`. 자체 읽기 전용 설정과 격리 설치 목록 fixture를 사용했다. 한국어 설명 검색으로 max_connections 중복 두 행 표시, 두 번째 행만 250으로 편집, 내용 비우기 후 두 행 유지·주석 코드 반영, 첫 값과 다른 설정 보존, client 그룹 서버 설명 없음·비밀번호 가림, 로그아웃을 확인했다. 자체 서버·탭·fixture 정리 및 원본 설정 보존 완료. 화면 증거 `.runtime/verification/mariadb-korean-help-gui-20261007.png`.

24개 전체 옵션 개별 GUI·서버 검수 완료를 의미하지 않는다. 나머지 옵션 설명과 설치 버전별 지원 여부·운영 적용 검증은 남는다. 실제 서버 설정과 서비스는 변경하지 않았다.
