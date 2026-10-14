# HBA 적용 이후 비동기 갱신 처리 (2026-10-06)

공유 GUI 컴포넌트 44개 검사 통과 후, HBA 적용/중단 복구 패널에서 async `onApplied` callback을 기다리지 않는 연결 누락을 보완했다. 적용 응답을 먼저 보존하고 갱신 Promise를 await한다. 갱신 중 duplicate submit은 잠금으로 차단한다. 갱신 실패는 완료 결과와 별도 표시하며, 연결/입력 scope 변경 후 이전 callback의 실패는 표시하지 않는다. 부모 IDE의 HBA callback도 refresh를 await한다.

부모 갱신을 기다리게 하면서 기존 검사에서 파일 목록이 비었을 때 pending 초안 교체 확인이 남는 문제가 드러났다. config 패키지의 새 파일 목록이 비면 pending 확인만 정리하고 기존 편집 records는 삭제하지 않도록 수정했다. Certbot의 파일 없는 새 발급 초안에는 이 처리를 적용하지 않는다.

현재 관련 검사 6개 통과: HBA 컴포넌트 5개(새 async 갱신 실패 및 연결 변경 검사 2개 포함), 네 패키지 공유 IDE 렌더/갱신 검사 1개. JSX를 실제 Next SWC로 컴파일한 컴포넌트 검사이며 실제 운영 reload/helper 또는 전체 Next 빌드 증거는 아니다. 직전 전체 빌드는 이번 HBA 변경 이전 소스로 유지한다.

실행: `node --test --test-isolation=none tests/postgresql-hba-operation-component.test.mjs tests/package-config-ide-render.test.mjs`.
