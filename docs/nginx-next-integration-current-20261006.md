# 현재 Next.js nginx 적용·복원 연동 (2026-10-06)

최신 358개 소스의 운영 빌드를 별도 네트워크·프로세스·파일 namespace에서 실행했다. 실제 Next.js 로그인 라우트의 Better Auth 세션을 사용하여 설정 적용/복원 HTTP 요청이 패키지 경로 helper를 거쳐 임시 nginx를 변경하는 흐름을 확인했다.

증거:

- 빌드: `.runtime/verification/source-build-2026-10-05T23-02-50.998Z/result.json`, 소스 변경 없음, `/tmp/tastedev-current-build-K7ec4O`
- nginx Next.js 연결: `.runtime/verification/nginx-next-isolated-2026-10-05T23-03-11.983Z/result.json`, 12개 검사 그룹
- 같은 빌드의 일반 운영 HTTP: `.runtime/verification/production-http-2026-10-05T23-03-25.130Z/result.json`, 15개 검사 그룹

nginx 적용 후 실제 HTTP 응답 변경, 백업 복원 후 원본 응답/파일 일치, 잘못된 설정 거부, reload 실패 후 원본 검수·복구, 오래된 프로세스/graph 검토 거부, 런타임 checksum 오류, 조회 전용/미인증/외부 Origin 차단과 감사 결과를 확인했다. sudo 및 systemctl은 격리 환경 adapter이며 호스트 운영 정책·설정·서비스는 변경하지 않았다. 실제 sudo/systemd 환경 및 브라우저 GUI 조작의 증거가 아니다.

라우트 검토에서 `app/api/[action]/route.js`가 API 또는 worker가 이미 기록하는 운영 결과를 다시 `completed`로 기록하는 문제를 발견했다. 설치·인증서·터미널 등의 작업 접수 직후 조기 완료와 동기 작업 중복 완료가 생길 수 있어 해당 작업의 라우트 중복 기록을 제거했다. API에서 자체 기록하지 않는 파일/작업 폴더 작업의 라우트 기록은 유지한다. 새 라우트 소유권 검사와 기존 API/worker 검사 14개 통과.

일반 HTTP 검사에서는 실제 PTY 입력/출력 및 SSE 종료 결과에 대응하는 감사 기록이 정확히 `requested`, `completed` 한 번씩인지 확인했다. 로그인 세션의 실제 프로세스 재시작 유지·저장 세션 만료 후 11개 화면 이동·원래 query 복귀·로그아웃도 같은 빌드에서 확인했다.

처음 격리 Next.js 실행은 빌드의 절대 node_modules symlink 경로가 가려져 준비 단계에서 실패했다. 읽기 전용 원래 소스 경로를 격리 namespace에도 연결한 후 성공했다. 성공 증거는 위 최종 실행 결과다. 모든 임시 서버·nginx·fixture를 정리했다. 실제 apt 설치·ACME 발급·DEB 검증은 실행하지 않았다.
