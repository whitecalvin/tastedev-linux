# MariaDB·Redis 적용 후 화면 갱신 — 2026-10-06

코드 검토 적용 화면에서 `onApplied`의 비동기 완료를 기다리도록 수정했다. 갱신을 기다리는 동안 실행 잠금을 유지하고, 갱신 실패가 API 적용 실패로 처리되거나 미처리 Promise rejection으로 남지 않도록 분리했다. 적용 또는 원본 복구 결과는 그대로 유지한다. 연결·입력·정책 scope가 바뀐 뒤 도착한 갱신 오류는 새 화면에 표시하지 않는다.

관련 실행: `node --test --test-isolation=none tests/redis-code-operation-component.test.mjs tests/mariadb-code-operation-component.test.mjs tests/postgresql-code-operation-component.test.mjs`

15개 검사 통과. 새 MariaDB/Redis 회귀 검사는 적용 성공 뒤 갱신 실패, 원본 복구 뒤 갱신 실패, 연결 종료 뒤 늦게 도착한 갱신 오류를 각각 확인했다. 실제 JSX를 Next SWC로 컴파일해 실행했다.

실제 MariaDB/Redis 서비스 재시작·DB 데이터 보존·권한 helper·GUI 수용 검사를 완료한 증거는 아니다. 현재 Redis 실행 파일은 임시 추출 경로에 존재하지만 production 격리 검수의 중첩 namespace 제약은 그대로이며, 이 수정에서 검수를 우회하지 않았다. DEB 검증은 실행하지 않았다.
