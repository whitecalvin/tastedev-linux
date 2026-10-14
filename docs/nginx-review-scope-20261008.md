# nginx 복원 검토 상태 전환 보완 — 2026-10-08

서버 API, 접속 상태, 권한 정책, 파일/코드/백업 대상이 바뀐 첫 렌더부터 이전 검토를 숨기고 이전 이벤트·응답을 차단한다. 기존 effect 초기화 이전의 틈을 닫았다. 최종 적용 확인은 요청 전 소비하며, 남아 있는 확인 체크박스 이벤트도 이를 재사용할 수 없다. locale 변경은 확인을 취소한다.

관련 14개 SWC 컴포넌트 회귀 검사가 통과했다. 실제 effect 이전 렌더, 이전 콜백, 늦은 응답, 사용한 확인 재실행을 포함한다. 테스트: `tests/nginx-review-scope.test.mjs`, `tests/nginx-apply-panel.test.mjs`, `tests/nginx-backups-panel.test.mjs`.

103번에 현재 소스를 전송하고 원래 nginx GUI 로그인·복원 팝업·조회 전용 diff/미선택 복원 비활성·로그아웃을 확인했다. 브라우저 경고/오류 0. 이번 조회 전용 임시 정책은 sudo 비밀번호 생략 옵션이 꺼져 있어 실제 백업 목록 조회는 거절되었다. GUI 결과는 PARTIAL이며 실제 복원 합격 증거가 아니다. 증거: `.runtime/verification/nginx-review-scope-gui-20261008/`. 운영 설정 복원·ACME 요청 없음.

첫 최종 빌드 시도는 임시 공간 quota로 실패했다. 이전 자체 빌드 증거를 보존하고 자체 임시 복사본만 제거했다. 전체 목표는 진행 중이며 실제 변경 파일 복원/TLS 검수는 남아 있다.

최종 현재 소스 390개 Next.js 운영 빌드 성공·빌드 중 소스 변경 없음. 증거: `.runtime/verification/source-build-2026-10-08T08-57-03.503Z/`. 로그/snapshot 보존·자체 임시 빌드 정리 확인. 103번 자체 임시 서버·private stage 제거, 설치 helper 교체 없음.
