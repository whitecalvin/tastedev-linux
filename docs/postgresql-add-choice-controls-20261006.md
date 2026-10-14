# PostgreSQL 새 항목 선택 입력 (2026-10-06)

새 항목 추가 폼에도 기존 행과 같은 Boolean·Enum 허용값 선택 입력을 연결했다. 설정 이름에 ssl을 입력하면 on/off, wal_level을 입력하면 minimal/replica/logical 선택지가 나온다. 알 수 없는 확장 항목은 텍스트 입력을 유지하며 기존에 입력한 값은 임의로 변경하지 않는다.

선택 입력의 설정값 비우기는 해당 행을 유지하면서 비활성화한다. 유효한 빈 문자열 Enum은 PostgreSQL 코드 표기인 두 작은따옴표로 제공하여 편집기의 비우기 선택지와 구별한다. ssl_max_protocol_version의 중복 빈 값 옵션으로 발생하던 React 키 중복 오류도 해결했다.

관련 GUI 및 PostgreSQL/MariaDB/Redis 파서 테스트 14개 성공. 실제 브라우저에서 새 Enum 및 Boolean 선택 입력 높이 32px 확인. 수정 후 PostgreSQL 파일과 새 빈 문자열 Enum 폼을 렌더링한 탭의 error 로그는 0개였다.

증거 화면: `/tmp/tastedev-postgresql-add-empty-enum-20261006.jpg`. 실제 설정 파일이나 서비스는 변경하지 않았다. PostgreSQL 18 자료형 메타데이터는 편집 힌트이며 다른 버전의 네이티브 검증을 대신하지 않는다.
