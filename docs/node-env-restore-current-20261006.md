# Node.js 환경 파일 복원 요청 처리

복원 확인 버튼의 중복 클릭이 복원 API를 여러 번 호출할 수 있던 문제를 막았다. 실행 시 연결·편집 정책·확인 상태를 다시 확인한다. 연결 API가 교체되면 이전 연결의 복원 결과와 갱신 callback을 폐기한다.

복원 완료 뒤 부모 화면의 비동기 갱신을 기다리는 동안 잠금을 유지한다. 갱신이 실패하더라도 실제 복원 성공 안내를 유지하고 별도 갱신 오류를 표시한다. 저장 실패 응답은 완료로 표시하거나 부모 화면의 새 기준으로 전달하지 않는다.

관련 JSX 실행 및 Node IDE/환경 파일 회귀 검사 13개 통과:

`node --test --test-isolation=none tests/node-env-restore-component.test.mjs tests/node-config-ide.test.mjs tests/node-env-outcome.test.mjs tests/node-env-file.test.mjs tests/node-workspace-env.test.mjs`

이 변경 이후 전체 Next.js 빌드 또는 실제 설치 서비스/GUI 수용 검사는 아직 실행하지 않았다. 직전 359개 소스 빌드는 이 변경 이전 증거다. DEB 검증은 실행하지 않았다.
