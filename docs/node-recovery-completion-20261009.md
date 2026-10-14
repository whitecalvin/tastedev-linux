# Node 서비스 복구 완료 후 이전 경고 정리

실제 103번 GUI 검수에서 원본 복구 완료 옆에 이전 업데이트의 알 수 없는 결과 경고가 남았다. NodeServiceRecovery가 실제 recovered=true 결과에서만 부모에게 완료를 알리도록 연결했다. NodeApps는 설정 변경 컴포넌트의 recoveryVersion을 갱신해 이전 오류/검토/확인을 첫 렌더부터 숨긴다. 복구 컴포넌트 자체는 유지하므로 완료 표시가 사라지지 않는다. 실패 복구는 완료로 알리지 않으며 콜백 오류도 완료 결과를 덮어쓰지 않는다.

실제 SWC 검사 18개와 부모 NodeApps 연결/기존 등록 검사 5개 성공. 보강된 부모 연결 검사 3개도 성공했으며 중복 합산하지 않는다. Next.js 현재 397개 소스 컴파일 성공: `.runtime/verification/source-build-2026-10-08T16-06-18.048Z/result.json`.

실제 NodeApps/Update/Recovery 컴포넌트를 사용하는 격리 fixture 응답에서 웹 설정 변경 오류→중단 조회→별도 복구 확인→완료 안내 유지와 이전 경고 제거를 직접 관찰했다. 브라우저 오류 0, 소스 3개 해시 대조, 자체 탭/서버/임시 환경 종료·정리. 자동 결과는 `.runtime/verification/node-recovery-completion-gui-2026-10-08T16-07-24.529Z/result.json`, 화면은 `.runtime/verification/node-recovery-completion-20261009.png`다.

이번 UI 수정 검수는 fixture 응답이며 실제 privileged helper/서비스 수용 검수를 반복하지 않았다. 직전 실제 helper 실패·SIGKILL·systemd/원본/한글 HTTP 보존 증거는 `docs/node-service-faults-original-gui-20261009.md`에 유지한다. 제품 전체 완료나 최종 배포로 확대하지 않는다.
