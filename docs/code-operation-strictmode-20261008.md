# 코드 검수 개발 모드 초기화 수정 — 2026-10-08

MariaDB·Redis 코드 검수의 effect 정리가 요청 scope를 null로 만들고 재설정하지 않아, React StrictMode 재실행 뒤 검수 응답과 busy 해제를 버리는 문제를 수정했다. mount 여부와 렌더 scope를 구분하고 이전 대상의 결과·확인 상태는 새 렌더에서 숨긴다. 종료·권한·파일/API 전환 후 늦은 응답과 이전 이벤트는 적용되지 않는다.

PostgreSQL·MariaDB·Redis 코드 적용 및 PostgreSQL 백업 복원의 실패 후 자동 원복 결과는 성공 문구와 구별하고 role=alert로 제공한다.

관련 컴포넌트 33개 검사 성공. 효과 정리/재실행 → 검수 요청 → 처리 중 렌더 → 응답 → busy 해제/명시 확인 후 적용 버튼 활성화를 회귀 검사에 추가했다. 원래 멈춤은 실제 개발 브라우저에서 발견했고 수정 후 MariaDB·Redis 검수 완료·확인·결과 표시를 확인했다. 네 결과 화면 모두 실패/원복 경고 역할을 확인했다.

검사 로그: `.runtime/verification/code-operation-strictmode-20261008.log`.
첫 GUI 실행은 발견한 제품 오류로 FAIL. 다음 실행은 결과 파일 쓰기/읽기 경합으로 기록 실패했으며, 최종 실행은 임시 파일 rename 방식으로 결과를 전달했다. 각 실패 기록은 보존했다.

브라우저 API는 격리 fixture 응답이다. 운영 DB·서비스 적용 성공의 증거로 사용하지 않는다. 전체 목표는 미완료이며 설치 helper/systemd 전체 연동과 실제 인증서 흐름은 별도 남는다.

화면: `/tmp/tastedev-mariadb-validation-fixed-20261008.png`.

최종 GUI 결과: `.runtime/verification/postgresql-operation-gui-2026-10-08T05-00-24.869Z/result.json` (PASS). 자체 서버·임시 폴더·검사용 탭 정리 완료.
