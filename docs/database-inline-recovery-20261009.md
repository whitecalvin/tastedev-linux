# Redis·MariaDB 코드 적용 팝업 중단 복구 연결

적용 API가 결과를 반환하지 못하면 같은 팝업에 기존 중단 복구 컴포넌트를 표시한다. 자동 복구를 실행하지 않는다. 사용자가 중단 기록을 조회하고 복구 영향을 확인한 뒤 실행한다. MariaDB 복구의 초기 main과 대상은 실제 선택했던 값이다.

복구 완료 뒤 이전 오류·검토를 비우고 완료 결과와 백업 ID를 유지한다. 기존 적용 확인은 소비되며 검수 버튼도 비활성화한다. 입력·연결·API·정책·화면 수명이 바뀌면 이전 복구 콜백은 새 화면의 상태를 갱신하지 않는다. 복구 완료 후 목록 갱신 실패는 복구 결과를 지우지 않는다.

실제 SWC로 컴파일한 코드 적용/복구 컴포넌트 검사 32개가 성공했다. 현재 소스 397개 Next.js production 컴파일도 성공했다. 빌드 결과: `.runtime/verification/source-build-2026-10-08T15-37-58.007Z/result.json`.

격리된 응답을 사용한 실제 브라우저에서 Redis와 MariaDB 검수→명시 적용→알 수 없는 중단→중단 조회→별도 복구 확인→완료 결과 유지를 직접 관측했다. MariaDB는 `/etc/mysql/mariadb.cnf`, `/etc/mysql/conf.d/app.cnf`가 그대로 전달됐다. 요청 목록에는 각 단계가 한 번씩만 있고, 복구 후 검수 버튼은 비활성화했다. 브라우저 오류는 0개였다.

스크린샷은 `.runtime/verification/code-recovery-inline-20261009.png`에 저장됐다. 이어 자동 GUI 결과 표식을 쓰는 과정에서 임시 저장 한도 오류가 발생해 JSON이 잘렸다. wrapper 실패 증거는 `.runtime/verification/code-recovery-gui-2026-10-08T15-36-12.138Z/`에 보존하며 자동 검수 전체 PASS로 변경하지 않는다. 같은 quota 때문에 첫 빌드도 실패했고, 종료가 확인된 자체 빌드 세 개의 생성 `.next` 출력만 제거하고 실패 컴파일 단계를 재실행하여 성공했다. 기존 source snapshot과 로그는 보존했다.

wrapper가 자체 서버·fixture를 정리한 뒤 브라우저 오류 페이지 정책으로 자체 탭 닫기가 거부됐다. 탭은 유지 표시하지 않았다. 이번 검수는 수정 UI 연결이며 실제 Redis/MariaDB helper 강제 중단·systemd 복구나 전체 제품 완료의 증거가 아니다.
