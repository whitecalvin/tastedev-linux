# Certbot 실패 시 nginx 백업 기록 유지

2026-10-08. 추가 전송·GUI 검수 승인 범위에서 수정 및 103번 검수.

발급 executor가 성공 결과에만 백업 ID를 붙여, ACME 명령 실패나 백업 도중 오류 때 생성된 백업 정보를 작업 화면에 남기지 못했다. 현재는 각 백업의 파일 기록과 sync가 완료된 직후 경로와 ID만 helper stdout으로 전달한다. 설정 내용은 전달하지 않는다. 다음 파일 백업이나 ACME 실행보다 먼저 전달되며 최종 성공 결과에서 중복하지 않는다. 백업 도중 실패하면 이미 생성된 백업만 기록하고 ACME를 실행하지 않는다.

수정 파일: `lib/certificate-nginx-backup.mjs`, `lib/certificate-execution.ts`, `scripts/admin/linux-admin`. 기존 현재 작업 로그와 저장 작업 로그 팝업의 표시 기능을 그대로 사용한다.

검증:

- 관련 28개 검사 성공. 실제 private 파일 백업 후 ACME 오류, 두 번째 파일 백업 오류, 최종 graph 변경, 성공 시 중복 제거, runtime closure 포함.
- 별도 canonical helper dispatch 검사 성공. 현재 executor·helper 출력·UTF-8 byte 분할 collector·GUI formatter를 연결해 성공/ACME 오류/부분 백업 오류를 검증했다. OS 경계만 fixture로 대체했다.
- 103번 원래 Certbot GUI → 실제 인증 API → 현재 canonical helper → 실제 nginx 파일 27개 백업 → 주입된 Certbot DNS 실패를 확인했다. 현재 로그와 저장 작업 로그 팝업 모두 27개 백업 경로·ID와 한국어 실패 안내를 표시했다.
- Job `130c280d-74a7-4a94-ab1d-f710cbb7eb8e`: 2026-10-08T08:14:46.673Z 시작, 08:14:47.644Z 종료, 작업 상태 failed / exit 1. 의도한 실패이며 검수 결과는 해당 실패 처리 범위의 PASS다.
- helper SHA-256 `d592369b5ff7a4d9e7faea306bf602fd9911339777f8a6e307904a7c22d7b06e`. 전송 source manifest와 자식 namespace의 실제 helper 일치 확인.
- 생성된 27개 백업의 text/해시와 현재 원본 일치 확인. 기존 nginx graph, eztoy.app renewal 파일과 fullchain 해시 보존.
- Certbot 실행 파일만 자식 mount namespace에서 실패 shim으로 연결했다. 호스트 Certbot과 helper는 변경하지 않았고 ACME 요청은 없다. 실제 CA DNS 실패나 신규 발급 성공을 검증했다고 주장하지 않는다.
- 브라우저 오류/경고 0개, 로그아웃 로그인 이동 확인. 자체 서버·계정·백업·shim·SSH 터널·로컬 임시 credential·검수 탭 정리.

증거: `.runtime/verification/certificate-backup-failure-gui-20261008/{source-manifest.json,native-result.json,cleanup.json,history-failure.png}`. 검수 도구에 `--native-issue-failure`를 추가했다. `--native-renew`와 함께 지정할 수 없다.

원격 web.log 원문 출력은 자동 승인 검토에서 요청·인증 정보 노출 가능성으로 거부됐다. 원문 전송을 수행하지 않았으며, 백업 metadata/hash·격리 경로·GUI 표시 결과로 검수를 완료했다.

전체 제품은 진행 중이다. 이번 결과는 Certbot 실패 백업 기록의 유지 범위이며 신규 발급/TLS 변경·실제 설정 복원·웹 프로세스 강제 종료 시 진행 로그 영속화·긴 native JSON 로그 수집은 별도 남는다. DEB 빌드/검증은 실행하지 않았다.
