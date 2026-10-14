# MariaDB 운영 설정 한국어 안내

기존 24개에 43개를 추가해 서버 설정 67개의 한국어 설명을 연결했다. TLS 인증서·개인키 경로, 암호화 접속 제한, 바이너리/릴레이 로그와 복제, 읽기 전용 예외, 테이블/스레드 캐시, 임시 테이블·정렬·조인 메모리, 네트워크 제한 시간과 InnoDB 파일 쓰기·잠금 옵션을 포함한다.

이름을 추가 폼에서 선택하면 설명을 표시하며 파일의 기존 항목도 같은 설명으로 검색할 수 있다. 클라이언트 그룹과 알 수 없는 플러그인 옵션에 서버 설명을 붙이지 않는다. 폐기 예정인 `innodb_flush_method`는 기존 항목의 설명을 유지하되 새 설정 제안에서 제외한다. 새로운 제안은 66개다.

설명·그룹 분리·폐기 옵션 제외·기존 설정 편집·미적용 추가 입력 보존 관련 검사 8개 통과. MariaDB 11.8.6 공식 패키지 바이너리의 `--no-defaults --verbose --help`에 67개 옵션이 모두 존재하는 것을 확인했다. 이 명령은 서버를 시작하지 않는다. 플러그인 테이블 부재 경고는 도움말 원문과 구분해 기록하며 플러그인 옵션 전체를 검증한 것으로 보지 않는다.

증거: `.runtime/verification/mariadb-operational-help-20261007/result.json`, 동일 디렉터리의 `native-help.txt`. 최신 384개 소스 빌드 및 실제 한국어 GUI에서 설명 검색·단위 안내·개인키 경로 안내·폐기 제안 제외·원본 코드 보존·로그아웃·격리 원본 보존과 임시 서버 정리를 확인했다. 빌드/GUI 경로와 화면 증거는 결과 JSON에 연결했다. 첫 빌드의 쓰기 할당량 실패와 이전 자체 빌드 증거 보존/정리 기록은 `temporary-build-cleanup-20261007-11/result.json`에 남겼다. 모든 MariaDB 옵션 설명 및 실제 운영 설정 적용이 완료됐다는 의미는 아니다.

근거는 [서버 시스템 변수](https://mariadb.com/docs/server/server-management/variables-and-modes/server-system-variables.md), [TLS 변수](https://mariadb.com/docs/server/security/encryption/data-in-transit-encryption/ssltls-system-variables), [바이너리 로그 관리](https://mariadb.com/docs/server/server-management/server-monitoring-logs/binary-log/using-and-maintaining-the-binary-log), [InnoDB 변수](https://mariadb.com/docs/server/server-usage/storage-engines/innodb/innodb-system-variables.md) 및 로컬 공식 바이너리 도움말이다. 서버 버전에 따라 의미나 지원 여부가 바뀌는 항목에는 버전 확인 안내를 남겼다. 외국어 번역은 확장하지 않았다.
