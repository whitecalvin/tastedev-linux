# nginx 인증 API 적용·복원 연결 (2026-10-06)

`scripts/verification/nginx-helper-isolated.mjs --api`는 기존 helper 격리 검사를 실제 `lib/api.ts` 요청 처리기까지 확장한다. 임시 Better Auth 계정/세션을 생성하고 별도 localhost HTTP 서버에서 실제 요청 처리기를 호출한다. 패키지 경로의 helper와 런타임 manifest 검증을 거쳐 임시 nginx 설정을 변경하며 실제 nginx 응답도 확인한다.

격리 namespace에는 호스트 파일을 읽기 전용으로 연결하고, 임시 `/etc/nginx`, `/var`, 프로세스 및 네트워크를 사용한다. 호스트 sudo 정책·설정·서비스를 수정하지 않는다. sudo는 정확한 helper의 적용/복원 명령만 전달하는 격리 adapter이며, systemctl은 임시 nginx의 조회/reload adapter다. 실제 운영 sudo 권한이나 systemd 동작의 증거가 아니다. Next.js 컴파일 라우트 및 GUI까지 확인한 증거도 아니다.

검사 결과: `.runtime/verification/nginx-api-isolated-2026-10-05T22-58-48.087Z/result.json`, 11개 검사 그룹 PASS.

- 조회 전용 정책에서 인증된 적용/복원 HTTP 요청 403 및 파일 보존
- 인증 없음 401, 외부 Origin 403 및 파일 보존
- 이전 프로세스/설정 graph 검토의 적용 거부
- 실제 설정 적용 후 HTTP 응답 `before` → `after`
- 백업 복원 후 응답 `before` 및 원래 파일 내용 일치
- 잘못된 nginx 지시어의 변경 전 거부
- reload 실패 주입 후 파일 복원·원본 검수/reload 및 응답 유지
- helper 런타임 checksum 불일치의 변경 전 거부
- 감사 기록의 요청/완료/실패/롤백/차단 순서 및 설정·인증 정보 미포함

이 연결 검사에서 nginx 전체 설정 적용/복원의 정책 차단이 감사 기록에 포함되지 않는 누락을 보완했다. `lib/api.ts`의 차단 기록 대상에 두 작업을 추가했다. 관련 기존 요청/감사 검사 6개도 통과했다. 실행 후 임시 서버·nginx 프로세스·fixture를 정리했다.

운영 설치 환경의 실제 권한·서비스 제어, Next.js/GUI 적용·복원 전체 흐름은 남아 있다. DEB 검증은 수행하지 않았다.
