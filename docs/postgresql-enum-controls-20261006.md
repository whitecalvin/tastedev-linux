# PostgreSQL 열거형 설정 선택 (2026-10-06)

설치된 PostgreSQL 18.6의 37개 ENUM 설정에 대해 -C 조회 모드에서 잘못된 값의 Available values 힌트를 수집했다. config_file=/dev/null로 조회하여 실제 클러스터 설정을 읽거나 서버를 시작하지 않았다. 37개 모두 허용값 목록을 얻었다.

GUI는 알려진 열거형을 선택창으로 표시한다. 기존 값이 목록에 없거나 다른 표기로 적혀 있으면 원문 옵션을 추가해 보존한다. 확장 모듈·미확인 설정은 텍스트 입력을 유지한다. 선택값은 편집 힌트이며 대상 서버에 대한 실제 검증을 대체하지 않는다.

컴파일된 GUI 테스트는 기존 REPLICA 표기·비활성 상태·주석을 유지하며 logical 선택으로 정확한 한 줄만 변경되는 것을 확인했다. 설명/GUI 집중 검사 8개 성공. 실제 화면의 wal_level 값은 replica, 목록은 빈 값/minimal/replica/logical, 높이는 32px. 시스템 설정 변경 없음.

화면: /tmp/tastedev-postgresql-enum-select-20261006.jpg. 전 제품 완료 또는 실제 운영 적용 증거가 아니다.
