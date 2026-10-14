# 설치 모드 GUI 세션 갱신

103번의 자체 Docker·표식·단일 테스트 로그인 세션만 사용했다. 현재 399개 소스 원래 GUI/Better Auth를 설치 모드로 실행했다. 이미 열어 둔 보안 GUI의 테스트 세션 DB만 25시간 경과 상태로 조정하고, 일반 GUI 활동 후 만료 시간이 `2026-10-15T17:36:11.741Z`로 갱신됨을 독립 native DB 읽기로 확인했다. 페이지 이동·새 로그인 없이 원래 sudo 규칙 미리보기가 유지됐고 브라우저 오류는 0개였다.

관찰 스크립트가 최초 numeric expiresAt만 가정하여 갱신 뒤 ISO 문자열에서 종료 1이 발생했다. 제품 인증 실패로 해석하지 않는다. 실패 기록을 보존하고 테스트 세션을 다시 조정하지 않은 직접 읽기에서 최초 만료 시각보다 연장되고 현재보다 6일 이상 남았음을 확인했다. 증거는 `.runtime/verification/sudo-enable-original-gui-20261009/session-renewal-native.json` 및 `session-observer-format-failure.json`이다.

이 결과는 경과 시간을 조정한 설치 모드 세션의 실제 GUI 갱신이다. 실제 며칠간의 경과·설치 Tauri 전체 흐름·HTTPS 브라우저 수용을 증명하지 않는다. sudo NOPASSWD 최종 적용은 별도 사용자 승인 대기다. 검수 컨테이너·탭·터널은 그 미리보기 승인을 위해 유지하고 승인 후 검수 종료 시 정리해야 한다.
