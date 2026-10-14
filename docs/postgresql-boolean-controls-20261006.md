# PostgreSQL 불리언 설정 선택 (2026-10-06)

설치된 PostgreSQL 18.6의 --describe-config 출력에서 348개 항목의 타입 정보를 추출하여 편집기 힌트로 저장했다. BOOLEAN 항목은 NativeSelect의 on/off 선택으로 표시한다. 기존 TRUE, false, 1, 따옴표 값 같은 원문 표기가 있으면 별도 옵션으로 그대로 보존하며 자동 정규화하지 않는다. 빈 값 선택은 기존 내용 비우기 경로로 처리한다.

이 정보는 GUI 편집 힌트다. 설치된 다른 버전 또는 확장 모듈의 미확인 항목은 텍스트 입력을 유지하며 저장/운영 검증은 실제 서버로 별도 수행한다. 내부 숫자 범위를 사용자 단위 입력의 검증 규칙으로 적용하지 않는다.

컴파일된 GUI에서 기존 TRUE 유지와 off 선택 시 정확한 한 줄 변경, 다른 DB GUI/파서 회귀 포함 8개 테스트 성공. 실제 /etc/postgresql/18/main/postgresql.conf 화면의 ssl은 값 on, 선택 값 빈 값/on/off, 높이 32px이다. 화면 관찰만 수행했으며 파일 값과 운영 설정을 변경하지 않았다.

화면: /tmp/tastedev-postgresql-boolean-select-20261006.jpg. 전체 제품 완료 또는 전 언어 원어민 검수 증거가 아니다.
