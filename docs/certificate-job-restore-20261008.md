# Certbot 작업별 nginx 백업 복원 검토

2026-10-08. Certbot 작업 로그 팝업에 해당 작업에서 생성한 nginx 백업의 조회·선택·복원 검토 화면을 연결했다. 기존 nginx 복원 컴포넌트/검토/최종 확인/권한 검사를 재사용한다. Certbot 실행 권한으로 nginx 변경 권한을 부여하지 않는다.

`certificateJobBackups`는 알려진 로그 표시에서 지원 경로와 UUID를 추출하되 중복을 제거하고 충돌하는 ID·다른 경로·traversal을 제외한다. 후보 목록은 실제 helper가 조회한 백업 목록과 교집합으로 제한한다. 로그만으로 복원을 승인하지 않으며 실제 helper가 백업 대상/버전/include 문맥을 다시 검토한다. 일부 참조가 조회되지 않으면 안내하며 관련 없는 다른 작업 백업을 보여주지 않는다. 기존 백업 목록 API는 최대 100개이므로 오래된 작업이 목록에서 제외되는 제한은 남는다.

작업 선택 변경 시 keyed 복원 화면이 이전 상태를 버리고, 목록/정책 변경 시 검토를 초기화한다. 목록 조회/복원 검토 버튼은 테두리 없는 아이콘으로 제공하고 현재 파일과 백업이 동일하면 명시적으로 알린다.

검증:

- 관련 10개 검사 성공: 후보 경로/ID, 충돌 제외, 작업별 실제 목록 필터, 없는 백업 안내, 권한 분리, 저장 기록 선택 및 기존 nginx 복원 검사.
- 103번 현재 원래 Certbot GUI/인증 API/current helper에서 실제 nginx 백업 27개 생성 후 격리 Certbot 실패를 주입했다. ACME 요청 없음.
- Job `984b36dc-6f3c-482a-9956-f3895cb610fc`의 로그 팝업에서 실제 목록 27개가 해당 작업 ID와 정확히 일치하는 것을 확인했다.
- eztoy 백업 `5cfac206-aeb4-4c44-89d0-5d6b16fefca1` 선택 후 실제 native 복원 검토에서 include 검사 완료와 현재 설정 동일 안내를 확인했다. 설정 원문 비교는 끄고 복원은 실행하지 않았다.
- 실제 진행 의도 파일의 로그가 최종 작업 기록과 일치함을 확인했다. 실제 백업 27개 내용/해시가 원본과 일치했다. 현재 helper SHA는 전송 원문과 일치했다.
- 기존 nginx graph·renewal·fullchain 보존. 브라우저 오류/경고 0개와 로그아웃 이동 확인. 자체 서버·stage·계정·백업·fixture·SSH 터널·로컬 credential·탭 정리.
- 증거: `.runtime/verification/certificate-job-restore-gui-20261008/{source-manifest.json,gui-result.json,native-result.json,result.json,cleanup.json,browser-errors.json,restore-review.png}`.
- 현재 390개 소스 Next.js 빌드 성공/빌드 중 변경 없음/자체 빌드 정리. `.runtime/verification/source-build-2026-10-08T08-41-11.173Z/{result.json,build.log,source-snapshot.json,cleanup.json}`.

이번 결과는 실제 복원 검토 범위다. 신규 인증서 발급/TLS 변경·변경된 파일 실제 복원·중단 원래 GUI 흐름과 전체 제품은 진행 중이다. DEB 빌드/검증은 실행하지 않았다.
