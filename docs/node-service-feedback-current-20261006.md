# Node.js 서비스 작업 이후 상태 갱신

서비스 시작·중지·재시작·자동 시작 켜기/끄기 버튼을 공통 테두리 없는 아이콘 버튼으로 변경했다. 각 버튼에 번역된 aria-label과 title을 제공하고 조회/편집 정책 및 기존 실행 확인 절차를 유지한다.

서비스 제어 성공 뒤 부모의 선택 앱 상태 조회를 기다리도록 연결했다. 상태 조회 결과의 앱 ID 및 registryVersion이 선택된 등록과 일치하는지 확인한다. 갱신 실패는 실제 서비스 작업 성공 결과를 지우지 않고 상태 조회 오류로 표시한다. API 연결 교체 뒤 이전 결과를 표시하지 않으며 이전 실행의 완료가 새 화면의 busy 상태를 해제하지 않는다.

관련 JSX 실행 검사 8개 통과: `node --test --test-isolation=none tests/node-service-completion-component.test.mjs tests/node-service-control-render.test.mjs tests/node-config-ide.test.mjs`.

검사에는 중복 실행 잠금, 비동기 상태 조회를 기다리는 동안 busy 유지, 성공 결과와 조회 오류 분리, API 교체 뒤 결과 폐기, 실제 작업 실패 시 조회 생략, 부모의 상태 갱신 및 다른 앱 ID 거부가 포함된다.

호스트 서비스를 제어하지 않았다. 실제 systemd/설치 장비 수용 검사 및 이 변경 이후 전체 Next.js 빌드는 아직 남아 있다. 직전 `/tmp/tastedev-current-build-KpfjL6`는 이 변경 이전 소스다. DEB 검증은 실행하지 않았다.
