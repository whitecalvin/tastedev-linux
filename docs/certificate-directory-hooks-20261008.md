# Certbot 갱신 hook 옵션과 실제 검수 · 2026-10-08

갱신 GUI에 `디렉터리 hook 실행` 스위치를 추가했다. 기존 동작을 유지하는 기본 켜짐이며 끄면 preview/helper 공통 명령에 `--no-directory-hooks`를 넣는다. 이 옵션은 전역 renewal-hooks만 제외하며 개별 인증서 pre/post hook은 계속 실행될 수 있음을 한국어로 안내한다. 값 변경 시 미리보기·최종 확인·동의를 제거하고 이전 핸들러 실행을 차단한다. 이 옵션은 인증서 발급 명령에는 전송하지 않는다.

설치 Certbot의 CLI 도움말에서 지원을 직접 확인했다. 관련 12개 검사 성공 (`.runtime/verification/certificate-directory-hooks-context-20261008.log`): boolean 검증/정확한 명령, UI 선택/완료 갱신, hook 변경 후 기존 승인 차단·새 preview 전송.

103번 eztoy.app은 저장된 nginx 인증/설치 방식을 사용한다. 개별 pre/post/renew hook은 없고 전역 실행 파일 두 개가 있었다. 승인된 테스트 도메인만 `renew --dry-run --cert-name eztoy.app --no-directory-hooks`로 테스트했다. verifier가 무인 실행·대기 생략 옵션을 추가했고, current certificate command module을 사용했다. GUI/인증 API/canonical helper 전체 실행은 아니다.

실제 ACME 호출은 `Unable to update challenge :: authorization must be pending` 오류, exitCode 1로 실패했다. 원인을 환경/DNS/사용 한도 등으로 단정하지 않는다. 실패 결과와 로그: `.runtime/verification/certificate-nginx-native-20261008T072709Z/result.json`. nginx graph는 전후 동일. 기존 인증서 및 갱신 파일 SHA-256 동일을 별도 재확인해 `certificate-preservation-followup.json`에 기록했다. private 전송물/설정 백업은 정리됐다. 발급/갱신 전체 성공으로 처리하지 않는다.

후속 verifier는 실패 시 인증서·갱신 파일 해시 변경까지 검사하고 미확인 변경이 있으면 private 증거를 보존하도록 보완했다. 이 verifier 보완 후 같은 ACME 요청을 반복하지 않았다.

공식 옵션 안내: https://eff-certbot.readthedocs.io/en/stable/using.html . 한국어 개발과 실제 ACME 오류 원인 확인·제품 GUI 수용은 계속 남는다.
