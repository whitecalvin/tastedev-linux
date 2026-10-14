# Certbot 완료 후 목록 갱신 (2026-10-06)

인증서 작업 폴링 effect가 job의 status를 의존성으로 사용했다. 서버가 성공 상태를 반환하면 완료 로그를 표시하는 state 변경으로 effect cleanup이 실행되어, 이후 비동기 인증서/nginx 목록 조회가 cancelled로 처리될 수 있었다.

같은 immutable job ID의 상태 변경은 effect를 교체하지 않도록 수정했다. 연결·API·작업 ID 변경은 기존처럼 취소한다. 성공 작업의 목록 조회 실패는 작업 성공 로그와 구분하여 표시하고 terminal job을 무한 재조회하지 않는다. nginx 목록의 warning도 함께 표시한다.

새 회귀 검사 3개는 성공 state 렌더링을 목록 응답 사이에 실제로 수행하고, 이후 목록 반영·조회 실패 시 로그 유지 및 재폴링 없음·연결 변경 후 이전 목록 차단을 확인한다. 기존 ServerManager 검사 2개도 통과했다. 이전 테스트 fixture의 새 CertificateJobHistory import 누락을 보완했다. 실제 인증서 발급/갱신 또는 ACME 접속 검증은 수행하지 않았다.

검사: `node --test --test-isolation=none tests/certificate-completion-refresh.test.mjs tests/server-manager-component.test.mjs` (5개 통과).

같은 변경의 Next.js 소스 358개 빌드 통과: `.runtime/verification/source-build-2026-10-05T23-39-24.193Z/result.json`, 빌드 중 소스 변경 없음. 실제 브라우저·ACME 작업 전체 확인으로 확대 해석하지 않는다.
