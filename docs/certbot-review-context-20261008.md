# Certbot 검토와 실행 상태 연결 — 2026-10-08

인증서 입력·인증 방식·동의·정책·대상 탭이 변경되면 이전 렌더에서 저장한 실행 핸들러가 요청을 보내지 않도록 수정했다. 현재 실행 핸들러도 인증서 작업 권한, 검토 결과, 약관 동의와 최종 확인, 진행 중인 작업을 검사한다. 검토 요청 후 입력이 변경된 경우 늦게 도착한 이전 명령을 표시하지 않는다.

관련 검사 8개 성공: `server-manager-component`, `certbot-selection`, `certificate-completion-refresh`, `nginx-initial-ssr`. 로그: `.runtime/verification/certbot-review-context-20261008.log`.

nginx/webroot/standalone별 검토→이메일 변경→이전 확인 요청 차단→재검토→권한 해제 시 이전·현재 요청 차단→허용된 현재 입력으로 실행 payload를 확인했다. 늦은 검토 응답도 폐기한다. 테스트는 fixture API를 사용하므로 실제 ACME 발급·갱신 성공 증거가 아니다.

실제 개발 화면은 인증 방식 nginx, staging 기본값, 서버 인증서 변경 비허용 시 발급 비활성을 확인했다. 실제 발급과 서버 보안 설정 변경은 수행하지 않았다. 전체 완료와 최종 배포 검증은 별도다.

전체 회귀 후속: `.runtime/verification/regression-certbot-context-20261008.log`. 1361개 중 1359개 성공, 2개 실패. 실패는 기존 일본어·터키어 nginx 설명 누락이며 한국어 개발 우선 지시에 따라 다국어 단계로 남겨 둔다. 전체 PASS로 처리하지 않는다.
