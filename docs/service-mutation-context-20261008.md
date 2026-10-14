# Node.js 서비스 변경 및 백업 복원 검토 — 2026-10-08

기존 서비스 설정 변경과 서비스 백업 복원에서 API 함수 교체가 검토 무효화에 포함되지 않는 문제를 수정했다. 앱 계획·API·정책 전환의 첫 렌더부터 이전 검토/카탈로그/결과를 숨기고, 종료나 전환 후 이전 조회·확인·복원 핸들러를 transport 전에 차단한다. 부모 busy 피드백으로 disabled가 켜지는 경우는 새로운 동작만 차단하고 진행 중 응답은 정상 완료한다.

Node 변경·복원 실패 결과는 role=alert로 제공한다. MariaDB·Redis 일반 설정 적용에서 적용 실패 후 자동 복구된 결과를 적용 성공과 구분하여 원래 적용 실패를 명시하고 role=alert로 제공한다.

24개 관련 검사 성공: 실제 API 조회로 검토를 생성한 뒤 중복 확정 1회·원래 버전/백업 식별자 보존·API/앱/정책/disabled/unmount 이후 이전 콜백 차단·늦은 조회/완료 응답 폐기·원복 경고·runtime 없는 백업 조회와 복원 비활성·기존 MariaDB/Redis 적용 검사 포함. 이전 seeded state 테스트는 지속적인 refs/effects를 갖는 fixture와 실제 조회 흐름으로 갱신했다.

로그: `.runtime/verification/service-mutation-context-20261008.log`.

검사에서는 SWC로 실제 수정 컴포넌트를 컴파일했다. 마지막 전체 소스 빌드는 이번 네 컴포넌트 수정 전이므로 현재 전체 빌드 성공으로 확대하지 않는다. 신규 실제 브라우저 흐름·설치 helper/systemd 서비스 변경·복원 및 전체 목표는 별도 남는다. 운영 서비스·설정과 패키지는 변경하지 않았다.

## 후속 GUI 및 복원 문구 확인

실제 Next 개발 GUI에서 Node 설정 변경 최종 확인과 백업 선택/복원 확인 중 API 연결을 교체했다. 두 화면 모두 이전 검토/목록/확인 제거와 변경 요청 없음, 새 연결에서 재조회/확인 뒤 변경·복원 결과를 확인했다. 부모 busy 전달, 총 요청 8개와 두 제품 소스 SHA를 보존하고 자체 서버/폴더/탭 정리 완료. `.runtime/verification/service-mutation-gui-2026-10-08T05-10-16.544Z/result.json` (PASS). 화면 `/tmp/tastedev-node-service-mutation-browser-20261008.png`.

전체 회귀 최초 실행은 1358개 중 1355 성공·3 실패였다. Redis 백업 복원 실패 안내의 옛 기대값을 실제 문구로 갱신하고 적용 실패와 복원 실패 안내를 구별했다. 관련 후속 검사 30개 성공: `.runtime/verification/service-mutation-followup-20261008.log`. 일본어·터키어 nginx 설명 누락 두 실패는 한국어 우선 개발 이후의 다국어 작업에 남긴다. 전체 PASS로 처리하지 않는다.

최종 전체 재실행: 1358개 중 1356 성공·2 실패. `.runtime/verification/regression-current-20261008/result.json`. 최신 384개 전체 소스 컴파일 PASS: `.runtime/verification/source-build-2026-10-08T05-12-32.651Z/result.json`.
