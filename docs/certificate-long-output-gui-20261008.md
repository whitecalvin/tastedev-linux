# Certbot 긴 출력의 실제 GUI 수용

2026-10-08. 추가 전송·GUI 검수 승인에 따라 현재 앱/수집기와 canonical helper를 103번 임시 경로에 전송했다. 전송 파일 SHA-256은 `source-manifest.json`에 보존했다.

원래 Certbot GUI에서 eztoy.app 선택 → directory hooks 끄기 → 명령 검토 → 검수 확인 → 갱신 테스트 실행 → 현재 결과 → 저장 작업 로그 팝업을 확인했다. 실제 인증 API와 현재 helper를 사용했으며 Certbot 실행 파일만 자식 mount namespace의 전용 출력 fixture로 대체했다. fixture는 eztoy.app `renew --dry-run`만 허용하고 한글·이모지·셸 JSON 문자열 1,600줄과 종료 표식을 출력한다. ACME 요청이나 실제 갱신 성공을 검증한 결과가 아니다.

결과:

- 현재 화면과 저장 팝업 모두 첫 줄 0000과 마지막 줄 1599, 종료 표식, 셸이 출력한 JSON 문자열을 보존했다.
- UTF-8 출력 113,637 bytes, 저장 11행. fixture 생성 문자열·실제 저장 기록·GUI의 표시 문자열 SHA-256이 모두 `6eba9b357d75f62d71612ba222ae261980858e59cc94428a4d07308b683a3c9b`로 일치했다.
- Job `c1bf8dbc-9ab5-49af-8a9b-c93ddd7a3863`, exit 0. helper SHA-256 `d592369b5ff7a4d9e7faea306bf602fd9911339777f8a6e307904a7c22d7b06e`와 전송 source 일치 확인.
- 팝업 내부 스크롤을 마지막 줄까지 이동해 종료 표식을 실제 화면으로 확인했다.
- 기존 nginx graph·eztoy.app renewal 파일·fullchain hash 보존, 호스트 Certbot/helper 변경 없음.
- 로그아웃 로그인 이동, 브라우저 오류/경고 0개. 자체 서버·stage·계정·fixture·SSH 터널·로컬 임시 credential·검수 탭 정리.

증거: `.runtime/verification/certificate-long-output-gui-20261008/{source-manifest.json,native-result.json,gui-result.json,result.json,cleanup.json,browser-errors.json,history-end.png}`.

검수 도구 `scripts/verification/certificate-original-gui.py`에 `--native-renew-output`을 추가했다. native renew/issue failure/output 옵션은 서로 배타적이다. 출력 fixture는 운영 실행 경로에 추가하지 않았다.

이 결과는 긴 작업 결과의 수집·저장·GUI 표시를 입증한다. 신규 인증서 발급/TLS 변경·설정 복원·강제 종료 중 진행 로그 영속화와 전체 제품은 진행 중이다. DEB 빌드/검증은 실행하지 않았다.
