# 열린 화면의 세션 만료와 재로그인 복귀

2026-10-06. 현재 소스 운영 빌드 `/tmp/tastedev-current-build-7hm3td`를 별도 임시 계정·인증 DB·localhost 서버에서 확인했다.

실제 브라우저에서 `/audit?filter=expiry-fixture`에 로그인한 뒤, 해당 임시 DB의 세션 만료 시각을 1.5초 뒤로 지정했다. 만료 이후 감사 기록 조회를 누르면 `/login?next=%2Faudit%3Ffilter%3Dexpiry-fixture`로 이동했다. 재로그인하면 원래 감사 경로와 query로 복귀했고, 다시 조회할 수 있었다. 이전 화면의 검색 입력 초안은 재로그인 후 비워졌다.

브라우저 관찰은 위 URL·화면·조회 동작 범위다. 자동 실행기는 임시 DB의 만료 지정과 재로그인 후 유효한 새 세션 존재를 확인했다. 실행기 결과만으로 GUI 전체를 자동 검증했다고 해석하지 않는다. 설치 환경의 장기간 세션 유지 검사는 별도 남아 있다.

- 실행기: `scripts/verification/session-expiry-gui.mjs`
- 자동 검사 증거: `.runtime/verification/session-expiry-gui-2026-10-06T01-26-11.522Z/result.json`
- 만료 후 로그인 화면: `/tmp/tastedev-session-expired-login-20261006.png`
- 재로그인 복귀 화면: `/tmp/tastedev-session-relogin-return-20261006.png`

검사 서버·브라우저 탭·임시 인증 저장소를 정리했다. 실제 사용자 계정과 개발 서버, 운영 서비스는 변경하지 않았다. AI 호출 및 배포 패키지 검사는 수행하지 않았다.
